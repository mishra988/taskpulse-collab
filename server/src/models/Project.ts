import mongoose, { Document, Schema } from 'mongoose';

export interface IProjectDocument extends Document {
  name: string;
  key: string;
  description: string;
  ownerId: mongoose.Types.ObjectId | string;
  members: Array<mongoose.Types.ObjectId | string>;
  createdAt: Date;
}

const ProjectSchema = new Schema<IProjectDocument>(
  {
    name: { type: String, required: true },
    key: { type: String, required: true, uppercase: true },
    description: { type: String, default: '' },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

export const ProjectModel = mongoose.models.Project || mongoose.model<IProjectDocument>('Project', ProjectSchema);
