import React, { useState } from 'react'

export default function BoardSelector({ boards, selectedBoard, onSelectBoard, onCreateBoard, onEditBoard, onDeleteBoard, currentUserId }) {
  const [isOpen, setIsOpen] = useState(false)
  const [hoveredBoard, setHoveredBoard] = useState(null)

  const currentBoardName = selectedBoard 
    ? boards.find(b => b._id === selectedBoard)?.name || 'Select Board'
    : 'Select Board'

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-[#111621] border border-[#2d3544] rounded-lg hover:border-[#144bb8] transition-colors"
      >
        <span className="material-symbols-outlined text-[20px] text-slate-300">
          dashboard
        </span>
        <span className="font-semibold text-white max-w-[200px] truncate">
          {currentBoardName}
        </span>
        <span className={`material-symbols-outlined text-[18px] text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-72 bg-[#1c212c] border border-[#2d3544] rounded-xl shadow-xl z-50 py-2 max-h-[400px] overflow-y-auto custom-scrollbar">
            {/* Create new board button */}
            <button
              onClick={() => {
                setIsOpen(false)
                onCreateBoard()
              }}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#202634] transition-colors text-left border-b border-[#2d3544] mb-2"
            >
              <span className="material-symbols-outlined text-[20px] text-[#144bb8]">
                add_circle
              </span>
              <span className="font-semibold text-[#144bb8]">
                Create New Board
              </span>
            </button>

            {/* Board list */}
            {boards.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-400 text-sm">
                No boards yet. Create your first board!
              </div>
            ) : (
              <div className="space-y-1">
                {boards.map((board) => {
                  const isCreator = board.createdBy?.id === currentUserId
                  return (
                    <div
                      key={board._id}
                      className="relative group"
                      onMouseEnter={() => setHoveredBoard(board._id)}
                      onMouseLeave={() => setHoveredBoard(null)}
                    >
                      <button
                        onClick={() => {
                          onSelectBoard(board._id)
                          setIsOpen(false)
                        }}
                        className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-[#202634] transition-colors text-left ${
                          selectedBoard === board._id ? 'bg-[#144bb8]/10 border-l-4 border-[#144bb8]' : ''
                        }`}
                      >
                        <span className="material-symbols-outlined text-[20px] text-slate-300 mt-0.5">
                          {selectedBoard === board._id ? 'check_circle' : 'dashboard'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-white truncate">
                            {board.name}
                          </div>
                          {board.description && (
                            <div className="text-xs text-slate-400 mt-1 truncate">
                              {board.description}
                            </div>
                          )}
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                            {board.sprint && (
                              <>
                                <span className="material-symbols-outlined text-[14px]">flag</span>
                                <span>{board.sprint}</span>
                                <span className="text-slate-300 dark:text-slate-600">•</span>
                              </>
                            )}
                            <span className="material-symbols-outlined text-[14px]">group</span>
                            <span>{board.members?.length || 0} members</span>
                          </div>
                        </div>
                      </button>
                      
                      {/* Edit/Delete buttons for board creator */}
                      {isCreator && hoveredBoard === board._id && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-[#111621] rounded-lg shadow-lg border border-[#2d3544] p-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setIsOpen(false)
                              onEditBoard(board)
                            }}
                            className="p-1.5 hover:bg-[#202634] rounded transition-colors"
                            title="Edit board"
                          >
                            <span className="material-symbols-outlined text-[18px] text-blue-500">edit</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setIsOpen(false)
                              onDeleteBoard(board)
                            }}
                            className="p-1.5 hover:bg-[#202634] rounded transition-colors"
                            title="Delete board"
                          >
                            <span className="material-symbols-outlined text-[18px] text-red-500">delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
