import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { joinProject, leaveProject, useSocket } from '../hooks/useSocket';
import Layout from '../components/Layout';
import BoardColumn from '../components/BoardColumn';
import TaskModal from '../components/TaskModal';
import type { Column, Project, Task, TaskDetail, User } from '../types';

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { token } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<string | null>(
    searchParams.get('task')
  );
  const [showInvite, setShowInvite] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [addingColumn, setAddingColumn] = useState(false);

  const loadProject = useCallback(() => {
    if (!id) return;
    api.getProject(id)
      .then(setProject)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  useEffect(() => {
    if (!id) return;
    joinProject(id);
    return () => leaveProject(id);
  }, [id]);

  useSocket(token, (socket) => {
    if (!id) return;

    socket.on('task:created', (task: Task) => {
      setProject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          columns: prev.columns.map((col) =>
            col.id === task.columnId
              ? { ...col, tasks: [...col.tasks, task] }
              : col
          ),
        };
      });
    });

    socket.on('task:updated', (task: Task) => {
      setProject((prev) => {
        if (!prev) return prev;
        const columns = prev.columns.map((col) => ({
          ...col,
          tasks: col.tasks.filter((t) => t.id !== task.id),
        }));
        return {
          ...prev,
          columns: columns.map((col) =>
            col.id === task.columnId
              ? { ...col, tasks: [...col.tasks, task].sort((a, b) => a.position - b.position) }
              : col
          ),
        };
      });
    });

    socket.on('task:deleted', ({ id: taskId }: { id: string }) => {
      setProject((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          columns: prev.columns.map((col) => ({
            ...col,
            tasks: col.tasks.filter((t) => t.id !== taskId),
          })),
        };
      });
      if (selectedTask === taskId) setSelectedTask(null);
    });

    socket.on('column:created', (column: Column) => {
      setProject((prev) => {
        if (!prev) return prev;
        return { ...prev, columns: [...prev.columns, { ...column, tasks: [] }] };
      });
    });

    socket.on('project:member_added', () => loadProject());
    socket.on('project:member_removed', () => loadProject());
  });

  const handleTaskClick = (taskId: string) => {
    setSelectedTask(taskId);
    setSearchParams({ task: taskId });
  };

  const handleCloseModal = () => {
    setSelectedTask(null);
    setSearchParams({});
  };

  const handleTaskCreated = (columnId: string, task: Task) => {
    setProject((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        columns: prev.columns.map((col) =>
          col.id === columnId ? { ...col, tasks: [...col.tasks, task] } : col
        ),
      };
    });
  };

  const handleTaskUpdate = (updated: TaskDetail) => {
    setProject((prev) => {
      if (!prev) return prev;
      const columns = prev.columns.map((col) => ({
        ...col,
        tasks: col.tasks.filter((t) => t.id !== updated.id),
      }));
      return {
        ...prev,
        columns: columns.map((col) =>
          col.id === updated.columnId
            ? { ...col, tasks: [...col.tasks, updated].sort((a, b) => a.position - b.position) }
            : col
        ),
      };
    });
  };

  const handleTaskDelete = (taskId: string) => {
    setProject((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        columns: prev.columns.map((col) => ({
          ...col,
          tasks: col.tasks.filter((t) => t.id !== taskId),
        })),
      };
    });
  };

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    const results = await api.searchUsers(q);
    const memberIds = new Set(project?.members.map((m) => m.user.id));
    setSearchResults(results.filter((u) => !memberIds.has(u.id)));
  };

  const handleInvite = async (userId: string) => {
    if (!id) return;
    await api.addMember(id, userId);
    loadProject();
    setSearchQuery('');
    setSearchResults([]);
    setShowInvite(false);
  };

  const handleAddColumn = async (e: FormEvent) => {
    e.preventDefault();
    if (!id || !newColumnTitle.trim()) return;
    setAddingColumn(true);
    try {
      const column = await api.createColumn(id, newColumnTitle.trim());
      setProject((prev) => {
        if (!prev) return prev;
        return { ...prev, columns: [...prev.columns, { ...column, tasks: [] }] };
      });
      setNewColumnTitle('');
    } finally {
      setAddingColumn(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-muted">Project not found</p>
          <Link to="/" className="text-brand-600 hover:underline mt-2 inline-block">Back to dashboard</Link>
        </div>
      </Layout>
    );
  }

  const members = project.members.map((m) => m.user);

  return (
    <Layout>
      <div className="px-4 py-4 border-b border-border bg-white">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-muted hover:text-slate-900">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold">{project.name}</h1>
              {project.description && (
                <p className="text-sm text-muted">{project.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {members.slice(0, 5).map((m) => (
                <div
                  key={m.id}
                  title={m.name}
                  className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center border-2 border-white"
                >
                  {m.name.charAt(0).toUpperCase()}
                </div>
              ))}
              {members.length > 5 && (
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 text-xs font-bold flex items-center justify-center border-2 border-white">
                  +{members.length - 5}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowInvite(!showInvite)}
              className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-slate-50"
            >
              Invite
            </button>
          </div>
        </div>

        {showInvite && (
          <div className="max-w-[1600px] mx-auto mt-3 relative">
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search users by name or email..."
              className="w-full max-w-md px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full mt-1 w-full max-w-md bg-white rounded-lg shadow-lg border border-border z-10">
                {searchResults.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleInvite(u.id)}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm"
                  >
                    <span className="font-medium">{u.name}</span>
                    <span className="text-muted ml-2">{u.email}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="overflow-x-auto px-4 py-6">
        <div className="flex gap-4 min-w-min pb-4">
          {project.columns.map((column) => (
            <BoardColumn
              key={column.id}
              column={column}
              members={members}
              onTaskClick={handleTaskClick}
              onTaskCreated={handleTaskCreated}
            />
          ))}

          <form onSubmit={handleAddColumn} className="flex-shrink-0 w-72">
            <input
              value={newColumnTitle}
              onChange={(e) => setNewColumnTitle(e.target.value)}
              placeholder="+ Add column"
              className="w-full px-3 py-2 text-sm rounded-xl bg-slate-100/80 border border-transparent focus:border-brand-300 focus:bg-white focus:outline-none"
            />
            {newColumnTitle && (
              <button
                type="submit"
                disabled={addingColumn}
                className="mt-2 w-full py-1.5 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
              >
                {addingColumn ? 'Adding...' : 'Add column'}
              </button>
            )}
          </form>
        </div>
      </div>

      {selectedTask && (
        <TaskModal
          taskId={selectedTask}
          members={members}
          columns={project.columns.map((c) => ({ id: c.id, title: c.title }))}
          onClose={handleCloseModal}
          onUpdate={handleTaskUpdate}
          onDelete={handleTaskDelete}
        />
      )}
    </Layout>
  );
}
