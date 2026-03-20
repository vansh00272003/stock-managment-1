import { create } from 'zustand';

export interface LogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  entity: string;
  details: string;
}

interface LogStore {
  logs: LogEntry[];
  addLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
}

export const useLogStore = create<LogStore>((set) => ({
  logs: [
    { id: '1', timestamp: new Date().toISOString(), user: 'System', action: 'CREATE', entity: 'System', details: 'System initialized' }
  ],
  addLog: (log) => set((state) => ({
    logs: [{
      ...log,
      id: Math.random().toString(),
      timestamp: new Date().toISOString()
    }, ...state.logs]
  }))
}));
