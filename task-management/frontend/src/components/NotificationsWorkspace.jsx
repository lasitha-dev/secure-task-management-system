import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import {
  AppControlBar,
  AppEmptyState,
  AppPageHeader,
  AppSearchField,
  AppSectionCard,
  AppSegmentedTabs,
} from '@taskmaster/shared-ui/components'
import api from '../api/axios'

const TYPE_META = {
  task_assigned: { icon: 'assignment_ind', iconClass: 'from-[#144bb8] to-indigo-500', label: 'Task Assigned', group: 'task' },
  task_updated: { icon: 'update', iconClass: 'from-[#144bb8] to-indigo-500', label: 'Task Updated', group: 'task' },
  deadline_reminder: { icon: 'alarm', iconClass: 'from-amber-500 to-red-500', label: 'Deadline', group: 'task' },
  comment_added: { icon: 'chat', iconClass: 'from-violet-500 to-pink-500', label: 'Comment', group: 'comment' },
  team_update: { icon: 'group_add', iconClass: 'from-emerald-500 to-emerald-700', label: 'Team Update', group: 'team' },
  system_alert: { icon: 'dns', iconClass: 'from-cyan-500 to-emerald-500', label: 'System Alert', group: 'system' },
}

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'read', label: 'Read' },
]

const EMPTY_PREFERENCES = {
  emailEnabled: true,
  inAppEnabled: true,
  preferences: {},
}

function normalizePreferences(payload) {
  if (!payload) {
    return EMPTY_PREFERENCES
  }

  const rawPreferences = payload.preferences || {}
  const entries = rawPreferences instanceof Map ? Array.from(rawPreferences.entries()) : Object.entries(rawPreferences)

  return {
    emailEnabled: payload.emailEnabled ?? true,
    inAppEnabled: payload.inAppEnabled ?? true,
    preferences: Object.fromEntries(entries),
  }
}

function timeAgo(dateStr) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  const mins = Math.floor(seconds / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function LoadingState() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((item) => (
        <div key={item} className="flex gap-4 rounded-2xl border border-[#2d3544] bg-[#1c212c] p-5">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-[#202634]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/5 animate-pulse rounded bg-[#202634]" />
            <div className="h-3 w-11/12 animate-pulse rounded bg-[#202634]" />
            <div className="h-3 w-1/3 animate-pulse rounded bg-[#202634]" />
          </div>
        </div>
      ))}
    </div>
  )
}

