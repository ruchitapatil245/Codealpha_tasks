import type { Task } from '../types';

const priorityColors = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
};

interface Props {
  task: Task;
  onClick: () => void;
}

export default function TaskCard({ task, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-lg border border-border p-3 shadow-sm hover:shadow-md hover:border-brand-200 transition-all group"
    >
      <p className="font-medium text-sm group-hover:text-brand-600 transition-colors">{task.title}</p>
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${priorityColors[task.priority]}`}>
          {task.priority}
        </span>
        {task.dueDate && (
          <span className="text-[10px] text-muted">
            Due {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
        {task._count && task._count.comments > 0 && (
          <span className="text-[10px] text-muted flex items-center gap-0.5">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {task._count.comments}
          </span>
        )}
      </div>
      {task.assignee && (
        <div className="mt-2 flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-[10px] font-bold flex items-center justify-center">
            {task.assignee.name.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs text-muted">{task.assignee.name}</span>
        </div>
      )}
    </button>
  );
}
