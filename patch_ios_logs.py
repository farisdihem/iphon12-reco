import re

with open("ios/NexusLinkCompanion/NexusLinkEngine.swift", "r") as f:
    content = f.read()

# Replace print with log for pairing events so they show up in UI diagnostics
content = content.replace('print("[PAIRING] Server response: \(json)")', 'self.log("[PAIRING] RESPONSE RECEIVED")')
content = content.replace('print("[PAIRING] RESPONSE RECEIVED")', '')
content = content.replace('print("[PAIRING] PAIRED")', '')
content = content.replace('print("[PAIRING] SUCCESS")', 'self.log("[PAIRING] SUCCESS")')
content = content.replace('print("[PAIRING] FAILED', 'self.log("[PAIRING] FAILED')
content = content.replace('print("[PAIRING] HELLO SENT")', 'self.log("[PAIRING] HELLO SENT")')
content = content.replace('print("[PAIRING] PIN SENT")', 'self.log("[PAIRING] PIN SENT")')

content = content.replace('self.log("[QUIC] Calling start()")', 'self.log("[QUIC] START")')

with open("ios/NexusLinkCompanion/NexusLinkEngine.swift", "w") as f:
    f.write(content)
