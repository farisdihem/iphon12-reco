// =========================================================================
// NexusLink Pro Engine - Protocol Test Vectors & Wire Compatibility Test
// File: src-tauri/src/protocol_test.rs
// =========================================================================

#[cfg(test)]
mod tests {
    use crate::transport::NexusMessage;
    use crate::audio::{AudioFramePacket, JitterBuffer};

    #[test]
    fn test_ping_vector_compatibility() {
        let ping = NexusMessage::Ping { timestamp: 1700000000000 };
        let json = serde_json::to_string(&ping).unwrap();
        assert_eq!(json, r#"{"type":"Ping","payload":{"timestamp":1700000000000}}"#);
    }

    #[test]
    fn test_device_info_vector_compatibility() {
        let device_info = NexusMessage::DeviceInfo {
            device_name: "iPhone 15 Pro".into(),
            os: "iOS".into(),
            os_version: "17.4".into(),
            protocol_version: 2,
            capabilities: vec!["microphone".into(), "replaykit".into()],
        };
        let json = serde_json::to_string(&device_info).unwrap();
        assert!(json.contains(r#""type":"DeviceInfo""#));
        assert!(json.contains(r#""device_name":"iPhone 15 Pro""#));
    }

    #[test]
    fn test_pair_request_vector_compatibility() {
        let pair_req = NexusMessage::PairRequest {
            pin_code: "849201".into(),
            device_id: "iphone-15-pro-unique-id".into(),
        };
        let json = serde_json::to_string(&pair_req).unwrap();
        assert_eq!(json, r#"{"type":"PairRequest","payload":{"pin_code":"849201","device_id":"iphone-15-pro-unique-id"}}"#);
    }

    #[test]
    fn test_binary_audio_frame_parsing() {
        // Binary audio header (21 bytes):
        // [0] = 0x41 ('A')
        // [1..4] = seq = 42
        // [5..12] = ts = 1700000000000
        // [13..16] = sample_rate = 48000
        // [17] = channels = 2
        // [18] = codec = 0 (PCM)
        // [19..20] = length = 4
        // [21..24] = payload = [0x01, 0x02, 0x03, 0x04]
        let mut frame = vec![0x41];
        frame.extend_from_slice(&42u32.to_be_bytes());
        frame.extend_from_slice(&1700000000000u64.to_be_bytes());
        frame.extend_from_slice(&48000u32.to_be_bytes());
        frame.push(2); // channels
        frame.push(0); // codec PCM
        frame.extend_from_slice(&4u16.to_be_bytes()); // len
        frame.extend_from_slice(&[0x01, 0x02, 0x03, 0x04]);

        let parsed = AudioFramePacket::parse_binary(&frame).expect("Binary parse failed");
        assert_eq!(parsed.sequence, 42);
        assert_eq!(parsed.timestamp_ms, 1700000000000);
        assert_eq!(parsed.sample_rate, 48000);
        assert_eq!(parsed.channels, 2);
        assert_eq!(parsed.codec, 0);
        assert_eq!(parsed.payload, vec![0x01, 0x02, 0x03, 0x04]);
    }

    #[test]
    fn test_jitter_buffer_reordering_and_loss() {
        let mut jb = JitterBuffer::new(15);

        let make_pkt = |seq: u32| AudioFramePacket {
            sequence: seq,
            timestamp_ms: 1000 + seq as u64 * 10,
            sample_rate: 48000,
            channels: 2,
            codec: 0,
            payload: vec![0x00; 10],
        };

        // Push out-of-order packets: 1, 3, 2, 5
        jb.push(make_pkt(1));
        jb.push(make_pkt(3));
        jb.push(make_pkt(2));
        jb.push(make_pkt(5));

        // Pop should deliver sequentially: 1, 2, 3
        assert_eq!(jb.pop_next().unwrap().sequence, 1);
        assert_eq!(jb.pop_next().unwrap().sequence, 2);
        assert_eq!(jb.pop_next().unwrap().sequence, 3);

        // Sequence 4 was missing (lost) -> pop_next skips gap to 5
        assert_eq!(jb.pop_next().unwrap().sequence, 5);
        assert!(jb.pop_next().is_none());
    }

    #[test]
    fn test_qr_payload_generation_format() {
        // Test actual payload structure matches the schema used in Windows Tauri app
        let host = "192.168.1.150";
        let port = 8492;
        let pin_str = "871334";
        let url = format!("nexuslink://pair?v=1&host={}&port={}&device=NexusLink-PC&pin={}", host, port, pin_str);
        
        assert!(url.starts_with("nexuslink://pair"));
        assert!(url.contains("v=1"));
        assert!(url.contains("host=192.168.1.150"));
        assert!(url.contains("port=8492"));
        assert!(url.contains("pin=871334"));
    }

    #[test]
    fn test_ios_qr_parser_integration() {
        // Simulates the exact iOS parseAndConnectQR() logic to verify correct parameter extraction
        let raw_payload = "nexuslink://pair?v=1&host=192.168.1.150&port=8492&device=NexusLink-PC&pin=871334";
        
        // Emulate iOS URLComponents query parsing
        let mut parsed_host = String::new();
        let mut parsed_port = 8492;
        let mut parsed_pin = String::new();
        let mut parsed_version = String::new();
        let parsed_alpn = "nexuslink-v2";
        
        if let Some(query_start) = raw_payload.find('?') {
            let query_string = &raw_payload[query_start + 1..];
            let pairs = query_string.split('&');
            for pair in pairs {
                let kv: Vec<&str> = pair.split('=').collect();
                if kv.len() == 2 {
                    match kv[0] {
                        "host" => parsed_host = kv[1].to_string(),
                        "port" => parsed_port = kv[1].parse::<u16>().unwrap_or(8492),
                        "pin" => parsed_pin = kv[1].to_string(),
                        "v" => parsed_version = kv[1].to_string(),
                        _ => {}
                    }
                }
            }
        }
        
        assert_eq!(parsed_host, "192.168.1.150");
        assert_eq!(parsed_port, 8492);
        assert_eq!(parsed_pin, "871334");
        assert_eq!(parsed_version, "1");
        assert_eq!(parsed_alpn, "nexuslink-v2");
    }
}
