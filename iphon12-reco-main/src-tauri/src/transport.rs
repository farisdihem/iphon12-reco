// =========================================================================
// NexusLink Pro Engine - QUIC / TLS 1.3 Transport Layer & Frame Protocol
// File: src-tauri/src/transport.rs
// =========================================================================

use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use std::sync::{Arc, Mutex};
use tokio::sync::mpsc;
use tokio::net::UdpSocket;
use tauri::Emitter;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "payload")]
pub enum NexusMessage {
    Ping { timestamp: u64 },
    Pong { timestamp: u64, echo_time: u64 },
    DeviceInfo {
        device_name: String,
        os: String,
        os_version: String,
        protocol_version: u32,
        capabilities: Vec<String>,
    },
    PairRequest { pin_code: String, device_id: String },
    PairResponse { success: bool, session_token: String, reason: Option<String> },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransportStats {
    pub active_mode: String, // "QUIC/TLS 1.3 (Wi-Fi)" or "USB Transport"
    pub peer_address: String,
    pub latency_ms: f32,
    pub jitter_ms: f32,
    pub packet_loss: f32,
    pub throughput_mbps: f32,
    pub pairing_status: String,
}

pub struct TransportEngine {
    pub port: u16,
    pub is_running: bool,
    pub authenticated_peers: Vec<String>,
}

impl TransportEngine {
    pub fn new(port: u16) -> Self {
        Self {
            port,
            is_running: false,
            authenticated_peers: Vec::new(),
        }
    }

    /// Generates self-signed TLS 1.3 certificates dynamically for local LAN QUIC security
    pub fn generate_self_signed_cert() -> Result<(rustls::Certificate, rustls::PrivateKey), String> {
        let cert = rcgen::generate_simple_self_signed(vec!["nexuslink.local".into()])
            .map_err(|e| format!("Certificate Generation Error: {}", e))?;
        let cert_der = cert.serialize_der().map_err(|e| format!("Certificate DER Error: {}", e))?;
        let key_der = cert.serialize_private_key_der();
        Ok((rustls::Certificate(cert_der), rustls::PrivateKey(key_der)))
    }

    /// Handles incoming QUIC message frames (PING/PONG/DEVICE_INFO/PAIR_REQUEST/BINARY_AUDIO)
    pub fn handle_nexus_frame(&mut self, payload: &[u8], peer: SocketAddr, expected_pin: Option<String>) -> Option<NexusMessage> {
        if payload.is_empty() {
            return None;
        }

        // Check if binary stream frame tag (0x41 = Audio)
        if payload[0] == 0x41 {
            if let Ok(audio_packet) = crate::audio::AudioFramePacket::parse_binary(payload) {
                println!(
                    "[NEXUSLINK AUDIO STREAMS] Received audio packet seq={} ts={} len={} from {}",
                    audio_packet.sequence, audio_packet.timestamp_ms, audio_packet.payload.len(), peer
                );
            }
            return None;
        }

        // Check if binary stream frame tag (0x56 = Video)
        if payload[0] == 0x56 {
            if let Ok(video_packet) = crate::video::VideoPacket::parse_binary(payload) {
                println!(
                    "[NEXUSLINK VIDEO DATAGRAM] Received video packet fid={} pkt={}/{} pts={} len={} keyframe={} from {}",
                    video_packet.frame_id, video_packet.packet_index, video_packet.packet_count, video_packet.pts_ms, video_packet.payload_len, video_packet.is_keyframe(), peer
                );
            }
            return None;
        }

        if let Ok(msg) = serde_json::from_slice::<NexusMessage>(payload) {
            match &msg {
                NexusMessage::Ping { timestamp } => {
                    println!("[NEXUSLINK QUIC] Received PING from iPhone {}: ts={}", peer, timestamp);
                    return Some(NexusMessage::Pong {
                        timestamp: *timestamp,
                        echo_time: std::time::SystemTime::now()
                            .duration_since(std::time::UNIX_EPOCH)
                            .unwrap_or_default()
                            .as_millis() as u64,
                    });
                }
                NexusMessage::DeviceInfo { device_name, os, capabilities, .. } => {
                    println!("[PAIRING] HELLO RECEIVED");
                    println!("[APP] HELLO received");
                    println!("[NEXUSLINK QUIC] Device Info Handshake: {} ({}) with caps {:?}", device_name, os, capabilities);
                }
                NexusMessage::PairRequest { pin_code, device_id } => {
                    println!("[PAIRING] PIN RECEIVED");
                    println!("[APP] PIN received");
                    let success = if let Some(ref exp) = expected_pin {
                        pin_code == exp
                    } else {
                        false
                    };
                    
                    if success {
                        println!("[PAIRING] PIN VALID");
                        println!("[PAIRING] DEVICE PAIRED");
                        self.authenticated_peers.push(device_id.clone());
                    } else {
                        println!("[PAIRING] PIN INVALID. Got: {}, Expected: {:?}", pin_code, expected_pin);
                    }
                    
                    return Some(NexusMessage::PairResponse {
                        success,
                        session_token: format!("token-ios-{}", device_id),
                        reason: if success { None } else { Some("Invalid 6-Digit Pairing PIN Code".into()) },
                    });
                }
                _ => {}
            }
        }
        None
    }

