import re

with open("src-tauri/src/main.rs", "r") as f:
    content = f.read()

start_idx = content.find("#[derive(Serialize, Deserialize, Clone)]\npub struct PairingPayload")
end_idx = content.find("#[tauri::command]\nasync fn initiate_device_pairing")

if start_idx != -1 and end_idx != -1:
    new_fn = """#[derive(Serialize, Deserialize, Clone)]
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
    pub mdns: Mutex<Option<ServiceDaemon>>,
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

"""
    content = content[:start_idx] + new_fn + content[end_idx:]
    with open("src-tauri/src/main.rs", "w") as f:
        f.write(content)
else:
    print("Could not find bounds")
