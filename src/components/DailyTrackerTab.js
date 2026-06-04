import { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, CheckCircle, AlertOctagon, HelpCircle, Clock, Send, Trash2, ShieldAlert,
  ClipboardList, AlertTriangle, MessageSquare, Loader2, ChevronRight
} from 'lucide-react';

const SlackIcon = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523 2.528 2.528 0 0 1-2.522-2.523 2.528 2.528 0 0 1 2.522-2.52h2.52v2.52zm1.261 0a2.528 2.528 0 0 1 2.52-2.52h5.043a2.528 2.528 0 0 1 2.522 2.52v5.042a2.528 2.528 0 0 1-2.522 2.52H8.823a2.528 2.528 0 0 1-2.52-2.52v-5.042zM8.823 5.043a2.528 2.528 0 0 1-2.52-2.522A2.528 2.528 0 0 1 8.823 0a2.528 2.528 0 0 1 2.52 2.521v2.522h-2.52zm0 1.261a2.528 2.528 0 0 1 2.52 2.52v5.043a2.528 2.528 0 0 1-2.52 2.522H3.78a2.528 2.528 0 0 1-2.522-2.522V8.824a2.528 2.528 0 0 1 2.522-2.52h5.043zm10.135 3.764a2.528 2.528 0 0 1 2.52-2.52 2.528 2.528 0 0 1 2.522 2.52 2.528 2.528 0 0 1-2.522 2.52h-2.52v-2.52zm-1.262 0a2.528 2.528 0 0 1-2.52-2.52h-5.043a2.528 2.528 0 0 1-2.522-2.52V5.043a2.528 2.528 0 0 1 2.522-2.52h5.043a2.528 2.528 0 0 1 2.52 2.52v5.043zm-3.781 10.135a2.528 2.528 0 0 1 2.52 2.522 2.528 2.528 0 0 1-2.52-2.521 2.528 2.528 0 0 1-2.522-2.521v-2.522h2.522zm0-1.262a2.528 2.528 0 0 1-2.522-2.52v-5.043a2.528 2.528 0 0 1 2.522-2.52h5.043a2.528 2.528 0 0 1 2.522 2.52v5.043h-5.043z" />
  </svg>
);


const TEAM_MEMBERS_MOCK = ["Superadmin", "Ilyas", "Susanth", "Vishnu", "Bharath", "Tom", "Vijayan", "Babu", "Irshad", "Lyn", "Ravi"];

