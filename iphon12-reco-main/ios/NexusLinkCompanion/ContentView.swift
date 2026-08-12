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
                        
                        Button(action: parseAndConnectQR) {
                            Label("Auto-Connect from QR Payload", systemImage: "qrcode.viewfinder")
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(qrPayloadInput.isEmpty ? Color.gray.opacity(0.4) : Color.purple)
                                .foregroundColor(qrPayloadInput.isEmpty ? Color.secondary : Color.white)
                                .cornerRadius(12)
                        }
                        .disabled(qrPayloadInput.isEmpty)
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
        }
    }

    private func parseAndConnectQR() {
        guard let url = URL(string: qrPayloadInput),
              let components = URLComponents(url: url, resolvingAgainstBaseURL: true) else {
            print("[PAIRING] Invalid QR Code payload format")
            return
        }
        
        let host = components.queryItems?.first(where: { $0.name == "host" })?.value ?? ""
        let portStr = components.queryItems?.first(where: { $0.name == "port" })?.value ?? "8492"
        let pin = components.queryItems?.first(where: { $0.name == "pin" })?.value ?? ""
        
        let port = UInt16(portStr) ?? 8492
        
        if !host.isEmpty && !pin.isEmpty {
            self.manualHostInput = host
            self.pinInput = pin
            self.manualPortInput = portStr
            engine.startQUICConnection(host: host, port: port, pin: pin)
        } else {
            print("[PAIRING] QR payload missing vital parameters (host, pin)")
        }
    }
}
