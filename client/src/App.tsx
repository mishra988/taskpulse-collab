import React, { useState, useEffect, useCallback } from 'react';
import { ITask, TaskStatus } from './types';
import { api } from './services/api';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import { Navbar } from './components/Navbar';
import { KanbanBoard } from './components/KanbanBoard';
import { TaskModal } from './components/TaskModal';
import { CreateTaskModal } from './components/CreateTaskModal';
import { LiveActivityFeed } from './components/LiveActivityFeed';
import { ToastNotification } from './components/ToastNotification';

interface AppContentProps {
  tasks: ITask[];
  loading: boolean;
}

const AppContent: React.FC<AppContentProps> = ({ tasks, loading }) => {
  const { activities } = useSocket();

  const [selectedTask, setSelectedTask] = useState<ITask | null>(null);
  const [createModalStatus, setCreateModalStatus] = useState<TaskStatus | null>(null);
  const [showActivityFeed, setShowActivityFeed] = useState<boolean>(false);

  // Keep selectedTask in sync when updated in tasks array
  useEffect(() => {
    if (selectedTask) {
      const refreshed = tasks.find((t) => t._id === selectedTask._id);
      if (refreshed) {
        setSelectedTask(refreshed);
      }
    }
  }, [tasks]);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-[#f8fafc] flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        onOpenCreateModal={() => setCreateModalStatus('todo')}
        onToggleActivityFeed={() => setShowActivityFeed(!showActivityFeed)}
        showActivityFeed={showActivityFeed}
        activityCount={activities.length}
      />

      {/* Main Kanban Workspace */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
              <span className="text-sm text-[#94a3b8] font-medium">Loading collaborative board...</span>
            </div>
          </div>
        ) : (
          <KanbanBoard
            tasks={tasks}
            onSelectTask={(task) => setSelectedTask(task)}
            onOpenCreateWithStatus={(status) => setCreateModalStatus(status)}
          />
        )}
      </main>

      {/* Modals & Drawers */}
      {selectedTask && (
        <TaskModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}

      {createModalStatus && (
        <CreateTaskModal
          initialStatus={createModalStatus}
          onClose={() => setCreateModalStatus(null)}
        />
      )}

      <LiveActivityFeed
        isOpen={showActivityFeed}
        onClose={() => setShowActivityFeed(false)}
      />

      <ToastNotification />
    </div>
  );
};

export const AppInner: React.FC = () => {
  const { currentProjectId } = useSocket();
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Load initial tasks for current project
  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getTasks(currentProjectId);
      setTasks(data);
    } catch (err) {
      console.warn('Could not fetch tasks from API:', err);
    } finally {
      setLoading(false);
    }
  }, [currentProjectId]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  return <AppContent tasks={tasks} loading={loading} />;
};

export const App: React.FC = () => {
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Remote event callbacks
  const handleRemoteTaskCreated = useCallback((newTask: ITask) => {
    setTasks((prev) => {
      if (prev.some((t) => t._id === newTask._id)) return prev;
      return [newTask, ...prev];
    });
  }, []);

  const handleRemoteTaskMoved = useCallback(
    (data: { taskId: string; status: TaskStatus; order: number; updatedTask: ITask }) => {
      setTasks((prev) =>
        prev.map((t) => {
          if (t._id === data.taskId) {
            return {
              ...t,
              ...data.updatedTask,
              status: data.status,
              order: data.order,
            };
          }
          return t;
        })
      );
    },
    []
  );

  const handleRemoteTaskUpdated = useCallback((data: { updatedTask: ITask }) => {
    setTasks((prev) =>
      prev.map((t) => (t._id === data.updatedTask._id ? data.updatedTask : t))
    );
  }, []);

  const handleRemoteTaskDeleted = useCallback((data: { taskId: string }) => {
    setTasks((prev) => prev.filter((t) => t._id !== data.taskId));
  }, []);

  const handleRemoteCommentAdded = useCallback((data: { taskId: string; comment: any }) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t._id === data.taskId) {
          return {
            ...t,
            comments: [...(t.comments || []), data.comment],
          };
        }
        return t;
      })
    );
  }, []);

  useEffect(() => {
    api.getTasks('proj_main')
      .then((data) => {
        setTasks(data);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('API error, using initial fallback state:', err);
        setLoading(false);
      });
  }, []);

  return (
    <AuthProvider>
      <SocketProvider
        onRemoteTaskCreated={handleRemoteTaskCreated}
        onRemoteTaskMoved={handleRemoteTaskMoved}
        onRemoteTaskUpdated={handleRemoteTaskUpdated}
        onRemoteTaskDeleted={handleRemoteTaskDeleted}
        onRemoteCommentAdded={handleRemoteCommentAdded}
      >
        <AppContent tasks={tasks} loading={loading} />
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;
