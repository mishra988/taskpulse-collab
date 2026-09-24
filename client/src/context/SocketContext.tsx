import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { socketService } from '../services/socket';
import { useAuth } from './AuthContext';
import { ITask, IActivity, ActiveUserPresence, TaskStatus } from '../types';

interface ToastNotification {
  id: string;
  message: string;
  type?: 'info' | 'success' | 'warning';
  timestamp: number;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  activeUsers: ActiveUserPresence[];
  taskPresences: Record<string, { userName: string; isEditing: boolean; avatar?: string }>;
  activities: IActivity[];
  toasts: ToastNotification[];
  currentProjectId: string;
  setCurrentProjectId: (id: string) => void;
  // Socket Emitters
  createTask: (task: Partial<ITask>) => void;
  moveTask: (taskId: string, status: TaskStatus, order: number) => void;
  updateTask: (taskId: string, updates: Partial<ITask>) => void;
  deleteTask: (taskId: string) => void;
  addComment: (taskId: string, content: string) => void;
  focusTask: (taskId: string, isEditing: boolean) => void;
  blurTask: () => void;
  dismissToast: (id: string) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider: React.FC<{
  children: React.ReactNode;
  onRemoteTaskCreated?: (task: ITask) => void;
  onRemoteTaskMoved?: (data: { taskId: string; status: TaskStatus; order: number; updatedTask: ITask; user: any }) => void;
  onRemoteTaskUpdated?: (data: { updatedTask: ITask; user: any }) => void;
  onRemoteTaskDeleted?: (data: { taskId: string; user: any }) => void;
  onRemoteCommentAdded?: (data: { taskId: string; comment: any; user: any }) => void;
}> = ({
  children,
  onRemoteTaskCreated,
  onRemoteTaskMoved,
  onRemoteTaskUpdated,
  onRemoteTaskDeleted,
  onRemoteCommentAdded,
}) => {
  const { currentUser } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [currentProjectId, setCurrentProjectId] = useState<string>('proj_main');
  const [activeUsers, setActiveUsers] = useState<ActiveUserPresence[]>([]);
  const [taskPresences, setTaskPresences] = useState<Record<string, { userName: string; isEditing: boolean; avatar?: string }>>({});
  const [activities, setActivities] = useState<IActivity[]>([]);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const addToast = useCallback((message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const id = 'toast_' + Date.now() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev.slice(-4), { id, message, type, timestamp: Date.now() }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Initialize and connect socket
  useEffect(() => {
    const s = socketService.connect();
    setSocket(s);

    const onConnect = () => {
      setIsConnected(true);
      s.emit('JOIN_PROJECT', { projectId: currentProjectId, user: currentUser });
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);

    if (s.connected) {
      onConnect();
    }

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
    };
  }, [currentProjectId]);

  // Re-emit JOIN when user changes
  useEffect(() => {
    if (socket && isConnected) {
      socket.emit('JOIN_PROJECT', { projectId: currentProjectId, user: currentUser });
    }
  }, [currentUser, socket, isConnected, currentProjectId]);

  // Register real-time incoming listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('ACTIVE_USERS', (users: ActiveUserPresence[]) => {
      setActiveUsers(users);
    });

    socket.on('USER_JOINED', (data: { user: any; message: string }) => {
      if (data.user._id !== currentUser._id) {
        addToast(`👋 ${data.user.name} joined the board`, 'info');
      }
    });

    socket.on('TASK_CREATED', (task: ITask) => {
      if (task.creator._id !== currentUser._id) {
        addToast(`✨ ${task.creator.name} created "${task.title}"`, 'success');
      }
      onRemoteTaskCreated?.(task);
    });

    socket.on('TASK_MOVED', (data: { taskId: string; status: TaskStatus; order: number; updatedTask: ITask; user: any }) => {
      if (data.user?._id !== currentUser._id) {
        const readableStatus = data.status.replace('_', ' ').toUpperCase();
        addToast(`🔄 ${data.user?.name || 'Teammate'} moved "${data.updatedTask?.title || 'task'}" to ${readableStatus}`, 'info');
      }
      onRemoteTaskMoved?.(data);
    });

    socket.on('TASK_UPDATED', (data: { updatedTask: ITask; user: any }) => {
      if (data.user?._id !== currentUser._id) {
        addToast(`✏️ ${data.user?.name || 'Teammate'} updated "${data.updatedTask.title}"`, 'info');
      }
      onRemoteTaskUpdated?.(data);
    });

