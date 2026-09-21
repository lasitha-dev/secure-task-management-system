import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildAppUrl } from '@taskmaster/shared-ui/appLinks';
import {
  AppControlBar,
  AppPageHeader,
  AppSearchField,
  AppSectionCard,
  AppSegmentedTabs,
  AppSidebarBody,
  AppSidebarBrand,
  AppSidebarProfile,
  AppSidebarSectionLabel,
  AppSidebarShell,
  AppStatCard,
} from '@taskmaster/shared-ui/components';
import { useAuth } from '../context/AuthContext';
import API from '../api/axiosConfig';

const avatarColors = [
  'bg-indigo-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-violet-500',
  'bg-pink-500',
  'bg-teal-500',
];

function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = (name.codePointAt(i) || 0) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const settingsUrl = buildAppUrl('user', '/profile', { includeToken: false });

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('User');
  const [password, setPassword] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/');
      setUsers(data.data);
    } catch (err) {
      console.error('Failed to load users', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setError('');
    setModalLoading(true);
    try {
      await API.post('/register', { name, email, password, role });
      setShowAddModal(false);
      setName('');
      setEmail('');
      setPassword('');
      setRole('User');
      fetchUsers();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.msg ||
          'Failed to add user'
      );
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!globalThis.confirm('Are you sure you want to delete this user?')) return;
    try {
      await API.delete(`/${id}`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const openModal = () => {
    setError('');
    setName('');
    setEmail('');
    setPassword('');
    setRole('User');
    setShowPassword(false);
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
  };

  // Derived data
  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === 'Admin').length;
  const regularCount = totalUsers - adminCount;

  const filters = ['All', 'Active', 'Inactive', 'Admin'];
  const filteredUsers = users
    .filter((u) => {
      if (activeFilter === 'Admin') return u.role === 'Admin';
      if (activeFilter === 'Active') return true;
      if (activeFilter === 'Inactive') return false;
      return true;
    })
    .filter((u) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
      );
    });

  function renderRoleBadge(role) {
    if (role === 'Admin') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 px-2.5 py-0.5 text-xs font-medium text-purple-400 border border-purple-500/20">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-purple-500" />
          <span>Admin</span>
        </span>
      );
    }

    if (role === 'Manager') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400 border border-blue-500/20">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-blue-500" />
          <span>Manager</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400 border border-green-500/20">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-green-500" />
        <span>User</span>
      </span>
    );
  }

  let userRows;
  if (loading) {
    userRows = (
      <tr>
        <td colSpan={5} className="text-center py-12 text-slate-400">
          Loading users...
        </td>
      </tr>
    );
  } else if (filteredUsers.length === 0) {
    userRows = (
      <tr>
        <td colSpan={5} className="text-center py-12 text-slate-400">
          No users found
        </td>
      </tr>
    );
  } else {
    userRows = filteredUsers.map((u) => (
      <tr
        key={u._id}
        className="hover:bg-[#161b26]/50 transition-colors group"
      >
        <td className="px-6 py-4 whitespace-nowrap">
          <span className="text-sm text-slate-400 font-mono">
            {u._id?.slice(-8) || '---'}
          </span>
        </td>

        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div
              className={`h-10 w-10 flex-shrink-0 rounded-full ${getAvatarColor(u.name)} flex items-center justify-center text-white font-bold text-sm`}
            >
              {getInitials(u.name)}
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-white">{u.name}</div>
              <div className="text-sm text-slate-400">{u.email}</div>
            </div>
          </div>
        </td>

        <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
          {renderRoleBadge(u.role)}
        </td>

        <td className="px-6 py-4 whitespace-nowrap">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-emerald-500" />
            <span>Active</span>
          </span>
        </td>

        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <button
            onClick={() => handleDeleteUser(u._id)}
            className="text-slate-400 hover:text-[#144bb8] transition-colors inline-flex items-center gap-1"
          >
            <span className="hidden sm:inline text-xs uppercase font-semibold">View Activity</span>
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </button>
        </td>
      </tr>
    ));
  }

  return (
    <div className="min-h-screen bg-[#111621]">
      {/* Sidebar */}
      <AppSidebarShell
        className="hidden lg:flex fixed top-0 left-0 bottom-0 z-50"
        footer={
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1c212c] border border-[#2d3544] hover:border-slate-500 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-all"
          >
            <span className="material-symbols-outlined text-lg">logout</span>
            <span>Logout</span>
          </button>
        }
      >
        <AppSidebarBrand />
        <AppSidebarBody>
          <AppSidebarProfile
            name={user?.name || 'Admin User'}
            subtitle={user?.role || 'Admin'}
            avatarName={user?.name || 'Admin'}
          />

          <AppSidebarSectionLabel>Administration</AppSidebarSectionLabel>
          <nav className="flex flex-col gap-1">
            <a
              href="#"
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#144bb8]/10 text-[#144bb8] transition-colors text-sm font-medium"
            >
              <span className="material-symbols-outlined text-[20px]">group</span>
              <span>User Monitoring</span>
            </a>
            <a
              href={settingsUrl}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-[#1c212c] hover:text-white transition-colors text-sm font-medium"
            >
              <span className="material-symbols-outlined text-[20px]">settings</span>
              <span>Settings</span>
            </a>
          </nav>
        </AppSidebarBody>
      </AppSidebarShell>

      {/* Main Content */}
      <div className="lg:ml-[256px] flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="h-16 flex lg:hidden items-center justify-between px-4 bg-[#161b26] border-b border-[#2d3544]">
          <div className="flex items-center gap-3">
            <button className="text-slate-400 hover:text-white">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h1 className="text-white font-bold">TaskMaster</h1>
          </div>
          <div className="size-8 rounded-full bg-slate-700"></div>
        </header>

        <div className="flex-1 bg-[#111621] p-4 md:p-8">
          <div className="max-w-7xl mx-auto flex flex-col gap-8">
          {/* Page Header */}
          <AppPageHeader
            title="User Monitoring"
            subtitle="Manage access, roles, and track activity across the microservices ecosystem."
            actions={(
              <button
                onClick={openModal}
                className="bg-[#144bb8] hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-lg shadow-[#144bb8]/25"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                <span>Add New User</span>
              </button>
            )}
          />

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AppStatCard label="Total Users" value={totalUsers.toLocaleString()} meta="+12% this month" icon="group" tone="accent" />
            <AppStatCard label="Active Now" value={adminCount} meta="Users online" icon="wifi" tone="success" />
            <AppStatCard label="Pending Approvals" value={regularCount} meta="Needs attention" icon="pending" tone="warning" />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <AppSectionCard className="overflow-hidden">
            <div className="border-b border-[#2d3544] p-4">
              <AppControlBar>
                <AppSearchField
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email, or ID..."
                  ariaLabel="Search users"
                />
                <AppSegmentedTabs
                  items={filters}
                  value={activeFilter}
                  onChange={setActiveFilter}
                  fullWidth
                  className="md:w-auto"
                />
              </AppControlBar>
            </div>

          {/* Table */}
            <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#2d3544] bg-[#161b26]">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider w-32">
                    User ID
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">
                    Role
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d3544]">
                {userRows}
              </tbody>
            </table>
            </div>

            {/* Pagination */}
            <div className="bg-[#1c212c] px-4 py-3 flex items-center justify-between border-t border-[#2d3544] sm:px-6">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-400">
                    Showing <span className="font-medium text-white">1</span> to{' '}
                    <span className="font-medium text-white">
                      {Math.min(filteredUsers.length, 5)}
                    </span>{' '}
                    of <span className="font-medium text-white">{filteredUsers.length}</span> results
                  </p>
                </div>
                <div>
                  <nav aria-label="Pagination" className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-[#2d3544] bg-[#161b26] text-sm font-medium text-slate-400 hover:bg-[#1c212c] transition-colors">
                      <span className="sr-only">Previous</span>
                      <span className="material-symbols-outlined text-lg">chevron_left</span>
                    </button>
                    <button aria-current="page" className="relative z-10 inline-flex items-center px-4 py-2 border border-[#144bb8] bg-[#144bb8]/10 text-sm font-medium text-[#144bb8]">
                      1
                    </button>
                    <button className="relative inline-flex items-center px-4 py-2 border border-[#2d3544] bg-[#161b26] text-sm font-medium text-slate-400 hover:bg-[#1c212c] transition-colors">
                      2
                    </button>
                    <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-[#2d3544] bg-[#161b26] text-sm font-medium text-slate-400 hover:bg-[#1c212c] transition-colors">
                      <span className="sr-only">Next</span>
                      <span className="material-symbols-outlined text-lg">chevron_right</span>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </AppSectionCard>
          </div>
        </div>
      </div>

      {/* Add New User Modal */}
      {showAddModal && (
        <button
          type="button"
          aria-label="Close add user modal"
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm"
          onClick={closeModal}
        />
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-user-dialog-title"
            className="bg-[#1c212c] w-full max-w-md rounded-xl border border-[#2d3544] shadow-2xl overflow-hidden pointer-events-auto"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#2d3544] flex items-center justify-between">
              <h3 id="add-user-dialog-title" className="text-lg font-bold text-white">Add New User</h3>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Form */}
            <form id="add-user-form" onSubmit={handleAddUser} className="p-6 space-y-4" autoComplete="off">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Full Name */}
              <div>
                <label htmlFor="add-user-name" className="block text-sm font-medium text-slate-300 mb-1.5">
                  Full Name
                </label>
                <input
                  id="add-user-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="block w-full px-3 py-2 bg-[#161b26] border border-[#2d3544] rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#144bb8]/50 focus:border-[#144bb8] sm:text-sm transition-all"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="add-user-email" className="block text-sm font-medium text-slate-300 mb-1.5">
                  Email Address
                </label>
                <input
                  id="add-user-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  required
                  autoComplete="off"
                  className="block w-full px-3 py-2 bg-[#161b26] border border-[#2d3544] rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#144bb8]/50 focus:border-[#144bb8] sm:text-sm transition-all"
                />
              </div>

              {/* Role */}
              <div>
                <label htmlFor="add-user-role" className="block text-sm font-medium text-slate-300 mb-1.5">
                  Role
                </label>
                <select
                  id="add-user-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="block w-full px-3 py-2 bg-[#161b26] border border-[#2d3544] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#144bb8]/50 focus:border-[#144bb8] sm:text-sm transition-all"
                >
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="add-user-password" className="block text-sm font-medium text-slate-300 mb-1.5">
                  Initial Password
                </label>
                <div className="relative">
                  <input
                    id="add-user-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="block w-full px-3 py-2 bg-[#161b26] border border-[#2d3544] rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#144bb8]/50 focus:border-[#144bb8] sm:text-sm transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>
            </form>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-[#161b26] border-t border-[#2d3544] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="add-user-form"
                disabled={modalLoading}
                className="bg-[#144bb8] hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-[#144bb8]/25 disabled:opacity-50"
              >
                {modalLoading ? 'Adding...' : 'Add User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
