import React, { useState, useEffect } from 'react'
import UserSearchInput from './UserSearchInput'

const DEFAULT_FORM = {
  title: '',
  description: '',
  deadline: '',
  priority: 'medium',
  status: 'todo',
  assignees: [],
}

export default function CreateTaskModal({ isOpen, onClose, onSubmit, initialData, defaultStatus, boardMembers = [] }) {
  const [form, setForm] = useState(DEFAULT_FORM)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title || '',
        description: initialData.description || '',
        deadline: initialData.deadline ? initialData.deadline.slice(0, 10) : '',
        priority: initialData.priority || 'medium',
        status: initialData.status || 'todo',
        assignees: initialData.assignees || [],
      })
    } else {
      setForm({ ...DEFAULT_FORM, status: defaultStatus || 'todo' })
    }
  }, [initialData, isOpen, defaultStatus])

  if (!isOpen) return null

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    setLoading(true)
    try {
      await onSubmit(form)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const isEditing = Boolean(initialData)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-surface-dark w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 dark:border-surface-highlight overflow-hidden">
        {/* Modal header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-surface-highlight flex items-center justify-between bg-slate-50/50 dark:bg-background-dark/30">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined">{isEditing ? 'edit' : 'add_task'}</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {isEditing ? 'Edit Task' : 'Create New Task'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEditing ? 'Update task details' : 'Add a new task to your current sprint'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="title">
                Task Title <span className="text-red-400">*</span>
              </label>
              <input
                id="title"
                name="title"
                type="text"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g., Integrate Redis Cache"
                required
                className="w-full bg-white dark:bg-background-dark border border-slate-200 dark:border-surface-highlight rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Briefly describe the objective and technical requirements..."
                rows={4}
                className="w-full bg-white dark:bg-background-dark border border-slate-200 dark:border-surface-highlight rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none"
              />
            </div>

            {/* Deadline + Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="deadline">
                  Deadline
                </label>
                <input
                  id="deadline"
                  name="deadline"
                  type="date"
                  value={form.deadline}
                  onChange={handleChange}
                  className="w-full bg-white dark:bg-background-dark border border-slate-200 dark:border-surface-highlight rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="priority">
                  Priority
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                  className="w-full bg-white dark:bg-background-dark border border-slate-200 dark:border-surface-highlight rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 dark:text-white"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="status">
                Column / Status
              </label>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full bg-white dark:bg-background-dark border border-slate-200 dark:border-surface-highlight rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 dark:text-white"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
                {/* Dynamically include custom column if passed */}
                {defaultStatus && !['todo', 'in_progress', 'done'].includes(defaultStatus) && (
                  <option value={defaultStatus}>{defaultStatus.replace(/_/g, ' ')}</option>
                )}
              </select>
            </div>

            {/* Assignees */}
            <div>
              <UserSearchInput
                label="Assign To"
                selected={form.assignees}
                onChange={(users) => setForm((prev) => ({ ...prev, assignees: users }))}
                filterUsers={boardMembers.length > 0 ? boardMembers.map(m => m.id) : null}
              />
              {boardMembers.length === 0 && (
                <p className="text-xs text-amber-500 dark:text-amber-400 mt-2 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">info</span>
                  <span>No board members. Add members to the board to assign tasks.</span>
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 dark:bg-background-dark/50 border-t border-slate-100 dark:border-surface-highlight flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-medium bg-primary hover:bg-blue-700 text-white rounded-lg transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading && <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>}
              <span>{isEditing ? 'Update Task' : 'Create Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
