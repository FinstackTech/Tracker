import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  TrendingUp, Users, CheckCircle, AlertTriangle, DollarSign,
  Briefcase, Activity, Landmark, Bell, Download, Printer, CalendarRange, Clock, ShieldCheck
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
  notifications = []
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
      
      let hasTimelineCrunch = false;
      if (month === '2026-08' && activeProject.code === 'ARB-EXIM') {
        hasTimelineCrunch = true;
      }
      
      leaveAlerts.push({
        month: monthName,
        monthKey: month,
        employees: list,
        isCritical: hasTimelineCrunch || list.length >= 3
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
  const schedulerEmployees = Array.from(new Set([
    "Ilyas", "Susanth", "Vishnu", "Bharath", "Tom", "Vijayan", "Babu", "Irshad", "Lyn", "Ravi",
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

  // Filter personal unread notifications
  const myNotifications = notifications.filter(n => !n.read).slice(0, 4);

  return (
    <div className="space-y-6">
      
      {/* ─── LEAVE ALERTS BANNER ─── */}
      {leaveAlerts.map((alert, i) => (
        <div 
          key={i}
          className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-2xl border p-4 shadow-sm transition-all duration-150 ${
            alert.isCritical 
              ? 'border-rose-200 bg-rose-50/50 text-rose-900 dark:border-rose-955/40 dark:bg-rose-955/20 dark:text-rose-400' 
              : 'border-amber-205 bg-amber-50/50 text-amber-900 dark:border-amber-955/40 dark:bg-amber-955/20 dark:text-amber-400'
          }`}
        >
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            alert.isCritical 
              ? 'bg-rose-100 dark:bg-rose-900/60' 
              : 'bg-amber-100 dark:bg-amber-900/60'
          }`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <span className="font-bold text-xs sm:text-sm tracking-wide">
              {alert.isCritical ? 'CRITICAL TIMELINE CRUNCH: ' : 'STAFF OVERLAP CAUTION: '}
            </span>
            <span className="text-xs sm:text-sm">
              In <strong className="underline">{alert.month}</strong>, {alert.employees.join(', ')} are planned to be on leave. 
              {alert.monthKey === '2026-08' && activeProject.code === 'ARB-EXIM' && (
                <strong> This overlaps with the mandatory SWIFT SR2026 delivery crunch! Please adjust roadmap milestone allocations.</strong>
              )}
            </span>
          </div>
        </div>
      ))}

      {/* ─── KPI METRICS BOARD ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI: Progress */}
        <div className="apple-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Project Delivery Status</span>
              <h3 className="mt-1 font-sans text-2xl font-bold text-slate-900 dark:text-white">{completionPercentage}%</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-650 dark:bg-indigo-950/40 dark:text-indigo-400">
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: `${completionPercentage}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-[10px] font-bold uppercase text-slate-405">
            <span>{completedTasks} Done</span>
            <span>{openTasks} Remaining</span>
          </div>
        </div>

        {/* KPI: Workload */}
        <div className="apple-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Open Backlog Items</span>
              <h3 className="mt-1 font-sans text-2xl font-bold text-slate-900 dark:text-white">{openTasks}</h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-955/40 dark:text-sky-400">
              <Activity className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> {inProgressTasks} In Dev</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-slate-300" /> {onHoldTasks} On Hold</span>
          </div>
        </div>

        {/* KPI: Financials Revenue */}
        <div className="apple-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Contract Value</span>
              <h3 className="mt-1 font-sans text-2xl font-bold text-slate-900 dark:text-white">
                ${totalContracted.toLocaleString()}
              </h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-955/40 dark:text-emerald-400">
              <Landmark className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex justify-between text-[10px] font-bold text-slate-500">
            <span className="text-emerald-600">Paid: ${invoicedAndPaid.toLocaleString()}</span>
            <span className="text-amber-600">Pending: ${outstandingRevenue.toLocaleString()}</span>
          </div>
        </div>

        {/* KPI: Profit Margin */}
        <div className="apple-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Operating Net Margin</span>
              <h3 className={`mt-1 font-sans text-2xl font-bold ${
                projectMargin >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600'
              }`}>
                {marginPct}%
              </h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-955/40 dark:text-violet-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex justify-between text-[10px] font-bold text-slate-500">
            <span>Expenses: ${totalExpenses.toLocaleString()}</span>
            <span className={projectMargin >= 0 ? 'text-indigo-650' : 'text-rose-650'}>
              Net: ${projectMargin.toLocaleString()}
            </span>
          </div>
        </div>

      </div>

      {/* ─── CHARTS PANEL ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Workload Effort Allocations */}
        <div className="lg:col-span-2 apple-card p-5">
          <h4 className="text-sm font-bold text-slate-850 dark:text-slate-100 mb-4 uppercase tracking-wider">
            Resource Workload & Effort (Man-Days)
          </h4>
          {workloadData.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-xs text-slate-400">No active allocations found.</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workloadData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="openTasks" name="Open Tasks Count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="manDays" name="Total Effort (Days)" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Expense Allocations */}
        <div className="apple-card p-5">
          <h4 className="text-sm font-bold text-slate-850 dark:text-slate-100 mb-4 uppercase tracking-wider">
            Operational Cost Breakdown
          </h4>
          {expenseData.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-xs text-slate-400">No expense records logged for this project.</div>
          ) : (
            <div className="h-64 flex flex-col justify-between">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {expenseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-slate-100 pt-3 dark:border-slate-800">
                {expenseData.map((d, index) => (
                  <div key={index} className="flex items-center gap-1.5 truncate">
                    <span 
                      className="h-2 w-2 rounded-full shrink-0" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                    />
                    <span className="truncate text-slate-500 dark:text-slate-400">{d.name}:</span>
                    <strong className="text-slate-700 dark:text-slate-200">${d.value.toLocaleString()}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* ─── AGILE SPRINT BURNDOWN & INCIDENT PRIORITY CHARTS ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Agile Sprint Burndown Gauge */}
        <div className="apple-card p-5 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-850 dark:text-slate-100 mb-1 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-indigo-500" />
              Agile Complexity Progress
            </h4>
            <p className="text-[10px] text-slate-400 mb-4">Compares completed vs target sprint complexity points</p>
          </div>

          <div className="flex flex-col items-center justify-center py-4">
            <div className="relative flex items-center justify-center h-28 w-28 rounded-full border-8 border-slate-100 dark:border-slate-800">
              {/* Outer Progress Ring */}
              <div 
                className="absolute inset-0 rounded-full border-8 border-indigo-650 transition-all duration-700"
                style={{
                  clipPath: `polygon(50% 50%, -50% -50%, ${storyPointsPct >= 25 ? '150% -50%' : '50% -50%'}, ${storyPointsPct >= 50 ? '150% 150%' : '50% -50%'}, ${storyPointsPct >= 75 ? '-50% 150%' : '50% -50%'}, ${storyPointsPct >= 100 ? '-50% -50%' : '50% -50%'})`
                }}
              />
              <div className="text-center">
                <span className="text-2xl font-black text-slate-850 dark:text-white leading-none">{storyPointsPct}%</span>
                <span className="block text-[8px] font-black uppercase text-slate-400 mt-0.5">Burned</span>
              </div>
            </div>

            <div className="w-full mt-6 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-slate-50 dark:bg-slate-950/40 p-2 rounded-xl border border-slate-100 dark:border-slate-850">
                <span className="text-[9px] font-bold text-slate-400 block uppercase">Target</span>
                <strong className="text-slate-800 dark:text-slate-200">{totalStoryPoints} SP</strong>
              </div>
              <div className="bg-emerald-50/30 dark:bg-emerald-950/10 p-2 rounded-xl border border-emerald-100/50 dark:border-emerald-900/20">
                <span className="text-[9px] font-bold text-emerald-500 block uppercase">Done</span>
                <strong className="text-emerald-700 dark:text-emerald-400">{completedStoryPoints} SP</strong>
              </div>
              <div className="bg-rose-50/30 dark:bg-rose-955/10 p-2 rounded-xl border border-rose-100/50 dark:border-rose-900/20">
                <span className="text-[9px] font-bold text-rose-500 block uppercase">Open</span>
                <strong className="text-rose-700 dark:text-rose-450">{openStoryPoints} SP</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Bug Backlog Priority Chart */}
        <div className="lg:col-span-2 apple-card p-5">
          <h4 className="text-sm font-bold text-slate-850 dark:text-slate-100 mb-1 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="h-4 w-4 text-rose-500" />
            Unresolved Bug Severity
          </h4>
          <p className="text-[10px] text-slate-400 mb-4">Distribution of open bugs and support incidents by priority</p>
          
          {activeBugs.length === 0 ? (
            <div className="flex h-44 items-center justify-center text-xs text-slate-400 italic">No open bugs recorded for this project.</div>
          ) : (
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bugPriorityData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '11px' }} />
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

      </div>

      {/* ─── TEAM AVAILABILITY & MILESTONE SCHEDULER TIMELINE ─── */}
      <div className="apple-card p-5">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <CalendarRange className="h-4 w-4 text-indigo-500" />
            <div>
              <h4 className="text-sm font-bold text-slate-850 dark:text-slate-100 uppercase tracking-wider">
                Team Availability & Milestone Scheduler
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Horizontal roster timeline for {currentMonthName}</p>
            </div>
          </div>
          <span className="text-[9px] bg-indigo-50 text-indigo-750 px-2 py-0.5 rounded-full font-black uppercase dark:bg-indigo-950 dark:text-indigo-400">
            {daysInMonth} Days Matrix
          </span>
        </div>

        <div className="overflow-x-auto max-w-full">
          <table className="w-full text-left border-collapse select-none">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="pr-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-wider min-w-[120px]">Team Member</th>
                {daysArray.map(day => {
                  const milestones = getMilestonesOnDay(day);
                  const isWeekend = new Date(currentYear, currentMonthIdx, day).getDay() % 6 === 0;
                  return (
                    <th 
                      key={day} 
                      className={`px-1 py-1.5 text-center text-[9px] font-bold min-w-[24px] border-r border-slate-50 dark:border-slate-850 ${
                        isWeekend ? 'bg-slate-50 text-slate-400 dark:bg-slate-950' : 'text-slate-600'
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <span>{day}</span>
                        {milestones > 0 && (
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse mt-0.5" title={`${milestones} Milestone Deliverables Due`} />
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {schedulerEmployees.map(emp => (
                <tr key={emp} className="hover:bg-slate-50/30">
                  <td className="py-2.5 pr-4 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[9px] uppercase shrink-0">
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
                        className={`p-0.5 text-center border-r border-slate-50 dark:border-slate-850 ${
                          isWeekend ? 'bg-slate-50/50 dark:bg-slate-950/40' : ''
                        }`}
                      >
                        {onLeave ? (
                          <div 
                            className="h-6 w-full rounded bg-indigo-500 hover:bg-indigo-600 cursor-help"
                            title={`${emp} on planned leave`}
                          />
                        ) : (
                          <div className="h-6 w-full rounded border border-slate-100/10 dark:border-slate-800/10" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-[9px] font-black uppercase text-slate-405 tracking-wider pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-5 bg-indigo-500 rounded" />
            <span>Scheduled Leave Block</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            <span>Milestone / Due Date Trigger</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-5 bg-slate-50 border border-slate-200 rounded dark:bg-slate-950 dark:border-slate-800" />
            <span>Standard Working Day</span>
          </div>
        </div>
      </div>

      {/* ─── NOTIFICATION FEED & REPORT EXPORT CENTER ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Notification Feed Widget */}
        <div className="lg:col-span-1 apple-card p-5 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-850 dark:text-slate-100 mb-1 uppercase tracking-wider flex items-center gap-1.5">
              <Bell className="h-4.5 w-4.5 text-indigo-500" />
              My Action Alerts
            </h4>
            <p className="text-[10px] text-slate-400 mb-4">Real-time task assignments and mentions</p>
          </div>

          <div className="space-y-2.5 flex-1 max-h-[160px] overflow-y-auto pr-1">
            {myNotifications.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 italic flex flex-col items-center justify-center gap-1">
                <ShieldCheck className="h-8 w-8 text-indigo-500/40" />
                <span>Zero pending alerts</span>
              </div>
            ) : (
              myNotifications.map(n => (
                <div key={n._id} className="rounded-xl border border-indigo-100/50 bg-indigo-50/10 p-2.5 text-[10px] dark:border-indigo-950/40">
                  <div className="font-bold text-slate-700 dark:text-slate-300">
                    {n.actor} <span className="font-medium text-slate-500">{n.message}</span>
                  </div>
                  <div className="text-[8px] text-slate-400 mt-1 flex items-center gap-1 font-semibold">
                    <Clock className="h-2.5 w-2.5" />
                    {new Date(n.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Report Export Center */}
        <div className="lg:col-span-2 apple-card p-5 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-850 dark:text-slate-100 mb-1 uppercase tracking-wider flex items-center gap-1.5">
              <Printer className="h-4.5 w-4.5 text-emerald-500" />
              Project Reporting & Export Center
            </h4>
            <p className="text-[10px] text-slate-400 mb-4">Export raw project data worksheets or trigger print views</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={exportTasksToCSV}
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-150 bg-slate-50/50 hover:bg-slate-100 hover:scale-[1.02] transition-all dark:border-slate-850 dark:bg-slate-950 text-center cursor-pointer shadow-sm"
            >
              <Download className="h-5 w-5 text-indigo-500 mb-1.5" />
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">Tasks Sheet</span>
              <span className="text-[8px] text-slate-400 mt-0.5">Download CSV</span>
            </button>

            <button
              onClick={exportIssuesToCSV}
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-150 bg-slate-50/50 hover:bg-slate-100 hover:scale-[1.02] transition-all dark:border-slate-850 dark:bg-slate-950 text-center cursor-pointer shadow-sm"
            >
              <Download className="h-5 w-5 text-rose-500 mb-1.5" />
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">Bugs Sheet</span>
              <span className="text-[8px] text-slate-400 mt-0.5">Download CSV</span>
            </button>

            <button
              onClick={exportFinancialsToCSV}
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-150 bg-slate-50/50 hover:bg-slate-100 hover:scale-[1.02] transition-all dark:border-slate-850 dark:bg-slate-950 text-center cursor-pointer shadow-sm"
            >
              <Download className="h-5 w-5 text-emerald-500 mb-1.5" />
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">Financials</span>
              <span className="text-[8px] text-slate-400 mt-0.5">Download CSV</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-150 bg-slate-50/50 hover:bg-indigo-50/10 hover:border-indigo-400/50 hover:scale-[1.02] transition-all dark:border-slate-850 dark:bg-slate-950 text-center cursor-pointer shadow-sm"
            >
              <Printer className="h-5 w-5 text-indigo-650 mb-1.5" />
              <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase">Print Layout</span>
              <span className="text-[8px] text-slate-400 mt-0.5">PDF or Paper</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
