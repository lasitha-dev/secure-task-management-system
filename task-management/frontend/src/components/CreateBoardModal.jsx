import React, { useState, useEffect } from 'react'
import UserSearchInput from './UserSearchInput'

export default function CreateBoardModal({ isOpen, onClose, onSubmit, initialData = null }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [sprint, setSprint] = useState('')
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)

  // Load initial data when editing
  useEffect(() => {
    if (isOpen && initialData) {
      setName(initialData.name || '')
      setDescription(initialData.description || '')
      setSprint(initialData.sprint || '')
      setMembers(initialData.members || [])
    } else if (isOpen && !initialData) {
      reset()
    }
  }, [isOpen, initialData])

  const isEditing = Boolean(initialData)

  function reset() {
    setName('')
    setDescription('')
    setSprint('')
    setMembers([])
    setLoading(false)
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        sprint: sprint.trim() || 'Sprint 1',
        members: members.map(m => ({
          id: m.id,
          name: m.name,
          email: m.email,
          role: 'member',
          avatar: m.avatar
        }))
      })
      handleClose()
    } catch (err) {
      setLoading(false)
      // Error handling is done by parent
    }
  }

  function handleAddUser(user) {
    if (!members.find(m => m.id === user.id)) {
      setMembers([...members, user])
    }
  }

  function handleRemoveUser(userId) {
    setMembers(members.filter(m => m.id !== userId))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-200 dark:border-border-dark flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-3xl text-primary">{isEditing ? 'edit' : 'dashboard'}</span>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-text-dark">
                {isEditing ? 'Edit Board' : 'Create New Board'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {isEditing ? 'Update board details and members' : 'Create a board to organize tasks and collaborate with team members'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <span className="material-symbols-outlined text-[28px]">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
          {/* Board Name */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-text-dark mb-2">
              Board Name test <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Website Redesign, Q1 2024 Projects"
              maxLength={100}
              required
              disabled={loading}
              className="w-full px-4 py-3 border border-slate-200 dark:border-border-dark rounded-xl bg-white dark:bg-background-dark text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {name.length}/100 characters
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-text-dark mb-2">
              Description <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what this board is for..."
              maxLength={500}
              rows={3}
              disabled={loading}
              className="w-full px-4 py-3 border border-slate-200 dark:border-border-dark rounded-xl bg-white dark:bg-background-dark text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {description.length}/500 characters
            </p>
          </div>

          {/* Sprint/Subtitle */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-text-dark mb-2">
              Sprint/Phase <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={sprint}
              onChange={(e) => setSprint(e.target.value)}
              placeholder="e.g., Sprint 4, Phase 1, Q1 2024"
              maxLength={50}
              disabled={loading}
              className="w-full px-4 py-3 border border-slate-200 dark:border-border-dark rounded-xl bg-white dark:bg-background-dark text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              {sprint.length}/50 characters
            </p>
          </div>

          {/* Add Members */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-text-dark mb-2">
              Add Team Members <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <UserSearchInput 
              onSelect={handleAddUser}
              placeholder="Search users to add to this board..."
              disabled={loading}
            />
            
            {/* Selected Members */}
            {members.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  Selected Members ({members.length})
                </p>
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-surface-highlight rounded-lg group"
                    >
                      <img
                        src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=144bb8&color=fff`}
                        alt={member.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-800 dark:text-text-dark truncate">
                          {member.name}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {member.email}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveUser(member.id)}
                        disabled={loading}
                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 transition-all"
                      >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-slate-200 dark:border-border-dark flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-6 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-highlight rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading || !name.trim()}
            className="px-6 py-2.5 bg-primary hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>}
            {loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Board' : 'Create Board')}
          </button>
        </div>
      </div>
    </div>
  )
}
