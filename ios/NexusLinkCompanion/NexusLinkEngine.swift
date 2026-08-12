// =========================================================================
// iOS Native Audio, mDNS Discovery & QUIC Protocol Engine (Swift / SwiftUI)
// File: ios/NexusLinkCompanion/NexusLinkEngine.swift
// =========================================================================

import Foundation
import AVFoundation
import ReplayKit
import Network
import VideoToolbox

public struct DiscoveredServer: Identifiable {
    public let id = UUID()
    public let name: String
    public let host: String
    public let port: UInt16
}

@MainActor
public class NexusLinkIOSEngine: ObservableObject {
    @Published public var isStreaming: Bool = false
    @Published public var isScreenCapturing: Bool = false
    @Published public var connectionStatus: String = "Disconnected"
    @Published public var discoveredServers: [DiscoveredServer] = []
    @Published public var connectionMode: String = "Wi-Fi"
    @Published public var diagnosticLogs: [String] = ["App Initialized", "Waiting for action..."]
    
    public func log(_ message: String) {
        print(message)
        Task { @MainActor in
            self.diagnosticLogs.append(message)
            if self.diagnosticLogs.count > 100 {
                self.diagnosticLogs.removeFirst()
            }
        }
    }
    
    private var pendingPinCode: String?
    private var nwConnection: NWConnection?
    private var browser: NWBrowser?
    private var audioEngine: AVAudioEngine?
    private var videoEncoder: SwiftVideoToolboxEncoder?
    private var videoPacketizer = SwiftVideoPacketizer()
    private var usbListener: USBTransportListener?
    
    // Dedicated background serial dispatch queues to prevent deadlock and connection crashes
    private let tlsQueue = DispatchQueue(label: "com.nexuslink.tls", qos: .userInitiated)
    private let connectionQueue = DispatchQueue(label: "com.nexuslink.connection", qos: .userInitiated)
    
    public init() {
        startUSBListener()
    }

    private func startUSBListener() {
        let listener = USBTransportListener()
        listener.onStateChanged = { [weak self] status in
            guard let self = self else { return }
            Task { @MainActor in
                self.connectionMode = "USB"
                self.connectionStatus = "Connected via USB"
                print("[USB] ACTIVE STATE RECEIVED")
                // Automatically send HELLO on connect
                self.sendUSBDeviceInfoHandshake()
            }
        }
        listener.onFrameReceived = { [weak self] msgType, payload in
            self?.handleUSBFrame(msgType: msgType, payload: payload)
        }
        self.usbListener = listener
    }
    
    public func clearStaleUSBTransportAndSwitchToWiFi() {
        log("[CLEANUP] Clearing active USB connection and switching connectionMode to Wi-Fi")
        self.connectionMode = "Wi-Fi"
        usbListener?.closeActiveConnection()
    }
    
    /// Step 1: mDNS / Bonjour Discovery to locate Windows PC running NexusLink Server
    public func startBonjourDiscovery() {
        let descriptor = NWBrowser.Descriptor.bonjour(type: "_nexuslink._udp", domain: "local.")
        let parameters = NWParameters.udp
        
        browser = NWBrowser(for: descriptor, using: parameters)
        browser?.browseResultsChangedHandler = { [weak self] results, _ in
            let servers = results.compactMap { result in
                if case let .service(name, _, _, _) = result.endpoint {
                    print("[DISCOVERY] FOUND \(name).local:8492")
                    return DiscoveredServer(name: name, host: "\(name).local", port: 8492)
                }
                return nil
            }
            Task { @MainActor [weak self] in
                self?.discoveredServers = servers
            }
        }
        browser?.start(queue: .main)
        print("[iOS Bonjour] Browsing for Windows PC running _nexuslink._udp...")
    }
    
