import React from 'react'

const PRIORITY_STYLES = {
  urgent:  'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200/50 dark:border-red-800/30',
  high:    'bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border-orange-200/50 dark:border-orange-800/30',
  medium:  'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-600 dark:text-yellow-400 border-yellow-200/50 dark:border-yellow-800/30',
  low:     'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-800/30',
  backend: 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-800/30',
  frontend:'bg-teal-100 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border-teal-200/50 dark:border-teal-800/30',
  devops:  'bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200/50 dark:border-purple-800/30',
}

function getPriorityStyle(priority) {
  return PRIORITY_STYLES[priority?.toLowerCase()] || PRIORITY_STYLES.low
}

function isOverdue(dateStr) {
  if (!dateStr) return false
  return new Date(dateStr) < new Date()
}

function isDueToday(dateStr) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const today = new Date()
  return d.toDateString() === today.toDateString()
}

function formatDate(dateStr) {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()
}

export default function TaskCard({ task, isDone, onEdit, onDelete, onViewDetail, provided }) {
  const overdue = isOverdue(task.deadline)
  const today = isDueToday(task.deadline)

  const assignees = task.assignees?.length > 0
    ? task.assignees
    : task.assignedTo
      ? [{ id: 'legacy', name: task.assignedTo, avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(task.assignedTo)}&background=144bb8&color=fff` }]
      : []

  return (
    <div
      ref={provided?.innerRef}
      {...(provided?.draggableProps || {})}
      {...(provided?.dragHandleProps || {})}
      className={`p-5 rounded-xl border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group
        ${isDone
          ? 'bg-white/60 dark:bg-surface-dark/60 border-slate-200/50 dark:border-surface-highlight/30'
          : task.status === 'in_progress'
            ? 'bg-white dark:bg-surface-dark border-l-4 border-l-primary border-y border-r border-slate-200 dark:border-surface-highlight cursor-grab active:cursor-grabbing'
            : 'bg-white dark:bg-surface-dark border-slate-200 dark:border-surface-highlight cursor-grab active:cursor-grabbing'
        }`}
    >
      {/* Top row */}
      <div className="flex justify-between items-start mb-3">
        <span
          className={`text-[10px] font-black px-2 py-1 rounded uppercase border ${getPriorityStyle(task.priority)}`}
        >
          {task.priority}
        </span>
        {!isDone && (
          <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
            {onEdit && (
              <button
                onClick={() => onEdit(task)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-surface-highlight rounded text-slate-400 hover:text-primary"
              >
                <span className="material-symbols-outlined text-sm">edit</span>
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(task._id)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-surface-highlight rounded text-slate-400 hover:text-red-400"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Title */}
      <h4
        onClick={() => onViewDetail?.(task)}
        className={`font-bold mb-2 leading-tight cursor-pointer hover:text-primary transition-colors
          ${isDone ? 'text-slate-500 dark:text-slate-500 line-through' : 'text-slate-900 dark:text-white'}`}
      >
        {task.title}
      </h4>

      {/* Description */}
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4 line-clamp-2">
        {task.description}
      </p>

      {/* Progress bar for in-progress tasks */}
      {task.status === 'in_progress' && task.progress != null && (
        <div className="w-full bg-slate-100 dark:bg-slate-700/50 rounded-full h-1 mb-4 overflow-hidden">
          <div
            className="bg-primary h-1 rounded-full transition-all duration-500"
            style={{ width: `${task.progress}%` }}
          />
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-slate-100 dark:border-surface-highlight/50 pt-3">
        {/* Assignee avatars (stacked) */}
        <div className="flex -space-x-2">
          {assignees.length > 0 ? (
            <>
              {assignees.slice(0, 4).map((u, i) => (
                <img
                  key={u.id || i}
                  alt={u.name}
                  title={u.name}
                  className={`h-6 w-6 rounded-full border-2 border-white dark:border-surface-dark ${isDone ? 'grayscale opacity-50' : ''}`}
                  src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=144bb8&color=fff&size=48`}
                />
              ))}
              {assignees.length > 4 && (
                <div className="h-6 w-6 rounded-full border-2 border-white dark:border-surface-dark bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-600 dark:text-slate-300">
                  +{assignees.length - 4}
                </div>
              )}
            </>
          ) : (
            <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-[8px] text-white font-bold uppercase">
              {task.title?.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        {/* Due date */}
        {isDone ? (
          <div className="flex items-center gap-1.5 text-green-500 text-[10px] font-bold uppercase">
            <span className="material-symbols-outlined text-[14px]">done_all</span>
            <span>Completed</span>
          </div>
        ) : task.deadline ? (
          <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase ${today ? 'text-red-500' : overdue ? 'text-red-400' : 'text-primary'}`}>
            <span className={`material-symbols-outlined text-[14px] ${today ? 'animate-pulse' : ''}`}>
              {today ? 'priority_high' : 'event'}
            </span>
            <span>{today ? 'Today' : formatDate(task.deadline)}</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}
