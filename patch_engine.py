with open("ios/NexusLinkCompanion/NexusLinkEngine.swift", "r") as f:
    content = f.read()

content = content.replace('self.connectionMode = "Wi-Fi"', 'self.connectionMode = "USB"')
content = content.replace('self.connectionStatus = "Connected via Wi-Fi LAN"', 'self.connectionStatus = "Connected"')
content = content.replace('self.connectionStatus = "Connected via USB"', 'self.connectionStatus = "Connected"')

with open("ios/NexusLinkCompanion/NexusLinkEngine.swift", "w") as f:
    f.write(content)
