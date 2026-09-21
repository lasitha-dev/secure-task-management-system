import React from 'react'
import { Droppable, Draggable } from '@hello-pangea/dnd'
import TaskCard from './TaskCard'

const COLUMN_META = {
  todo: {
    dot: 'bg-slate-400',
    badge: 'bg-slate-200 dark:bg-surface-highlight text-slate-600 dark:text-slate-400',
  },
  in_progress: {
    dot: 'bg-primary animate-pulse',
    badge: 'bg-primary/10 text-primary',
  },
  done: {
    dot: 'bg-green-500',
    badge: 'bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400',
  },
}

const DEFAULT_META = {
  dot: 'bg-slate-400',
  badge: 'bg-slate-200 dark:bg-surface-highlight text-slate-600 dark:text-slate-400',
}

const COLUMN_LABELS = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
}

export default function KanbanColumn({ columnId, customLabel, tasks, onEdit, onDelete, onAddTask, onViewDetail }) {
  const meta  = COLUMN_META[columnId] || DEFAULT_META
  const label = customLabel || COLUMN_LABELS[columnId] || columnId.replace(/_/g, ' ')
  const isDone = columnId === 'done'

  return (
    <section className="flex flex-col w-[350px] shrink-0 bg-slate-100/50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-surface-highlight/40">
      {/* Column header */}
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
          <h3 className="font-extrabold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-widest">
            {label}
          </h3>
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${meta.badge}`}>
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask?.(columnId)}
          title={`Add task to ${label}`}
          className="text-slate-400 hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">add_circle</span>
        </button>
      </div>

      {/* Droppable area */}
      <Droppable droppableId={columnId}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto px-4 pb-4 space-y-4 custom-scrollbar min-h-[120px] transition-colors ${
              snapshot.isDraggingOver ? 'bg-primary/5 rounded-xl' : ''
            }`}
          >
            {tasks.map((task, index) => (
              <Draggable key={task._id} draggableId={task._id} index={index}>
                {(dragProvided) => (
                  <TaskCard
                    task={task}
                    isDone={isDone}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onViewDetail={onViewDetail}
                    provided={dragProvided}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400 dark:text-slate-600">
                <span className="material-symbols-outlined text-3xl mb-2">inbox</span>
                <p className="text-xs font-semibold">No tasks</p>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </section>
  )
}
