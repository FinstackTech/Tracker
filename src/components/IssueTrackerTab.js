import { useState, useRef, useEffect } from 'react';
import { 
  Plus, Trash2, Search, Filter, Columns, List, AlertOctagon, ShieldAlert, BadgeHelp, Bug, ArrowRight, X, Sparkles, Calendar, Tag
} from 'lucide-react';

const ISSUE_STATUSES = [
  { value: 'open', label: 'Open', bg: '#f1f5f9', text: '#475569', dot: '#94a3b8' },
  { value: 'in-progress', label: 'In Progress', bg: '#eff6ff', text: '#2563eb', dot: '#3b82f6' },
  { value: 'under-review', label: 'Under Review', bg: '#fdf4ff', text: '#c026d3', dot: '#d946ef' },
  { value: 'resolved', label: 'Resolved', bg: '#ecfdf5', text: '#059669', dot: '#10b981' },
  { value: 'closed', label: 'Closed', bg: '#f8fafc', text: '#94a3b8', dot: '#cbd5e1' }
];

const ISSUE_TYPES = [
  { value: 'bug', label: 'Bug', icon: Bug, color: '#ef4444' },
  { value: 'incident', label: 'Incident', icon: AlertOctagon, color: '#be123c' },
  { value: 'vulnerability', label: 'Security Vulnerability', icon: ShieldAlert, color: '#f97316' },
  { value: 'support', label: 'Support Request', icon: BadgeHelp, color: '#3b82f6' }
];

const PRIORITY_LEVELS = [
  { value: 'lowest', label: 'Lowest', color: '#64748b', bg: '#f8fafc' },
  { value: 'low', label: 'Low', color: '#3b82f6', bg: '#eff6ff' },
  { value: 'medium', label: 'Medium', color: '#f59e0b', bg: '#fef3c7' },
  { value: 'high', label: 'High', color: '#ef4444', bg: '#fef2f2' },
  { value: 'critical', label: 'Critical', color: '#be123c', bg: '#fff1f2' }
];

const EMPLOYEES = ["Ilyas", "Susanth", "Vishnu", "Bharath", "Tom", "Vijayan", "Babu", "Irshad", "Lyn", "Ravi"];

