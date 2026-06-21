import { FormEvent, useEffect, useState } from 'react';
import { api } from '../api';
import type { Comment, TaskDetail, User } from '../types';

interface Props {
  taskId: string;
  members: User[];
  columns: { id: string; title: string }[];
  onClose: () => void;
  onUpdate: (task: TaskDetail) => void;
  onDelete: (taskId: string) => void;
}

export default function TaskModal({ taskId, members, columns, onClose, onUpdate, onDelete }: Props) {
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getTask(taskId)
      .then(setTask)
      .finally(() => setLoading(false));
  }, [taskId]);

  const handleSave = async (field: string, value: unknown) => {
    if (!task) return;
    setSaving(true);
    try {
      const updated = await api.updateTask(taskId, { [field]: value });
      const merged = { ...task, ...updated };
      setTask(merged);
      onUpdate(merged);
    } finally {
      setSaving(false);
    }
  };

  const handleComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !task) return;
    setSubmitting(true);
    try {
      const newComment = await api.addComment(taskId, comment.trim());
      const updated = { ...task, comments: [...task.comments, newComment] };
      setTask(updated);
      setComment('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return;
    await api.deleteTask(taskId);
    onDelete(taskId);
    onClose();
  };

  if (loading || !task) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 px-4 py-8 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
        <div className="p-6 border-b border-border">
          <div className="flex items-start justify-between gap-4">
            <input
              defaultValue={task.title}
              onBlur={(e) => {
                if (e.target.value !== task.title) handleSave('title', e.target.value);
              }}
              className="flex-1 text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500/30 rounded px-1 -mx-1"
            />
            <button onClick={onClose} className="text-muted hover:text-slate-900 p-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-5">
            <div>
              <label className="text-xs font-medium text-muted uppercase tracking-wide">Description</label>
              <textarea
                defaultValue={task.description ?? ''}
                onBlur={(e) => {
                  const val = e.target.value || null;
                  if (val !== (task.description ?? null)) handleSave('description', val);
                }}
                rows={4}
                placeholder="Add a description..."
                className="w-full mt-1.5 px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-brand-500/30 resize-none text-sm"
              />
            </div>

            <div>
              <h3 className="text-xs font-medium text-muted uppercase tracking-wide mb-3">
                Comments ({task.comments.length})
              </h3>
              <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                {task.comments.map((c: Comment) => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {c.author.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 bg-slate-50 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{c.author.name}</span>
                        <span className="text-xs text-muted">
                          {new Date(c.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
              <form onSubmit={handleComment} className="flex gap-2">
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="flex-1 px-3 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
                <button
                  type="submit"
                  disabled={submitting || !comment.trim()}
                  className="px-4 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
                >
                  Send
                </button>
              </form>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted uppercase tracking-wide">Status</label>
              <select
                value={task.columnId}
                onChange={(e) => handleSave('columnId', e.target.value)}
                disabled={saving}
                className="w-full mt-1.5 px-3 py-2 text-sm rounded-lg border border-border bg-white"
              >
                {columns.map((col) => (
                  <option key={col.id} value={col.id}>{col.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted uppercase tracking-wide">Assignee</label>
              <select
                value={task.assigneeId ?? ''}
                onChange={(e) => handleSave('assigneeId', e.target.value || null)}
                disabled={saving}
                className="w-full mt-1.5 px-3 py-2 text-sm rounded-lg border border-border bg-white"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted uppercase tracking-wide">Priority</label>
              <select
                value={task.priority}
                onChange={(e) => handleSave('priority', e.target.value)}
                disabled={saving}
                className="w-full mt-1.5 px-3 py-2 text-sm rounded-lg border border-border bg-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted uppercase tracking-wide">Due date</label>
              <input
                type="date"
                defaultValue={task.dueDate ? task.dueDate.slice(0, 10) : ''}
                onChange={(e) =>
                  handleSave('dueDate', e.target.value ? new Date(e.target.value).toISOString() : null)
                }
                className="w-full mt-1.5 px-3 py-2 text-sm rounded-lg border border-border"
              />
            </div>

            <button
              onClick={handleDelete}
              className="w-full py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              Delete task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
