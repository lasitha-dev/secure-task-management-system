import React from 'react'

const ACTION_META = {
  created:        { icon: 'add_circle',    color: 'text-green-500',  label: 'created this task' },
  updated:        { icon: 'edit',          color: 'text-primary',    label: 'updated' },
  assigned:       { icon: 'person_add',    color: 'text-indigo-500', label: 'assigned' },
  unassigned:     { icon: 'person_remove', color: 'text-orange-500', label: 'unassigned' },
  commented:      { icon: 'comment',       color: 'text-slate-500',  label: 'commented' },
  deleted_comment:{ icon: 'delete',        color: 'text-red-400',    label: 'deleted a comment' },
  logged_time:    { icon: 'timer',         color: 'text-teal-500',   label: 'logged time' },
}

function formatRelative(dateStr) {
  if (!dateStr) return ''
  const delta = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(delta / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7)  return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function ActivityEntry({ entry }) {
  const meta = ACTION_META[entry.action] || { icon: 'history', color: 'text-slate-400', label: entry.action }

  let detail = null
  if (entry.action === 'updated' && entry.field) {
    detail = (
      <span className="text-xs text-slate-500 dark:text-slate-400">
        {' '}<span className="font-semibold text-slate-600 dark:text-slate-300">{entry.field}</span>
        {entry.oldValue && (
          <> from <span className="line-through opacity-60">{entry.oldValue}</span></>
        )}
        {entry.newValue && (
          <> to <span className="text-primary font-medium">{entry.newValue}</span></>
        )}
      </span>
    )
  } else if (entry.action === 'assigned' && entry.newValue) {
    detail = (
      <span className="text-xs text-slate-500 dark:text-slate-400">
        {' '}<span className="font-semibold text-indigo-500">{entry.newValue}</span>
      </span>
    )
  } else if (entry.action === 'unassigned' && entry.oldValue) {
    detail = (
      <span className="text-xs text-slate-500 dark:text-slate-400">
        {' '}<span className="font-semibold text-orange-500">{entry.oldValue}</span>
      </span>
    )
  } else if (entry.action === 'logged_time' && entry.newValue) {
    detail = (
      <span className="text-xs text-teal-500 font-semibold"> {entry.newValue}</span>
    )
  } else if (entry.action === 'commented' && entry.newValue) {
    detail = (
      <span className="text-xs text-slate-400 italic"> "{entry.newValue}{entry.newValue.length >= 60 ? '…' : ''}"</span>
    )
  }

  return (
    <div className="flex gap-3 group">
      {/* Icon + line */}
      <div className="flex flex-col items-center">
        <div className={`h-7 w-7 rounded-full bg-slate-100 dark:bg-surface-highlight flex items-center justify-center flex-shrink-0 ${meta.color}`}>
          <span className="material-symbols-outlined text-[15px]">{meta.icon}</span>
        </div>
        <div className="w-px flex-1 bg-slate-200 dark:bg-surface-highlight/50 mt-1" />
      </div>

      {/* Content */}
      <div className="pb-4 flex-1 min-w-0">
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <span className="font-semibold text-slate-900 dark:text-white">{entry.userName}</span>
          {' '}{meta.label}
          {detail}
        </p>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
          {formatRelative(entry.createdAt)}
        </p>
      </div>
    </div>
  )
}

/**
 * ActivityLog
 * Props: activity — array of activity objects from Task model
 */
export default function ActivityLog({ activity = [] }) {
  if (activity.length === 0) {
    return (
      <div className="text-center py-6 text-slate-400 dark:text-slate-500">
        <span className="material-symbols-outlined text-3xl block mb-2">history</span>
        <p className="text-sm">No activity yet</p>
      </div>
    )
  }

  // newest first
  const sorted = [...activity].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  return (
    <div className="space-y-0">
      {sorted.map((entry, i) => (
        <ActivityEntry key={entry._id || i} entry={entry} />
      ))}
    </div>
  )
}
