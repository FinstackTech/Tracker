import { useState, useRef, useEffect, Fragment } from 'react';
import { 
  Plus, Trash2, Edit2, List, Columns, Search, Filter, Check, ArrowRight, Eye, ChevronDown, ChevronRight, Calendar as CalendarIcon, Sparkles, Tag, ShieldAlert, Activity, Sparkle, User
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'not-started', label: 'Not Started', bg: '#f1f5f9', text: '#475569', dot: '#94a3b8' },
  { value: 'in-progress', label: 'In Progress', bg: '#eff6ff', text: '#2563eb', dot: '#3b82f6' },
  { value: 'in-sit', label: 'In SIT', bg: '#fef3c7', text: '#d97706', dot: '#f59e0b' },
  { value: 'in-uat', label: 'In UAT', bg: '#fdf2f8', text: '#db2777', dot: '#ec4899' },
  { value: 'on-hold', label: 'On Hold', bg: '#faf5ff', text: '#7c3aed', dot: '#a855f7' },
  { value: 'done', label: 'Done', bg: '#ecfdf5', text: '#059669', dot: '#10b981' }
];

const EMPLOYEES = ["Superadmin"];

const getOwnerBadgeStyle = (owner) => {
  const colors = {
    Superadmin: { bg: '#dbeafe', text: '#1e40af', border: '#bfdbfe' }
  };
  return colors[owner] || { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0' };
};

const getPriorityBadgeStyle = (p) => {
  const priority = String(p).toLowerCase();
  if (priority === 'critical' || priority === 'high') {
    return { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' };
  } else if (priority === 'medium') {
    return { bg: '#fef3c7', text: '#92400e', border: '#fde68a' };
  }
  return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
};

const getStatusBadgeStyle = (statusVal) => {
  const mapping = {
    'not-started': { bg: '#f1f5f9', text: '#475569', dot: '#94a3b8', border: '#e2e8f0' },
    'in-progress': { bg: '#e0f2fe', text: '#0369a1', dot: '#0284c7', border: '#bae6fd' },
    'in-sit': { bg: '#fef3c7', text: '#92400e', dot: '#d97706', border: '#fde68a' },
    'in-uat': { bg: '#fce7f3', text: '#9d174d', dot: '#db2777', border: '#fbcfe8' },
    'on-hold': { bg: '#f3e8ff', text: '#6b21a8', dot: '#7c3aed', border: '#e9d5ff' },
    'done': { bg: '#dcfce7', text: '#166534', dot: '#15803d', border: '#bbf7d0' }
  };
  return mapping[statusVal] || mapping['not-started'];
};

export default function TaskTrackerTab({ 
  tasks = [], 
  setTasks, 
  activeProject,
  onSelectItem,
  epics = [],
  currentUser,
  employees = []
}) {
  const employeesList = employees.length > 0 ? employees : EMPLOYEES;
  const [viewMode, setViewMode] = useState('list'); // 'list', 'kanban', or 'calendar'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOwner, setFilterOwner] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // Quick filters
  const [onlyMyTasks, setOnlyMyTasks] = useState(false);
  const [onlyBlocked, setOnlyBlocked] = useState(false);
  const [onlyHigh, setOnlyHigh] = useState(false);

  const [calDate, setCalDate] = useState(new Date());

  const handlePrevMonth = () => {
    setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCalDate(new Date());
  };

  const handleCreateTaskOnDate = async (dateString) => {
    const title = prompt("Enter initiative/task title:");
    if (!title) return;
    const newTaskData = {
      projectId: activeProject._id,
      title,
      type: "task",
      category: "General",
      owner: currentUser?.name || "",
      status: "not-started",
      manDays: 0,
      timeline: "TBD",
      dueDate: dateString,
      notes: ""
    };

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTaskData)
      });
      const res = await response.json();
      if (res.success) {
        setTasks(prev => [...prev, res.data]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevTotalDays = new Date(year, month, 0).getDate();
    
    const cellsList = [];
    
    // Pad prev month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevTotalDays - i;
      const prevM = month === 0 ? 11 : month - 1;
      const prevY = month === 0 ? year - 1 : year;
      cellsList.push({
        day: dayNum,
        isCurrentMonth: false,
        dateString: `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
      });
    }
    
    // Current month
    for (let i = 1; i <= totalDays; i++) {
      cellsList.push({
        day: i,
        isCurrentMonth: true,
        dateString: `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      });
    }
    
    // Next month padding
    const totalCells = cellsList.length > 35 ? 42 : 35;
    const remaining = totalCells - cellsList.length;
    for (let i = 1; i <= remaining; i++) {
      const nextM = month === 11 ? 0 : month + 1;
      const nextY = month === 11 ? year + 1 : year;
      cellsList.push({
        day: i,
        isCurrentMonth: false,
        dateString: `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      });
    }
    
    return cellsList;
  };

  const cells = getDaysInMonth(calDate);

  const [collapsedCategories, setCollapsedCategories] = useState({});
  const [editingCell, setEditingCell] = useState(null); // { taskId, field }
  const [newCatName, setNewCatName] = useState('');
  const [showAddCat, setShowAddCat] = useState(false);

  const isReadOnly = 
    currentUser?.role === 'HR' || 
    currentUser?.role === 'Sales' || 
    currentUser?.role === 'Support Member' || 
    currentUser?.role === 'Team Member';

  const getEpic = (epicId) => {
    if (!epicId) return null;
    if (typeof epicId === 'object' && epicId.name) return epicId;
    return epics.find(e => e._id === epicId);
  };

  // Filter tasks first
  const filteredTasks = tasks.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (t.notes && t.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchOwner = filterOwner ? t.owner === filterOwner : true;
    const matchStatus = filterStatus ? t.status === filterStatus : true;
    
    // Quick filters
    const matchMyTasks = onlyMyTasks ? t.owner === currentUser?.name : true;
    const matchBlocked = onlyBlocked ? t.blocked === true : true;
    const matchHigh = onlyHigh ? (t.priority === 'high' || t.priority === 'critical') : true;

    return matchSearch && matchOwner && matchStatus && matchMyTasks && matchBlocked && matchHigh;
  });

  // Group tasks by category for list view
  const categoriesMap = {};
  filteredTasks.forEach(t => {
    const cat = t.category || "General";
    if (!categoriesMap[cat]) categoriesMap[cat] = [];
    categoriesMap[cat].push(t);
  });

  const categories = Object.keys(categoriesMap);

  const handleUpdateTask = async (taskId, fields) => {
    setTasks(prev => prev.map(t => t._id === taskId ? { ...t, ...fields } : t));
    try {
      await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: taskId, ...fields })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTask = async (categoryName) => {
    const newTaskData = {
      projectId: activeProject._id,
      title: "New Initiative",
      type: "task",
      category: categoryName,
      owner: "",
      status: "not-started",
      manDays: 0,
      timeline: "TBD",
      notes: ""
    };

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTaskData)
      });
      const res = await response.json();
      if (res.success) {
        setTasks(prev => [...prev, res.data]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      const response = await fetch(`/api/tasks?id=${taskId}`, {
        method: 'DELETE'
      });
      const res = await response.json();
      if (res.success) {
        setTasks(prev => prev.filter(t => t._id !== taskId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    handleCreateTask(newCatName.trim());
    setNewCatName('');
    setShowAddCat(false);
  };

  const toggleCategoryCollapse = (cat) => {
    setCollapsedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleSelectTab = (tabId) => {
    if (tabId === 'default') {
      setViewMode('list');
      setOnlyMyTasks(false);
      setOnlyBlocked(false);
      setOnlyHigh(false);
      setFilterStatus('');
    } else if (tabId === 'board') {
      setViewMode('kanban');
    } else if (tabId === 'high') {
      setViewMode('list');
      setOnlyHigh(true);
      setOnlyMyTasks(false);
      setOnlyBlocked(false);
      setFilterStatus('');
    } else if (tabId === 'in-progress') {
      setViewMode('list');
      setFilterStatus('in-progress');
      setOnlyHigh(false);
      setOnlyMyTasks(false);
      setOnlyBlocked(false);
    } else if (tabId === 'calendar') {
      setViewMode('calendar');
    }
  };

  // Cell Editor Component
  function CellInput({ taskId, field, value, type = 'text', selectOptions = null }) {
    const [draft, setDraft] = useState(value);
    const inputRef = useRef(null);

    useEffect(() => {
      if (inputRef.current) inputRef.current.focus();
    }, []);

    const commit = () => {
      setEditingCell(null);
      if (draft !== value) {
        handleUpdateTask(taskId, { [field]: type === 'number' ? Number(draft) : draft });
      }
    };

    if (selectOptions) {
      return (
        <select
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          className="w-full rounded border border-indigo-500 bg-white p-1 text-xs outline-none shadow-sm dark:bg-slate-900"
        >
          {selectOptions.map(opt => (
            <option key={opt.value || opt} value={opt.value || opt}>
              {opt.label || opt}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        ref={inputRef}
        type={type}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') setEditingCell(null);
        }}
        className="w-full rounded border border-indigo-500 bg-white px-2 py-1 text-xs outline-none shadow-sm dark:bg-slate-900"
      />
    );
  }

  return (
    <div className="space-y-6 font-sans">
      
      {/* ─── COVER BANNER ─── */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm">
        <div className="h-44 w-full overflow-hidden relative select-none">
          <img 
            src="/notion_banner_cover.png" 
            alt="Cover banner" 
            className="w-full h-full object-cover object-center scale-[1.01]" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
        </div>
        
        <div className="px-6 pb-6 pt-12 relative">
          {/* Overlapping Emoji Icon */}
          <div className="absolute -top-10 left-6 h-20 w-20 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-4xl shadow-md dark:bg-slate-900 dark:border-slate-800 select-none">
            💼
          </div>
          
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              {activeProject?.name || "Initiatives Workspace Tracker"}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-3xl">
              Using tracker created from the Weekly AI Business & Delivery Portfolio presentation. Use this as the single source of truth for initiatives, delivery items, blockers, next steps, and weekly progress updates.
            </p>
          </div>
        </div>
      </div>

      {/* ─── CONTROLS & VIEWS TAB BAR ─── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => handleSelectTab('default')}
            className={`px-3 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              viewMode === 'list' && !onlyHigh && !filterStatus
                ? 'border-indigo-600 text-slate-900 dark:text-white font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <List className="h-3.5 w-3.5" />
            Default View
          </button>
          <button
            onClick={() => handleSelectTab('board')}
            className={`px-3 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              viewMode === 'kanban'
                ? 'border-indigo-600 text-slate-900 dark:text-white font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Columns className="h-3.5 w-3.5" />
            Board by Owner
          </button>
          <button
            onClick={() => handleSelectTab('high')}
            className={`px-3 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              viewMode === 'list' && onlyHigh
                ? 'border-indigo-600 text-slate-900 dark:text-white font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
            High Priority Actions
          </button>
          <button
            onClick={() => handleSelectTab('in-progress')}
            className={`px-3 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              viewMode === 'list' && filterStatus === 'in-progress'
                ? 'border-indigo-600 text-slate-900 dark:text-white font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Activity className="h-3.5 w-3.5 text-indigo-500" />
            In Progress
          </button>
          <button
            onClick={() => handleSelectTab('calendar')}
            className={`px-3 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              viewMode === 'calendar'
                ? 'border-indigo-600 text-slate-900 dark:text-white font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            Due Date Calendar
          </button>
        </div>

        <div className="flex items-center gap-2 justify-end">
          {/* Quick Creator */}
          {!isReadOnly && (
            <button
              onClick={() => {
                const title = prompt("Enter initiative title:");
                if (!title) return;
                handleCreateTaskOnDate(new Date().toISOString().split('T')[0]);
              }}
              className="flex items-center gap-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all"
            >
              <Plus className="h-4 w-4" />
              New
            </button>
          )}
        </div>
      </div>

      {/* ─── FILTERS & SEARCH ─── */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 dark:bg-slate-950/20">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search initiatives..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-48 rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-1.5 text-xs outline-none focus:border-indigo-500 dark:border-slate-850 dark:bg-slate-900 dark:text-slate-300"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <select
            value={filterOwner}
            onChange={e => setFilterOwner(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 outline-none dark:border-slate-850 dark:bg-slate-900"
          >
            <option value="">All Owners</option>
            {employeesList.map(emp => <option key={emp} value={emp}>{emp}</option>)}
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 outline-none dark:border-slate-850 dark:bg-slate-900"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>

          {/* Quick Filters */}
          <button
            onClick={() => setOnlyMyTasks(!onlyMyTasks)}
            className={`rounded-lg px-2 py-1 text-[10px] font-bold border transition-all ${
              onlyMyTasks 
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950/20' 
                : 'bg-white border-slate-200 text-slate-500 dark:bg-slate-900 dark:border-slate-800'
            }`}
          >
            Only Mine
          </button>
          <button
            onClick={() => setOnlyBlocked(!onlyBlocked)}
            className={`rounded-lg px-2 py-1 text-[10px] font-bold border transition-all ${
              onlyBlocked 
                ? 'bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/20' 
                : 'bg-white border-slate-200 text-slate-500 dark:bg-slate-900 dark:border-slate-800'
            }`}
          >
            Blocked ⚠️
          </button>
        </div>
      </div>

      {/* ─── LIST TABLE VIEW ─── */}
      {viewMode === 'list' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm dark:bg-slate-900 dark:border-slate-800/80">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] border-collapse text-left text-xs text-slate-600 dark:text-slate-300">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 font-bold text-slate-400 dark:border-slate-850 dark:bg-slate-950/40">
                  <th className="px-4 py-3 min-w-[280px]">Initiative</th>
                  <th className="px-4 py-3 w-40">Epic / Workstream</th>
                  <th className="px-4 py-3 w-40">Status</th>
                  <th className="px-4 py-3 w-36">Owner</th>
                  <th className="px-4 py-3 w-28">Priority</th>
                  <th className="px-4 py-3 w-32">Due Date</th>
                  <th className="px-4 py-3 w-24">Effort (d)</th>
                  <th className="px-4 py-3 w-24">SP (SP)</th>
                  <th className="px-4 py-3 min-w-[220px]">Notes</th>
                  <th className="px-4 py-3 w-20 text-center sticky right-0 bg-slate-50 dark:bg-slate-950 z-10 border-l border-slate-100 dark:border-slate-800">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 && (
                  <tr>
                    <td colSpan="10" className="p-8 text-center text-slate-400 italic">No tasks match selected view.</td>
                  </tr>
                )}
                
                {categories.map((cat) => {
                  const isCollapsed = collapsedCategories[cat];
                  const catTasks = categoriesMap[cat] || [];
                  
                  return (
                    <Fragment key={cat}>
                      <tr className="bg-slate-50/50 border-y border-slate-100/80 font-bold dark:bg-slate-950/20 dark:border-slate-850">
                        <td colSpan="10" className="px-4 py-2 text-slate-600 dark:text-slate-400">
                          <button
                            onClick={() => toggleCategoryCollapse(cat)}
                            className="flex items-center gap-1.5 focus:outline-none font-bold"
                          >
                            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            <span>{cat}</span>
                            <span className="ml-2 rounded bg-slate-205 dark:bg-slate-800 px-1.5 py-0.2 text-[9px] font-black text-slate-500">
                              {catTasks.length}
                            </span>
                          </button>
                        </td>
                      </tr>

                      {!isCollapsed && catTasks.map((task) => {
                        const curStatus = STATUS_OPTIONS.find(o => o.value === task.status) || STATUS_OPTIONS[0];
                        const ownerStyle = getOwnerBadgeStyle(task.owner);
                        const priorityStyle = getPriorityBadgeStyle(task.priority);
                        const statusStyle = getStatusBadgeStyle(task.status);
                        
                        return (
                          <tr 
                            key={task._id} 
                            className="border-b border-slate-100 hover:bg-slate-50/30 group dark:border-slate-850 dark:hover:bg-slate-950/10"
                          >
                            {/* Initiative Title */}
                            <td 
                              onClick={() => !isReadOnly && setEditingCell({ taskId: task._id, field: 'title' })}
                              className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-150 cursor-text"
                            >
                              {editingCell?.taskId === task._id && editingCell?.field === 'title' ? (
                                <CellInput taskId={task._id} field="title" value={task.title} />
                              ) : (
                                <span className="hover:bg-slate-100/60 dark:hover:bg-slate-850 px-1.5 py-0.5 rounded transition-all inline-flex items-center gap-2 flex-wrap">
                                  <span className="text-sm shrink-0">{task.icon || "📄"}</span>
                                  {task.blocked && (
                                    <span className="text-[8px] font-black bg-rose-500 text-white px-1 py-0.2 rounded-sm shrink-0 animate-pulse">
                                      ⚠️ BLOCKED
                                    </span>
                                  )}
                                  <span className="truncate">{task.title || <span className="italic text-slate-450">Empty Initiative...</span>}</span>
                                </span>
                              )}
                            </td>

                            {/* Epic / Workstream */}
                            <td className="px-4 py-3">
                              {(() => {
                                const epic = getEpic(task.epicId);
                                return epic ? (
                                  <span 
                                    className="inline-block rounded px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide border"
                                    style={{ 
                                      backgroundColor: `${epic.color}15`, 
                                      color: epic.color, 
                                      borderColor: `${epic.color}35` 
                                    }}
                                  >
                                    {epic.name}
                                  </span>
                                ) : (
                                  <span className="inline-block rounded px-2 py-0.5 text-[9px] font-bold bg-slate-50 text-slate-400 border border-slate-150 dark:bg-slate-950 dark:border-slate-850">
                                    General
                                  </span>
                                );
                              })()}
                            </td>

                            {/* Status */}
                            <td className="px-4 py-3">
                              {editingCell?.taskId === task._id && editingCell?.field === 'status' ? (
                                <CellInput 
                                  taskId={task._id} 
                                  field="status" 
                                  value={task.status} 
                                  selectOptions={STATUS_OPTIONS}
                                />
                              ) : (
                                <button
                                  onClick={() => setEditingCell({ taskId: task._id, field: 'status' })}
                                  style={{ backgroundColor: statusStyle.bg, color: statusStyle.text, borderColor: statusStyle.border }}
                                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold border cursor-pointer uppercase tracking-wide"
                                >
                                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: statusStyle.dot }} />
                                  {curStatus.label}
                                </button>
                              )}
                            </td>

                            {/* Owner */}
                            <td className="px-4 py-3">
                              {editingCell?.taskId === task._id && editingCell?.field === 'owner' ? (
                                <CellInput 
                                  taskId={task._id} 
                                  field="owner" 
                                  value={task.owner} 
                                  selectOptions={["", ...employeesList]}
                                />
                              ) : (
                                <button
                                  onClick={() => setEditingCell({ taskId: task._id, field: 'owner' })}
                                  style={{ backgroundColor: ownerStyle.bg, color: ownerStyle.text, borderColor: ownerStyle.border }}
                                  className="inline-flex items-center gap-1.5 rounded px-2.5 py-0.5 text-[10px] font-extrabold border cursor-pointer"
                                >
                                  <div className="h-4 w-4 rounded-full bg-white/60 flex items-center justify-center text-[8px] font-black uppercase">
                                    {task.owner ? task.owner.charAt(0) : <User className="h-2.5 w-2.5 text-slate-500" />}
                                  </div>
                                  {task.owner || 'Assign...'}
                                </button>
                              )}
                            </td>

                            {/* Priority */}
                            <td className="px-4 py-3">
                              {editingCell?.taskId === task._id && editingCell?.field === 'priority' ? (
                                <CellInput 
                                  taskId={task._id} 
                                  field="priority" 
                                  value={task.priority || 'medium'} 
                                  selectOptions={["lowest", "low", "medium", "high", "critical"]}
                                />
                              ) : (
                                <span 
                                  onClick={() => setEditingCell({ taskId: task._id, field: 'priority' })}
                                  style={{ backgroundColor: priorityStyle.bg, color: priorityStyle.text, borderColor: priorityStyle.border }}
                                  className="inline-block rounded px-2 py-0.5 text-[10px] font-bold border uppercase tracking-wider cursor-pointer"
                                >
                                  {task.priority || 'medium'}
                                </span>
                              )}
                            </td>

                            {/* Due Date */}
                            <td className="px-4 py-3">
                              {editingCell?.taskId === task._id && editingCell?.field === 'dueDate' ? (
                                <CellInput taskId={task._id} field="dueDate" value={task.dueDate} type="date" />
                              ) : (
                                <button
                                  onClick={() => setEditingCell({ taskId: task._id, field: 'dueDate' })}
                                  className={`rounded-lg px-2 py-0.5 text-[10px] font-bold border transition-all ${
                                    task.dueDate 
                                      ? 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-950 dark:border-slate-850 font-mono' 
                                      : 'text-slate-400 hover:text-slate-600'
                                  }`}
                                >
                                  {task.dueDate ? `📅 ${task.dueDate}` : 'Add Date...'}
                                </button>
                              )}
                            </td>

                            {/* Effort (Days) */}
                            <td 
                              onClick={() => setEditingCell({ taskId: task._id, field: 'manDays' })}
                              className="px-4 py-3 cursor-text font-bold text-slate-700 dark:text-slate-300"
                            >
                              {editingCell?.taskId === task._id && editingCell?.field === 'manDays' ? (
                                <CellInput taskId={task._id} field="manDays" value={task.manDays} type="number" />
                              ) : (
                                <span className="hover:bg-slate-100/60 dark:hover:bg-slate-850 px-2 py-0.5 rounded">
                                  {task.manDays || 0}
                                </span>
                              )}
                            </td>

                            {/* SP (Story Points) */}
                            <td 
                              onClick={() => setEditingCell({ taskId: task._id, field: 'storyPoints' })}
                              className="px-4 py-3 cursor-text font-black text-slate-700 dark:text-slate-350"
                            >
                              {editingCell?.taskId === task._id && editingCell?.field === 'storyPoints' ? (
                                <CellInput taskId={task._id} field="storyPoints" value={task.storyPoints} type="number" />
                              ) : (
                                <span className="hover:bg-slate-100/60 dark:hover:bg-slate-850 px-2 py-0.5 rounded flex items-center justify-center h-5 w-5 bg-slate-50 border border-slate-150 dark:bg-slate-950 dark:border-slate-850">
                                  {task.storyPoints || 0}
                                </span>
                              )}
                            </td>

                            {/* Notes */}
                            <td 
                              onClick={() => setEditingCell({ taskId: task._id, field: 'notes' })}
                              className="px-4 py-3 cursor-text text-slate-500 dark:text-slate-400"
                            >
                              {editingCell?.taskId === task._id && editingCell?.field === 'notes' ? (
                                <CellInput taskId={task._id} field="notes" value={task.notes} />
                              ) : (
                                <span className="hover:bg-slate-100/60 dark:hover:bg-slate-850 px-2 py-0.5 rounded block truncate max-w-xs" title={task.notes}>
                                  {task.notes || '-'}
                                </span>
                              )}
                            </td>

                            {/* Actions column */}
                            <td className="px-4 py-3 text-center sticky right-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-950/40 z-10 border-l border-slate-100 dark:border-slate-800">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => onSelectItem(task, 'task')}
                                  className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer"
                                  title="View Task Details"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => onSelectItem(task, 'task')}
                                  className="text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer"
                                  title="Edit Task"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task._id)}
                                  className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-500 transition-colors p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer"
                                  title="Delete Task"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {!isCollapsed && catTasks.length === 0 && (
                        <tr className="border-b border-slate-100 dark:border-slate-850">
                          <td colSpan="10" className="px-4 py-4 text-center text-slate-400 italic text-xs bg-slate-50/5">
                            No initiatives in this category.
                          </td>
                        </tr>
                      )}

                      {!isReadOnly && !isCollapsed && (
                        <tr className="bg-slate-50/10 border-b border-slate-100 dark:border-slate-850">
                          <td colSpan="10" className="px-4 py-1.5">
                            <button
                              onClick={() => handleCreateTask(cat)}
                              className="flex items-center gap-1 text-[11px] font-bold text-indigo-500 hover:text-indigo-750 transition-colors cursor-pointer"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Add Initiative
                            </button>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!isReadOnly && (
            <div className="border-t border-slate-150 bg-slate-50/50 px-4 py-3 dark:border-slate-805 dark:bg-slate-950/20">
              {showAddCat ? (
                <div className="flex items-center gap-2 animate-in slide-in-from-top-1 duration-150">
                  <input
                    type="text"
                    placeholder="Enter new Category/Workstream group name..."
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    className="rounded-lg border border-slate-205 bg-white px-3 py-1.5 text-xs outline-none focus:border-indigo-500 dark:border-slate-850 dark:bg-slate-900"
                  />
                  <button
                    onClick={handleAddCategory}
                    className="rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 text-xs font-semibold text-white cursor-pointer"
                  >
                    Add Group
                  </button>
                  <button onClick={() => setShowAddCat(false)} className="text-xs font-semibold text-slate-500 hover:underline">
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddCat(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-4 py-2 text-xs font-semibold text-slate-500 hover:border-indigo-500 hover:text-indigo-600 transition-colors dark:border-slate-800 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Add New Category / Workstream Group
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── KANBAN BOARD VIEW ─── */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {STATUS_OPTIONS.map(col => {
            const colTasks = filteredTasks.filter(t => t.status === col.value);
            
            return (
              <div 
                key={col.value}
                className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50/50 p-3 min-h-[500px] dark:border-slate-850 dark:bg-slate-950/20"
              >
                <div className="flex items-center justify-between mb-3 px-1 border-b border-slate-100/50 pb-1.5 dark:border-slate-850">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: col.dot }} />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                      {col.label}
                    </span>
                  </div>
                  <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-550 dark:bg-slate-900">
                    {colTasks.length}
                  </span>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto">
                  {colTasks.map(t => (
                    <div 
                      key={t._id}
                      onClick={() => onSelectItem(t, 'task')}
                      className="bg-white border border-slate-200/60 rounded-2xl p-3.5 shadow-[0_2px_8px_rgba(99,102,241,0.01)] hover:shadow-md dark:bg-slate-900 dark:border-slate-800/80 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-1.5 justify-between">
                        <div className="text-[9px] font-black uppercase text-indigo-500 truncate">
                          {t.category || "General"}
                        </div>
                        {t.blocked && (
                          <span className="text-[8px] font-black bg-rose-500 text-white px-1.5 py-0.2 rounded-sm shrink-0">
                            ⚠️ BLOCKED
                          </span>
                        )}
                      </div>
                      
                      <h5 className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-normal mt-1 flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm shrink-0">{t.icon || "📄"}</span>
                        {(() => {
                          const epic = getEpic(t.epicId);
                          return epic ? (
                            <span 
                              className="inline-block rounded px-1.5 py-0.5 text-[8px] font-black text-white uppercase tracking-wider"
                              style={{ backgroundColor: epic.color }}
                            >
                              {epic.name}
                            </span>
                          ) : null;
                        })()}
                        <span className="truncate">{t.title}</span>
                      </h5>

                      {t.notes && (
                        <p className="mt-2 text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                          {t.notes}
                        </p>
                      )}

                      <div className="mt-3.5 flex items-center justify-between border-t border-slate-50 pt-2.5 dark:border-slate-800">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`inline-flex rounded px-1.5 py-0.5 text-[9px] font-bold ${
                            t.owner 
                              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400' 
                              : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                          }`}>
                            {t.owner || 'Unassigned'}
                          </span>
                          
                          {t.manDays > 0 && (
                            <span className="text-[9px] font-bold text-slate-400">
                              {t.manDays}d
                            </span>
                          )}

                          {t.storyPoints > 0 && (
                            <span className="h-4.5 w-4.5 rounded-full bg-slate-50 text-[8px] font-extrabold text-slate-650 flex items-center justify-center border border-slate-200 dark:bg-slate-800 dark:border-slate-700 shrink-0" title="Story Points complexity">
                              {t.storyPoints}
                            </span>
                          )}

                          {t.dueDate && (
                            <span className="text-[8px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-450 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              📅 {t.dueDate}
                            </span>
                          )}
                        </div>

                        {!isReadOnly && (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                            <button
                              onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTask(t._id);
                              }}
                              className="rounded p-1 hover:bg-slate-100 text-slate-400 hover:text-rose-600 dark:hover:bg-slate-800 cursor-pointer"
                              title="Delete Task"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                  e.stopPropagation();
                                  const curIdx = STATUS_OPTIONS.findIndex(o => o.value === t.status);
                                  const nextIdx = (curIdx + 1) % STATUS_OPTIONS.length;
                                  handleUpdateTask(t._id, { status: STATUS_OPTIONS[nextIdx].value });
                              }}
                              className="rounded p-1 hover:bg-slate-100 text-slate-400 hover:text-indigo-600 dark:hover:bg-slate-800 cursor-pointer"
                              title="Move to Next Status"
                            >
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {colTasks.length === 0 && (
                    <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-200/80 p-4 text-[10px] text-slate-400 italic dark:border-slate-800/80 font-sans">
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── MONTHLY CALENDAR VIEW ─── */}
      {viewMode === 'calendar' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800/80 select-none">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-indigo-500" />
              <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">
                {calDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h4>
            </div>
            
            <div className="flex items-center gap-1.5">
              <button 
                onClick={handlePrevMonth}
                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs hover:bg-slate-50 font-bold dark:border-slate-800 dark:hover:bg-slate-950 cursor-pointer text-slate-500"
              >
                ◀ Prev
              </button>
              <button 
                onClick={handleToday}
                className="rounded-lg border border-slate-200 px-3 py-1 text-xs hover:bg-slate-50 font-bold dark:border-slate-800 dark:hover:bg-slate-950 cursor-pointer text-slate-500"
              >
                Today
              </button>
              <button 
                onClick={handleNextMonth}
                className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs hover:bg-slate-50 font-bold dark:border-slate-800 dark:hover:bg-slate-950 cursor-pointer text-slate-500"
              >
                Next ▶
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-800 rounded-xl overflow-hidden text-center text-[10px] font-black uppercase text-slate-400">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day} className="bg-slate-50 py-2 dark:bg-slate-950/40">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-px bg-slate-200 dark:bg-slate-800 mt-px rounded-xl overflow-hidden">
            {cells.map((cell, idx) => {
              const dayTasks = filteredTasks.filter(t => t.dueDate === cell.dateString);
              
              return (
                <div 
                  key={idx}
                  className={`bg-white min-h-[100px] p-2 flex flex-col justify-between hover:bg-slate-50/50 transition-colors dark:bg-slate-900/60 ${
                    cell.isCurrentMonth ? '' : 'opacity-40 bg-slate-50/20'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-black">
                    <span className={cell.isCurrentMonth ? 'text-slate-800 dark:text-white' : 'text-slate-400'}>
                      {cell.day}
                    </span>
                    {!isReadOnly && cell.isCurrentMonth && (
                      <button 
                        onClick={() => handleCreateTaskOnDate(cell.dateString)}
                        className="opacity-0 hover:opacity-100 hover:text-indigo-650 text-slate-350 text-[10px] font-bold p-0.5 rounded cursor-pointer"
                        title="Add task here"
                      >
                        + Add
                      </button>
                    )}
                  </div>

                  <div className="flex-1 space-y-1 mt-1 overflow-y-auto max-h-20 scrollbar-none pr-0.5">
                    {dayTasks.map(t => {
                      const epic = getEpic(t.epicId);
                      return (
                        <div 
                          key={t._id}
                          onClick={() => onSelectItem(t, 'task')}
                          className="text-[9px] font-semibold bg-indigo-50/40 hover:bg-indigo-50 border border-indigo-100/50 p-1 rounded-lg text-indigo-900 dark:bg-indigo-950/20 dark:border-indigo-900/40 dark:text-indigo-400 truncate cursor-pointer transition-all flex items-center gap-0.5"
                          title={t.title}
                        >
                          {t.icon && <span>{t.icon}</span>}
                          {epic && (
                            <span 
                              className="h-1.5 w-1.5 rounded-full shrink-0" 
                              style={{ backgroundColor: epic.color }}
                            />
                          )}
                          <span className="truncate">{t.title}</span>
                          {t.storyPoints > 0 && (
                            <span className="ml-auto font-black text-[8px] bg-indigo-100 text-indigo-700 rounded px-1 dark:bg-indigo-900">
                              {t.storyPoints}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