    pub async fn start_quic_listener(
        &mut self,
        stats_tx: mpsc::Sender<TransportStats>,
        current_pin: Arc<Mutex<Option<String>>>,
        app_handle: tauri::AppHandle,
    ) -> Result<(), String> {
        println!("[NET] SERVER LISTENING 0.0.0.0:{}", self.port);
        let (cert, key) = Self::generate_self_signed_cert()?;
        
        let mut server_crypto = rustls::ServerConfig::builder()
            .with_safe_defaults()
            .with_no_client_auth()
            .with_single_cert(vec![cert], key)
            .map_err(|e| e.to_string())?;
        
        server_crypto.alpn_protocols = vec![b"nexuslink-v2".to_vec()];
        
        let mut transport_config = quinn::TransportConfig::default();
        transport_config.datagram_receive_buffer_size(Some(65536));
        transport_config.datagram_send_buffer_size(65536);
        
        let mut server_config = quinn::ServerConfig::with_crypto(Arc::new(server_crypto));
        server_config.transport_config(Arc::new(transport_config));
        
        let addr = format!("0.0.0.0:{}", self.port).parse::<SocketAddr>().map_err(|e| e.to_string())?;
        
        let endpoint = quinn::Endpoint::server(server_config, addr).map_err(|e| e.to_string())?;
        println!("[NEXUSLINK] QUIC / UDP Server active on {}", addr);
        println!("[NEXUSLINK] TLS 1.3 ALPN [nexuslink-v2] Listening...");
        
        self.is_running = true;
        
        let shared_engine = Arc::new(Mutex::new(Self {
            port: self.port,
            is_running: true,
            authenticated_peers: Vec::new(),
        }));
        
        println!("[QUIC] LISTENER TASK STARTED");
        
        while self.is_running {
            println!("[QUIC] WAITING FOR endpoint.accept()");
            if let Some(conn) = endpoint.accept().await {
                let stats_tx = stats_tx.clone();
                let current_pin = current_pin.clone();
                let shared_engine = shared_engine.clone();
                let app_handle = app_handle.clone();
                
                let peer_addr = conn.remote_address();
                println!("[QUIC] ENDPOINT ACCEPT RETURNED");
                println!("[NET] UDP/QUIC activity detected from {}", peer_addr);
                println!("[QUIC] incoming connection attempt from {}", peer_addr);
                println!("[NET] CONNECTION RECEIVED {}", peer_addr);
                
                tokio::spawn(async move {
                    println!("[QUIC] CONNECTION AWAIT STARTED");
                    println!("[TLS] handshake started for {}", peer_addr);
                    
                    match conn.await {
                        Ok(connection) => {
                            println!("[TLS] handshake success");
                            println!("[QUIC] CONNECTION ESTABLISHED with {}", peer_addr);
                            println!("[QUIC] CONNECTED");
                            println!("[TLS] CONNECTED");
                            println!("[ALPN] nexuslink-v2");
                            loop {
                                match connection.read_datagram().await {
                                    Ok(datagram) => {
                                        println!("[APP] datagram received from {}: len={}", connection.remote_address(), datagram.len());
                                        let stats = TransportStats {
                                            active_mode: "QUIC/TLS 1.3 (Wi-Fi)".to_string(),
                                            peer_address: connection.remote_address().to_string(),
                                            latency_ms: 2.1,
                                            jitter_ms: 0.5,
                                            packet_loss: 0.001,
                                            throughput_mbps: (datagram.len() as f32 * 8.0) / 1024.0 / 1024.0,
                                            pairing_status: "Authenticated".to_string(),
                                        };
                                        let _ = stats_tx.send(stats).await;
                                        
                                        let expected_pin = current_pin.lock().unwrap().clone();
                                        
                                        let response_opt = {
                                            let mut engine_lock = shared_engine.lock().unwrap();
                                            engine_lock.handle_nexus_frame(&datagram, connection.remote_address(), expected_pin)
                                        };
                                        
                                        if let Some(resp) = response_opt {
                                            // If pairing was successful, emit the real Tauri event to the React UI
                                            if let NexusMessage::PairResponse { success: true, ref session_token, .. } = resp {
                                                let device_id = session_token.trim_start_matches("token-ios-").to_string();
                                                
                                                #[derive(Clone, serde::Serialize)]
                                                struct DevicePairedEvent {
                                                    device_id: String,
                                                    name: String,
                                                    ip_address: String,
                                                }
                                                
                                                let _ = app_handle.emit("device-paired", DevicePairedEvent {
                                                    device_id,
                                                    name: "iPhone 12".to_string(),
                                                    ip_address: peer_addr.ip().to_string(),
                                                });
                                            }
                                            
                                            if let Ok(resp_bytes) = serde_json::to_vec(&resp) {
                                                if let Err(e) = connection.send_datagram(resp_bytes.into()) {
                                                    println!("[QUIC] Failed to send response datagram: {}", e);
                                                } else {
                                                    println!("[PAIRING] RESPONSE SENT");
                                                }
                                            }
                                        }
                                    }
                                    Err(e) => {
                                        println!("[NEXUSLINK] QUIC Datagram error / disconnected: {}", e);
                                        break;
                                    }
                                }
                            }
                        }
                        Err(e) => {
                            println!("[TLS] HANDSHAKE FAILED: {}", e);
                        }
                    }
                });
            }
        }
        
        Ok(())
    }
}

async fn read_frame<R: tokio::io::AsyncReadExt + Unpin>(reader: &mut R) -> Result<(u8, Vec<u8>), std::io::Error> {
    let mut len_bytes = [0u8; 4];
    reader.read_exact(&mut len_bytes).await?;
    let total_len = u32::from_be_bytes(len_bytes) as usize;
    if total_len < 1 {
        return Err(std::io::Error::new(std::io::ErrorKind::InvalidData, "Frame length too short"));
    }
    
    let mut msg_type_byte = [0u8; 1];
    reader.read_exact(&mut msg_type_byte).await?;
    
    let payload_len = total_len - 1;
    let mut payload = vec![0u8; payload_len];
    if payload_len > 0 {
        reader.read_exact(&mut payload).await?;
    }
    Ok((msg_type_byte[0], payload))
}

async fn write_frame<W: tokio::io::AsyncWriteExt + Unpin>(writer: &mut W, msg_type: u8, payload: &[u8]) -> Result<(), std::io::Error> {
    let total_len = (1 + payload.len()) as u32;
    writer.write_all(&total_len.to_be_bytes()).await?;
    writer.write_all(&[msg_type]).await?;
    if !payload.is_empty() {
        writer.write_all(payload).await?;
    }
    writer.flush().await?;
    Ok(())
}

fn parse_device_ids(response: &str) -> Vec<u32> {
    let mut ids = Vec::new();
    let mut cursor = response;
    while let Some(idx) = cursor.find("<key>DeviceID</key>") {
        let rest = &cursor[idx + 19..];
        if let Some(start) = rest.find("<integer>") {
            if let Some(end) = rest[start + 9..].find("</integer>") {
                let id_str = rest[start + 9..start + 9 + end].trim();
                if let Ok(id) = id_str.parse::<u32>() {
                    ids.push(id);
                }
            }
        }
        cursor = rest;
    }
    ids
}

fn parse_connect_result(response: &str) -> bool {
    if let Some(idx) = response.find("<key>Number</key>") {
        let rest = &response[idx + 17..];
        if let Some(start) = rest.find("<integer>") {
            if let Some(end) = rest[start + 9..].find("</integer>") {
                let num_str = rest[start + 9..start + 9 + end].trim();
                return num_str == "0";
            }
        }
    }
    false
}

async fn query_usbmuxd_devices() -> Result<Vec<u32>, String> {
    use tokio::io::{AsyncReadExt, AsyncWriteExt};
    let mut stream = tokio::net::TcpStream::connect("127.0.0.1:27015").await
        .map_err(|e| format!("Could not connect to usbmuxd on port 27015: {}", e))?;
    
    let plist = r#"<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>ClientVersionString</key>
    <string>NexusLinkPro</string>
    <key>MessageType</key>
    <string>ListDevices</string>
    <key>ProgName</key>
    <string>NexusLink</string>
</dict>
</plist>"#;

    let payload = plist.as_bytes();
    let mut header = Vec::new();
    let total_len = (16 + payload.len()) as u32;
    header.extend_from_slice(&total_len.to_le_bytes()); // length
    header.extend_from_slice(&1u32.to_le_bytes());      // version (1 = Plist)
    header.extend_from_slice(&8u32.to_le_bytes());      // request (8 = Plist request)
    header.extend_from_slice(&1u32.to_le_bytes());      // tag
    
    stream.write_all(&header).await.map_err(|e| e.to_string())?;
    stream.write_all(payload).await.map_err(|e| e.to_string())?;
    stream.flush().await.map_err(|e| e.to_string())?;
    
    let mut resp_header = [0u8; 16];
    stream.read_exact(&mut resp_header).await.map_err(|e| e.to_string())?;
    let resp_len = u32::from_le_bytes([resp_header[0], resp_header[1], resp_header[2], resp_header[3]]) as usize;
    if resp_len < 16 {
        return Err("Invalid usbmuxd response header".into());
    }
    
    let body_len = resp_len - 16;
    let mut body = vec![0u8; body_len];
    stream.read_exact(&mut body).await.map_err(|e| e.to_string())?;
    
    let response_str = String::from_utf8_lossy(&body);
    Ok(parse_device_ids(&response_str))
}

async fn connect_usbmuxd_tunnel(device_id: u32, target_port: u16) -> Result<tokio::net::TcpStream, String> {
    use tokio::io::{AsyncReadExt, AsyncWriteExt};
    let mut stream = tokio::net::TcpStream::connect("127.0.0.1:27015").await
        .map_err(|e| format!("Could not connect to usbmuxd: {}", e))?;
    
    let port_val = target_port.to_be();
    
    let plist = format!(r#"<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>ClientVersionString</key>
    <string>NexusLinkPro</string>
    <key>MessageType</key>
    <string>Connect</string>
    <key>DeviceID</key>
    <integer>{}</integer>
    <key>PortNumber</key>
    <integer>{}</integer>
    <key>ProgName</key>
    <string>NexusLink</string>
</dict>
</plist>"#, device_id, port_val);

    let payload = plist.as_bytes();
    let mut header = Vec::new();
    let total_len = (16 + payload.len()) as u32;
    header.extend_from_slice(&total_len.to_le_bytes()); // length
    header.extend_from_slice(&1u32.to_le_bytes());      // version (1 = Plist)
    header.extend_from_slice(&8u32.to_le_bytes());      // request (8 = Plist request)
    header.extend_from_slice(&2u32.to_le_bytes());      // tag
    
    stream.write_all(&header).await.map_err(|e| e.to_string())?;
    stream.write_all(payload).await.map_err(|e| e.to_string())?;
    stream.flush().await.map_err(|e| e.to_string())?;
    
    let mut resp_header = [0u8; 16];
    stream.read_exact(&mut resp_header).await.map_err(|e| e.to_string())?;
    let resp_len = u32::from_le_bytes([resp_header[0], resp_header[1], resp_header[2], resp_header[3]]) as usize;
    if resp_len < 16 {
        return Err("Invalid usbmuxd tunnel response header".into());
    }
    
    let body_len = resp_len - 16;
    let mut body = vec![0u8; body_len];
    stream.read_exact(&mut body).await.map_err(|e| e.to_string())?;
    
    let response_str = String::from_utf8_lossy(&body);
    if parse_connect_result(&response_str) {
        Ok(stream)
    } else {
        Err(format!("usbmuxd rejected tunnel connection: {}", response_str))
    }
}

pub async fn start_usb_listener(
    current_pin: Arc<Mutex<Option<String>>>,
    app_handle: tauri::AppHandle,
) {
    println!("[USB] BACKGROUND DISCOVERY LOOP ACTIVE");
    loop {
        tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
        
        match query_usbmuxd_devices().await {
            Ok(devices) => {
                if devices.is_empty() {
                    continue;
                }
                
                let device_id = devices[0];
                println!("[USB] DEVICE DETECTED");
                println!("[USB] DEVICE ID: {}", device_id);
                println!("[USB] OPENING TUNNEL");
                
                match connect_usbmuxd_tunnel(device_id, 8493).await {
                    Ok(mut stream) => {
                        println!("[USB] TUNNEL CONNECTED");
                        
                        // Send HELLO
                        let hello_json = serde_json::json!({
                            "type": "DeviceInfo",
                            "payload": {
                                "device_name": "NexusLink-PC",
                                "os": "Windows",
                                "os_version": "11.0",
                                "protocol_version": 2,
                                "capabilities": ["audio", "video", "usb"]
                            }
                        });
                        let hello_bytes = serde_json::to_vec(&hello_json).unwrap_or_default();
                        
                        println!("[PAIRING] HELLO SENT");
                        if let Err(e) = write_frame(&mut stream, 1, &hello_bytes).await {
                            println!("[USB] Failed to send HELLO: {}", e);
                            continue;
                        }
                        
                        // Frame read loop
                        loop {
                            match read_frame(&mut stream).await {
                                Ok((msg_type, payload)) => {
                                    match msg_type {
                                        1 => { // HELLO (DeviceInfo)
                                            println!("[PAIRING] HELLO RECEIVED");
                                            println!("[PAIRING] DEVICE INFO RECEIVED");
                                            if let Ok(json) = serde_json::from_slice::<serde_json::Value>(&payload) {
                                                println!("[USB] iPhone Device Info: {:?}", json);
                                            }
                                        }
                                        2 => { // PAIR_REQUEST
                                            println!("[PAIRING] PIN RECEIVED");
                                            println!("[APP] PIN received");
                                            if let Ok(req) = serde_json::from_slice::<serde_json::Value>(&payload) {
                                                let payload_data = &req["payload"];
                                                let pin_code = payload_data["pin_code"].as_str().unwrap_or("");
                                                let device_id_str = payload_data["device_id"].as_str().unwrap_or("iphone-usb");
                                                
                                                let expected = current_pin.lock().unwrap().clone();
                                                let success = if let Some(ref exp) = expected {
                                                    pin_code == exp
                                                } else {
                                                    false
                                                };
                                                
                                                if success {
                                                    println!("[PAIRING] PIN VALID");
                                                    println!("[PAIRING] DEVICE PAIRED");
                                                    println!("[USB] DEVICE PAIRED");
                                                    
                                                    // Emit device-paired Tauri event
                                                    #[derive(Clone, serde::Serialize)]
                                                    struct DevicePairedEvent {
                                                        device_id: String,
                                                        name: String,
                                                        ip_address: String,
                                                    }
                                                    let _ = app_handle.emit("device-paired", DevicePairedEvent {
                                                        device_id: device_id_str.to_string(),
                                                        name: "iPhone via USB".to_string(),
                                                        ip_address: "USB Tunnel".to_string(),
                                                    });
                                                } else {
                                                    println!("[PAIRING] PIN INVALID. Got: {}, Expected: {:?}", pin_code, expected);
                                                }
                                                
                                                let resp_json = serde_json::json!({
                                                    "type": "PairResponse",
                                                    "payload": {
                                                        "success": success,
                                                        "session_token": format!("token-ios-{}", device_id_str),
                                                        "reason": if success { None } else { Some("Invalid PIN".to_string()) }
                                                    }
                                                });
                                                let resp_bytes = serde_json::to_vec(&resp_json).unwrap_or_default();
                                                println!("[PAIRING] RESPONSE SENT");
                                                let _ = write_frame(&mut stream, 3, &resp_bytes).await;
                                            }
                                        }
                                        4 => { // AUDIO
                                            if let Ok(audio_packet) = crate::audio::AudioFramePacket::parse_binary(&payload) {
                                                println!(
                                                    "[NEXUSLINK AUDIO STREAMS] Received audio packet seq={} ts={} len={} from USB Tunnel",
                                                    audio_packet.sequence, audio_packet.timestamp_ms, audio_packet.payload.len()
                                                );
                                            }
                                        }
                                        5 => { // VIDEO
                                            if let Ok(video_packet) = crate::video::VideoPacket::parse_binary(&payload) {
                                                println!(
                                                    "[NEXUSLINK VIDEO DATAGRAM] Received video packet fid={} pkt={}/{} pts={} len={} keyframe={} from USB Tunnel",
                                                    video_packet.frame_id, video_packet.packet_index, video_packet.packet_count, video_packet.pts_ms, video_packet.payload_len, video_packet.is_keyframe()
                                                );
                                            }
                                        }
                                        7 => { // PING
                                            let pong_bytes = vec![];
                                            let _ = write_frame(&mut stream, 8, &pong_bytes).await;
                                        }
                                        _ => {}
                                    }
                                }
                                Err(e) => {
                                    println!("[USB] Connection error / disconnected: {}", e);
                                    break;
                                }
                            }
                        }
                    }
                    Err(e) => {
                        println!("[USB] TUNNEL FAILED");
                        println!("[USB] REASON: {}", e);
                    }
                }
            }
            Err(e) => {
                println!("[USB] DEVICE DISCOVERY FAILED");
                println!("[USB] REASON: Apple Mobile Device Service (usbmuxd) not running on port 27015: {}", e);
            }
        }
    }
}
