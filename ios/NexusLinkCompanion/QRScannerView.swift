// =========================================================================
// NexusLink iOS Companion - AVFoundation QR Code Scanner
// File: ios/NexusLinkCompanion/QRScannerView.swift
// =========================================================================

import SwiftUI
import AVFoundation
import AudioToolbox

public struct QRScannerView: UIViewControllerRepresentable {
    public var didFindCode: (String) -> Void
    
    public init(didFindCode: @escaping (String) -> Void) {
        self.didFindCode = didFindCode
    }
    
    public func makeUIViewController(context: Context) -> ScannerViewController {
        let controller = ScannerViewController()
        controller.delegate = context.coordinator
        return controller
    }
    
    public func updateUIViewController(_ uiViewController: ScannerViewController, context: Context) {}
    
    public func makeCoordinator() -> Coordinator {
        Coordinator(didFindCode: didFindCode)
    }
    
    public class Coordinator: NSObject, ScannerViewControllerDelegate {
        var didFindCode: (String) -> Void
        
        init(didFindCode: @escaping (String) -> Void) {
            self.didFindCode = didFindCode
        }
        
        public func scannerViewController(_ controller: ScannerViewController, didDetectCode code: String) {
            didFindCode(code)
        }
    }
}

public protocol ScannerViewControllerDelegate: AnyObject {
    func scannerViewController(_ controller: ScannerViewController, didDetectCode code: String)
}

public class ScannerViewController: UIViewController, AVCaptureMetadataOutputObjectsDelegate {
    public weak var delegate: ScannerViewControllerDelegate?
    var captureSession: AVCaptureSession?
    var previewLayer: AVCaptureVideoPreviewLayer?
    
    public override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black
        setupCaptureSession()
    }
    
    private func setupCaptureSession() {
        #if targetEnvironment(simulator)
        showPlaceholder(message: "Camera not available in iOS Simulator")
        return
        #endif
        
        let session = AVCaptureSession()
        self.captureSession = session
        
        guard let videoCaptureDevice = AVCaptureDevice.default(for: .video) else {
            showPlaceholder(message: "Failed to access default camera device")
            return
        }
        
        let videoInput: AVCaptureDeviceInput
        do {
            videoInput = try AVCaptureDeviceInput(device: videoCaptureDevice)
        } catch {
            showPlaceholder(message: "Camera input error: \(error.localizedDescription)")
            return
        }
        
        if session.canAddInput(videoInput) {
            session.addInput(videoInput)
        } else {
            showPlaceholder(message: "Failed to add camera input to session")
            return
        }
        
        let metadataOutput = AVCaptureMetadataOutput()
        if session.canAddOutput(metadataOutput) {
            session.addOutput(metadataOutput)
            metadataOutput.setMetadataObjectsDelegate(self, queue: DispatchQueue.main)
            metadataOutput.metadataObjectTypes = [.qr]
        } else {
            showPlaceholder(message: "Failed to add QR metadata output to session")
            return
        }
        
        let previewLayer = AVCaptureVideoPreviewLayer(session: session)
        previewLayer.frame = view.layer.bounds
        previewLayer.videoGravity = .resizeAspectFill
        view.layer.addSublayer(previewLayer)
        self.previewLayer = previewLayer
        
        // Run capture session on background thread
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            session.startRunning()
        }
    }
    
    private func showPlaceholder(message: String) {
        let label = UILabel()
        label.text = message
        label.textColor = .white
        label.textAlignment = .center
        label.numberOfLines = 0
        label.font = .systemFont(ofSize: 14, weight: .medium)
        label.frame = view.bounds
        label.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(label)
    }
    
    public override func viewWillLayoutSubviews() {
        super.viewWillLayoutSubviews()
        previewLayer?.frame = view.bounds
    }
    
    public override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        if let session = captureSession, !session.isRunning {
            DispatchQueue.global(qos: .userInitiated).async {
                session.startRunning()
            }
        }
    }
    
    public override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        if let session = captureSession, session.isRunning {
            session.stopRunning()
        }
    }
    
    public func metadataOutput(_ output: AVCaptureMetadataOutput, didOutput metadataObjects: [AVMetadataObject], from connection: AVCaptureConnection) {
        guard let metadataObject = metadataObjects.first,
              let readableObject = metadataObject as? AVMetadataMachineReadableCodeObject,
              let stringValue = readableObject.stringValue else {
            return
        }
        
        // Haptic feedback for successful scan
        AudioServicesPlaySystemSound(SystemSoundID(kSystemSoundID_Vibrate))
        
        // Stop scanning temporarily
        captureSession?.stopRunning()
        
        delegate?.scannerViewController(self, didDetectCode: stringValue)
    }
}
