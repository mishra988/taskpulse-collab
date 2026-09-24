import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  Layers,
  Wifi,
  WifiOff,
  Plus,
  Activity as ActivityIcon,
  ChevronDown,
  UserCheck,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  onOpenCreateModal: () => void;
  onToggleActivityFeed: () => void;
  showActivityFeed: boolean;
  activityCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCreateModal,
  onToggleActivityFeed,
  showActivityFeed,
  activityCount,
}) => {
  const { currentUser, availableUsers, switchUser } = useAuth();
  const { isConnected, activeUsers, currentProjectId, setCurrentProjectId } = useSocket();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);

  const projects = [
    { id: 'proj_main', name: 'TaskPulse Real-Time Core', key: 'TPC' },
    { id: 'proj_mobile', name: 'Mobile App Next Gen', key: 'MAG' },
  ];

  const currentProject = projects.find((p) => p.id === currentProjectId) || projects[0];

  return (
    <header className="sticky top-0 z-30 glass border-b border-[#1f293d] px-4 md:px-8 py-3">
      <div className="max-w-[1700px] mx-auto flex items-center justify-between gap-4">
        {/* Left: Brand & Project Selector */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white">TaskPulse</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-semibold border border-blue-500/30">
                  REAL-TIME
                </span>
              </div>
              <p className="text-[12px] text-[#94a3b8] flex items-center gap-1.5">
                {isConnected ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 presence-pulse inline-block" />
                    <span className="text-emerald-400 font-medium">Socket.IO Live</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                    <span className="text-amber-400">Connecting...</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="hidden md:block h-6 w-px bg-[#1f293d]" />

          {/* Project Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowProjectDropdown(!showProjectDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#161f33] hover:bg-[#1e2942] border border-[#1f293d] transition text-sm text-[#f8fafc]"
            >
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="font-medium">{currentProject.name}</span>
              <span className="text-[11px] text-[#94a3b8] font-mono">[{currentProject.key}]</span>
              <ChevronDown className="w-4 h-4 text-[#94a3b8]" />
            </button>

            {showProjectDropdown && (
              <div className="absolute left-0 mt-2 w-64 rounded-xl glass-panel shadow-2xl p-1.5 z-50 border border-[#1f293d]">
                <div className="px-3 py-2 text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">
                  Select Workspace
                </div>
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setCurrentProjectId(p.id);
                      setShowProjectDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center justify-between ${
                      p.id === currentProjectId
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-medium'
                        : 'text-[#94a3b8] hover:text-white hover:bg-[#1e2942]'
                    }`}
                  >
                    <span>{p.name}</span>
                    <span className="text-xs font-mono opacity-70">[{p.key}]</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center/Right: Active Presence avatars & actions */}
        <div className="flex items-center gap-4">
          {/* Active Collaborators online */}
          <div className="hidden lg:flex items-center gap-2 bg-[#111827]/80 px-3 py-1.5 rounded-xl border border-[#1f293d]">
            <span className="text-xs font-medium text-[#94a3b8] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Online ({activeUsers.length || 1}):
            </span>
            <div className="flex items-center -space-x-2">
              {activeUsers.map((item, idx) => (
                <div
                  key={item.socketId || idx}
                  title={`${item.user.name} (${item.user.role || 'Member'}) ${
                    item.isEditing ? '- Currently editing' : ''
                  }`}
                  className="relative group cursor-pointer"
                >
                  <img
                    src={
                      item.user.avatar ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user.name}`
                    }
                    alt={item.user.name}
                    className={`w-7 h-7 rounded-full border-2 border-[#111827] object-cover ${
                      item.isEditing ? 'ring-2 ring-amber-400' : 'ring-2 ring-emerald-500'
                    }`}
                  />
                  {item.isEditing && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full presence-pulse-editing" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Demo User Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#161f33] hover:bg-[#1e2942] border border-[#1f293d] transition"
              title="Click to test multi-user real-time sync with another persona!"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-7 h-7 rounded-full object-cover border border-blue-500"
              />
              <div className="text-left hidden sm:block">
                <div className="text-xs font-semibold text-[#f8fafc] leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-blue-400 leading-tight">
                  {currentUser.role} (Switch)
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#94a3b8]" />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl glass-panel shadow-2xl p-2 z-50 border border-[#1f293d]">
                <div className="px-3 py-2 text-xs font-semibold text-[#94a3b8] uppercase tracking-wider flex items-center justify-between">
                  <span>Switch Demo Persona</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <p className="px-3 pb-2 text-[11px] text-[#64748b]">
                  Test real-time sync between 2 personas or open this in 2 tabs!
                </p>
                {availableUsers.map((u) => (
                  <button
                    key={u._id}
                    onClick={() => {
                      switchUser(u._id);
                      setShowUserDropdown(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition ${
                      u._id === currentUser._id
                        ? 'bg-blue-600/20 text-white border border-blue-500/30'
                        : 'text-[#94a3b8] hover:text-white hover:bg-[#1e2942]'
                    }`}
                  >
                    <img src={u.avatar} alt={u.name} className="w-7 h-7 rounded-full object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-white truncate">{u.name}</div>
                      <div className="text-[11px] text-[#64748b]">{u.role}</div>
                    </div>
                    {u._id === currentUser._id && (
                      <UserCheck className="w-4 h-4 text-blue-400" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Activity Stream Drawer Button */}
          <button
            onClick={onToggleActivityFeed}
            className={`relative p-2 rounded-xl border transition ${
              showActivityFeed
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-[#161f33] hover:bg-[#1e2942] text-[#94a3b8] hover:text-white border-[#1f293d]'
            }`}
            title="Live Activity Stream"
          >
            <ActivityIcon className="w-4 h-4" />
            {activityCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-[10px] text-white flex items-center justify-center font-bold">
                {activityCount > 9 ? '9+' : activityCount}
              </span>
            )}
          </button>

          {/* Create Task Button */}
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/30 transition transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Task</span>
          </button>
        </div>
      </div>
    </header>
  );
};
