// =========================================================================
// NexusLink iOS Companion - Main Entry Point
// File: ios/NexusLinkCompanion/App.swift
// =========================================================================

import SwiftUI

@main
struct NexusLinkCompanionApp: App {
    @StateObject private var engine = NexusLinkIOSEngine()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(engine)
                .onOpenURL { url in
                    if url.scheme == "nexuslink" && url.host == "pair" {
                        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false) else { return }
                        var targetHost = ""
                        var targetPort: UInt16 = 8492
                        var pin = ""
                        
                        for queryItem in components.queryItems ?? [] {
                            if queryItem.name == "host" {
                                targetHost = queryItem.value ?? ""
                            }
                            if queryItem.name == "port" {
                                targetPort = UInt16(queryItem.value ?? "8492") ?? 8492
                            }
                            if queryItem.name == "pin" {
                                pin = queryItem.value ?? ""
                            }
                        }
                        
                        if !targetHost.isEmpty && !pin.isEmpty {
                            engine.startQUICConnection(host: targetHost, port: targetPort)
                            engine.initiatePairing(pinCode: pin)
                        }
                    }
                }
        }
    }
}
