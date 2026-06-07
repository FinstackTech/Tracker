import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  TrendingUp, Users, User, CheckCircle, AlertTriangle, DollarSign,
  Briefcase, Activity, Landmark, Bell, Download, Printer, CalendarRange, Clock, ShieldCheck,
  Calendar, AlertCircle
} from 'lucide-react';
import { useState } from 'react';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1', '#ec4899'];
const PRIORITY_COLORS = {
  CRITICAL: '#ef4444', // Red
  HIGH: '#f97316',     // Orange
  MEDIUM: '#f59e0b',   // Amber
  LOW: '#3b82f6',      // Blue
  LOWEST: '#64748b'    // Slate
};

export default function DashboardTab({ 
  tasks = [], 
  issues = [], 
  leaves = [], 
  transactions = [], 
  activeProject,
  activeUser,
  currentUser,
  notifications = [],
  employees = [],
  
  // Quick Standup Logger
  quickStandupTask = '',
  setQuickStandupTask,
  quickStandupHours = '8',
  setQuickStandupHours,
  quickStandupStatus = 'completed',
  setQuickStandupStatus,
  quickStandupBlockers = '',
  setQuickStandupBlockers,
  quickStandupSubmitting = false,
  handlePostQuickStandup,
  
  // OIDC Sandbox Switcher
  userProfiles = [],
  setCurrentUser,
  setActiveUser,
  fetchNotifications,
  handleResetSandbox,
  showToast
}) {
  const [exporting, setExporting] = useState(false);

  if (!activeProject) {
    return (
      <div className="flex h-60 items-center justify-center rounded-2xl border-2 border-dashed border-slate-205 p-8 dark:border-slate-800">
        <div className="text-center text-slate-500">Please select or add a project from the top menu.</div>
      </div>
    );
  }

  // ─── 1. COMPUTE TASK STATS ───
  const activeTasks = tasks.filter(t => t.type === 'task');
  const totalTasks = activeTasks.length;
  const completedTasks = activeTasks.filter(t => t.status === 'done').length;
  const onHoldTasks = activeTasks.filter(t => t.status === 'on-hold').length;
  const inProgressTasks = activeTasks.filter(t => t.status === 'in-progress' || t.status === 'in-sit' || t.status === 'in-uat').length;
  const openTasks = totalTasks - completedTasks;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalAssignedTasks = activeTasks.filter(t => t.owner && t.owner.trim() !== '').length;
  const myAssignedTasks = activeTasks.filter(t => t.owner && activeUser && t.owner.toLowerCase() === activeUser.toLowerCase()).length;
  const pendingOrBlockedTasks = activeTasks.filter(t => t.blocked || t.status === 'on-hold').length;
  const dueDateAlertsCount = activeTasks.filter(t => {
    if (t.status === 'done' || !t.dueDate) return false;
    const due = new Date(t.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3;
  }).length;

  // ─── 2. COMPUTE WORKLOAD DATA (for Recharts) ───
  const workloadMap = {};
  activeTasks.forEach(t => {
    const owner = t.owner || "Unassigned";
    if (!workloadMap[owner]) {
      workloadMap[owner] = { name: owner, openTasks: 0, manDays: 0 };
    }
    if (t.status !== 'done') {
      workloadMap[owner].openTasks += 1;
    }
    workloadMap[owner].manDays += t.manDays || 0;
  });
  const workloadData = Object.values(workloadMap);

  // ─── 3. COMPUTE FINANCIAL STATS ───
  const projTrans = transactions.filter(t => t.projectId?._id === activeProject._id || t.projectId === activeProject._id);
  const revenueTrans = projTrans.filter(t => t.type === 'revenue');
  const expenseTrans = projTrans.filter(t => t.type === 'expense');

  const totalContracted = revenueTrans.reduce((sum, t) => sum + t.amount, 0);
  const invoicedAndPaid = revenueTrans.reduce((sum, t) => sum + t.paid, 0);
  const outstandingRevenue = totalContracted - invoicedAndPaid;
  
  const totalExpenses = expenseTrans.reduce((sum, t) => sum + t.amount, 0);
  const projectMargin = totalContracted - totalExpenses;
  const marginPct = totalContracted > 0 ? Math.round((projectMargin / totalContracted) * 100) : 0;

  const expenseMap = {};
  expenseTrans.forEach(t => {
    const cat = t.category || "Other";
    expenseMap[cat] = (expenseMap[cat] || 0) + t.amount;
  });
  const expenseData = Object.entries(expenseMap).map(([name, value]) => ({ name, value }));

  // ─── 4. AGILE SPRINT BURNDOWN STATS ───
  const totalStoryPoints = activeTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const completedStoryPoints = activeTasks.filter(t => t.status === 'done').reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const openStoryPoints = totalStoryPoints - completedStoryPoints;
  const storyPointsPct = totalStoryPoints > 0 ? Math.round((completedStoryPoints / totalStoryPoints) * 100) : 0;

  // ─── 5. BUG BACKLOG STATS ───
  const activeBugs = issues.filter(i => i.status !== 'resolved' && i.status !== 'closed');
  const bugPriorities = { critical: 0, high: 0, medium: 0, low: 0, lowest: 0 };
  activeBugs.forEach(bug => {
    const p = bug.priority || 'medium';
    if (bugPriorities[p] !== undefined) {
      bugPriorities[p]++;
    }
  });
  const bugPriorityData = Object.entries(bugPriorities).map(([priority, count]) => ({
    name: priority.toUpperCase(),
    Count: count,
    fill: PRIORITY_COLORS[priority.toUpperCase()]
  }));

  // ─── 6. DYNAMIC LEAVE OVERLAP / CRUNCH DETECTOR ───
  const leaveAlerts = [];
  const monthlyLeaves = {};

  leaves.forEach(l => {
    if (!l.startDate || !l.endDate) return;
    const start = new Date(l.startDate);
    const end = new Date(l.endDate);
    
    let current = new Date(start.getFullYear(), start.getMonth(), 1);
    const last = new Date(end.getFullYear(), end.getMonth(), 1);
    
    while (current <= last) {
      const yearMonth = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyLeaves[yearMonth]) {
        monthlyLeaves[yearMonth] = new Set();
      }
      monthlyLeaves[yearMonth].add(l.employeeName);
      current.setMonth(current.getMonth() + 1);
    }
  });

  Object.entries(monthlyLeaves).forEach(([month, employeesSet]) => {
    const list = Array.from(employeesSet);
    if (list.length >= 2) {
      const dateObj = new Date(month + '-01');
      const monthName = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
      
      let hasTimelineCrunch = list.length >= 3;
      
      leaveAlerts.push({
        month: monthName,
        monthKey: month,
        employees: list,
        isCritical: hasTimelineCrunch
      });
    }
  });

  // ─── 7. SCHEDULER DATE MATRIX GENERATION ───
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIdx = now.getMonth();
  const currentMonthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(currentYear, currentMonthIdx + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // List of active employees to map in horizontal scheduler
  const baseEmployees = employees.length > 0 ? employees : ["Superadmin"];
  const schedulerEmployees = Array.from(new Set([
    ...baseEmployees,
    ...leaves.map(l => l.employeeName)
  ])).slice(0, 10);

  const checkLeaveOnDay = (empName, day) => {
    const targetDate = new Date(currentYear, currentMonthIdx, day);
    targetDate.setHours(0,0,0,0);
    return leaves.some(l => {
      if (l.employeeName !== empName) return false;
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      start.setHours(0,0,0,0);
      end.setHours(23,59,59,999);
      return targetDate >= start && targetDate <= end;
    });
  };

  const getMilestonesOnDay = (day) => {
    const targetDateStr = `${currentYear}-${String(currentMonthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const taskCount = tasks.filter(t => t.dueDate === targetDateStr).length;
    const issueCount = issues.filter(i => i.dueDate === targetDateStr).length;
    return taskCount + issueCount;
  };

  // ─── 8. REPORT EXPORTING FUNCTIONS ───
  const exportTasksToCSV = () => {
    const headers = ["ID", "Title", "Owner", "Status", "Story Points", "Due Date", "Blocked"];
    const rows = tasks.map(t => [
      t._id || '',
      t.title || '',
      t.owner || 'Unassigned',
      t.status || 'not-started',
      t.storyPoints || 0,
      t.dueDate || '',
      t.blocked ? 'Yes' : 'No'
    ]);
    downloadCSV(`${activeProject.code}-tasks-report.csv`, headers, rows);
  };

  const exportIssuesToCSV = () => {
    const headers = ["ID", "Title", "Type", "Priority", "Status", "Assignee", "Due Date", "Blocked"];
    const rows = issues.map(i => [
      i._id || '',
      i.title || '',
      i.type || 'bug',
      i.priority || 'medium',
      i.status || 'open',
      i.assignee || 'Unassigned',
      i.dueDate || '',
      i.blocked ? 'Yes' : 'No'
    ]);
    downloadCSV(`${activeProject.code}-issues-report.csv`, headers, rows);
  };

  const exportFinancialsToCSV = () => {
    const headers = ["Date", "Type", "Category", "Description", "Amount", "Paid/Invoiced", "Status"];
    const rows = projTrans.map(t => [
      t.date || '',
      t.type || '',
      t.category || '',
      t.description || '',
      t.amount || 0,
      t.paid || 0,
      t.status || ''
    ]);
    downloadCSV(`${activeProject.code}-financials-report.csv`, headers, rows);
  };

  const downloadCSV = (filename, headers, rows) => {
    const escapeCSV = (val) => {
      if (val === undefined || val === null) return '""';
      let str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.map(escapeCSV).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter personal
  return (
    <div className="space-y-6 animate-in fade-in-30 duration-200">
      
      {/* ─── BENTO GRID LAYOUT ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        
        {/* Item 1 (Col span 2): Project Delivery Progress */}
        <div className="lg:col-span-2 bg-white border border-slate-200/60 rounded-2xl p-5 shadow-[0_2px_8px_rgba(99,102,241,0.01)] dark:bg-slate-900 dark:border-slate-800/80 hover:scale-[1.01] transition-all duration-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Project Delivery</span>
              <h3 className="mt-1 font-sans text-2xl font-black text-slate-800 dark:text-white leading-tight">{completionPercentage}%</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50/50 text-indigo-605 dark:bg-indigo-950/30 dark:text-indigo-405">
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className="h-full bg-indigo-650 transition-all duration-500" style={{ width: `${completionPercentage}%` }} />
            </div>
            <div className="mt-3 flex justify-between text-[9px] font-black uppercase text-slate-400 tracking-wider">
              <span className="text-indigo-605 dark:text-indigo-450">{completedTasks} Completed Tasks</span>
              <span>{openTasks} Open Tasks</span>
            </div>
          </div>
        </div>

        {/* Item 2 (Col span 1): Open Backlog Status count */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-[0_2px_8px_rgba(99,102,241,0.01)] dark:bg-slate-900 dark:border-slate-800/80 hover:scale-[1.01] transition-all duration-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Open Backlog</span>
              <h3 className="mt-1 font-sans text-2xl font-black text-slate-800 dark:text-white leading-tight">{openTasks}</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50/50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-405">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-1.5 text-[9px] font-black uppercase text-slate-400 tracking-wider">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-indigo-500" /> In Dev/SIT</span>
              <strong className="text-slate-700 dark:text-slate-300">{inProgressTasks}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Blocked</span>
              <strong className="text-rose-600 dark:text-rose-400">{pendingOrBlockedTasks}</strong>
            </div>
          </div>
        </div>

        {/* Item 3 (Col span 1): Due Date Alerts block */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-[0_2px_8px_rgba(99,102,241,0.01)] dark:bg-slate-900 dark:border-slate-800/80 hover:scale-[1.01] transition-all duration-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Due Date Alerts</span>
              <h3 className="mt-1 font-sans text-2xl font-black text-rose-600 dark:text-rose-455 leading-tight">{dueDateAlertsCount}</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50/50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-1.5 text-[9px] font-black uppercase text-slate-400 tracking-wider">
            <div className="flex items-center justify-between">
              <span>Within 3 Days</span>
              <strong className="text-rose-600 dark:text-rose-400">{dueDateAlertsCount} Tasks</strong>
            </div>
          </div>
        </div>

        {/* Item 2: My Assigned Tasks */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-[0_2px_8px_rgba(99,102,241,0.01)] dark:bg-slate-900 dark:border-slate-800/80 hover:scale-[1.01] transition-all duration-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">My Assigned</span>
              <h3 className="mt-1 font-sans text-2xl font-black text-slate-800 dark:text-white leading-tight">{myAssignedTasks}</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50/50 text-indigo-650 dark:bg-indigo-955/30 dark:text-indigo-405">
              <User className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[9px] text-indigo-550 dark:text-indigo-400 font-black uppercase mt-4 tracking-wider truncate">For {activeUser}</p>
        </div>

        {/* Item 3: Timeline Warnings */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-[0_2px_8px_rgba(99,102,241,0.01)] dark:bg-slate-900 dark:border-slate-800/80 hover:scale-[1.01] transition-all duration-200 flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Timeline Warnings</h4>
              <p className="text-[9px] font-black text-slate-850 dark:text-slate-100 uppercase tracking-wider">Leave overlap risks</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50/55 text-amber-600 dark:bg-amber-955/20 dark:text-amber-455">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="space-y-2 flex-1 overflow-y-auto max-h-[80px] pr-1 mt-2 scrollbar-thin">
            {leaveAlerts.length === 0 ? (
              <div className="text-[10px] text-slate-400 font-medium py-2 flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                No conflicts detected.
              </div>
            ) : (
              leaveAlerts.slice(0, 2).map((alert, i) => (
                <div key={i} className={`p-2 rounded-xl border text-[9px] font-bold ${alert.isCritical ? 'border-rose-100 bg-rose-50/50 text-rose-900 dark:border-rose-950/30 dark:bg-rose-955/10 dark:text-rose-455' : 'border-amber-100 bg-amber-50/50 text-amber-900 dark:border-amber-950/30 dark:bg-amber-955/10 dark:text-amber-400'}`}>
                  <div className="flex items-center gap-1">
                    <span className={`px-1 rounded text-[7px] font-black uppercase ${alert.isCritical ? 'bg-rose-150 text-rose-700 dark:bg-rose-950 dark:text-rose-400' : 'bg-amber-150 text-amber-700 dark:bg-amber-950 dark:text-amber-400'}`}>{alert.isCritical ? 'Critical' : 'Overlap'}</span>
                    <strong className="underline">{alert.month.split(' ')[0]}</strong>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Item 4: Quick Standup Logger */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-[0_2px_8px_rgba(99,102,241,0.01)] dark:bg-slate-900 dark:border-slate-800/80 hover:scale-[1.01] transition-all duration-200 flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between mb-1.5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Daily Updates</span>
              <h4 className="font-sans text-xs font-black text-slate-850 dark:text-slate-100 uppercase tracking-wider">Quick Standup</h4>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-indigo-655 dark:bg-slate-950/40 dark:text-indigo-405">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="text-[8.5px] font-bold text-slate-400 mt-1.5 leading-snug">
            Logging for: <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{activeProject ? `${activeProject.code} - ${activeProject.name}` : 'None (select workspace)'}</span>
          </div>
          <form onSubmit={handlePostQuickStandup} className="space-y-2 mt-2">
            <textarea placeholder="Completed task?" value={quickStandupTask} onChange={e => setQuickStandupTask(e.target.value)} rows="1" className="w-full rounded-xl border border-slate-200 bg-white/70 px-2 py-1 text-[9px] outline-none focus:border-indigo-500 dark:border-slate-850 dark:bg-slate-950/50 dark:text-slate-350 font-semibold" required />
            <div className="grid grid-cols-2 gap-1.5">
              <input type="number" placeholder="Hours" value={quickStandupHours} onChange={e => setQuickStandupHours(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white/70 px-1.5 py-0.5 text-[9px] text-center font-black dark:border-slate-850 dark:bg-slate-955/50 dark:text-slate-300" min="1" max="24" />
              <select value={quickStandupStatus} onChange={e => setQuickStandupStatus(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white/70 px-1 py-0.5 text-[9px] font-bold dark:border-slate-850 dark:bg-slate-950/50 dark:text-slate-300 cursor-pointer">
                <option value="completed">Done</option>
                <option value="in-progress">In Dev</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
            <button type="submit" disabled={quickStandupSubmitting} className="w-full rounded-xl bg-indigo-650 hover:bg-indigo-755 text-white font-bold py-1 text-[9px] uppercase tracking-wider cursor-pointer shadow-sm disabled:opacity-50 transition-colors">
              {quickStandupSubmitting ? 'Posting...' : 'Log Update'}
            </button>
          </form>
        </div>
        {/* Agile Complexity Progress circular gauge (Col span 1) */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-[0_2px_8px_rgba(99,102,241,0.01)] dark:bg-slate-900 dark:border-slate-800/80 hover:scale-[1.01] transition-all duration-200 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-black text-slate-850 dark:text-slate-100 mb-1 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-indigo-500" />
              Agile Complexity
            </h4>
            <p className="text-[9px] text-slate-400">Target vs Burned SP complexity</p>
          </div>

          <div className="flex flex-col items-center justify-center py-2 select-none">
            <div className="relative flex items-center justify-center h-28 w-28">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r="44"
                  className="stroke-slate-100 dark:stroke-slate-800"
                  strokeWidth="7"
                  fill="transparent"
                />
                <circle
                  cx="56"
                  cy="56"
                  r="44"
                  className="stroke-indigo-600 transition-all duration-500 ease-out dark:stroke-indigo-550"
                  strokeWidth="7"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 44}
                  strokeDashoffset={2 * Math.PI * 44 - (storyPointsPct / 100) * 2 * Math.PI * 44}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center flex flex-col items-center justify-center">
                <span className="text-xl font-black text-slate-800 dark:text-white leading-none">{storyPointsPct}%</span>
                <span className="text-[7px] font-black uppercase text-slate-400 mt-0.5 tracking-wider">Burned</span>
              </div>
            </div>

            <div className="w-full mt-4 grid grid-cols-3 gap-1 text-center text-[9px] font-black uppercase tracking-wider">
              <div className="bg-slate-50 dark:bg-slate-955/40 p-1.5 rounded-lg border border-slate-100 dark:border-slate-850">
                <span className="text-[7px] font-bold text-slate-400 block mb-0.5">Target</span>
                <strong className="text-slate-800 dark:text-slate-205">{totalStoryPoints}</strong>
              </div>
              <div className="bg-emerald-50/30 dark:bg-emerald-955/15 p-1.5 rounded-lg border border-emerald-100/50 dark:border-emerald-900/20">
                <span className="text-[7px] font-bold text-emerald-500 block mb-0.5">Done</span>
                <strong className="text-emerald-700 dark:text-emerald-400">{completedStoryPoints}</strong>
              </div>
              <div className="bg-rose-50/30 dark:bg-rose-955/15 p-1.5 rounded-lg border border-rose-100/50 dark:border-rose-900/20">
                <span className="text-[7px] font-bold text-rose-500 block mb-0.5">Open</span>
                <strong className="text-rose-700 dark:text-rose-455">{openStoryPoints}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Item 7 (Col span 3): Resource workload effort bar chart */}
        <div className="lg:col-span-3 bg-white border border-slate-200/60 rounded-2xl p-5 shadow-[0_2px_8px_rgba(99,102,241,0.01)] dark:bg-slate-900 dark:border-slate-800/80 hover:scale-[1.005] transition-all duration-200 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-black text-slate-850 dark:text-slate-100 mb-4 uppercase tracking-wider flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-500" />
              Resource Workload & Effort (Man-Days)
            </h4>
          </div>
          {workloadData.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-xs text-slate-400 italic">No active allocations found.</div>
          ) : (
            <div className="h-64 select-none font-sans mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workloadData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} stroke="#94a3b8" />
                  <YAxis fontSize={10} tickLine={false} axisLine={false} stroke="#94a3b8" />
                  <Tooltip 
                    cursor={{ fill: 'rgba(99, 102, 241, 0.03)' }} 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      fontSize: '11px', 
                      background: 'rgba(15, 23, 42, 0.9)', 
                      border: 'none',
                      color: '#fff',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }} 
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px', fontWeight: 'bold' }} />
                  <Bar dataKey="openTasks" name="Open Tasks Count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="manDays" name="Total Effort (Days)" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Item 8 (Col span 1): Cost Breakdown pie chart */}
        <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-[0_2px_8px_rgba(99,102,241,0.01)] dark:bg-slate-900 dark:border-slate-800/80 hover:scale-[1.01] transition-all duration-200 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-black text-slate-850 dark:text-slate-100 mb-4 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              Operational Cost
            </h4>
          </div>
          {expenseData.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-xs text-slate-400 italic">No expense records logged.</div>
          ) : (
            <div className="h-64 flex flex-col justify-between select-none mt-2">
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseData}
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {expenseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '12px', 
                        fontSize: '11px', 
                        background: 'rgba(15, 23, 42, 0.9)', 
                        border: 'none',
                        color: '#fff'
                      }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-slate-100 pt-3 dark:border-slate-850 max-h-[70px] overflow-y-auto scrollbar-thin">
                {expenseData.map((d, index) => (
                  <div key={index} className="flex items-center gap-1.5 truncate">
                    <span 
                      className="h-2 w-2 rounded-full shrink-0" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                    />
                    <span className="truncate text-slate-505 dark:text-slate-400 font-semibold">{d.name}:</span>
                    <strong className="text-slate-700 dark:text-slate-205">${d.value.toLocaleString()}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>



        {/* Unresolved Bug Severity (Col span 2) */}
        <div className="lg:col-span-2 bg-white border border-slate-200/60 rounded-2xl p-5 shadow-[0_2px_8px_rgba(99,102,241,0.01)] dark:bg-slate-900 dark:border-slate-800/80 hover:scale-[1.005] transition-all duration-200 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-black text-slate-850 dark:text-slate-100 mb-1 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-rose-500" />
              Unresolved Bug Severity
            </h4>
            <p className="text-[9px] text-slate-400 mb-2">Distribution of open bugs by priority severity</p>
          </div>
          
          {activeBugs.length === 0 ? (
            <div className="flex h-36 items-center justify-center text-xs text-slate-400 italic">No open bugs recorded.</div>
          ) : (
            <div className="h-36 select-none mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bugPriorityData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={9} tickLine={false} axisLine={false} stroke="#94a3b8" />
                  <YAxis fontSize={9} tickLine={false} axisLine={false} stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      fontSize: '11px', 
                      background: 'rgba(15, 23, 42, 0.9)', 
                      border: 'none',
                      color: '#fff'
                    }} 
                  />
                  <Bar dataKey="Count" fill="#f59e0b" radius={[4, 4, 0, 0]}>
                    {bugPriorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Financial Overview (Col span 2) */}
        <div className="lg:col-span-2 bg-white border border-slate-200/60 rounded-2xl p-5 shadow-[0_2px_8px_rgba(99,102,241,0.01)] dark:bg-slate-900 dark:border-slate-800/80 hover:scale-[1.01] transition-all duration-200 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-black text-slate-850 dark:text-slate-100 mb-1 uppercase tracking-wider flex items-center gap-1.5">
              <Landmark className="h-4 w-4 text-emerald-500" />
              Budget & Margin
            </h4>
            <p className="text-[9px] text-slate-400 mb-2">Contract value vs operational efficiency</p>
          </div>

          <div className="space-y-3 mt-1">
            {/* Contract Value Row */}
            <div>
              <div className="flex justify-between items-center text-[9px] font-bold uppercase text-slate-400 tracking-wider">
                <span>Contract Value</span>
                <span className="text-slate-800 dark:text-white font-extrabold">${totalContracted.toLocaleString()}</span>
              </div>
              <div className="mt-1 flex justify-between text-[8px] font-black uppercase text-slate-400 tracking-wide bg-slate-50 dark:bg-slate-950 p-1.5 rounded-lg border border-slate-100 dark:border-slate-850">
                <span className="text-emerald-600 font-bold">Paid: ${invoicedAndPaid.toLocaleString()}</span>
                <span className="text-amber-600 font-bold">Unpaid: ${outstandingRevenue.toLocaleString()}</span>
              </div>
            </div>

            {/* Net Margin Row */}
            <div>
              <div className="flex justify-between items-center text-[9px] font-bold uppercase text-slate-400 tracking-wider">
                <span>Net Margin</span>
                <span className={`font-extrabold ${projectMargin >= 0 ? 'text-indigo-650 dark:text-indigo-400' : 'text-rose-600'}`}>{marginPct}%</span>
              </div>
              <div className="mt-1 flex justify-between text-[8px] font-black uppercase text-slate-400 tracking-wide bg-slate-50 dark:bg-slate-950 p-1.5 rounded-lg border border-slate-100 dark:border-slate-850 font-semibold">
                <span>Costs: ${totalExpenses.toLocaleString()}</span>
                <span className={projectMargin >= 0 ? 'text-emerald-605' : 'text-rose-500'}>Net: ${projectMargin.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Item 9 (Col span 4): Team Availability & Milestone scheduler timeline (full-width visual bento slab) */}
        <div className="lg:col-span-4 bg-white border border-slate-200/60 rounded-2xl p-5 shadow-[0_2px_8px_rgba(99,102,241,0.01)] dark:bg-slate-900 dark:border-slate-800/80 hover:scale-[1.002] transition-all duration-200">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <CalendarRange className="h-4.5 w-4.5 text-indigo-500" />
              <div>
                <h4 className="text-xs font-black text-slate-850 dark:text-slate-100 uppercase tracking-wider">
                  Team Availability & Milestone Scheduler
                </h4>
                <p className="text-[9px] text-slate-400 mt-0.5">Horizontal roster timeline calendar for {currentMonthName}</p>
              </div>
            </div>
            <span className="text-[9px] bg-indigo-50 text-indigo-750 px-2.5 py-1 rounded-full font-black uppercase dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-100/40 dark:border-indigo-900/30">
              {daysInMonth} Days Matrix
            </span>
          </div>

          <div className="overflow-x-auto max-w-full scrollbar-thin">
            <table className="w-full text-left border-collapse select-none">
              <thead>
                <tr className="border-b border-slate-105 dark:border-slate-805">
                  <th className="pr-4 py-2 text-[9px] font-black text-slate-400 uppercase tracking-wider min-w-[140px]">Team Member</th>
                  {daysArray.map(day => {
                    const milestones = getMilestonesOnDay(day);
                    const isWeekend = new Date(currentYear, currentMonthIdx, day).getDay() % 6 === 0;
                    return (
                      <th 
                        key={day} 
                        className={`px-1 py-1.5 text-center text-[9px] font-extrabold min-w-[26px] border-r border-r-slate-100/40 dark:border-r-slate-850/40 ${
                          isWeekend ? 'bg-slate-50 text-slate-400 dark:bg-slate-900/30' : 'text-slate-600'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <span>{day}</span>
                          {milestones > 0 ? (
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" title={`${milestones} Tickets Due`} />
                          ) : (
                            <span className="h-1.5 w-1.5" />
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {schedulerEmployees.map(emp => (
                  <tr key={emp} className="hover:bg-slate-50/20 dark:hover:bg-slate-900/10">
                    <td className="py-2.5 pr-4 text-xs font-bold text-slate-850 dark:text-slate-200 flex items-center gap-2">
                      <div className="h-5.5 w-5.5 rounded-full bg-indigo-50/80 border border-indigo-100/50 text-indigo-600 flex items-center justify-center font-black text-[9px] uppercase shrink-0 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/30">
                        {emp.charAt(0)}
                      </div>
                      <span className="truncate">{emp}</span>
                    </td>
                    {daysArray.map(day => {
                      const onLeave = checkLeaveOnDay(emp, day);
                      const isWeekend = new Date(currentYear, currentMonthIdx, day).getDay() % 6 === 0;
                      return (
                        <td 
                          key={day} 
                          className={`p-0.5 text-center border-r border-slate-100/40 dark:border-slate-850/40 ${
                            isWeekend ? 'bg-slate-50/30 dark:bg-slate-955/20' : ''
                          }`}
                        >
                          {onLeave ? (
                            <div 
                              className="h-5 w-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 cursor-help shadow-sm transition-all duration-150"
                              title={`${emp} on planned leave`}
                            />
                          ) : (
                            <div className="h-5 w-full rounded-full border border-dashed border-slate-100 dark:border-slate-850/50" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-[9px] font-black uppercase text-slate-400 tracking-wider pt-3.5 border-t border-slate-100 dark:border-slate-800 select-none font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-5 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full" />
              <span>Scheduled Leave Block</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              <span>Milestone / Due Date Trigger</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-5 bg-slate-50 border border-slate-200/50 rounded-full dark:bg-slate-955 dark:border-slate-855" />
              <span>Standard Working Day</span>
            </div>
          </div>
        </div>

        {/* Item 10 (Col span 4): Alerts stream feed and report export center */}
        <div className="lg:col-span-4 grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          
          {/* Action Alerts (Col span 1) */}
          <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-[0_2px_8px_rgba(99,102,241,0.01)] dark:bg-slate-900 dark:border-slate-800/80 hover:scale-[1.005] transition-all duration-200 flex flex-col justify-between min-h-[220px]">
            <div>
              <h4 className="text-xs font-black text-slate-850 dark:text-slate-100 mb-1 uppercase tracking-wider flex items-center gap-1.5">
                <Bell className="h-4.5 w-4.5 text-indigo-500" />
                My Action Alerts
              </h4>
              <p className="text-[9px] text-slate-400 mb-3">Real-time task assignments and mentions</p>
            </div>

            <div className="space-y-2 flex-1 max-h-[140px] overflow-y-auto pr-1 scrollbar-thin">
              {notifications.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 italic flex flex-col items-center justify-center gap-2 select-none h-full justify-center">
                  <ShieldCheck className="h-7 w-7 text-indigo-500/30" />
                  <span>Zero pending alerts</span>
                </div>
              ) : (
                notifications.map(n => (
                  <div key={n._id} className="rounded-xl border border-indigo-100/40 bg-indigo-50/5 p-2 text-[9px] dark:border-indigo-950/40 dark:bg-indigo-950/10">
                    <div className="font-bold text-slate-700 dark:text-slate-350">
                      {n.actor} <span className="font-semibold text-slate-500 dark:text-slate-400">{n.message}</span>
                    </div>
                    <div className="text-[8px] text-slate-400 mt-1 flex items-center gap-1 font-semibold">
                      <Clock className="h-2 w-2" />
                      {new Date(n.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Report Export Center (Col span 2) */}
          <div className="lg:col-span-2 bg-white border border-slate-200/60 rounded-2xl p-5 shadow-[0_2px_8px_rgba(99,102,241,0.01)] dark:bg-slate-900 dark:border-slate-800/80 hover:scale-[1.005] transition-all duration-200 flex flex-col justify-between min-h-[220px]">
            <div>
              <h4 className="text-xs font-black text-slate-850 dark:text-slate-105 mb-1 uppercase tracking-wider flex items-center gap-1.5">
                <Printer className="h-4.5 w-4.5 text-emerald-500" />
                Project Reporting & Export Center
              </h4>
              <p className="text-[9px] text-slate-400 mb-3">Export raw project data worksheets or trigger print views</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 select-none mt-2">
              <button
                onClick={exportTasksToCSV}
                className="flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-150 bg-slate-50/50 hover:bg-slate-100/80 hover:scale-[1.02] active:scale-[0.98] transition-all dark:border-slate-850 dark:bg-slate-955 text-center cursor-pointer shadow-sm group duration-150"
              >
                <Download className="h-5 w-5 text-indigo-500 mb-2 transition-transform group-hover:scale-110" />
                <span className="text-[9px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide">Tasks Sheet</span>
                <span className="text-[8px] text-slate-400 mt-0.5">Download CSV</span>
              </button>

              <button
                onClick={exportIssuesToCSV}
                className="flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-150 bg-slate-50/50 hover:bg-slate-100/80 hover:scale-[1.02] active:scale-[0.98] transition-all dark:border-slate-850 dark:bg-slate-955 text-center cursor-pointer shadow-sm group duration-150"
              >
                <Download className="h-5 w-5 text-rose-500 mb-2 transition-transform group-hover:scale-110" />
                <span className="text-[9px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide">Bugs Sheet</span>
                <span className="text-[8px] text-slate-400 mt-0.5">Download CSV</span>
              </button>

              <button
                onClick={exportFinancialsToCSV}
                className="flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-150 bg-slate-50/50 hover:bg-slate-100/80 hover:scale-[1.02] active:scale-[0.98] transition-all dark:border-slate-850 dark:bg-slate-955 text-center cursor-pointer shadow-sm group duration-150"
              >
                <Download className="h-5 w-5 text-emerald-500 mb-2 transition-transform group-hover:scale-110" />
                <span className="text-[9px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide">Financials</span>
                <span className="text-[8px] text-slate-400 mt-0.5">Download CSV</span>
              </button>

              <button
                onClick={() => window.print()}
                className="flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-150 bg-slate-50/50 hover:bg-slate-100/80 hover:scale-[1.02] active:scale-[0.98] transition-all dark:border-slate-850 dark:bg-slate-955 text-center cursor-pointer shadow-sm group duration-150"
              >
                <Printer className="h-5 w-5 text-indigo-605 mb-2 transition-transform group-hover:scale-110" />
                <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">Print Layout</span>
                <span className="text-[8px] text-slate-400 mt-0.5">PDF or Paper</span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
