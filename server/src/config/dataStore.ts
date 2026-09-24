import mongoose from 'mongoose';
import { ITask, IUser, IProject, IActivity, IComment, TaskStatus } from '../types/index.js';
import { TaskModel } from '../models/Task.js';
import { UserModel } from '../models/User.js';
import { ProjectModel } from '../models/Project.js';
import { ActivityModel } from '../models/Activity.js';
import bcrypt from 'bcryptjs';

// Pre-seeded initial data for instant development & offline fallback
const initialUsers: IUser[] = [
  {
    _id: 'usr_1',
    name: 'Ayush Sharma',
    email: 'ayush@example.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'Tech Lead',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'usr_2',
    name: 'Sarah Chen',
    email: 'sarah@example.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    role: 'Product Designer',
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'usr_3',
    name: 'Alex Miller',
    email: 'alex@example.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    role: 'Full-Stack Dev',
    createdAt: new Date().toISOString(),
  },
];

const initialProjects: IProject[] = [
  {
    _id: 'proj_main',
    name: 'TaskPulse Real-Time Core',
    key: 'TPC',
    description: 'High performance real-time collaboration board with live updates, websockets, and Kanban workflow.',
    ownerId: 'usr_1',
    members: ['usr_1', 'usr_2', 'usr_3'],
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'proj_mobile',
    name: 'Mobile App Next Gen',
    key: 'MAG',
    description: 'Cross-platform mobile workspace & push notifications engine.',
    ownerId: 'usr_2',
    members: ['usr_1', 'usr_2'],
    createdAt: new Date().toISOString(),
  },
];

