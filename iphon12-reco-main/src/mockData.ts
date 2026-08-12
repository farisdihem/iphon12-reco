import { DeviceInfo, AudioSettings, VideoSettings, FileTransferItem, TelemetryPoint } from './types';

export const INITIAL_DEVICES: DeviceInfo[] = [
  {
    id: 'dev_iphone_16',
    name: 'iPhone 16 Pro Max',
    model: 'A3296',
    os: 'iOS',
    osVersion: '18.2',
    batteryLevel: 88,
    isCharging: true,
    connectionType: 'wifi_direct',
    ipAddress: '192.168.1.189',
    wifiStandard: 'Wi-Fi 7 (802.11be)',
    signalDbm: -45,
    usbSpeed: 'USB-C 10 Gbps',
    isTrusted: true,
    isPaired: true,
    isConnected: true,
    lastConnected: 'Active Now',
    macAddress: '9C:3F:11:02:AA:DF'
  },
  {
    id: 'dev_iphone_15',
    name: 'iPhone 15 Pro',
    model: 'A3102',
    os: 'iOS',
    osVersion: '17.5',
    batteryLevel: 65,
    isCharging: false,
    connectionType: 'wifi_lan',
    ipAddress: '192.168.1.142',
    wifiStandard: 'Wi-Fi 6E (802.11ax)',
    signalDbm: -58,
    usbSpeed: 'USB-C 10 Gbps',
    isTrusted: true,
    isPaired: true,
    isConnected: false,
    lastConnected: '15 minutes ago',
    macAddress: '7A:4E:21:88:90:BC'
  }
];

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  profile: 'high_quality',
  codec: 'opus',
  sampleRate: 48000,
  bitrateKbps: 160,
  channels: 2,
  frameDurationMs: 10,
  bufferSizeMs: 12,
  jitterBufferMs: 5,
  adaptiveBitrate: true,
  packetLossConcealment: true,
  phoneMicToPc: true,
  pcAudioToPhoneSpeaker: false,
  phoneSpeakerToPcHeadphones: true,
};

export const DEFAULT_VIDEO_SETTINGS: VideoSettings = {
  resolution: '1080p',
  targetFps: 60,
  codec: 'h264',
  bitrateMbps: 18,
  hardwareEncoding: true,
  maxLatencyMs: 25,
};

export const INITIAL_FILES: FileTransferItem[] = [
  {
    id: 'ft_001',
    fileName: '4K_Drone_Footage_RAW.mp4',
    fileSize: 482000000, // 482 MB
    transferredBytes: 482000000,
    status: 'completed',
    direction: 'phone_to_pc',
    chunkSize: 4194304, // 4MB
    totalChunks: 115,
    currentChunk: 115,
    sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    speedMbps: 145.2,
    etaSeconds: 0,
    timestamp: '10:14 AM'
  },
  {
    id: 'ft_002',
    fileName: 'Project_Backup_Archive.zip',
    fileSize: 125000000, // 125 MB
    transferredBytes: 87500000,
    status: 'transferring',
    direction: 'pc_to_phone',
    chunkSize: 2097152, // 2MB
    totalChunks: 60,
    currentChunk: 42,
    sha256Hash: 'a1f893d2c1149e82937af84b2c019d852028abf',
    speedMbps: 98.4,
    etaSeconds: 3,
    timestamp: 'Just now'
  },
  {
    id: 'ft_003',
    fileName: 'FLAC_Master_Track_48kHz.flac',
    fileSize: 42100000, // 42.1 MB
    transferredBytes: 42100000,
    status: 'completed',
    direction: 'phone_to_pc',
    chunkSize: 2097152,
    totalChunks: 21,
    currentChunk: 21,
    sha256Hash: '8f9219b4e85710aa39d89283e102',
    speedMbps: 120.0,
    etaSeconds: 0,
    timestamp: '09:45 AM'
  }
];

export const MOCK_TELEMETRY_INITIAL: TelemetryPoint[] = Array.from({ length: 20 }).map((_, i) => ({
  time: `${i * 2}s`,
  audioLatencyMs: Math.floor(12 + Math.sin(i / 2) * 3 + Math.random() * 2),
  videoLatencyMs: Math.floor(28 + Math.cos(i / 3) * 5 + Math.random() * 4),
  jitterMs: parseFloat((1.2 + Math.sin(i / 4) * 0.8 + Math.random() * 0.4).toFixed(2)),
  packetLossPercent: parseFloat((Math.random() * 0.08).toFixed(3)),
  throughputMbps: Math.floor(130 + Math.sin(i / 2) * 35 + Math.random() * 15),
  fps: 60,
  cpuPercent: Math.floor(8 + Math.random() * 6),
  gpuPercent: Math.floor(14 + Math.random() * 8)
}));
