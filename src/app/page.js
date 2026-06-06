'use client';

import { useState, useEffect } from 'react';
import { 
  Layers, Briefcase, Plus, FolderPlus, X, Columns, LayoutDashboard, CheckSquare, 
  AlertCircle, Calendar, Landmark, Settings, Bell, ChevronLeft, ChevronRight, User, Globe, LogOut,
  CalendarRange, FileText, Clock, Search, ChevronDown, CheckCircle, Info, ShieldAlert, AlertTriangle,
  Terminal, Sliders
} from 'lucide-react';
import DashboardTab from '@/components/DashboardTab';
import TaskTrackerTab from '@/components/TaskTrackerTab';
import IssueTrackerTab from '@/components/IssueTrackerTab';
import DailyTrackerTab from '@/components/DailyTrackerTab';
import LeaveTrackerTab from '@/components/LeaveTrackerTab';
import FinanceHubTab from '@/components/FinanceHubTab';
import SettingsTab from '@/components/SettingsTab';
import PlannerTab from '@/components/PlannerTab';
import DocManagerTab from '@/components/DocManagerTab';
import DetailsDrawer from '@/components/DetailsDrawer';
import { ThemeBackdrop } from '@/components/ThemeBackdrop';

// Import our redesigned tabs
import UsersTab from '@/components/UsersTab';
import ProjectsTab from '@/components/ProjectsTab';

const EMPLOYEES = ["Superadmin"];

const USER_PROFILES = [
  { name: "Superadmin", role: "Admin", email: "superadmin@company.com", password: "admin" }
];

