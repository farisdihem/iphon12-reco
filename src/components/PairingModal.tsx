import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { invoke } from '@tauri-apps/api/core';
import { 
  QrCode, 
  X, 
  RefreshCw,
} from 'lucide-react';
import { DeviceInfo } from '../types';

interface PairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  allDevices: DeviceInfo[];
  onAddNewDevice: (dev: DeviceInfo) => void;
}

export const PairingModal: React.FC<PairingModalProps> = ({
  isOpen,
  onClose,
  allDevices,
  onAddNewDevice,
}) => {
  const [pinCode, setPinCode] = useState('------');
  const [qrUrl, setQrUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      invoke<{ url: string; pin: string }>('get_pairing_payload')
        .then((payload) => {
          setPinCode(payload.pin);
          setQrUrl(payload.url);
        })
        .catch(console.error);
    } else {
      setPinCode('------');
      setQrUrl('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass rounded-2xl w-full max-w-lg p-6 space-y-6 shadow-2xl animate-scale-in border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-100">Secure Device Pairing & TLS Handshake</h3>
              <p className="text-xs text-gray-400">Scan QR Code or enter 6-digit PIN on NexusLink Companion</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Code & PIN Display */}
        <div className="flex flex-col items-center justify-center p-6 bg-black/40 rounded-xl border border-white/5 space-y-4">
          <div className="bg-white p-3 rounded-2xl flex items-center justify-center shadow-lg">
            {qrUrl ? (
              <QRCodeSVG value={qrUrl} size={180} level="H" includeMargin={false} />
            ) : (
              <div className="w-[180px] h-[180px] flex items-center justify-center text-black/50">Loading...</div>
            )}
          </div>

          <div className="text-center space-y-1">
            <p className="text-xs text-gray-400">6-Digit Secure Verification PIN</p>
            <div className="text-2xl font-mono font-bold text-blue-400 tracking-widest bg-white/5 px-4 py-1.5 rounded-xl border border-white/10 inline-block">
              {pinCode}
            </div>
          </div>
        </div>

        {/* Server Listening Status */}
        <div className="w-full p-4 rounded-xl bg-blue-950/40 border border-blue-500/20 flex items-center justify-center space-x-3 text-blue-300">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
          <span className="text-xs font-bold font-mono">Listening on UDP port 8492...</span>
        </div>
      </div>
    </div>
  );
};
