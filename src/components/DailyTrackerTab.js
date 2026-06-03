import { useState, useEffect } from 'react';
import { 
  Calendar, CheckCircle, AlertOctagon, HelpCircle, Clock, Send, Trash2, ShieldAlert
} from 'lucide-react';

export default function DailyTrackerTab({ 
  projects, 
  activeUser, 
  activeProject,
  employees = []
}) {
  const [logs, setLogs] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [hoursSpent, setHoursSpent] = useState(8);
  const [status, setStatus] = useState('completed');
  const [blockers, setBlockers] = useState('');
  const [submitting, setSubmitting] = useState(false);
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
      console.error(e);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!taskDescription.trim()) return;
    if (!projectId) {
      alert("Please select a project.");
      return;
    }

    setSubmitting(true);
    const todayStr = new Date().toISOString().split('T')[0];

    const newLog = {
      employeeName: activeUser,
      date: todayStr,
      projectId: projectId,
      taskDescription: taskDescription,
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
        setTaskDescription('');
        setBlockers('');
        setStatus('completed');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLog = async (logId) => {
    if (!confirm("Are you sure you want to delete this log entry?")) return;
    try {
      const response = await fetch(`/api/logs?id=${logId}`, {
        method: 'DELETE'
      });
      const res = await response.json();
      if (res.success) {
        setLogs(prev => prev.filter(l => l._id !== logId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* ─── LEFT PANEL: LOG DAILY ACTIVITY FORM ─── */}
      <div className="apple-card p-5 h-fit">
        <h4 className="text-sm font-bold text-slate-850 dark:text-slate-100 mb-4 uppercase tracking-wider">
          Daily Standup Log ({activeUser})
        </h4>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Project Selector */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Project
            </label>
            <select
              value={projectId}
              onChange={e => setProjectId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:focus:bg-slate-900"
              required
            >
              <option value="">Select Project...</option>
              {projects.map(p => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Description of work */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              What did you work on today?
            </label>
            <textarea
              placeholder="Describe tasks completed, debugging done, meetings attended..."
              value={taskDescription}
              onChange={e => setTaskDescription(e.target.value)}
              rows="4"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:focus:bg-slate-900"
              required
            />
          </div>

          {/* Row of status and hours */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* Hours spent */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Hours Spent
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                value={hoursSpent}
                onChange={e => setHoursSpent(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-750 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-350 dark:focus:bg-slate-900"
                required
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Status
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:focus:bg-slate-900"
                required
              >
                <option value="completed">Completed</option>
                <option value="in-progress">In Progress</option>
                <option value="blocked">Blocked ⚠️</option>
              </select>
            </div>

          </div>

          {/* Blocker input (only if blocked) */}
          {status === 'blocked' && (
            <div className="animate-in slide-in-from-top-2 duration-150">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-rose-500 mb-1.5">
                Current Blockers / Impediments
              </label>
              <textarea
                placeholder="What is blocking you? Require support from DBAdmin, client feedback, PM?"
                value={blockers}
                onChange={e => setBlockers(e.target.value)}
                rows="2"
                className="w-full rounded-xl border border-rose-200 bg-rose-50/20 px-3 py-2 text-xs outline-none focus:border-rose-500 focus:bg-white dark:border-rose-950/40 dark:bg-rose-950/10 dark:text-rose-450 dark:focus:bg-slate-900"
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 dark:shadow-none"
          >
            <Send className="h-3.5 w-3.5" />
            {submitting ? 'Submitting...' : 'Submit Standup Log'}
          </button>

        </form>
      </div>

      {/* ─── RIGHT PANEL: ACTIVITY TIMESHEET FEED ─── */}
      <div className="lg:col-span-2 apple-card p-5 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-bold text-slate-850 dark:text-slate-100 uppercase tracking-wider">
            Daily Activities Feed
          </h4>
          
          {/* User selector filter */}
          <select
            value={filterUser}
            onChange={e => setFilterUser(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600 outline-none dark:border-slate-850 dark:bg-slate-950"
          >
            <option value="">All Team Members</option>
            {(employees.length > 0 ? employees : ["Ilyas", "Susanth", "Vishnu", "Bharath", "Tom", "Vijayan", "Babu", "Irshad", "Lyn", "Ravi"]).map(emp => (
              <option key={emp} value={emp}>{emp}</option>
            ))}
          </select>
        </div>

        {/* Timeline activity list */}
        <div className="flex-1 space-y-4 overflow-y-auto max-h-[500px] pr-1">
          {logs.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-xs text-slate-400 italic">No activity logs recorded yet.</div>
          ) : (
            logs.map((log) => {
              const formattedDate = new Date(log.date).toLocaleDateString('default', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });

              return (
                <div 
                  key={log._id}
                  className={`rounded-xl border p-4 shadow-sm relative group transition-all ${
                    log.status === 'blocked'
                      ? 'border-rose-100 bg-rose-50/10 dark:border-rose-950/30'
                      : 'border-slate-100 bg-white dark:border-slate-850'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      {/* Employee name & Project */}
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="text-xs text-slate-800 dark:text-slate-100">{log.employeeName}</strong>
                        <span className="text-[10px] text-slate-400">·</span>
                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">
                          {log.projectId ? log.projectId.name : 'Unknown Project'}
                        </span>
                      </div>
                      
                      {/* Date & hours */}
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                        <Calendar className="h-3 w-3" />
                        <span>{formattedDate}</span>
                        <span>·</span>
                        <Clock className="h-3 w-3" />
                        <span>{log.hoursSpent} Hours</span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                        log.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : log.status === 'blocked'
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-450'
                          : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400'
                      }`}>
                        {log.status === 'completed' && <CheckCircle className="h-2.5 w-2.5" />}
                        {log.status === 'blocked' && <ShieldAlert className="h-2.5 w-2.5" />}
                        {log.status}
                      </span>

                      {/* Delete log button (only show on hover) */}
                      <button
                        onClick={() => handleDeleteLog(log._id)}
                        className="opacity-0 group-hover:opacity-100 text-slate-350 hover:text-rose-600 transition-all rounded p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Task Description content */}
                  <p className="mt-2.5 text-xs text-slate-650 dark:text-slate-300 leading-relaxed font-sans">
                    {log.taskDescription}
                  </p>

                  {/* Blocker statement if blocked */}
                  {log.status === 'blocked' && log.blockers && (
                    <div className="mt-3 rounded-lg bg-rose-50/50 p-2.5 text-xs border border-rose-100 text-rose-900 dark:bg-rose-950/20 dark:border-rose-950/40 dark:text-rose-400">
                      <strong className="block text-[10px] font-bold uppercase tracking-wider text-rose-650 dark:text-rose-450">
                        Impediment Details:
                      </strong>
                      <p className="mt-0.5 leading-normal">{log.blockers}</p>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