export default function Home() {
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [activeUser, setActiveUser] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfiles, setUserProfiles] = useState(USER_PROFILES);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Credentials authentication states
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginUserName, setLoginUserName] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Datasets
  const [tasks, setTasks] = useState([]);
  const [issues, setIssues] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [epics, setEpics] = useState([]);

  // States
  const [loading, setLoading] = useState(true);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  
  // Cockpit Workspace Layout & Command Center States
  const [showCommandCenter, setShowCommandCenter] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [showCockpitDrawer, setShowCockpitDrawer] = useState(false);
  
  // Quick Standup Logger states
  const [quickStandupTask, setQuickStandupTask] = useState('');
  const [quickStandupHours, setQuickStandupHours] = useState('8');
  const [quickStandupStatus, setQuickStandupStatus] = useState('completed');
  const [quickStandupBlockers, setQuickStandupBlockers] = useState('');
  const [quickStandupSubmitting, setQuickStandupSubmitting] = useState(false);

  // Toast Notification State
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Modals & Drawers
  const [showAddProject, setShowAddProject] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null); // Task or Issue object
  const [selectedItemType, setSelectedItemType] = useState('task'); // 'task' or 'issue'
  const [showNotifications, setShowNotifications] = useState(false);

  // Project Form State
  const [projName, setProjName] = useState('');
  const [projCode, setProjCode] = useState('');
  const [projClient, setProjClient] = useState('');
  const [projType, setProjType] = useState('delivery');
  
  const [showProjSelect, setShowProjSelect] = useState(false);
  const [showUserSelect, setShowUserSelect] = useState(false);
  const [showMsalSim, setShowMsalSim] = useState(false);
  const [msalLoading, setMsalLoading] = useState(false);

  // Keyboard shortcut listener for Command Center Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandCenter(prev => !prev);
      }
      if (e.key === 'Escape') {
        setShowCommandCenter(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ─── 1. API FETCHES ───
  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      const res = await response.json();
      if (res.success && res.data.length > 0) {
        setProjects(res.data);
        if (!activeProject) {
          setActiveProject(res.data[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLeaves = async () => {
    try {
      const response = await fetch('/api/leaves');
      const res = await response.json();
      if (res.success) {
        setLeaves(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchNotifications = async (user) => {
    try {
      const response = await fetch(`/api/notifications?employeeName=${user}`);
      const res = await response.json();
      if (res.success) {
        setNotifications(res.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTasksIssuesAndEpics = async (projId) => {
    if (!projId) return;
    try {
      const taskRes = await fetch(`/api/tasks?projectId=${projId}`);
      const taskData = await taskRes.json();
      if (taskData.success) {
        setTasks(taskData.data);
      }

      const issueRes = await fetch(`/api/issues?projectId=${projId}`);
      const issueData = await issueRes.json();
      if (issueData.success) {
        setIssues(issueData.data);
      }

      const finRes = await fetch(`/api/financials?projectId=${projId}`);
      const finData = await finRes.json();
      if (finData.success) {
        setTransactions(finData.data);
      }

      const epicRes = await fetch(`/api/epics?projectId=${projId}`);
      const epicData = await epicRes.json();
      if (epicData.success) {
        setEpics(epicData.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Run on mount
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      
      // Load user profiles list
      const savedProfiles = localStorage.getItem('company_user_profiles');
      let profilesList = USER_PROFILES;
      if (savedProfiles) {
        try {
          const parsed = JSON.parse(savedProfiles);
          if (parsed && parsed.length > 0) {
            setUserProfiles(parsed);
            profilesList = parsed;
          }
        } catch (e) {
          console.error(e);
        }
      }

      // Check current session
      const savedSession = localStorage.getItem('company_current_session');
      if (savedSession) {
        try {
          const sessionUser = JSON.parse(savedSession);
          if (sessionUser) {
            const freshProfile = profilesList.find(p => p.name === sessionUser.name) || sessionUser;
            setCurrentUser(freshProfile);
            setActiveUser(freshProfile.name);
            setIsLoggedIn(true);
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        if (profilesList && profilesList.length > 0) {
          setLoginUserName(profilesList[0].name);
        }
      }
      
      await fetchProjects();
      await fetchLeaves();
      setLoading(false);
    };
    init();
  }, []);

  // Sign In / Sign Out actions
  const handleLogin = (e) => {
    e.preventDefault();
    if (!loginUserName) return;
    
    const profile = userProfiles.find(u => u.name === loginUserName);
    if (!profile) return;
    
    let expectedPassword = profile.password;
    if (!expectedPassword) {
      const role = profile.role?.toLowerCase() || '';
      if (role === 'admin') expectedPassword = 'admin';
      else if (role === 'manager') expectedPassword = 'manager';
      else if (role === 'hr') expectedPassword = 'hr';
      else expectedPassword = 'user';
    }
    
    if (loginPassword === expectedPassword) {
      localStorage.setItem('company_current_session', JSON.stringify(profile));
      setCurrentUser(profile);
      setActiveUser(profile.name);
      setIsLoggedIn(true);
      setLoginPassword('');
      setLoginError('');
      showToast(`Welcome back, ${profile.name}!`, "success");
    } else {
      setLoginError("Invalid password for this profile!");
      showToast("Authentication failed", "error");
    }
  };

  const handleMicrosoftSSOLogin = (profile) => {
    setMsalLoading(true);
    setTimeout(() => {
      setMsalLoading(false);
      setShowMsalSim(false);
      localStorage.setItem('company_current_session', JSON.stringify(profile));
      setCurrentUser(profile);
      setActiveUser(profile.name);
      setIsLoggedIn(true);
      fetchNotifications(profile.name);
      setLoginPassword('');
      setLoginError('');
      showToast(`SSO Authenticated: ${profile.name}`, "success");
    }, 1000);
  };

  const handleLogout = () => {
    localStorage.removeItem('company_current_session');
    setIsLoggedIn(false);
    setCurrentUser(null);
    setActiveUser('');
    setShowProfileDropdown(false);
    showToast("Signed out successfully", "info");
  };

  const handleResetSandbox = () => {
    if (confirm("Are you sure you want to reset all local browser cache and user profiles? This will restore the default Superadmin profile and log you out.")) {
      localStorage.removeItem('company_current_session');
      localStorage.setItem('company_user_profiles', JSON.stringify(USER_PROFILES));
      setIsLoggedIn(false);
      setCurrentUser(null);
      setActiveUser('');
      setUserProfiles(USER_PROFILES);
      setShowProfileDropdown(false);
      showToast("Sandbox data reset successfully!", "info");
      window.location.reload();
    }
  };

  const handlePostQuickStandup = async (e) => {
    e.preventDefault();
    if (!quickStandupTask.trim()) return;
    setQuickStandupSubmitting(true);
    try {
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeName: activeUser,
          date: new Date().toISOString().substring(0, 10),
          projectId: activeProject ? activeProject._id : undefined,
          taskDescription: quickStandupTask.trim(),
          hoursSpent: Number(quickStandupHours) || 8,
          status: quickStandupStatus,
          blockers: quickStandupStatus === 'blocked' ? quickStandupBlockers.trim() : ''
        })
      });
      const res = response.body ? await response.json() : null;
      if (res && res.success) {
        showToast("Standup log added successfully!", "success");
        setQuickStandupTask('');
        setQuickStandupHours('8');
        setQuickStandupStatus('completed');
        setQuickStandupBlockers('');
        if (activeProject) {
          fetchTasksIssuesAndEpics(activeProject._id);
        }
      } else {
        showToast(res?.error || "Failed to post standup log", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error connection failed", "error");
    } finally {
      setQuickStandupSubmitting(false);
    }
  };

  // Run on active project change
  useEffect(() => {
    if (activeProject) {
      fetchTasksIssuesAndEpics(activeProject._id);
    }
  }, [activeProject]);

  // Run when active user changes
  useEffect(() => {
    if (activeUser) {
      fetchNotifications(activeUser);
    }
  }, [activeUser]);

  // ─── 2. DATA MUTATORS FOR DRAWER ───
  const handleUpdateItem = async (itemId, updatedFields) => {
    const isTask = selectedItemType === 'task';
    const endpoint = isTask ? '/api/tasks' : '/api/issues';
    
    // Optimistic local state update
    if (isTask) {
      setTasks(prev => prev.map(t => {
        if (t._id === itemId) {
          // If epicId is updated, resolve the full epic object locally for binding
          const resolvedEpic = updatedFields.epicId 
            ? epics.find(e => e._id === updatedFields.epicId) 
            : null;
          return { ...t, ...updatedFields, epicId: resolvedEpic || updatedFields.epicId };
        }
        return t;
      }));
      if (selectedItem && selectedItem._id === itemId) {
        setSelectedItem(prev => {
          const resolvedEpic = updatedFields.epicId 
            ? epics.find(e => e._id === updatedFields.epicId) 
            : null;
          return { ...prev, ...updatedFields, epicId: resolvedEpic || updatedFields.epicId };
        });
      }
    } else {
      setIssues(prev => prev.map(i => {
        if (i._id === itemId) {
          const resolvedEpic = updatedFields.epicId 
            ? epics.find(e => e._id === updatedFields.epicId) 
            : null;
          return { ...i, ...updatedFields, epicId: resolvedEpic || updatedFields.epicId };
        }
        return i;
      }));
      if (selectedItem && selectedItem._id === itemId) {
        setSelectedItem(prev => {
          const resolvedEpic = updatedFields.epicId 
            ? epics.find(e => e._id === updatedFields.epicId) 
            : null;
          return { ...prev, ...updatedFields, epicId: resolvedEpic || updatedFields.epicId };
        });
      }
    }

    try {
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: itemId, ...updatedFields })
      });
      const data = await res.json();
      
      showToast(`${isTask ? 'Task' : 'Issue'} updated successfully`, "success");

      // Dispatch in-app notification if assignee was changed
      if (updatedFields.owner || updatedFields.assignee) {
        const assignedTo = updatedFields.owner || updatedFields.assignee;
        if (assignedTo !== activeUser) {
          const itemTitle = selectedItem?.title || "Item";
          await fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              employeeName: assignedTo,
              actor: activeUser,
              message: `assigned you the ${selectedItemType}: "${itemTitle}"`,
              link: selectedItemType === 'task' ? 'tasks' : 'issues'
            })
          });
        }
      }

    } catch (e) {
      console.error("Failed to sync item update:", e);
      showToast("Error updating ticket details", "error");
    }
  };

  const handleDeleteItem = async (itemId) => {
    const isTask = selectedItemType === 'task';
    const endpoint = isTask ? `/api/tasks?id=${itemId}` : `/api/issues?id=${itemId}`;
    
    try {
      const response = await fetch(endpoint, { method: 'DELETE' });
      const res = await response.json();
      if (res.success) {
        if (isTask) {
          setTasks(prev => prev.filter(t => t._id !== itemId));
        } else {
          setIssues(prev => prev.filter(i => i._id !== itemId));
        }
        setSelectedItem(null);
        showToast(`${isTask ? 'Task' : 'Issue'} deleted successfully`, "success");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to delete item", "error");
    }
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!projName.trim() || !projCode.trim()) return;

    const payload = {
      name: projName,
      code: projCode.toUpperCase().replace(/\s+/g, '-'),
      client: projClient || "Internal",
      type: projType,
      status: "active"
    };

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const res = await response.json();
      if (res.success) {
        setProjects(prev => [...prev, res.data]);
        setActiveProject(res.data);
        setProjName('');
        setProjCode('');
        setProjClient('');
        setShowAddProject(false);
        showToast(`Project workspace "${payload.name}" initialized!`, "success");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to initialize project profile", "error");
    }
  };

  const handleMarkNotificationRead = async (notifId) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: notifId, read: true })
      });
      const res = await response.json();
      if (res.success) {
        setNotifications(prev => prev.map(n => n._id === notifId ? { ...n, read: true } : n));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const unreadNotifCount = notifications.filter(n => !n.read).length;

  // Collapsible sidebar menu segments
  const sidebarGroups = [
    {
      title: "Workspace",
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'projects', label: 'Projects Portfolio', icon: Briefcase },
        { id: 'tasks', label: 'Tasks Board', icon: CheckSquare },
        { id: 'issues', label: 'Issue Tracker', icon: AlertCircle },
        { id: 'planner', label: 'Project Planner', icon: CalendarRange }
      ]
    },
    {
      title: "Management",
      items: [
        { id: 'users', label: 'Users Registry', icon: User },
        { id: 'docs', label: 'Document Vault', icon: FileText },
        { id: 'leaves', label: 'Leave Tracker', icon: Calendar }
      ]
    },
    {
      title: "Operations",
      items: [
        { id: 'daily', label: 'Daily standup', icon: Columns },
        { id: 'finance', label: 'Finance Hub', icon: Landmark }
      ]
    },
    {
      title: "Settings",
      items: [
        { id: 'settings', label: 'Webhook Settings', icon: Settings }
      ]
    }
  ];

  // Helper to resolve breadcrumbs text based on tab ID
  const getBreadcrumbs = () => {
    for (const group of sidebarGroups) {
      const matched = group.items.find(item => item.id === activeTab);
      if (matched) {
        return {
          section: group.title,
          label: matched.label
        };
      }
    }
    return { section: "Workspace", label: "Dashboard" };
  };

  const breadcrumbs = getBreadcrumbs();

  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-50 gap-4 dark:bg-slate-950">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
        <span className="text-sm font-bold text-slate-500 tracking-wider uppercase animate-pulse">
          Loading Workspace Data...
        </span>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="relative flex h-screen w-screen items-center justify-center overflow-hidden font-sans bg-slate-50 dark:bg-slate-955">
        <ThemeBackdrop />
        
        {/* Decorative background blobs */}
        <div className="absolute top-[-10%] left-[-10%] h-[50%] w-[50%] rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/0 blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[50%] w-[50%] rounded-full bg-gradient-to-tl from-purple-500/10 to-indigo-500/0 blur-3xl" />

        <div className="relative z-10 w-full max-w-md bg-white/75 backdrop-blur-xl border border-white/20 rounded-3xl p-8 dark:bg-slate-900/75 dark:border-slate-805/85 shadow-[0_20px_50px_rgba(99,102,241,0.06)] animate-in zoom-in-95 duration-200">
          <div className="flex flex-col items-center mb-8 select-none">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 shadow-lg shadow-indigo-200/50 dark:shadow-none mb-3.5 hover:scale-105 active:scale-95 transition-transform duration-200">
              <Layers className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-widest bg-gradient-to-r from-slate-800 to-slate-900 dark:from-white dark:to-slate-205 bg-clip-text text-transparent">
              Finstack PPM
            </h2>
            <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider mt-1.5">Unified Project Portfolio & Delivery Hub</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5 text-xs">
            
            {/* User Profile Selector Grid */}
            <div>
              <label className="block text-[9px] font-black uppercase tracking-wider text-slate-450 mb-2.5 text-center">
                Select Workspace Profile
              </label>
              
              <div className="grid grid-cols-5 gap-2 max-h-[140px] overflow-y-auto p-1 scrollbar-thin rounded-2xl border border-slate-100/50 dark:border-slate-850 bg-slate-50/30 dark:bg-slate-950/20">
                {userProfiles.map(p => {
                  const isSelected = loginUserName === p.name;
                  return (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => {
                        setLoginUserName(p.name);
                        setLoginError('');
                      }}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all border outline-none cursor-pointer ${
                        isSelected
                          ? 'bg-white border-indigo-500 scale-[1.03] dark:bg-slate-900 shadow-md shadow-slate-100 dark:shadow-none'
                          : 'border-transparent hover:bg-slate-100/40 dark:hover:bg-slate-900/10'
                      }`}
                    >
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold uppercase transition-all duration-205 ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-none'
                          : 'bg-slate-200 text-slate-655 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {p.name.charAt(0)}
                      </div>
                      <span className="text-[9px] font-extrabold text-slate-700 dark:text-slate-350 truncate w-full text-center mt-1.5">
                        {p.name}
                      </span>
                      <span className="text-[7.5px] text-slate-400 font-semibold truncate w-full text-center scale-90 leading-none">
                        {p.role}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5 px-0.5 select-none">
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-450">
                  Password for <span className="text-indigo-650 dark:text-indigo-400 font-black">{loginUserName}</span>
                </label>
                <span className="text-[8px] text-slate-400 font-bold lowercase">default is role (e.g. 'admin')</span>
              </div>
              <input
                type="password"
                placeholder="Enter password"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-205 bg-white/70 px-3.5 py-2.5 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-850 dark:bg-slate-950/60 dark:text-slate-300 font-semibold transition-all"
                required
              />
            </div>

            {loginError && (
              <p className="text-[10px] font-bold text-rose-500 text-center animate-pulse">
                ⚠️ {loginError}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 py-3 text-xs font-bold text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:scale-[1.01] active:scale-95 duration-150"
            >
              Sign In to Workspace
            </button>
          </form>

          <div className="relative flex py-3.5 items-center select-none">
            <div className="flex-grow border-t border-slate-100/60 dark:border-slate-850"></div>
            <span className="flex-shrink mx-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Or login via SSO</span>
            <div className="flex-grow border-t border-slate-100/60 dark:border-slate-850"></div>
          </div>

          <button
            type="button"
            onClick={() => setShowMsalSim(true)}
            className="w-full rounded-xl border border-slate-200 bg-white/70 hover:bg-slate-50 py-3 text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-205 dark:hover:bg-slate-900 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] active:scale-95 duration-150 shadow-sm"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 23 23" fill="none">
              <path d="M0 0h11v11H0z" fill="#F25022"/>
              <path d="M12 0h11v11H12z" fill="#7FBA00"/>
              <path d="M0 12h11v11H0z" fill="#00A4EF"/>
              <path d="M12 12h11v11H12z" fill="#FFB900"/>
            </svg>
            Sign In with Microsoft 365
          </button>

          <div className="mt-6 border-t border-slate-100 dark:border-slate-850 pt-4 text-center select-none">
            <span className="text-[9px] font-bold text-slate-400 block uppercase">Sandbox Access Guide:</span>
            <code className="block text-[8px] text-indigo-500 mt-1 font-semibold dark:text-indigo-400">
              Superadmin (Admin/admin)
            </code>
          </div>
        </div>

        {/* Microsoft SSO Simulator Modal */}
        {showMsalSim && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-white p-8 shadow-2xl rounded-2xl border border-slate-200/50 animate-in zoom-in-95 duration-150 select-none">
              <div className="flex flex-col items-start space-y-4">
                {/* Official MS Logo */}
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 shrink-0" viewBox="0 0 23 23" fill="none">
                    <path d="M0 0h11v11H0z" fill="#F25022"/>
                    <path d="M12 0h11v11H12z" fill="#7FBA00"/>
                    <path d="M0 12h11v11H0z" fill="#00A4EF"/>
                    <path d="M12 12h11v11H12z" fill="#FFB900"/>
                  </svg>
                  <span className="text-sm font-bold text-slate-500 tracking-wide font-sans">Microsoft</span>
                </div>

                <div className="w-full">
                  <h3 className="text-lg font-bold text-slate-800 leading-tight">Pick an account</h3>
                  <p className="text-[11px] text-slate-505 mt-1">to sign in to <strong className="text-indigo-600">Finstack PPM Workspace</strong></p>
                </div>

                {msalLoading ? (
                  <div className="w-full py-8 flex flex-col items-center justify-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse text-center">Exchanging credentials...</span>
                  </div>
                ) : (
                  <div className="w-full space-y-2 max-h-56 overflow-y-auto pr-1">
                    {userProfiles.map(p => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => handleMicrosoftSSOLogin(p)}
                        className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 text-left transition-all cursor-pointer hover:border-slate-200"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-7 w-7 rounded-full bg-slate-100 text-slate-655 flex items-center justify-center font-bold text-[10px] shrink-0">
                            {p.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-800 leading-none">{p.name}</div>
                            <div className="text-[9px] text-slate-405 mt-1.5 truncate">{p.email || `${p.name.toLowerCase()}@company.com`}</div>
                          </div>
                        </div>
                        <span className="text-[9px] bg-slate-100 text-slate-505 font-extrabold uppercase px-1.5 py-0.5 rounded leading-none shrink-0">
                          {p.role}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                <div className="w-full pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowMsalSim(false)}
                    disabled={msalLoading}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 p-2 cursor-pointer disabled:opacity-40"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-slate-50/40 text-slate-700 dark:bg-slate-955 dark:text-slate-350 font-sans overflow-hidden">
      
      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative animate-in fade-in duration-150">
        
        {/* STICKY GLASS HEADER */}
        <header className="sticky top-0 z-45 h-16 border-b border-slate-200/80 bg-white/75 backdrop-blur-md flex items-center justify-between px-6 shrink-0 dark:border-slate-800/85 dark:bg-slate-900/60 select-none">
          
          {/* Logo & Breadcrumbs */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-indigo-650 to-indigo-500 flex items-center justify-center text-white font-black text-sm shadow-sm">
                F
              </div>
              <span className="font-extrabold text-xs text-slate-850 dark:text-white tracking-widest uppercase">Finstack</span>
            </div>
            
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <span>{breadcrumbs.section}</span>
              <span>/</span>
              <span className="text-slate-850 dark:text-white font-bold">{breadcrumbs.label}</span>
              
              {activeProject && (
                <>
                  <span className="hidden sm:inline">|</span>
                  <div className="hidden sm:flex items-center gap-1.5 bg-indigo-50/70 border border-indigo-100 dark:bg-indigo-950/20 dark:border-indigo-900/45 px-2 py-0.5 rounded-lg text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{activeProject.code}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Controls: Search, Cmd+K button, Notifications, User Dropdown */}
          <div className="flex items-center gap-3">
            
            {/* Cmd+K Palette Trigger Indicator */}
            <button
              onClick={() => setShowCommandCenter(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-205 bg-slate-50/40 hover:bg-slate-100/60 px-3 py-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:border-slate-800 dark:bg-slate-950/20 transition-all cursor-pointer"
              title="Open Command Center (Ctrl+K)"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Search...</span>
              <span className="hidden sm:inline border border-slate-200/80 dark:border-slate-800 px-1 py-0.2 rounded text-[8px] font-black uppercase bg-white dark:bg-slate-900 shadow-sm">
                Ctrl+K
              </span>
            </button>

            {/* Notification alert bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-205 bg-slate-50/50 hover:bg-slate-100 text-slate-600 dark:border-slate-850 dark:bg-slate-950/40 dark:text-slate-300 dark:hover:bg-slate-900 transition-all cursor-pointer hover:scale-[1.03]"
                title="View Notifications"
              >
                <Bell className="h-4.5 w-4.5" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-black text-white animate-pulse">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2.5 z-55 rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-md p-3.5 shadow-2xl w-80 dark:border-slate-800 dark:bg-slate-955/95 animate-in slide-in-from-top-2 duration-205">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-850 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Alert Feed</span>
                    <button 
                      onClick={() => setShowNotifications(false)} 
                      className="text-slate-300 hover:text-slate-550 transition-colors cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                    {notifications.length === 0 ? (
                      <div className="text-[10px] text-slate-400 italic text-center py-6">Zero unread alerts.</div>
                    ) : (
                      notifications.map(notif => (
                        <div 
                          key={notif._id}
                          onClick={() => {
                            if (notif.link) {
                              setActiveTab(notif.link);
                            }
                            handleMarkNotificationRead(notif._id);
                            setShowNotifications(false);
                          }}
                          className={`rounded-xl p-2.5 text-[10px] text-left cursor-pointer border transition-colors ${
                            notif.read 
                              ? 'border-slate-100/50 text-slate-400 bg-slate-50/15 dark:border-slate-850/50' 
                              : 'border-indigo-100 bg-indigo-50/10 text-indigo-900 font-semibold hover:bg-indigo-50/20 dark:border-indigo-950/40 dark:text-indigo-400 dark:bg-indigo-950/10'
                          }`}
                        >
                          <div>
                            <strong className="text-slate-700 dark:text-slate-200 font-bold">{notif.actor}</strong> {notif.message}
                          </div>
                          <div className="text-[8px] text-slate-455 mt-1 flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            {new Date(notif.createdAt).toLocaleDateString(undefined, {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Initialize Project profile button */}
            <button
              onClick={() => setShowAddProject(true)}
              className="hidden lg:flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-700 transition-all dark:border-slate-800 dark:bg-slate-950 dark:text-slate-350 cursor-pointer hover:scale-[1.02] active:scale-95 duration-150"
            >
              <FolderPlus className="h-4 w-4 text-indigo-500" />
              Initialize Project
            </button>

            {/* Interactive User profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 border border-transparent hover:border-slate-205 dark:hover:border-slate-800 transition-all cursor-pointer"
              >
                <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-indigo-650 to-indigo-500 flex items-center justify-center text-white text-xs font-black uppercase shadow-sm border border-indigo-500/20">
                  {currentUser?.name.charAt(0)}
                </div>
                <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 z-55 w-52 rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-md p-2 shadow-2xl dark:border-slate-800 dark:bg-slate-955/95 animate-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-850 text-left">
                    <div className="text-xs font-bold text-slate-850 dark:text-slate-200 truncate">{currentUser?.name}</div>
                    <div className="text-[9px] text-slate-400 truncate mt-0.5">{currentUser?.email}</div>
                    <span className="inline-block mt-2 px-1.5 py-0.2 text-[8px] font-black uppercase rounded bg-indigo-50 text-indigo-755 border border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/35">
                      {currentUser?.role}
                    </span>
                  </div>

                  <div className="p-1 space-y-1">
                    <button
                      onClick={() => {
                        setActiveTab('settings');
                        setShowProfileDropdown(false);
                      }}
                      className="w-full text-left rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-655 hover:bg-slate-50 dark:text-slate-355 dark:hover:bg-slate-900 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <Settings className="h-3.5 w-3.5 text-slate-405" />
                      Connector Hub
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left rounded-lg px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/20 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5 text-rose-500" />
                      Sign Out
                    </button>
                    <div className="border-t border-slate-100 dark:border-slate-800/60 my-1" />
                    <button
                      onClick={handleResetSandbox}
                      className="w-full text-left rounded-lg px-2.5 py-1.5 text-[10px] font-black uppercase text-amber-600 hover:bg-amber-50 dark:text-amber-450 dark:hover:bg-amber-955/10 transition-colors flex items-center gap-2 cursor-pointer"
                      title="Clear local browser profiles cache and log out to start fresh"
                    >
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                      Reset Local Cache
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

              {/* COMPACT HORIZONTAL MODULE SWITCHER */}
        <div className="bg-white/60 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800/80 px-6 py-2.5 flex items-center justify-between shrink-0 select-none backdrop-blur-md">
          <div className="flex items-center gap-1.5">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'projects', label: 'Projects', icon: Briefcase },
              { id: 'tasks', label: 'Tasks', icon: CheckSquare },
              { id: 'issues', label: 'Issues', icon: AlertCircle },
              { id: 'planner', label: 'Timeline', icon: CalendarRange },
            ].map(item => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSelectedItem(null);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-650 dark:bg-indigo-950/40 dark:text-indigo-450'
                      : 'text-slate-500 hover:text-slate-850 hover:bg-slate-50/60 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* Temporary tab for advanced modules */}
            {!['dashboard', 'projects', 'tasks', 'issues', 'planner'].includes(activeTab) && (() => {
              const allItems = [
                { id: 'users', label: 'Users Registry', icon: User },
                { id: 'docs', label: 'Document Vault', icon: FileText },
                { id: 'leaves', label: 'Leave Planner', icon: Calendar },
                { id: 'daily', label: 'Daily Standup', icon: Columns },
                { id: 'finance', label: 'Finance Hub', icon: Landmark },
                { id: 'settings', label: 'Settings', icon: Settings },
              ];
              const matched = allItems.find(item => item.id === activeTab);
              if (!matched) return null;
              const MatchedIcon = matched.icon;
              return (
                <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-1.5">
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-650 dark:bg-indigo-950/40 dark:text-indigo-455 cursor-pointer animate-in fade-in zoom-in-95 duration-100"
                  >
                    <MatchedIcon className="h-4 w-4" />
                    <span>{matched.label}</span>
                  </button>
                </div>
              );
            })()}
          </div>

          {/* Toggle for Cockpit Drawer */}
          {activeProject && (
            <button
              onClick={() => setShowCockpitDrawer(!showCockpitDrawer)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer hover:scale-[1.01] active:scale-95 duration-100 ${
                showCockpitDrawer
                  ? 'bg-indigo-650 border-indigo-650 text-white dark:bg-indigo-500 dark:border-indigo-500'
                  : 'bg-white border-slate-205 text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-850'
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Project Cockpit</span>
              {showCockpitDrawer ? (
                <ChevronRight className="h-3 w-3" />
              ) : (
                <ChevronLeft className="h-3 w-3" />
              )}
            </button>
          )}
        </div>

        {/* MAIN BODY: central view + collapsible drawer */}
        <div className="flex-1 flex overflow-hidden relative">
          
          {/* Scrollable central view */}
          <div className="flex-1 overflow-y-auto px-6 py-6 pb-28 relative">
            
            {activeTab === 'dashboard' && (
              <DashboardTab 
                tasks={tasks}
                issues={issues}
                leaves={leaves}
                transactions={transactions}
                activeProject={activeProject}
                activeUser={activeUser}
                currentUser={currentUser}
                notifications={notifications}
                employees={userProfiles.map(u => u.name)}
                
                // Quick Standup Logger
                quickStandupTask={quickStandupTask}
                setQuickStandupTask={setQuickStandupTask}
                quickStandupHours={quickStandupHours}
                setQuickStandupHours={setQuickStandupHours}
                quickStandupStatus={quickStandupStatus}
                setQuickStandupStatus={setQuickStandupStatus}
                quickStandupBlockers={quickStandupBlockers}
                setQuickStandupBlockers={setQuickStandupBlockers}
                quickStandupSubmitting={quickStandupSubmitting}
                handlePostQuickStandup={handlePostQuickStandup}
                
                // OIDC Switcher Sandbox
                userProfiles={userProfiles}
                setCurrentUser={setCurrentUser}
                setActiveUser={setActiveUser}
                fetchNotifications={fetchNotifications}
                handleResetSandbox={handleResetSandbox}
                showToast={showToast}
              />
            )}

            {activeTab === 'tasks' && (
              <TaskTrackerTab 
                tasks={tasks}
                setTasks={setTasks}
                activeProject={activeProject}
                epics={epics}
                currentUser={currentUser}
                employees={userProfiles.map(u => u.name)}
                onSelectItem={(item, type) => {
                  setSelectedItem(item);
                  setSelectedItemType(type);
                }}
                showToast={showToast}
              />
            )}

            {activeTab === 'issues' && (
              <IssueTrackerTab 
                issues={issues}
                setIssues={setIssues}
                activeProject={activeProject}
                epics={epics}
                currentUser={currentUser}
                employees={userProfiles.map(u => u.name)}
                onSelectItem={(item, type) => {
                  setSelectedItem(item);
                  setSelectedItemType(type);
                }}
                activeUser={activeUser}
                showToast={showToast}
              />
            )}

            {activeTab === 'planner' && (
              <PlannerTab 
                activeProject={activeProject}
                tasks={tasks}
                epics={epics}
                onSelectItem={(item, type) => {
                  setSelectedItem(item);
                  setSelectedItemType(type);
                }}
                showToast={showToast}
              />
            )}

            {activeTab === 'docs' && (
              <DocManagerTab 
                activeProject={activeProject}
                currentUser={currentUser}
                showToast={showToast}
              />
            )}

            {activeTab === 'daily' && (
              <DailyTrackerTab 
                projects={projects}
                activeUser={activeUser}
                currentUser={currentUser}
                activeProject={activeProject}
                employees={userProfiles.map(u => u.name)}
                showToast={showToast}
              />
            )}

            {activeTab === 'leaves' && (
              <LeaveTrackerTab 
                leaves={leaves}
                setLeaves={setLeaves}
                activeUser={activeUser}
                currentUser={currentUser}
                employees={userProfiles.map(u => u.name)}
                showToast={showToast}
              />
            )}

            {activeTab === 'finance' && (
              <FinanceHubTab 
                transactions={transactions}
                setTransactions={setTransactions}
                activeProject={activeProject}
                currentUser={currentUser}
                showToast={showToast}
              />
            )}

            {activeTab === 'projects' && (
              <ProjectsTab 
                activeUser={activeUser} 
                activeProject={activeProject}
                setActiveProject={setActiveProject}
                epics={epics}
                setEpics={setEpics}
                currentUser={currentUser}
                projects={projects}
                setProjects={setProjects}
                showToast={showToast}
              />
            )}

            {activeTab === 'users' && (
              <UsersTab 
                activeUser={activeUser}
                currentUser={currentUser}
                userProfiles={userProfiles}
                setUserProfiles={setUserProfiles}
                showToast={showToast}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsTab 
                activeUser={activeUser} 
                activeProject={activeProject}
                currentUser={currentUser}
                showToast={showToast}
              />
            )}

          </div>

          {/* COLLAPSIBLE PROJECT COCKPIT DRAWER */}
          <>
            {/* Backdrop Overlay */}
            <div 
              className={`fixed inset-0 z-40 bg-slate-900/15 backdrop-blur-xs transition-opacity duration-300 ${
                showCockpitDrawer ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              onClick={() => setShowCockpitDrawer(false)}
            />
            
            {/* Drawer Content */}
            <aside 
              className={`fixed inset-y-0 right-0 z-50 w-80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-l border-slate-200/80 dark:border-slate-800/85 shadow-2xl flex flex-col h-full transform transition-transform duration-300 ease-in-out select-none text-xs ${
                showCockpitDrawer ? 'translate-x-0' : 'translate-x-full'
              }`}
            >
              {/* Header inside drawer */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Project Cockpit</span>
                <button 
                  onClick={() => setShowCockpitDrawer(false)}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Scrollable sections */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {activeProject ? (
                  <div className="space-y-3">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 dark:border-slate-800/60">
                      Active Project Scope
                    </div>
                    <div>
                      <div className="font-bold text-slate-850 dark:text-slate-100 truncate">{activeProject.name}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5 font-mono">Code: {activeProject.code} • Client: {activeProject.client || 'Internal'}</div>
                    </div>

                    {/* Progress bar */}
                    {(() => {
                      const projTasks = tasks;
                      const total = projTasks.length;
                      const completed = projTasks.filter(t => t.status === 'done').length;
                      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                      
                      const openBugs = issues.filter(i => i.status !== 'closed' && i.status !== 'resolved').length;
                      const blocked = projTasks.filter(t => t.blocked).length;

                      return (
                        <div className="space-y-2.5">
                          <div className="h-1.5 w-full bg-slate-100 rounded-full dark:bg-slate-800 overflow-hidden">
                            <div className="h-full bg-indigo-650 transition-all duration-300" style={{ width: `${pct}%` }} />
                          </div>
                          <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                            <span>{pct}% Done</span>
                            <span>{completed}/{total} Tasks</span>
                          </div>

                          {/* Stat badges */}
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <div className="bg-rose-50/50 border border-rose-100/50 p-2 rounded-xl text-center dark:bg-rose-955/10 dark:border-rose-950/30">
                              <div className="text-rose-600 font-extrabold text-sm leading-none">{openBugs}</div>
                              <div className="text-[8px] text-rose-500 font-bold uppercase mt-1">Open Bugs</div>
                            </div>
                            <div className="bg-amber-50/50 border border-amber-100/50 p-2 rounded-xl text-center dark:bg-amber-955/10 dark:border-amber-955/10">
                              <div className="text-amber-600 font-extrabold text-sm leading-none">{blocked}</div>
                              <div className="text-[8px] text-amber-500 font-bold uppercase mt-1">Blocked</div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="text-[10px] text-slate-450 italic p-3 text-center bg-slate-50 dark:bg-slate-955/20 rounded-xl">
                    No active project scope loaded.
                  </div>
                )}

                {/* Section 2: Quick Standup Logger */}
                <div className="space-y-3 bg-slate-50/55 border border-slate-100/60 p-4 rounded-2xl dark:bg-slate-955/20 dark:border-slate-800/60">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-indigo-500" />
                    Quick Standup Logger
                  </div>
                  
                  <form onSubmit={handlePostQuickStandup} className="space-y-3">
                    <div>
                      <textarea
                        placeholder="What did you complete today?"
                        value={quickStandupTask}
                        onChange={e => setQuickStandupTask(e.target.value)}
                        rows="2"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-indigo-500 dark:border-slate-850 dark:bg-slate-900"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <input
                          type="number"
                          placeholder="Hours (8)"
                          value={quickStandupHours}
                          onChange={e => setQuickStandupHours(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-center font-bold dark:border-slate-850 dark:bg-slate-900"
                          min="1"
                          max="24"
                        />
                      </div>
                      <div>
                        <select
                          value={quickStandupStatus}
                          onChange={e => setQuickStandupStatus(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold dark:border-slate-850 dark:bg-slate-900 cursor-pointer"
                        >
                          <option value="completed">Done</option>
                          <option value="in-progress">In Dev</option>
                          <option value="blocked">Blocked</option>
                        </select>
                      </div>
                    </div>

                    {quickStandupStatus === 'blocked' && (
                      <input
                        type="text"
                        placeholder="Blocker details..."
                        value={quickStandupBlockers}
                        onChange={e => setQuickStandupBlockers(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs dark:border-slate-850 dark:bg-slate-900"
                        required
                      />
                    )}

                    <button
                      type="submit"
                      disabled={quickStandupSubmitting}
                      className="w-full rounded-xl bg-indigo-650 hover:bg-indigo-755 text-white font-bold py-1.8 text-[10px] uppercase tracking-wider cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      {quickStandupSubmitting ? 'Posting...' : 'Log Standup'}
                    </button>
                  </form>
                </div>

                {/* Section 3: Active Team Leaves */}
                <div className="space-y-3">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 dark:border-slate-800/60">
                    Team Capacity & Leaves
                  </div>
                  <div className="space-y-2">
                    {leaves.length === 0 ? (
                      <div className="text-[9px] text-slate-400 italic">No leaves registered this month.</div>
                    ) : (
                      leaves.slice(0, 4).map(l => (
                        <div key={l._id} className="flex items-center justify-between text-[10px] text-slate-655 dark:text-slate-350">
                          <span className="font-semibold">{l.employeeName}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400 font-bold">{l.daysCount}d out</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Section 4: User Selector Sandbox */}
                <div className="space-y-3 border-t border-slate-100 pt-4 dark:border-slate-800/60">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    OIDC Session Switcher
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={activeUser}
                      onChange={e => {
                        const uName = e.target.value;
                        const matched = userProfiles.find(u => u.name === uName);
                        if (matched) {
                          setCurrentUser(matched);
                          setActiveUser(uName);
                          localStorage.setItem('company_current_session', JSON.stringify(matched));
                          fetchNotifications(uName);
                          showToast(`Identity Swapped to: ${uName}`, "info");
                        }
                      }}
                      className="flex-1 rounded-xl border border-slate-205 bg-white px-2.5 py-1.5 text-[11px] font-bold dark:border-slate-850 dark:bg-slate-900 cursor-pointer"
                    >
                      {userProfiles.map(u => (
                        <option key={u.name} value={u.name}>{u.name} ({u.role})</option>
                      ))}
                    </select>
                    <button
                      onClick={handleResetSandbox}
                      className="rounded-xl border border-slate-200 hover:bg-slate-50 p-2 dark:border-slate-800 dark:hover:bg-slate-850 cursor-pointer"
                      title="Purge local state and reload"
                    >
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    </button>
                  </div>
                </div>
              </div>
            </aside>
          </>

        </div>

        {/* FLOATING COMMAND SWITCHER LAUNCHER TRIGGER */}
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setShowCommandCenter(true)}
            className="h-12 w-12 rounded-full bg-gradient-to-tr from-indigo-650 to-indigo-500 hover:from-indigo-600 hover:to-indigo-550 text-white shadow-2xl flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all duration-150 group relative border border-indigo-500/20"
            title="Open Command Center (Ctrl+K)"
          >
            <Terminal className="h-5.5 w-5.5 animate-pulse" />
            
            {/* Hover Label */}
            <span className="absolute right-full mr-3.5 px-2.5 py-1 bg-slate-900/90 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] font-black rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none whitespace-nowrap uppercase tracking-wider">
              Launcher Console
            </span>
          </button>
        </div>
      </div>


      {/* ─── COMMAND CENTER PANEL (CMD+K) ─── */}
      {showCommandCenter && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="fixed inset-0 -z-10" onClick={() => setShowCommandCenter(false)} />
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-md shadow-2xl overflow-hidden dark:border-slate-800 dark:bg-slate-900/95 max-h-[480px] flex flex-col animate-in zoom-in-95 duration-150 select-none text-xs">
            
            {/* Input Search box */}
            <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2.5 shrink-0">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search tabs, projects, roles or actions..."
                value={commandQuery}
                onChange={e => setCommandQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-xs text-slate-800 dark:text-white font-semibold placeholder-slate-400"
                autoFocus
              />
              <span className="text-[9px] font-black uppercase text-slate-400 border border-slate-205 dark:border-slate-850 px-1.5 py-0.5 rounded-md">
                ESC
              </span>
            </div>
            
            {/* Results body */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              
              {/* Category: Navigation */}
              {(() => {
                const navOptions = [
                  { id: 'dashboard', label: 'Go to Bento Dashboard', icon: LayoutDashboard },
                  { id: 'projects', label: 'Go to Projects Portfolio', icon: Briefcase },
                  { id: 'tasks', label: 'Go to Tasks Board', icon: CheckSquare },
                  { id: 'issues', label: 'Go to Issue Tracker', icon: AlertCircle },
                  { id: 'planner', label: 'Go to Timeline Planner', icon: CalendarRange },
                  { id: 'users', label: 'Go to Users Registry', icon: User },
                  { id: 'docs', label: 'Go to Document Vault', icon: FileText },
                  { id: 'leaves', label: 'Go to Leave Planner', icon: Calendar },
                  { id: 'daily', label: 'Go to Daily Standup Log', icon: Columns },
                  { id: 'finance', label: 'Go to Finance Hub Ledger', icon: Landmark },
                  { id: 'settings', label: 'Go to Webhook Connector Settings', icon: Settings },
                ].filter(opt => opt.label.toLowerCase().includes(commandQuery.toLowerCase()));

                if (navOptions.length === 0) return null;

                return (
                  <div className="space-y-1">
                    <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 px-2.5 mb-1.5">
                      Navigation
                    </div>
                    {navOptions.map(opt => {
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => {
                            setActiveTab(opt.id);
                            setSelectedItem(null);
                            setShowCommandCenter(false);
                            setCommandQuery('');
                          }}
                          className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-850/50 text-slate-750 dark:text-slate-200 font-semibold transition-colors cursor-pointer"
                        >
                          <Icon className="h-4 w-4 text-slate-400" />
                          <span className="flex-1 truncate">{opt.label}</span>
                          <span className="text-[8px] font-black text-slate-400 bg-slate-50 dark:bg-slate-950 px-1 py-0.2 rounded">Enter</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Category: Projects */}
              {(() => {
                const projOptions = projects.filter(p => 
                  p.name.toLowerCase().includes(commandQuery.toLowerCase()) || 
                  p.code.toLowerCase().includes(commandQuery.toLowerCase())
                );

                if (projOptions.length === 0) return null;

                return (
                  <div className="space-y-1">
                    <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 px-2.5 mb-1.5">
                      Workspace Project Switcher
                    </div>
                    {projOptions.map(p => (
                      <button
                        key={p._id}
                        onClick={() => {
                          setActiveProject(p);
                          setShowCommandCenter(false);
                          setCommandQuery('');
                          showToast(`Activated Project Workspace: ${p.code}`, "success");
                        }}
                        className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-850/50 text-slate-750 dark:text-slate-200 font-semibold transition-colors cursor-pointer"
                      >
                        <Briefcase className="h-4 w-4 text-slate-400" />
                        <span className="flex-1 truncate">{p.name} ({p.code})</span>
                        <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-1.5 py-0.2 rounded dark:bg-indigo-950/20">Scope</span>
                      </button>
                    ))}
                  </div>
                );
              })()}

              {/* Category: Identities */}
              {(() => {
                const userOptions = userProfiles.filter(u => 
                  u.name.toLowerCase().includes(commandQuery.toLowerCase()) || 
                  u.role.toLowerCase().includes(commandQuery.toLowerCase())
                );

                if (userOptions.length === 0) return null;

                return (
                  <div className="space-y-1">
                    <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 px-2.5 mb-1.5">
                      Identity Role Swapping
                    </div>
                    {userOptions.map(u => (
                      <button
                        key={u.name}
                        onClick={() => {
                          setCurrentUser(u);
                          setActiveUser(u.name);
                          localStorage.setItem('company_current_session', JSON.stringify(u));
                          fetchNotifications(u.name);
                          setShowCommandCenter(false);
                          setCommandQuery('');
                          showToast(`Authenticated as: ${u.name}`, "info");
                        }}
                        className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-850/50 text-slate-750 dark:text-slate-200 font-semibold transition-colors cursor-pointer"
                      >
                        <User className="h-4 w-4 text-slate-400" />
                        <span className="flex-1 truncate">{u.name} ({u.role})</span>
                        <span className="text-[9px] font-black text-slate-400 bg-slate-50 dark:bg-slate-950 px-1.5 py-0.2 rounded">{u.role}</span>
                      </button>
                    ))}
                  </div>
                );
              })()}

              {/* Category: Quick Actions */}
              {(() => {
                const actions = [
                  { label: 'Initialize Project Workspace', action: () => { setShowAddProject(true); }, icon: FolderPlus },
                  { label: 'Reset Local Sandbox Cache', action: () => { handleResetSandbox(); }, icon: AlertTriangle },
                  { label: 'Trigger MSAL SSO Authentication', action: () => { setShowMsalSim(true); }, icon: Globe },
                ].filter(act => act.label.toLowerCase().includes(commandQuery.toLowerCase()));

                if (actions.length === 0) return null;

                return (
                  <div className="space-y-1">
                    <div className="text-[9px] font-black uppercase tracking-wider text-slate-400 px-2.5 mb-1.5">
                      Global Smart Actions
                    </div>
                    {actions.map((act, i) => {
                      const Icon = act.icon;
                      return (
                        <button
                          key={i}
                          onClick={() => {
                            act.action();
                            setShowCommandCenter(false);
                            setCommandQuery('');
                          }}
                          className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-850/50 text-slate-750 dark:text-slate-200 font-semibold transition-colors cursor-pointer"
                        >
                          <Icon className="h-4 w-4 text-slate-400" />
                          <span className="flex-1 truncate">{act.label}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}

            </div>
          </div>
        </div>
      )}

      {/* ADD PROJECT MODAL */}
      {showAddProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 dark:border-slate-800 animate-all">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider dark:text-white">
                Initialize Project Profile
              </h3>
              <button onClick={() => setShowAddProject(false)} className="text-slate-400 hover:text-slate-655 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddProject} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Project Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dubai Islamic Bank Core Support"
                  value={projName}
                  onChange={e => setProjName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-955 dark:text-slate-300 font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Project Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DIB-CORE"
                    value={projCode}
                    onChange={e => setProjCode(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-955 dark:text-slate-300 font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Client Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DIB Bank"
                    value={projClient}
                    onChange={e => setProjClient(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-955 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Project Focus Type
                </label>
                <select
                  value={projType}
                  onChange={e => setProjType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-955 dark:text-slate-300 cursor-pointer"
                >
                  <option value="delivery">Active Project Delivery (Implementation)</option>
                  <option value="maintenance">SLA Project Maintenance (Ongoing Support)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-5 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddProject(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-850 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-650 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-md cursor-pointer"
                >
                  Create Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STATE-DRIVEN GLOBAL TOAST PORTAL */}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2.5 max-w-sm pointer-events-none">
        {toasts.map((toast) => {
          let Icon = CheckCircle;
          let colorStyles = "bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800 text-slate-700 dark:text-slate-300";
          let iconColor = "text-indigo-650 dark:text-indigo-400";
          
          if (toast.type === 'success') {
            Icon = CheckCircle;
            colorStyles = "bg-emerald-50/90 dark:bg-emerald-955/20 border-emerald-200 dark:border-emerald-900/50 text-slate-800 dark:text-emerald-400";
            iconColor = "text-emerald-500";
          } else if (toast.type === 'error') {
            Icon = ShieldAlert;
            colorStyles = "bg-rose-50/90 dark:bg-rose-955/20 border-rose-200 dark:border-rose-900/50 text-slate-800 dark:text-rose-455";
            iconColor = "text-rose-500";
          } else if (toast.type === 'info') {
            Icon = Info;
            colorStyles = "bg-blue-50/90 dark:bg-blue-955/20 border-blue-200 dark:border-blue-900/50 text-slate-800 dark:text-blue-400";
            iconColor = "text-blue-500";
          } else if (toast.type === 'warning') {
            Icon = AlertTriangle;
            colorStyles = "bg-amber-50/90 dark:bg-amber-955/20 border-amber-200 dark:border-amber-900/50 text-slate-800 dark:text-amber-400";
            iconColor = "text-amber-500";
          }

          return (
            <div 
              key={toast.id}
              className={`p-3.5 rounded-2xl border backdrop-blur-md shadow-2xl flex items-center gap-3 pointer-events-auto w-80 animate-in slide-in-from-bottom-5 fade-in duration-200 ${colorStyles}`}
            >
              <Icon className={`h-5 w-5 shrink-0 ${iconColor}`} />
              <span className="text-[11px] font-bold leading-normal">{toast.message}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
