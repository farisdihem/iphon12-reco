import re

with open("src-tauri/src/main.rs", "r") as f:
    content = f.read()

replacement = """
    if let Ok(interfaces) = local_ip_address::list_afinet_netifas() {
        for (name, ip) in interfaces {
            if ip.is_ipv4() && !ip.is_loopback() {
                println!("[USB] NETWORK INTERFACE DETECTED: {}", name);
                println!("[USB] IP = {}", ip);
                usb_networks.push(UsbNetworkInfo {
                    interface_name: name,
                    ip_address: ip.to_string(),
                });
            }
        }
    }
"""

content = re.sub(r'if let Ok\(interfaces\) = local_ip_address::list_afinet_netifas\(\) \{.*?\}', replacement, content, flags=re.DOTALL)

with open("src-tauri/src/main.rs", "w") as f:
    f.write(content)
