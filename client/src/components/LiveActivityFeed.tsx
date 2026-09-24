import React from 'react';
import { useSocket } from '../context/SocketContext';
import { X, Activity as ActivityIcon, CheckCircle2, MessageSquare, ArrowRight, Trash2, PlusCircle } from 'lucide-react';

interface LiveActivityFeedProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LiveActivityFeed: React.FC<LiveActivityFeedProps> = ({ isOpen, onClose }) => {
  const { activities } = useSocket();

  if (!isOpen) return null;

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'created':
        return <PlusCircle className="w-3.5 h-3.5 text-blue-400" />;
      case 'moved':
        return <ArrowRight className="w-3.5 h-3.5 text-amber-400" />;
      case 'commented':
        return <MessageSquare className="w-3.5 h-3.5 text-purple-400" />;
      case 'deleted':
        return <Trash2 className="w-3.5 h-3.5 text-red-400" />;
      default:
        return <ActivityIcon className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  const formatTime = (timeStr: string) => {
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return 'Just now';
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 glass-panel border-l border-[#1f293d] shadow-2xl flex flex-col animate-slide-up">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#1f293d] flex items-center justify-between bg-[#161f33]/80">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <ActivityIcon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">Live Activity Stream</h4>
            <p className="text-[11px] text-[#94a3b8]">Real-time collaboration updates</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-[#94a3b8] hover:text-white hover:bg-[#1e2942] transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Feed list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activities.length === 0 ? (
          <div className="py-12 text-center text-[#64748b] text-xs">
            No activity yet. Move or edit tasks to see live stream updates!
          </div>
        ) : (
          activities.map((act) => (
            <div
              key={act._id}
              className="p-3 rounded-xl bg-[#111827]/90 border border-[#1f293d] hover:border-[#2a374f] transition flex items-start gap-3"
            >
              <img
                src={
                  act.user?.avatar ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${act.user?.name || 'User'}`
                }
                alt={act.user?.name}
                className="w-7 h-7 rounded-full object-cover border border-[#1f293d] flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-semibold text-[#f8fafc] truncate">
                    {act.user?.name}
                  </span>
                  <span className="text-[10px] text-[#64748b] font-mono">
                    {formatTime(act.timestamp)}
                  </span>
                </div>
                <div className="text-xs text-[#94a3b8] flex items-center gap-1.5 mb-1">
                  {getActionBadge(act.action)}
                  <span className="capitalize">{act.action}</span>
                  <span className="text-white font-medium truncate">
                    "{act.targetTitle}"
                  </span>
                </div>
                {act.details && (
                  <p className="text-[11px] text-[#64748b] italic bg-[#0f172a] px-2 py-1 rounded border border-[#1e293b]">
                    {act.details}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