    /// Step 2: Establish QUIC / TLS 1.3 Transport to Windows PC
    public func startQUICConnection(host: String, port: UInt16, pin: String? = nil) {
        self.pendingPinCode = pin
        self.connectionMode = "Wi-Fi" // Explicitly clear any stale USB transport mode when initiating QUIC
        
        log("[UI] CONNECT BUTTON PRESSED")
        log("[UI] IP = \(host)")
        log("[UI] PORT = \(port)")
        log("[UI] PIN LENGTH = \(pin?.count ?? 0)")
        
        log("[QUIC] Creating NWProtocolQUIC.Options")
        guard let nwPort = NWEndpoint.Port(rawValue: port) else {
            log("[QUIC] ERROR = Invalid Port \(port)")
            return
        }
        let endpoint = NWEndpoint.hostPort(host: NWEndpoint.Host(host), port: nwPort)
        
        log("[QUIC] Configuring ALPN")
        let quicOptions = NWProtocolQUIC.Options(alpn: ["nexuslink-v2"])
        
        log("[QUIC] Configuring datagrams")
        quicOptions.isDatagram = true
        quicOptions.maxDatagramFrameSize = 65536
        
        log("[TLS] Configuring verification callback")
        let securityOptions = quicOptions.securityProtocolOptions
        
        // Execute verify block on a dedicated background queue (tlsQueue) to avoid deadlocking the main queue
        sec_protocol_options_set_verify_block(securityOptions, { [weak self] (sec_protocol_metadata, sec_trust, completionHandler) in
            print("[TLS] VERIFY CALLBACK CALLED")
            Task { @MainActor in
                self?.log("[TLS] VERIFY CALLBACK CALLED")
                self?.log("[QUIC] TLS verification bypass: Trusting self-signed local certificate")
            }
            completionHandler(true)
        }, tlsQueue)
        log("[QUIC] TLS verification bypass handler attached successfully")
        
        log("[QUIC] Creating NWParameters")
        let parameters = NWParameters(quic: quicOptions)
        
        log("[QUIC] Creating NWConnection")
        nwConnection = NWConnection(to: endpoint, using: parameters)
        
        log("[QUIC] Installing state handler")
        nwConnection?.stateUpdateHandler = { [weak self] state in
            guard let self = self else { return }
            
            Task { @MainActor in
                self.log("[QUIC] STATE = \(state)")
                
                switch state {
                case .setup:
                    self.log("[QUIC] STATE setup")
                    self.connectionStatus = "Connecting: Setup"
                case .preparing:
                    self.log("[QUIC] STATE preparing")
                    self.connectionStatus = "Connecting: Preparing QUIC..."
                case .waiting(let error):
                    self.log("[QUIC] STATE waiting")
                    self.log("[QUIC] ERROR = \(error.localizedDescription)")
                    self.connectionStatus = "Connecting: Waiting (\(error.localizedDescription))"
                case .ready:
                    self.log("[QUIC] STATE ready")
                    self.log("[TLS] SUCCESS")
                    self.log("[ALPN] nexuslink-v2")
                    self.connectionStatus = "Connected via Wi-Fi QUIC"
                    self.listenForMessages()
                    self.sendDeviceInfoHandshake()
                    self.sendPing()
                    
                    if let pinCode = self.pendingPinCode {
                        self.initiatePairing(pinCode: pinCode)
                    }
                case .failed(let error):
                    self.log("[QUIC] STATE = failed")
                    self.log("[QUIC] ERROR = \(error.localizedDescription)")
                    self.log("[TLS] FAILURE \(error.localizedDescription)")
                    self.connectionStatus = "Connection Failed: \(error.localizedDescription)"
                case .cancelled:
                    self.log("[QUIC] STATE cancelled")
                    self.connectionStatus = "Disconnected"
                @unknown default:
                    break
                }
            }
        }
        
        log("[QUIC] Installing datagram handler")
        
        log("[QUIC] Calling start()")
        // Start connection on connectionQueue to ensure thread safety and avoid race conditions
        nwConnection?.start(queue: connectionQueue)
    }
    
    private func listenForMessages() {
        guard let connection = nwConnection else { return }
        connection.receiveMessage { [weak self] (content, context, isComplete, error) in
            guard let self = self else { return }
            if let error = error {
                print("[iOS QUIC] Receive error: \(error)")
                return
            }
            
            if let data = content, !data.isEmpty {
                Task { @MainActor in
                    self.handleIncomingData(data)
                }
            }
            
            // Re-register listener immediately on the connection queue to avoid missing messages
            if connection.state == .ready {
                self.listenForMessages()
            }
        }
    }
    
