export type ConnectionType = 'usb' | 'wifi_direct' | 'wifi_aware' | 'wifi_lan';

export interface DeviceInfo {
  id: string;
  name: string;
  model: string;
  os: 'Android' | 'iOS';
  osVersion: string;
  batteryLevel: number;
  isCharging: boolean;
  connectionType: ConnectionType;
  ipAddress: string;
  wifiStandard: string; // e.g. "Wi-Fi 6 (802.11ax)"
  signalDbm: number;
  usbSpeed?: string; // e.g. "USB 3.2 Gen 2 (10 Gbps)"
  isTrusted: boolean;
  isPaired: boolean;
  isConnected: boolean;
  lastConnected: string;
  macAddress: string;
}

export type AudioCodec = 'opus' | 'pcm_raw' | 'aac';
export type AudioProfileMode = 'standard' | 'high_quality' | 'hifi_usb';

export interface AudioSettings {
  profile: AudioProfileMode;
  codec: AudioCodec;
  sampleRate: 44100 | 48000 | 96000;
  bitrateKbps: number;
  channels: 1 | 2;
  frameDurationMs: 2 | 10 | 20;
  bufferSizeMs: number;
  jitterBufferMs: number;
  adaptiveBitrate: boolean;
  packetLossConcealment: boolean;
  // Directional routing
  phoneMicToPc: boolean;
  pcAudioToPhoneSpeaker: boolean;
  phoneSpeakerToPcHeadphones: boolean;
}

export interface VideoSettings {
  resolution: '720p' | '1080p' | '1440p' | '4k';
  targetFps: 30 | 60 | 90 | 120;
  codec: 'h264' | 'hevc' | 'av1';
  bitrateMbps: number;
  hardwareEncoding: boolean;
  maxLatencyMs: number;
}

export interface FileTransferItem {
  id: string;
  fileName: string;
  fileSize: number; // bytes
  transferredBytes: number;
  status: 'pending' | 'transferring' | 'paused' | 'completed' | 'failed';
  direction: 'pc_to_phone' | 'phone_to_pc';
  chunkSize: number; // e.g. 2097152 (2MB)
  totalChunks: number;
  currentChunk: number;
  sha256Hash: string;
  speedMbps: number;
  etaSeconds: number;
  timestamp: string;
}

export interface TelemetryPoint {
  time: string;
  audioLatencyMs: number;
  videoLatencyMs: number;
  jitterMs: number;
  packetLossPercent: number;
  throughputMbps: number;
  fps: number;
  cpuPercent: number;
  gpuPercent: number;
}

export type AppTab = 'overview' | 'mirror' | 'audio' | 'files' | 'telemetry' | 'code' | 'pairing';
