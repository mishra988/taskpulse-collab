import { Server, Socket } from 'socket.io';
import { store } from '../config/dataStore.js';
import { IUser, TaskStatus } from '../types/index.js';

interface ConnectedClient {
  socketId: string;
  projectId: string;
  user: IUser;
  activeTaskId?: string;
  isEditing?: boolean;
}

const connectedClients = new Map<string, ConnectedClient>();

export const registerSocketHandlers = (io: Server) => {
  const getProjectActiveUsers = (projectId: string): ConnectedClient[] => {
    const list: ConnectedClient[] = [];
    connectedClients.forEach((client) => {
      if (client.projectId === projectId) {
        list.push(client);
      }
    });
    return list;
  };

  io.on('connection', (socket: Socket) => {
    console.log(`⚡ Socket connected: ${socket.id}`);

    // Join Project Room
    socket.on('JOIN_PROJECT', async (data: { projectId: string; user: IUser }) => {
      const { projectId, user } = data;
      const room = `project:${projectId}`;

      socket.join(room);

      connectedClients.set(socket.id, {
        socketId: socket.id,
        projectId,
        user,
      });

      console.log(`👤 User "${user.name}" joined room ${room}`);

      // Broadcast active user list to all in the project
      const activeUsers = getProjectActiveUsers(projectId);
      io.to(room).emit('ACTIVE_USERS', activeUsers);

      // Notify others that a teammate entered the workspace
      socket.to(room).emit('USER_JOINED', {
        user,
        message: `${user.name} joined the project board`,
      });
    });

    // Leave Project Room
    socket.on('LEAVE_PROJECT', () => {
      const client = connectedClients.get(socket.id);
      if (client) {
        const room = `project:${client.projectId}`;
        socket.leave(room);
        connectedClients.delete(socket.id);

        io.to(room).emit('ACTIVE_USERS', getProjectActiveUsers(client.projectId));
        socket.to(room).emit('USER_LEFT', { user: client.user });
      }
    });

    // Real-Time Task Creation
    socket.on('TASK_CREATE', async (taskData: any) => {
      const client = connectedClients.get(socket.id);
      const projectId = taskData.projectId || (client ? client.projectId : 'proj_main');
      const room = `project:${projectId}`;

      try {
        const newTask = await store.createTask(taskData);

        const activity = await store.logActivity({
          projectId,
          user: newTask.creator,
          action: 'created',
          targetType: 'task',
          targetTitle: newTask.title,
          details: `Created task with ${newTask.priority} priority`,
        });

        // Broadcast to everyone in the project
        io.to(room).emit('TASK_CREATED', newTask);
        io.to(room).emit('ACTIVITY_LOGGED', activity);
      } catch (err) {
        console.error('Socket TASK_CREATE error:', err);
      }
    });

    // Real-Time Task Drag-and-Drop Movement
    socket.on('TASK_MOVE', async (data: { taskId: string; status: TaskStatus; order: number; user?: IUser }) => {
      const client = connectedClients.get(socket.id);
      const user = data.user || (client ? client.user : { _id: 'usr_1', name: 'Teammate', avatar: '' });

      try {
        const existing = await store.getTaskById(data.taskId);
        if (!existing) return;

        const prevStatus = existing.status;
        const updatedTask = await store.moveTask(data.taskId, data.status, data.order);
        if (!updatedTask) return;

        const room = `project:${updatedTask.projectId}`;

        const activity = await store.logActivity({
          projectId: updatedTask.projectId,
          user: { _id: user._id, name: user.name, avatar: user.avatar },
          action: 'moved',
          targetType: 'task',
          targetTitle: updatedTask.title,
          details: `Moved to ${data.status.replace('_', ' ').toUpperCase()}`,
        });

        // Broadcast to all connected clients including sender
        io.to(room).emit('TASK_MOVED', {
          taskId: data.taskId,
          status: data.status,
          order: data.order,
          updatedTask,
          user,
        });

        io.to(room).emit('ACTIVITY_LOGGED', activity);
      } catch (err) {
        console.error('Socket TASK_MOVE error:', err);
      }
    });

    // Real-Time Task Update (editing title, description, tags, etc.)
    socket.on('TASK_UPDATE', async (data: { taskId: string; updates: any; user?: IUser }) => {
      const client = connectedClients.get(socket.id);
      const user = data.user || (client ? client.user : { _id: 'usr_1', name: 'Teammate', avatar: '' });

      try {
        const updatedTask = await store.updateTask(data.taskId, data.updates);
        if (!updatedTask) return;

        const room = `project:${updatedTask.projectId}`;

        const activity = await store.logActivity({
          projectId: updatedTask.projectId,
          user: { _id: user._id, name: user.name, avatar: user.avatar },
          action: 'updated',
          targetType: 'task',
          targetTitle: updatedTask.title,
          details: 'Updated task properties',
        });

        io.to(room).emit('TASK_UPDATED', { updatedTask, user });
        io.to(room).emit('ACTIVITY_LOGGED', activity);
      } catch (err) {
        console.error('Socket TASK_UPDATE error:', err);
      }
    });

    // Real-Time Task Deletion
    socket.on('TASK_DELETE', async (data: { taskId: string; projectId: string; user?: IUser }) => {
      const client = connectedClients.get(socket.id);
      const user = data.user || (client ? client.user : { _id: 'usr_1', name: 'Teammate', avatar: '' });
      const room = `project:${data.projectId}`;

      try {
        const existing = await store.getTaskById(data.taskId);
        await store.deleteTask(data.taskId);

        if (existing) {
          const activity = await store.logActivity({
            projectId: data.projectId,
            user: { _id: user._id, name: user.name, avatar: user.avatar },
            action: 'deleted',
            targetType: 'task',
            targetTitle: existing.title,
            details: 'Removed from board',
          });
          io.to(room).emit('ACTIVITY_LOGGED', activity);
        }

        io.to(room).emit('TASK_DELETED', { taskId: data.taskId, user });
      } catch (err) {
        console.error('Socket TASK_DELETE error:', err);
      }
    });

    // Real-Time Task Comments
    socket.on('COMMENT_ADD', async (data: { taskId: string; content: string; user: IUser; projectId: string }) => {
      try {
        const comment = await store.addComment(data.taskId, {
          userId: data.user._id,
          userName: data.user.name,
          userAvatar: data.user.avatar,
          content: data.content,
        });

        if (!comment) return;

        const room = `project:${data.projectId}`;
        const task = await store.getTaskById(data.taskId);

        const activity = await store.logActivity({
          projectId: data.projectId,
          user: { _id: data.user._id, name: data.user.name, avatar: data.user.avatar },
          action: 'commented',
          targetType: 'comment',
          targetTitle: task ? task.title : 'Task',
          details: data.content.substring(0, 45) + (data.content.length > 45 ? '...' : ''),
        });

        io.to(room).emit('COMMENT_ADDED', { taskId: data.taskId, comment, user: data.user });
        io.to(room).emit('ACTIVITY_LOGGED', activity);
      } catch (err) {
        console.error('Socket COMMENT_ADD error:', err);
      }
    });

    // Live Collaboration Presence / Active Focus
    socket.on('USER_FOCUS_TASK', (data: { taskId: string; isEditing: boolean }) => {
      const client = connectedClients.get(socket.id);
      if (client) {
        client.activeTaskId = data.taskId;
        client.isEditing = data.isEditing;
        const room = `project:${client.projectId}`;
        socket.to(room).emit('USER_TASK_PRESENCE', {
          socketId: socket.id,
          user: client.user,
          taskId: data.taskId,
          isEditing: data.isEditing,
        });
      }
    });

    socket.on('USER_BLUR_TASK', () => {
      const client = connectedClients.get(socket.id);
      if (client) {
        const prevTask = client.activeTaskId;
        client.activeTaskId = undefined;
        client.isEditing = false;
        const room = `project:${client.projectId}`;
        socket.to(room).emit('USER_TASK_PRESENCE', {
          socketId: socket.id,
          user: client.user,
          taskId: prevTask,
          isEditing: false,
          cleared: true,
        });
      }
    });

    // Disconnect cleanup
    socket.on('disconnect', () => {
      const client = connectedClients.get(socket.id);
      if (client) {
        const room = `project:${client.projectId}`;
        connectedClients.delete(socket.id);
        io.to(room).emit('ACTIVE_USERS', getProjectActiveUsers(client.projectId));
        socket.to(room).emit('USER_LEFT', { user: client.user });
      }
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
};