    private func handleIncomingData(_ data: Data) {
        if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
            print("[PAIRING] Server response: \(json)")
            if let type = json["type"] as? String, let payload = json["payload"] as? [String: Any] {
                if type == "PairResponse" {
                    print("[PAIRING] RESPONSE RECEIVED")
                    let success = payload["success"] as? Bool ?? false
                    let reason = payload["reason"] as? String
                    Task { @MainActor in
                        if success {
                            print("[PAIRING] PAIRED")
                            print("[PAIRING] SUCCESS")
                            self.connectionStatus = "Connected & Paired Successfully"
                        } else {
                            print("[PAIRING] FAILED: \(reason ?? "Unknown error")")
                            self.connectionStatus = "Pairing Failed: \(reason ?? "Unknown")"
                        }
                    }
                } else if type == "Pong" {
                    print("[iOS QUIC] Received PONG from server")
                }
            }
        }
    }
    
    /// Step 3: Protocol Handshake (DEVICE_INFO & PING/PONG)
    public func sendDeviceInfoHandshake() {
        print("[PAIRING] HELLO SENT")
        let payload: [String: Any] = [
            "type": "DeviceInfo",
            "payload": [
                "device_name": "iPhone 12",
                "os": "iOS",
                "os_version": "17.1",
                "protocol_version": 2,
                "capabilities": ["microphone", "replaykit", "quic"]
            ]
        ]
        sendJSONMessage(payload)
    }
    
    public func sendPing() {
        let timestamp = UInt64(Date().timeIntervalSince1970 * 1000)
        let payload: [String: Any] = [
            "type": "Ping",
            "payload": [
                "timestamp": timestamp
            ]
        ]
        sendJSONMessage(payload)
    }
    
    public func initiatePairing(pinCode: String) {
        print("[PAIRING] PIN SENT")
        let payload: [String: Any] = [
            "type": "PairRequest",
            "payload": [
                "pin_code": pinCode,
                "device_id": "iphone-12-unique-id"
            ]
        ]
        if connectionMode == "USB" {
            if let data = try? JSONSerialization.data(withJSONObject: payload) {
                usbListener?.writeFrame(msgType: 2, payload: data)
            }
        } else {
            sendJSONMessage(payload)
        }
    }

    private func sendUSBDeviceInfoHandshake() {
        print("[PAIRING] HELLO SENT")
        let payload: [String: Any] = [
            "type": "DeviceInfo",
            "payload": [
                "device_name": "iPhone 12",
                "os": "iOS",
                "os_version": "17.1",
                "protocol_version": 2,
                "capabilities": ["microphone", "replaykit", "usb"]
            ]
        ]
        if let data = try? JSONSerialization.data(withJSONObject: payload) {
            print("[PAIRING] DEVICE INFO SENT")
            self.usbListener?.writeFrame(msgType: 1, payload: data)
        }
    }

    private func handleUSBFrame(msgType: UInt8, payload: Data) {
        switch msgType {
        case 1: // HELLO
            print("[PAIRING] HELLO RECEIVED")
            print("[PAIRING] DEVICE INFO RECEIVED")
            sendUSBDeviceInfoHandshake()
        case 3: // PAIR_RESPONSE
            print("[PAIRING] RESPONSE RECEIVED")
            if let json = try? JSONSerialization.jsonObject(with: payload) as? [String: Any],
               let payloadData = json["payload"] as? [String: Any] {
                let success = payloadData["success"] as? Bool ?? false
                let reason = payloadData["reason"] as? String
                Task { @MainActor in
                    if success {
                        print("[PAIRING] PAIRED")
                        print("[PAIRING] SUCCESS")
                        print("[USB] DEVICE PAIRED")
                        self.connectionStatus = "Connected & Paired Successfully"
                    } else {
                        print("[PAIRING] FAILED: \(reason ?? "Unknown")")
                        self.connectionStatus = "Pairing Failed: \(reason ?? "Unknown")"
                    }
                }
            }
        case 8: // PONG
            print("[iOS USB] Received PONG from server")
        default:
            break
        }
    }
    
    private var audioSequenceNumber: UInt32 = 0
    private var opusEncoder: SwiftOpusEncoder?

    /// Configures iOS AVAudioSession for low-latency native microphone capture
    public func configureAudioSession() -> Bool {
        let session = AVAudioSession.sharedInstance()
        do {
            try session.setCategory(.playAndRecord, mode: .measurement, options: [.allowBluetooth, .defaultToSpeaker])
            try session.setPreferredSampleRate(48000)
            try session.setPreferredIOBufferDuration(0.020) // 20ms frame target low latency
            try session.setActive(true)
            return true
        } catch {
            print("[iOS AudioSession] Error setting up session: \(error)")
            return false
        }
    }
    
    /// Capture iPhone Audio & stream over Low-Latency UDP/QUIC to Windows WASAPI
    public func startAudioEngineCapture() {
        guard configureAudioSession() else {
            print("[iOS NexusLink] Failed to activate AVAudioSession")
            return
        }

        audioEngine = AVAudioEngine()
        guard let audioEngine = audioEngine else { return }
        
        let inputNode = audioEngine.inputNode
        let bus = 0
        let nativeFormat = inputNode.outputFormat(forBus: bus)
        
        // Initialize Native Swift AudioToolbox Opus Encoder at 48kHz
        opusEncoder = SwiftOpusEncoder(sampleRate: 48000.0, channels: UInt32(nativeFormat.channelCount))
        
        // Target 48kHz PCM Int16 format
        guard let fmt48k = AVAudioFormat(commonFormat: .pcmFormatInt16, sampleRate: 48000, channels: nativeFormat.channelCount, interleaved: true) else {
            print("[iOS Audio] Could not create 48kHz target format")
            return
        }

        audioSequenceNumber = 0
        
        inputNode.installTap(onBus: bus, bufferSize: 960, format: fmt48k) { [weak self] (buffer, time) in
            guard let self = self else { return }
            let pcmData = self.extractPCMData(from: buffer)
            if !pcmData.isEmpty {
                let packet = self.buildBinaryAudioPacket(pcmData: pcmData, channels: UInt8(nativeFormat.channelCount))
                self.sendAudioPayload(packet)
            }
        }
        
        do {
            try audioEngine.start()
            isStreaming = true
            print("[iOS NexusLink] Native AVAudioEngine started with Opus Encoder at 48kHz")
        } catch {
            print("[iOS NexusLink] AVAudioEngine start error: \(error)")
        }
    }

    public func stopAudioEngineCapture() {
        audioEngine?.inputNode.removeTap(onBus: 0)
        audioEngine?.stop()
        audioEngine = nil
        opusEncoder = nil
        isStreaming = false
        print("[iOS NexusLink] Audio engine stopped")
    }

    /// Construct structured low-latency binary audio frame
    /// Header layout (21 bytes):
    /// [0]: 0x41 ('A' Audio tag)
    /// [1..4]: Sequence Number (UInt32 BE)
    /// [5..12]: Timestamp MS (UInt64 BE)
    /// [13..16]: Sample Rate 48000 (UInt32 BE)
    /// [17]: Channel Count (UInt8)
    /// [18]: Codec Type (0 = PCM Int16, 1 = Opus)
    /// [19..20]: Payload Length (UInt16 BE)
    /// [21..]: Audio Payload (Opus or PCM)
    private func buildBinaryAudioPacket(pcmData: Data, channels: UInt8) -> Data {
        var packet = Data()
        packet.append(0x41) // 'A'
        
        audioSequenceNumber &+= 1
        var seqBE = audioSequenceNumber.bigEndian
        packet.append(Data(bytes: &seqBE, count: 4))

        var tsBE = UInt64(Date().timeIntervalSince1970 * 1000).bigEndian
        packet.append(Data(bytes: &tsBE, count: 8))

        var srBE = UInt32(48000).bigEndian
        packet.append(Data(bytes: &srBE, count: 4))

        packet.append(channels)

        // Attempt Opus encoding
        let opusData = opusEncoder?.encode(pcmData: pcmData)
        let codecByte: UInt8 = (opusData != nil && !(opusData!.isEmpty)) ? 0x01 : 0x00
        let payload = opusData ?? pcmData

        packet.append(codecByte) // 0x01 = Opus, 0x00 = PCM Int16 Debug

        var lenBE = UInt16(payload.count).bigEndian
        packet.append(Data(bytes: &lenBE, count: 2))

        packet.append(payload)
        return packet
    }
    
    private func sendJSONMessage(_ jsonDict: [String: Any]) {
        guard let data = try? JSONSerialization.data(withJSONObject: jsonDict) else { return }
        nwConnection?.send(content: data, completion: .contentProcessed({ error in
            if let error = error {
                print("[iOS QUIC] Send frame error: \(error)")
            }
        }))
    }
    
    private func extractPCMData(from buffer: AVAudioPCMBuffer) -> Data {
        guard let channelData = buffer.int16ChannelData?[0] else { return Data() }
        let frameLength = Int(buffer.frameLength)
        return Data(bytes: channelData, count: frameLength * MemoryLayout<Int16>.size)
    }
    
    private func sendAudioPayload(_ data: Data) {
        if connectionMode == "USB" {
            usbListener?.writeFrame(msgType: 4, payload: data)
        } else {
            nwConnection?.send(content: data, completion: .contentProcessed({ error in
                if let error = error {
                    print("[iOS Audio Transport] Send error: \(error)")
                }
            }))
        }
    }

    private func sendVideoPayload(_ data: Data) {
        if connectionMode == "USB" {
            usbListener?.writeFrame(msgType: 5, payload: data)
        } else {
            nwConnection?.send(content: data, completion: .contentProcessed({ error in
                if let error = error {
                    print("[iOS Video Transport] Send error: \(error)")
                }
            }))
        }
    }

    /// Native ReplayKit Screen Capture & Real-time VideoToolbox H.264 Encoder Pipeline
    public func startScreenCapture() {
        let recorder = RPScreenRecorder.shared()
        guard recorder.isAvailable else {
            print("[iOS ReplayKit] Screen recorder not available")
            return
        }

        // Initialize Hardware VideoToolbox H.264 Encoder at 30 FPS Realtime
        videoEncoder = SwiftVideoToolboxEncoder(width: 1920, height: 1080)
        videoEncoder?.onEncodedFrame = { [weak self] frameData, isKeyframe, ptsMs in
            guard let self = self else { return }
            let packets = self.videoPacketizer.packetize(frameData: frameData, isKeyframe: isKeyframe, ptsMs: ptsMs, codec: 0)
            for packet in packets {
                self.sendVideoPayload(packet)
            }
            print("[iOS VideoToolbox] Encoded & Packetized H.264 Frame len=\(frameData.count) keyframe=\(isKeyframe) packets=\(packets.count) pts=\(ptsMs) ms")
        }

        recorder.startCapture(handler: { [weak self] (sampleBuffer, bufferType, error) in
            if let error = error {
                print("[iOS ReplayKit] Capture handler error: \(error)")
                return
            }

            guard bufferType == .video, let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else {
                return
            }

            let pts = CMSampleBufferGetPresentationTimeStamp(sampleBuffer)
            self?.videoEncoder?.encode(pixelBuffer: pixelBuffer, presentationTimeStamp: pts)

        }) { [weak self] error in
            if let error = error {
                print("[iOS ReplayKit] Failed to start screen capture: \(error)")
            } else {
                Task { @MainActor in
                    self?.isScreenCapturing = true
                    print("[iOS ReplayKit] Screen capture active @ 30 FPS")
                }
            }
        }
    }

    public func stopScreenCapture() {
        RPScreenRecorder.shared().stopCapture { [weak self] error in
            Task { @MainActor in
                self?.isScreenCapturing = false
                self?.videoEncoder?.invalidate()
                self?.videoEncoder = nil
                print("[iOS ReplayKit] Screen capture stopped")
            }
        }
    }
}

