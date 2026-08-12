import React from 'react';
import { 
  Smartphone, 
  Wifi, 
  Usb, 
  Battery, 
  BatteryCharging, 
  Radio, 
  Usb, 
  Terminal, 
  Volume2, 
  Settings,
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react';
import { DeviceInfo, AudioSettings } from '../types';

interface HeaderProps {
  activeDevice: DeviceInfo;
  audioSettings: AudioSettings;
  onOpenPairing: () => void;
  onOpenAdb: () => void;
  onOpenSettings: () => void;
  onToggleAudioTone: () => void;
  isAudioToneActive: boolean;
  lang?: 'en' | 'ar';
  onToggleLang?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeDevice,
  audioSettings,
  onOpenPairing,
  onOpenAdb,
  onOpenSettings,
  onToggleAudioTone,
  isAudioToneActive,
  lang = 'ar',
  onToggleLang,
}) => {
  const isAr = lang === 'ar';

  return (
    <header className="h-16 glass-header px-4 md:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* App Branding & Current Device Info */}
      <div className="flex items-center space-x-3 md:space-x-4 rtl:space-x-reverse">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400/30">
          <Zap className="w-5 h-5 fill-current" />
        </div>
        <div>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <h1 className="text-base font-bold text-gray-100 tracking-tight">NexusLink</h1>
            <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full">
              {isAr ? 'iPhone ↔ Windows' : 'iPhone ↔ Windows'}
            </span>
          </div>
          <p className="text-xs text-gray-400 hidden sm:block">
            {isAr ? 'الصوت والفيديو عالي الدقة بدون تأخير' : 'High Quality Audio & Video Link'}
          </p>
        </div>
      </div>

      {/* Connection & Status Pill */}
      <div className="flex items-center space-x-3 rtl:space-x-reverse">
        {/* Action Buttons */}
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          {/* Language Toggle Button */}
          {onToggleLang && (
            <button
              onClick={onToggleLang}
              className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 rtl:space-x-reverse transition-all glass hover:bg-white/10 text-gray-200 border border-white/10"
              title="تغيير اللغة / Switch Language"
            >
              <Globe className="w-4 h-4 text-blue-400" />
              <span>{isAr ? 'العربية' : 'EN'}</span>
            </button>
          )}

          {/* Settings Button ⚙ */}
          <button
            onClick={onOpenSettings}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 shadow-md transition-all flex items-center space-x-1.5 rtl:space-x-reverse text-xs font-bold active-ring"
            title={isAr ? 'إعدادات النظام والمطور' : 'Settings'}
          >
            <Settings className="w-4 h-4 text-blue-400 animate-spin-slow" />
            <span>{isAr ? '⚙ الإعدادات' : '⚙ Settings'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

