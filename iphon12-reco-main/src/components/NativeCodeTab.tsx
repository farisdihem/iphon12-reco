import React, { useState } from 'react';
import { 
  Code2, 
  Copy, 
  Check, 
  Download, 
  Terminal, 
  Cpu, 
  Layers, 
  CheckCircle2,
  FileCode
} from 'lucide-react';
import { RUST_AUDIO_WASAPI, KOTLIN_ANDROID_SERVICE, TAURI_IPC_CHANNELS, SWIFT_IOS_SERVICE } from '../data/nativeCode';

export const NativeCodeTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'rust' | 'swift' | 'kotlin' | 'tauri'>('swift');
  const [copied, setCopied] = useState(false);

  const getActiveCode = () => {
    switch (activeTab) {
      case 'swift': return SWIFT_IOS_SERVICE;
      case 'rust': return RUST_AUDIO_WASAPI;
      case 'kotlin': return KOTLIN_ANDROID_SERVICE;
      case 'tauri': return TAURI_IPC_CHANNELS;
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadBlueprint = () => {
    const code = getActiveCode();
    const filename = activeTab === 'swift' ? 'NexusLinkEngine.swift' : activeTab === 'rust' ? 'wasapi_engine.rs' : activeTab === 'kotlin' ? 'PhoneLinkService.kt' : 'main.rs';
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header Banner */}
      <div className="glass p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-100 flex items-center space-x-2">
            <Code2 className="w-5 h-5 text-amber-400" />
            <span>Native Low-Level Architecture & Source Code Studio</span>
          </h2>
          <p className="text-xs text-gray-400">
            Export production-ready Rust (WASAPI/Opus), Android Kotlin (AudioPlaybackCapture), and Tauri 2 Zero-Copy IPC channels.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopyCode}
            className="px-3.5 py-2 rounded-xl glass hover:bg-white/10 text-gray-200 border border-white/10 text-xs font-semibold transition-colors flex items-center space-x-1.5"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
            <span>{copied ? 'Copied Code!' : 'Copy Source Code'}</span>
          </button>

          <button
            onClick={handleDownloadBlueprint}
            className="px-4 py-2 rounded-xl bg-amber-500/30 hover:bg-amber-500/40 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all shadow-md flex items-center space-x-1.5 active-ring"
          >
            <Download className="w-4 h-4" />
            <span>Download .rs / .kt File</span>
          </button>
        </div>
      </div>

      {/* Code Viewer Panel */}
      <div className="glass overflow-hidden">
        {/* Language Tabs */}
        <div className="flex items-center space-x-1 p-2 bg-black/40 border-b border-white/10 overflow-x-auto">
          <button
            onClick={() => setActiveTab('swift')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 ${
              activeTab === 'swift'
                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 active-ring'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            <FileCode className="w-4 h-4 text-orange-400" />
            <span>iOS Swift Companion (NexusLinkEngine.swift)</span>
          </button>

          <button
            onClick={() => setActiveTab('rust')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 ${
              activeTab === 'rust'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 active-ring'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            <FileCode className="w-4 h-4 text-amber-400" />
            <span>Rust WASAPI Engine (wasapi_engine.rs)</span>
          </button>

          <button
            onClick={() => setActiveTab('kotlin')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 ${
              activeTab === 'kotlin'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 active-ring'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            <FileCode className="w-4 h-4 text-purple-400" />
            <span>Android Kotlin Companion (PhoneLinkService.kt)</span>
          </button>

          <button
            onClick={() => setActiveTab('tauri')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
              activeTab === 'tauri'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 active-ring'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
          >
            <FileCode className="w-4 h-4 text-blue-400" />
            <span>Tauri 2 Zero-Copy IPC (main.rs)</span>
          </button>
        </div>

        {/* Code Content Box */}
        <div className="p-6 bg-black/50 overflow-x-auto">
          <pre className="font-mono text-xs text-gray-300 leading-relaxed">
            <code>{getActiveCode()}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