// =========================================================================
// Native iOS Swift Opus Encoder via AudioToolbox / AudioConverter
// =========================================================================
public class SwiftOpusEncoder {
    private var audioConverter: AudioConverterRef?
    private var sampleRate: Float64 = 48000.0
    private var channels: UInt32 = 2

    public init?(sampleRate: Float64 = 48000.0, channels: UInt32 = 2) {
        self.sampleRate = sampleRate
        self.channels = channels

        var inFormat = AudioStreamBasicDescription(
            mSampleRate: sampleRate,
            mFormatID: kAudioFormatLinearPCM,
            mFormatFlags: kAudioFormatFlagIsSignedInteger | kAudioFormatFlagIsPacked,
            mBytesPerPacket: 2 * channels,
            mFramesPerPacket: 1,
            mBytesPerFrame: 2 * channels,
            mChannelsPerFrame: channels,
            mBitsPerChannel: 16,
            mReserved: 0
        )

        var outFormat = AudioStreamBasicDescription(
            mSampleRate: sampleRate,
            mFormatID: kAudioFormatOpus,
            mFormatFlags: 0,
            mBytesPerPacket: 0,
            mFramesPerPacket: 960, // 20ms at 48kHz
            mBytesPerFrame: 0,
            mChannelsPerFrame: channels,
            mBitsPerChannel: 0,
            mReserved: 0
        )

        let status = AudioConverterNew(&inFormat, &outFormat, &audioConverter)
        if status != noErr {
            print("[iOS Opus] AudioConverterNew status: \(status) (Requires Xcode physical device runtime)")
        }
    }

