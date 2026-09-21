import React, { useState, useEffect } from 'react'
import api from '../api/axios'
import UserSearchInput from './UserSearchInput'
import ActivityLog from './ActivityLog'
import { toast } from 'react-toastify'

const PRIORITY_COLORS = {
  urgent: 'text-red-500 bg-red-100 dark:bg-red-950/40 border-red-200/50',
  high:   'text-orange-500 bg-orange-100 dark:bg-orange-950/40 border-orange-200/50',
  medium: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-950/40 border-yellow-200/50',
  low:    'text-indigo-500 bg-indigo-100 dark:bg-indigo-950/40 border-indigo-200/50',
}

const STATUS_COLORS = {
  todo:        'text-slate-500 bg-slate-100 dark:bg-slate-800',
  in_progress: 'text-primary bg-primary/10',
  done:        'text-green-500 bg-green-100 dark:bg-green-950/40',
}

const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' }

const TABS = ['Details', 'Comments', 'Time Log', 'Activity']

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function CommentThread({ comments = [], taskId, onChange }) {
  const [text, setText]       = useState('')
  const [loading, setLoading] = useState(false)

  async function handleAdd(e) {
    e.preventDefault()
    if (!text.trim()) return
    setLoading(true)
    try {
      const { data } = await api.post(`/api/tasks/${taskId}/comments`, { text: text.trim() })
      onChange(data.task)
      setText('')
      toast.success('Comment added')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add comment')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(commentId) {
    try {
      const { data } = await api.delete(`/api/tasks/${taskId}/comments/${commentId}`)
      onChange(data.task)
      toast.success('Comment deleted')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete comment')
    }
  }

  return (
    <div className="space-y-4">
      {/* Add comment */}
      <form onSubmit={handleAdd} className="flex gap-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a comment…"
          rows={2}
          className="flex-1 bg-white dark:bg-background-dark border border-slate-200 dark:border-surface-highlight rounded-lg px-4 py-2.5 text-sm resize-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 dark:text-white placeholder:text-slate-400"
        />
        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="self-end px-4 py-2 bg-primary hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
          ) : (
            <span className="material-symbols-outlined text-sm">send</span>
          )}
        </button>
      </form>

      {/* Comment list */}
      {comments.length === 0 && (
        <div className="text-center py-8 text-slate-400 dark:text-slate-500">
          <span className="material-symbols-outlined text-3xl block mb-2">chat_bubble_outline</span>
          <p className="text-sm">No comments yet — be the first!</p>
        </div>
      )}
      <div className="space-y-3">
        {[...comments].reverse().map((c) => (
          <div key={c._id} className="flex gap-3 group">
            <img src={c.avatar} alt={c.authorName} className="h-8 w-8 rounded-full flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">{c.authorName}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">
                    {formatDate(c.createdAt)}
                  </span>
                  <button
                    onClick={() => handleDelete(c._id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 transition-all"
                  >
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                  </button>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-background-dark rounded-lg px-3 py-2">
                {c.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TimeLogPanel({ timeLogs = [], totalHours, estimatedHours, taskId, onChange }) {
  const [hours, setHours] = useState('')
  const [note, setNote]   = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLog(e) {
    e.preventDefault()
    const h = parseFloat(hours)
    if (!h || h <= 0) return
    setLoading(true)
    try {
      const { data } = await api.post(`/api/tasks/${taskId}/time-logs`, { hours: h, note })
      onChange(data.task)
      setHours('')
      setNote('')
      toast.success(`${h}h logged!`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log time')
    } finally {
      setLoading(false)
    }
  }

  const progress = estimatedHours ? Math.min((totalHours / estimatedHours) * 100, 100) : null

  return (
    <div className="space-y-5">
      {/* Progress vs estimate */}
      <div className="bg-slate-50 dark:bg-background-dark/60 rounded-xl p-4 border border-slate-200 dark:border-surface-highlight">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Time Tracking</span>
          <span className="text-sm font-bold text-primary">{totalHours || 0}h logged</span>
        </div>
        {estimatedHours ? (
          <>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-1 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all ${progress >= 100 ? 'bg-red-500' : 'bg-primary'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400">{totalHours || 0}h of {estimatedHours}h estimated</p>
          </>
        ) : (
          <p className="text-[10px] text-slate-400">No estimate set</p>
        )}
      </div>

      {/* Log form */}
      <form onSubmit={handleLog} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Hours Spent</label>
            <input
              type="number"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              min="0.25"
              step="0.25"
              placeholder="e.g. 2.5"
              className="w-full bg-white dark:bg-background-dark border border-slate-200 dark:border-surface-highlight rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Note (optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What did you work on?"
              className="w-full bg-white dark:bg-background-dark border border-slate-200 dark:border-surface-highlight rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 dark:text-white"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading || !hours}
          className="w-full py-2 bg-primary hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
          <span className="material-symbols-outlined text-sm">timer</span>
          Log Time
        </button>
      </form>

      {/* Log history */}
      {timeLogs.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">History</h4>
          {[...timeLogs].reverse().map((log, i) => (
            <div key={i} className="flex items-center justify-between py-2 px-3 bg-slate-50 dark:bg-background-dark rounded-lg border border-slate-100 dark:border-surface-highlight/50">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[14px] text-teal-500">timer</span>
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">{log.userName}</p>
                  {log.note && <p className="text-[10px] text-slate-400">{log.note}</p>}
                </div>
              </div>
              <span className="text-sm font-bold text-teal-500">{log.hoursLogged}h</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Modal ──────────────────────────────────────────────────────────────

export default function TaskDetailModal({ taskId, isOpen, onClose, onTaskUpdated }) {
  const [task, setTask]         = useState(null)
  const [loading, setLoading]   = useState(false)
  const [activeTab, setActiveTab] = useState('Details')

  // Assignee editing state
  const [editingAssignees, setEditingAssignees] = useState(false)
  const [draftAssignees, setDraftAssignees]     = useState([])
  const [savingAssignees, setSavingAssignees]   = useState(false)

  useEffect(() => {
    if (isOpen && taskId) {
      loadTask()
      setActiveTab('Details')
    }
  }, [isOpen, taskId])

  async function loadTask() {
    setLoading(true)
    try {
      const { data } = await api.get(`/api/tasks/${taskId}`)
      setTask(data.task)
    } catch (err) {
      toast.error('Failed to load task')
    } finally {
      setLoading(false)
    }
  }

  function handleTaskChange(updatedTask) {
    setTask(updatedTask)
    onTaskUpdated?.(updatedTask)
  }

  async function handleStatusChange(newStatus) {
    try {
      const { data } = await api.patch(`/api/tasks/${taskId}`, { status: newStatus })
      handleTaskChange(data.task)
      toast.success(`Status → ${STATUS_LABELS[newStatus]}`)
    } catch (error) {
      console.error('Status update failed:', error)
      const message = error.response?.data?.message || 'Failed to update task status'
      toast.error(message)
    }
  }

  async function handlePriorityChange(newPriority) {
    try {
      const { data } = await api.patch(`/api/tasks/${taskId}`, { priority: newPriority })
      handleTaskChange(data.task)
    } catch (error) {
      console.error('Priority update failed:', error)
      const message = error.response?.data?.message || 'Failed to update priority'
      toast.error(message)
    }
  }

  function startEditAssignees() {
    setDraftAssignees(task.assignees || [])
    setEditingAssignees(true)
  }

  async function saveAssignees() {
    setSavingAssignees(true)
    try {
      const current  = task.assignees || []
      const toAdd    = draftAssignees.filter((d) => !current.some((c) => c.id === d.id))
      const toRemove = current.filter((c) => !draftAssignees.some((d) => d.id === c.id))

      let latest = task
      for (const u of toAdd) {
        const { data } = await api.post(`/api/tasks/${taskId}/assignees`, u)
        latest = data.task
      }
      for (const u of toRemove) {
        const { data } = await api.delete(`/api/tasks/${taskId}/assignees/${u.id}`)
        latest = data.task
      }

      handleTaskChange(latest)
      setEditingAssignees(false)
      toast.success('Assignees updated')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update assignees')
    } finally {
      setSavingAssignees(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/60 backdrop-blur-sm px-4 pt-10 pb-6 overflow-y-auto">
      <div className="bg-white dark:bg-surface-dark w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 dark:border-surface-highlight overflow-hidden">

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <span className="material-symbols-outlined text-3xl text-primary animate-spin">progress_activity</span>
          </div>
        )}

        {!loading && task && (
          <>
            {/* Header */}
            <div className="px-6 pt-6 pb-0 border-b border-slate-100 dark:border-surface-highlight">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight mb-2">
                    {task.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status selector */}
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className={`text-xs font-bold px-2.5 py-1 rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-primary/20 ${STATUS_COLORS[task.status]}`}
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>

                    {/* Priority selector */}
                    <select
                      value={task.priority}
                      onChange={(e) => handlePriorityChange(e.target.value)}
                      className={`text-xs font-bold px-2.5 py-1 rounded border cursor-pointer focus:ring-2 focus:ring-primary/20 ${PRIORITY_COLORS[task.priority]}`}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>

                    {/* Project */}
                    {task.project && (
                      <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                        {task.project}
                      </span>
                    )}
                    {task.sprint && (
                      <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                        {task.sprint}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors flex-shrink-0 mt-1"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-0 -mb-px">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 mr-1
                      ${activeTab === tab
                        ? 'text-primary border-primary'
                        : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-white'
                      }`}
                  >
                    {tab}
                    {tab === 'Comments' && task.comments?.length > 0 && (
                      <span className="ml-1.5 text-[10px] bg-primary text-white rounded-full px-1.5 py-0.5">
                        {task.comments.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">

              {/* ── Details tab ─────────────────────────────────────── */}
              {activeTab === 'Details' && (
                <div className="space-y-6">
                  {/* Description */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Description</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-background-dark/50 rounded-lg px-4 py-3 border border-slate-100 dark:border-surface-highlight">
                      {task.description || <span className="italic text-slate-400">No description provided.</span>}
                    </p>
                  </div>

                  {/* Assignees */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Assignees</h3>
                      {!editingAssignees ? (
                        <button
                          onClick={startEditAssignees}
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">edit</span>
                          Edit
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingAssignees(false)}
                            className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={saveAssignees}
                            disabled={savingAssignees}
                            className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 disabled:opacity-60"
                          >
                            {savingAssignees && <span className="material-symbols-outlined text-[12px] animate-spin">progress_activity</span>}
                            Save
                          </button>
                        </div>
                      )}
                    </div>

                    {editingAssignees ? (
                      <UserSearchInput
                        selected={draftAssignees}
                        onChange={setDraftAssignees}
                        label=""
                      />
                    ) : task.assignees?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {task.assignees.map((u) => (
                          <div key={u.id} className="flex items-center gap-2 bg-slate-50 dark:bg-background-dark border border-slate-200 dark:border-surface-highlight rounded-lg px-3 py-1.5">
                            <img src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=144bb8&color=fff`} alt={u.name} className="h-6 w-6 rounded-full" />
                            <div>
                              <p className="text-xs font-semibold text-slate-900 dark:text-white">{u.name}</p>
                              <p className="text-[10px] text-slate-400">{u.role}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 italic">
                        No assignees yet.{' '}
                        <button onClick={startEditAssignees} className="text-primary hover:underline not-italic">Add one</button>
                      </p>
                    )}
                  </div>

                  {/* Meta row */}
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Reporter</p>
                      <div className="flex items-center gap-2">
                        {task.reporter ? (
                          <>
                            <img
                              src={task.reporter.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(task.reporter.name)}&background=144bb8&color=fff`}
                              alt={task.reporter.name}
                              className="h-5 w-5 rounded-full"
                            />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{task.reporter.name}</span>
                          </>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Deadline</p>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{formatDate(task.deadline)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Progress</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${task.progress || 0}%` }} />
                        </div>
                        <span className="text-xs font-bold text-primary">{task.progress || 0}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {task.tags?.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Tags</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {task.tags.map((tag, i) => (
                          <span key={i} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Comments tab ─────────────────────────────────────── */}
              {activeTab === 'Comments' && (
                <CommentThread
                  comments={task.comments || []}
                  taskId={taskId}
                  onChange={handleTaskChange}
                />
              )}

              {/* ── Time Log tab ─────────────────────────────────────── */}
              {activeTab === 'Time Log' && (
                <TimeLogPanel
                  timeLogs={task.timeLogs || []}
                  totalHours={task.totalLoggedHours || 0}
                  estimatedHours={task.estimatedHours}
                  taskId={taskId}
                  onChange={handleTaskChange}
                />
              )}

              {/* ── Activity tab ─────────────────────────────────────── */}
              {activeTab === 'Activity' && (
                <ActivityLog activity={task.activity || []} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
