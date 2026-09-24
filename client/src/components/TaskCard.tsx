import React from 'react';
import { ITask } from '../types';
import { useSocket } from '../context/SocketContext';
import { Calendar, MessageSquare, Tag, Eye } from 'lucide-react';

interface TaskCardProps {
  task: ITask;
  onClick: (task: ITask) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, onDragStart }) => {
  const { taskPresences } = useSocket();
  const remotePresence = taskPresences[task._id];

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'priority-urgent';
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      default:
        return 'priority-low';
    }
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task._id)}
      onClick={() => onClick(task)}
      className={`group relative rounded-xl p-4 transition-all duration-200 cursor-grab active:cursor-grabbing border ${
        remotePresence
          ? 'bg-[#1b233a] border-amber-500/50 shadow-lg shadow-amber-500/10'
          : 'bg-[#161f33] hover:bg-[#1e2942] border-[#1f293d] hover:border-[#3b82f6]/40 shadow-md hover:shadow-xl'
      }`}
    >
      {/* Remote active presence badge */}
      {remotePresence && (
        <div className="mb-2.5 flex items-center justify-between text-[11px] px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-400 presence-pulse-editing inline-block" />
            <Eye className="w-3 h-3 inline" />
            {remotePresence.userName} is viewing
          </span>
          <span className="text-[9px] uppercase font-mono opacity-80">Live</span>
        </div>
      )}

      {/* Header: Priority & Tags */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${getPriorityClass(
            task.priority
          )}`}
        >
          {task.priority}
        </span>

        {task.tags && task.tags.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#1f293d] text-[#94a3b8] font-mono">
              #{task.tags[0]}
            </span>
            {task.tags.length > 1 && (
              <span className="text-[10px] text-[#64748b]">+{task.tags.length - 1}</span>
            )}
          </div>
        )}
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold text-[#f8fafc] mb-1.5 line-clamp-2 group-hover:text-blue-400 transition-colors">
        {task.title}
      </h4>

      {/* Description Snippet */}
      {task.description && (
        <p className="text-xs text-[#94a3b8] line-clamp-2 mb-3 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Card Footer: Assignee & Meta */}
      <div className="flex items-center justify-between pt-2.5 border-t border-[#1f293d]/80 text-[#94a3b8]">
        {/* Assignee */}
        <div className="flex items-center gap-2">
          {task.assignee ? (
            <div className="flex items-center gap-1.5">
              <img
                src={
                  task.assignee.avatar ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${task.assignee.name}`
                }
                alt={task.assignee.name}
                className="w-5 h-5 rounded-full object-cover border border-[#1f293d]"
              />
              <span className="text-[11px] truncate max-w-[80px] font-medium text-[#cbd5e1]">
                {task.assignee.name}
              </span>
            </div>
          ) : (
            <span className="text-[11px] text-[#64748b] italic">Unassigned</span>
          )}
        </div>

        {/* Date & Comments */}
        <div className="flex items-center gap-3 text-[11px]">
          {task.dueDate && (
            <div className="flex items-center gap-1 text-[#64748b]" title={`Due ${task.dueDate}`}>
              <Calendar className="w-3.5 h-3.5" />
              <span>{task.dueDate.split('-').slice(1).join('/')}</span>
            </div>
          )}

          {task.comments && task.comments.length > 0 && (
            <div
              className="flex items-center gap-1 text-blue-400 font-medium"
              title={`${task.comments.length} comments`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{task.comments.length}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
