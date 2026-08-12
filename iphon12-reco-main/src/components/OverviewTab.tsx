import React from 'react';
import { 
  Smartphone, 
  Wifi, 
  Usb, 
  BatteryCharging, 
  Volume2, 
  Tv, 
  FolderSync, 
  Activity, 
  ArrowRight, 
  ShieldCheck, 
  Radio, 
  Cpu, 
  Gauge, 
  Zap, 
  CheckCircle2, 
  RefreshCw,
  Sliders,
  HardDrive
} from 'lucide-react';
import { DeviceInfo, AudioSettings, VideoSettings, AppTab } from '../types';

interface OverviewTabProps {
  activeDevice: DeviceInfo;
  allDevices: DeviceInfo[];
  onSelectDevice: (device: DeviceInfo) => void;
  audioSettings: AudioSettings;
  videoSettings: VideoSettings;
  setActiveTab: (tab: AppTab) => void;
  onOpenPairing: () => void;
  onOpenAdb: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  activeDevice,
  allDevices,
  onSelectDevice,
  audioSettings,
  videoSettings,
  setActiveTab,
  onOpenPairing,
  onOpenAdb,
}) => {
  return (
    <div className="space-y-6 pb-8">
      {/* Hero Active Link Banner */}
      <div className="relative overflow-hidden glass p-6 md:p-8 active-ring">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Multi-Channel Low Latency Link Active</span>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-light text-gray-100 tracking-tight">
              {activeDevice.name} <span className="font-bold">Dashboard</span>
            </h2>
            
            <p className="text-sm text-gray-400 leading-relaxed">
              Ultra-low latency audio stream (Opus/WASAPI 2ms buffer), hardware screen mirroring ({videoSettings.resolution} @ {videoSettings.targetFps} FPS), and resumable chunked file transfers operating in unison.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setActiveTab('mirror')}
                className="px-4 py-2.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 text-xs font-bold transition-all shadow-lg shadow-blue-900/20 flex items-center space-x-2 active-ring"
              >
                <Tv className="w-4 h-4" />
                <span>Launch Screen Mirroring</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setActiveTab('audio')}
                className="px-4 py-2.5 rounded-xl glass hover:bg-white/10 text-gray-200 text-xs font-semibold transition-all flex items-center space-x-2"
              >
                <Volume2 className="w-4 h-4 text-blue-400" />
                <span>Audio Engine Studio</span>
              </button>

              <button
                onClick={() => setActiveTab('files')}
                className="px-4 py-2.5 rounded-xl glass hover:bg-white/10 text-gray-200 text-xs font-semibold transition-all flex items-center space-x-2"
              >
                <FolderSync className="w-4 h-4 text-emerald-400" />
                <span>File Bridge</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 gap-3 w-full lg:w-72 shrink-0">
            <div className="p-3.5 glass flex flex-col justify-between">
              <div className="text-xs text-gray-400 flex items-center justify-between">
                <span>Audio Latency</span>
                <Zap className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="text-xl font-bold font-mono text-blue-400 mt-1">2.4 ms</div>
              <div className="text-[10px] text-gray-500 mt-0.5">WASAPI Exclusive</div>
            </div>

            <div className="p-3.5 glass flex flex-col justify-between">
              <div className="text-xs text-gray-400 flex items-center justify-between">
                <span>Mirror FPS</span>
                <Gauge className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">120 FPS</div>
              <div className="text-[10px] text-gray-500 mt-0.5">Hardware H.264</div>
            </div>

            <div className="p-3.5 glass flex flex-col justify-between">
              <div className="text-xs text-gray-400 flex items-center justify-between">
                <span>Throughput</span>
                <Activity className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <div className="text-xl font-bold font-mono text-purple-400 mt-1">165 Mbps</div>
              <div className="text-[10px] text-gray-500 mt-0.5">QUIC Stream</div>
            </div>

            <div className="p-3.5 glass flex flex-col justify-between">
              <div className="text-xs text-gray-400 flex items-center justify-between">
                <span>Packet Loss</span>
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-xl font-bold font-mono text-amber-400 mt-1">0.02 %</div>
              <div className="text-[10px] text-gray-500 mt-0.5">PLC Enabled</div>
            </div>
          </div>
        </div>
      </div>

      {/* Connection Transport Selector & Device Manager */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Available Devices List */}
        <div className="lg:col-span-2 glass p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-100">Paired Devices & Discovery</h3>
              <p className="text-xs text-gray-400">Select an active smartphone or pair a new device via Wi-Fi/USB</p>
            </div>
            <button
              onClick={onOpenPairing}
              className="px-3 py-1.5 rounded-lg glass hover:bg-white/10 text-xs font-semibold text-blue-400 border border-white/10 transition-colors flex items-center space-x-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Scan Nearby</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {allDevices.map((dev) => {
              const isCurrent = dev.id === activeDevice.id;
              return (
                <div
                  key={dev.id}
                  onClick={() => onSelectDevice(dev)}
                  className={`p-4 rounded-xl cursor-pointer transition-all ${
                    isCurrent
                      ? 'glass bg-white/10 border-blue-500/50 shadow-lg active-ring'
                      : 'glass hover:bg-white/5 border-white/5'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isCurrent ? 'bg-blue-600/30 text-blue-400 border border-blue-500/40' : 'bg-white/5 text-gray-400'
                      }`}>
                        <Smartphone className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-100">{dev.name}</h4>
                        <p className="text-xs text-gray-400">{dev.os} {dev.osVersion} • {dev.model}</p>
                      </div>
                    </div>
                    {isCurrent && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Active</span>
                      </span>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center space-x-1.5">
                      {dev.connectionType === 'usb' ? (
                        <Usb className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Wifi className="w-3.5 h-3.5 text-blue-400" />
                      )}
                      <span className="capitalize">{dev.connectionType.replace('_', ' ')}</span>
                    </div>
                    <span className="font-mono">{dev.ipAddress}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Multi-Channel Fallback Architecture Card */}
        <div className="glass p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-100">Channel Manager</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
              Auto-Priority
            </span>
          </div>

          <p className="text-xs text-gray-400">
            Intelligent Transport Abstraction layer automatically switches channels without dropping active streams.
          </p>

          <div className="space-y-2.5 pt-1">
            {/* USB Route */}
            <div className="p-3 bg-white/5 rounded-xl border border-emerald-500/30 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Usb className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-gray-200">1. USB High-Speed (Active)</div>
                  <div className="text-[11px] text-gray-400">ADB Tunnel / Raw PCM 2ms</div>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">Primary</span>
            </div>

            {/* Wi-Fi Direct Route */}
            <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-gray-200">2. Wi-Fi Direct (Standby)</div>
                  <div className="text-[11px] text-gray-400">P2P WPA3 / 5GHz 1200Mbps</div>
                </div>
              </div>
              <span className="text-[11px] font-mono text-gray-500">Ready</span>
            </div>

            {/* Wi-Fi LAN Route */}
            <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2.5">
                <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                  <Wifi className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-gray-200">3. Local LAN Network</div>
                  <div className="text-[11px] text-gray-400">Router mDNS Discovery</div>
                </div>
              </div>
              <span className="text-[11px] font-mono text-gray-500">Fallback</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
