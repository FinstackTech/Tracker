'use client';

import { useState, useEffect } from 'react';
import { 
  Layers, Briefcase, Plus, FolderPlus, X, Columns, LayoutDashboard, CheckSquare, 
  AlertCircle, Calendar, Landmark, Settings, Bell, ChevronLeft, ChevronRight, User, Globe, LogOut,
  CalendarRange, FileText, Clock
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

const EMPLOYEES = ["Ilyas", "Susanth", "Vishnu", "Bharath", "Tom", "Vijayan", "Babu", "Irshad", "Lyn", "Ravi"];

const USER_PROFILES = [
  { name: "Ilyas", role: "Admin", email: "ilyas@company.com", password: "admin" },
  { name: "Vijayan", role: "Manager", email: "vijayan@company.com", password: "manager" },
  { name: "Lyn", role: "HR", email: "lyn@company.com", password: "hr" },
  { name: "Ravi", role: "HR", email: "ravi@company.com", password: "hr" },
  { name: "Susanth", role: "Employee", email: "susanth@company.com", password: "user" },
  { name: "Vishnu", role: "Employee", email: "vishnu@company.com", password: "user" },
  { name: "Bharath", role: "Employee", email: "bharath@company.com", password: "user" },
  { name: "Tom", role: "Employee", email: "tom@company.com", password: "user" },
  { name: "Babu", role: "Employee", email: "babu@company.com", password: "user" },
  { name: "Irshad", role: "Employee", email: "irshad@company.com", password: "user" }
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
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
    } else {
      setLoginError("Invalid password for this profile!");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('company_current_session');
    setIsLoggedIn(false);
    setCurrentUser(null);
    setActiveUser('');
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
      }
    } catch (err) {
      console.error(err);
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
      }
    } catch (err) {
      console.error(err);
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

  const sidebarMenu = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects Portfolio', icon: Briefcase },
    { id: 'users', label: 'Users Registry', icon: User },
    { id: 'tasks', label: 'Tasks Board', icon: CheckSquare },
    { id: 'issues', label: 'Issue Tracker', icon: AlertCircle },
    { id: 'planner', label: 'Project Planner', icon: CalendarRange },
    { id: 'docs', label: 'Document Vault', icon: FileText },
    { id: 'daily', label: 'Daily standup', icon: Columns },
    { id: 'leaves', label: 'Leave Tracker', icon: Calendar },
    { id: 'finance', label: 'Finance Hub', icon: Landmark },
    { id: 'settings', label: 'Webhook Settings', icon: Settings }
  ];

  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-50 gap-4 dark:bg-slate-950">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-650" />
        <span className="text-sm font-bold text-slate-500 tracking-wider uppercase animate-pulse">
          Loading Workspace Data...
        </span>
 
      </div>
    );
  }

   if (!isLoggedIn) {
    return (
      <div className="relative flex h-screen w-screen items-center justify-center overflow-hidden font-sans bg-slate-50 dark:bg-slate-950">
        <ThemeBackdrop />
        
        {/* Decorative dynamic background blobs */}
        <div className="absolute top-[-10%] left-[-10%] h-[50%] w-[50%] rounded-full bg-gradient-to-br from-indigo-500/20 to-violet-500/0 blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[50%] w-[50%] rounded-full bg-gradient-to-tl from-purple-500/10 to-indigo-500/0 blur-3xl" />

        <div className="relative z-10 w-full max-w-md bg-white/70 backdrop-blur-xl border border-white/20 rounded-3xl p-8 dark:bg-slate-900/75 dark:border-slate-800/80 shadow-[0_20px_50px_rgba(99,102,241,0.06)] animate-in zoom-in-95 duration-200">
          <div className="flex flex-col items-center mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 shadow-lg shadow-indigo-200/50 dark:shadow-none mb-3.5 hover:scale-105 active:scale-95 transition-transform duration-200">
              <Layers className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-widest bg-gradient-to-r from-slate-800 to-slate-900 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
              Finstack PPM
            </h2>
            <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider mt-1.5">Unified Project Portfolio & Delivery Hub</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5 text-xs">
            
            {/* Clickable Profile Card Selector Grid */}
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
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold uppercase transition-all duration-200 ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-none'
                          : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
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
              <div className="flex justify-between items-center mb-1.5 px-0.5">
                <label className="text-[9px] font-black uppercase tracking-wider text-slate-450">
                  Password for <span className="text-indigo-600 dark:text-indigo-400 font-black">{loginUserName}</span>
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

          <div className="mt-6 border-t border-slate-100 dark:border-slate-850 pt-4 text-center">
            <span className="text-[9px] font-bold text-slate-400 block uppercase">Sandbox Access Guide:</span>
            <code className="block text-[8px] text-indigo-500 mt-1 font-semibold dark:text-indigo-400">
              susanth/susanth (User) | lyn/ravi (HR) | ilyas (Admin/admin)
            </code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-slate-50/40 text-slate-700 dark:bg-slate-950 dark:text-slate-350 font-sans overflow-hidden">
      
      {/* LEFT COLLAPSIBLE SIDEBAR */}
      <aside 
        className={`flex flex-col border-r border-slate-200/80 bg-white/70 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/70 transition-all duration-200 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 dark:border-slate-850 relative">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-indigo-650 flex items-center justify-center text-white font-black text-sm shadow-sm shadow-indigo-200 dark:shadow-none">
                N
              </div>
              <span className="font-bold text-xs text-slate-900 dark:text-white tracking-widest uppercase">Workspace PPM</span>
            </div>
          ) : (
            <div className="mx-auto h-7 w-7 rounded-lg bg-indigo-650 flex items-center justify-center text-white font-black text-sm shadow-sm">
              N
            </div>
          )}
          
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute -right-3.5 top-4.5 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm hover:bg-slate-50 dark:border-slate-850 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 hidden sm:flex transition-all duration-200 hover:scale-110 active:scale-90"
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {sidebarCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* User Card in Left Sidebar */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-850">
          {!sidebarCollapsed ? (
            <div className="rounded-xl bg-slate-50/50 border border-slate-150/60 p-3 dark:bg-slate-950/40 dark:border-slate-850/60 hover:bg-slate-50 dark:hover:bg-slate-950 transition-all">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-indigo-650 flex items-center justify-center text-white text-xs font-bold uppercase shrink-0 font-sans border border-indigo-500/20">
                  {currentUser?.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-850 dark:text-slate-200 truncate leading-tight font-sans">{currentUser?.name}</div>
                  <div className="text-[9px] text-slate-400 truncate leading-none mt-0.5 font-sans">{currentUser?.email}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`inline-block px-1.5 py-0.2 text-[8px] font-extrabold uppercase rounded font-sans ${
                      (currentUser?.role === 'Admin' || currentUser?.role === 'Head') ? 'bg-rose-50 text-rose-700 dark:bg-rose-955/30 dark:text-rose-450 border border-rose-100/30' :
                      (currentUser?.role === 'Project Manager' || currentUser?.role === 'Project Lead' || currentUser?.role === 'Support Manager' || currentUser?.role === 'Support Lead' || currentUser?.role === 'Manager') ? 'bg-violet-50 text-violet-755 dark:bg-violet-955/30 dark:text-violet-405 border border-violet-100/30' :
                      (currentUser?.role === 'HR' || currentUser?.role === 'Sales') ? 'bg-amber-50 text-amber-705 dark:bg-amber-955/30 dark:text-amber-400 border border-amber-100/30' :
                      'bg-emerald-55 text-emerald-700 dark:bg-emerald-955/30 dark:text-emerald-400 border border-emerald-100/30'
                    }`}>
                      {currentUser?.role}
                    </span>
                    <button
                      onClick={handleLogout}
                      className="text-[8px] font-extrabold uppercase text-slate-400 hover:text-rose-500 cursor-pointer flex items-center gap-0.5 transition-colors"
                    >
                      <LogOut className="h-2 w-2" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative group">
              <div 
                className="mx-auto h-8 w-8 rounded-full bg-indigo-650 flex items-center justify-center text-white font-bold uppercase text-xs cursor-pointer select-none font-sans border border-indigo-500/20 transition-transform duration-200 hover:scale-105"
                title={`${currentUser?.name} (${currentUser?.role})`}
                onClick={handleLogout}
              >
                {currentUser?.name.charAt(0)}
              </div>
            </div>
          )}
        </div>

        {/* Project Selector */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-850">
          {!sidebarCollapsed ? (
            <div className="relative">
              <button 
                onClick={() => { setShowProjSelect(!showProjSelect); setShowUserSelect(false); }}
                className="w-full flex items-center justify-between rounded-xl bg-slate-50/50 border border-slate-150/60 px-3 py-2 text-left hover:bg-slate-100/70 dark:bg-slate-950/40 dark:border-slate-850/60 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate">
                  <Briefcase className="h-4 w-4 text-indigo-500 shrink-0" />
                  <div className="truncate">
                    <div className="text-[10px] text-slate-400 font-bold leading-none">PROJECT</div>
                    <div className="text-xs font-bold text-slate-850 dark:text-slate-200 mt-0.5 truncate">{activeProject?.name}</div>
                  </div>
                </div>
                <span className="text-[9px] text-slate-400 shrink-0 transition-transform duration-200" style={{ transform: showProjSelect ? 'rotate(180deg)' : 'rotate(0)' }}>▼</span>
              </button>

              {showProjSelect && (
                <div className="absolute left-0 right-0 mt-2 z-50 rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-md p-1.5 shadow-xl dark:border-slate-805 dark:bg-slate-900/95 animate-in slide-in-from-top-2 duration-150">
                  {projects.map(proj => (
                    <button
                      key={proj._id}
                      onClick={() => { setActiveProject(proj); setShowProjSelect(false); }}
                      className="w-full text-left rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-655 hover:bg-slate-50 dark:text-slate-350 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      {proj.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-indigo-500 border border-slate-200 dark:bg-slate-950 dark:border-slate-850" title={activeProject?.name}>
              <Briefcase className="h-4 w-4" />
            </div>
          )}
        </div>

        {/* Menu Nav */}
        <nav className="flex-1 pr-2 py-4 space-y-1 overflow-y-auto">
          {sidebarMenu.map((item) => {
            const MenuIcon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSelectedItem(null);
                }}
                className={`w-full flex items-center rounded-r-xl py-2.5 pl-3 pr-4 transition-all text-xs font-bold relative group duration-150 cursor-pointer border-l-4 ${
                  isActive 
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-400 dark:text-indigo-400' 
                    : 'border-transparent text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900/40 dark:hover:text-slate-205'
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <MenuIcon className={`h-4.5 w-4.5 shrink-0 transition-transform group-hover:scale-110 ${sidebarCollapsed ? 'mx-auto' : 'mr-3'} ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`} />
                {!sidebarCollapsed && <span className="transition-transform group-hover:translate-x-0.5">{item.label}</span>}
              </button>
            );
          })}
        </nav>

      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative animate-in fade-in duration-150">
        
        {/* Header */}
        <header className="h-16 border-b border-slate-200/80 bg-white/70 backdrop-blur-md flex items-center justify-between px-6 shrink-0 dark:border-slate-800 dark:bg-slate-900/60">
          <div>
            <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider">
              {activeProject?.client || 'Internal'} Project Portfolio
            </span>
            <h2 className="text-sm font-bold text-slate-850 dark:text-white leading-none mt-1">
              {activeProject?.name || 'Project Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Relocated Header Notifications Dropdown */}
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
                <div className="absolute right-0 mt-2.5 z-55 rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-md p-3.5 shadow-2xl w-80 dark:border-slate-800 dark:bg-slate-950/95 animate-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-850 mb-2 select-none">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Alert Feed</span>
                    <button 
                      onClick={() => setShowNotifications(false)} 
                      className="text-slate-300 hover:text-slate-550 transition-colors"
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
                          <div className="text-[8px] text-slate-450 mt-1 flex items-center gap-1">
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

            <button
              onClick={() => setShowAddProject(true)}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-all dark:border-slate-800 dark:bg-slate-950 dark:text-slate-350 cursor-pointer hover:scale-[1.02] active:scale-95 duration-150"
            >
              <FolderPlus className="h-4 w-4 text-indigo-500" />
              Initialize Project Profile
            </button>
          </div>
        </header>

        {/* Scrollable central view */}
        <div className="flex-1 overflow-y-auto px-6 py-6 pb-20">
          
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
            />
          )}

          {activeTab === 'docs' && (
            <DocManagerTab 
              activeProject={activeProject}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'daily' && (
            <DailyTrackerTab 
              projects={projects}
              activeUser={activeUser}
              currentUser={currentUser}
              activeProject={activeProject}
              employees={userProfiles.map(u => u.name)}
            />
          )}

          {activeTab === 'leaves' && (
            <LeaveTrackerTab 
              leaves={leaves}
              setLeaves={setLeaves}
              activeUser={activeUser}
              currentUser={currentUser}
              employees={userProfiles.map(u => u.name)}
            />
          )}

          {activeTab === 'finance' && (
            <FinanceHubTab 
              transactions={transactions}
              setTransactions={setTransactions}
              activeProject={activeProject}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'projects' && (
            <SettingsTab 
              activeUser={activeUser} 
              activeProject={activeProject}
              setActiveProject={setActiveProject}
              epics={epics}
              setEpics={setEpics}
              currentUser={currentUser}
              userProfiles={userProfiles}
              setUserProfiles={setUserProfiles}
              projects={projects}
              setProjects={setProjects}
              view="projects"
            />
          )}

          {activeTab === 'users' && (
            <SettingsTab 
              activeUser={activeUser} 
              activeProject={activeProject}
              setActiveProject={setActiveProject}
              epics={epics}
              setEpics={setEpics}
              currentUser={currentUser}
              userProfiles={userProfiles}
              setUserProfiles={setUserProfiles}
              projects={projects}
              setProjects={setProjects}
              view="users"
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab 
              activeUser={activeUser} 
              activeProject={activeProject}
              setActiveProject={setActiveProject}
              epics={epics}
              setEpics={setEpics}
              currentUser={currentUser}
              userProfiles={userProfiles}
              setUserProfiles={setUserProfiles}
              projects={projects}
              setProjects={setProjects}
              view="webhooks"
            />
          )}

        </div>

        {/* AGILE DETAILS DRAWER */}
        {selectedItem && (
          <DetailsDrawer 
            item={selectedItem}
            itemType={selectedItemType}
            epics={epics}
            onClose={() => setSelectedItem(null)}
            onUpdate={handleUpdateItem}
            onDelete={handleDeleteItem}
            activeUser={activeUser}
            currentUser={currentUser}
          />
        )}

      </div>

      {/* ADD PROJECT MODAL */}
      {showAddProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider dark:text-white">
                Initialize Project Profile
              </h3>
              <button onClick={() => setShowAddProject(false)} className="text-slate-400 hover:text-slate-650">
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
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
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
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
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
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950"
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
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                >
                  <option value="delivery">Active Project Delivery (Implementation)</option>
                  <option value="maintenance">SLA Project Maintenance (Ongoing Support)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-5 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddProject(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-850"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-md shadow-indigo-100 dark:shadow-none"
                >
                  Create Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
