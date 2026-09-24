import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { store } from '../config/dataStore.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const generateToken = (user: any): string => {
  const secret = process.env.JWT_SECRET || 'taskflow_jwt_secret_dev_key_2026';
  return jwt.sign(
    { _id: user._id, name: user.name, email: user.email, avatar: user.avatar, role: user.role },
    secret,
    { expiresIn: '7d' }
  );
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ message: 'Name, email, and password are required.' });
      return;
    }

    const existingUser = await store.findUserByEmail(email);
    if (existingUser) {
      res.status(409).json({ message: 'User with this email already exists.' });
      return;
    }

    const newUser = await store.createUser({ name, email, password, role });
    const token = generateToken(newUser);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: newUser,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required.' });
      return;
    }

    const user = await store.findUserByEmail(email);
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials.' });
      return;
    }

    const isValid = await store.verifyPassword(email, password);
    if (!isValid) {
      res.status(401).json({ message: 'Invalid credentials.' });
      return;
    }

    const token = generateToken(user);
    res.json({
      message: 'Logged in successfully',
      token,
      user,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

export const demoLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.body;
    const users = await store.getUsers();
    const user = users.find((u) => u._id === userId) || users[0];

    const token = generateToken(user);
    res.json({
      message: `Switched demo user to ${user.name}`,
      token,
      user,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Demo switch failed', error: error.message });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Not authenticated.' });
    return;
  }
  res.json({ user: req.user });
};

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await store.getUsers();
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to retrieve team members', error: error.message });
  }
};
