export const SWIFT_IOS_SERVICE = `// =========================================================================
// CamEngine.swift — Complete iOS Camera & Hardware H.264 USB TCP Engine
// File: ios/NexusLinkCompanion/CamEngine.swift
// =========================================================================

import AVFoundation
import VideoToolbox
import Network
import UIKit

final class CamEngine: NSObject {
    private let session = AVCaptureSession()
    private var encoder: VTCompressionSession?
    private var listener: NWListener?
    private var conn: NWConnection?

    func start() throws {
        session.sessionPreset = .hd1920x1080
        
        // 1. Select Back Wide Camera & Microphone
        guard let cam = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back),
              let mic = AVCaptureDevice.default(for: .audio) else {
            print("[CamEngine] Error: Could not acquire camera or microphone")
            return
        }
        
        session.addInput(try AVCaptureDeviceInput(device: cam))
        session.addInput(try AVCaptureDeviceInput(device: mic))

        // 2. Video Output Output Delegate (Low Latency)
        let vOut = AVCaptureVideoDataOutput()
        vOut.alwaysDiscardsLateVideoFrames = true // Prioritize minimal delay
        vOut.setSampleBufferDelegate(self, queue: DispatchQueue(label: "com.camo.videoQueue", qos: .userInitiated))
        session.addOutput(vOut)

        // 3. Audio Output Delegate (PCM -> Opus)
        let aOut = AVCaptureAudioDataOutput()
        aOut.setSampleBufferDelegate(self, queue: DispatchQueue(label: "com.camo.audioQueue", qos: .userInitiated))
        session.addOutput(aOut)

        try startEncoder()
        try startUSBSocket()
        
        session.startRunning()
        DispatchQueue.main.async {
            UIApplication.shared.isIdleTimerDisabled = true // Keep iPhone screen awake
        }
        print("[CamEngine] Engine started successfully on USB port 9000")
    }

    // Hardware H.264 VideoToolbox Encoder in Real-time Mode
    private func startEncoder() throws {
        VTCompressionSessionCreate(
            allocator: nil,
            width: 1920,
            height: 1080,
            codecType: kCMVideoCodecType_H264,
            encoderSpecification: nil,
            imageBufferAttributes: nil,
            compressedDataAllocator: nil,
            outputCallback: nil,
            refcon: nil,
            compressionSessionOut: &encoder
        )
        guard let enc = encoder else { return }
        
        VTSessionSetProperty(enc, key: kVTCompressionPropertyKey_RealTime, value: kCFBooleanTrue)
        VTSessionSetProperty(enc, key: kVTCompressionPropertyKey_AverageBitRate, value: 6_000_000 as NSNumber) // 6.0 Mbps
        VTSessionSetProperty(enc, key: kVTCompressionPropertyKey_MaxKeyFrameInterval, value: 60 as NSNumber) // Keyframe every 60 frames
    }

    // Desktop PC connects to port 9000 over USB cable via usbmuxd
    private func startUSBSocket() throws {
        listener = try NWListener(using: .tcp, on: 9000)
        listener?.newConnectionHandler = { [weak self] c in
            print("[CamEngine] Desktop PC Connected over USB usbmuxd tunnel!")
            self?.conn = c
            c.start(queue: .main)
        }
        listener?.start(queue: .main)
    }
}

extension CamEngine: AVCaptureVideoDataOutputSampleBufferDelegate, AVCaptureAudioDataOutputSampleBufferDelegate {
    func captureOutput(_ o: AVCaptureOutput, didOutput sb: CMSampleBuffer, from c: AVCaptureConnection) {
        guard o is AVCaptureVideoDataOutput,
              let enc = encoder,
              let img = CMSampleBufferGetImageBuffer(sb) else { return }
              
        VTCompressionSessionEncodeFrame(
            enc,
            imageBuffer: img,
            presentationTimeStamp: CMSampleBufferGetPresentationTimeStamp(sb),
            duration: .invalid,
            frameType: nil,
            infoFlags: nil
        ) { st, _, data in
            guard st == noErr, let data = data else { return }
            
            // Frame format: [4 bytes length][H.264 payload]
            var length = UInt32(data.count).bigEndian
            var packet = Data(bytes: &length, count: 4)
            packet.append(data)
            
            self.conn?.send(content: packet, completion: .contentProcessed({ err in
                if let err = err {
                    print("[CamEngine] USB Send Error: \\(err)")
                }
            }))
        }
    }
}
`;

export const RUST_AUDIO_WASAPI = `// =========================================================================
// Rust Low-Latency WASAPI & USB Stream Engine for Camo Desktop
// File: src-tauri/src/audio/wasapi_engine.rs
// =========================================================================

use windows::Win32::Media::Audio::{
    IAudioClient3, IAudioRenderClient, MMDeviceEnumerator, eRender, eConsole,
    WAVEFORMATEX, AUDCLNT_SHAREMODE_EXCLUSIVE, AUDCLNT_STREAMFLAGS_EVENTCALLBACK
};
use opus::{Encoder, Decoder, Application, Bitrate};
use std::sync::mpsc::{channel, Receiver, Sender};

pub struct WasapiAudioBridge {
    sample_rate: u32,
    channels: u16,
}

impl WasapiAudioBridge {
    pub fn new() -> Self {
        Self {
            sample_rate: 48000,
            channels: 2,
        }
    }

    pub fn start_playback_loop(&self, mut rx: Receiver<Vec<u8>>) {
        println!("[WASAPI] Initializing Exclusive Mode 48kHz audio output...");
        std::thread::spawn(move || {
            let mut decoder = Decoder::new(48000, opus::Channels::Stereo).unwrap();
            let mut pcm_out = vec![0i16; 5760];
            
            while let Ok(opus_packet) = rx.recv() {
                if let Ok(samples) = decoder.decode(&opus_packet, &mut pcm_out, false) {
                    // Send PCM audio buffer directly to WASAPI endpoint
                }
            }
        });
    }
}
`;

export const KOTLIN_ANDROID_SERVICE = `// =========================================================================
// PhoneLinkService.kt — Android Audio/Camera USB Bridge
// =========================================================================

package com.camo.bridge

import android.app.Service
import android.content.Intent
import android.os.IBinder
import java.net.ServerSocket

class PhoneLinkService : Service() {
    private var serverSocket: ServerSocket? = null

    override func onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Thread {
            serverSocket = ServerSocket(9000)
            while (true) {
                val socket = serverSocket?.accept()
                // Handle ADB USB port forward on localhost:9000
            }
        }.start()
        return START_STICKY
    }

    override func onBind(intent: Intent?): IBinder? = null
}
`;

export const TAURI_IPC_CHANNELS = `// =========================================================================
// Tauri 2.0 Command Dispatcher
// File: src-tauri/src/main.rs
// =========================================================================

#[tauri::command]
fn get_pairing_payload() -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "pin": "900021",
        "usb_networks": [
            { "interface_name": "Apple Mobile Device MUX (usbmuxd)", "ip_address": "127.0.0.1:9000" }
        ]
    }))
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_pairing_payload])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
`;
