import { useState } from 'react';
import { 
  FolderKanban, Search, Plus, List, Grid, Calendar, User, FileText, CheckCircle2, AlertCircle, PlayCircle, PlusCircle, Trash2, X, Edit, Loader2
} from 'lucide-react';

const EPIC_COLORS = [
  { hex: '#64748b', label: 'Slate' },
  { hex: '#ef4444', label: 'Red' },
  { hex: '#f97316', label: 'Orange' },
  { hex: '#f59e0b', label: 'Amber' },
  { hex: '#10b981', label: 'Green' },
  { hex: '#059669', label: 'Emerald' },
  { hex: '#0d9488', label: 'Teal' },
  { hex: '#0ea5e9', label: 'Sky' },
  { hex: '#3b82f6', label: 'Blue' },
  { hex: '#4f46e5', label: 'Indigo' },
  { hex: '#8b5cf6', label: 'Violet' },
  { hex: '#a855f7', label: 'Purple' },
  { hex: '#d946ef', label: 'Fuchsia' },
  { hex: '#ec4899', label: 'Pink' },
  { hex: '#f43f5e', label: 'Rose' }
];

export default function ProjectsTab({
  activeUser, 
  activeProject, 
  setActiveProject,
  epics = [], 
  setEpics, 
  currentUser,
  projects = [],
  setProjects,
  showToast
}) {
  const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'
  const [searchTerm, setSearchTerm] = useState('');
  const [clientFilter, setClientFilter] = useState('All');
  
  // Epics creator states
  const [epicName, setEpicName] = useState('');
  const [epicColor, setEpicColor] = useState('#4f46e5');
  const [creatingEpic, setCreatingEpic] = useState(false);

  // Edit / Creation modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null); // Holds project for side panel summary
  const [confirmDialog, setConfirmDialog] = useState(null); // delete confirmations

  // Project creator form states
  const [projName, setProjName] = useState('');
  const [projCode, setProjCode] = useState('');
  const [projClient, setProjClient] = useState('');
  const [projType, setProjType] = useState('delivery');
  const [projStatus, setProjStatus] = useState('active');
  const [projStartDate, setProjStartDate] = useState('');
  const [projEndDate, setProjEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isManagerOrAdmin = 
    currentUser?.role === 'Admin' || 
    currentUser?.role === 'Head' || 
    currentUser?.role === 'Project Manager' || 
    currentUser?.role === 'Project Lead' || 
    currentUser?.role === 'Support Manager' || 
    currentUser?.role === 'Support Lead' || 
    currentUser?.role === 'Manager';

  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Head';

  // Filters
  const uniqueClients = ['All', ...new Set(projects.map(p => p.client || 'Internal'))];

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.client.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClient = clientFilter === 'All' || p.client === clientFilter;
    return matchesSearch && matchesClient;
  });

  // KPI calculations
  const totalProjects = projects.length;
  const activeCount = projects.filter(p => p.status === 'active').length;
  const onHoldCount = projects.filter(p => p.status === 'on-hold').length;
  const pipelineCount = projects.filter(p => p.status === 'pipeline').length;
  const completedCount = projects.filter(p => p.status === 'completed').length;

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projName.trim() || !projCode.trim()) return;
    setSubmitting(true);

    const payload = {
      name: projName.trim(),
      code: projCode.trim().toUpperCase().replace(/\s+/g, '-'),
      client: projClient.trim() || 'Internal',
      type: projType,
      status: projStatus,
      startDate: projStartDate,
      endDate: projEndDate
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
        showToast(`Project "${payload.name}" successfully registered`, "success");
        
        // Reset states
        setProjName('');
        setProjCode('');
        setProjClient('');
        setProjType('delivery');
        setProjStatus('active');
        setProjStartDate('');
        setProjEndDate('');
        setShowCreateModal(false);
      } else {
        showToast(res.error || "Failed to create project", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error establishing connection to project registry", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProject = async (projId, updatedFields) => {
    try {
      const response = await fetch('/api/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: projId, ...updatedFields })
      });
      const res = await response.json();
      if (res.success) {
        setProjects(prev => prev.map(p => p._id === projId ? { ...p, ...updatedFields } : p));
        if (activeProject?._id === projId) {
          setActiveProject({ ...activeProject, ...updatedFields });
        }
        if (editingProject?._id === projId) {
          setEditingProject({ ...editingProject, ...updatedFields });
        }
        showToast("Project specifications updated", "success");
      } else {
        showToast(res.error || "Failed to sync project specs", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error updating project registry", "error");
    }
  };

  const handleDeleteProject = (proj) => {
    if (activeProject?._id === proj._id) {
      showToast("Cannot delete the active selected project workspace", "error");
      return;
    }

    setConfirmDialog({
      title: "Remove Project Workspace Permanently",
      message: `Are you sure you want to permanently purge "${proj.name}"? This will delete the workspace record. Commits and tasks associated with it may be orphaned.`,
      action: async () => {
        try {
          const response = await fetch(`/api/projects?id=${proj._id}`, { method: 'DELETE' });
          const res = await response.json();
          if (res.success) {
            setProjects(prev => prev.filter(p => p._id !== proj._id));
            showToast(`Project workspace "${proj.name}" purged`, "success");
            if (editingProject?._id === proj._id) {
              setEditingProject(null);
            }
          } else {
            showToast(res.error || "Could not delete project", "error");
          }
        } catch (err) {
          console.error(err);
          showToast("Network failure deleting project", "error");
        }
      }
    });
  };

  const handleAddEpic = async (e) => {
    e.preventDefault();
    if (!epicName.trim() || !editingProject) return;
    setCreatingEpic(true);

    try {
      const response = await fetch('/api/epics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: editingProject._id,
          name: epicName.trim(),
          color: epicColor
        })
      });
      const res = await response.json();
      if (res.success) {
        setEpics(prev => [...prev, res.data]);
        setEpicName('');
        showToast(`Epic "${res.data.name}" added to project`, "success");
      } else {
        showToast(res.error || "Failed to create epic module", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error connecting to epic services", "error");
    } finally {
      setCreatingEpic(false);
    }
  };

  const handleDeleteEpic = async (epic) => {
    setConfirmDialog({
      title: "Delete Epic Module",
      message: `Are you sure you want to delete the Epic "${epic.name}"? Tasks associated with this epic will lose their module categorization.`,
      action: async () => {
        try {
          const response = await fetch(`/api/epics?id=${epic._id}`, { method: 'DELETE' });
          const res = await response.json();
          if (res.success) {
            setEpics(prev => prev.filter(e => e._id !== epic._id));
            showToast(`Epic module "${epic.name}" removed`, "success");
          } else {
            showToast(res.error || "Failed to delete epic", "error");
          }
        } catch (err) {
          console.error(err);
          showToast("Error communicating with epic services", "error");
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      
      {/* KPI METRICS CARD GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Portfolio Projects", value: totalProjects, color: "text-slate-800 dark:text-white" },
          { label: "Active Scope", value: activeCount, color: "text-emerald-600 dark:text-emerald-455" },
          { label: "On Hold", value: onHoldCount, color: "text-amber-600 dark:text-amber-455" },
          { label: "In Pipeline", value: pipelineCount, color: "text-blue-600 dark:text-blue-455" },
          { label: "Completed", value: completedCount, color: "text-indigo-600 dark:text-indigo-405" }
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-[0_2px_8px_rgba(99,102,241,0.02)] dark:bg-slate-900 dark:border-slate-800/80">
            <span className="text-[10px] font-black uppercase text-slate-405 tracking-wider block">{kpi.label}</span>
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
            placeholder="Search code, project client, scope..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-205 rounded-xl bg-slate-50/50 outline-none text-xs focus:border-indigo-500 focus:bg-white dark:border-slate-850 dark:bg-slate-950 dark:text-slate-300 font-semibold"
          />
        </div>

        {/* Filters Toolbar */}
        <div className="flex flex-wrap items-center gap-3 w-full md:justify-end">
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Client:</span>
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="border border-slate-205 bg-white text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 dark:border-slate-850 dark:bg-slate-950 dark:text-slate-300 cursor-pointer"
            >
              {uniqueClients.map(clientName => (
                <option key={clientName} value={clientName}>{clientName}</option>
              ))}
            </select>
          </div>

          {/* Card/Table toggle */}
          <div className="flex items-center border border-slate-205 dark:border-slate-800 rounded-xl p-0.5 bg-slate-50 dark:bg-slate-950 shrink-0">
            <button
              onClick={() => setViewMode('card')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'card' 
                  ? 'bg-white dark:bg-slate-900 shadow-sm text-indigo-600 dark:text-indigo-400' 
                  : 'text-slate-400 hover:text-slate-655'
              }`}
              title="Card Portfolio View"
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table' 
                  ? 'bg-white dark:bg-slate-900 shadow-sm text-indigo-600 dark:text-indigo-400' 
                  : 'text-slate-400 hover:text-slate-655'
              }`}
              title="Table Portfolio View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {isManagerOrAdmin ? (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              New Project
            </button>
          ) : (
            <div className="text-[9px] font-extrabold uppercase text-amber-600 bg-amber-50 dark:bg-amber-955/20 border border-amber-100/50 dark:border-amber-950/20 px-3 py-2 rounded-xl flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              Locked
            </div>
          )}

        </div>
      </div>

      {/* RENDER VIEW */}
      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProjects.map((proj) => {
            const isActive = proj._id === activeProject?._id;
            return (
              <div 
                key={proj._id}
                onClick={() => setEditingProject(proj)}
                className={`group border rounded-2xl p-5 bg-white shadow-sm dark:bg-slate-900 relative transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between min-h-[170px] ${
                  isActive
                    ? 'border-indigo-500 ring-1 ring-indigo-500/10 shadow-indigo-50/50 dark:shadow-none'
                    : 'border-slate-200/80 hover:border-slate-300 hover:scale-[1.01] dark:border-slate-800/80'
                }`}
              >
                {isActive && (
                  <div className="absolute top-0 right-0 h-2 w-2 rounded-bl-xl bg-indigo-600 dark:bg-indigo-400" />
                )}

                <div>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span className="font-mono font-bold text-xs bg-slate-50 dark:bg-slate-950 px-2 py-0.5 border dark:border-slate-800 rounded text-slate-500 tracking-wider">
                      {proj.code}
                    </span>
                    
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider border leading-none ${
                      proj.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-450 dark:border-emerald-900/40' :
                      proj.status === 'on-hold' ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-955/30 dark:text-amber-450 dark:border-amber-900/40' :
                      proj.status === 'completed' ? 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/30 dark:text-indigo-450 dark:border-indigo-900/40' :
                      'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-950/30 dark:text-slate-400 dark:border-slate-800'
                    }`}>
                      {proj.status}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-850 dark:text-white leading-snug tracking-tight truncate" title={proj.name}>
                    {proj.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase mt-1">Client: {proj.client}</p>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-850 text-[10px]">
                  <div className="flex items-center gap-1.5 text-slate-450 dark:text-slate-400 font-semibold uppercase">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{proj.startDate || 'No Date'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Select active button */}
                    {!isActive && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveProject(proj);
                          showToast(`Switched workspace context to "${proj.name}"`, "success");
                        }}
                        className="bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 dark:bg-indigo-950/45 dark:hover:bg-indigo-600 dark:hover:text-white font-extrabold px-2.5 py-1 rounded-xl transition-all cursor-pointer text-[9px] uppercase tracking-wide border border-indigo-100/50 dark:border-indigo-900/30"
                      >
                        Select Workspace
                      </button>
                    )}
                    
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                      proj.type === 'maintenance'
                        ? 'bg-amber-50/50 text-amber-705 border border-amber-205 dark:bg-amber-955/15 dark:text-amber-400 dark:border-amber-900/30'
                        : 'bg-blue-50/50 text-blue-700 border border-blue-200 dark:bg-blue-955/15 dark:text-blue-400 dark:border-blue-900/30'
                    }`}>
                      {proj.type === 'maintenance' ? 'SLA Support' : 'Delivery'}
                    </span>
                  </div>
                </div>

              </div>
            );
          })}

          {filteredProjects.length === 0 && (
            <div className="col-span-3 text-center py-12 text-slate-400 italic">
              No projects registered matching criteria.
            </div>
          )}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm dark:bg-slate-900 dark:border-slate-800/80">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-850 bg-slate-50/70 dark:bg-slate-950/30 text-[10px] font-black uppercase text-slate-405 tracking-wider">
                  <th className="px-6 py-4 w-32">Project Code</th>
                  <th className="px-6 py-4">Project Name</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Timeline</th>
                  <th className="px-6 py-4">Delivery Type</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {filteredProjects.map((proj) => {
                  const isActive = proj._id === activeProject?._id;
                  return (
                    <tr 
                      key={proj._id}
                      onClick={() => setEditingProject(proj)}
                      className="hover:bg-slate-50/40 dark:hover:bg-slate-950/15 transition-all cursor-pointer group"
                    >
                      <td className="px-6 py-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {proj.code}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-850 dark:text-slate-205">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-xs">{proj.name}</span>
                          {isActive && (
                            <span className="text-[7.5px] bg-indigo-600 text-white dark:bg-indigo-950 dark:text-indigo-400 px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wide">Current Workspace</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-450">
                        {proj.client}
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-semibold">
                        {proj.startDate ? `${proj.startDate} to ${proj.endDate || 'Ongoing'}` : 'Not Specified'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                          proj.type === 'maintenance'
                            ? 'bg-amber-50/50 text-amber-705 border border-amber-205 dark:bg-amber-955/15 dark:text-amber-400'
                            : 'bg-blue-50/50 text-blue-700 border border-blue-200 dark:bg-blue-955/15 dark:text-blue-400'
                        }`}>
                          {proj.type === 'maintenance' ? 'SLA' : 'Delivery'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider border leading-none ${
                          proj.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-955/20 dark:text-emerald-400' :
                          proj.status === 'on-hold' ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-955/20 dark:text-amber-400' :
                          proj.status === 'completed' ? 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-955/20 dark:text-indigo-400' :
                          'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-950 dark:text-slate-400'
                        }`}>
                          {proj.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {!isActive && (
                            <button
                              onClick={() => {
                                setActiveProject(proj);
                                showToast(`Switched workspace context to "${proj.name}"`, "success");
                              }}
                              className="text-[9px] font-extrabold uppercase px-2 py-1 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer"
                            >
                              Select Workspace
                            </button>
                          )}
                          
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteProject(proj)}
                              disabled={isActive}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                isActive 
                                  ? 'opacity-30 pointer-events-none' 
                                  : 'border-rose-100 hover:bg-rose-50 text-rose-500 dark:border-rose-950/40 dark:hover:bg-rose-955/15'
                              }`}
                              title="Delete project permanently"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredProjects.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-10 text-center text-slate-400 italic">
                      Zero project entries found matching criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── ADD PROJECT MODAL ─── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider dark:text-white">
                Initialize Project Profile
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-650 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Project Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dubai Islamic Bank Integration"
                  value={projName}
                  onChange={e => setProjName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 font-semibold"
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
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 font-mono"
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
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={projStartDate}
                    onChange={e => setProjStartDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={projEndDate}
                    onChange={e => setProjEndDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Delivery Type
                  </label>
                  <select
                    value={projType}
                    onChange={e => setProjType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-305 cursor-pointer"
                  >
                    <option value="delivery">Active Project Delivery</option>
                    <option value="maintenance">SLA Project Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Project Status
                  </label>
                  <select
                    value={projStatus}
                    onChange={e => setProjStatus(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-305 cursor-pointer"
                  >
                    <option value="active">Active Selected</option>
                    <option value="pipeline">In Pipeline</option>
                    <option value="on-hold">On Hold</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-5 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-850 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  {submitting && <Loader2 className="h-3 w-3 animate-spin" />}
                  Create Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── SIDE OVER PANEL DETAILS DRAW & EPICS MANAGER ─── */}
      {editingProject && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop overlay */}
          <div 
            onClick={() => setEditingProject(null)}
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity animate-in fade-in duration-200" 
          />

          {/* Side Drawer Body */}
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800/80 animate-in slide-in-from-right duration-250 z-10">
            
            {/* Header */}
            <div className="h-16 border-b border-slate-100 dark:border-slate-850 px-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5 text-indigo-500" />
                <h3 className="text-xs font-black uppercase text-slate-850 dark:text-slate-200 tracking-wider">
                  Workspace Specifications
                </h3>
              </div>
              <button 
                onClick={() => setEditingProject(null)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-405 hover:text-slate-655 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable details */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              
              {/* Title Header Card */}
              <div className="p-4 rounded-2xl bg-indigo-50/20 border border-indigo-100/50 dark:bg-slate-950/20 dark:border-slate-850">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold text-xs bg-indigo-100/50 dark:bg-indigo-900/50 px-2 py-0.5 rounded leading-none">
                    {editingProject.code}
                  </span>
                  
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase border leading-none ${
                    editingProject.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-955/15 dark:text-emerald-400' :
                    editingProject.status === 'on-hold' ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-955/15 dark:text-amber-400' :
                    editingProject.status === 'completed' ? 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-955/15 dark:text-indigo-400' :
                    'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-950 dark:text-slate-400'
                  }`}>
                    {editingProject.status}
                  </span>
                </div>
                <h4 className="font-black text-sm text-slate-850 dark:text-white mt-3 uppercase tracking-wider leading-snug">{editingProject.name}</h4>
                <p className="text-[10px] text-slate-405 font-bold mt-1 uppercase tracking-wide">Client Tag: {editingProject.client}</p>
              </div>

              {/* Edit Specs Form Details (Admin / Managers) */}
              <div className="space-y-4">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Specifications Configuration</h5>
                
                <div>
                  <label className="block text-[9.5px] font-bold uppercase tracking-wider text-slate-405 mb-1.5">Project Scope Status</label>
                  <select
                    disabled={!isManagerOrAdmin}
                    value={editingProject.status}
                    onChange={e => handleUpdateProject(editingProject._id, { status: e.target.value })}
                    className="w-full rounded-xl border border-slate-205 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 dark:border-slate-850 dark:bg-slate-950 dark:text-slate-300 cursor-pointer disabled:opacity-60"
                  >
                    <option value="active">Active Workspace Tracking</option>
                    <option value="pipeline">Pre-Delivery Pipeline</option>
                    <option value="on-hold">On Hold / SLA Suspended</option>
                    <option value="completed">Completed / Signed Off</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9.5px] font-bold uppercase tracking-wider text-slate-405 mb-1.5">Focus Delivery Focus Type</label>
                  <select
                    disabled={!isManagerOrAdmin}
                    value={editingProject.type}
                    onChange={e => handleUpdateProject(editingProject._id, { type: e.target.value })}
                    className="w-full rounded-xl border border-slate-205 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 dark:border-slate-850 dark:bg-slate-950 dark:text-slate-300 cursor-pointer disabled:opacity-60"
                  >
                    <option value="delivery">Active Project Delivery</option>
                    <option value="maintenance">SLA Project Maintenance</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9.5px] font-bold uppercase tracking-wider text-slate-405 mb-1.5">Start Date</label>
                    <input
                      type="date"
                      disabled={!isManagerOrAdmin}
                      value={editingProject.startDate || ''}
                      onChange={e => handleUpdateProject(editingProject._id, { startDate: e.target.value })}
                      className="w-full rounded-xl border border-slate-205 bg-white px-3 py-1.5 text-xs outline-none dark:border-slate-850 dark:bg-slate-950 dark:text-slate-300 font-semibold disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-[9.5px] font-bold uppercase tracking-wider text-slate-405 mb-1.5">End Date</label>
                    <input
                      type="date"
                      disabled={!isManagerOrAdmin}
                      value={editingProject.endDate || ''}
                      onChange={e => handleUpdateProject(editingProject._id, { endDate: e.target.value })}
                      className="w-full rounded-xl border border-slate-205 bg-white px-3 py-1.5 text-xs outline-none dark:border-slate-850 dark:bg-slate-950 dark:text-slate-300 font-semibold disabled:opacity-60"
                    />
                  </div>
                </div>

              </div>

              {/* EPICS MANAGEMENT PANEL (Only show if editing project matches current scope, or always show for selected project) */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-850 space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Project Epics Module Setup</h5>
                  <span className="text-[9px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded border dark:border-slate-850">
                    {epics.filter(e => e.projectId === editingProject._id || e.projectId?._id === editingProject._id).length} Active modules
                  </span>
                </div>

                {/* Add new Epic Form */}
                {isManagerOrAdmin ? (
                  <form onSubmit={handleAddEpic} className="space-y-3 p-4 rounded-2xl bg-slate-50/50 border border-slate-150/60 dark:bg-slate-955/10 dark:border-slate-850">
                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Epic Module Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Authentication Gateway"
                        value={epicName}
                        onChange={e => setEpicName(e.target.value)}
                        className="w-full rounded-xl border border-slate-205 bg-white px-3 py-1.5 text-xs outline-none focus:border-indigo-500 dark:border-slate-850 dark:bg-slate-900 dark:text-slate-300 font-semibold"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Color Badge Indicator</label>
                      <div className="flex flex-wrap gap-2">
                        {EPIC_COLORS.map(c => (
                          <button
                            key={c.hex}
                            type="button"
                            onClick={() => setEpicColor(c.hex)}
                            className={`h-6 w-6 rounded-full transition-all border outline-none flex items-center justify-center cursor-pointer ${
                              epicColor === c.hex
                                ? 'ring-2 ring-indigo-500 border-white dark:border-slate-905 scale-110 shadow-sm'
                                : 'border-transparent hover:scale-105'
                            }`}
                            style={{ backgroundColor: c.hex }}
                            title={c.label}
                          >
                            {epicColor === c.hex && (
                              <span className="text-[9px] text-white font-bold drop-shadow">✓</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        disabled={creatingEpic || !epicName.trim()}
                        className="flex items-center justify-center gap-1 bg-indigo-650 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider shadow cursor-pointer transition-all disabled:opacity-50"
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                        {creatingEpic ? "Creating..." : "Save Module"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="rounded-xl bg-amber-50 dark:bg-amber-955/20 border border-amber-100 dark:border-amber-900/30 p-3 text-[9px] font-bold text-amber-705">
                    Adding Epic modules is restricted to Admins and Project Leads.
                  </div>
                )}

                {/* Epic list */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {epics.filter(e => e.projectId === editingProject._id || e.projectId?._id === editingProject._id).map(epic => (
                    <div 
                      key={epic._id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/20 text-xs font-semibold"
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: epic.color }} />
                        <span 
                          className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider"
                          style={{ backgroundColor: epic.color }}
                        >
                          {epic.name}
                        </span>
                      </div>

                      {isManagerOrAdmin && (
                        <button
                          onClick={() => handleDeleteEpic(epic)}
                          className="text-slate-350 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                          title="Remove Epic"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}

                  {epics.filter(e => e.projectId === editingProject._id || e.projectId?._id === editingProject._id).length === 0 && (
                    <div className="text-center py-4 text-slate-400 italic text-[11px]">
                      No Epics modules initialized for this project.
                    </div>
                  )}
                </div>

              </div>

            </div>

            {/* Footer Actions */}
            <div className="h-18 border-t border-slate-100 dark:border-slate-850 px-6 flex items-center justify-between shrink-0">
              
              {/* Reset active selected button */}
              {activeProject?._id !== editingProject._id ? (
                <button
                  onClick={() => {
                    setActiveProject(editingProject);
                    showToast(`Switched workspace context to "${editingProject.name}"`, "success");
                  }}
                  className="rounded-xl border border-indigo-200 text-indigo-650 hover:bg-indigo-50 px-4 py-2.5 text-xs font-bold cursor-pointer"
                >
                  Select Workspace
                </button>
              ) : (
                <div className="text-[10px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/20 px-3 py-1.5 rounded-xl uppercase tracking-wider flex items-center gap-1 leading-none">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Current Workspace
                </div>
              )}

              <button
                onClick={() => setEditingProject(null)}
                className="rounded-xl bg-slate-800 hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 text-white px-5 py-2.5 text-xs font-bold cursor-pointer"
              >
                Close Drawer
              </button>

            </div>

          </div>
        </div>
      )}

      {/* CONFIRM DIALOG */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-205 dark:border-slate-800 shadow-2xl">
            <div className="flex items-start gap-3.5">
              <div className="p-2 bg-rose-50 dark:bg-rose-955/20 rounded-xl text-rose-500 shrink-0">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-850 dark:text-white uppercase tracking-wider">{confirmDialog.title}</h3>
                <p className="text-xs text-slate-505 dark:text-slate-400 leading-relaxed">{confirmDialog.message}</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 dark:border-slate-850 pt-4 mt-5">
              <button
                onClick={() => setConfirmDialog(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:border-slate-850 cursor-pointer"
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
                Purge
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