function NotificationRow({ notification, onMarkRead, onDelete }) {
  const meta = TYPE_META[notification.type] || {
    icon: 'info',
    iconClass: 'from-cyan-500 to-emerald-500',
    label: 'Notification',
  }

  return (
    <div className={`group relative flex gap-4 rounded-2xl border bg-[#1c212c] p-5 shadow-sm transition-all ${notification.isRead ? 'border-[#2d3544] hover:border-[#3b4657] hover:bg-[#202634]' : 'border-l-[3px] border-l-[#144bb8] border-r-[#2d3544] border-t-[#2d3544] border-b-[#2d3544] hover:border-r-[#3b4657] hover:border-t-[#3b4657] hover:border-b-[#3b4657] hover:bg-[#202634]'}`}>
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${meta.iconClass}`}>
        <span className="material-symbols-outlined text-xl text-white">{meta.icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-start justify-between gap-3">
          <div className={`text-sm leading-6 text-white ${notification.isRead ? 'font-medium' : 'font-semibold'}`}>
            {notification.title}
          </div>
        </div>
        <div className="text-sm leading-6 text-slate-400">{notification.message}</div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
            <span className="material-symbols-outlined text-sm">schedule</span>
            {timeAgo(notification.createdAt)}
          </span>
          <span className={`inline-flex rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${notification.priority === 'critical' ? 'bg-red-500/15 text-red-400' : notification.priority === 'high' ? 'bg-amber-500/15 text-amber-400' : notification.priority === 'low' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-blue-500/15 text-blue-400'}`}>
            {notification.priority}
          </span>
          <span className="inline-flex rounded-md bg-white/5 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            {meta.label}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-start gap-2 opacity-100 md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
        {!notification.isRead ? (
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-white/5 hover:text-white"
            onClick={() => onMarkRead(notification._id)}
            title="Mark as read"
          >
            <span className="material-symbols-outlined text-[18px]">done</span>
          </button>
        ) : null}
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-500/15 hover:text-red-400"
          onClick={() => onDelete(notification._id)}
          title="Delete"
        >
          <span className="material-symbols-outlined text-[18px]">delete</span>
        </button>
      </div>
    </div>
  )
}

function PreferenceToggle({ label, hint, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#2d3544] pb-4 last:border-b-0 last:pb-0">
      <div>
        <div className="text-sm font-medium text-white">{label}</div>
        <div className="mt-1 text-xs text-slate-500">{hint}</div>
      </div>
      <button
        type="button"
        aria-pressed={checked}
        onClick={onChange}
        className={`relative h-6 w-11 rounded-full border transition-colors ${checked ? 'border-[#144bb8] bg-[#144bb8]' : 'border-[#2d3544] bg-[#1c212c]'}`}
      >
        <span className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full transition-all ${checked ? 'left-6 bg-white' : 'left-1 bg-slate-400'}`} />
      </button>
    </div>
  )
}

function PreferencesPanel({ isOpen, preferences, saving, onClose, onSave, onToggleGlobal }) {
  return (
    <>
      {isOpen ? <button type="button" className="fixed inset-0 z-[90] bg-black/50" onClick={onClose} aria-label="Close preferences" /> : null}
      <aside className={`fixed top-0 right-0 z-[100] flex h-screen w-full max-w-md flex-col border-l border-[#2d3544] bg-[#161b26] transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-[#2d3544] px-6 py-5">
          <h2 className="text-lg font-semibold text-white">Notification Preferences</h2>
          <button type="button" className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/5 hover:text-white" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          <section>
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Global Settings</div>
            <div className="space-y-4">
              <PreferenceToggle
                label="Email Notifications"
                hint="Receive alerts via email"
                checked={Boolean(preferences.emailEnabled)}
                onChange={() => onToggleGlobal('emailEnabled')}
              />
            </div>
          </section>
        </div>
        <div className="flex justify-end gap-3 border-t border-[#2d3544] px-6 py-4">
          <button type="button" className="tm-button-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="tm-button-primary" onClick={onSave} disabled={saving}>
            <span className="material-symbols-outlined text-[18px]">save</span>
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </aside>
    </>
  )
}

export default function NotificationsWorkspace({ currentUser, onCountRefresh }) {
  const [notifications, setNotifications] = useState([])
  const [activeStatus, setActiveStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [prefsOpen, setPrefsOpen] = useState(false)
  const [preferences, setPreferences] = useState(EMPTY_PREFERENCES)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingPrefs, setSavingPrefs] = useState(false)

  const unreadCount = useMemo(() => notifications.filter((item) => !item.isRead).length, [notifications])

  const filteredNotifications = useMemo(
    () =>
      notifications.filter((notification) => {
        const meta = TYPE_META[notification.type]
        const searchValue = searchQuery.trim().toLowerCase()
        const matchesStatus =
          activeStatus === 'all' ||
          (activeStatus === 'unread' && !notification.isRead) ||
          (activeStatus === 'read' && notification.isRead)

        if (!searchValue) {
          return matchesStatus
        }

        const matchesSearch = [notification.title, notification.message, meta?.label, notification.priority]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(searchValue))

        return matchesStatus && matchesSearch
      }),
    [activeStatus, notifications, searchQuery]
  )

  useEffect(() => {
    let cancelled = false

    async function loadInitialData() {
      setLoading(true)
      setError('')

      if (!currentUser?.id) {
        setNotifications([])
        setPreferences(EMPTY_PREFERENCES)
        setError('You need to sign in before opening notifications.')
        setLoading(false)
        return
      }

      try {
        const [notificationResponse, preferencesResponse] = await Promise.all([
          api.get('/api/notifications', { params: { recipientId: currentUser.id, limit: 50 } }),
          api.get(`/api/notifications/preferences/${currentUser.id}`),
        ])

        if (cancelled) {
          return
        }

        setNotifications(notificationResponse.data?.data?.notifications || [])
        setPreferences(normalizePreferences(preferencesResponse.data))
      } catch {
        if (!cancelled) {
          setError('Could not reach the notifications API. Make sure the notifications service and gateway are running.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadInitialData()

    return () => {
      cancelled = true
    }
  }, [currentUser?.id])

  async function handleMarkRead(id) {
    try {
      await api.patch(`/api/notifications/${id}/read`)
      setNotifications((current) => current.map((item) => (item._id === id ? { ...item, isRead: true } : item)))
      toast.success('Notification marked as read')
      onCountRefresh?.()
    } catch {
      toast.error('Failed to mark as read')
    }
  }

  async function handleMarkAllRead() {
    try {
      if (!currentUser?.id) {
        return
      }

      await api.patch('/api/notifications/read-all', { recipientId: currentUser.id })
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })))
      toast.success('All notifications marked as read')
      onCountRefresh?.()
    } catch {
      toast.error('Failed to mark all as read')
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/api/notifications/${id}`)
      setNotifications((current) => current.filter((item) => item._id !== id))
      toast.success('Notification deleted')
      onCountRefresh?.()
    } catch {
      toast.error('Failed to delete notification')
    }
  }

  function toggleGlobalPreference(key) {
    setPreferences((current) => ({
      ...current,
      [key]: !current[key],
    }))
  }

  async function handleSavePreferences() {
    setSavingPrefs(true)
    try {
      if (!currentUser?.id) {
        throw new Error('Authentication required')
      }

      const response = await api.put(`/api/notifications/preferences/${currentUser.id}`, {
        emailEnabled: preferences.emailEnabled,
        inAppEnabled: preferences.inAppEnabled,
        preferences: preferences.preferences,
      })

      setPreferences(normalizePreferences(response.data))
      setPrefsOpen(false)
      toast.success('Preferences saved')
    } catch {
      toast.error('Failed to save preferences')
    } finally {
      setSavingPrefs(false)
    }
  }

  return (
    <>
      <main className="min-h-screen bg-[#111621]" style={{ marginLeft: 256 }}>
        <div className="flex flex-col gap-8 p-8">
          <AppPageHeader
            title="Notifications Center"
            subtitle="View and manage recent alerts across your microservices architecture."
            badge={<span className="tm-pill tm-pill-accent">{unreadCount}</span>}
            actions={(
              <>
                <button type="button" className="tm-button-secondary tm-button-sm" onClick={() => setPrefsOpen(true)}>
                  <span className="material-symbols-outlined text-[18px]">tune</span>
                  <span>Preferences</span>
                </button>
                <button type="button" className="tm-button-primary tm-button-sm" onClick={handleMarkAllRead}>
                  <span className="material-symbols-outlined text-[18px]">done_all</span>
                  <span>Mark All Read</span>
                </button>
              </>
            )}
          />

          <AppSectionCard className="p-5">
            <AppControlBar className="mb-4">
              <AppSearchField
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search notifications, priorities, or categories..."
                ariaLabel="Search notifications"
                className="min-w-[280px] flex-1"
              />
            </AppControlBar>

            <div className="mb-5">
              <AppSegmentedTabs items={STATUS_FILTERS} value={activeStatus} onChange={setActiveStatus} />
            </div>

            {error ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
            ) : null}

            {loading ? <LoadingState /> : null}

            {!loading && !error && filteredNotifications.length === 0 ? (
              <AppEmptyState
                icon="notifications"
                title="No notifications"
                description="You're all caught up. Check back later for new updates."
              />
            ) : null}

            {!loading && !error && filteredNotifications.length > 0 ? (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => (
                  <NotificationRow
                    key={notification._id}
                    notification={notification}
                    onMarkRead={handleMarkRead}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            ) : null}
          </AppSectionCard>
        </div>
      </main>

      <PreferencesPanel
        isOpen={prefsOpen}
        preferences={preferences}
        saving={savingPrefs}
        onClose={() => setPrefsOpen(false)}
        onSave={handleSavePreferences}
        onToggleGlobal={toggleGlobalPreference}
      />
    </>
  )
}