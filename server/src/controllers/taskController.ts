import { Response } from 'express';
import { store } from '../config/dataStore.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { TaskStatus } from '../types/index.js';

export const getTasks = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const projectId = (req.query.projectId as string) || 'proj_main';
    const tasks = await store.getTasks(projectId);
    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch tasks', error: error.message });
  }
};

export const createTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, description, status, priority, projectId, assignee, tags, dueDate } = req.body;

    if (!title) {
      res.status(400).json({ message: 'Task title is required.' });
      return;
    }

    const creator = req.user
      ? { _id: req.user._id, name: req.user.name, avatar: req.user.avatar }
      : { _id: 'usr_1', name: 'Ayush Sharma' };

    const task = await store.createTask({
      title,
      description,
      status: status || 'todo',
      priority: priority || 'medium',
      projectId: projectId || 'proj_main',
      assignee,
      creator,
      tags: tags || [],
      dueDate,
    });

    await store.logActivity({
      projectId: task.projectId,
      user: creator,
      action: 'created',
      targetType: 'task',
      targetTitle: task.title,
      details: `Created task with ${task.priority} priority`,
    });

    res.status(201).json(task);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to create task', error: error.message });
  }
};

export const updateTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const taskId = req.params.id as string;
    const updates = req.body;

    const existing = await store.getTaskById(taskId);
    if (!existing) {
      res.status(404).json({ message: 'Task not found.' });
      return;
    }

    const updatedTask = await store.updateTask(taskId, updates);

    const user = req.user
      ? { _id: req.user._id, name: req.user.name, avatar: req.user.avatar }
      : { _id: 'usr_1', name: 'Ayush Sharma' };

    await store.logActivity({
      projectId: existing.projectId,
      user,
      action: 'updated',
      targetType: 'task',
      targetTitle: updatedTask?.title || existing.title,
      details: `Updated details for task`,
    });

    res.json(updatedTask);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to update task', error: error.message });
  }
};

export const moveTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const taskId = req.params.id as string;
    const { status, order } = req.body;

    if (!status) {
      res.status(400).json({ message: 'New status is required.' });
      return;
    }

    const existing = await store.getTaskById(taskId);
    if (!existing) {
      res.status(404).json({ message: 'Task not found.' });
      return;
    }

    const prevStatus = existing.status;
    const updated = await store.moveTask(taskId, status as TaskStatus, order ?? 0);

    const user = req.user
      ? { _id: req.user._id, name: req.user.name, avatar: req.user.avatar }
      : { _id: 'usr_1', name: 'Ayush Sharma' };

    await store.logActivity({
      projectId: existing.projectId,
      user,
      action: 'moved',
      targetType: 'task',
      targetTitle: existing.title,
      details: `Moved from ${prevStatus.replace('_', ' ')} to ${status.replace('_', ' ')}`,
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to move task', error: error.message });
  }
};

export const deleteTask = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const taskId = req.params.id as string;
    const existing = await store.getTaskById(taskId);
    if (!existing) {
      res.status(404).json({ message: 'Task not found.' });
      return;
    }

    await store.deleteTask(taskId);

    const user = req.user
      ? { _id: req.user._id, name: req.user.name, avatar: req.user.avatar }
      : { _id: 'usr_1', name: 'Ayush Sharma' };

    await store.logActivity({
      projectId: existing.projectId,
      user,
      action: 'deleted',
      targetType: 'task',
      targetTitle: existing.title,
      details: 'Task was deleted',
    });

    res.json({ message: 'Task deleted successfully', taskId });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to delete task', error: error.message });
  }
};

export const addComment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const taskId = req.params.id as string;
    const { content } = req.body;

    if (!content || !content.trim()) {
      res.status(400).json({ message: 'Comment content cannot be empty.' });
      return;
    }

    const user = req.user || { _id: 'usr_1', name: 'Ayush Sharma', avatar: '' };

    const comment = await store.addComment(taskId, {
      userId: user._id,
      userName: user.name,
      userAvatar: user.avatar,
      content: content.trim(),
    });

    const task = await store.getTaskById(taskId);
    if (task) {
      await store.logActivity({
        projectId: task.projectId,
        user: { _id: user._id, name: user.name, avatar: user.avatar },
        action: 'commented',
        targetType: 'comment',
        targetTitle: task.title,
        details: content.length > 40 ? content.substring(0, 40) + '...' : content,
      });
    }

    res.status(201).json(comment);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to add comment', error: error.message });
  }
};
