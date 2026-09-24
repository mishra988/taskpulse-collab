import React, { useState } from 'react';
import { ITask, TaskStatus, KanbanColumn } from '../types';
import { TaskCard } from './TaskCard';
import { useSocket } from '../context/SocketContext';
import { Plus, Search, Filter, CheckCircle2, ListFilter } from 'lucide-react';
import confetti from 'canvas-confetti';

interface KanbanBoardProps {
  tasks: ITask[];
  onSelectTask: (task: ITask) => void;
  onOpenCreateWithStatus: (status: TaskStatus) => void;
}

const COLUMNS: KanbanColumn[] = [
  { id: 'backlog', title: 'Backlog', color: 'text-slate-400', badgeBg: 'bg-slate-500/20 text-slate-300' },
  { id: 'todo', title: 'To Do', color: 'text-blue-400', badgeBg: 'bg-blue-500/20 text-blue-300' },
  { id: 'in_progress', title: 'In Progress', color: 'text-amber-400', badgeBg: 'bg-amber-500/20 text-amber-300' },
  { id: 'in_review', title: 'In Review', color: 'text-purple-400', badgeBg: 'bg-purple-500/20 text-purple-300' },
  { id: 'done', title: 'Done', color: 'text-emerald-400', badgeBg: 'bg-emerald-500/20 text-emerald-300' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onSelectTask,
  onOpenCreateWithStatus,
}) => {
  const { moveTask } = useSocket();
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [activeDropColumn, setActiveDropColumn] = useState<TaskStatus | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, colId: TaskStatus) => {
    e.preventDefault();
    if (activeDropColumn !== colId) {
      setActiveDropColumn(colId);
    }
  };

  const handleDragLeave = () => {
    setActiveDropColumn(null);
  };

  const handleDrop = (targetStatus: TaskStatus) => {
    if (!draggedTaskId) return;

    const task = tasks.find((t) => t._id === draggedTaskId);
    if (task && task.status !== targetStatus) {
      moveTask(draggedTaskId, targetStatus, 0);

      if (targetStatus === 'done') {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      }
    }

    setDraggedTaskId(null);
    setActiveDropColumn(null);
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPriority = selectedPriority === 'all' || t.priority === selectedPriority;
    const matchesAssignee =
      selectedAssignee === 'all' ||
      (selectedAssignee === 'unassigned' ? !t.assignee : t.assignee?._id === selectedAssignee);

    return matchesSearch && matchesPriority && matchesAssignee;
  });

  return (
    <div className="flex flex-col flex-1 h-[calc(100vh-70px)] overflow-hidden">
      {/* Search & Filter Toolbar */}
      <div className="px-4 md:px-8 py-3 glass border-b border-[#1f293d] flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tasks by title, description or #tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-[#161f33] border border-[#1f293d] text-sm text-[#f8fafc] placeholder-[#64748b] focus:outline-none focus:border-blue-500 transition"
            />
          </div>
        </div>

        {/* Priority & Assignee Filters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-[#94a3b8]">
            <ListFilter className="w-3.5 h-3.5 text-blue-400" />
            <span>Priority:</span>
          </div>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-[#161f33] border border-[#1f293d] text-xs text-[#cbd5e1] focus:outline-none focus:border-blue-500 transition"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <div className="h-4 w-px bg-[#1f293d] hidden sm:block" />

          <div className="text-xs text-[#94a3b8] hidden sm:flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{tasks.filter((t) => t.status === 'done').length}/{tasks.length} Done</span>
          </div>
        </div>
      </div>

      {/* Board Columns container */}
      <div className="flex-1 overflow-x-auto p-4 md:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-5 min-w-[1200px] h-full items-start">
          {COLUMNS.map((column) => {
            const colTasks = filteredTasks.filter((t) => t.status === column.id);
            const isHovered = activeDropColumn === column.id;

            return (
              <div
                key={column.id}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={() => handleDrop(column.id)}
                className={`flex flex-col max-h-[calc(100vh-175px)] rounded-2xl p-3 border transition-colors ${
                  isHovered
                    ? 'bg-[#18233b] border-blue-500/80 ring-2 ring-blue-500/20'
                    : 'bg-[#111827]/70 border-[#1f293d]/80'
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 px-1 border-b border-[#1f293d]/60 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold text-sm ${column.color}`}>
                      {column.title}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${column.badgeBg}`}
                    >
                      {colTasks.length}
                    </span>
                  </div>

                  <button
                    onClick={() => onOpenCreateWithStatus(column.id)}
                    className="p-1 rounded-lg hover:bg-[#1e2942] text-[#94a3b8] hover:text-white transition"
                    title={`Add task to ${column.title}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Column Task List */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 pb-2">
                  {colTasks.length === 0 ? (
                    <div
                      onClick={() => onOpenCreateWithStatus(column.id)}
                      className="border-2 border-dashed border-[#1f293d] hover:border-[#3b82f6]/50 rounded-xl p-6 text-center text-[#64748b] hover:text-[#94a3b8] cursor-pointer transition flex flex-col items-center justify-center gap-2 group"
                    >
                      <Plus className="w-5 h-5 text-[#64748b] group-hover:text-blue-400 group-hover:scale-110 transition" />
                      <span className="text-xs font-medium">Add a task</span>
                    </div>
                  ) : (
                    colTasks.map((task) => (
                      <TaskCard
                        key={task._id}
                        task={task}
                        onClick={onSelectTask}
                        onDragStart={handleDragStart}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
