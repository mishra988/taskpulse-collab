import mongoose, { Document, Schema } from 'mongoose';

export interface IActivityDocument extends Document {
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
  timestamp: Date;
}

const ActivitySchema = new Schema<IActivityDocument>(
  {
    projectId: { type: String, required: true },
    user: {
      _id: { type: String, required: true },
      name: { type: String, required: true },
      avatar: { type: String },
    },
    action: {
      type: String,
      enum: ['created', 'updated', 'moved', 'deleted', 'commented'],
      required: true,
    },
    targetType: {
      type: String,
      enum: ['task', 'comment', 'project'],
      required: true,
    },
    targetTitle: { type: String, required: true },
    details: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const ActivityModel = mongoose.models.Activity || mongoose.model<IActivityDocument>('Activity', ActivitySchema);
