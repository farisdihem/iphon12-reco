// =========================================================================
// NexusLink Pro Engine - Native Low-Latency Audio Core (WASAPI & Opus)
// File: src-tauri/src/audio.rs
// =========================================================================

use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::{SampleFormat, Stream, StreamConfig};
use opus::{Application, Decoder, Encoder};
use ringbuf::HeapRb;
use std::collections::BTreeMap;
use std::sync::atomic::{AtomicU32, AtomicU64, Ordering};
use std::sync::Arc;
use parking_lot::Mutex;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AudioQualityProfile {
    Auto,
    HighQuality,
    LowLatency,
}

#[derive(Debug, Clone)]
pub struct AudioFramePacket {
    pub sequence: u32,
    pub timestamp_ms: u64,
    pub sample_rate: u32,
    pub channels: u8,
    pub codec: u8, // 0 = PCM Int16, 1 = Opus
    pub payload: Vec<u8>,
}

impl AudioFramePacket {
    /// Deserializes 21-byte header binary audio frame sent over QUIC from iOS
    /// [0]: 0x41 ('A')
    /// [1..4]: sequence (u32 BE)
    /// [5..12]: timestamp (u64 BE)
    /// [13..16]: sample_rate (u32 BE)
    /// [17]: channels (u8)
    /// [18]: codec (u8)
    /// [19..20]: payload_len (u16 BE)
    /// [21..]: payload
    pub fn parse_binary(data: &[u8]) -> Result<Self, String> {
        if data.len() < 21 {
            return Err("Packet too short for audio header".into());
        }
        if data[0] != 0x41 {
            return Err("Invalid audio packet magic byte".into());
        }

        let sequence = u32::from_be_bytes([data[1], data[2], data[3], data[4]]);
        let timestamp_ms = u64::from_be_bytes([
            data[5], data[6], data[7], data[8],
            data[9], data[10], data[11], data[12],
        ]);
        let sample_rate = u32::from_be_bytes([data[13], data[14], data[15], data[16]]);
        let channels = data[17];
        let codec = data[18];
        let payload_len = u16::from_be_bytes([data[19], data[20]]) as usize;

        if data.len() < 21 + payload_len {
            return Err("Truncated audio packet payload".into());
        }

        Ok(Self {
            sequence,
            timestamp_ms,
            sample_rate,
            channels,
            codec,
            payload: data[21..21 + payload_len].to_vec(),
        })
    }
}

pub struct JitterBuffer {
    buffer: BTreeMap<u32, AudioFramePacket>,
    next_expected_seq: u32,
    target_depth_ms: u32,
    last_received_ms: u64,
    packets_lost: u32,
    late_packets_dropped: u32,
}

impl JitterBuffer {
    pub fn new(target_depth_ms: u32) -> Self {
        Self {
            buffer: BTreeMap::new(),
            next_expected_seq: 0,
            target_depth_ms,
            last_received_ms: 0,
            packets_lost: 0,
            late_packets_dropped: 0,
        }
    }

    pub fn push(&mut self, packet: AudioFramePacket) {
        if self.next_expected_seq == 0 {
            self.next_expected_seq = packet.sequence;
        }

        if packet.sequence < self.next_expected_seq {
            self.late_packets_dropped += 1;
            return; // Late packet dropped
        }

        self.last_received_ms = packet.timestamp_ms;
        self.buffer.insert(packet.sequence, packet);

        // Cap jitter buffer size (~20 frames = ~200-400ms max safety limit)
        while self.buffer.len() > 20 {
            let first_key = *self.buffer.keys().next().unwrap();
            self.buffer.remove(&first_key);
            self.next_expected_seq = first_key + 1;
        }
    }

    pub fn pop_next(&mut self) -> Option<AudioFramePacket> {
        if let Some(pkt) = self.buffer.remove(&self.next_expected_seq) {
            self.next_expected_seq += 1;
            Some(pkt)
        } else if !self.buffer.is_empty() {
            // Sequence gap detected -> Increment loss count and skip to next available frame
            self.packets_lost += 1;
            let next_key = *self.buffer.keys().next().unwrap();
            self.next_expected_seq = next_key;
            self.buffer.remove(&next_key)
        } else {
            None
        }
    }
}

#[derive(Default)]
pub struct PipelineMetrics {
    pub capture_latency_ms: AtomicU32,
    pub network_latency_ms: AtomicU32,
    pub jitter_ms: AtomicU32,
    pub decode_latency_ms: AtomicU32,
    pub output_latency_ms: AtomicU32,
    pub end_to_end_latency_ms: AtomicU32,
    pub packets_processed: AtomicU64,
}

pub struct WasapiAudioOutput {
    _stream: Option<Stream>,
    ring_producer: ringbuf::Producer<f32, Arc<HeapRb<f32>>>,
}

impl WasapiAudioOutput {
    pub fn new(sample_rate: u32, channels: u16) -> Result<Self, String> {
        let host = cpal::default_host();
        let device = host
            .default_output_device()
            .ok_or_else(|| "No default WASAPI/CPAL output device found".to_string())?;

        let config = StreamConfig {
            channels,
            sample_rate: cpal::SampleRate(sample_rate),
            buffer_size: cpal::BufferSize::Default,
        };

        let rb = HeapRb::<f32>::new(19200); // ~200ms buffer capacity at 48kHz stereo
        let (producer, mut consumer) = rb.split();

        let err_fn = |err| eprintln!("[WASAPI Audio Output] CPAL stream error: {}", err);

        let stream = device
            .build_output_stream(
                &config,
                move |data: &mut [f32], _: &cpal::OutputCallbackInfo| {
                    for sample in data.iter_mut() {
                        *sample = consumer.pop().unwrap_or(0.0);
                    }
                },
                err_fn,
                None,
            )
            .map_err(|e| format!("Failed to build WASAPI output stream: {}", e))?;

        stream.play().map_err(|e| format!("Failed to play WASAPI stream: {}", e))?;

        Ok(Self {
            _stream: Some(stream),
            ring_producer: producer,
        })
    }

