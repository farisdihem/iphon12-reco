import React, { useState, useEffect } from 'react';
import { 
  INITIAL_DEVICES, 
  DEFAULT_AUDIO_SETTINGS, 
  DEFAULT_VIDEO_SETTINGS, 
  INITIAL_FILES, 
  MOCK_TELEMETRY_INITIAL 
} from './mockData';
import { DeviceInfo, AudioSettings, VideoSettings, FileTransferItem, TelemetryPoint } from './types';
import { Header } from './components/Header';
import { MainStreamView } from './components/MainStreamView';
import { SettingsModal } from './components/SettingsModal';
import { PairingModal } from './components/PairingModal';
import { AdbConsoleModal } from './components/AdbConsoleModal';
import { audioEngineInstance } from './utils/audioEngine';

export default function App() {
  const [lang, setLang] = useState<'en' | 'ar'>('ar');
  const [allDevices, setAllDevices] = useState<DeviceInfo[]>(INITIAL_DEVICES);
  const [activeDevice, setActiveDevice] = useState<DeviceInfo>(INITIAL_DEVICES[0]);
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(DEFAULT_AUDIO_SETTINGS);
  const [videoSettings, setVideoSettings] = useState<VideoSettings>(DEFAULT_VIDEO_SETTINGS);
  const [telemetryData, setTelemetryData] = useState<TelemetryPoint[]>(MOCK_TELEMETRY_INITIAL);
  const [isAudioToneActive, setIsAudioToneActive] = useState(false);
  const [isPairingOpen, setIsPairingOpen] = useState(false);
  const [isAdbOpen, setIsAdbOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Synchronize document dir with language state
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Live Telemetry Data Stream Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetryData((prev) => {
        const last = prev[prev.length - 1];
        const nextSec = parseInt(last.time) + 2;
        const newPoint: TelemetryPoint = {
          time: `${nextSec}s`,
          audioLatencyMs: Math.max(2, Math.min(25, Math.floor(last.audioLatencyMs + (Math.random() * 4 - 2)))),
          videoLatencyMs: Math.max(15, Math.min(45, Math.floor(last.videoLatencyMs + (Math.random() * 6 - 3)))),
          jitterMs: parseFloat(Math.max(0.5, Math.min(4.0, last.jitterMs + (Math.random() * 0.4 - 0.2))).toFixed(2)),
          packetLossPercent: parseFloat(Math.max(0, Math.min(0.2, last.packetLossPercent + (Math.random() * 0.02 - 0.01))).toFixed(3)),
          throughputMbps: Math.floor(Math.max(80, Math.min(220, last.throughputMbps + (Math.random() * 20 - 10)))),
          fps: videoSettings.targetFps,
          cpuPercent: Math.floor(Math.max(5, Math.min(25, last.cpuPercent + (Math.random() * 4 - 2)))),
          gpuPercent: Math.floor(Math.max(10, Math.min(35, last.gpuPercent + (Math.random() * 6 - 3)))),
        };
        return [...prev.slice(1), newPoint];
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [videoSettings.targetFps]);

  // Real-time Tauri Native Pairing Event Listener
  useEffect(() => {
    let unlisten: (() => void) | undefined;
    
    const setupListener = async () => {
      try {
        // Dynamically import Tauri event api to support smooth web previews as well
        const { listen } = await import('@tauri-apps/api/event');
        unlisten = await listen<{ device_id: string; name: string; ip_address: string }>(
          'device-paired',
          (event) => {
            console.log('[Tauri IPC] Received device-paired event:', event.payload);
            const newDev: DeviceInfo = {
              id: event.payload.device_id,
              name: event.payload.name || "iPhone 12",
              model: "iPhone 12",
              os: 'iOS',
              osVersion: '17.1',
              batteryLevel: 98,
              isCharging: true,
              connectionType: 'wifi_lan',
              ipAddress: event.payload.ip_address,
              wifiStandard: 'Wi-Fi 6E (802.11ax)',
              signalDbm: -42,
              usbSpeed: 'USB 3.2 Gen 2',
              isTrusted: true,
              isPaired: true,
              isConnected: true,
              lastConnected: 'Just now',
              macAddress: 'fc:ec:da:11:22:33'
            };
            handleAddNewDevice(newDev);
            setIsPairingOpen(false);
          }
        );
      } catch (err) {
        console.warn('Tauri event listening fallback (expected on web preview):', err);
      }
    };

    setupListener();

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  const handleToggleAudioTone = () => {
    const active = audioEngineInstance.toggleTestTone(440);
    setIsAudioToneActive(active);
  };

  const handleTriggerStressTest = () => {
    setTelemetryData(prev => {
      const last = prev[prev.length - 1];
      const spikePoint: TelemetryPoint = {
        ...last,
        time: `${parseInt(last.time) + 2}s (Spike)`,
        audioLatencyMs: 68,
        videoLatencyMs: 112,
        jitterMs: 14.5,
        packetLossPercent: 2.4,
        throughputMbps: 42,
      };
      return [...prev.slice(1), spikePoint];
    });

    setTimeout(() => {
      setTelemetryData(prev => {
        const last = prev[prev.length - 1];
        const recoveredPoint: TelemetryPoint = {
          ...last,
          time: `${parseInt(last.time) + 2}s (Recovered)`,
          audioLatencyMs: 11,
          videoLatencyMs: 24,
          jitterMs: 1.2,
          packetLossPercent: 0.01,
          throughputMbps: 160,
        };
        return [...prev.slice(1), recoveredPoint];
      });
    }, 3000);
  };

  const handleAddNewDevice = (newDev: DeviceInfo) => {
    setAllDevices(prev => [newDev, ...prev]);
    setActiveDevice(newDev);
  };

  return (
    <div className="min-h-screen mesh-bg text-gray-100 flex flex-col font-sans antialiased selection:bg-blue-500 selection:text-white">
      {/* Top Header Bar */}
      <Header
        activeDevice={activeDevice}
        audioSettings={audioSettings}
        onOpenPairing={() => setIsPairingOpen(true)}
        onOpenAdb={() => setIsAdbOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleAudioTone={handleToggleAudioTone}
        isAudioToneActive={isAudioToneActive}
        lang={lang}
        onToggleLang={() => setLang(l => l === 'en' ? 'ar' : 'en')}
      />

      {/* Main Stream Container */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <MainStreamView
          activeDevice={activeDevice}
          allDevices={allDevices}
          onSelectDevice={setActiveDevice}
          audioSettings={audioSettings}
          videoSettings={videoSettings}
          onOpenPairing={() => setIsPairingOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          lang={lang}
        />
      </main>

      {/* Settings Modal (⚙ Settings & Developer Drawer) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        audioSettings={audioSettings}
        setAudioSettings={setAudioSettings}
        videoSettings={videoSettings}
        setVideoSettings={setVideoSettings}
        telemetryData={telemetryData}
        onTriggerStressTest={handleTriggerStressTest}
        lang={lang}
      />

      {/* Pairing QR Modal */}
      <PairingModal
        isOpen={isPairingOpen}
        onClose={() => setIsPairingOpen(false)}
        allDevices={allDevices}
        onAddNewDevice={handleAddNewDevice}
      />

      {/* ADB Console Modal */}
      <AdbConsoleModal
        isOpen={isAdbOpen}
        onClose={() => setIsAdbOpen(false)}
        deviceName={activeDevice.name}
      />
    </div>
  );
}
