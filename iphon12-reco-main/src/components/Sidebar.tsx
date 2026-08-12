import React from 'react';
import { 
  LayoutDashboard, 
  Smartphone, 
  Volume2, 
  FolderSync, 
  Activity, 
  Code2, 
  Layers
} from 'lucide-react';
import { AppTab } from '../types';

interface SidebarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  fileQueueCount: number;
  audioLatencyMs: number;
  lang?: 'en' | 'ar';
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  fileQueueCount,
  audioLatencyMs,
  lang = 'ar',
}) => {
  const isAr = lang === 'ar';

  const navItems = [
    {
      id: 'overview' as AppTab,
      label: isAr ? 'مركز التحكم' : 'Control Center',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'mirror' as AppTab,
      label: isAr ? 'بث الشاشة' : 'Screen Mirror',
      icon: Smartphone,
      badge: '120 FPS',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    },
    {
      id: 'audio' as AppTab,
      label: isAr ? 'محرك الصوت' : 'Audio Engine',
      icon: Volume2,
      badge: `${audioLatencyMs}ms`,
      badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    },
    {
      id: 'files' as AppTab,
      label: isAr ? 'جسر الملفات' : 'File Bridge',
      icon: FolderSync,
      badge: fileQueueCount > 0 ? `${fileQueueCount}` : null,
      badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    },
    {
      id: 'telemetry' as AppTab,
      label: isAr ? 'الإحصائيات والشبكة' : 'Telemetry & Stats',
      icon: Activity,
      badge: isAr ? 'مباشر' : 'Live',
      badgeColor: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    },
    {
      id: 'code' as AppTab,
      label: isAr ? 'الكود المصدري الأصلي' : 'Native Source Code',
      icon: Code2,
      badge: 'Rust/Kotlin',
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    },
  ];

  return (
    <aside className="w-64 glass-sidebar flex flex-col justify-between shrink-0 hidden md:flex">
      <div className="p-5 space-y-6">
        {/* Navigation Group Header */}
        <div>
          <p className="px-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
            {isAr ? 'القائمة الرئيسية' : 'Navigation'}
          </p>
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-white/10 text-blue-400 border border-white/15 shadow-md shadow-blue-900/10'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-gray-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`px-2 py-0.5 text-[10px] font-semibold border rounded-md ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* System Architecture Box */}
        <div className="glass p-4 space-y-2.5">
          <div className="flex items-center space-x-2 rtl:space-x-reverse text-xs font-semibold text-gray-200">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>{isAr ? 'طبقة النقل النشطة' : 'Active Transport Layer'}</span>
          </div>
          <div className="text-[11px] text-gray-400 space-y-1.5">
            <div className="flex justify-between">
              <span>{isAr ? 'بروتوكول النقل:' : 'Transport Protocol:'}</span>
              <span className="font-mono text-emerald-400">QUIC / UDP</span>
            </div>
            <div className="flex justify-between">
              <span>{isAr ? 'الخلفية المضيفة:' : 'Host PC Backend:'}</span>
              <span className="font-mono text-gray-200">Tauri 2 + Rust</span>
            </div>
            <div className="flex justify-between">
              <span>{isAr ? 'نظام الصوت:' : 'Audio System:'}</span>
              <span className="font-mono text-blue-300">WASAPI / PipeWire</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer System Health */}
      <div className="p-4 border-t border-white/5 bg-black/20">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 rtl:space-x-reverse text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{isAr ? 'الاتصال مستقر وممتاز' : 'Link Active & Healthy'}</span>
          </div>
          <span className="text-gray-500 font-mono text-[11px]">0.03% Loss</span>
        </div>
      </div>
    </aside>
  );
};