    pub fn write_pcm_i16(&mut self, pcm_samples: &[i16]) {
        for &sample in pcm_samples {
            let float_sample = (sample as f32) / 32768.0;
            let _ = self.ring_producer.push(float_sample);
        }
    }
}

pub struct AudioEngine {
    sample_rate: u32,
    channels: u16,
    profile: AudioQualityProfile,
    encoder: Mutex<Encoder>,
    decoder: Mutex<Decoder>,
    jitter_buffer: Mutex<JitterBuffer>,
    wasapi_output: Option<WasapiAudioOutput>,
    pub metrics: Arc<PipelineMetrics>,
}

impl AudioEngine {
    pub fn new(sample_rate: u32, profile: AudioQualityProfile) -> Result<Self, String> {
        let encoder = Encoder::new(sample_rate, opus::Channels::Stereo, Application::LowDelay)
            .map_err(|e| format!("Opus Encoder Init Error: {}", e))?;
        let decoder = Decoder::new(sample_rate, opus::Channels::Stereo)
            .map_err(|e| format!("Opus Decoder Init Error: {}", e))?;

        let wasapi_output = WasapiAudioOutput::new(sample_rate, 2).ok();

        Ok(Self {
            sample_rate,
            channels: 2,
            profile,
            encoder: Mutex::new(encoder),
            decoder: Mutex::new(decoder),
            jitter_buffer: Mutex::new(JitterBuffer::new(15)),
            wasapi_output,
            metrics: Arc::new(PipelineMetrics::default()),
        })
    }

    pub fn process_incoming_raw_packet(&mut self, raw_bytes: &[u8]) -> Result<(), String> {
        let packet = AudioFramePacket::parse_binary(raw_bytes)?;
        let mut jb = self.jitter_buffer.lock();
        jb.push(packet);

        // Process frames in jitter buffer
        while let Some(pkt) = jb.pop_next() {
            let pcm_i16 = if pkt.codec == 1 {
                // Opus decoding with packet loss concealment (PLC)
                let mut pcm_out = vec![0i16; 960 * 2];
                let mut dec = self.decoder.lock();
                match dec.decode(&pkt.payload, &mut pcm_out, false) {
                    Ok(count) => {
                        pcm_out.truncate(count * 2);
                        pcm_out
                    }
                    Err(_) => vec![],
                }
            } else {
                // Native PCM Int16 payload
                pkt.payload
                    .chunks_exact(2)
                    .map(|chunk| i16::from_le_bytes([chunk[0], chunk[1]]))
                    .collect()
            };

            if let Some(ref mut output) = self.wasapi_output {
                output.write_pcm_i16(&pcm_i16);
            }

            self.metrics.packets_processed.fetch_add(1, Ordering::Relaxed);
        }

        Ok(())
    }

    /// Internal Audio Loop Test Mode for Developer Diagnostic Verification
    pub fn run_internal_audio_loop_test(&mut self) -> Result<String, String> {
        // Test 1: Encoder & Decoder Initialization
        let mut test_pcm = vec![0i16; 960 * 2];
        for i in 0..test_pcm.len() {
            test_pcm[i] = ((i as f32 * 0.1).sin() * 16000.0) as i16;
        }

        let mut enc = self.encoder.lock();
        let mut encoded = vec![0u8; 1000];
        let encoded_bytes = enc
            .encode(&test_pcm, &mut encoded)
            .map_err(|e| format!("Opus Encode Test Failed: {}", e))?;
        encoded.truncate(encoded_bytes);

        let mut dec = self.decoder.lock();
        let mut decoded_pcm = vec![0i16; 960 * 2];
        let decoded_count = dec
            .decode(&encoded, &mut decoded_pcm, false)
            .map_err(|e| format!("Opus Decode Test Failed: {}", e))?;

        if decoded_count == 0 {
            return Err("Opus Decoded 0 samples".into());
        }

        // Test 2: Binary framing roundtrip
        let packet = AudioFramePacket {
            sequence: 1001,
            timestamp_ms: 1000,
            sample_rate: 48000,
            channels: 2,
            codec: 1,
            payload: encoded,
        };

        let mut binary_frame = vec![0x41];
        binary_frame.extend_from_slice(&packet.sequence.to_be_bytes());
        binary_frame.extend_from_slice(&packet.timestamp_ms.to_be_bytes());
        binary_frame.extend_from_slice(&packet.sample_rate.to_be_bytes());
        binary_frame.push(packet.channels);
        binary_frame.push(packet.codec);
        binary_frame.extend_from_slice(&(packet.payload.len() as u16).to_be_bytes());
        binary_frame.extend_from_slice(&packet.payload);

        let parsed = AudioFramePacket::parse_binary(&binary_frame)?;
        if parsed.sequence != 1001 || parsed.codec != 1 {
            return Err("Binary audio framing verification failed".into());
        }

        let wasapi_status = if self.wasapi_output.is_some() {
            "WASAPI/CPAL Stream Active"
        } else {
            "WASAPI/CPAL Stream Headless Mode"
        };

        Ok(format!(
            "AUDIO LOOP TEST RESULTS:\n- Opus Encoder: PASS\n- Opus Decoder: PASS\n- Binary Framing: PASS\n- Output Pipeline: {}\n- Hardware Verification: NOT HARDWARE VERIFIED (Cloud Run)",
            wasapi_status
        ))
    }
}
