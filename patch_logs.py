import re

with open("src-tauri/src/transport.rs", "r") as f:
    content = f.read()

# Replace QUIC LISTENING logs
content = re.sub(r'println!\("\[NET\] SERVER LISTENING 0\.0\.0\.0:\{\}", self\.port\);', r'println!("[QUIC] LISTENING 0.0.0.0:{}", self.port);', content)
content = re.sub(r'println!\("\[NEXUSLINK\] QUIC / UDP Server active on \{\}", addr\);', '', content)
content = re.sub(r'println!\("\[NEXUSLINK\] TLS 1\.3 ALPN \[nexuslink-v2\] Listening\.\.\."\);', '', content)
content = re.sub(r'println!\("\[QUIC\] LISTENER TASK STARTED"\);', '', content)
content = re.sub(r'println!\("\[QUIC\] WAITING FOR endpoint\.accept\(\)"\);', '', content)
content = re.sub(r'println!\("\[QUIC\] ENDPOINT ACCEPT RETURNED"\);', '', content)
content = re.sub(r'println!\("\[NET\] UDP/QUIC activity detected from \{\}", peer_addr\);', '', content)
content = re.sub(r'println!\("\[QUIC\] incoming connection attempt from \{\}", peer_addr\);', '', content)
content = re.sub(r'println!\("\[NET\] CONNECTION RECEIVED \{\}", peer_addr\);', r'println!("[QUIC] CONNECTION RECEIVED");', content)
content = re.sub(r'println!\("\[QUIC\] CONNECTION AWAIT STARTED"\);', '', content)
content = re.sub(r'println!\("\[TLS\] handshake started for \{\}", peer_addr\);', '', content)
content = re.sub(r'println!\("\[TLS\] handshake success"\);', r'println!("[TLS] HANDSHAKE SUCCESS");', content)
content = re.sub(r'println!\("\[QUIC\] CONNECTION ESTABLISHED with \{\}", peer_addr\);', '', content)
content = re.sub(r'println!\("\[QUIC\] CONNECTED"\);', '', content)
content = re.sub(r'println!\("\[TLS\] CONNECTED"\);', '', content)
content = re.sub(r'println!\("\[ALPN\] nexuslink-v2"\);', '', content)
content = re.sub(r'println!\("\[APP\] HELLO received"\);', '', content)
content = re.sub(r'println!\("\[NEXUSLINK QUIC\] Device Info Handshake.*?"\);', '', content)
content = re.sub(r'println!\("\[APP\] PIN received"\);', '', content)
content = re.sub(r'println!\("\[NEXUSLINK QUIC\] Received PING.*?"\);', '', content)

with open("src-tauri/src/transport.rs", "w") as f:
    f.write(content)
