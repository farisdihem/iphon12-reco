with open("ios/NexusLinkCompanion/NexusLinkEngine.swift", "r") as f:
    content = f.read()

content = content.replace('@Published public var connectionStatus: String = "Disconnected"', '@Published public var connectionStatus: String = "Waiting for USB network..."')
content = content.replace('@Published public var connectionMode: String = "Wi-Fi"', '@Published public var connectionMode: String = "USB"')
content = content.replace('self.connectionStatus = "Connected via Wi-Fi QUIC"', 'self.connectionStatus = "Connected"')

with open("ios/NexusLinkCompanion/NexusLinkEngine.swift", "w") as f:
    f.write(content)
