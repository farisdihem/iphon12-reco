import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Wifi, 
  Volume2, 
  VolumeX, 
  Tv, 
  Film, 
  Play, 
  Square, 
  CheckCircle, 
  AlertCircle, 
  Sparkles, 
  Maximize2, 
  RefreshCw, 
  ShieldCheck, 
  Info,
  BatteryCharging,
  Layers,
  Zap
} from 'lucide-react';
import { DeviceInfo, AudioSettings, VideoSettings } from '../types';
import { EducationalBoard } from './EducationalBoard';

interface MainStreamViewProps {
  activeDevice: DeviceInfo;
  allDevices: DeviceInfo[];
  onSelectDevice: (dev: DeviceInfo) => void;
  audioSettings: AudioSettings;
  videoSettings: VideoSettings;
  onOpenPairing: () => void;
  onOpenSettings: () => void;
  lang: 'en' | 'ar';
}

export const MainStreamView: React.FC<MainStreamViewProps> = ({
  activeDevice,
  allDevices,
  onSelectDevice,
  audioSettings,
  videoSettings,
  onOpenPairing,
  onOpenSettings,
  lang,
}) => {
  const isAr = lang === 'ar';
  
  // Stream Modes
  const [activeStreamType, setActiveStreamType] = useState<'screen' | 'audio' | 'media' | 'whiteboard'>('screen');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mediaFile, setMediaFile] = useState<string | null>(null);

  // Toggle Streaming Action
  const handleToggleStream = () => {
    setIsStreaming(!isStreaming);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in">
      {/* 1. Device Connection Status Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4 rtl:space-x-reverse w-full sm:w-auto">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 p-0.5 shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Smartphone className="w-7 h-7 text-blue-400" />
              </div>
            </div>
            <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
              activeDevice.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`} />
          </div>

          <div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <h2 className="text-lg font-bold text-white tracking-tight">
                {activeDevice.name}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                activeDevice.isConnected 
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                  : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              }`}>
                {activeDevice.isConnected ? (isAr ? '● متصل' : '● Connected') : (isAr ? 'جاري البحث...' : 'Searching...')}
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-0.5 flex items-center space-x-2 rtl:space-x-reverse">
              <span>{activeDevice.os} {activeDevice.osVersion}</span>
              <span>•</span>
              <span>{activeDevice.ipAddress}</span>
              <span>•</span>
              <span className="flex items-center space-x-1 rtl:space-x-reverse text-slate-300">
                <BatteryCharging className="w-3 h-3 text-emerald-400" />
                <span>{activeDevice.batteryLevel}%</span>
              </span>
            </p>
          </div>
        </div>

        {/* Change or Add Device */}
        <div className="flex items-center space-x-2 rtl:space-x-reverse w-full sm:w-auto justify-end">
          {allDevices.length > 1 && (
            <select
              value={activeDevice.id}
              onChange={(e) => {
                const dev = allDevices.find(d => d.id === e.target.value);
                if (dev) onSelectDevice(dev);
              }}
              className="px-3 py-2 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold focus:outline-none focus:border-blue-500"
            >
              {allDevices.map(dev => (
                <option key={dev.id} value={dev.id}>
                  {dev.name} ({dev.isConnected ? 'Online' : 'Offline'})
                </option>
              ))}
            </select>
          )}

          <button
            onClick={onOpenPairing}
            className="px-4 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-bold transition-all flex items-center space-x-1.5 rtl:space-x-reverse"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{isAr ? 'إضافة/ربط iPhone' : 'Pair iPhone'}</span>
          </button>
        </div>
      </div>

      {/* 2. Main Live Stage / Preview Container */}
      {activeStreamType === 'whiteboard' ? (
        <EducationalBoard lang={lang} />
      ) : (
        <div className="bg-slate-950 border border-slate-800/80 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col items-center w-full">
          {/* Background glow when streaming */}
          {isStreaming && (
            <div className="absolute inset-0 bg-blue-600/5 blur-3xl pointer-events-none" />
          )}

          {/* Top Mode Sub-header */}
          <div className="w-full flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
              <h3 className="text-sm font-bold text-slate-200">
                {activeStreamType === 'screen' && (isAr ? 'شاشة iPhone المباشرة (ReplayKit)' : 'iPhone Live Screen (ReplayKit)')}
                {activeStreamType === 'audio' && (isAr ? 'بث الصوت المباشر (WASAPI 48kHz)' : 'Live Audio Streaming (WASAPI 48kHz)')}
                {activeStreamType === 'media' && (isAr ? 'تشغيل فيديو 4K أصلي (Original Quality)' : 'Direct 4K Video Playback')}
              </h3>
            </div>

            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-slate-900 border border-slate-800 text-blue-400">
                {videoSettings.resolution.toUpperCase()} @ {videoSettings.targetFps} FPS
              </span>
            </div>
          </div>

          {/* Frame Canvas Screen Display */}
          <div className="relative w-full max-w-sm aspect-[9/19.5] bg-slate-900 rounded-[42px] border-4 border-slate-800 p-3 shadow-2xl flex flex-col items-center justify-between overflow-hidden group">
            {/* iPhone Island Bar Notch */}
            <div className="w-28 h-5 bg-black rounded-full z-20 flex items-center justify-end px-2 space-x-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-900" />
              <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
            </div>

            {/* Canvas Display Content */}
            <div className="w-full h-full my-2 bg-slate-950 rounded-[32px] overflow-hidden relative flex flex-col items-center justify-center p-4">
              {isStreaming ? (
                <div className="w-full h-full flex flex-col items-center justify-between py-6 animate-fade-in text-center">
                  {/* Active Stream Mock Screen */}
                  <div className="w-full h-full bg-gradient-to-b from-slate-900 via-blue-950/40 to-slate-900 rounded-2xl border border-blue-500/20 p-4 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
                    
                    {activeStreamType === 'screen' && (
                      <div className="space-y-3 z-10">
                        <Tv className="w-12 h-12 text-blue-400 mx-auto animate-pulse" />
                        <p className="text-xs font-bold text-white">
                          {isAr ? 'بث الشاشة يعمل الآن' : 'iPhone Screen Streaming'}
                        </p>
                        <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30 block">
                          ● LIVE 60 FPS • H.264
                        </span>
                      </div>
                    )}

                    {activeStreamType === 'audio' && (
                      <div className="space-y-3 z-10">
                        <Volume2 className="w-12 h-12 text-purple-400 mx-auto animate-bounce" />
                        <p className="text-xs font-bold text-white">
                          {isAr ? 'بث الصوت من iPhone' : 'Streaming High-Fi Audio'}
                        </p>
                        <div className="flex items-center justify-center space-x-1 rtl:space-x-reverse h-6">
                          {[40, 70, 30, 90, 50, 80, 40].map((h, i) => (
                            <div
                              key={i}
                              className="w-1 bg-purple-400 rounded-full animate-pulse"
                              style={{ height: `${h}%`, animationDelay: `${i * 100}ms` }}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-purple-300 font-mono bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/30 block">
                          48 kHz • Stereo Opus
                        </span>
                      </div>
                    )}

                    {activeStreamType === 'media' && (
                      <div className="space-y-3 z-10">
                        <Film className="w-12 h-12 text-amber-400 mx-auto animate-pulse" />
                        <p className="text-xs font-bold text-white">
                          {isAr ? 'تشغيل فيديو 4K HEVC الأصلي' : '4K HEVC Direct Playback'}
                        </p>
                        <span className="text-[10px] text-amber-300 font-mono bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30 block">
                          Original Bitrate • Zero Transcode
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-3 p-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
                    <Smartphone className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-300">
                      {isAr ? 'الشاشة جاهزة للبث' : 'Ready to Stream'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {isAr ? 'اضغط على [ بدء البث ] لتشغيل الصوت والشاشة' : 'Press [ Start Stream ] to launch live mirror'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Home Indicator Line */}
            <div className="w-32 h-1 bg-slate-600 rounded-full my-1" />
          </div>

          {/* Status Pill Badge Below Stream */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs">
            <div className="px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 font-mono flex items-center space-x-2 rtl:space-x-reverse">
              <Wifi className="w-3.5 h-3.5 text-blue-400" />
              <span>Wi-Fi QUIC • {videoSettings.resolution.toUpperCase()} • {videoSettings.targetFps} FPS • 48 kHz</span>
            </div>

            <div className="px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono text-[11px] font-bold flex items-center space-x-1.5 rtl:space-x-reverse">
              <Zap className="w-3.5 h-3.5" />
              <span>{isAr ? 'جسور Tauri Native جاهزة' : 'Native Bridge Ready'}</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Primary Mode Selectors & Action Control */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        {/* Mode Selector Buttons: [ 🔊 الصوت ] [ 🖥 الشاشة ] [ 🎬 الوسائط ] [ 🧪 مختبر العلوم ] */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => setActiveStreamType('audio')}
            className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-center space-y-2 ${
              activeStreamType === 'audio'
                ? 'bg-purple-600/20 border-purple-500 text-purple-300 shadow-lg shadow-purple-900/20 font-bold active-ring'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <Volume2 className="w-6 h-6 text-purple-400" />
            <span className="text-xs font-bold">{isAr ? '🔊 الصوت (Audio)' : '🔊 Audio Stream'}</span>
            <span className="text-[10px] text-slate-400 hidden sm:block">48 kHz • WASAPI</span>
          </button>

          <button
            onClick={() => setActiveStreamType('screen')}
            className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-center space-y-2 ${
              activeStreamType === 'screen'
                ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-lg shadow-blue-900/20 font-bold active-ring'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <Tv className="w-6 h-6 text-blue-400" />
            <span className="text-xs font-bold">{isAr ? '🖥 الشاشة (Screen)' : '🖥 Screen Mirror'}</span>
            <span className="text-[10px] text-slate-400 hidden sm:block">ReplayKit • Low Latency</span>
          </button>

          <button
            onClick={() => setActiveStreamType('media')}
            className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-center space-y-2 ${
              activeStreamType === 'media'
                ? 'bg-amber-600/20 border-amber-500 text-amber-300 shadow-lg shadow-amber-900/20 font-bold active-ring'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <Film className="w-6 h-6 text-amber-400" />
            <span className="text-xs font-bold">{isAr ? '🎬 الوسائط (Media)' : '🎬 Media Direct'}</span>
            <span className="text-[10px] text-slate-400 hidden sm:block">4K HEVC Original</span>
          </button>

          <button
            onClick={() => setActiveStreamType('whiteboard')}
            className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-center space-y-2 ${
              activeStreamType === 'whiteboard'
                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-lg shadow-indigo-900/20 font-bold active-ring'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-6 h-6 text-indigo-400" />
            <span className="text-xs font-bold">{isAr ? '🧪 مختبر العلوم' : '🧪 Science Lab'}</span>
            <span className="text-[10px] text-slate-400 hidden sm:block">Physics Whiteboard</span>
          </button>
        </div>

        {/* Big Prominent Action Button: [ بدء البث ] / [ إيقاف البث ] */}
        {activeStreamType !== 'whiteboard' && (
          <div className="flex flex-col items-center space-y-3">
            <button
              onClick={handleToggleStream}
              className={`w-full max-w-md py-4 px-8 rounded-2xl font-bold text-base transition-all shadow-2xl flex items-center justify-center space-x-3 rtl:space-x-reverse active:scale-95 ${
                isStreaming
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/40 ring-2 ring-red-500/50'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-900/40 ring-2 ring-blue-500/50'
              }`}
            >
              {isStreaming ? (
                <>
                  <Square className="w-5 h-5 fill-current" />
                  <span>{isAr ? 'إيقاف البث المباشر' : 'Stop Streaming'}</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>{isAr ? 'بدء البث المباشر' : 'Start Streaming'}</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-slate-400 flex items-center space-x-1 rtl:space-x-reverse">
              <Info className="w-3.5 h-3.5 text-slate-500" />
              <span>
                {isAr ? 'يتم تحديد أعلى جودة يدعمها جهازك تلقائيًا عبر محرك Tauri' : 'Highest supported quality is auto-selected by native Tauri engine'}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
