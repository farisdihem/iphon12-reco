// =========================================================================
// NexusLink iOS Companion - Main User Interface
// File: ios/NexusLinkCompanion/ContentView.swift
// =========================================================================

import SwiftUI

struct ContentView: View {
    @EnvironmentObject var engine: NexusLinkIOSEngine
    @State private var pinInput: String = ""
    @State private var manualHostInput: String = "192.168.1.102"
    @State private var manualPortInput: String = "8492"
    @State private var qrPayloadInput: String = ""
    @State private var isShowingScanner: Bool = false

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Header Status
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Circle()
                                .fill(engine.connectionStatus.contains("Successfully") || engine.connectionStatus.contains("Connected") ? Color.green : Color.orange)
                                .frame(width: 12, height: 12)
                            Text(engine.connectionStatus)
                                .font(.headline)
                            Spacer()
                        }
                        
                        HStack {
                            Text("Connection Mode:")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                            Text(engine.connectionMode)
                                .font(.subheadline)
                                .bold()
                                .foregroundColor(engine.connectionMode == "USB" ? .blue : .purple)
                            Spacer()
                        }
                    }
                    .padding()
                    .background(Color.secondary.opacity(0.1))
                    .cornerRadius(12)

                    // Real-Time Diagnostic Console for Connection Troubleshooting
                    VStack(alignment: .leading, spacing: 6) {
                        HStack {
                            Text("Real-Time Connection Diagnostics")
                                .font(.caption)
                                .bold()
                                .foregroundColor(.secondary)
                            Spacer()
                            Button(action: {
                                engine.diagnosticLogs = ["Console cleared. Waiting for actions..."]
                            }) {
                                Text("Clear")
                                    .font(.caption2)
                                    .foregroundColor(.blue)
                            }
                        }
                        
                        ScrollViewReader { scrollProxy in
                            ScrollView {
                                VStack(alignment: .leading, spacing: 4) {
                                    ForEach(Array(engine.diagnosticLogs.enumerated()), id: \.offset) { _, logLine in
                                        Text(logLine)
                                            .font(.system(size: 11, design: .monospaced))
                                            .foregroundColor(.green)
                                            .frame(maxWidth: .infinity, alignment: .leading)
                                    }
                                }
                                .padding(8)
                            }
                            .frame(height: 120)
                            .background(Color.black)
                            .cornerRadius(8)
                        }
                    }
                    .padding()
                    .background(Color.secondary.opacity(0.05))
                    .cornerRadius(12)

                    // Global 6-Digit PIN input for Discovery
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Pairing PIN (Required for Connection)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        TextField("6-Digit PIN (e.g. 901629)", text: $pinInput)
                            .textFieldStyle(.roundedBorder)
                            .keyboardType(.numberPad)
                    }
                    .padding()
                    .background(Color.blue.opacity(0.05))
                    .cornerRadius(12)

                    // Discovered Windows PCs
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Discovered Windows PCs")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        if engine.discoveredServers.isEmpty {
                            Text("Searching LAN via mDNS (_nexuslink._udp)...")
                                .font(.subheadline)
                                .foregroundColor(.gray)
                                .padding(.vertical, 8)
                        } else {
                            ForEach(engine.discoveredServers) { server in
                                HStack {
                                    VStack(alignment: .leading) {
                                        Text(server.name).font(.headline)
                                        Text("\(server.host):\(server.port)").font(.caption).foregroundColor(.gray)
                                    }
                                    Spacer()
                                    Button("Connect & Pair") {
                                        engine.startQUICConnection(host: server.host, port: server.port, pin: pinInput)
                                    }
                                    .buttonStyle(.borderedProminent)
                                    .disabled(pinInput.count != 6)
                                }
                                .padding()
                                .background(Color.secondary.opacity(0.05))
                                .cornerRadius(8)
                            }
                        }
                    }

                    // QR Code Payload Auto-Pairing Block
                    VStack(alignment: .leading, spacing: 10) {
                        Text("Auto-Pair from QR Code Payload")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        TextField("Paste QR Code URL or NexusLink Payload", text: $qrPayloadInput)
                            .textFieldStyle(.roundedBorder)
                        
                        HStack(spacing: 12) {
                            Button(action: parseAndConnectQR) {
                                Label("Auto-Connect", systemImage: "qrcode.viewfinder")
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 12)
                                    .background(qrPayloadInput.isEmpty ? Color.gray.opacity(0.4) : Color.purple)
                                    .foregroundColor(qrPayloadInput.isEmpty ? Color.secondary : Color.white)
                                    .cornerRadius(10)
                            }
                            .disabled(qrPayloadInput.isEmpty)
                            
                            Button(action: { isShowingScanner = true }) {
                                Label("Scan QR", systemImage: "camera")
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 12)
                                    .background(Color.blue)
                                    .foregroundColor(.white)
                                    .cornerRadius(10)
                            }
                        }
                    }
                    .padding()
                    .background(Color.purple.opacity(0.05))
                    .cornerRadius(12)

                    // Manual Pairing Block
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Manual QUIC / TLS 1.3 Parameters")
                            .font(.caption)
                            .foregroundColor(.secondary)

                        TextField("PC IP Address (e.g. 192.168.1.102)", text: $manualHostInput)
                            .textFieldStyle(.roundedBorder)
                            .keyboardType(.numbersAndPunctuation)

                        TextField("QUIC Port (default 8492)", text: $manualPortInput)
                            .textFieldStyle(.roundedBorder)
                            .keyboardType(.numberPad)

                        Button(action: {
                            let host = manualHostInput.isEmpty ? "192.168.1.102" : manualHostInput
                            let port = UInt16(manualPortInput) ?? 8492
                            
                            engine.log("[UI] MANUAL CONNECTION PRESSED")
                            engine.log("[UI] - RAW PAYLOAD = manual")
                            engine.log("[UI] - PARSED HOST = \(host)")
                            engine.log("[UI] - PARSED PORT = \(port)")
                            engine.log("[UI] - PARSED PIN = \(pinInput)")
                            engine.log("[UI] - PROTOCOL VERSION = 1")
                            engine.log("[UI] - ALPN = nexuslink-v2")
                            
                            engine.clearStaleUSBTransportAndSwitchToWiFi()
                            engine.startQUICConnection(host: host, port: port, pin: pinInput)
                        }) {
                            Label("Connect & Pair via QUIC", systemImage: "link")
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(pinInput.count == 6 ? Color.blue : Color.gray.opacity(0.4))
                                .foregroundColor(pinInput.count == 6 ? Color.white : Color.secondary)
                                .cornerRadius(12)
                        }
                        .disabled(pinInput.count != 6)
                    }
                    .padding()
                    .background(Color.secondary.opacity(0.05))
                    .cornerRadius(12)

                    Spacer()
                }
                .padding()
            }
            .navigationTitle("NexusLink Pro")
            .onAppear {
                engine.startBonjourDiscovery()
            }
            .sheet(isPresented: $isShowingScanner) {
                NavigationView {
                    QRScannerView { code in
                        isShowingScanner = false
                        qrPayloadInput = code
                        parseAndConnectQR()
                    }
                    .navigationTitle("Scan Windows QR Code")
                    .navigationBarTitleDisplayMode(.inline)
                    .navigationBarItems(leading: Button("Cancel") {
                        isShowingScanner = false
                    })
                }
            }
        }
    }

    private func parseAndConnectQR() {
        let rawPayload = qrPayloadInput.trimmingCharacters(in: .whitespacesAndNewlines)
        engine.log("[UI] parseAndConnectQR CALLED")
        
        var parsedHost = ""
        var parsedPortStr = "8492"
        var parsedPin = ""
        var parsedVersion = ""
        let parsedALPN = "nexuslink-v2"
        
        // 1. Detect if it's a raw 6-digit PIN
        let pinRegex = try? NSRegularExpression(pattern: "^[0-9]{6}$", options: [])
        let range = NSRange(location: 0, length: rawPayload.utf16.count)
        let isOnlyPin = pinRegex?.firstMatch(in: rawPayload, options: [], range: range) != nil
        
        if isOnlyPin {
            engine.log("[PAIRING] Raw 6-digit PIN scanned/entered. Extracting PIN directly.")
            parsedPin = rawPayload
            parsedHost = manualHostInput.isEmpty ? "192.168.1.102" : manualHostInput
            parsedPortStr = manualPortInput.isEmpty ? "8492" : manualPortInput
            parsedVersion = "1"
        } else {
            // 2. Parse as a URL
            var queryItems: [String: String] = [:]
            if let url = URL(string: rawPayload),
               let components = URLComponents(url: url, resolvingAgainstBaseURL: true) {
                if let items = components.queryItems {
                    for item in items {
                        if let val = item.value {
                            queryItems[item.name] = val
                        }
                    }
                }
            }
            
            // Manual fallback string parsing if URLComponents was empty (e.g. invalid scheme structure)
            if queryItems.isEmpty {
                if let queryStartIndex = rawPayload.firstIndex(of: "?") {
                    let queryString = String(rawPayload[rawPayload.index(after: queryStartIndex)...])
                    let pairs = queryString.components(separatedBy: "&")
                    for pair in pairs {
                        let kv = pair.components(separatedBy: "=")
                        if kv.count == 2 {
                            queryItems[kv[0]] = kv[1]
                        }
                    }
                }
            }
            
            parsedHost = queryItems["host"] ?? ""
            parsedPortStr = queryItems["port"] ?? "8492"
            parsedPin = queryItems["pin"] ?? ""
            parsedVersion = queryItems["v"] ?? ""
        }
        
        // Expose exact log trace
        engine.log("[UI] PARSING COMPLETE:")
        engine.log("[UI] - RAW PAYLOAD = \(rawPayload)")
        engine.log("[UI] - PARSED HOST = \(parsedHost)")
        engine.log("[UI] - PARSED PORT = \(parsedPortStr)")
        engine.log("[UI] - PARSED PIN = \(parsedPin)")
        engine.log("[UI] - PROTOCOL VERSION = \(parsedVersion)")
        engine.log("[UI] - ALPN = \(parsedALPN)")
        
        // Robust parameter verification and validation
        guard parsedVersion == "1" else {
            engine.log("[PAIRING] ERROR: Unsupported/missing protocol version '\(parsedVersion)'. Expected version 1.")
            return
        }
        
        guard !parsedHost.isEmpty else {
            engine.log("[PAIRING] ERROR: Missing host parameter in payload")
            return
        }
        
        guard parsedPin.count == 6 else {
            engine.log("[PAIRING] ERROR: Invalid PIN length '\(parsedPin.count)'. Expected 6-digit PIN.")
            return
        }
        
        let port = UInt16(parsedPortStr) ?? 8492
        
        // Sync values back to manual fallback UI fields
        self.manualHostInput = parsedHost
        self.manualPortInput = parsedPortStr
        self.pinInput = parsedPin
        
        engine.log("[PAIRING] Decoded values validated successfully. Transitioning state...")
        
        // Clear/stop any stale USB transport and set connectionMode before starting Wi-Fi QUIC
        engine.clearStaleUSBTransportAndSwitchToWiFi()
        
        engine.startQUICConnection(host: parsedHost, port: port, pin: parsedPin)
    }
}
