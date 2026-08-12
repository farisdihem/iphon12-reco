import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Volume2, 
  Video, 
  Wifi, 
  Code, 
  Activity, 
  Sliders, 
  Check, 
  ShieldCheck, 
  Radio, 
  HardDrive,
  Cpu,
  Monitor,
  Smartphone,
  Info
} from 'lucide-react';
import { AudioSettings, VideoSettings, TelemetryPoint } from '../types';
import { NativeCodeTab } from './NativeCodeTab';
import { TelemetryTab } from './TelemetryTab';
import { AdbConsoleModal } from './AdbConsoleModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  audioSettings: AudioSettings;
  setAudioSettings: React.Dispatch<React.SetStateAction<AudioSettings>>;
  videoSettings: VideoSettings;
  setVideoSettings: React.Dispatch<React.SetStateAction<VideoSettings>>;
  telemetryData: TelemetryPoint[];
  onTriggerStressTest: () => void;
  lang: 'en' | 'ar';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  audioSettings,
  setAudioSettings,
  videoSettings,
  setVideoSettings,
  telemetryData,
  onTriggerStressTest,
  lang,
}) => {
  const [activeCategory, setActiveCategory] = useState<'video' | 'audio' | 'network' | 'developer'>('audio');
  const [devTab, setDevTab] = useState<'code' | 'telemetry'>('code');
  const [selectedAudioOutput, setSelectedAudioOutput] = useState('wasapi_default');

  if (!isOpen) return null;

  const isAr = lang === 'ar';

  const audioOutputs = [
    { id: 'wasapi_default', name: isAr ? 'مخرج صوت ويندوز الافتراضي (WASAPI)' : 'Windows Default Audio Device (WASAPI Low Latency)' },
    { id: 'speakers_realtek', name: isAr ? 'مكبرات الصوت Realtek High Definition' : 'Speakers (Realtek High Definition Audio)' },
    { id: 'headphones_bt', name: isAr ? 'سماعات الرأس (Bluetooth Audio Device)' : 'Headphones (Bluetooth LE Audio)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {isAr ? 'إعدادات النظام والربط' : 'System & Engine Settings'}
              </h2>
              <p className="text-xs text-slate-400">
                {isAr ? 'NexusLink Pro - إعدادات الصوت والصورة والربط المتقدم' : 'NexusLink Pro - Advanced Audio, Video & Protocol Controls'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Navigation Bar */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-6 space-x-2 rtl:space-x-reverse overflow-x-auto">
          {[
            { id: 'audio', label: isAr ? '🔊 الصوت (Audio)' : '🔊 Audio Quality', icon: Volume2 },
            { id: 'video', label: isAr ? '🖥 الشاشة والجودة' : '🖥 Video & Screen', icon: Video },
            { id: 'network', label: isAr ? '⚡ الاتصال والأمان' : '⚡ Network & TLS', icon: Wifi },
            { id: 'developer', label: isAr ? '🛠 أدوات المطور والكود' : '🛠 Developer & Code', icon: Code },
          ].map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`py-3.5 px-4 text-xs font-semibold flex items-center space-x-2 rtl:space-x-reverse border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 🔊 Audio Category */}
          {activeCategory === 'audio' && (
            <div className="space-y-6 animate-fade-in">
              {/* Audio Profile Selector */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  {isAr ? 'جودة وملف الصوت المستهدف (Audio Quality Profile)' : 'Audio Quality Profile'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'standard', name: isAr ? 'قياسي (Standard)' : 'Standard', desc: '128 kbps • 44.1 kHz • Low CPU' },
                    { id: 'high_quality', name: isAr ? 'عالي الجودة (High Quality)' : 'High Quality (Recommended)', desc: '160 kbps • 48 kHz Opus • WASAPI' },
                    { id: 'hifi_usb', name: isAr ? 'فائق الدقة (Hi-Fi Master)' : 'Hi-Fi Master', desc: '320 kbps • 48 kHz Stereo PCM' },
                  ].map((prof) => (
                    <button
                      key={prof.id}
                      onClick={() => setAudioSettings(s => ({ ...s, profile: prof.id as any }))}
                      className={`p-4 rounded-2xl border text-right rtl:text-right ltr:text-left transition-all ${
                        audioSettings.profile === prof.id
                          ? 'border-blue-500 bg-blue-600/10 text-white ring-1 ring-blue-500/50'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-white">{prof.name}</span>
                        {audioSettings.profile === prof.id && <Check className="w-4 h-4 text-blue-400" />}
                      </div>
                      <p className="text-xs text-slate-400">{prof.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Windows Audio Output Device Selector */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  {isAr ? 'جهاز مخرج الصوت في ويندوز (Windows Audio Endpoint)' : 'Windows Audio Output Device (WASAPI)'}
                </label>
                <div className="space-y-2">
                  {audioOutputs.map((out) => (
                    <button
                      key={out.id}
                      onClick={() => setSelectedAudioOutput(out.id)}
                      className={`w-full p-3.5 rounded-2xl border flex items-center justify-between text-xs transition-all ${
                        selectedAudioOutput === out.id
                          ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300'
                          : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-3 rtl:space-x-reverse">
                        <Volume2 className="w-4 h-4 text-emerald-400" />
                        <span className="font-semibold">{out.name}</span>
                      </div>
                      {selectedAudioOutput === out.id && <Check className="w-4 h-4 text-emerald-400" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Directional Audio Toggles */}
              <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/40 space-y-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  {isAr ? 'توجيه الصوت (Directional Routing)' : 'Directional Audio Routing'}
                </span>
                
                <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
                  <div>
                    <p className="text-xs font-semibold text-white">
                      {isAr ? 'ميكروفون iPhone ← ميكروفون الحاسوب' : 'iPhone Microphone → Windows Audio Input'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {isAr ? 'استخدام ميكروفون iPhone كميكروفون عالي الدقة لويندوز' : 'Stream iPhone mic as a virtual Windows microphone'}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={audioSettings.phoneMicToPc}
                    onChange={(e) => setAudioSettings(s => ({ ...s, phoneMicToPc: e.target.checked }))}
                    className="w-5 h-5 accent-blue-500 rounded"
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-xs font-semibold text-white">
                      {isAr ? 'صوت iPhone ← سماعات ويندوز (WASAPI)' : 'iPhone Speaker Audio → Windows Headphones (WASAPI)'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {isAr ? 'بث صوت التطبيقات والألعاب مباشرة لسماعات PC' : 'Direct capture of iPhone system audio to PC sound card'}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={audioSettings.phoneSpeakerToPcHeadphones}
                    onChange={(e) => setAudioSettings(s => ({ ...s, phoneSpeakerToPcHeadphones: e.target.checked }))}
                    className="w-5 h-5 accent-blue-500 rounded"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 🖥 Video Category */}
          {activeCategory === 'video' && (
            <div className="space-y-6 animate-fade-in">
              {/* Resolution Setting */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  {isAr ? 'دقة البث المباشر (Screen Resolution)' : 'Target Resolution'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { id: 'auto', label: 'Auto', desc: isAr ? 'تلقائي حسب الشبكة' : 'Highest Supported' },
                    { id: '720p', label: '720p HD', desc: 'Ultra Low Latency' },
                    { id: '1080p', label: '1080p Full HD', desc: 'Balanced' },
                    { id: '1440p', label: '1440p 2K', desc: 'High Sharpness' },
                    { id: '4k', label: '4K Ultra HD', desc: 'Requested Max' },
                  ].map((res) => (
                    <button
                      key={res.id}
                      onClick={() => setVideoSettings(v => ({ ...v, resolution: res.id as any }))}
                      className={`p-3.5 rounded-2xl border text-center transition-all ${
                        videoSettings.resolution === res.id
                          ? 'border-blue-500 bg-blue-600/10 text-white font-bold ring-1 ring-blue-500/50'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <p className="text-sm font-bold text-white">{res.label}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{res.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Target FPS Setting */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  {isAr ? 'معدل الإطارات المستهدف (Frame Rate)' : 'Target Frame Rate'}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'auto', label: 'Auto', desc: isAr ? 'تلقائي حسب الشبكة' : 'Adaptive Frame Rate' },
                    { id: 30, label: '30 FPS', desc: 'Battery Saver' },
                    { id: 60, label: '60 FPS', desc: 'Smooth Target' },
                  ].map((fps) => (
                    <button
                      key={fps.id}
                      onClick={() => setVideoSettings(v => ({ ...v, targetFps: fps.id as any }))}
                      className={`p-3.5 rounded-2xl border text-center transition-all ${
                        videoSettings.targetFps === fps.id
                          ? 'border-purple-500 bg-purple-600/10 text-white font-bold ring-1 ring-purple-500/50'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <p className="text-sm font-bold text-white">{fps.label}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{fps.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Video Codec Selection */}
              <div className="p-4 rounded-2xl border border-slate-800 bg-slate-950/40 space-y-3">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  {isAr ? 'مترمّز الفيديو والترميز الهاردوير (Hardware Video Codec)' : 'Video Codec & Hardware Acceleration'}
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'h264', label: 'H.264 (AVC)', sub: 'Universal GPU Compatibility' },
                    { id: 'hevc', label: 'HEVC (H.265)', sub: 'Best Quality / Bitrate' },
                    { id: 'av1', label: 'AV1 Codec', sub: 'Next-Gen Ultra Low Bitrate' },
                  ].map((codec) => (
                    <button
                      key={codec.id}
                      onClick={() => setVideoSettings(v => ({ ...v, codec: codec.id as any }))}
                      className={`p-3 rounded-xl border text-center transition-all text-xs ${
                        videoSettings.codec === codec.id
                          ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300 font-bold'
                          : 'border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <p className="font-bold text-white">{codec.label}</p>
                      <p className="text-[10px] text-slate-400">{codec.sub}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ⚡ Network & Protocol Category */}
          {activeCategory === 'network' && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-950/50 space-y-4">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {isAr ? 'بروتوكول QUIC مع تشفير TLS 1.3' : 'QUIC Transport over UDP with TLS 1.3'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {isAr ? 'اتصال مباشر منخفض التأخير عبر شبكة LAN مع حماية كاملة' : 'Peer-to-peer encrypted high-speed transport for local networks'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-800">
                  <div className="p-3 bg-slate-900 rounded-xl">
                    <span className="text-slate-400 block mb-1">mDNS Bonjour Service</span>
                    <span className="font-mono text-blue-400">_nexuslink._udp.local</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl">
                    <span className="text-slate-400 block mb-1">UDP Port</span>
                    <span className="font-mono text-emerald-400">8492</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl">
                    <span className="text-slate-400 block mb-1">Protocol Version</span>
                    <span className="font-mono text-purple-400">NexusLink v2.4</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl">
                    <span className="text-slate-400 block mb-1">Transport Security</span>
                    <span className="font-mono text-emerald-400">TLS 1.3 Self-Signed PIN Trust</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 🛠 Developer Category */}
          {activeCategory === 'developer' && (
            <div className="space-y-4 animate-fade-in">
              {/* Sub-tabs for Developer Tools */}
              <div className="flex space-x-2 rtl:space-x-reverse p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  onClick={() => setDevTab('code')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-2 rtl:space-x-reverse ${
                    devTab === 'code' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Code className="w-4 h-4" />
                  <span>{isAr ? 'أكواد Native Core (Swift & Rust)' : 'Native Core Source Code'}</span>
                </button>
                <button
                  onClick={() => setDevTab('telemetry')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-2 rtl:space-x-reverse ${
                    devTab === 'telemetry' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  <span>{isAr ? 'مؤشرات الأداء والـ Telemetry' : 'Performance Telemetry'}</span>
                </button>
              </div>

              {devTab === 'code' && <NativeCodeTab />}
              {devTab === 'telemetry' && (
                <TelemetryTab
                  telemetryData={telemetryData}
                  onTriggerStressTest={onTriggerStressTest}
                />
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center space-x-2 rtl:space-x-reverse text-xs text-slate-400">
            <Info className="w-4 h-4 text-blue-400" />
            <span>{isAr ? 'حالة النظام: محرك Tauri 2 Native جاهز للتنفيذ' : 'Status: Tauri 2 Native Bridge Engine Ready'}</span>
          </div>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all active:scale-95"
          >
            {isAr ? 'حفظ وإغلاق' : 'Save & Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
