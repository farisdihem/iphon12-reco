import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Usb, X, RefreshCw } from 'lucide-react';

interface UsbNetworkInfo {
  interface_name: string;
  ip_address: string;
}

interface PairingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PairingModal: React.FC<PairingModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [pinCode, setPinCode] = useState('------');
  const [usbNetworks, setUsbNetworks] = useState<UsbNetworkInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPayload = () => {
    setLoading(true);
    invoke<{ pin: string; usb_networks: UsbNetworkInfo[] }>('get_pairing_payload')
      .then((payload) => {
        setPinCode(payload.pin);
        setUsbNetworks(payload.usb_networks);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen) {
      fetchPayload();
    } else {
      setPinCode('------');
      setUsbNetworks([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass rounded-2xl w-full max-w-lg p-6 space-y-6 shadow-2xl border border-white/10 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        <div className="flex items-center space-x-3 border-b border-white/10 pb-4">
          <div className="p-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-xl">
            <Usb className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white tracking-tight">USB Connection</h3>
            <p className="text-sm text-gray-400">Connect via iPhone Personal Hotspot over USB</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-black/30 rounded-xl border border-white/5 space-y-2">
            <h4 className="text-sm font-medium text-gray-300">Pairing PIN</h4>
            <div className="text-4xl font-bold text-center tracking-[0.5em] text-white bg-white/5 py-4 rounded-lg">
              {pinCode}
            </div>
          </div>

          <div className="p-4 bg-black/30 rounded-xl border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-300">Detected USB Networks</h4>
              <button 
                onClick={fetchPayload}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors flex items-center text-xs text-gray-400"
                disabled={loading}
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
            
            {usbNetworks.length === 0 ? (
              <div className="text-sm text-yellow-400/90 text-center py-2 bg-yellow-500/10 rounded-lg">
                No USB networks detected. Connect your iPhone and enable Personal Hotspot over USB.
              </div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {usbNetworks.map((net, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm p-2 bg-white/5 rounded-lg">
                    <span className="text-gray-400 truncate w-1/3">{net.interface_name}</span>
                    <span className="font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">{net.ip_address}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="text-xs text-gray-500 mt-2">
              <span className="font-semibold text-gray-400">QUIC Port:</span> 8492
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
