import React, { useState, useEffect, useRef } from 'react';
import { 
  Tv, 
  Smartphone, 
  Camera, 
  Image as ImageIcon, 
  Music, 
  Folder, 
  Settings, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Clipboard, 
  Maximize2, 
  Play, 
  Pause, 
  Terminal, 
  Zap, 
  Video, 
  Sliders, 
  Check, 
  ArrowLeft, 
  Home, 
  Square,
  Sparkles,
  MousePointer,
  Download
} from 'lucide-react';
import { DeviceInfo, VideoSettings } from '../types';

interface MirrorTabProps {
  activeDevice: DeviceInfo;
  videoSettings: VideoSettings;
  setVideoSettings: React.Dispatch<React.SetStateAction<VideoSettings>>;
  onSendFileToPc: (fileName: string, size: number) => void;
  onOpenAdb: () => void;
}

type ActivePhoneApp = 'home' | 'camera' | 'photos' | 'music' | 'files' | 'settings';

export const MirrorTab: React.FC<MirrorTabProps> = ({
  activeDevice,
  videoSettings,
  setVideoSettings,
  onSendFileToPc,
  onOpenAdb,
}) => {
  const [activeApp, setActiveApp] = useState<ActivePhoneApp>('home');
  const [isMuted, setIsMuted] = useState(false);
  const [clipboardText, setClipboardText] = useState('https://ai.studio/build');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedSeconds, setRecordedSeconds] = useState(0);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [touchEffect, setTouchEffect] = useState<{ x: number; y: number } | null>(null);

  // Timer for screen recording
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  const handleTouchScreen = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);

    setTouchEffect({ x, y });
    setTimeout(() => setTouchEffect(null), 400);
  };

  const syncClipboardToPhone = () => {
    if (!clipboardText.trim()) return;
    triggerToast(`Pasted to ${activeDevice.name} clipboard: "${clipboardText}"`);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Mirroring Settings Header Toolbar */}
      <div className="glass p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-100">Screen Mirroring (scrcpy engine)</h3>
            <p className="text-xs text-gray-400">1080p • 60 FPS • H.264 Encoder • Sub-14ms glass-to-glass latency</p>
          </div>
        </div>

        {/* Quick Resolution & FPS Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Resolution */}
          <select
            value={videoSettings.resolution}
            onChange={(e) => setVideoSettings(prev => ({ ...prev, resolution: e.target.value as any }))}
            className="px-3 py-1.5 rounded-lg glass border border-white/10 text-xs font-mono text-gray-200 focus:outline-none focus:border-blue-500"
          >
            <option value="720p" className="bg-slate-900">720p HD</option>
            <option value="1080p" className="bg-slate-900">1080p Full HD</option>
            <option value="1440p" className="bg-slate-900">1440p QHD</option>
            <option value="4k" className="bg-slate-900">4K Ultra HD</option>
          </select>

          {/* FPS */}
          <select
            value={videoSettings.targetFps}
            onChange={(e) => setVideoSettings(prev => ({ ...prev, targetFps: Number(e.target.value) as any }))}
            className="px-3 py-1.5 rounded-lg glass border border-white/10 text-xs font-mono text-gray-200 focus:outline-none focus:border-blue-500"
          >
            <option value={30} className="bg-slate-900">30 FPS</option>
            <option value={60} className="bg-slate-900">60 FPS</option>
            <option value={90} className="bg-slate-900">90 FPS</option>
            <option value={120} className="bg-slate-900">120 FPS</option>
          </select>

          {/* Codec */}
          <select
            value={videoSettings.codec}
            onChange={(e) => setVideoSettings(prev => ({ ...prev, codec: e.target.value as any }))}
            className="px-3 py-1.5 rounded-lg glass border border-white/10 text-xs font-mono text-gray-200 focus:outline-none focus:border-blue-500"
          >
            <option value="h264" className="bg-slate-900">H.264 (Hardware)</option>
            <option value="hevc" className="bg-slate-900">HEVC / H.265</option>
            <option value="av1" className="bg-slate-900">AV1 Codec</option>
          </select>

          {/* Recording Toggle */}
          <button
            onClick={() => {
              setIsRecording(!isRecording);
              if (!isRecording) triggerToast('Screen recording started...');
              else triggerToast('Recording saved to /Videos/PhoneLink');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              isRecording
                ? 'bg-rose-500/80 text-white animate-pulse active-ring'
                : 'glass hover:bg-white/10 text-gray-200'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>{isRecording ? `REC ${recordedSeconds}s` : 'Record Stream'}</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Screen Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Phone Bezel Display (7 Cols on LG) */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="relative w-full max-w-[360px] aspect-[9/19.5] glass p-3 rounded-[40px] border-8 border-gray-800 shadow-2xl relative bg-[#111] overflow-hidden group">
            
            {/* Phone Camera Punch hole */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-5 bg-gray-800 rounded-b-2xl z-30 flex items-center justify-end px-3">
              <div className="w-2.5 h-2.5 rounded-full bg-black border border-white/10" />
            </div>

            {/* Status Bar */}
            <div className="pt-2 px-6 flex items-center justify-between text-[11px] font-semibold text-gray-300 z-20">
              <span>09:41</span>
              <div className="flex items-center space-x-2 text-[10px]">
                <span className="font-mono text-blue-400 font-bold">5G UC</span>
                <span className="font-mono">{activeDevice.batteryLevel}%</span>
              </div>
            </div>

            {/* Phone Screen Interactive Surface */}
            <div 
              onClick={handleTouchScreen}
              className="relative flex-1 my-2 bg-gradient-to-b from-slate-900/90 via-black/80 to-blue-950/40 rounded-[28px] overflow-hidden border border-white/10 p-4 flex flex-col justify-between cursor-pointer select-none"
            >
              {/* Touch Visualizer Circle */}
              {touchEffect && (
                <div 
                  className="absolute w-8 h-8 rounded-full bg-blue-400/50 border border-blue-300 animate-ping pointer-events-none z-50 -translate-x-1/2 -translate-y-1/2"
                  style={{ left: touchEffect.x, top: touchEffect.y }}
                />
              )}

              {/* Toast Notification overlay */}
              {showToast && (
                <div className="absolute top-4 left-4 right-4 glass border border-blue-500/50 text-blue-200 text-xs p-2.5 rounded-xl shadow-lg z-40 text-center animate-fade-in font-medium">
                  {toastMessage}
                </div>
              )}

              {/* APP VIEWS */}
              {activeApp === 'home' && (
                <div className="flex-1 flex flex-col justify-between pt-6">
                  {/* Home Widget */}
                  <div className="p-4 glass rounded-2xl border border-white/10 space-y-2">
                    <div className="text-xs text-gray-400 flex items-center justify-between">
                      <span>NexusLink Live Sync</span>
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <div className="text-lg font-bold text-gray-100">
                      {activeDevice.name}
                    </div>
                    <p className="text-[11px] text-gray-400">
                      Connected to Host PC via {activeDevice.connectionType.toUpperCase()}
                    </p>
                  </div>

                  {/* App Grid */}
                  <div className="grid grid-cols-4 gap-4 py-4">
                    {/* Camera App */}
                    <button
                      onClick={() => setActiveApp('camera')}
                      className="flex flex-col items-center space-y-1.5 group/app"
                    >
                      <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center text-gray-100 shadow-md group-hover/app:scale-105 transition-transform border border-white/10">
                        <Camera className="w-6 h-6 text-blue-400" />
                      </div>
                      <span className="text-[11px] font-medium text-gray-300">Camera</span>
                    </button>

                    {/* Photos App */}
                    <button
                      onClick={() => setActiveApp('photos')}
                      className="flex flex-col items-center space-y-1.5 group/app"
                    >
                      <div className="w-12 h-12 rounded-2xl glass bg-purple-500/20 flex items-center justify-center text-gray-100 shadow-md group-hover/app:scale-105 transition-transform border border-purple-500/30">
                        <ImageIcon className="w-6 h-6 text-purple-300" />
                      </div>
                      <span className="text-[11px] font-medium text-gray-300">Photos</span>
                    </button>

                    {/* Music App */}
                    <button
                      onClick={() => setActiveApp('music')}
                      className="flex flex-col items-center space-y-1.5 group/app"
                    >
                      <div className="w-12 h-12 rounded-2xl glass bg-emerald-500/20 flex items-center justify-center text-gray-100 shadow-md group-hover/app:scale-105 transition-transform border border-emerald-500/30">
                        <Music className="w-6 h-6 text-emerald-300" />
                      </div>
                      <span className="text-[11px] font-medium text-gray-300">Music</span>
                    </button>

                    {/* Files App */}
                    <button
                      onClick={() => setActiveApp('files')}
                      className="flex flex-col items-center space-y-1.5 group/app"
                    >
                      <div className="w-12 h-12 rounded-2xl glass bg-blue-500/20 flex items-center justify-center text-gray-100 shadow-md group-hover/app:scale-105 transition-transform border border-blue-500/30">
                        <Folder className="w-6 h-6 text-blue-300" />
                      </div>
                      <span className="text-[11px] font-medium text-gray-300">Files</span>
                    </button>
                  </div>
                </div>
              )}

              {/* CAMERA APP VIEW */}
              {activeApp === 'camera' && (
                <div className="flex-1 flex flex-col justify-between py-2 text-gray-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold flex items-center space-x-1">
                      <Camera className="w-4 h-4 text-blue-400" />
                      <span>HD Camera Stream</span>
                    </span>
                    <button onClick={() => setActiveApp('home')} className="text-gray-400 hover:text-white">Close</button>
                  </div>

                  <div className="relative aspect-square glass rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-950/30 to-purple-900/20" />
                    <div className="text-center space-y-2 z-10">
                      <Camera className="w-10 h-10 text-blue-400 mx-auto animate-pulse" />
                      <p className="text-xs text-gray-300">Live Lens Preview</p>
                      <p className="text-[10px] text-gray-500 font-mono">1080p 60FPS Stream</p>
                    </div>
                  </div>

                  <button
                    onClick={() => triggerToast('Snapshot captured & saved to PC Downloads')}
                    className="w-full py-2.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/40 border border-blue-500/40 text-blue-300 text-xs font-bold shadow-md shadow-blue-900/20 flex items-center justify-center space-x-2 active-ring"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capture Snapshot to PC</span>
                  </button>
                </div>
              )}

              {/* PHOTOS APP VIEW */}
              {activeApp === 'photos' && (
                <div className="flex-1 flex flex-col justify-between py-2 text-gray-100 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold flex items-center space-x-1">
                      <ImageIcon className="w-4 h-4 text-purple-400" />
                      <span>Phone Gallery</span>
                    </span>
                    <button onClick={() => setActiveApp('home')} className="text-gray-400 hover:text-white">Close</button>
                  </div>

                  <div className="space-y-2 overflow-y-auto max-h-[220px] pr-1">
                    {[
                      { name: 'DCIM_2024_03_12.raw', size: '34.2 MB', icon: Video },
                      { name: 'HDR_Sunset_Photo.jpg', size: '12.4 MB', icon: ImageIcon },
                      { name: 'Audio_Master_48k.flac', size: '42.1 MB', icon: Music },
                    ].map((item, idx) => (
                      <div key={idx} className="p-2.5 glass rounded-xl flex items-center justify-between border border-white/5">
                        <div className="flex items-center space-x-2 text-xs">
                          <item.icon className="w-4 h-4 text-blue-400" />
                          <div>
                            <div className="font-semibold text-gray-200 text-[11px] truncate w-28">{item.name}</div>
                            <div className="text-[10px] text-gray-500">{item.size}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            onSendFileToPc(item.name, parseInt(item.size) * 1024 * 1024);
                            triggerToast(`Transferring ${item.name} to PC...`);
                          }}
                          className="px-2 py-1 glass hover:bg-white/10 text-emerald-400 text-[10px] rounded-lg font-semibold flex items-center space-x-1 border border-emerald-500/30"
                        >
                          <Download className="w-3 h-3" />
                          <span>To PC</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MUSIC APP VIEW */}
              {activeApp === 'music' && (
                <div className="flex-1 flex flex-col justify-between py-2 text-gray-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold flex items-center space-x-1">
                      <Music className="w-4 h-4 text-emerald-400" />
                      <span>Low-Latency Opus Streamer</span>
                    </span>
                    <button onClick={() => setActiveApp('home')} className="text-gray-400 hover:text-white">Close</button>
                  </div>

                  <div className="p-4 glass rounded-2xl border border-white/10 text-center space-y-3">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 mx-auto flex items-center justify-center text-emerald-400 shadow-lg">
                      <Music className="w-8 h-8" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-gray-200">Hi-Fi Synth Track #1</div>
                      <div className="text-[10px] text-gray-400">48kHz 24-bit Stereo Opus</div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsPlayingMusic(!isPlayingMusic);
                      triggerToast(isPlayingMusic ? 'Audio paused' : 'Audio streaming to PC WASAPI...');
                    }}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all ${
                      isPlayingMusic ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40' : 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 shadow-lg active-ring'
                    }`}
                  >
                    {isPlayingMusic ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span>{isPlayingMusic ? 'Pause Phone Audio' : 'Stream Phone Sound to PC'}</span>
                  </button>
                </div>
              )}

              {/* FILES APP VIEW */}
              {activeApp === 'files' && (
                <div className="flex-1 flex flex-col justify-between py-2 text-gray-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold flex items-center space-x-1">
                      <Folder className="w-4 h-4 text-blue-400" />
                      <span>Internal Storage (/sdcard)</span>
                    </span>
                    <button onClick={() => setActiveApp('home')} className="text-gray-400 hover:text-white">Close</button>
                  </div>

                  <div className="space-y-2 text-xs">
                    {['/DCIM/Camera', '/Download/Project.zip', '/Music/HiFi.flac', '/Documents/Notes.txt'].map((f, i) => (
                      <div key={i} className="p-2.5 glass rounded-xl flex items-center justify-between border border-white/5">
                        <span className="text-[11px] font-mono text-gray-300">{f}</span>
                        <button 
                          onClick={() => triggerToast(`Saved ${f} to PC`)}
                          className="text-[10px] text-blue-400 font-semibold hover:text-blue-300"
                        >
                          Transfer
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Navigation Buttons */}
              <div className="pt-2 flex items-center justify-around border-t border-white/5 text-gray-400">
                <button 
                  onClick={() => setActiveApp('home')}
                  className="p-1.5 hover:text-blue-400 transition-colors"
                  title="Back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setActiveApp('home')}
                  className="p-1.5 hover:text-blue-400 transition-colors"
                  title="Home"
                >
                  <Home className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => triggerToast('Recents view toggled')}
                  className="p-1.5 hover:text-blue-400 transition-colors"
                  title="Recents"
                >
                  <Square className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Remote Control & Input Tools Panel (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Clipboard & Input Synchronization */}
          <div className="glass p-6 space-y-4">
            <div className="flex items-center space-x-2 text-sm font-bold text-gray-100">
              <Clipboard className="w-4 h-4 text-blue-400" />
              <span>Universal Clipboard & Typewriter</span>
            </div>

            <p className="text-xs text-gray-400">
              Type text from your PC keyboard directly into active inputs on your phone, or copy/paste across devices instantly.
            </p>

            <div className="space-y-2">
              <textarea
                value={clipboardText}
                onChange={(e) => setClipboardText(e.target.value)}
                placeholder="Type text to sync with phone..."
                rows={3}
                className="w-full p-3 glass border border-white/10 rounded-xl text-xs text-gray-200 font-mono focus:outline-none focus:border-blue-500"
              />

              <div className="flex items-center space-x-2">
                <button
                  onClick={syncClipboardToPhone}
                  className="flex-1 py-2 rounded-xl bg-blue-600/30 hover:bg-blue-600/40 text-blue-300 border border-blue-500/40 text-xs font-semibold shadow-md shadow-blue-900/20 transition-all flex items-center justify-center space-x-1.5 active-ring"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  <span>Send to Phone Clipboard</span>
                </button>

                <button
                  onClick={() => {
                    setClipboardText('https://github.com/tauri-apps/tauri');
                    triggerToast('Fetched latest text from Phone Clipboard');
                  }}
                  className="px-3 py-2 rounded-xl glass hover:bg-white/10 text-gray-300 text-xs font-medium transition-colors"
                >
                  Read Phone
                </button>
              </div>
            </div>
          </div>

          {/* Quick Hardware Controls */}
          <div className="glass p-6 space-y-4">
            <h4 className="text-sm font-bold text-gray-100 flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>Hardware & ADB Shortcut Controls</span>
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setIsMuted(!isMuted);
                  triggerToast(isMuted ? 'Unmuted phone volume' : 'Muted phone volume');
                }}
                className={`p-3 rounded-xl border text-xs font-semibold flex items-center space-x-2 transition-all ${
                  isMuted 
                    ? 'bg-rose-500/20 border-rose-500/30 text-rose-300' 
                    : 'glass hover:bg-white/10 text-gray-300'
                }`}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-blue-400" />}
                <span>{isMuted ? 'Muted' : 'Volume Mute'}</span>
              </button>

              <button
                onClick={onOpenAdb}
                className="p-3 glass hover:bg-white/10 border border-white/10 text-gray-300 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-colors"
              >
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>ADB Terminal</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
