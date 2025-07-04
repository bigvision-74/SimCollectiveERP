import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UploadTask {
  id: string;
  contentName: string;
  fileName: string;
  fileSize: number;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  error?: string;
}

interface UploadContextType {
  tasks: UploadTask[];
  addTask: (file: File, contentName: string) => string;
  updateTask: (id: string, updates: Partial<UploadTask>) => void;
  removeTask: (id: string) => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

interface UploadProviderProps {
  children: ReactNode;
}

export const UploadProvider: React.FC<UploadProviderProps> = ({ children }) => {
  const [tasks, setTasks] = useState<UploadTask[]>([]);

  const addTask = (file: File, contentName: string,): string => {
    const id = Math.random().toString(36).substring(2, 9);
    const newTask: UploadTask = {
      id,
      fileName: file.name,
      fileSize: file.size,
      progress: 0,
      status: 'pending',
      contentName: contentName,
    };
    setTasks(prev => [...prev, newTask]);
    return id;
  };

  const updateTask = (id: string, updates: Partial<UploadTask>) => {
    setTasks(prev =>
      prev.map(task => (task.id == id ? { ...task, ...updates } : task))
    );
    
    if (updates.status == 'completed' || updates.status == 'failed') {
      setTimeout(() => {
        setTasks(prev => prev.filter(task => task.id !== id));
      }, 3000); 
    }
  };

  const removeTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  return (
    <UploadContext.Provider value={{ tasks, addTask, updateTask, removeTask }}>
      {children}
    </UploadContext.Provider>
  );
};

export const useUploads = (): UploadContextType => {
  const context = useContext(UploadContext);
  if (!context) {
    throw new Error('useUploads must be used within an UploadProvider');
  }
  return context;
};