// =========================================================================
// NexusLink iOS Companion - Main User Interface (USB-ONLY MODE)
// File: ios/NexusLinkCompanion/ContentView.swift
// =========================================================================

import SwiftUI

struct ContentView: View {
    @EnvironmentObject var engine: NexusLinkIOSEngine
    @State private var pinInput: String = ""
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Header Status
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Circle()
                                .fill(engine.connectionStatus.contains("Successfully") || engine.connectionStatus.contains("Connected") ? Color.green : (engine.connectionStatus.contains("Waiting") ? Color.orange : Color.red))
                                .frame(width: 12, height: 12)
                            Text(engine.connectionStatus)
                                .font(.headline)
                            Spacer()
                        }
                        
                        HStack {
                            Text("Connection Mode:")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                            Text("USB ONLY")
                                .font(.subheadline)
                                .bold()
                                .foregroundColor(.blue)
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

                    // USB Connection Status Block
                    VStack(alignment: .leading, spacing: 10) {
                        HStack {
                            Image(systemName: engine.usbNetworkAvailable ? "usb.plug.fill" : "usb.plug")
                                .foregroundColor(engine.usbNetworkAvailable ? .green : .orange)
                            Text("USB Connection")
                                .font(.headline)
                            Spacer()
                        }
                        
                        if engine.usbNetworkAvailable {
                            VStack(alignment: .leading, spacing: 4) {
                                HStack {
                                    Text("USB Network:")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                    Text("Connected")
                                        .font(.caption)
                                        .bold()
                                        .foregroundColor(.green)
                                    Spacer()
                                }
                                
                                HStack {
                                    Text("Windows IP:")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                    Text(engine.detectedWindowsIP)
                                        .font(.caption)
                                        .bold()
                                        .foregroundColor(.blue)
                                    Spacer()
                                }
                                
                                HStack {
                                    Text("Port:")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                    Text("8492")
                                        .font(.caption)
                                        .bold()
                                    Spacer()
                                }
                            }
                            .padding(8)
                            .background(Color.green.opacity(0.1))
                            .cornerRadius(8)
                        } else {
                            Text("Waiting for USB network...")
                                .font(.caption)
                                .foregroundColor(.orange)
                                .padding(.vertical, 8)
                        }
                    }
                    .padding()
                    .background(Color.blue.opacity(0.05))
                    .cornerRadius(12)

                    // Pairing PIN Input
                    VStack(alignment: .leading, spacing: 6) {
                        Text("Pairing PIN (Enter 6-digit PIN from Windows)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        TextField("6-Digit PIN (e.g. 901629)", text: $pinInput)
                            .textFieldStyle(.roundedBorder)
                            .keyboardType(.numberPad)
                    }
                    .padding()
                    .background(Color.secondary.opacity(0.1))
                    .cornerRadius(12)

                    // Connect Button
                    Button(action: {
                        connectViaUSB(pin: pinInput)
                    }) {
                        Label("Connect via USB", systemImage: "link")
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(pinInput.count == 6 && engine.usbNetworkAvailable ? Color.blue : Color.gray.opacity(0.4))
                            .foregroundColor(pinInput.count == 6 && engine.usbNetworkAvailable ? Color.white : Color.secondary)
                            .cornerRadius(12)
                    }
                    .disabled(pinInput.count != 6 || !engine.usbNetworkAvailable)
                    
                    Spacer()
                }
                .padding()
            }
            .navigationTitle("NexusLink Pro")
            .onAppear {
                engine.startUSBDetection()
            }
        }
    }
    
    private func connectViaUSB(pin: String) {
        guard engine.usbNetworkAvailable else {
            engine.log("[CONNECT] USB network not available")
            return
        }
        
        let host = engine.detectedWindowsIP.isEmpty ? "172.20.10.1" : engine.detectedWindowsIP
        let port: UInt16 = 8492
        
        engine.log("[CONNECT] Initiating USB connection to \(host):\(port)")
        engine.startQUICConnection(host: host, port: port, pin: pin, viaUSB: true)
    }
}
