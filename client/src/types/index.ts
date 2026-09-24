export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';

export interface IUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
}

export interface IComment {
  _id: string;
  taskId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
}

export interface ITask {
  _id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId: string;
  assignee?: {
    _id: string;
    name: string;
    avatar?: string;
  };
  creator: {
    _id: string;
    name: string;
    avatar?: string;
  };
  tags: string[];
  dueDate?: string;
  order: number;
  comments: IComment[];
  createdAt: string;
  updatedAt: string;
}

export interface IProject {
  _id: string;
  name: string;
  key: string;
  description: string;
  ownerId: string;
  members: string[];
  createdAt: string;
}

export interface IActivity {
  _id: string;
  projectId: string;
  user: {
    _id: string;
    name: string;
    avatar?: string;
  };
  action: 'created' | 'updated' | 'moved' | 'deleted' | 'commented';
  targetType: 'task' | 'comment' | 'project';
  targetTitle: string;
  details?: string;
  timestamp: string;
}

export interface ActiveUserPresence {
  socketId: string;
  user: IUser;
  activeTaskId?: string;
  isEditing?: boolean;
}

export interface KanbanColumn {
  id: TaskStatus;
  title: string;
  color: string;
  badgeBg: string;
}
