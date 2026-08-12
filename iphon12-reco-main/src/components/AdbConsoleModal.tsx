import React, { useState } from 'react';
import { Terminal, X, Play, Copy, Check, Trash2 } from 'lucide-react';

interface AdbConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceName: string;
}

export const AdbConsoleModal: React.FC<AdbConsoleModalProps> = ({
  isOpen,
  onClose,
  deviceName,
}) => {
  const [inputCmd, setInputCmd] = useState('adb shell dumpsys battery');
  const [logs, setLogs] = useState<string[]>([
    `[ADB Daemon v1.0.41] Connected to device ${deviceName} via USB 3.2 High-Speed`,
    `$ adb devices`,
    `List of devices attached:`,
    `SM-S928B_5G\tdevice usb:1-2.4 product:samsung_s24 model:SM-S928B`,
    `$ scrcpy --bit-rate 24M --max-fps 120 --audio-codec=opus`,
    `[scrcpy] INFO: Texture created for 1080x2340 H.264 stream`,
    `[scrcpy] INFO: Audio stream initialized via WASAPI Exclusive (2.4ms)`
  ]);

  if (!isOpen) return null;

  const handleRunCommand = (cmdToRun?: string) => {
    const cmd = cmdToRun || inputCmd;
    if (!cmd.trim()) return;

    let response = `Executing: ${cmd}...`;
    if (cmd.includes('battery')) {
      response = `Current Battery Status:\n  AC powered: true\n  USB powered: true\n  level: 88\n  scale: 100\n  voltage: 4320mV\n  temperature: 312 (31.2°C)\n  technology: Li-ion`;
    } else if (cmd.includes('devices')) {
      response = `List of devices attached:\nSM-S928B_5G\tdevice usb:1-2.4\nA3296_iOS\tdevice wifi:192.168.1.189`;
    } else if (cmd.includes('logcat')) {
      response = `08-10 04:00:12.441  1024  1088 I PhoneLinkAudio: AudioPlaybackCapture frame dispatched (1920 bytes, 10ms)\n08-10 04:00:12.451  1024  1088 I PhoneLinkVideo: H.264 NAL frame encoded (18.4 KB, 120 FPS)`;
    } else {
      response = `[ADB Success] Command '${cmd}' executed cleanly on device ${deviceName}.`;
    }

    setLogs((prev) => [...prev, `$ ${cmd}`, response]);
    setInputCmd('');
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass rounded-2xl w-full max-w-2xl p-6 space-y-4 shadow-2xl animate-scale-in border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center space-x-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold text-gray-100">ADB & scrcpy Command Line Terminal</h3>
              <p className="text-xs text-gray-400">Direct shell access to {deviceName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset Command Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {['adb devices', 'adb shell dumpsys battery', 'adb logcat', 'scrcpy --max-fps 120'].map((preset) => (
            <button
              key={preset}
              onClick={() => handleRunCommand(preset)}
              className="px-2.5 py-1 glass hover:bg-white/10 border border-white/10 text-[11px] font-mono text-blue-300 rounded-lg transition-colors"
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Console Log Output */}
        <div className="p-4 bg-black/50 rounded-xl border border-white/10 h-64 overflow-y-auto font-mono text-xs text-gray-300 space-y-2">
          {logs.map((log, idx) => (
            <div key={idx} className={log.startsWith('$') ? 'text-blue-400 font-bold' : 'text-gray-300 whitespace-pre-wrap'}>
              {log}
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={inputCmd}
            onChange={(e) => setInputCmd(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRunCommand()}
            placeholder="Enter adb command (e.g. adb shell input tap 500 500)..."
            className="flex-1 px-4 py-2 glass border border-white/10 rounded-xl text-xs font-mono text-gray-200 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={() => handleRunCommand()}
            className="px-4 py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center space-x-1 active-ring"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Run</span>
          </button>
        </div>
      </div>
    </div>
  );
};
