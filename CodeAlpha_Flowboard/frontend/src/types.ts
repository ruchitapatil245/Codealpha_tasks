export interface User {
  id: string;
  email: string;
  name: string;
}

export interface ProjectMember {
  id: string;
  role: string;
  user: User;
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  position: number;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string | null;
  columnId: string;
  assignee?: User | null;
  assigneeId?: string | null;
  _count?: { comments: number };
}

export interface Column {
  id: string;
  title: string;
  position: number;
  tasks: Task[];
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: User;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  owner: User;
  members: ProjectMember[];
  columns: Column[];
}

export interface Notification {
  id: string;
  type: string;
  message: string;
  link?: string | null;
  read: boolean;
  createdAt: string;
}

export interface TaskDetail extends Task {
  comments: Comment[];
  column: { projectId: string };
}
