import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  AreaChart, 
  Area 
} from 'recharts';
import { 
  Activity, 
  Zap, 
  Gauge, 
  ShieldAlert, 
  Radio, 
  Cpu, 
  RefreshCw, 
  Flame 
} from 'lucide-react';
import { TelemetryPoint } from '../types';

interface TelemetryTabProps {
  telemetryData: TelemetryPoint[];
  onTriggerStressTest: () => void;
}

export const TelemetryTab: React.FC<TelemetryTabProps> = ({
  telemetryData,
  onTriggerStressTest,
}) => {
  const latest = (telemetryData && Array.isArray(telemetryData) && telemetryData.length > 0)
    ? telemetryData[telemetryData.length - 1]
    : {
        audioLatencyMs: 12,
        videoLatencyMs: 25,
        jitterMs: 1.4,
        packetLossPercent: 0.02,
        throughputMbps: 145,
        fps: 60,
        cpuPercent: 12,
        gpuPercent: 18,
      };

  return (
    <div className="space-y-6 pb-8">
      {/* Header Banner */}
      <div className="glass p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-100 flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <span>Real-Time Latency & Network Telemetry Studio</span>
          </h2>
          <p className="text-xs text-gray-400">
            Monitoring glass-to-glass latency, jitter buffers, throughput, and hardware encoder load.
          </p>
        </div>

        <button
          onClick={onTriggerStressTest}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/80 to-rose-500/80 hover:from-amber-500 hover:to-rose-500 text-white text-xs font-bold transition-all shadow-md flex items-center space-x-2 active-ring border border-amber-400/30"
        >
          <Flame className="w-4 h-4" />
          <span>Simulate Wi-Fi Congestion Spike</span>
        </button>
      </div>

      {/* Top 4 Real-time Gauges */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Audio Latency */}
        <div className="glass p-4 space-y-1">
          <div className="text-xs text-gray-400 flex items-center justify-between">
            <span>Audio Stream Latency</span>
            <Zap className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-blue-400">
            {latest.audioLatencyMs} <span className="text-xs font-normal">ms</span>
          </div>
          <p className="text-[10px] text-gray-500">Target: &lt; 15 ms (WASAPI Mode)</p>
        </div>

        {/* Video Mirror Latency */}
        <div className="glass p-4 space-y-1">
          <div className="text-xs text-gray-400 flex items-center justify-between">
            <span>Mirror Frame Delay</span>
            <Gauge className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-emerald-400">
            {latest.videoLatencyMs} <span className="text-xs font-normal">ms</span>
          </div>
          <p className="text-[10px] text-gray-500">Frame Rate: {latest.fps} FPS</p>
        </div>

        {/* Jitter */}
        <div className="glass p-4 space-y-1">
          <div className="text-xs text-gray-400 flex items-center justify-between">
            <span>Network Jitter</span>
            <Radio className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-purple-400">
            {latest.jitterMs} <span className="text-xs font-normal">ms</span>
          </div>
          <p className="text-[10px] text-gray-500">Adaptive Jitter Buffer: Auto</p>
        </div>

        {/* Packet Loss */}
        <div className="glass p-4 space-y-1">
          <div className="text-xs text-gray-400 flex items-center justify-between">
            <span>Packet Loss Rate</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-amber-400">
            {latest.packetLossPercent} <span className="text-xs font-normal">%</span>
          </div>
          <p className="text-[10px] text-gray-500">PLC Concealment Active</p>
        </div>
      </div>

      {/* Latency & Throughput Recharts Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latency Chart */}
        <div className="glass p-6 space-y-4">
          <h3 className="text-sm font-bold text-gray-100">Audio vs Video Glass-to-Glass Latency (ms)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={telemetryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="time" stroke="#9ca3af" fontSize={11} />
                <YAxis stroke="#9ca3af" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(10, 11, 16, 0.95)', borderColor: 'rgba(255,255,255,0.15)', borderRadius: '12px', fontSize: '12px', color: '#f3f4f6' }}
                />
                <Line type="monotone" dataKey="audioLatencyMs" stroke="#3b82f6" name="Audio Latency (ms)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="videoLatencyMs" stroke="#10b981" name="Video Latency (ms)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Throughput Area Chart */}
        <div className="glass p-6 space-y-4">
          <h3 className="text-sm font-bold text-gray-100">QUIC/UDP Network Throughput (Mbps)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={telemetryData}>
                <defs>
                  <linearGradient id="colorThroughput" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="time" stroke="#9ca3af" fontSize={11} />
                <YAxis stroke="#9ca3af" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(10, 11, 16, 0.95)', borderColor: 'rgba(255,255,255,0.15)', borderRadius: '12px', fontSize: '12px', color: '#f3f4f6' }}
                />
                <Area type="monotone" dataKey="throughputMbps" stroke="#3b82f6" fillOpacity={1} fill="url(#colorThroughput)" name="Throughput (Mbps)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
