import re

with open("src-tauri/src/main.rs", "r") as f:
    content = f.read()

# Remove mDNS initialization and daemon
content = re.sub(r'use mdns_sd::.*?;', '', content)
content = re.sub(r'mdns:\s*Mutex<Option<ServiceDaemon>>,?', '', content)
content = re.sub(r'mdns:\s*Mutex::new\(None\),?', '', content)

# Remove the actual MDNS start logic if it exists (e.g., mdns.register)
content = re.sub(r'let daemon = ServiceDaemon::new\(\)\.unwrap\(\);.*?daemon\.register\(service_info\)\.unwrap\(\);', '', content, flags=re.DOTALL)
content = re.sub(r'\*state\.mdns\.lock\(\)\.unwrap\(\) = Some\(daemon\);', '', content)

with open("src-tauri/src/main.rs", "w") as f:
    f.write(content)
