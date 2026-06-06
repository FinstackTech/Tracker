import { useState } from 'react';
import { 
  Users, Search, UserPlus, Shield, CheckCircle2, AlertTriangle, Key, Trash2, X, AlertCircle, Edit, ShieldAlert, BadgeAlert, ToggleLeft, ToggleRight
} from 'lucide-react';

const TEAM_DEPARTMENTS = ["Engineering", "Product", "Sales", "HR", "Finance", "Operations", "Viewer"];

const ROLE_PERMISSIONS = {
  "Admin": {
    badgeColor: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-450 dark:border-rose-900/40",
    permissions: ["Full read/write on projects", "Delete anything", "Manage webhooks & integrations", "Add/delete users", "Change user roles", "View financial hub ledger"]
  },
  "Project Manager": {
    badgeColor: "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-955/30 dark:text-violet-400 dark:border-violet-900/40",
    permissions: ["Full read/write on projects", "Create epics, tasks & issues", "Update task board columns", "View document vault & download files"]
  },
  "Manager": {
    badgeColor: "bg-indigo-50 text-indigo-755 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/40",
    permissions: ["Create tasks & issues", "Edit own tasks", "Create epics", "View document vault"]
  },
  "HR": {
    badgeColor: "bg-amber-50 text-amber-705 border-amber-205 dark:bg-amber-955/30 dark:text-amber-400 dark:border-amber-900/40",
    permissions: ["Approve/Reject leaves", "View employee profiles", "View non-financial dashboard tracking"]
  },
  "Finance": {
    badgeColor: "bg-emerald-50 text-emerald-705 border-emerald-200 dark:bg-emerald-955/30 dark:text-emerald-400 dark:border-emerald-900/40",
    permissions: ["View financial hub", "Record purchase orders & invoices", "Log project expenses"]
  },
  "Employee": {
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-955/30 dark:text-blue-400 dark:border-blue-900/40",
    permissions: ["View tasks & issues", "Submit daily standup logs", "Edit assigned tasks status", "Request leave approvals"]
  },
  "Viewer": {
    badgeColor: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-800/45",
    permissions: ["Read-only view of dashboard", "Read-only view of tasks & issues", "Cannot edit any properties"]
  }
};

// Gradient mapping for user avatar background colors
const GRADIENTS = [
  "from-indigo-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-pink-500 to-rose-600",
  "from-amber-500 to-orange-600",
  "from-sky-500 to-blue-600",
  "from-violet-500 to-fuchsia-600"
];

const getGradientForName = (name) => {
  const sum = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return GRADIENTS[sum % GRADIENTS.length];
};

