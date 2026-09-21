import React, { useState, useEffect } from 'react'
import { DragDropContext } from '@hello-pangea/dnd'
import KanbanColumn from './KanbanColumn'
import TaskDetailModal from './TaskDetailModal'
import api from '../api/axios'

const DEFAULT_COLUMNS = ['todo', 'in_progress', 'done']
const COLUMN_LABELS = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' }

function groupByStatus(tasks, columns) {
  return columns.reduce((acc, col) => {
    acc[col] = tasks.filter((t) => t.status === col)
    return acc
  }, {})
}

export default function KanbanBoard({ boardId, onNewTask, onEdit }) {
  const [tasks, setTasks]               = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)
  const [detailTaskId, setDetailTaskId] = useState(null)
  const [columns, setColumns]           = useState(DEFAULT_COLUMNS)
  const [addingColumn, setAddingColumn] = useState(false)
  const [newColName, setNewColName]     = useState('')

  async function fetchTasks() {
    try {
      // Fetch tasks filtered by board
      console.log('[KanbanBoard] Fetching tasks for board:', boardId)
      const { data } = await api.get('/api/tasks', {
        params: { board: boardId }
      })
      console.log('[KanbanBoard] Tasks response:', data)
      const taskList = Array.isArray(data) ? data : data.tasks || []
      console.log('[KanbanBoard] Task list:', taskList)
      setTasks(taskList)
      setError(null)

      // Auto-discover any custom column statuses stored in the DB
      const known = new Set(DEFAULT_COLUMNS)
      const discovered = []
      taskList.forEach((t) => {
        if (t.status && !known.has(t.status)) {
          known.add(t.status)
          COLUMN_LABELS[t.status] = t.status.replace(/_/g, ' ')
          discovered.push(t.status)
        }
      })
      if (discovered.length) {
        setColumns((prev) => {
          const merged = [...prev]
          discovered.forEach((s) => { if (!merged.includes(s)) merged.push(s) })
          return merged
        })
      }
    } catch (err) {
      console.error('[KanbanBoard] Failed to load tasks:', err)
      console.error('[KanbanBoard] Error response:', err.response?.data)
      setError('Failed to load tasks. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  async function handleDelete(taskId) {
    if (!window.confirm('Delete this task?')) return
    try {
      await api.delete(`/api/tasks/${taskId}`)
      setTasks((prev) => prev.filter((t) => t._id !== taskId))
    } catch {
      alert('Failed to delete task.')
    }
  }

  async function handleDragEnd(result) {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const newStatus = destination.droppableId

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t._id === draggableId ? { ...t, status: newStatus } : t))
    )

    try {
      await api.patch(`/api/tasks/${draggableId}`, { status: newStatus })
    } catch {
      // Revert on failure
      fetchTasks()
      alert('Failed to update task status.')
    }
  }

  function handleTaskUpdated(updatedTask) {
    setTasks((prev) => prev.map((t) => (t._id === updatedTask._id ? updatedTask : t)))
  }

  function handleAddColumn() {
    const name = newColName.trim()
    if (!name) return
    // Convert display name to a safe id: lowercase, spaces → underscores
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
    if (columns.includes(id)) {
      setNewColName('')
      setAddingColumn(false)
      return
    }
    // Register the label so COLUMN_LABELS works in KanbanColumn
    COLUMN_LABELS[id] = name
    setColumns((prev) => [...prev, id])
    setNewColName('')
    setAddingColumn(false)
  }

  const grouped = groupByStatus(tasks, columns)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        <span className="material-symbols-outlined text-4xl animate-spin mr-3">progress_activity</span>
        <span className="text-lg font-semibold">Loading tasks...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
        <span className="material-symbols-outlined text-5xl text-red-400">error</span>
        <p className="text-sm font-semibold text-red-400">{error}</p>
        <button
          onClick={fetchTasks}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-8 h-full min-w-max pb-4">
          {columns.map((colId) => (
            <KanbanColumn
              key={colId}
              columnId={colId}
              customLabel={COLUMN_LABELS[colId]}
              tasks={grouped[colId] || []}
              onEdit={onEdit}
              onDelete={handleDelete}
              onAddTask={(status) => onNewTask(status)}
              onViewDetail={(task) => setDetailTaskId(task._id)}
            />
          ))}

          {/* Add new column */}
          {addingColumn ? (
            <div className="w-[350px] shrink-0 border-2 border-primary/40 bg-primary/5 dark:bg-primary/10 rounded-2xl flex flex-col items-center justify-center gap-3 p-6">
              <span className="material-symbols-outlined text-3xl text-primary">view_column</span>
              <p className="text-sm font-bold text-slate-700 dark:text-white uppercase tracking-wide">Name your column</p>
              <input
                autoFocus
                type="text"
                value={newColName}
                onChange={(e) => setNewColName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddColumn()
                  if (e.key === 'Escape') { setAddingColumn(false); setNewColName('') }
                }}
                placeholder="e.g. In Review, Blocked…"
                className="w-full bg-white dark:bg-background-dark border border-slate-300 dark:border-surface-highlight rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-center"
              />
              <div className="flex gap-2 w-full">
                <button
                  onClick={() => { setAddingColumn(false); setNewColName('') }}
                  className="flex-1 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-surface-highlight text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-highlight transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddColumn}
                  disabled={!newColName.trim()}
                  className="flex-1 py-2 text-sm font-bold rounded-lg bg-primary hover:bg-blue-700 text-white transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50"
                >
                  Add Column
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setAddingColumn(true)}
              className="w-[350px] shrink-0 border-2 border-dashed border-slate-200 dark:border-surface-highlight/30 rounded-2xl flex flex-col items-center justify-center gap-3 p-6 text-slate-400 dark:text-slate-600 hover:text-primary dark:hover:text-primary hover:border-primary/50 transition-all cursor-pointer group"
            >
              <span className="material-symbols-outlined text-4xl group-hover:scale-110 transition-transform">add_circle</span>
              <p className="text-sm font-bold uppercase tracking-widest">Add New Column</p>
            </div>
          )}
        </div>
      </DragDropContext>

      <TaskDetailModal
        taskId={detailTaskId}
        isOpen={Boolean(detailTaskId)}
        onClose={() => setDetailTaskId(null)}
        onTaskUpdated={handleTaskUpdated}
      />
    </>
  )
}
