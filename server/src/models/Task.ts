import mongoose, { Document, Schema } from 'mongoose';

const CommentSchema = new Schema(
  {
    taskId: { type: String, required: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userAvatar: { type: String, default: '' },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

export interface ITaskDocument extends Document {
  title: string;
  description: string;
  status: 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
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
  comments: any[];
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITaskDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['backlog', 'todo', 'in_progress', 'in_review', 'done'],
      default: 'todo',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    projectId: { type: String, required: true },
    assignee: {
      _id: { type: String },
      name: { type: String },
      avatar: { type: String },
    },
    creator: {
      _id: { type: String, required: true },
      name: { type: String, required: true },
      avatar: { type: String },
    },
    tags: [{ type: String }],
    dueDate: { type: String },
    order: { type: Number, default: 0 },
    comments: [CommentSchema],
  },
  { timestamps: true }
);

export const TaskModel = mongoose.models.Task || mongoose.model<ITaskDocument>('Task', TaskSchema);
