import { Request, Response } from 'express';
import { store } from '../config/dataStore.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const getProjects = async (req: Request, res: Response): Promise<void> => {
  try {
    const projects = await store.getProjects();
    res.json(projects);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch projects', error: error.message });
  }
};

export const createProject = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, key, description } = req.body;

    if (!name || !key) {
      res.status(400).json({ message: 'Project name and key are required.' });
      return;
    }

    const ownerId = req.user ? req.user._id : 'usr_1';

    const project = await store.createProject({
      name,
      key,
      description,
      ownerId,
      members: [ownerId],
    });

    res.status(201).json(project);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to create project', error: error.message });
  }
};

export const getProjectActivities = async (req: Request, res: Response): Promise<void> => {
  try {
    const projectId = (req.query.projectId as string) || 'proj_main';
    const activities = await store.getActivities(projectId);
    res.json(activities);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch activities', error: error.message });
  }
};
