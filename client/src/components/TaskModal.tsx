import React, { useState, useEffect } from 'react';
import { ITask, TaskStatus, TaskPriority } from '../types';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Calendar,
  User,
  Trash2,
  Send,
  MessageSquare,
  Sparkles,
  Clock,
  Tag,
  AlertCircle,
} from 'lucide-react';

interface TaskModalProps {
  task: ITask | null;
  onClose: () => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({ task, onClose }) => {
  const { updateTask, deleteTask, addComment, focusTask, blurTask, currentProjectId } = useSocket();
  const { currentUser, availableUsers } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [tagsInput, setTagsInput] = useState<string>('');
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority);
      setAssigneeId(task.assignee?._id || '');
      setDueDate(task.dueDate || '');
      setTagsInput(task.tags ? task.tags.join(', ') : '');

      // Broadcast live presence to all peers that current user is inspecting/editing this task
      focusTask(task._id, true);
    }

    return () => {
      blurTask();
    };
  }, [task]);

  if (!task) return null;

  const handleSaveDetails = () => {
    const selectedAssignee = availableUsers.find((u) => u._id === assigneeId);
    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    updateTask(task._id, {
      title,
      description,
      status,
      priority,
      assignee: selectedAssignee
        ? { _id: selectedAssignee._id, name: selectedAssignee.name, avatar: selectedAssignee.avatar }
        : undefined,
      dueDate,
      tags: parsedTags,
    });
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    addComment(task._id, newComment.trim());
    setNewComment('');
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      deleteTask(task._id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] glass-panel rounded-2xl flex flex-col shadow-2xl overflow-hidden border border-[#1f293d]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1f293d] flex items-center justify-between bg-[#161f33]/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">
              TASK-{task._id.substring(task._id.length - 4).toUpperCase()}
            </span>
            <span className="text-xs text-[#94a3b8]">Live Collaborative Workspace</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              className="p-2 rounded-lg text-[#94a3b8] hover:text-red-400 hover:bg-red-500/10 transition"
              title="Delete Task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-[#94a3b8] hover:text-white hover:bg-[#1e2942] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Title Input */}
          <div>
            <label className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider block mb-1.5">
              Task Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleSaveDetails}
              className="w-full text-lg font-bold bg-[#111827] border border-[#1f293d] focus:border-blue-500 rounded-xl px-4 py-2.5 text-white placeholder-[#64748b] focus:outline-none transition"
              placeholder="Task title..."
            />
          </div>

          {/* Grid Settings: Status, Priority, Assignee, Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status */}
            <div>
              <label className="text-xs font-semibold text-[#94a3b8] block mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => {
                  const val = e.target.value as TaskStatus;
                  setStatus(val);
                  updateTask(task._id, { status: val });
                }}
                className="w-full px-3 py-2 rounded-xl bg-[#111827] border border-[#1f293d] text-sm text-white focus:outline-none focus:border-blue-500 transition"
              >
                <option value="backlog">Backlog</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="done">Done</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="text-xs font-semibold text-[#94a3b8] block mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => {
                  const val = e.target.value as TaskPriority;
                  setPriority(val);
                  updateTask(task._id, { priority: val });
                }}
                className="w-full px-3 py-2 rounded-xl bg-[#111827] border border-[#1f293d] text-sm text-white focus:outline-none focus:border-blue-500 transition"
              >
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Assignee */}
            <div>
              <label className="text-xs font-semibold text-[#94a3b8] block mb-1">Assignee</label>
              <select
                value={assigneeId}
                onChange={(e) => {
                  const val = e.target.value;
                  setAssigneeId(val);
                  const selected = availableUsers.find((u) => u._id === val);
                  updateTask(task._id, {
                    assignee: selected
                      ? { _id: selected._id, name: selected.name, avatar: selected.avatar }
                      : undefined,
                  });
                }}
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

            {/* Due Date */}
            <div>
              <label className="text-xs font-semibold text-[#94a3b8] block mb-1">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  updateTask(task._id, { dueDate: e.target.value });
                }}
                className="w-full px-3 py-2 rounded-xl bg-[#111827] border border-[#1f293d] text-sm text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider block mb-1.5">
              Description
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleSaveDetails}
              placeholder="Add detailed task description, acceptance criteria, or links..."
              className="w-full bg-[#111827] border border-[#1f293d] focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#64748b] focus:outline-none transition resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <Tag className="w-3.5 h-3.5 text-blue-400" />
              <span>Tags (comma-separated)</span>
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              onBlur={handleSaveDetails}
              placeholder="e.g. Backend, WebSockets, Frontend, Urgent"
              className="w-full bg-[#111827] border border-[#1f293d] focus:border-blue-500 rounded-xl px-4 py-2 text-sm text-white placeholder-[#64748b] focus:outline-none transition"
            />
          </div>

          {/* Real-Time Comments Section */}
          <div className="pt-4 border-t border-[#1f293d]">
            <h5 className="text-sm font-semibold text-[#f8fafc] mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              <span>Discussion & Real-Time Remarks ({task.comments?.length || 0})</span>
            </h5>

            {/* Comments List */}
            <div className="space-y-3 mb-4 max-h-56 overflow-y-auto pr-1">
              {!task.comments || task.comments.length === 0 ? (
                <p className="text-xs text-[#64748b] italic">
                  No comments yet. Start a discussion with your team below.
                </p>
              ) : (
                task.comments.map((comm) => (
                  <div
                    key={comm._id}
                    className="p-3 rounded-xl bg-[#111827]/80 border border-[#1f293d] flex items-start gap-3"
                  >
                    <img
                      src={
                        comm.userAvatar ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${comm.userName}`
                      }
                      alt={comm.userName}
                      className="w-7 h-7 rounded-full object-cover border border-[#1f293d]"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-white">{comm.userName}</span>
                        <span className="text-[10px] text-[#64748b]">
                          {new Date(comm.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-[#cbd5e1] leading-relaxed break-words">
                        {comm.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="flex items-center gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={`Leave a comment as ${currentUser.name}...`}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#111827] border border-[#1f293d] text-sm text-white placeholder-[#64748b] focus:outline-none focus:border-blue-500 transition"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition flex items-center gap-1.5 shadow-md shadow-blue-600/30"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#1f293d] bg-[#161f33]/60 flex items-center justify-between text-xs text-[#94a3b8]">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            Created {new Date(task.createdAt).toLocaleDateString()} by {task.creator?.name}
          </span>
          <button
            onClick={() => {
              handleSaveDetails();
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg bg-[#1f293d] hover:bg-[#27354f] text-white font-medium transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
