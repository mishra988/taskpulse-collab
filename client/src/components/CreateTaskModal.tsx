import React, { useState } from 'react';
import { TaskStatus, TaskPriority } from '../types';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { X, Plus, Calendar, Tag, AlertCircle } from 'lucide-react';

interface CreateTaskModalProps {
  initialStatus: TaskStatus;
  onClose: () => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ initialStatus, onClose }) => {
  const { createTask, currentProjectId } = useSocket();
  const { availableUsers } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(initialStatus || 'todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [tagsInput, setTagsInput] = useState<string>('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    const selectedAssignee = availableUsers.find((u) => u._id === assigneeId);
    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    createTask({
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      projectId: currentProjectId,
      assignee: selectedAssignee
        ? { _id: selectedAssignee._id, name: selectedAssignee.name, avatar: selectedAssignee.avatar }
        : undefined,
      dueDate: dueDate || undefined,
      tags: parsedTags,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg glass-panel rounded-2xl flex flex-col shadow-2xl overflow-hidden border border-[#1f293d]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1f293d] flex items-center justify-between bg-[#161f33]/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-base text-white">Create New Task</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#94a3b8] hover:text-white hover:bg-[#1e2942] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-[#94a3b8] block mb-1">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. Implement WebSocket reconnection strategy"
              className="w-full px-4 py-2.5 rounded-xl bg-[#111827] border border-[#1f293d] focus:border-blue-500 text-sm text-white placeholder-[#64748b] focus:outline-none transition"
            />
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#94a3b8] block mb-1">Column</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 rounded-xl bg-[#111827] border border-[#1f293d] text-sm text-white focus:outline-none focus:border-blue-500 transition"
              >
                <option value="backlog">Backlog</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#94a3b8] block mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 rounded-xl bg-[#111827] border border-[#1f293d] text-sm text-white focus:outline-none focus:border-blue-500 transition"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Assignee & Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-[#94a3b8] block mb-1">Assignee</label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#111827] border border-[#1f293d] text-sm text-white focus:outline-none focus:border-blue-500 transition"
              >
                <option value="">Unassigned</option>
                {availableUsers.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#94a3b8] block mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#111827] border border-[#1f293d] text-sm text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-[#94a3b8] block mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context, acceptance criteria or steps..."
              className="w-full px-4 py-2.5 rounded-xl bg-[#111827] border border-[#1f293d] focus:border-blue-500 text-sm text-white placeholder-[#64748b] focus:outline-none transition resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-semibold text-[#94a3b8] block mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. Backend, API, UI"
              className="w-full px-4 py-2 rounded-xl bg-[#111827] border border-[#1f293d] focus:border-blue-500 text-sm text-white placeholder-[#64748b] focus:outline-none transition"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#1f293d]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-[#94a3b8] hover:text-white hover:bg-[#1e2942] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/30 transition"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
