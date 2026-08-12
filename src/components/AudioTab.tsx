import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  Mic, 
  Headphones, 
  Radio, 
  Zap, 
  Sliders, 
  Activity, 
  ShieldCheck, 
  Play, 
  Square, 
  RefreshCw, 
  Layers,
  Settings,
  Cpu,
  VolumeX
} from 'lucide-react';
import { AudioSettings, AudioProfileMode } from '../types';
import { audioEngineInstance } from '../utils/audioEngine';

interface AudioTabProps {
  audioSettings: AudioSettings;
  setAudioSettings: React.Dispatch<React.SetStateAction<AudioSettings>>;
  isAudioToneActive: boolean;
  setIsAudioToneActive: (active: boolean) => void;
}

export const AudioTab: React.FC<AudioTabProps> = ({
  audioSettings,
  setAudioSettings,
  isAudioToneActive,
  setIsAudioToneActive,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selectedFreq, setSelectedFreq] = useState(440);
  const [isMicLoopbackActive, setIsMicLoopbackActive] = useState(false);

  // Animate FFT Frequency Spectrum Canvas
  useEffect(() => {
    let animationFrameId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dataArray = new Uint8Array(32);

    const render = () => {
      audioEngineInstance.getFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / dataArray.length) - 2;
      let x = 0;

      for (let i = 0; i < dataArray.length; i++) {
        let barHeight = (dataArray[i] / 255) * canvas.height;
        if (barHeight < 6) barHeight = 6;

        // Gradient color for bars
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#2563eb'); // Blue
        gradient.addColorStop(0.6, '#3b82f6');
        gradient.addColorStop(1, '#10b981'); // Emerald

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, canvas.height - barHeight, barWidth, barHeight, 4);
        ctx.fill();

        x += barWidth + 2;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleProfileChange = (profile: AudioProfileMode) => {
    let settingsUpdate: Partial<AudioSettings> = { profile };
    if (profile === 'standard') {
      settingsUpdate = {
        profile: 'standard',
        codec: 'opus',
        bitrateKbps: 96,
        sampleRate: 48000,
        bufferSizeMs: 20,
        jitterBufferMs: 10,
        frameDurationMs: 20,
      };
    } else if (profile === 'high_quality') {
      settingsUpdate = {
        profile: 'high_quality',
        codec: 'opus',
        bitrateKbps: 160,
        sampleRate: 48000,
        bufferSizeMs: 12,
        jitterBufferMs: 5,
        frameDurationMs: 10,
      };
    } else if (profile === 'hifi_usb') {
      settingsUpdate = {
        profile: 'hifi_usb',
        codec: 'pcm_raw',
        bitrateKbps: 1536, // 48000 * 16 * 2 / 1000
        sampleRate: 48000,
        bufferSizeMs: 2,
        jitterBufferMs: 1,
        frameDurationMs: 2,
      };
    }
    setAudioSettings(prev => ({ ...prev, ...settingsUpdate }));
  };

  const handleToggleTone = (freq: number) => {
    setSelectedFreq(freq);
    const active = audioEngineInstance.toggleTestTone(freq);
    setIsAudioToneActive(active);
  };

  const handleToggleMic = async () => {
    if (isMicLoopbackActive) {
      audioEngineInstance.disableMicrophoneLoopback();
      setIsMicLoopbackActive(false);
    } else {
      const res = await audioEngineInstance.enableMicrophoneLoopback();
      setIsMicLoopbackActive(true);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Audio Engine Live Spectrum Banner */}
      <div className="glass p-6 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full">
                WASAPI Exclusive / PipeWire Graph
              </span>
              <span className="text-xs text-gray-400 font-mono">48000 Hz • Stereo • 24-bit</span>
            </div>
            <h2 className="text-xl font-bold text-gray-100">
              Audio Stream Engine
            </h2>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center space-x-4 px-4 py-2 glass text-xs">
            <div>
              <div className="text-gray-500 text-[10px]">Buffer Size</div>
              <div className="font-mono font-bold text-blue-400">{audioSettings.bufferSizeMs} ms</div>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div>
              <div className="text-gray-500 text-[10px]">Audio Codec</div>
              <div className="font-mono font-bold text-emerald-400 uppercase">{audioSettings.codec}</div>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div>
              <div className="text-gray-500 text-[10px]">Bitrate</div>
              <div className="font-mono font-bold text-purple-400">{audioSettings.bitrateKbps} kbps</div>
            </div>
          </div>
        </div>

        {/* FFT Canvas Visualizer */}
        <div className="p-4 glass border border-white/5 flex flex-col space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center space-x-1.5 font-semibold text-gray-300">
              <Activity className="w-4 h-4 text-blue-400" />
              <span>Real-Time Frequency Spectrum Analyser (FFT)</span>
            </span>
            <span className="font-mono text-[11px] text-emerald-400">WASAPI Engine</span>
          </div>

          <canvas
            ref={canvasRef}
            width={600}
            height={90}
            className="w-full h-24 bg-black/40 rounded-xl border border-white/5"
          />
        </div>
      </div>

      {/* Audio Profile & Routing Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Profile Selector (7 Cols) */}
        <div className="lg:col-span-7 glass p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-100 flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-blue-400" />
              <span>Audio Stream Quality Profiles</span>
            </h3>
            <span className="text-xs text-gray-400">WASAPI / PipeWire Engine</span>
          </div>

          {/* Profile Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Standard Profile */}
            <div
              onClick={() => handleProfileChange('standard')}
              className={`p-4 rounded-xl cursor-pointer transition-all ${
                audioSettings.profile === 'standard'
                  ? 'glass bg-white/10 border-blue-500/50 shadow-lg active-ring'
                  : 'glass hover:bg-white/5 border-white/5'
              }`}
            >
              <div className="text-xs font-bold text-gray-200">Standard Opus</div>
              <div className="text-lg font-bold font-mono text-blue-400 mt-1">96 kbps</div>
              <p className="text-[11px] text-gray-400 mt-1">20ms Frame • Low CPU overhead</p>
            </div>

            {/* High Quality Profile */}
            <div
              onClick={() => handleProfileChange('high_quality')}
              className={`p-4 rounded-xl cursor-pointer transition-all ${
                audioSettings.profile === 'high_quality'
                  ? 'glass bg-white/10 border-emerald-500/50 shadow-lg active-ring'
                  : 'glass hover:bg-white/5 border-white/5'
              }`}
            >
              <div className="text-xs font-bold text-gray-200">High Quality</div>
              <div className="text-lg font-bold font-mono text-emerald-400 mt-1">160 kbps</div>
              <p className="text-[11px] text-gray-400 mt-1">10ms Frame • Adaptive Opus</p>
            </div>

            {/* Hi-Fi USB PCM Profile */}
            <div
              onClick={() => handleProfileChange('hifi_usb')}
              className={`p-4 rounded-xl cursor-pointer transition-all ${
                audioSettings.profile === 'hifi_usb'
                  ? 'glass bg-white/10 border-purple-500/50 shadow-lg active-ring'
                  : 'glass hover:bg-white/5 border-white/5'
              }`}
            >
              <div className="text-xs font-bold text-gray-200">Hi-Fi USB PCM</div>
              <div className="text-lg font-bold font-mono text-purple-400 mt-1">2ms Latency</div>
              <p className="text-[11px] text-gray-400 mt-1">Raw Uncompressed PCM</p>
            </div>
          </div>

          {/* Buffer & Jitter Controls */}
          <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-4">
            <h4 className="text-xs font-bold text-gray-300">Buffer & Jitter Buffer Calibration</h4>

            {/* Buffer Size Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-gray-400">
                <span>WASAPI Endpoint Buffer Size</span>
                <span className="font-mono text-blue-400 font-bold">{audioSettings.bufferSizeMs} ms</span>
              </div>
              <input
                type="range"
                min={2}
                max={50}
                value={audioSettings.bufferSizeMs}
                onChange={(e) => setAudioSettings(prev => ({ ...prev, bufferSizeMs: Number(e.target.value) }))}
                className="w-full accent-blue-500"
              />
            </div>

            {/* Jitter Buffer Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Adaptive Network Jitter Buffer</span>
                <span className="font-mono text-emerald-400 font-bold">{audioSettings.jitterBufferMs} ms</span>
              </div>
              <input
                type="range"
                min={1}
                max={20}
                value={audioSettings.jitterBufferMs}
                onChange={(e) => setAudioSettings(prev => ({ ...prev, jitterBufferMs: Number(e.target.value) }))}
                className="w-full accent-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Bi-Directional Audio Routing & Testing (5 Cols) */}
        <div className="lg:col-span-5 glass p-6 space-y-5">
          <h3 className="text-base font-bold text-gray-100 flex items-center space-x-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            <span>Bi-Directional Routing Toggles</span>
          </h3>

          <div className="space-y-3">
            {/* Phone Mic -> PC Virtual Mic */}
            <div className="p-3.5 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Mic className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="text-xs font-bold text-gray-200">Phone Mic → PC Virtual Mic</div>
                  <div className="text-[10px] text-gray-400">Use phone as PC microphone</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={audioSettings.phoneMicToPc}
                onChange={(e) => setAudioSettings(prev => ({ ...prev, phoneMicToPc: e.target.checked }))}
                className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
              />
            </div>

            {/* PC System Audio -> Phone Speaker */}
            <div className="p-3.5 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Volume2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <div className="text-xs font-bold text-gray-200">PC Audio → Phone Speaker</div>
                  <div className="text-[10px] text-gray-400">Use phone as PC wireless speaker</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={audioSettings.pcAudioToPhoneSpeaker}
                onChange={(e) => setAudioSettings(prev => ({ ...prev, pcAudioToPhoneSpeaker: e.target.checked }))}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            {/* Phone Speaker -> PC Headphones */}
            <div className="p-3.5 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Headphones className="w-5 h-5 text-purple-400" />
                <div>
                  <div className="text-xs font-bold text-gray-200">Phone Audio → PC Headphones</div>
                  <div className="text-[10px] text-gray-400">Stream phone media to PC headset</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={audioSettings.phoneSpeakerToPcHeadphones}
                onChange={(e) => setAudioSettings(prev => ({ ...prev, phoneSpeakerToPcHeadphones: e.target.checked }))}
                className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Test Tone & Mic Loopback Tool */}
          <div className="pt-2 space-y-2">
            <h4 className="text-xs font-bold text-gray-300">Live Hardware Audio Test Bench</h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleToggleTone(selectedFreq)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                  isAudioToneActive
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse active-ring'
                    : 'glass hover:bg-white/10 text-gray-200'
                }`}
              >
                {isAudioToneActive ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{isAudioToneActive ? 'Stop 440Hz Tone' : 'Play 440Hz Tone'}</span>
              </button>

              <button
                onClick={handleToggleMic}
                className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                  isMicLoopbackActive
                    ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40 active-ring'
                    : 'glass hover:bg-white/10 text-gray-200'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>{isMicLoopbackActive ? 'Mic Active' : 'Test Mic Stream'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