export default function UsersTab({
  activeUser,
  currentUser,
  userProfiles = [],
  setUserProfiles,
  fetchEmployees,
  showToast
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals & Drawer state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // Holds the user currently in the side drawer
  const [confirmDialog, setConfirmDialog] = useState(null); // { type, user, payload, title, message }

  // Add User form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('Employee');
  const [newTeam, setNewTeam] = useState('Engineering');
  const [newPassword, setNewPassword] = useState('user');

  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Head';

  // Get dynamic fields (status, team, lastLogin) with safe fallbacks
  const getExtendedProfiles = () => {
    return userProfiles.map((p, idx) => {
      // Normalise role representation (e.g. mapping "Admin" or "Head" to "Admin")
      let resolvedRole = p.role;
      if (resolvedRole === 'Admin' || resolvedRole === 'Head') resolvedRole = 'Admin';
      if (!ROLE_PERMISSIONS[resolvedRole]) resolvedRole = 'Employee';

      return {
        ...p,
        role: resolvedRole,
        status: p.status || 'Active',
        team: p.team || (p.role === 'HR' ? 'HR' : p.role === 'Finance' ? 'Finance' : 'Engineering'),
        lastLogin: p.lastLogin || `2026-06-03 1${idx % 9}:2${idx % 6}`,
        gradient: getGradientForName(p.name)
      };
    });
  };

  const extendedProfiles = getExtendedProfiles();

  // Filters
  const filteredUsers = extendedProfiles.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'All' || p.role === roleFilter;
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    if (userProfiles.some(u => u.name.toLowerCase() === newName.trim().toLowerCase())) {
      showToast("A user with this name already exists!", "error");
      return;
    }

    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          role: newRole,
          email: newEmail.trim(),
          password: newPassword.trim() || 'user',
          status: 'Active',
          team: newTeam,
          lastLogin: 'Never logged in'
        })
      });
      const res = await response.json();
      if (res.success) {
        await fetchEmployees();
        showToast(`User ${newName} successfully created`, "success");
        // Reset Form
        setNewName('');
        setNewEmail('');
        setNewRole('Employee');
        setNewTeam('Engineering');
        setNewPassword('user');
        setShowAddModal(false);
      } else {
        showToast(res.error || "Failed to create user", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Network error creating user", "error");
    }
  };

  const handleSaveDrawerUser = (e) => {
    e.preventDefault();
    if (!editingUser) return;

    // Check if role changed for warning
    const originalUser = extendedProfiles.find(u => u.name === editingUser.name);
    const roleChanged = originalUser && originalUser.role !== editingUser.role;
    const statusChanged = originalUser && originalUser.status !== editingUser.status;

    const performUpdate = async () => {
      try {
        const response = await fetch('/api/employees', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            _id: editingUser._id,
            name: editingUser.name,
            email: editingUser.email.trim(),
            role: editingUser.role,
            team: editingUser.team,
            status: editingUser.status
          })
        });
        const res = await response.json();
        if (res.success) {
          await fetchEmployees();
          showToast(`Profile changes saved for ${editingUser.name}`, "success");
          setEditingUser(null);
        } else {
          showToast(res.error || "Failed to save profile changes", "error");
        }
      } catch (err) {
        console.error(err);
        showToast("Network error saving profile changes", "error");
      }
    };

    if (roleChanged || (statusChanged && editingUser.status === 'Inactive')) {
      setConfirmDialog({
        type: 'role_or_status_change',
        title: roleChanged ? 'Confirm Security Role Escalation / Change' : 'Confirm User Deactivation',
        message: roleChanged 
          ? `Changing ${editingUser.name}'s role from "${originalUser.role}" to "${editingUser.role}" will immediately change their system privileges. Are you sure you want to apply these permission access adjustments?`
          : `Deactivating ${editingUser.name} will restrict their ability to authenticate into the PPM Workspace. Do you wish to proceed?`,
        action: performUpdate
      });
    } else {
      performUpdate();
    }
  };

  const handleToggleStatus = (user) => {
    const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    
    const performToggle = async () => {
      try {
        const response = await fetch('/api/employees', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            _id: user._id,
            name: user.name,
            status: newStatus
          })
        });
        const res = await response.json();
        if (res.success) {
          await fetchEmployees();
          showToast(`User ${user.name} is now ${newStatus}`, "success");
        } else {
          showToast(res.error || "Failed to toggle status", "error");
        }
      } catch (err) {
        console.error(err);
        showToast("Network error", "error");
      }
    };

    if (newStatus === 'Inactive') {
      setConfirmDialog({
        type: 'deactivate',
        title: 'Deactivate User Profile',
        message: `Are you sure you want to deactivate ${user.name}? They will lose access to all modules in the PPM Workspace.`,
        action: performToggle
      });
    } else {
      performToggle();
    }
  };

  const handleResetPassword = (user) => {
    const defaultPassword = user.role.toLowerCase() === 'admin' ? 'admin' : user.role.toLowerCase() === 'manager' ? 'manager' : 'user';
    
    setConfirmDialog({
      type: 'reset_pwd',
      title: 'Reset Account Password',
      message: `Are you sure you want to reset the password for ${user.name} to the system default "${defaultPassword}"?`,
      action: async () => {
        try {
          const response = await fetch('/api/employees', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              _id: user._id,
              name: user.name,
              password: defaultPassword
            })
          });
          const res = await response.json();
          if (res.success) {
            await fetchEmployees();
            showToast(`Password reset successful for ${user.name}`, "success");
          } else {
            showToast(res.error || "Failed to reset password", "error");
          }
        } catch (err) {
          console.error(err);
          showToast("Network error", "error");
        }
      }
    });
  };

  const handleDeleteUser = (user) => {
    if (user.name === activeUser) {
      showToast("You cannot delete the currently logged-in user!", "error");
      return;
    }

    setConfirmDialog({
      type: 'delete',
      title: 'Delete User Account Permanently',
      message: `WARNING: This action is irreversible. All access logs, metadata association, and authentication credentials for "${user.name}" will be purged. Do you want to continue?`,
      action: async () => {
        try {
          const response = await fetch(`/api/employees?id=${user._id}`, {
            method: 'DELETE'
          });
          const res = await response.json();
          if (res.success) {
            await fetchEmployees();
            showToast(`User ${user.name} permanently removed from registry`, "success");
            if (editingUser?.name === user.name) {
              setEditingUser(null);
            }
          } else {
            showToast(res.error || "Failed to delete user", "error");
          }
        } catch (err) {
          console.error(err);
          showToast("Network error", "error");
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      
      {/* KPI METRIC SUMMARY ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Registrations", value: extendedProfiles.length, color: "text-slate-800 dark:text-white" },
          { label: "Active Connections", value: extendedProfiles.filter(p => p.status === 'Active').length, color: "text-emerald-600 dark:text-emerald-455" },
          { label: "System Admins", value: extendedProfiles.filter(p => p.role === 'Admin').length, color: "text-rose-600 dark:text-rose-455" },
          { label: "Total Departments", value: TEAM_DEPARTMENTS.length, color: "text-indigo-600 dark:text-indigo-400" }
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-[0_2px_8px_rgba(99,102,241,0.02)] dark:bg-slate-900 dark:border-slate-800/80">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">{kpi.label}</span>
            <span className={`text-xl font-black mt-1 block ${kpi.color}`}>{kpi.value}</span>
          </div>
        ))}
      </div>

      {/* FILTER TOOLBAR */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-[0_2px_8px_rgba(99,102,241,0.02)] dark:bg-slate-900 dark:border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full md:max-w-xs shrink-0">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search full name, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-205 rounded-xl bg-slate-50/50 outline-none text-xs focus:border-indigo-500 focus:bg-white dark:border-slate-850 dark:bg-slate-950 dark:text-slate-300 font-semibold"
          />
        </div>

        {/* Filters Select */}
        <div className="flex flex-wrap items-center gap-3 w-full md:justify-end">
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border border-slate-205 bg-white text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 dark:border-slate-850 dark:bg-slate-950 dark:text-slate-300 cursor-pointer"
            >
              <option value="All">All Roles</option>
              {Object.keys(ROLE_PERMISSIONS).map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-205 bg-white text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 dark:border-slate-850 dark:bg-slate-950 dark:text-slate-300 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {isAdmin ? (
            <button
              onClick={() => setShowAddModal(true)}
              className="ml-auto md:ml-0 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
            >
              <UserPlus className="h-4 w-4" />
              Add User
            </button>
          ) : (
            <div className="text-[9px] font-extrabold uppercase text-amber-600 bg-amber-50 dark:bg-amber-955/20 border border-amber-100/50 dark:border-amber-950/20 px-3 py-2 rounded-xl flex items-center gap-1">
              <ShieldAlert className="h-3.5 w-3.5" />
              Creation locked
            </div>
          )}

        </div>
      </div>

      {/* USER DATATABLE CARD */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(99,102,241,0.02)] dark:bg-slate-900 dark:border-slate-800/80">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-850 bg-slate-50/70 dark:bg-slate-950/30 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                <th className="px-6 py-4">User Details</th>
                <th className="px-6 py-4">Role Badge</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Team/Dept</th>
                <th className="px-6 py-4">Last Activity</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {filteredUsers.map((user) => {
                const isMe = user.name === activeUser;
                const permissionsData = ROLE_PERMISSIONS[user.role] || ROLE_PERMISSIONS["Employee"];
                
                return (
                  <tr 
                    key={user.name} 
                    className="hover:bg-slate-50/40 dark:hover:bg-slate-950/15 transition-all group"
                  >
                    {/* User name & email */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-full bg-gradient-to-tr ${user.gradient} text-white flex items-center justify-center font-black uppercase text-xs shadow-sm`}>
                          {user.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <span className="truncate">{user.name}</span>
                            {isMe && (
                              <span className="text-[7.5px] bg-slate-100 dark:bg-slate-950 text-slate-500 px-1.5 py-0.2 rounded font-extrabold uppercase border dark:border-slate-800">Me</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{user.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role badge */}
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border tracking-wider ${permissionsData.badgeColor}`}>
                        {user.role}
                      </span>
                    </td>

                    {/* Status badge */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                        user.status === 'Active' 
                          ? 'text-emerald-600 dark:text-emerald-400' 
                          : 'text-slate-400 dark:text-slate-500'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          user.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                        }`} />
                        {user.status}
                      </span>
                    </td>

                    {/* Team */}
                    <td className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">
                      {user.team}
                    </td>

                    {/* Last login */}
                    <td className="px-6 py-4 font-mono text-[10px] text-slate-400">
                      {user.lastLogin}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* Edit Action */}
                        <button
                          onClick={() => setEditingUser(user)}
                          className="p-2 rounded-lg border border-slate-205 hover:bg-slate-100/60 dark:border-slate-800 dark:hover:bg-slate-900 text-slate-650 dark:text-slate-350 transition-all cursor-pointer"
                          title="Edit User Details / Role"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>

                        {/* Reset Password (Admin only) */}
                        {isAdmin && (
                          <button
                            onClick={() => handleResetPassword(user)}
                            className="p-2 rounded-lg border border-slate-205 hover:bg-slate-100/60 dark:border-slate-800 dark:hover:bg-slate-900 text-slate-650 dark:text-slate-350 transition-all cursor-pointer"
                            title="Reset Account Password"
                          >
                            <Key className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {/* Toggle Active Status (Admin only) */}
                        {isAdmin && (
                          <button
                            onClick={() => handleToggleStatus(user)}
                            disabled={isMe}
                            className={`p-2 rounded-lg border transition-all cursor-pointer ${
                              isMe 
                                ? 'opacity-35 pointer-events-none' 
                                : 'border-slate-205 hover:bg-slate-100/60 dark:border-slate-800 dark:hover:bg-slate-900 text-slate-650 dark:text-slate-350'
                            }`}
                            title={user.status === 'Active' ? 'Deactivate Account' : 'Activate Account'}
                          >
                            {user.status === 'Active' ? (
                              <ToggleRight className="h-3.5 w-3.5 text-indigo-500" />
                            ) : (
                              <ToggleLeft className="h-3.5 w-3.5 text-slate-400" />
                            )}
                          </button>
                        )}

                        {/* Delete Action (Admin only) */}
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteUser(user)}
                            disabled={isMe}
                            className={`p-2 rounded-lg border transition-all cursor-pointer ${
                              isMe 
                                ? 'opacity-35 pointer-events-none' 
                                : 'border-rose-100 hover:bg-rose-50 text-rose-500 dark:border-rose-950/40 dark:hover:bg-rose-955/15'
                            }`}
                            title="Remove Profile Permanently"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}

                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-slate-405 italic">
                    Zero user profiles found matching current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── ADD USER MODAL ─── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-indigo-500" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider dark:text-white">
                  Add User Profile
                </h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="text-slate-400 hover:text-slate-650 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddUserSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-350 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. john.doe@company.com"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-350 font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Workspace Role
                  </label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-955 dark:text-slate-300 cursor-pointer"
                  >
                    {Object.keys(ROLE_PERMISSIONS).map(roleName => (
                      <option key={roleName} value={roleName}>{roleName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Team/Department
                  </label>
                  <select
                    value={newTeam}
                    onChange={e => setNewTeam(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-955 dark:text-slate-300 cursor-pointer"
                  >
                    {TEAM_DEPARTMENTS.map(teamName => (
                      <option key={teamName} value={teamName}>{teamName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex justify-between">
                  <span>Initial Password</span>
                  <span className="text-[8px] text-slate-400 font-semibold normal-case">Default is "user"</span>
                </label>
                <input
                  type="text"
                  placeholder="Password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-350 font-mono font-semibold"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-5 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-850 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-md cursor-pointer"
                >
                  Register Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── EDIT USER SLIDING DRAWER ─── */}
      {editingUser && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop overlay */}
          <div 
            onClick={() => setEditingUser(null)}
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity animate-in fade-in duration-200" 
          />

          {/* Drawer body */}
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800/80 animate-in slide-in-from-right duration-250 z-10">
            
            {/* Drawer Header */}
            <div className="h-16 border-b border-slate-100 dark:border-slate-850 px-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-indigo-500" />
                <h3 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 tracking-wider">
                  Edit Profile Account
                </h3>
              </div>
              <button 
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Drawer Content */}
            <form onSubmit={handleSaveDrawerUser} className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              
              {/* Profile card summary */}
              <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-150/60 dark:bg-slate-950/20 dark:border-slate-850 flex items-center gap-3">
                <div className={`h-11 w-11 rounded-full bg-gradient-to-tr ${editingUser.gradient} text-white flex items-center justify-center font-black uppercase text-sm shadow-sm`}>
                  {editingUser.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 leading-snug">{editingUser.name}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{editingUser.email}</p>
                </div>
              </div>

              {/* Form Input fields */}
              <div className="space-y-4">
                
                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Full Name</label>
                  <input
                    type="text"
                    disabled
                    value={editingUser.name}
                    className="w-full rounded-xl border border-slate-205 bg-slate-105/50 px-3.5 py-2.5 text-xs font-semibold outline-none dark:border-slate-850 dark:bg-slate-950/40 dark:text-slate-450 opacity-70"
                  />
                  <span className="text-[8px] text-slate-400 font-semibold block mt-1">Names are unique account identifier keys and cannot be altered.</span>
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Email Address</label>
                  <input
                    type="email"
                    disabled={!isAdmin}
                    value={editingUser.email}
                    onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-205 bg-white px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-indigo-500 dark:border-slate-850 dark:bg-slate-950 dark:text-slate-300 disabled:opacity-60"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Access Role</label>
                    <select
                      disabled={!isAdmin}
                      value={editingUser.role}
                      onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                      className="w-full rounded-xl border border-slate-205 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 dark:border-slate-850 dark:bg-slate-950 dark:text-slate-300 cursor-pointer disabled:opacity-60"
                    >
                      {Object.keys(ROLE_PERMISSIONS).map(roleName => (
                        <option key={roleName} value={roleName}>{roleName}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Team/Dept</label>
                    <select
                      disabled={!isAdmin}
                      value={editingUser.team}
                      onChange={e => setEditingUser({ ...editingUser, team: e.target.value })}
                      className="w-full rounded-xl border border-slate-205 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 dark:border-slate-850 dark:bg-slate-950 dark:text-slate-300 cursor-pointer disabled:opacity-60"
                    >
                      {TEAM_DEPARTMENTS.map(teamName => (
                        <option key={teamName} value={teamName}>{teamName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1.5">Account Status</label>
                  <select
                    disabled={!isAdmin || editingUser.name === activeUser}
                    value={editingUser.status}
                    onChange={e => setEditingUser({ ...editingUser, status: e.target.value })}
                    className="w-full rounded-xl border border-slate-205 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 dark:border-slate-850 dark:bg-slate-950 dark:text-slate-300 cursor-pointer disabled:opacity-60"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

              </div>

              {/* Dynamic Permissions Breakdown */}
              <div className="pt-5 border-t border-slate-100 dark:border-slate-850 space-y-3">
                <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-indigo-500" />
                  Privileges breakdown for: {editingUser.role}
                </h5>

                <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/30 dark:bg-slate-955/10 dark:border-slate-850">
                  <ul className="space-y-2">
                    {(ROLE_PERMISSIONS[editingUser.role]?.permissions || []).map((perm, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-[10.5px] leading-relaxed text-slate-550 dark:text-slate-400">
                        <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                        <span>{perm}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Warnings / Restricted banner */}
              {!isAdmin && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-955/20 border border-amber-100 dark:border-amber-900/30 flex items-start gap-2 text-[10px] font-bold text-amber-700 leading-normal">
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>Your account permissions restrict you from modifying role assignments, email registries, or active login status properties.</span>
                </div>
              )}

            </form>

            {/* Drawer Footer */}
            <div className="h-18 border-t border-slate-100 dark:border-slate-850 px-6 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-850 cursor-pointer"
              >
                Close Drawer
              </button>
              {isAdmin && (
                <button
                  onClick={handleSaveDrawerUser}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-xs font-bold text-white shadow-md cursor-pointer hover:scale-[1.01] active:scale-95 duration-150"
                >
                  Save Changes
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ─── CONFIRMATION DIALOG MODAL ─── */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="p-2 bg-rose-50 dark:bg-rose-955/20 rounded-xl text-rose-500 shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-850 dark:text-white uppercase tracking-wider">{confirmDialog.title}</h3>
                <p className="text-xs text-slate-505 dark:text-slate-400 leading-relaxed">{confirmDialog.message}</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-850 pt-4 mt-5">
              <button
                onClick={() => setConfirmDialog(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-850 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmDialog.action();
                  setConfirmDialog(null);
                }}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-bold text-white shadow-md cursor-pointer"
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