    deinit {
        if let converter = audioConverter {
            AudioConverterDispose(converter)
        }
    }

    public func encode(pcmData: Data) -> Data? {
        guard let converter = audioConverter else { return nil }
        
        var outputBuffer = [UInt8](repeating: 0, count: 1275) // max opus frame size

        struct UserData {
            var data: Data
            var packetSize: UInt32
        }

        var userData = UserData(data: pcmData, packetSize: UInt32(pcmData.count))

        let callback: AudioConverterComplexInputDataProc = { (
            inAudioConverter,
            ioNumberDataPackets,
            ioData,
            outDataPacketDescription,
            inUserData
        ) -> OSStatus in
            guard let inUserData = inUserData else { return noErr }
            let userData = inUserData.assumingMemoryBound(to: UserData.self)
            
            if userData.pointee.packetSize == 0 {
                ioNumberDataPackets.pointee = 0
                return noErr
            }

            userData.pointee.data.withUnsafeBytes { rawPtr in
                if let baseAddress = rawPtr.baseAddress {
                    ioData.pointee.mBuffers.mData = UnsafeMutableRawPointer(mutating: baseAddress)
                    ioData.pointee.mBuffers.mDataByteSize = userData.pointee.packetSize
                    ioData.pointee.mBuffers.mNumberChannels = 2
                }
            }

            ioNumberDataPackets.pointee = 960
            userData.pointee.packetSize = 0
            return noErr
        }

        var ioOutputDataPacketSize: UInt32 = 1
        var producedSize = 0

        let status = outputBuffer.withUnsafeMutableBytes { rawBufPtr -> OSStatus in
            var outputBufferList = AudioBufferList(
                mNumberBuffers: 1,
                mBuffers: (AudioBuffer(
                    mNumberChannels: channels,
                    mDataByteSize: UInt32(rawBufPtr.count),
                    mData: rawBufPtr.baseAddress
                ))
            )

            let res = withUnsafeMutablePointer(to: &userData) { userDataPtr in
                AudioConverterFillComplexBuffer(
                    converter,
                    callback,
                    userDataPtr,
                    &ioOutputDataPacketSize,
                    &outputBufferList,
                    nil
                )
            }
            producedSize = Int(outputBufferList.mBuffers.mDataByteSize)
            return res
        }

        if status == noErr && ioOutputDataPacketSize > 0 && producedSize > 0 {
            return Data(bytes: outputBuffer, count: producedSize)
        }
        return nil
    }
}

