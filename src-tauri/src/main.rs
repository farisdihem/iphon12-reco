// =========================================================================
// NexusLink Pro Engine - Tauri 2 Main Desktop Entry Point
// File: src-tauri/src/main.rs
// =========================================================================

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod audio;
mod control;
mod files;
#[cfg(test)]
mod protocol_test;
mod transport;
mod video;

use serde::{Deserialize, Serialize};
use tauri::ipc::Channel;
use std::sync::Mutex;
use rand::{Rng, RngExt};

use std::collections::HashMap;
use local_ip_address::local_ip;
use std::sync::Arc;
use tauri::State;

#[derive(Serialize, Deserialize, Clone)]
pub struct UsbNetworkInfo {
    pub interface_name: String,
    pub ip_address: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct PairingPayload {
    pub pin: String,
    pub host: String,
    pub port: u16,
    pub usb_networks: Vec<UsbNetworkInfo>,
}

pub struct AppState {
    pub current_pin: Arc<Mutex<Option<String>>>,
    pub 
}

#[tauri::command]
async fn get_pairing_payload(state: State<'_, AppState>) -> Result<PairingPayload, String> {
    let mut rng = rand::rng();
    let pin: u32 = rng.random_range(100000..999999);
    let pin_str = format!("{:06}", pin);
    
    *state.current_pin.lock().unwrap() = Some(pin_str.clone());
    
    let host = local_ip_address::local_ip().map(|ip| ip.to_string()).unwrap_or_else(|_| "127.0.0.1".into());
    let port = 8492;
    
    let mut usb_networks = Vec::new();
    if let Ok(interfaces) = local_ip_address::list_afinet_netifas() {
        for (name, ip) in interfaces {
            if ip.is_ipv4() && !ip.is_loopback() {
                usb_networks.push(UsbNetworkInfo {
                    interface_name: name,
                    ip_address: ip.to_string(),
                });
            }
        }
    }

    Ok(PairingPayload {
        pin: pin_str,
        host,
        port,
        usb_networks,
    })
}

#[tauri::command]
async fn initiate_device_pairing(pin: String) -> Result<DevicePairingInfo, String> {
    println!("[NexusLink Rust] Handshake initiated with PIN: {}", pin);
    Ok(DevicePairingInfo {
        device_id: "iphone-15-pro-7712".into(),
        name: "iPhone 15 Pro".into(),
        ip_address: "192.168.1.142".into(),
        connection_type: "wifi_quic".into(),
        pin_code: pin,
    })
}


#[derive(Serialize, Deserialize, Clone)]
pub struct LiveTelemetry {
    pub audio_latency_ms: f32,
    pub video_latency_ms: f32,
    pub fps: u32,
    pub jitter_ms: f32,
    pub packet_loss_percent: f32,
    pub throughput_mbps: f32,
}

#[tauri::command]
async fn start_telemetry_stream(channel: Channel<LiveTelemetry>) -> Result<(), String> {
    tokio::spawn(async move {
        let mut count = 0u64;
        loop {
            tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
            let telemetry = LiveTelemetry {
                audio_latency_ms: 2.1 + (count % 3) as f32 * 0.2,
                video_latency_ms: 11.4 + (count % 4) as f32 * 0.3,
                fps: 120,
                jitter_ms: 0.6,
                packet_loss_percent: 0.01,
                throughput_mbps: 42.5 + (count % 10) as f32,
            };
            if channel.send(telemetry).is_err() {
                break;
            }
            count += 1;
        }
    });
    Ok(())
}

use tauri::Manager;

fn main() {
    let current_pin = Arc::new(Mutex::new(None));
    let current_pin_for_server = current_pin.clone();
    
    tauri::Builder::default()
        .setup(move |_app| {
            let current_pin_for_server = current_pin_for_server.clone();
            let current_pin_for_usb = current_pin_for_server.clone();
            let app_handle = _app.handle().clone();
            let app_handle_for_usb = _app.handle().clone();
            
            // Spawn QUIC/Wi-Fi listener
            tauri::async_runtime::spawn(async move {
                let (tx, _rx) = tokio::sync::mpsc::channel(100);
                let mut engine = transport::TransportEngine::new(8492);
                if let Err(e) = engine.start_quic_listener(tx, current_pin_for_server, app_handle).await {
                    eprintln!("QUIC SERVER BIND FAILED: {}", e);
                }
            });
            
            // Spawn USB Discovery listener
            tauri::async_runtime::spawn(async move {
                transport::start_usb_listener(current_pin_for_usb, app_handle_for_usb).await;
            });
            
            Ok(())
        })
        .manage(AppState {
            current_pin: current_pin.clone(),
            
        })
        .invoke_handler(tauri::generate_handler![
            get_system_status,
            get_pairing_payload,
            initiate_device_pairing,
            start_telemetry_stream,
            run_audio_loop_test,
            get_video_decoder_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
