import { useState, useMemo } from 'react';
import { CalendarRange, ChevronLeft, ChevronRight, Clock, User, CheckCircle, AlertCircle, Eye } from 'lucide-react';

export default function PlannerTab({ 
  activeProject, 
  tasks = [], 
  epics = [], 
  onSelectItem 
}) {
  const [scale, setScale] = useState('week'); // 'week' or 'month'
  const [viewMode, setViewMode] = useState('gantt'); // 'gantt' or 'table'
  const [currentDate, setCurrentDate] = useState(new Date());

  // Filter tasks to active project and valid timeline dates
  const projectTasks = useMemo(() => {
    return tasks.filter(t => t.projectId === activeProject?._id || t.projectId?._id === activeProject?._id);
  }, [tasks, activeProject]);

  // Generate timeline dates array based on scale
  const timelineRange = useMemo(() => {
    const dates = [];
    const baseDate = new Date(currentDate);
    
    if (scale === 'week') {
      // Show 14 days starting from Monday of the baseDate week
      const dayOfWeek = baseDate.getDay();
      const diff = baseDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // adjust to Monday
      const monday = new Date(baseDate.setDate(diff));
      
      for (let i = 0; i < 14; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        dates.push(d);
      }
    } else {
      // Show 30 days starting from the 1st of the baseDate month
      const startOfMonth = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
      for (let i = 0; i < 31; i++) {
        const d = new Date(startOfMonth);
        d.setDate(startOfMonth.getDate() + i);
        // Only include dates of the same month
        if (d.getMonth() === startOfMonth.getMonth()) {
          dates.push(d);
        }
      }
    }
    return dates;
  }, [currentDate, scale]);

  const handlePrev = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      if (scale === 'week') {
        d.setDate(prev.getDate() - 7);
      } else {
        d.setMonth(prev.getMonth() - 1);
      }
      return d;
    });
  };

  const handleNext = () => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      if (scale === 'week') {
        d.setDate(prev.getDate() + 7);
      } else {
        d.setMonth(prev.getMonth() + 1);
      }
      return d;
    });
  };

  // Helper to parse dates and calculate grid overlap
  const getTaskGridInfo = (task, range) => {
    // Parse Start Date (defaults to createdAt if not specified)
    const startDateRaw = task.createdAt ? new Date(task.createdAt) : new Date();
    startDateRaw.setHours(0,0,0,0);
    
    // Parse End Date (defaults to dueDate, or startDate + 3 days)
    let endDateRaw = task.dueDate ? new Date(task.dueDate) : new Date(startDateRaw);
    if (!task.dueDate) {
      endDateRaw.setDate(startDateRaw.getDate() + 3);
    }
    endDateRaw.setHours(23,59,59,999);

    let startCol = -1;
    let duration = 0;

    range.forEach((date, index) => {
      const compareDate = new Date(date);
      compareDate.setHours(12,0,0,0); // compare at mid-day
      
      if (compareDate >= startDateRaw && compareDate <= endDateRaw) {
        if (startCol === -1) {
          startCol = index;
        }
        duration++;
      }
    });

    return { startCol, duration };
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'done': return 'bg-emerald-500/20 text-emerald-700 border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800';
      case 'in-progress': return 'bg-blue-500/20 text-blue-700 border-blue-300 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800';
      case 'in-sit': case 'in-uat': return 'bg-amber-500/20 text-amber-700 border-amber-305 dark:bg-amber-955/30 dark:text-amber-400 dark:border-amber-800';
      case 'on-hold': return 'bg-purple-500/20 text-purple-700 border-purple-300 dark:bg-purple-955/30 dark:text-purple-400 dark:border-purple-800';
      default: return 'bg-slate-500/10 text-slate-600 border-slate-300 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-800';
    }
  };

  return (
    <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-[0_2px_8px_rgba(99,102,241,0.01)] dark:bg-slate-900 dark:border-slate-800/80 min-h-[500px] flex flex-col">
      
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-150/40 pb-4 dark:border-slate-800/40">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-500">
            <CalendarRange className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-850 dark:text-slate-100 uppercase tracking-wider">
              Project Timeline Roadmap & Planner
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Chronological scheduling board and epic milestone tracker</p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* View Mode Switcher */}
          <div className="flex rounded-xl bg-slate-100 p-0.5 border border-slate-200 dark:bg-slate-950 dark:border-slate-850 text-[10px] font-bold">
            <button 
              type="button"
              onClick={() => setViewMode('gantt')} 
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${viewMode === 'gantt' ? 'bg-white shadow-sm dark:bg-slate-900 text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Timeline Gantt
            </button>
            <button 
              type="button"
              onClick={() => setViewMode('table')} 
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${viewMode === 'table' ? 'bg-white shadow-sm dark:bg-slate-900 text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Table View
            </button>
          </div>

          {viewMode === 'gantt' && (
            <>
              {/* Zoom Toggle */}
              <div className="flex rounded-xl bg-slate-100 p-0.5 border border-slate-200 dark:bg-slate-950 dark:border-slate-850 text-[10px] font-bold">
                <button 
                  type="button"
                  onClick={() => setScale('week')} 
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${scale === 'week' ? 'bg-white shadow-sm dark:bg-slate-900 text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  14 Days
                </button>
                <button 
                  type="button"
                  onClick={() => setScale('month')} 
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${scale === 'month' ? 'bg-white shadow-sm dark:bg-slate-900 text-indigo-600 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Month
                </button>
              </div>

              {/* Navigation */}
              <div className="flex items-center gap-1">
                <button 
                  type="button"
                  onClick={handlePrev} 
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 dark:border-slate-850 dark:bg-slate-955 dark:text-slate-300 dark:hover:bg-slate-900 cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-[10px] font-black uppercase text-slate-500 px-2 min-w-[100px] text-center tracking-wider select-none">
                  {scale === 'week' 
                    ? `W/C ${timelineRange[0]?.toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}`
                    : currentDate.toLocaleDateString(undefined, {month: 'long', year: 'numeric'})
                  }
                </span>
                <button 
                  type="button"
                  onClick={handleNext} 
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 dark:border-slate-850 dark:bg-slate-955 dark:text-slate-300 dark:hover:bg-slate-900 cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Gantt Grid Container */}
      {viewMode === 'gantt' && (
        <div className="flex-1 overflow-x-auto min-w-full relative scrollbar-thin">
          <div className="grid" style={{ gridTemplateColumns: `220px repeat(${timelineRange.length}, minmax(40px, 1fr))` }}>
            
            {/* Header Row */}
            <div className="bg-slate-50/50 p-2.5 border-b border-r border-slate-100 font-black text-[9px] uppercase tracking-wider text-slate-400 dark:bg-slate-955/20 dark:border-slate-850 select-none">
              Initiatives / Tasks
            </div>
            {timelineRange.map((date, idx) => {
              const isToday = new Date().toDateString() === date.toDateString();
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
              return (
                <div 
                  key={idx} 
                  className={`p-2 border-b border-r border-slate-100 text-center font-bold dark:border-slate-850 flex flex-col justify-center items-center select-none ${
                    isToday ? 'bg-indigo-50/20 text-indigo-600 dark:bg-indigo-950/20' : ''
                  } ${
                    isWeekend ? 'bg-slate-100/30 dark:bg-slate-900/10' : ''
                  }`}
                >
                  <span className="text-[8px] text-slate-400 font-extrabold uppercase">{date.toLocaleDateString(undefined, {weekday: 'short'}).substring(0, 1)}</span>
                  <span className="text-[10px] mt-0.5">{date.getDate()}</span>
                </div>
              );
            })}

            {/* Grid Rows mapping */}
            {projectTasks.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-400 italic text-xs">
                No tasks found for the current roadmap window. Use \"Tasks Board\" to initialize deliverables.
              </div>
            ) : (
              projectTasks.map((task) => {
                const { startCol, duration } = getTaskGridInfo(task, timelineRange);
                const epicColor = task.epicId?.color || '#cbd5e1';
                
                return (
                  <div key={task._id} className="contents group">
                    
                    {/* Task Label Cell */}
                    <div 
                      onClick={() => onSelectItem(task, 'task')}
                      className="p-3 border-b border-r border-slate-100 hover:bg-slate-50/40 dark:border-slate-850 dark:hover:bg-slate-900/10 flex flex-col justify-center gap-1 cursor-pointer select-none overflow-hidden max-w-[220px]"
                    >
                      <div className="text-xs font-bold text-slate-850 dark:text-slate-205 truncate flex items-center gap-1.5 hover:text-indigo-600 transition-colors">
                        {task.icon && <span className="text-xs">{task.icon}</span>}
                        <span className="truncate">{task.title}</span>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        {task.epicId && (
                          <span 
                            className="text-[7.5px] font-black uppercase text-white px-1.5 py-0.2 rounded tracking-wide truncate max-w-[90px]"
                            style={{ backgroundColor: epicColor }}
                          >
                            {task.epicId.name}
                          </span>
                        )}
                        {task.owner && (
                          <span className="text-[7.5px] text-slate-400 font-semibold truncate max-w-[80px]">
                            👤 {task.owner}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Timeline cell blocks */}
                    {timelineRange.map((date, idx) => {
                      const isTaskDay = startCol !== -1 && idx >= startCol && idx < (startCol + duration);
                      const isToday = new Date().toDateString() === date.toDateString();
                      const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                      return (
                        <div 
                          key={idx} 
                          className={`border-b border-r border-slate-100/50 dark:border-slate-850/50 relative flex items-center justify-center py-2 ${
                            isToday ? 'bg-indigo-50/5 dark:bg-indigo-950/5' : ''
                          } ${
                            isWeekend ? 'bg-slate-100/10 dark:bg-slate-900/5' : ''
                          }`}
                        >
                          {isTaskDay && idx === startCol && (
                            <div 
                              onClick={() => onSelectItem(task, 'task')}
                              style={{ 
                                width: `calc(${duration * 100}% - 8px)`,
                                zIndex: 10,
                                textShadow: '0 1px 1px rgba(255,255,255,0.1)'
                              }}
                              className={`absolute left-1 right-1 h-7 rounded-lg border flex items-center px-2 py-1 text-[9px] font-extrabold uppercase shadow-sm select-none cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md truncate ${getStatusStyle(task.status)}`}
                              title={`${task.title} (${task.status})`}
                            >
                              <span className="truncate flex-1 text-left pr-2">{task.title}</span>
                              <span className="text-[7px] bg-white/40 dark:bg-black/20 px-1 py-0.2 rounded font-black uppercase">{task.status.replace('-', ' ')}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}

          </div>
        </div>
      )}

      {/* ─── TABLE VIEW ROADMAP SPREADSHEET ─── */}
      {viewMode === 'table' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm dark:bg-slate-900 dark:border-slate-800/80">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 font-bold text-slate-400 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/20">
                  <th className="px-4 py-3 min-w-[250px]">Task / Initiative Title</th>
                  <th className="px-4 py-3 w-36">Epic Link</th>
                  <th className="px-4 py-3 w-36">Team Member</th>
                  <th className="px-4 py-3 w-32">Start Date</th>
                  <th className="px-4 py-3 w-32">Due Date</th>
                  <th className="px-4 py-3 w-28">Status</th>
                  <th className="px-4 py-3 w-16 text-center"></th>
                </tr>
              </thead>
              <tbody>
                {projectTasks.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-400 italic">No tasks found.</td>
                  </tr>
                ) : (
                  projectTasks.map(task => {
                    const startDateStr = task.createdAt 
                      ? new Date(task.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                      : 'N/A';
                    const dueDateStr = task.dueDate || 'No due date';
                    const epicColor = task.epicId?.color || '#cbd5e1';

                    return (
                      <tr 
                        key={task._id}
                        onClick={() => onSelectItem(task, 'task')}
                        className="border-b border-slate-100 hover:bg-slate-50/50 cursor-pointer dark:border-slate-850"
                      >
                        {/* Title */}
                        <td className="px-4 py-2.5 font-semibold text-slate-850 dark:text-slate-200">
                          <div className="flex items-center gap-1.5">
                            {task.icon && <span className="text-sm shrink-0">{task.icon}</span>}
                            <span>{task.title}</span>
                          </div>
                        </td>

                        {/* Epic */}
                        <td className="px-4 py-2.5">
                          {task.epicId ? (
                            <span 
                              className="inline-block rounded px-1.5 py-0.5 text-[8.5px] font-black text-white uppercase tracking-wider"
                              style={{ backgroundColor: epicColor }}
                            >
                              {task.epicId.name}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium italic">None</span>
                          )}
                        </td>

                        {/* Owner */}
                        <td className="px-4 py-2.5 text-slate-550 font-bold dark:text-slate-400">
                          {task.owner ? `👤 ${task.owner}` : 'Unassigned'}
                        </td>

                        {/* Start Date */}
                        <td className="px-4 py-2.5 text-slate-500 font-medium">
                          {startDateStr}
                        </td>

                        {/* Due Date */}
                        <td className="px-4 py-2.5 text-slate-500 font-medium">
                          {dueDateStr}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-black uppercase border ${
                            task.status === 'done' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40' :
                            task.status === 'in-progress' ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/40' :
                            task.status === 'on-hold' ? 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/40' :
                            'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-800'
                          }`}>
                            {task.status.replace('-', ' ')}
                          </span>
                        </td>

                        {/* View Action */}
                        <td className="px-4 py-2.5 text-center">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectItem(task, 'task');
                            }}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-indigo-650 cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
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
    </div>
  );
}
