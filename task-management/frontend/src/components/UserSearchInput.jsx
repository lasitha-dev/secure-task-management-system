import React, { useState, useEffect, useRef, useCallback } from 'react'
import api from '../api/axios'

/**
 * UserSearchInput
 * Debounced user search/picker that calls GET /api/tasks/users/search?q=
 * Props:
 *   selected  — array of user objects already selected (for multi-select mode)
 *   onChange  — called with updated array when selection changes (multi-select mode)
 *   onSelect  — called with single user when selected (single-select mode)
 *   max       — max number of assignees (default: unlimited)
 *   label     — field label text (optional)
 *   placeholder — input placeholder text
 *   disabled  — disable the input
 *   filterUsers — array of user IDs to filter results (only show these users)
 */
export default function UserSearchInput({ selected = [], onChange, onSelect, max = 20, label, placeholder = 'Search users...', disabled = false, filterUsers = null }) {
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState([])
  const [loading, setLoading]   = useState(false)
  const [open, setOpen]         = useState(false)
  const containerRef            = useRef(null)
  const debounceRef             = useRef(null)

  const fetchUsers = useCallback(async (q) => {
    setLoading(true)
    try {
      console.log('[UserSearch] Fetching users, query:', q)
      const { data } = await api.get('/api/tasks/users/search', { params: { q, limit: 8 } })
      console.log('[UserSearch] Users response:', data)
      let users = data.users || []
      console.log('[UserSearch] Users array:', users)
      
      // Filter to only show specific users if filterUsers is provided
      if (filterUsers && Array.isArray(filterUsers) && filterUsers.length > 0) {
        users = users.filter(user => filterUsers.includes(user.id))
        console.log('[UserSearch] Filtered users:', users)
      }
      
      setResults(users)
    } catch (err) {
      console.error('[UserSearch] Failed to fetch users:', err)
      console.error('[UserSearch] Error response:', err.response?.data)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [filterUsers])

  // Preload all users on mount so the dropdown shows immediately on focus
  useEffect(() => {
    fetchUsers('')
  }, [fetchUsers])

  // Close dropdown on outside click
  useEffect(() => {
    function onOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  function handleInput(e) {
    const val = e.target.value
    setQuery(val)
    setOpen(true)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchUsers(val), 300)
  }

  function handleFocus() {
    setOpen(true)
    if (results.length === 0) fetchUsers(query)
  }

  function toggleUser(user) {
    // Single-select mode (onSelect callback)
    if (onSelect) {
      onSelect(user)
      setQuery('')
      setOpen(false)
      return
    }
    
    // Multi-select mode (onChange callback)
    if (onChange) {
      const already = selected.some((u) => u.id === user.id)
      if (already) {
        onChange(selected.filter((u) => u.id !== user.id))
      } else if (selected.length < max) {
        onChange([...selected, user])
      }
    }
  }

  function removeUser(userId) {
    onChange(selected.filter((u) => u.id !== userId))
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Only show label if provided */}
      {label && (
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
        </label>
      )}

      {/* Selected pills - only in multi-select mode */}
      {onChange && selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map((u) => (
            <span
              key={u.id}
              className="flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full border border-primary/20"
            >
              <img src={u.avatar} alt={u.name} className="h-4 w-4 rounded-full" />
              {u.name}
              <button
                type="button"
                onClick={() => removeUser(u.id)}
                className="ml-0.5 hover:text-red-500 transition-colors"
              >
                <span className="material-symbols-outlined text-[12px]">close</span>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-slate-400">
          search
        </span>
        <input
          type="text"
          value={query}
          onChange={handleInput}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full bg-white dark:bg-background-dark border border-slate-200 dark:border-surface-highlight rounded-lg pl-9 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {loading && (
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[16px] text-slate-400 animate-spin">
            progress_activity
          </span>
        )}
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-white dark:bg-surface-dark border border-slate-200 dark:border-surface-highlight rounded-xl shadow-xl overflow-hidden max-h-52 overflow-y-auto">
          {results.map((user) => {
            const isSelected = selected.some((u) => u.id === user.id)
            return (
              <li
                key={user.id}
                onMouseDown={(e) => { e.preventDefault(); toggleUser(user) }}
                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors
                  ${isSelected
                    ? 'bg-primary/10 dark:bg-primary/20'
                    : 'hover:bg-slate-50 dark:hover:bg-background-dark'
                  }`}
              >
                <img src={user.avatar} alt={user.name} className="h-7 w-7 rounded-full flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                </div>
                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded 
                  ${user.role === 'admin' ? 'bg-red-100 dark:bg-red-950/40 text-red-500' :
                    user.role === 'developer' ? 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-500' :
                    user.role === 'tester'    ? 'bg-green-100 dark:bg-green-950/40 text-green-500' :
                    user.role === 'designer'  ? 'bg-purple-100 dark:bg-purple-950/40 text-purple-500' :
                    'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                  {user.role}
                </span>
                {isSelected && (
                  <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
