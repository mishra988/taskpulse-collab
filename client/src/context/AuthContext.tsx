import React, { createContext, useContext, useState, useEffect } from 'react';
import { IUser } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  currentUser: IUser;
  availableUsers: IUser[];
  switchUser: (userId: string) => Promise<void>;
  loading: boolean;
}

const defaultUser: IUser = {
  _id: 'usr_1',
  name: 'Ayush Sharma',
  email: 'ayush@example.com',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  role: 'Tech Lead',
};

const AuthContext = createContext<AuthContextType>({
  currentUser: defaultUser,
  availableUsers: [defaultUser],
  switchUser: async () => {},
  loading: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<IUser>(() => {
    const saved = localStorage.getItem('taskflow_user');
    return saved ? JSON.parse(saved) : defaultUser;
  });

  const [availableUsers, setAvailableUsers] = useState<IUser[]>([
    defaultUser,
    {
      _id: 'usr_2',
      name: 'Sarah Chen',
      email: 'sarah@example.com',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      role: 'Product Designer',
    },
    {
      _id: 'usr_3',
      name: 'Alex Miller',
      email: 'alex@example.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      role: 'Full-Stack Dev',
    },
  ]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch users from API to ensure sync with backend
    api.getUsers()
      .then((users) => {
        if (users && users.length > 0) {
          setAvailableUsers(users);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch server users, using defaults:', err);
      });
  }, []);

  const switchUser = async (userId: string) => {
    setLoading(true);
    try {
      const data = await api.demoLogin(userId);
      setCurrentUser(data.user);
      localStorage.setItem('taskflow_user', JSON.stringify(data.user));
      localStorage.setItem('taskflow_token', data.token);
    } catch (err) {
      console.warn('Demo switch fallback to local selection:', err);
      const found = availableUsers.find((u) => u._id === userId);
      if (found) {
        setCurrentUser(found);
        localStorage.setItem('taskflow_user', JSON.stringify(found));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, availableUsers, switchUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
