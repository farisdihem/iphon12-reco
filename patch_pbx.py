with open("ios/NexusLinkCompanion/NexusLinkCompanion.xcodeproj/project.pbxproj", "r") as f:
    lines = f.readlines()

with open("ios/NexusLinkCompanion/NexusLinkCompanion.xcodeproj/project.pbxproj", "w") as f:
    for line in lines:
        if "QRScannerView.swift" not in line:
            f.write(line)
