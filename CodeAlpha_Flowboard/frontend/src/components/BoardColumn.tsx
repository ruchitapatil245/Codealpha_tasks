import { FormEvent, useState } from 'react';
import { api } from '../api';
import type { Column, Task } from '../types';
import TaskCard from './TaskCard';

interface Props {
  column: Column;
  members: { id: string; name: string }[];
  onTaskClick: (taskId: string) => void;
  onTaskCreated: (columnId: string, task: Task) => void;
}

export default function BoardColumn({ column, members, onTaskClick, onTaskCreated }: Props) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      const task = await api.createTask(column.id, {
        title: title.trim(),
        assigneeId: assigneeId || undefined,
      });
      onTaskCreated(column.id, task);
      setTitle('');
      setAssigneeId('');
      setAdding(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-shrink-0 w-72 bg-slate-100/80 rounded-xl p-3 flex flex-col max-h-[calc(100vh-180px)]">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="font-semibold text-sm">{column.title}</h3>
        <span className="text-xs text-muted bg-white px-2 py-0.5 rounded-full">
          {column.tasks.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 min-h-[60px]">
        {column.tasks.map((task) => (
          <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task.id)} />
        ))}
      </div>

      {adding ? (
        <form onSubmit={handleAdd} className="mt-2 space-y-2">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            className="w-full px-2.5 py-2 text-sm rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
          <select
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-border bg-white"
          >
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-1.5 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => { setAdding(false); setTitle(''); }}
              className="flex-1 py-1.5 text-sm border border-border rounded-lg hover:bg-white"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-2 w-full py-2 text-sm text-muted hover:text-brand-600 hover:bg-white rounded-lg transition-colors"
        >
          + Add task
        </button>
      )}
    </div>
  );
}
