// =========================================================================
// NexusLink Pro Engine - Performance Optimization Module
// File: src-tauri/src/optimization.rs
// =========================================================================

use std::sync::Arc;
use parking_lot::RwLock;

/// إعدادات الأداء القابلة للتعديل ديناميكياً
#[derive(Debug, Clone)]
pub struct PerformanceConfig {
    pub video_codec: VideoCodec,
    pub video_bitrate_mbps: u32,
    pub video_resolution: VideoResolution,
    pub video_fps: u32,
    pub audio_sample_rate: u32,
    pub audio_bitrate_kbps: u32,
    pub jitter_buffer_ms: u32,
    pub max_packet_size: usize,
    pub use_bbr: bool,
    pub use_usb_transport: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum VideoCodec {
    H264,
    HEVC, // H.265 - أفضل بنسبة 50%
    AV1,  // مستقبلي
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum VideoResolution {
    HD1080p,
    QHD1440p,
    UHD4K,
}

impl Default for PerformanceConfig {
    fn default() -> Self {
        Self {
            video_codec: VideoCodec::HEVC,
            video_bitrate_mbps: 20, // 4K @ 20Mbps
            video_resolution: VideoResolution::UHD4K,
            video_fps: 60,
            audio_sample_rate: 48000,
            audio_bitrate_kbps: 128,
            jitter_buffer_ms: 5,
            max_packet_size: 1400, // MTU-safe
            use_bbr: true,
            use_usb_transport: false,
        }
    }
}

/// محرك التحسين الديناميكي
pub struct OptimizationEngine {
    config: Arc<RwLock<PerformanceConfig>>,
    network_quality_score: RwLock<f32>, // 0.0 - 1.0
}

impl OptimizationEngine {
    pub fn new() -> Self {
        Self {
            config: Arc::new(RwLock::new(PerformanceConfig::default())),
            network_quality_score: RwLock::new(1.0),
        }
    }

    /// تكييف الإعدادات تلقائياً بناءً على جودة الشبكة
    pub fn adapt_to_network_conditions(&self, latency_ms: f32, packet_loss: f32, throughput_mbps: f32) {
        let mut config = self.config.write();
        let mut quality_score = self.network_quality_score.write();

        // حساب درجة جودة الشبكة
        *quality_score = calculate_network_score(latency_ms, packet_loss, throughput_mbps);

        if *quality_score < 0.5 {
            // شبكة ضعيفة - خفض الجودة
            config.video_bitrate_mbps = (config.video_bitrate_mbps as f32 * 0.7) as u32;
            config.jitter_buffer_ms = 15;
            if config.video_resolution == VideoResolution::UHD4K {
                config.video_resolution = VideoResolution::QHD1440p;
            }
        } else if *quality_score > 0.9 {
            // شبكة ممتازة - رفع الجودة
            config.video_bitrate_mbps = 25; // 4K High Quality
            config.jitter_buffer_ms = 3;
            config.video_resolution = VideoResolution::UHD4K;
            config.video_fps = 60;
        }

        println!(
            "[OPTIMIZATION] Network Score: {:.2}, Bitrate: {}Mbps, Resolution: {:?}, Jitter: {}ms",
            *quality_score, config.video_bitrate_mbps, config.video_resolution, config.jitter_buffer_ms
        );
    }

    /// التبديل إلى وضع USB عند التوفر
    pub fn enable_usb_mode(&self) {
        let mut config = self.config.write();
        config.use_usb_transport = true;
        config.jitter_buffer_ms = 2; // أقل كمون مع USB
        println!("[OPTIMIZATION] USB Transport Mode ENABLED - Ultra Low Latency");
    }

    /// التبديل إلى وضع Wi-Fi 6E
    pub fn enable_wifi6e_mode(&self) {
        let mut config = self.config.write();
        config.use_usb_transport = false;
        config.max_packet_size = 1500; // MTU كامل
        config.video_bitrate_mbps = 30; // Wi-Fi 6E يدعم معدلات أعلى
        println!("[OPTIMIZATION] Wi-Fi 6E Mode ENABLED - High Throughput");
    }

    pub fn get_config(&self) -> PerformanceConfig {
        self.config.read().clone()
    }
}

fn calculate_network_score(latency_ms: f32, packet_loss: f32, throughput_mbps: f32) -> f32 {
    let latency_score = (100.0 - latency_ms.min(100.0)) / 100.0;
    let loss_score = 1.0 - packet_loss.min(1.0);
    let throughput_score = (throughput_mbps / 50.0).min(1.0); // 50Mbps = مثالي

    (latency_score * 0.4) + (loss_score * 0.4) + (throughput_score * 0.2)
}

// دالة مساعدة لضبط إعدادات QUIC المثلى
pub fn configure_quic_for_video(transport_config: &mut quinn::TransportConfig, config: &PerformanceConfig) {
    use quinn::{MtuDiscoveryConfig, VarInt};

    // ضبط عدد الـ Streams
    transport_config.max_concurrent_bidi_streams(VarInt::from_u32(100));
    transport_config.max_concurrent_uni_streams(VarInt::from_u32(500));

    // Buffers كبيرة للفيديو
    let buffer_size = match config.video_resolution {
        VideoResolution::UHD4K => 4 * 1024 * 1024, // 4MB
        VideoResolution::QHD1440p => 2 * 1024 * 1024, // 2MB
        VideoResolution::HD1080p => 1 * 1024 * 1024, // 1MB
    };

    transport_config.datagram_receive_buffer_size(Some(buffer_size));
    transport_config.datagram_send_buffer_size(buffer_size);

    // ضبط MTU
    transport_config.max_udp_payload_size(VarInt::from_u32(config.max_packet_size as u32));

    // تفعيل MTU Discovery
    if config.use_bbr {
        let mut mtu_discovery = MtuDiscoveryConfig::default();
        mtu_discovery.black_hole_cooldown(std::time::Duration::from_secs(120));
        mtu_discovery.interval(std::time::Duration::from_secs(60));
        transport_config.mtu_discovery_config(Some(mtu_discovery));
    }

    println!("[QUIC] Configured for {:?} @ {}Mbps with {}MB buffers", 
             config.video_resolution, config.video_bitrate_mbps, buffer_size / (1024 * 1024));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_network_adaptation() {
        let engine = OptimizationEngine::new();
        
        // محاكاة شبكة ممتازة
        engine.adapt_to_network_conditions(2.0, 0.001, 100.0);
        let config = engine.get_config();
        assert_eq!(config.jitter_buffer_ms, 3);
        assert_eq!(config.video_bitrate_mbps, 25);

        // محاكاة شبكة ضعيفة
        engine.adapt_to_network_conditions(80.0, 0.05, 10.0);
        let config = engine.get_config();
        assert!(config.jitter_buffer_ms >= 15);
        assert!(config.video_bitrate_mbps < 20);
    }

    #[test]
    fn test_usb_mode() {
        let engine = OptimizationEngine::new();
        engine.enable_usb_mode();
        let config = engine.get_config();
        assert!(config.use_usb_transport);
        assert_eq!(config.jitter_buffer_ms, 2);
    }
}