export default function DailyTrackerTab({ 
  projects, 
  activeUser, 
  currentUser,
  activeProject,
  employees = [],
  showToast
}) {
  const employeesList = employees.length > 0 ? employees : TEAM_MEMBERS_MOCK;
  const [logs, setLogs] = useState([]);
  
  // Split Form Fields
  const [projectId, setProjectId] = useState('');
  const [yesterdayText, setYesterdayText] = useState('');
  const [todayText, setTodayText] = useState('');
  const [hoursSpent, setHoursSpent] = useState(8);
  const [status, setStatus] = useState('completed');
  const [blockers, setBlockers] = useState('');
  const [visibility, setVisibility] = useState('Public'); // Public / Team Only
  
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [filterUser, setFilterUser] = useState('');

  // Fetch daily logs from API
  const fetchLogs = async () => {
    try {
      const url = filterUser ? `/api/logs?employeeName=${filterUser}` : '/api/logs';
      const response = await fetch(url);
      const res = await response.json();
      if (res.success) {
        setLogs(res.data);
      }
    } catch (e) {
      console.error("Failed to load daily logs", e);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterUser]);

  useEffect(() => {
    if (activeProject) {
      setProjectId(activeProject._id);
    }
  }, [activeProject]);

  // Statistics calculation for today's logs
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayLogs = logs.filter(log => log.date === todayStr);
    const totalSubmitted = new Set(todayLogs.map(l => l.employeeName)).size;
    const totalHours = todayLogs.reduce((sum, l) => sum + (l.hoursSpent || 0), 0);
    const blockerCount = todayLogs.filter(l => l.status === 'blocked').length;

    return {
      submitted: totalSubmitted,
      hours: totalHours,
      blockers: blockerCount
    };
  }, [logs]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!yesterdayText.trim() || !todayText.trim()) {
      showToast("Please detail yesterday and today achievements", "error");
      return;
    }
    if (!projectId) {
      showToast("Please select a project context", "error");
      return;
    }

    setSubmitting(true);
    const todayStr = new Date().toISOString().split('T')[0];

    // Combine Yesterday and Today text fields into taskDescription for DB compatibility
    const combinedDescription = `YESTERDAY:\n${yesterdayText.trim()}\n\nTODAY:\n${todayText.trim()}`;

    const newLog = {
      employeeName: activeUser,
      date: todayStr,
      projectId: projectId,
      taskDescription: combinedDescription,
      hoursSpent: Number(hoursSpent),
      status: status,
      blockers: status === 'blocked' ? blockers : ''
    };

    try {
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLog)
      });
      const res = await response.json();
      if (res.success) {
        setLogs(prev => [res.data, ...prev]);
        setYesterdayText('');
        setTodayText('');
        setBlockers('');
        setStatus('completed');
        showToast("Daily standup log entry created", "success");
      }
    } catch (error) {
      console.error(error);
      showToast("Error saving standup entry", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLog = async (logId) => {
    if (!confirm("Are you sure you want to permanently delete this standup log?")) return;
    try {
      const response = await fetch(`/api/logs?id=${logId}`, {
        method: 'DELETE'
      });
      const res = await response.json();
      if (res.success) {
        setLogs(prev => prev.filter(l => l._id !== logId));
        showToast("Standup entry removed from database", "success");
      }
    } catch (e) {
      console.error(e);
      showToast("Error purging standup entry", "error");
    }
  };

  // Dispatch mock summary webhook of today's activities to Slack/Teams channels
  const handleSendWebhookSummary = async () => {
    setExporting(true);
    const todayStr = new Date().toISOString().split('T')[0];
    const todayLogs = logs.filter(log => log.date === todayStr);

    if (todayLogs.length === 0) {
      showToast("No standups have been submitted today to compile.", "warning");
      setExporting(false);
      return;
    }

    const summaryDetails = {};
    todayLogs.forEach((l, idx) => {
      const projName = l.projectId ? l.projectId.name : "General Workspace";
      summaryDetails[`Log #${idx+1} (${l.employeeName})`] = `${l.status.toUpperCase()} | Project: ${projName} | Logged: ${l.hoursSpent}h\n${l.taskDescription}`;
    });

    try {
      const response = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testDispatch: true,
          actor: activeUser,
          customTitle: "DAILY STANDUP FEED SUMMARY 📢",
          customMessage: `Here is the consolidated daily standup summary for date: ${todayStr}`,
          details: {
            "Total Submissions": `${stats.submitted} Team members`,
            "Operating Hours Logged": `${stats.hours} Man-Hours`,
            "Active Blockers Flagged": `${stats.blockers} Impediments`,
            ...summaryDetails
          }
        })
      });
      const res = await response.json();
      if (res.success) {
        showToast("Consolidated Standup Summary dispatched to third-party webhooks!", "success");
      } else {
        showToast("Failed to dispatch webhook alert", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Network error dispatching webhook summary", "error");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* STANDUP METRIC SUMMARY ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Standups Logged Today", value: `${stats.submitted} Members`, desc: "Compiled team checklist", color: "text-slate-800 dark:text-white" },
          { label: "Hours Logged Today", value: `${stats.hours} Hours`, desc: "Total man-hours registered", color: "text-indigo-650 dark:text-indigo-400" },
          { label: "Flagged Impediments", value: stats.blockers, desc: "Urgent blocker flags active", color: stats.blockers > 0 ? "text-rose-600 dark:text-rose-405 font-black animate-pulse" : "text-emerald-600 dark:text-emerald-455" }
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-[0_2px_8px_rgba(99,102,241,0.01)] dark:bg-slate-900 dark:border-slate-800/80">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">{kpi.label}</span>
            <span className={`text-xl font-black mt-1.5 block ${kpi.color}`}>{kpi.value}</span>
            <span className="text-[9px] text-slate-400 block mt-0.5 font-semibold">{kpi.desc}</span>
          </div>
        ))}
      </div>

      {/* SPLIT LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT PANEL: SUBMIT STANDUP LOG FORM */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_2px_8px_rgba(99,102,241,0.01)] dark:bg-slate-900 dark:border-slate-800/80 h-fit">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3 dark:border-slate-800">
            <ClipboardList className="h-4.5 w-4.5 text-indigo-500" />
            <h4 className="text-xs font-black text-slate-805 dark:text-slate-100 uppercase tracking-wider">
              Log Daily Standup ({activeUser})
            </h4>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
            
            {/* Project Selector */}
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Project Scope Context
              </label>
              <select
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                className="w-full rounded-xl border border-slate-205 bg-slate-50/50 px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-850 dark:bg-slate-950 dark:text-slate-300 cursor-pointer"
                required
              >
                <option value="">Select Project...</option>
                {projects.map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Split Form: Yesterday accomplishments */}
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">
                Yesterday's Accomplishments
              </label>
              <textarea
                placeholder="What tasks or debugging did you accomplish yesterday? (e.g., Fixed Sanctions checks validation error)"
                value={yesterdayText}
                onChange={e => setYesterdayText(e.target.value)}
                rows="3"
                className="w-full rounded-xl border border-slate-205 bg-slate-50/50 px-3.5 py-2 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-850 dark:bg-slate-950 dark:text-slate-300 resize-none font-semibold"
                required
              />
            </div>

            {/* Split Form: Today objectives */}
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-450 mb-1.5">
                Today's Planned Focus / Objectives
              </label>
              <textarea
                placeholder="What do you plan to focus on today? (e.g., Integrate Bawatech API endpoints)"
                value={todayText}
                onChange={e => setTodayText(e.target.value)}
                rows="3"
                className="w-full rounded-xl border border-slate-205 bg-slate-50/50 px-3.5 py-2 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-850 dark:bg-slate-950 dark:text-slate-300 resize-none font-semibold"
                required
              />
            </div>

            {/* Status, Hours & Visibility row */}
            <div className="grid grid-cols-2 gap-4">
              
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Operating Hours
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  value={hoursSpent}
                  onChange={e => setHoursSpent(e.target.value)}
                  className="w-full rounded-xl border border-slate-205 bg-slate-50/50 px-3 py-2 text-xs font-bold text-slate-750 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-850 dark:bg-slate-950 dark:text-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Standup Status
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-205 bg-slate-50/50 px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-850 dark:bg-slate-950 dark:text-slate-300 cursor-pointer"
                  required
                >
                  <option value="completed">Completed Today</option>
                  <option value="in-progress">In Progress</option>
                  <option value="blocked">Blocked / Stuck ⚠️</option>
                </select>
              </div>

            </div>

            {/* Blocker details input if Blocked */}
            {status === 'blocked' && (
              <div className="animate-in slide-in-from-top-2 duration-150">
                <label className="block text-[9px] font-bold uppercase tracking-wider text-rose-500 mb-1.5">
                  Impediment / Blocker Details
                </label>
                <textarea
                  placeholder="Detail blockers (e.g., Awaiting Sanctions API endpoint deployment from client devOps team)..."
                  value={blockers}
                  onChange={e => setBlockers(e.target.value)}
                  rows="2.5"
                  className="w-full rounded-xl border border-rose-200 bg-rose-50/20 px-3.5 py-2 text-xs outline-none focus:border-rose-500 focus:bg-white dark:border-rose-950/45 dark:bg-rose-955/10 dark:text-rose-400 resize-none font-semibold"
                  required
                />
              </div>
            )}

            {/* Form submit */}
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white py-2.8 text-xs font-bold shadow-md active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              {submitting ? 'Submitting...' : 'Register Standup Log'}
            </button>

          </form>
        </div>

        {/* RIGHT PANEL: ACTIVITY TIMESHEET FEED */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_2px_8px_rgba(99,102,241,0.01)] dark:bg-slate-900 dark:border-slate-800/80 flex flex-col">
          
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-850">
            <h4 className="text-sm font-bold text-slate-850 dark:text-slate-100 uppercase tracking-wider">
              Daily Activities Registry
            </h4>
            
            <div className="flex items-center gap-2">
              {/* Webhook Summary Dispatcher */}
              <button
                onClick={handleSendWebhookSummary}
                disabled={exporting}
                className="flex items-center justify-center gap-1.5 px-3 py-1.8 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-655 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-350 dark:hover:bg-slate-900 text-[10px] font-black uppercase transition-all cursor-pointer disabled:opacity-40"
                title="Send today's summary to connected Teams/Slack"
              >
                {exporting ? (
                  <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
                ) : (
                  <SlackIcon className="h-3.5 w-3.5 text-indigo-500" />
                )}
                <span>Dispatch summary</span>
              </button>

              {/* User filter */}
              <select
                value={filterUser}
                onChange={e => setFilterUser(e.target.value)}
                className="rounded-xl border border-slate-205 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 dark:border-slate-850 dark:bg-slate-950 dark:text-slate-300 cursor-pointer"
              >
                <option value="">All Members</option>
                {employeesList.map(emp => (
                  <option key={emp} value={emp}>{emp}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Activities List timeline */}
          <div className="flex-1 space-y-4 overflow-y-auto max-h-[500px] pr-1">
            {logs.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-xs text-slate-400 italic">No activity logs recorded.</div>
            ) : (
              logs.map((log) => {
                const formattedDate = new Date(log.date).toLocaleDateString('default', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                });

                // Check if description has split format
                const hasYesterdayTodayFormat = log.taskDescription.includes('YESTERDAY:\n');
                
                let yesterdayPart = '';
                let todayPart = '';
                let defaultPart = log.taskDescription;

                if (hasYesterdayTodayFormat) {
                  const parts = log.taskDescription.split('\n\nTODAY:\n');
                  yesterdayPart = parts[0].replace('YESTERDAY:\n', '');
                  todayPart = parts[1] || '';
                }

                return (
                  <div 
                    key={log._id}
                    className={`rounded-2xl border p-4 shadow-[0_2px_8px_rgba(99,102,241,0.005)] relative group transition-all ${
                      log.status === 'blocked'
                        ? 'border-rose-100 bg-rose-50/10 dark:border-rose-955/10 dark:bg-rose-955/5'
                        : 'border-slate-100 bg-white dark:border-slate-850'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <strong className="text-xs text-slate-800 dark:text-slate-100 font-bold">{log.employeeName}</strong>
                          <span className="text-[10px] text-slate-400">·</span>
                          <span className="text-[9px] font-black text-indigo-500 uppercase tracking-wider">
                            {log.projectId ? log.projectId.name : 'General Context'}
                          </span>
                        </div>
                        
                        <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                          <Calendar className="h-3 w-3" />
                          <span>{formattedDate}</span>
                          <span>·</span>
                          <Clock className="h-3 w-3" />
                          <span>{log.hoursSpent} Hours</span>
                        </div>
                      </div>

                      {/* Status Badges */}
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide leading-none border ${
                          log.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-955/15 dark:text-emerald-400 dark:border-emerald-900/30'
                            : log.status === 'blocked'
                            ? 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-955/15 dark:text-rose-450 dark:border-rose-900/30'
                            : 'bg-indigo-50 text-indigo-755 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30'
                        }`}>
                          {log.status === 'completed' && <CheckCircle className="h-2.5 w-2.5" />}
                          {log.status === 'blocked' && <ShieldAlert className="h-2.5 w-2.5 animate-pulse" />}
                          {log.status}
                        </span>

                        {/* Delete entry */}
                        <button
                          onClick={() => handleDeleteLog(log._id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 transition-all rounded p-1 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Split description render */}
                    {hasYesterdayTodayFormat ? (
                      <div className="mt-3.5 space-y-2.5 border-t border-slate-50 pt-3 dark:border-slate-850">
                        <div className="text-xs">
                          <span className="block text-[8.5px] font-black uppercase tracking-wider text-slate-400">Accomplished Yesterday:</span>
                          <p className="mt-0.5 text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">{yesterdayPart}</p>
                        </div>
                        <div className="text-xs">
                          <span className="block text-[8.5px] font-black uppercase tracking-wider text-indigo-500">Focusing On Today:</span>
                          <p className="mt-0.5 text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">{todayPart}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
                        {defaultPart}
                      </p>
                    )}

                    {/* Blocker statement if Blocked */}
                    {log.status === 'blocked' && log.blockers && (
                      <div className="mt-3.5 rounded-xl bg-rose-50/50 p-3 text-xs border border-rose-100 text-rose-900 dark:bg-rose-955/15 dark:border-rose-950/40 dark:text-rose-400">
                        <div className="flex items-center gap-1.5 text-rose-650 dark:text-rose-450 font-black uppercase tracking-wider text-[9.5px]">
                          <AlertTriangle className="h-3.5 w-3.5 animate-pulse" />
                          <span>Flagged Impediment Blocker:</span>
                        </div>
                        <p className="mt-1 font-semibold leading-relaxed">{log.blockers}</p>
                      </div>
                    )}

                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