    socket.on('TASK_DELETED', (data: { taskId: string; user: any }) => {
      if (data.user?._id !== currentUser._id) {
        addToast(`🗑️ ${data.user?.name || 'Teammate'} deleted a task`, 'warning');
      }
      onRemoteTaskDeleted?.(data);
    });

    socket.on('COMMENT_ADDED', (data: { taskId: string; comment: any; user: any }) => {
      if (data.user?._id !== currentUser._id) {
        addToast(`💬 ${data.user?.name || 'Teammate'} commented on task`, 'info');
      }
      onRemoteCommentAdded?.(data);
    });

    socket.on('USER_TASK_PRESENCE', (data: { socketId: string; user: any; taskId?: string; isEditing: boolean; cleared?: boolean }) => {
      setTaskPresences((prev) => {
        const next = { ...prev };
        if (data.cleared || !data.taskId) {
          // Find and remove
          Object.keys(next).forEach((key) => {
            if (next[key]?.userName === data.user.name) {
              delete next[key];
            }
          });
        } else {
          next[data.taskId] = {
            userName: data.user.name,
            isEditing: data.isEditing,
            avatar: data.user.avatar,
          };
        }
        return next;
      });
    });

    socket.on('ACTIVITY_LOGGED', (activity: IActivity) => {
      setActivities((prev) => [activity, ...prev.slice(0, 35)]);
    });

    return () => {
      socket.off('ACTIVE_USERS');
      socket.off('USER_JOINED');
      socket.off('TASK_CREATED');
      socket.off('TASK_MOVED');
      socket.off('TASK_UPDATED');
      socket.off('TASK_DELETED');
      socket.off('COMMENT_ADDED');
      socket.off('USER_TASK_PRESENCE');
      socket.off('ACTIVITY_LOGGED');
    };
  }, [
    socket,
    currentUser,
    addToast,
    onRemoteTaskCreated,
    onRemoteTaskMoved,
    onRemoteTaskUpdated,
    onRemoteTaskDeleted,
    onRemoteCommentAdded,
  ]);

  // Emitters
  const createTask = useCallback((task: Partial<ITask>) => {
    if (socket) {
      socket.emit('TASK_CREATE', {
        ...task,
        projectId: currentProjectId,
        creator: { _id: currentUser._id, name: currentUser.name, avatar: currentUser.avatar },
      });
    }
  }, [socket, currentProjectId, currentUser]);

  const moveTask = useCallback((taskId: string, status: TaskStatus, order: number) => {
    if (socket) {
      socket.emit('TASK_MOVE', {
        taskId,
        status,
        order,
        user: { _id: currentUser._id, name: currentUser.name, avatar: currentUser.avatar },
      });
    }
  }, [socket, currentUser]);

  const updateTask = useCallback((taskId: string, updates: Partial<ITask>) => {
    if (socket) {
      socket.emit('TASK_UPDATE', {
        taskId,
        updates,
        user: { _id: currentUser._id, name: currentUser.name, avatar: currentUser.avatar },
      });
    }
  }, [socket, currentUser]);

  const deleteTask = useCallback((taskId: string) => {
    if (socket) {
      socket.emit('TASK_DELETE', {
        taskId,
        projectId: currentProjectId,
        user: { _id: currentUser._id, name: currentUser.name, avatar: currentUser.avatar },
      });
    }
  }, [socket, currentProjectId, currentUser]);

  const addComment = useCallback((taskId: string, content: string) => {
    if (socket) {
      socket.emit('COMMENT_ADD', {
        taskId,
        content,
        projectId: currentProjectId,
        user: { _id: currentUser._id, name: currentUser.name, avatar: currentUser.avatar },
      });
    }
  }, [socket, currentProjectId, currentUser]);

  const focusTask = useCallback((taskId: string, isEditing: boolean) => {
    if (socket) {
      socket.emit('USER_FOCUS_TASK', { taskId, isEditing });
    }
  }, [socket]);

  const blurTask = useCallback(() => {
    if (socket) {
      socket.emit('USER_BLUR_TASK');
    }
  }, [socket]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        activeUsers,
        taskPresences,
        activities,
        toasts,
        currentProjectId,
        setCurrentProjectId,
        createTask,
        moveTask,
        updateTask,
        deleteTask,
        addComment,
        focusTask,
        blurTask,
        dismissToast,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