// =========================================================================
// Native iOS Swift Hardware H.264 Encoder via VideoToolbox
// =========================================================================
public class SwiftVideoToolboxEncoder {
    private var session: VTCompressionSession?
    private var width: Int32 = 1920
    private var height: Int32 = 1080
    private var isConfigured = false
    public var onEncodedFrame: ((Data, Bool, UInt64) -> Void)?

    public init(width: Int32 = 1920, height: Int32 = 1080) {
        self.width = width
        self.height = height
        setupSession()
    }

    private func setupSession() {
        let callback: VTCompressionOutputCallback = { (outputCallbackRefCon, sourceFrameRefCon, status, infoFlags, sampleBuffer) in
            guard status == noErr, let sampleBuffer = sampleBuffer, let refCon = outputCallbackRefCon else { return }
            let encoder = Unmanaged<SwiftVideoToolboxEncoder>.fromOpaque(refCon).takeUnretainedValue()

            // Check if frame is a Keyframe (IDR)
            let attachments = CMSampleBufferGetSampleAttachmentsArray(sampleBuffer, createIfNecessary: false) as? [[CFString: Any]]
            let isKeyframe = !(attachments?.first?[kCMSampleAttachmentKey_NotSync] as? Bool ?? false)

            guard let dataBuffer = CMSampleBufferGetDataBuffer(sampleBuffer) else { return }

            var lengthAtOffset = 0
            var totalLength = 0
            var dataPointer: UnsafeMutablePointer<Int8>?

            let blockStatus = CMBlockBufferGetDataPointer(
                dataBuffer,
                atOffset: 0,
                lengthAtOffsetOut: &lengthAtOffset,
                totalLengthOut: &totalLength,
                dataPointerOut: &dataPointer
            )

            guard blockStatus == noErr, let pointer = dataPointer else { return }

            var packetData = Data()

            // Extract SPS & PPS headers on IDR Keyframe
            if isKeyframe, let formatDesc = CMSampleBufferGetFormatDescription(sampleBuffer) {
                var spsSize = 0
                var spsCount = 0
                var spsHeader: UnsafePointer<UInt8>?
                if CMVideoFormatDescriptionGetH264ParameterSetAtIndex(formatDesc, parameterSetIndex: 0, parameterSetPointerOut: &spsHeader, parameterSetSizeOut: &spsSize, parameterSetCountOut: &spsCount, nalUnitHeaderLengthOut: nil) == noErr, let spsHeader = spsHeader {
                    packetData.append(contentsOf: [0x00, 0x00, 0x00, 0x01]) // Annex-B Start Code
                    packetData.append(spsHeader, count: spsSize)
                }

                var ppsSize = 0
                var ppsCount = 0
                var ppsHeader: UnsafePointer<UInt8>?
                if CMVideoFormatDescriptionGetH264ParameterSetAtIndex(formatDesc, parameterSetIndex: 1, parameterSetPointerOut: &ppsHeader, parameterSetSizeOut: &ppsSize, parameterSetCountOut: &ppsCount, nalUnitHeaderLengthOut: nil) == noErr, let ppsHeader = ppsHeader {
                    packetData.append(contentsOf: [0x00, 0x00, 0x00, 0x01]) // Annex-B Start Code
                    packetData.append(ppsHeader, count: ppsSize)
                }
            }

            // Convert length-prefixed AVCC NAL units to Annex-B start codes [0x00, 0x00, 0x00, 0x01]
            var bufferOffset = 0
            let avccHeaderLength = 4

            while bufferOffset < totalLength - avccHeaderLength {
                var nalLength: UInt32 = 0
                memcpy(&nalLength, pointer.advanced(by: bufferOffset), avccHeaderLength)
                nalLength = CFSwapInt32BigToHost(nalLength)

                bufferOffset += avccHeaderLength

                if bufferOffset + Int(nalLength) <= totalLength {
                    packetData.append(contentsOf: [0x00, 0x00, 0x00, 0x01])
                    let nalBytes = UnsafeRawPointer(pointer.advanced(by: bufferOffset))
                    packetData.append(nalBytes.assumingMemoryBound(to: UInt8.self), count: Int(nalLength))
                    bufferOffset += Int(nalLength)
                } else {
                    break
                }
            }

            let ptsMs = UInt64(UInt(bitPattern: sourceFrameRefCon))
            encoder.onEncodedFrame?(packetData, isKeyframe, ptsMs)
        }

        let status = VTCompressionSessionCreate(
            allocator: kCFAllocatorDefault,
            width: width,
            height: height,
            codecType: kCMVideoCodecType_H264,
            encoderSpecification: nil,
            imageBufferAttributes: nil,
            compressedDataAllocator: nil,
            outputCallback: callback,
            refcon: Unmanaged.passUnretained(self).toOpaque(),
            compressionSessionOut: &session
        )

        guard status == noErr, let session = session else {
            print("[iOS VideoToolbox] VTCompressionSessionCreate status: \(status) (Requires Xcode physical device runtime)")
            return
        }

        // Configure Low-Latency Real-time Properties
        VTSessionSetProperty(session, key: kVTCompressionPropertyKey_RealTime, value: kCFBooleanTrue)
        VTSessionSetProperty(session, key: kVTCompressionPropertyKey_AllowFrameReordering, value: kCFBooleanFalse)
        VTSessionSetProperty(session, key: kVTCompressionPropertyKey_ProfileLevel, value: kVTProfileLevel_H264_Main_AutoLevel)
        VTSessionSetProperty(session, key: kVTCompressionPropertyKey_ExpectedFrameRate, value: 30 as CFNumber)
        VTSessionSetProperty(session, key: kVTCompressionPropertyKey_MaxKeyFrameInterval, value: 60 as CFNumber)

        let bitrate: Int32 = 4_000_000
        VTSessionSetProperty(session, key: kVTCompressionPropertyKey_AverageBitRate, value: bitrate as CFNumber)

        VTCompressionSessionPrepareToEncodeFrames(session)
        isConfigured = true
        print("[iOS VideoToolbox] Native H.264 Encoder initialized at \(width)x\(height) @ 30 FPS Realtime")
    }

