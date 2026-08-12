import SwiftUI

struct ContentView: View {
    @EnvironmentObject var engine: NexusLinkIOSEngine
    
    @State private var pinInput: String = ""
    @State private var manualHostInput: String = ""
    @State private var manualPortInput: String = "8492"
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    
                    // Connection Status
                    VStack(spacing: 12) {
                        Image(systemName: "cable.connector")
                            .font(.system(size: 48))
                            .foregroundColor(.blue)
                            .padding(.bottom, 4)
                        
                        Text("USB Connection")
                            .font(.title2)
                            .fontWeight(.bold)
                        
                        Text(engine.connectionStatus.contains("Connected") || engine.connectionStatus.contains("Successfully") ? "USB Network:\nConnected" : "USB Connection:\nWaiting for USB network...")
                            .font(.headline)
                            .foregroundColor(engine.connectionStatus.contains("Connected") || engine.connectionStatus.contains("Successfully") ? .green : .orange)
                            .multilineTextAlignment(.center)
                    }
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(Color.blue.opacity(0.1))
                    .cornerRadius(16)
                    
                    // Input Form
                    VStack(alignment: .leading, spacing: 16) {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Windows USB IP")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                            TextField("e.g. 172.20.10.2", text: $manualHostInput)
                                .textFieldStyle(.roundedBorder)
                                .keyboardType(.numbersAndPunctuation)
                        }
                        
                        VStack(alignment: .leading, spacing: 8) {
                            Text("QUIC Port")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                            TextField("8492", text: $manualPortInput)
                                .textFieldStyle(.roundedBorder)
                                .keyboardType(.numberPad)
                        }
                        
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Pairing PIN")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                            TextField("6 digits", text: $pinInput)
                                .textFieldStyle(.roundedBorder)
                                .keyboardType(.numberPad)
                        }
                        
                        Button(action: {
                            let host = manualHostInput.isEmpty ? "172.20.10.2" : manualHostInput
                            let port = UInt16(manualPortInput) ?? 8492
                            
                            engine.log("[USB] NETWORK PATH AVAILABLE")
                            engine.log("[CONNECT] \(host):\(port)")
                            
                            engine.startQUICConnection(host: host, port: port, pin: pinInput)
                        }) {
                            Label("Connect via USB", systemImage: "cable.connector")
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(pinInput.count == 6 && !manualHostInput.isEmpty ? Color.blue : Color.gray.opacity(0.4))
                                .foregroundColor(.white)
                                .cornerRadius(12)
                        }
                        .disabled(pinInput.count != 6 || manualHostInput.isEmpty)
                    }
                    .padding()
                    .background(Color.secondary.opacity(0.05))
                    .cornerRadius(16)
                    
                    // Logs
                    VStack(alignment: .leading, spacing: 6) {
                        HStack {
                            Text("Real-Time Diagnostics")
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
                    
                    Spacer()
                }
                .padding()
            }
            .navigationTitle("NexusLink Pro")
        }
    }
}
