import React, { useState } from 'react';
import { 
  FolderSync, 
  Upload, 
  Download, 
  CheckCircle2, 
  Pause, 
  Play, 
  X, 
  FileText, 
  Video, 
  Music, 
  HardDrive, 
  ShieldCheck, 
  Zap, 
  Clock, 
  ArrowUpRight, 
  ArrowDownLeft 
} from 'lucide-react';
import { FileTransferItem } from '../types';

interface FileTabProps {
  files: FileTransferItem[];
  setFiles: React.Dispatch<React.SetStateAction<FileTransferItem[]>>;
  onUploadSimulatedFile: (file: File) => void;
}

export const FileTab: React.FC<FileTabProps> = ({
  files,
  setFiles,
  onUploadSimulatedFile,
}) => {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach((file) => {
        onUploadSimulatedFile(file);
      });
    }
  };

  const togglePauseFile = (id: string) => {
    setFiles(prev => prev.map(f => {
      if (f.id === id) {
        return {
          ...f,
          status: f.status === 'transferring' ? 'paused' : 'transferring'
        };
      }
      return f;
    }));
  };

  const cancelFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const downloadFileToComputer = (item: FileTransferItem) => {
    // Generate dummy downloadable blob
    const content = `NexusLink File Transfer Export\nFile: ${item.fileName}\nSize: ${item.fileSize} bytes\nSHA-256: ${item.sha256Hash}\nStatus: Verified Complete`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* File Bridge Header & Dropzone */}
      <div className="glass p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-100 flex items-center space-x-2">
              <FolderSync className="w-5 h-5 text-blue-400" />
              <span>Resumable File Transfer Bridge</span>
            </h2>
            <p className="text-xs text-gray-400">
              Chunk size: 2MB - 4MB • Auto-Resume on reconnect • SHA-256 Checksum validation
            </p>
          </div>

          <label className="px-4 py-2.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/40 border border-blue-500/40 text-blue-300 text-xs font-bold transition-all shadow-md shadow-blue-900/20 cursor-pointer flex items-center space-x-2 active-ring">
            <Upload className="w-4 h-4" />
            <span>Send File to Phone</span>
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) {
                  Array.from(e.target.files).forEach(f => onUploadSimulatedFile(f));
                }
              }}
            />
          </label>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`p-8 rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer ${
            dragOver
              ? 'border-blue-400 bg-blue-500/10'
              : 'border-white/10 bg-black/30 hover:border-white/20'
          }`}
        >
          <Upload className="w-8 h-8 text-blue-400 mx-auto mb-2 animate-bounce" />
          <h4 className="text-sm font-bold text-gray-200">Drag and drop files here to stream to smartphone</h4>
          <p className="text-xs text-gray-500 mt-1">Supports high-speed 1GB+ raw videos, APKs, photos, and music archives</p>
        </div>
      </div>

      {/* Transfers Queue List */}
      <div className="glass p-6 space-y-4">
        <h3 className="text-base font-bold text-gray-100">Active & Completed Transfers</h3>

        <div className="space-y-3">
          {files.map((file) => {
            const percent = Math.round((file.transferredBytes / file.fileSize) * 100);
            const isFinished = file.status === 'completed';

            return (
              <div
                key={file.id}
                className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2.5 rounded-xl ${
                      file.direction === 'pc_to_phone'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {file.direction === 'pc_to_phone' ? (
                        <ArrowUpRight className="w-5 h-5" />
                      ) : (
                        <ArrowDownLeft className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-200 flex items-center space-x-2">
                        <span>{file.fileName}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-black/40 text-gray-400 rounded-full border border-white/5">
                          {(file.fileSize / (1024 * 1024)).toFixed(1)} MB
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 flex items-center space-x-2 mt-0.5">
                        <span className="capitalize">{file.direction.replace('_', ' ')}</span>
                        <span>•</span>
                        <span className="font-mono text-blue-400">{file.speedMbps} Mbps</span>
                        <span>•</span>
                        <span className="font-mono text-gray-500">Chunk {file.currentChunk}/{file.totalChunks}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {isFinished ? (
                      <>
                        <span className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-lg flex items-center space-x-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified SHA-256</span>
                        </span>
                        <button
                          onClick={() => downloadFileToComputer(file)}
                          className="px-3 py-1 glass hover:bg-white/10 text-gray-200 text-xs font-semibold rounded-lg border border-white/10 transition-colors flex items-center space-x-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Save to PC</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => togglePauseFile(file.id)}
                          className="p-1.5 rounded-lg glass text-gray-300 hover:bg-white/10"
                        >
                          {file.status === 'paused' ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => cancelFile(file.id)}
                          className="p-1.5 rounded-lg glass text-rose-400 hover:bg-rose-500/20"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-gray-400">
                    <span>{percent}% Complete</span>
                    <span>{isFinished ? '100%' : `${file.etaSeconds}s remaining`}</span>
                  </div>
                  <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isFinished ? 'bg-emerald-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