    public func encode(pixelBuffer: CVPixelBuffer, presentationTimeStamp: CMTime) {
        guard let session = session, isConfigured else { return }
        let ptsMs = UInt64(CMTimeGetSeconds(presentationTimeStamp) * 1000)

        VTCompressionSessionEncodeFrame(
            session,
            imageBuffer: pixelBuffer,
            presentationTimeStamp: presentationTimeStamp,
            duration: .invalid,
            frameProperties: nil,
            sourceFrameRefcon: UnsafeMutableRawPointer(bitPattern: UInt(ptsMs)),
            infoFlagsOut: nil
        )
    }

    public func invalidate() {
        if let session = session {
            VTCompressionSessionInvalidate(session)
            self.session = nil
        }
        isConfigured = false
    }

    deinit {
        invalidate()
    }
}

// =========================================================================
// Native iOS Swift Video Datagram Packetizer for Low-Latency Streaming
// =========================================================================
public class SwiftVideoPacketizer {
    private var currentFrameId: UInt64 = 0
    private let maxPayloadPerPacket: Int = 1150 // MTU Safe payload

    public init() {}

    /// Chunks raw H.264/HEVC NAL frame into 32-byte header binary wire format datagrams
    public func packetize(frameData: Data, isKeyframe: Bool, ptsMs: UInt64, codec: UInt8 = 0) -> [Data] {
        currentFrameId &+= 1
        let frameId = currentFrameId
        let totalBytes = frameData.count
        
        let packetCount = (totalBytes + maxPayloadPerPacket - 1) / maxPayloadPerPacket
        guard packetCount > 0 else { return [] }
        
        var packets: [Data] = []
        
        for idx in 0..<packetCount {
            let offset = idx * maxPayloadPerPacket
            let length = min(maxPayloadPerPacket, totalBytes - offset)
            let chunk = frameData.subdata(in: offset..<(offset + length))
            
            var packet = Data()
            packet.append(0x56) // [0] Magic 'V'
            packet.append(0x01) // [1] Version 1
            
            var flags: UInt8 = 0
            if isKeyframe { flags |= 0x01 }
            if idx == 0 { flags |= 0x02 }
            if idx == packetCount - 1 { flags |= 0x04 }
            packet.append(flags) // [2] Flags
            
            packet.append(codec) // [3] Codec (0 = H264)
            
            var frameIdBE = frameId.bigEndian
            packet.append(Data(bytes: &frameIdBE, count: 8))
            
            var idxBE = UInt32(idx).bigEndian
            packet.append(Data(bytes: &idxBE, count: 4))
            
            var countBE = UInt32(packetCount).bigEndian
            packet.append(Data(bytes: &countBE, count: 4))
            
            var ptsBE = ptsMs.bigEndian
            packet.append(Data(bytes: &ptsBE, count: 8))
            
            var lenBE = UInt32(chunk.count).bigEndian
            packet.append(Data(bytes: &lenBE, count: 4))
            
            packet.append(chunk)
            packets.append(packet)
        }
        
        return packets
    }
}

