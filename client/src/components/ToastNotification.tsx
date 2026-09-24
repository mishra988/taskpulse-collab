import React from 'react';
import { useSocket } from '../context/SocketContext';
import { X, Bell } from 'lucide-react';

export const ToastNotification: React.FC = () => {
  const { toasts, dismissToast } = useSocket();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl glass-panel shadow-2xl border border-blue-500/30 text-white text-xs animate-slide-up"
        >
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-blue-400 presence-pulse inline-block" />
            <span className="font-medium text-[#f8fafc]">{toast.message}</span>
          </div>
          <button
            onClick={() => dismissToast(toast.id)}
            className="p-1 rounded-md text-[#94a3b8] hover:text-white hover:bg-[#1e2942] transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