const initialTasks: ITask[] = [
  {
    _id: 'task_1',
    title: 'Setup Socket.IO real-time event pipeline',
    description: 'Establish bidirectional websocket rooms for project channels, user presence indicators, and task updates.',
    status: 'in_progress',
    priority: 'urgent',
    projectId: 'proj_main',
    assignee: {
      _id: 'usr_1',
      name: 'Ayush Sharma',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    creator: {
      _id: 'usr_1',
      name: 'Ayush Sharma',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    tags: ['WebSockets', 'Backend', 'Architecture'],
    dueDate: '2026-10-01',
    order: 0,
    comments: [
      {
        _id: 'comm_1',
        taskId: 'task_1',
        userId: 'usr_2',
        userName: 'Sarah Chen',
        userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        content: 'Remember to support reconnection events when network drops!',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'task_2',
    title: 'Design interactive Kanban column drag & drop UI',
    description: 'Implement smooth drag-and-drop feedback with optimistic updates and live remote cursor highlighting.',
    status: 'in_review',
    priority: 'high',
    projectId: 'proj_main',
    assignee: {
      _id: 'usr_2',
      name: 'Sarah Chen',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    },
    creator: {
      _id: 'usr_1',
      name: 'Ayush Sharma',
    },
    tags: ['UI/UX', 'Tailwind', 'React'],
    dueDate: '2026-09-30',
    order: 0,
    comments: [],
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'task_3',
    title: 'Implement JWT & Session token authentication',
    description: 'Secure API routes and WebSocket handshakes using signed JSON Web Tokens and user authorization middleware.',
    status: 'done',
    priority: 'medium',
    projectId: 'proj_main',
    assignee: {
      _id: 'usr_3',
      name: 'Alex Miller',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
    creator: {
      _id: 'usr_1',
      name: 'Ayush Sharma',
    },
    tags: ['Security', 'Auth', 'API'],
    dueDate: '2026-09-28',
    order: 0,
    comments: [],
    createdAt: new Date(Date.now() - 259200000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'task_4',
    title: 'Build Live Activity Ticker & Notification Toast',
    description: 'Display streaming real-time notifications when a collaborator changes statuses or leaves remarks.',
    status: 'todo',
    priority: 'medium',
    projectId: 'proj_main',
    assignee: {
      _id: 'usr_1',
      name: 'Ayush Sharma',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    creator: {
      _id: 'usr_2',
      name: 'Sarah Chen',
    },
    tags: ['Frontend', 'Notifications'],
    dueDate: '2026-10-05',
    order: 0,
    comments: [],
    createdAt: new Date(Date.now() - 43200000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'task_5',
    title: 'Research offline syncing and local IndexedDB cache',
    description: 'Explore syncing queued modifications when client reconnects to internet.',
    status: 'backlog',
    priority: 'low',
    projectId: 'proj_main',
    assignee: undefined,
    creator: {
      _id: 'usr_3',
      name: 'Alex Miller',
    },
    tags: ['Research', 'Offline-First'],
    dueDate: '2026-10-15',
    order: 0,
    comments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const initialActivities: IActivity[] = [
  {
    _id: 'act_1',
    projectId: 'proj_main',
    user: {
      _id: 'usr_1',
      name: 'Ayush Sharma',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    action: 'created',
    targetType: 'task',
    targetTitle: 'Setup Socket.IO real-time event pipeline',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    _id: 'act_2',
    projectId: 'proj_main',
    user: {
      _id: 'usr_2',
      name: 'Sarah Chen',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    },
    action: 'commented',
    targetType: 'comment',
    targetTitle: 'Setup Socket.IO real-time event pipeline',
    details: 'Remember to support reconnection events...',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
  },
];

class DataStore {
  private users: IUser[] = [...initialUsers];
  private projects: IProject[] = [...initialProjects];
  private tasks: ITask[] = [...initialTasks];
  private activities: IActivity[] = [...initialActivities];
  private userPasswords: Map<string, string> = new Map([
    ['ayush@example.com', bcrypt.hashSync('password123', 8)],
    ['sarah@example.com', bcrypt.hashSync('password123', 8)],
    ['alex@example.com', bcrypt.hashSync('password123', 8)],
  ]);
  public isConnectedToMongo: boolean = false;

  constructor() {
    this.checkMongoStatus();
  }

  public checkMongoStatus() {
    this.isConnectedToMongo = mongoose.connection.readyState === 1;
  }

  // Tasks
  async getTasks(projectId: string): Promise<ITask[]> {
    if (this.isConnectedToMongo) {
      try {
        const docs = await TaskModel.find({ projectId }).sort({ order: 1, updatedAt: -1 }).lean();
        return docs.map((d: any) => ({ ...d, _id: d._id.toString() }));
      } catch (err) {
        console.warn('Mongo read error, falling back to memory store:', err);
      }
    }
    return this.tasks.filter((t) => t.projectId === projectId);
  }

  async getTaskById(taskId: string): Promise<ITask | null> {
    if (this.isConnectedToMongo) {
      try {
        const doc = await TaskModel.findById(taskId).lean();
        if (doc) return { ...doc, _id: (doc as any)._id.toString() } as unknown as ITask;
      } catch (err) {
        // Fallback
      }
    }
    const found = this.tasks.find((t) => t._id === taskId);
    return found || null;
  }

  async createTask(taskData: Partial<ITask>): Promise<ITask> {
    const newTask: ITask = {
      _id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: taskData.title || 'Untitled Task',
      description: taskData.description || '',
      status: taskData.status || 'todo',
      priority: taskData.priority || 'medium',
      projectId: taskData.projectId || 'proj_main',
      assignee: taskData.assignee,
      creator: taskData.creator || { _id: 'usr_1', name: 'Ayush Sharma' },
      tags: taskData.tags || [],
      dueDate: taskData.dueDate,
      order: taskData.order ?? 0,
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (this.isConnectedToMongo) {
      try {
        const created = await TaskModel.create(newTask);
        return { ...created.toObject(), _id: created._id.toString() } as unknown as ITask;
      } catch (err) {
        console.warn('Mongo create error, saved in memory store:', err);
      }
    }

    this.tasks.unshift(newTask);
    return newTask;
  }

  async updateTask(taskId: string, updates: Partial<ITask>): Promise<ITask | null> {
    if (this.isConnectedToMongo) {
      try {
        const updated = await TaskModel.findByIdAndUpdate(taskId, updates, { new: true }).lean();
        if (updated) return { ...updated, _id: (updated as any)._id.toString() } as unknown as ITask;
      } catch (err) {
        // Fallback
      }
    }

    const index = this.tasks.findIndex((t) => t._id === taskId);
    if (index === -1) return null;

    this.tasks[index] = {
      ...this.tasks[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return this.tasks[index];
  }

  async moveTask(taskId: string, newStatus: TaskStatus, newOrder: number): Promise<ITask | null> {
    return this.updateTask(taskId, { status: newStatus, order: newOrder });
  }

  async deleteTask(taskId: string): Promise<boolean> {
    if (this.isConnectedToMongo) {
      try {
        await TaskModel.findByIdAndDelete(taskId);
      } catch (err) {
        // Fallback
      }
    }
    const initialLen = this.tasks.length;
    this.tasks = this.tasks.filter((t) => t._id !== taskId);
    return this.tasks.length < initialLen;
  }

  async addComment(taskId: string, commentData: { userId: string; userName: string; userAvatar?: string; content: string }): Promise<IComment | null> {
    const comment: IComment = {
      _id: 'comm_' + Date.now(),
      taskId,
      userId: commentData.userId,
      userName: commentData.userName,
      userAvatar: commentData.userAvatar,
      content: commentData.content,
      createdAt: new Date().toISOString(),
    };

    if (this.isConnectedToMongo) {
      try {
        await TaskModel.findByIdAndUpdate(taskId, { $push: { comments: comment } });
      } catch (err) {
        // Fallback
      }
    }

    const task = this.tasks.find((t) => t._id === taskId);
    if (task) {
      task.comments.push(comment);
      task.updatedAt = new Date().toISOString();
      return comment;
    }
    return null;
  }

  // Activities
  async getActivities(projectId: string): Promise<IActivity[]> {
    if (this.isConnectedToMongo) {
      try {
        const docs = await ActivityModel.find({ projectId }).sort({ timestamp: -1 }).limit(30).lean();
        return docs.map((d: any) => ({ ...d, _id: d._id.toString() }));
      } catch (err) {
        // Fallback
      }
    }
    return this.activities
      .filter((a) => a.projectId === projectId)
      .slice(0, 30);
  }

  async logActivity(data: Omit<IActivity, '_id' | 'timestamp'>): Promise<IActivity> {
    const activity: IActivity = {
      _id: 'act_' + Date.now(),
      ...data,
      timestamp: new Date().toISOString(),
    };

    if (this.isConnectedToMongo) {
      try {
        await ActivityModel.create(activity);
      } catch (err) {
        // Fallback
      }
    }

    this.activities.unshift(activity);
    if (this.activities.length > 50) this.activities.pop();
    return activity;
  }

  // Users & Auth
  async getUsers(): Promise<IUser[]> {
    if (this.isConnectedToMongo) {
      try {
        const docs = await UserModel.find({}, { password: 0 }).lean();
        if (docs.length > 0) return docs.map((d: any) => ({ ...d, _id: d._id.toString() }));
      } catch (err) {
        // Fallback
      }
    }
    return this.users;
  }

  async findUserByEmail(email: string): Promise<IUser | null> {
    if (this.isConnectedToMongo) {
      try {
        const doc = await UserModel.findOne({ email: email.toLowerCase() }).lean();
        if (doc) return { ...doc, _id: (doc as any)._id.toString() } as unknown as IUser;
      } catch (err) {
        // Fallback
      }
    }
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async verifyPassword(email: string, passwordAttempt: string): Promise<boolean> {
    if (this.isConnectedToMongo) {
      try {
        const user = await UserModel.findOne({ email: email.toLowerCase() });
        if (user && user.password) {
          return bcrypt.compare(passwordAttempt, user.password);
        }
      } catch (err) {
        // Fallback
      }
    }
    const hash = this.userPasswords.get(email.toLowerCase());
    if (!hash) return false;
    return bcrypt.compare(passwordAttempt, hash);
  }

  async createUser(userData: { name: string; email: string; password: string; avatar?: string; role?: string }): Promise<IUser> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const newUser: IUser = {
      _id: 'usr_' + Date.now(),
      name: userData.name,
      email: userData.email.toLowerCase(),
      avatar: userData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userData.name)}`,
      role: userData.role || 'Member',
      createdAt: new Date().toISOString(),
    };

    if (this.isConnectedToMongo) {
      try {
        const created = await UserModel.create({
          ...newUser,
          password: hashedPassword,
        });
        return { ...created.toObject(), _id: created._id.toString() };
      } catch (err) {
        console.warn('Mongo user creation error, using memory fallback:', err);
      }
    }

    this.users.push(newUser);
    this.userPasswords.set(newUser.email, hashedPassword);
    return newUser;
  }

  // Projects
  async getProjects(): Promise<IProject[]> {
    if (this.isConnectedToMongo) {
      try {
        const docs = await ProjectModel.find().lean();
        if (docs.length > 0) return docs.map((d: any) => ({ ...d, _id: d._id.toString() }));
      } catch (err) {
        // Fallback
      }
    }
    return this.projects;
  }

  async createProject(projectData: Partial<IProject>): Promise<IProject> {
    const newProj: IProject = {
      _id: 'proj_' + Date.now(),
      name: projectData.name || 'New Project',
      key: (projectData.key || 'PROJ').toUpperCase(),
      description: projectData.description || '',
      ownerId: projectData.ownerId || 'usr_1',
      members: projectData.members || ['usr_1'],
      createdAt: new Date().toISOString(),
    };

    if (this.isConnectedToMongo) {
      try {
        const created = await ProjectModel.create(newProj);
        return { ...created.toObject(), _id: created._id.toString() };
      } catch (err) {
        // Fallback
      }
    }

    this.projects.push(newProj);
    return newProj;
  }
}

export const store = new DataStore();