class USBTransportListener {
    private var listener: NWListener?
    private var connection: NWConnection?
    var onFrameReceived: ((UInt8, Data) -> Void)?
    var onStateChanged: ((String) -> Void)?
    
    func closeActiveConnection() {
        print("[USB] Closing active tunnel connection...")
        connection?.cancel()
        connection = nil
    }
    
    init() {
        startListener()
    }
    
    func startListener() {
        do {
            let parameters = NWParameters.tcp
            let port = NWEndpoint.Port(rawValue: 8493)!
            listener = try NWListener(using: parameters, on: port)
            
            listener?.stateUpdateHandler = { state in
                print("[USB] LISTENER STATE: \(state)")
            }
            
            listener?.newConnectionHandler = { [weak self] conn in
                print("[USB] CONNECTION ACCEPTED")
                self?.handleNewConnection(conn)
            }
            
            listener?.start(queue: .main)
            print("[USB] LISTENER STARTED on port 8493")
        } catch {
            print("[USB] Listener start error: \(error)")
        }
    }
    
    private func handleNewConnection(_ conn: NWConnection) {
        self.connection = conn
        conn.stateUpdateHandler = { [weak self] state in
            print("[USB] Tunnel Connection State: \(state)")
            if state == .ready {
                self?.onStateChanged?("USB Connected")
                self?.readNextFrame()
            }
        }
        conn.start(queue: .main)
    }
    
    private func readNextFrame() {
        guard let conn = connection else { return }
        
        conn.receive(minimumIncompleteLength: 4, maximumLength: 4) { [weak self] content, context, isComplete, error in
            if let error = error {
                print("[USB] Receive length error: \(error)")
                return
            }
            guard let data = content, data.count == 4 else {
                if isComplete {
                    print("[USB] Connection closed by peer")
                }
                return
            }
            
            let totalLen = data.withUnsafeBytes { $0.load(as: UInt32.self).bigEndian }
            guard totalLen >= 1 else { return }
            
            let expectedBytes = Int(totalLen)
            conn.receive(minimumIncompleteLength: expectedBytes, maximumLength: expectedBytes) { content, context, isComplete, error in
                if let error = error {
                    print("[USB] Receive payload error: \(error)")
                    return
                }
                guard let frameData = content, frameData.count == expectedBytes else { return }
                
                let msgType = frameData[0]
                let payload = frameData.subdata(in: 1..<frameData.count)
                
                self?.onFrameReceived?(msgType, payload)
                self?.readNextFrame()
            }
        }
    }
    
    func writeFrame(msgType: UInt8, payload: Data) {
        guard let conn = connection else { return }
        var packet = Data()
        let totalLen = UInt32(1 + payload.count).bigEndian
        withUnsafeBytes(of: totalLen) { packet.append(contentsOf: $0) }
        packet.append(msgType)
        packet.append(payload)
        
        conn.send(content: packet, completion: .contentProcessed({ error in
            if let error = error {
                print("[USB] Send frame error: \(error)")
            }
        }))
    }
}

