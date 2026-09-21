import React from 'react'
import BoardSelector from './BoardSelector'

export default function Header({ boards, selectedBoard, onSelectBoard, onCreateBoard, onEditBoard, onDeleteBoard, currentUserId, boardName, sprint, onNewTask, loadingBoards, boardMembers = [] }) {
  // Get up to 4 members to display
  const displayMembers = boardMembers.slice(0, 4)
  const remainingCount = Math.max(0, boardMembers.length - 4)

  return (
    <header className="h-16 flex items-center justify-between px-8 bg-[#161b26] border-b border-[#2d3544] z-40 shrink-0">
      <div className="flex items-center gap-5">
        {loadingBoards ? (
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] animate-spin text-slate-400">progress_activity</span>
            <span className="text-sm text-slate-400">Loading boards...</span>
          </div>
        ) : (
          <BoardSelector 
            boards={boards || []}
            selectedBoard={selectedBoard}
            onSelectBoard={onSelectBoard}
            onCreateBoard={onCreateBoard}
            onEditBoard={onEditBoard}
            onDeleteBoard={onDeleteBoard}
            currentUserId={currentUserId}
          />
        )}
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            {boardName || 'No Board Selected'}
          </h2>
          <span className="px-3 py-1 rounded-full bg-[#144bb8]/10 text-[#144bb8] text-[11px] font-bold uppercase tracking-wider border border-[#144bb8]/20">
            {sprint || 'Sprint 4'} Active
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Team avatars - dynamic based on board members */}
        {boardMembers.length > 0 && (
          <div className="flex items-center -space-x-3">
            {displayMembers.map((member) => (
              <img
                key={member.id}
                alt={member.name}
                title={member.name}
                className="h-8 w-8 rounded-full ring-2 ring-[#161b26] border border-[#2d3544]"
                src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=144bb8&color=fff`}
              />
            ))}
            {remainingCount > 0 && (
              <div 
                className="h-8 w-8 rounded-full bg-[#2d3544] flex items-center justify-center ring-2 ring-[#161b26] text-xs font-bold text-white"
                title={`+${remainingCount} more members`}
              >
                +{remainingCount}
              </div>
            )}
          </div>
        )}

        {/* New Task button */}
        <button
          onClick={() => onNewTask && onNewTask()}
          disabled={!selectedBoard}
          className="bg-[#144bb8] hover:bg-[#0f3a91] text-white text-sm font-bold py-2 px-5 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-[#144bb8]/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>New Task</span>
        </button>
      </div>
    </header>
  )
}
