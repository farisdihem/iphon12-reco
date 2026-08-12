import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Wifi, 
  Volume2, 
  VolumeX, 
  Camera, 
  Video, 
  Play, 
  Square, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Maximize2, 
  RefreshCw, 
  Sliders, 
  Sun, 
  Focus, 
  Zap, 
  Grid, 
  FlipHorizontal, 
  Download, 
  Radio, 
  Layers, 
  Settings,
  Mic,
  Monitor,
  Usb
} from 'lucide-react';
import { DeviceInfo, AudioSettings, VideoSettings } from '../types';

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
  
  // Studio & Camo Controls State
  const [activeLens, setActiveLens] = useState<'back_wide' | 'back_tele' | 'back_ultra' | 'front'>('back_wide');
  const [preset, setPreset] = useState<'clean' | 'portrait' | 'lowlight' | 'doc'>('clean');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '4:3'>('16:9');
  
  // Camera Adjustments
  const [exposure, setExposure] = useState<number>(0); // EV -3 to +3
  const [iso, setIso] = useState<number>(400); // 25 to 3200
  const [focus, setFocus] = useState<number>(1.0); // 0.0 to 1.0 (1.0 = Auto)
  const [wb, setWb] = useState<number>(5500); // Kelvin 2000 to 10000
  const [zoom, setZoom] = useState<number>(1.0); // 1.0x to 5.0x
  
  // Toggles
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isMirrored, setIsMirrored] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recTime, setRecTime] = useState(0);

  // Audio Processing
  const [micGain, setMicGain] = useState(100);
  const [noiseSuppression, setNoiseSuppression] = useState(true);

  // Recording Timer Effect
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => setRecTime(t => t + 1), 1000);
    } else {
      setRecTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatRecTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-fade-in dir-rtl">
      
      {/* 1. Device Header & Cable Status Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 p-0.5 shadow-lg shadow-blue-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Smartphone className="w-7 h-7 text-blue-400" />
              </div>
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 bg-emerald-500 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                {activeDevice.name}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Usb className="w-3 h-3" />
                <span>{isAr ? 'متصل عبر USB (منفذ 9000)' : 'Connected via USB (Port 9000)'}</span>
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <span>{activeDevice.os} {activeDevice.osVersion}</span>
              <span>•</span>
              <span className="text-blue-400 font-mono font-semibold">1080p @ 60 FPS H.264</span>
              <span>•</span>
              <span className="text-emerald-400 font-mono">زمن التأخير: 8 ms</span>
            </p>
          </div>
        </div>

        {/* Device Quick Switch & Pairing Action */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={onOpenPairing}
            className="px-4 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-bold transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{isAr ? 'ربط كابل USB جديد' : 'Connect USB Cable'}</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-all"
            title={isAr ? 'الإعدادات' : 'Settings'}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Main Camo Studio Layout (Viewport + Controls) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* VIEWPORT & LIVE HUD (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 shadow-2xl relative overflow-hidden flex flex-col items-center">
            
            {/* Aspect Ratio & Quick HUD Toolbar */}
            <div className="w-full flex items-center justify-between mb-3 px-2 text-xs font-bold text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <span className="font-mono text-red-400">● LIVE CAMO STUDIO</span>
              </div>

              {/* Aspect Ratio Switcher */}
              <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
                {(['16:9', '9:16', '4:3'] as const).map(ratio => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      aspectRatio === ratio ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated Live Video Camera Feed */}
            <div className={`relative w-full bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center transition-all ${
              aspectRatio === '16:9' ? 'aspect-video' : aspectRatio === '9:16' ? 'aspect-[9/16] max-w-sm' : 'aspect-[4/3]'
            }`}>
              
              {/* Gridlines Overlay */}
              {showGrid && (
                <div className="absolute inset-0 pointer-events-none z-10 grid grid-cols-3 grid-rows-3">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="border border-white/20" />
                  ))}
                </div>
              )}

              {/* Live Camera Feed Simulated Backdrop */}
              <div 
                className={`w-full h-full bg-gradient-to-tr from-slate-950 via-slate-900 to-blue-950 relative flex flex-col items-center justify-center p-6 text-center transition-transform duration-300 ${
                  isMirrored ? 'scale-x-[-1]' : ''
                }`}
              >
                {/* Simulated Lens Aperture Rings */}
                <div className="relative w-36 h-36 rounded-full border-2 border-blue-500/30 flex items-center justify-center animate-pulse">
                  <div className="w-28 h-28 rounded-full border border-blue-400/20 bg-blue-500/10 flex items-center justify-center">
                    <Camera className="w-12 h-12 text-blue-400" />
                  </div>
                </div>

                <div className="mt-4 space-y-1">
                  <h3 className="text-base font-bold text-white">iPhone 12 Pro Camera</h3>
                  <p className="text-xs text-slate-400">
                    {activeLens === 'back_wide' && 'العدسة الرئيسية Wide Angle (26mm f/1.6)'}
                    {activeLens === 'back_tele' && 'عدسة التقريب Telephoto (2x 52mm)'}
                    {activeLens === 'back_ultra' && 'العدسة الفائقة Ultra Wide (0.5x 13mm)'}
                    {activeLens === 'front' && 'الكاميرا الأمامية TrueDepth (12MP)'}
                  </p>
                </div>

                {/* HUD Live Stats Overlay */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-[11px] font-mono text-white/80 pointer-events-none">
                  <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>60.0 FPS</span>
                    <span>•</span>
                    <span>6.0 Mbps</span>
                  </div>

                  <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                    ISO {iso} | EV {exposure > 0 ? `+${exposure}` : exposure} | {wb}K
                  </div>
                </div>

                {/* Recording Status Badge */}
                {isRecording && (
                  <div className="absolute bottom-4 left-4 bg-red-600/90 text-white font-mono text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-2 animate-pulse shadow-lg">
                    <span className="w-2.5 h-2.5 rounded-full bg-white" />
                    <span>REC {formatRecTime(recTime)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Action Buttons Below Viewport */}
            <div className="w-full flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-900">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsRecording(!isRecording)}
                  className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                    isRecording 
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 animate-pulse' 
                      : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                  }`}
                >
                  <Video className="w-4 h-4" />
                  <span>{isRecording ? 'إيقاف التسجيل' : 'تسجيل فيديو 1080p'}</span>
                </button>

                <button
                  onClick={() => alert('تم التقاط صورة عالية الدقة 12MP بنجاح')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-2 transition-all"
                >
                  <Camera className="w-4 h-4 text-blue-400" />
                  <span>التقاط صورة 12MP</span>
                </button>
              </div>

              {/* Toggles: Torch, Mirror, Grid */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsTorchOn(!isTorchOn)}
                  className={`p-2 rounded-xl border text-xs transition-all ${
                    isTorchOn ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                  title="الفلاش / الكشاف"
                >
                  <Zap className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setIsMirrored(!isMirrored)}
                  className={`p-2 rounded-xl border text-xs transition-all ${
                    isMirrored ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                  title="انعكاس أفقي"
                >
                  <FlipHorizontal className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setShowGrid(!showGrid)}
                  className={`p-2 rounded-xl border text-xs transition-all ${
                    showGrid ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                  title="شبكة التوجيه"
                >
                  <Grid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CAMO PRO CONTROLS SIDE PANEL (4 Cols) */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* 1. Lens Selection Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Camera className="w-4 h-4 text-blue-400" />
              <span>اختيار عدسة الكاميرا</span>
            </h3>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'back_wide', label: 'الرئيسية (Wide)', sub: '1x 26mm f/1.6' },
                { id: 'back_tele', label: 'تقريب (Tele)', sub: '2x 52mm f/2.0' },
                { id: 'back_ultra', label: 'فائقة (Ultra)', sub: '0.5x 13mm' },
                { id: 'front', label: 'أمامية (Selfie)', sub: 'TrueDepth 12MP' },
              ].map(lens => (
                <button
                  key={lens.id}
                  onClick={() => setActiveLens(lens.id as any)}
                  className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                    activeLens === lens.id
                      ? 'bg-blue-600/20 border-blue-500/50 text-white shadow-lg shadow-blue-500/10'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-bold">{lens.label}</span>
                  <span className="text-[10px] opacity-70 font-mono mt-1">{lens.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Studio Presets Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>نمط الإضاءة والتصوير</span>
            </h3>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'clean', label: 'Studio Clean', sub: 'طبيعي وواضح' },
                { id: 'portrait', label: 'Portrait Bokeh', sub: 'عزل الخلفية' },
                { id: 'lowlight', label: 'Cinematic', sub: 'إضاءة خافوتة' },
                { id: 'doc', label: 'Document', sub: 'مسح المستندات' },
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => setPreset(p.id as any)}
                  className={`p-2.5 rounded-xl border text-right transition-all ${
                    preset === p.id
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 font-bold'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="text-xs font-bold">{p.label}</div>
                  <div className="text-[10px] opacity-70 mt-0.5">{p.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Manual Sliders (EV, ISO, Focus, WB, Zoom) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-400" />
              <span>التحكم اليدوي المتقدم</span>
            </h3>

            {/* Exposure EV */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">التعريض الضوئي (EV)</span>
                <span className="font-mono text-blue-400 font-bold">{exposure > 0 ? `+${exposure}` : exposure} EV</span>
              </div>
              <input
                type="range"
                min="-3"
                max="3"
                step="0.5"
                value={exposure}
                onChange={e => setExposure(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg accent-blue-500 cursor-pointer"
              />
            </div>

            {/* ISO */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">الحساسية الضوئية (ISO)</span>
                <span className="font-mono text-purple-400 font-bold">{iso}</span>
              </div>
              <input
                type="range"
                min="25"
                max="3200"
                step="25"
                value={iso}
                onChange={e => setIso(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg accent-purple-500 cursor-pointer"
              />
            </div>

            {/* White Balance */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">توازن البيض (White Balance)</span>
                <span className="font-mono text-amber-400 font-bold">{wb} K</span>
              </div>
              <input
                type="range"
                min="2000"
                max="10000"
                step="100"
                value={wb}
                onChange={e => setWb(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Zoom */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">التقريب (Zoom)</span>
                <span className="font-mono text-emerald-400 font-bold">{zoom.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="5.0"
                step="0.1"
                value={zoom}
                onChange={e => setZoom(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          {/* 4. Audio Input & Mic Processing */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Mic className="w-4 h-4 text-emerald-400" />
              <span>ميكروفون الآيفون (Opus 48kHz)</span>
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <span className="text-slate-300">عزل الضوضاء الذكي</span>
                <button
                  onClick={() => setNoiseSuppression(!noiseSuppression)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    noiseSuppression ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {noiseSuppression ? 'مفعّل ON' : 'معطل OFF'}
                </button>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">مستوى الصوت (Gain)</span>
                  <span className="font-mono text-emerald-400 font-bold">{micGain}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={micGain}
                  onChange={e => setMicGain(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default MainStreamView;