export default function IssueTrackerTab({ 
  issues, 
  setIssues, 
  activeProject,
  onSelectItem, 
  activeUser,
  epics = [],
  currentUser,
  employees
}) {
  const employeesList = employees || EMPLOYEES;
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterType, setFilterType] = useState('');

  // Quick Filters
  const [onlyMyIssues, setOnlyMyIssues] = useState(false);
  const [onlyBlocked, setOnlyBlocked] = useState(false);
  const [onlyHigh, setOnlyHigh] = useState(false);

  // New Issue State fields
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('bug');
  const [newPriority, setNewPriority] = useState('medium');
  const [newDesc, setNewDesc] = useState('');
  const [newAssignee, setNewAssignee] = useState('');
  const [newStoryPoints, setNewStoryPoints] = useState(0);
  const [newDueDate, setNewDueDate] = useState('');
  const [newEpicId, setNewEpicId] = useState('');
  const [newBlocked, setNewBlocked] = useState(false);

  const isReadOnly = 
    currentUser?.role === 'HR' || 
    currentUser?.role === 'Sales' || 
    currentUser?.role === 'Support Member' || 
    currentUser?.role === 'Team Member';
    
  const canDelete = 
    currentUser?.role === 'Admin' || 
    currentUser?.role === 'Head' || 
    currentUser?.role === 'Manager' || 
    currentUser?.role === 'Project Manager' || 
    currentUser?.role === 'Project Lead' || 
    currentUser?.role === 'Support Manager' || 
    currentUser?.role === 'Support Lead';

  // Helper to resolve epic
  const getEpic = (epicId) => {
    if (!epicId) return null;
    if (typeof epicId === 'object' && epicId.name) return epicId;
    return epics.find(e => e._id === epicId);
  };

  const filteredIssues = issues.filter(i => {
    const matchSearch = i.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (i.description && i.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchPriority = filterPriority ? i.priority === filterPriority : true;
    const matchType = filterType ? i.type === filterType : true;
    
    // Quick filters
    const matchMyIssues = onlyMyIssues ? i.assignee === currentUser?.name : true;
    const matchBlocked = onlyBlocked ? i.blocked === true : true;
    const matchHigh = onlyHigh ? (i.priority === 'high' || i.priority === 'critical') : true;

    return matchSearch && matchPriority && matchType && matchMyIssues && matchBlocked && matchHigh;
  });

  const handleCreateIssue = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newIssuePayload = {
      projectId: activeProject._id,
      title: newTitle.trim(),
      description: newDesc.trim(),
      type: newType,
      priority: newPriority,
      status: 'open',
      assignee: newAssignee,
      reporter: activeUser,
      storyPoints: Number(newStoryPoints),
      dueDate: newDueDate,
      epicId: newEpicId || null,
      blocked: newBlocked
    };

    try {
      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIssuePayload)
      });
      const res = await response.json();
      if (res.success) {
        setIssues(prev => [res.data, ...prev]);
        setNewTitle('');
        setNewDesc('');
        setNewAssignee('');
        setNewStoryPoints(0);
        setNewDueDate('');
        setNewEpicId('');
        setNewBlocked(false);
        setShowAddModal(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (issueId, newStatus) => {
    // 1. Local update
    setIssues(prev => prev.map(i => i._id === issueId ? { ...i, status: newStatus } : i));
    
    // 2. Database update
    try {
      await fetch('/api/issues', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: issueId, status: newStatus })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteIssue = async (issueId) => {
    if (!confirm("Delete this issue?")) return;
    try {
      const response = await fetch(`/api/issues?id=${issueId}`, {
        method: 'DELETE'
      });
      const res = await response.json();
      if (res.success) {
        setIssues(prev => prev.filter(i => i._id !== issueId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* ─── CONTROLS PANEL ─── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl bg-white border border-slate-100 p-4 dark:border-slate-800 dark:bg-slate-900">
        
        {/* Search & filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search issues..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-60 rounded-xl border border-slate-205 bg-slate-50 pl-9 pr-4 py-2 text-xs outline-none transition-all focus:border-indigo-500 focus:bg-white dark:border-slate-850 dark:bg-slate-950 dark:text-slate-350"
            />
          </div>

          <select
            value={filterPriority}
            onChange={e => setFilterPriority(e.target.value)}
            className="rounded-lg border border-slate-205 bg-slate-50 px-2 py-1.5 text-xs font-semibold text-slate-655 outline-none dark:border-slate-850 dark:bg-slate-955 dark:text-slate-350"
          >
            <option value="">All Priorities</option>
            {PRIORITY_LEVELS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>

          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="rounded-lg border border-slate-205 bg-slate-50 px-2 py-1.5 text-xs font-semibold text-slate-655 outline-none dark:border-slate-850 dark:bg-slate-955 dark:text-slate-350"
          >
            <option value="">All Types</option>
            {ISSUE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>

          {/* Jira Quick Filters */}
          <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3 dark:border-slate-800">
            <button
              onClick={() => setOnlyMyIssues(!onlyMyIssues)}
              className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold border transition-all cursor-pointer ${
                onlyMyIssues 
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/40 dark:border-indigo-900 dark:text-indigo-400' 
                  : 'bg-white border-slate-200 text-slate-500 hover:text-slate-805 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
              }`}
            >
              Only My Issues
            </button>
            <button
              onClick={() => setOnlyBlocked(!onlyBlocked)}
              className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold border transition-all cursor-pointer ${
                onlyBlocked 
                  ? 'bg-rose-50 border-rose-205 text-rose-700 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-400' 
                  : 'bg-white border-slate-200 text-slate-500 hover:text-slate-805 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
              }`}
            >
              Blocked ⚠️
            </button>
            <button
              onClick={() => setOnlyHigh(!onlyHigh)}
              className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold border transition-all cursor-pointer ${
                onlyHigh 
                  ? 'bg-amber-50 border-amber-205 text-amber-700 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-400' 
                  : 'bg-white border-slate-200 text-slate-500 hover:text-slate-805 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400'
              }`}
            >
              High / Critical 🚨
            </button>
          </div>
        </div>

        {/* View toggles & Create Button */}
        <div className="flex items-center gap-3">
          
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-950">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'kanban' 
                  ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Columns className="h-3.5 w-3.5" />
              Jira Board
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'list' 
                  ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900' 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              List View
            </button>
          </div>

          {!isReadOnly && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-650 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-100 hover:bg-indigo-750 transition-all dark:shadow-none cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              File Issue
            </button>
          )}

        </div>

      </div>

      {/* ─── KANBAN BOARD ─── */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {ISSUE_STATUSES.map(col => {
            const colIssues = filteredIssues.filter(i => i.status === col.value);
            
            return (
              <div 
                key={col.value}
                className="flex flex-col rounded-2xl border border-slate-200/60 bg-slate-50/50 p-3 min-h-[500px] dark:border-slate-800 dark:bg-slate-950/30"
              >
                {/* Column header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: col.dot }} />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                      {col.label}
                    </span>
                  </div>
                  <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:bg-slate-900">
                    {colIssues.length}
                  </span>
                </div>

                {/* Cards List */}
                <div className="flex-1 space-y-3 overflow-y-auto">
                  {colIssues.map(issue => {
                    const typeObj = ISSUE_TYPES.find(t => t.value === issue.type) || ISSUE_TYPES[0];
                    const TypeIcon = typeObj.icon;
                    const prioObj = PRIORITY_LEVELS.find(p => p.value === issue.priority) || PRIORITY_LEVELS[2];

                    return (
                      <div 
                        key={issue._id}
                        onClick={() => onSelectItem(issue, 'issue')}
                        className="apple-card p-3.5 transition-all cursor-pointer group"
                      >
                        {/* Issue Type Indicator */}
                        <div className="flex items-center gap-1.5 justify-between mb-1.5">
                          <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider">
                            <TypeIcon className="h-3.5 w-3.5 shrink-0" style={{ color: typeObj.color }} />
                            <span style={{ color: typeObj.color }}>{typeObj.label}</span>
                          </div>
                          {issue.blocked && (
                            <span className="text-[9px] font-black text-rose-500 flex items-center gap-0.5 shrink-0">
                              ⚠️ BLOCKED
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h5 className="text-xs font-semibold text-slate-850 dark:text-slate-100 leading-normal flex items-center gap-1.5 flex-wrap">
                          {issue.icon && <span className="text-sm shrink-0">{issue.icon}</span>}
                          {(() => {
                            const epic = getEpic(issue.epicId);
                            return epic ? (
                              <span 
                                className="inline-block rounded px-1.5 py-0.5 text-[8px] font-black text-white uppercase tracking-wider"
                                style={{ backgroundColor: epic.color }}
                              >
                                {epic.name}
                              </span>
                            ) : null;
                          })()}
                          <span>{issue.title}</span>
                        </h5>

                        {/* Description Snippet */}
                        {issue.description && (
                          <p className="mt-2 text-[10px] text-slate-450 line-clamp-2 leading-relaxed">
                            {issue.description}
                          </p>
                        )}

                        {/* Card Footer details */}
                        <div className="mt-3.5 flex items-center justify-between border-t border-slate-50 pt-2.5 dark:border-slate-850">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {/* Priority Label */}
                            <span 
                              className="inline-flex rounded px-1.5 py-0.5 text-[9px] font-bold"
                              style={{ backgroundColor: prioObj.bg, color: prioObj.color }}
                            >
                              {prioObj.label}
                            </span>
                            
                            {/* Assignee */}
                            <span className="text-[9px] font-bold text-slate-400">
                              {issue.assignee || 'Unassigned'}
                            </span>

                            {issue.storyPoints > 0 && (
                              <span className="h-4.5 w-4.5 rounded-full bg-slate-100 text-[8px] font-extrabold text-slate-655 flex items-center justify-center border border-slate-200 dark:bg-slate-800 dark:border-slate-700 shrink-0" title="Story Points">
                                {issue.storyPoints}
                              </span>
                            )}

                            {issue.dueDate && (
                              <span className="text-[8px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                📅 {issue.dueDate}
                              </span>
                            )}
                          </div>

                          {/* Status Shift action */}
                          {!isReadOnly && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const curIdx = ISSUE_STATUSES.findIndex(o => o.value === issue.status);
                                  const nextIdx = (curIdx + 1) % ISSUE_STATUSES.length;
                                  handleUpdateStatus(issue._id, ISSUE_STATUSES[nextIdx].value);
                                }}
                                className="rounded p-1 hover:bg-slate-100 text-slate-400 hover:text-indigo-650 dark:hover:bg-slate-850 cursor-pointer"
                                title="Move Status"
                              >
                                <ArrowRight className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {colIssues.length === 0 && (
                    <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-200/80 p-4 text-[10px] text-slate-400 italic dark:border-slate-800">
                      No issues
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ─── LIST VIEW SPREADSHEET ─── */}
      {viewMode === 'list' && (
        <div className="apple-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 font-bold text-slate-400 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/20">
                  <th className="px-4 py-3 w-36">Type</th>
                  <th className="px-4 py-3 min-w-[280px]">Issue Title</th>
                  <th className="px-4 py-3 w-28">Priority</th>
                  <th className="px-4 py-3 w-32">Status</th>
                  <th className="px-4 py-3 w-36">Assignee</th>
                  <th className="px-4 py-3 w-36">Reporter</th>
                  <th className="px-4 py-3 w-16 text-center"></th>
                </tr>
              </thead>
              <tbody>
                {filteredIssues.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-400 italic">No issues logged.</td>
                  </tr>
                ) : (
                  filteredIssues.map(issue => {
                    const typeObj = ISSUE_TYPES.find(t => t.value === issue.type) || ISSUE_TYPES[0];
                    const TypeIcon = typeObj.icon;
                    const prioObj = PRIORITY_LEVELS.find(p => p.value === issue.priority) || PRIORITY_LEVELS[2];
                    const statObj = ISSUE_STATUSES.find(s => s.value === issue.status) || ISSUE_STATUSES[0];

                    return (
                      <tr 
                        key={issue._id}
                        onClick={() => onSelectItem(issue, 'issue')}
                        className="border-b border-slate-100 hover:bg-slate-50/50 cursor-pointer dark:border-slate-850"
                      >
                        {/* Type */}
                        <td className="px-4 py-2.5 font-bold">
                          <span className="inline-flex items-center gap-1" style={{ color: typeObj.color }}>
                            <TypeIcon className="h-4 w-4" />
                            {typeObj.label}
                          </span>
                        </td>

                        {/* Title */}
                        <td className="px-4 py-2.5 font-semibold text-slate-800 dark:text-slate-100 truncate max-w-xs cursor-text">
                          <span className="hover:bg-slate-100/60 dark:hover:bg-slate-850 px-1.5 py-0.5 rounded transition-all inline-flex items-center gap-1.5 flex-wrap">
                            {issue.icon && <span className="text-sm shrink-0">{issue.icon}</span>}
                            {(() => {
                              const epic = getEpic(issue.epicId);
                              return epic ? (
                                <span 
                                  className="inline-block rounded px-1.5 py-0.5 text-[8px] font-black text-white uppercase tracking-wider"
                                  style={{ backgroundColor: epic.color }}
                                >
                                  {epic.name}
                                </span>
                              ) : null;
                            })()}
                            {issue.storyPoints > 0 && (
                              <span className="h-4 w-4 rounded-full bg-slate-100 text-[8px] font-extrabold text-slate-650 flex items-center justify-center border border-slate-200/50 dark:bg-slate-800 dark:border-slate-700 shrink-0" title="Story Points">
                                {issue.storyPoints}
                              </span>
                            )}
                            {issue.blocked && (
                              <span className="text-[9px] font-black text-rose-500 flex items-center gap-0.5 shrink-0" title="Blocked">
                                ⚠️
                              </span>
                            )}
                            <span>{issue.title}</span>
                          </span>
                        </td>

                        {/* Priority */}
                        <td className="px-4 py-2.5">
                          <span 
                            className="inline-flex rounded px-1.5 py-0.5 text-[9px] font-bold"
                            style={{ backgroundColor: prioObj.bg, color: prioObj.color }}
                          >
                            {prioObj.label}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-2.5">
                          <span 
                            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                            style={{ backgroundColor: statObj.bg + '40', color: statObj.text }}
                          >
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: statObj.dot }} />
                            {statObj.label}
                          </span>
                        </td>

                        {/* Assignee */}
                        <td className="px-4 py-2.5 text-slate-500 font-bold">{issue.assignee || 'Unassigned'}</td>

                        {/* Reporter */}
                        <td className="px-4 py-2.5 text-slate-400 font-medium">{issue.reporter || 'System'}</td>

                        {/* Actions */}
                        <td className="px-4 py-2.5 text-center">
                          {canDelete && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteIssue(issue._id);
                              }}
                              className="text-slate-350 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── FILE ISSUE MODAL ─── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md apple-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider dark:text-white">
                File Project Issue
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIssue} className="space-y-4">
              
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Issue Summary / Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Server throws 504 on document checking"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Issue Classification
                  </label>
                  <select
                    value={newType}
                    onChange={e => setNewType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-350"
                  >
                    {ISSUE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Severity Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-350"
                  >
                    {PRIORITY_LEVELS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Detailed Description
                </label>
                <textarea
                  placeholder="Provide logs, error codes, steps to reproduce..."
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  rows="3"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Story Points Complexity
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0, 1, 2, 3, 5, 8..."
                    value={newStoryPoints}
                    onChange={e => setNewStoryPoints(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Target Due Date
                  </label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={e => setNewDueDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Linked Project Epic
                  </label>
                  <select
                    value={newEpicId}
                    onChange={e => setNewEpicId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-350"
                  >
                    <option value="">No Epic Link</option>
                    {epics.map(ep => (
                      <option key={ep._id} value={ep._id}>{ep.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newBlocked}
                      onChange={e => setNewBlocked(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 h-4.5 w-4.5 cursor-pointer"
                    />
                    <span>Flag as Blocked ⚠️</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Assign To
                </label>
                <select
                  value={newAssignee}
                  onChange={e => setNewAssignee(e.target.value)}
                  className="w-full rounded-xl border border-slate-205 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                >
                  <option value="">Unassigned</option>
                  {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                </select>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-5 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-850"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-650 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-750 shadow-md shadow-indigo-100 dark:shadow-none"
                >
                  File Ticket
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
