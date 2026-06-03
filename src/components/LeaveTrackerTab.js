import { useState } from 'react';
import { 
  Calendar, CalendarDays, Plus, Trash2, ShieldAlert, CheckCircle, HelpCircle
} from 'lucide-react';

const EMPLOYEES = ["Superadmin"];

const MONTHS = [
  { name: "Jun 2026", monthIdx: 5, year: 2026 },
  { name: "Jul 2026", monthIdx: 6, year: 2026 },
  { name: "Aug 2026", monthIdx: 7, year: 2026 },
  { name: "Sep 2026", monthIdx: 8, year: 2026 },
  { name: "Oct 2026", monthIdx: 9, year: 2026 }
];

export default function LeaveTrackerTab({ 
  leaves, 
  setLeaves, 
  activeUser,
  employees = []
}) {
  const displayEmployees = employees.length > 0 ? employees : EMPLOYEES;
  const [employeeName, setEmployeeName] = useState(activeUser);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [type, setType] = useState('annual');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Sync simulated active user changes
  useState(() => {
    setEmployeeName(activeUser);
  }, [activeUser]);

  const handleAddLeave = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate) return;

    setSubmitting(true);
    const newLeave = { employeeName, startDate, endDate, type, notes };

    try {
      const response = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLeave)
      });
      const res = await response.json();
      if (res.success) {
        setLeaves(prev => [...prev, res.data].sort((a,b) => new Date(a.startDate) - new Date(b.startDate)));
        setStartDate('');
        setEndDate('');
        setNotes('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLeave = async (leaveId) => {
    if (!confirm("Are you sure you want to remove this leave entry?")) return;
    try {
      const response = await fetch(`/api/leaves?id=${leaveId}`, {
        method: 'DELETE'
      });
      const res = await response.json();
      if (res.success) {
        setLeaves(prev => prev.filter(l => l._id !== leaveId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Helper to determine if an employee is on leave during a given month/year
  const getEmployeeLeaveInMonth = (empName, monthIdx, year) => {
    return leaves.filter(l => {
      if (l.employeeName !== empName) return false;
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      
      const targetStart = new Date(year, monthIdx, 1);
      const targetEnd = new Date(year, monthIdx + 1, 0); // End of target month
      
      // Overlap calculation
      return (start <= targetEnd && end >= targetStart);
    });
  };

  return (
    <div className="space-y-6">
      
      {/* ─── GANTT TIMELINE: VISUAL CALENDAR OVERVIEW ─── */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h4 className="text-sm font-bold text-slate-850 dark:text-slate-100 mb-4 uppercase tracking-wider">
          Vacation Timeline & Capacity Allocation (2026)
        </h4>

        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            
            {/* Timeline Header Row (Months) */}
            <div className="grid grid-cols-6 border-b border-slate-100 pb-2 mb-2 dark:border-slate-800 font-bold text-slate-400 text-xs">
              <div className="col-span-1">Team Member</div>
              {MONTHS.map((m, idx) => (
                <div key={idx} className="col-span-1 text-center font-semibold">
                  {m.name}
                </div>
              ))}
            </div>

            {/* Timeline Body Rows (Employees) */}
            <div className="space-y-3">
              {displayEmployees.map((emp) => (
                <div 
                  key={emp}
                  className="grid grid-cols-6 items-center text-xs text-slate-650 dark:text-slate-350"
                >
                  {/* Employee Label */}
                  <div className="col-span-1 font-semibold text-slate-800 dark:text-slate-200">
                    {emp}
                  </div>

                  {/* Monthly grid cells */}
                  {MONTHS.map((m, idx) => {
                    const empLeaves = getEmployeeLeaveInMonth(emp, m.monthIdx, m.year);
                    const hasLeave = empLeaves.length > 0;
                    
                    // Specific crunch style for August overlaps
                    const isAugustCrunch = empLeaves.some(l => m.monthIdx === 7); // August idx is 7
                    
                    return (
                      <div key={idx} className="col-span-1 px-1 text-center">
                        {hasLeave ? (
                          <div 
                            title={empLeaves.map(l => `${l.type} leave: ${l.notes}`).join('\n')}
                            className={`rounded-lg py-2.5 text-[9px] font-bold uppercase transition-all shadow-sm ${
                              isAugustCrunch 
                                ? 'bg-rose-500 text-white shadow-rose-200/50' 
                                : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400'
                            }`}
                          >
                            {empLeaves[0].daysCount > 0 ? `${empLeaves[0].daysCount} Days` : 'On Leave'}
                          </div>
                        ) : (
                          <div className="rounded-lg bg-slate-50 border border-slate-100/55 py-2.5 text-[9px] text-slate-400 dark:bg-slate-950 dark:border-slate-850">
                            Available
                          </div>
                        )}
                      </div>
                    );
                  })}

                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-3 dark:border-slate-800 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-6 rounded bg-slate-50 border border-slate-150" />
            <span>Fully Active Capacity</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-6 rounded bg-indigo-100" />
            <span>Planned Leave Block</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-6 rounded bg-rose-500" />
            <span>Overlapping Crunch Danger</span>
          </div>
        </div>

      </div>

      {/* ─── BOTTOM ROW: CRUD LIST & PLANNER FORM ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form Panel: Leave Planner */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 h-fit">
          <h4 className="text-sm font-bold text-slate-850 dark:text-slate-100 mb-4 uppercase tracking-wider">
            Plan Vacation Leave
          </h4>

          <form onSubmit={handleAddLeave} className="space-y-4">
            
            {/* Employee Selector */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Team Member
              </label>
              <select
                value={employeeName}
                onChange={e => setEmployeeName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                required
              >
                {displayEmployees.map(emp => (
                  <option key={emp} value={emp}>{emp}</option>
                ))}
              </select>
            </div>

            {/* Date range picker */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-750 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-350"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-755 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-355"
                  required
                />
              </div>
            </div>

            {/* Type */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Leave Type
              </label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-750 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                required
              >
                <option value="annual">Annual Leave</option>
                <option value="sick">Sick Leave</option>
                <option value="casual">Casual Leave</option>
                <option value="unpaid">Unpaid / Sabbatical</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Reason / Details
              </label>
              <textarea
                placeholder="Reason for vacation or coverage planner comments..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows="2"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all dark:shadow-none"
            >
              <Plus className="h-3.5 w-3.5" />
              {submitting ? 'Planning...' : 'Add Leave Block'}
            </button>

          </form>
        </div>

        {/* Table Panel: Active Leaves List */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden flex flex-col">
          <h4 className="text-sm font-bold text-slate-850 dark:text-slate-100 mb-4 uppercase tracking-wider">
            Registered Leaves Registry
          </h4>

          <div className="flex-1 overflow-y-auto max-h-[360px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wide bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/20">
                  <th className="px-3 py-2">Resource</th>
                  <th className="px-3 py-2">Start Date</th>
                  <th className="px-3 py-2">End Date</th>
                  <th className="px-3 py-2">Duration</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Notes</th>
                  <th className="px-3 py-2 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {leaves.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-400 italic">No leaves planned.</td>
                  </tr>
                ) : (
                  leaves.map((l) => (
                    <tr 
                      key={l._id}
                      className="border-b border-slate-100 hover:bg-slate-50/50 dark:border-slate-850"
                    >
                      <td className="px-3 py-2.5 font-bold text-slate-850 dark:text-slate-100">{l.employeeName}</td>
                      <td className="px-3 py-2.5 font-medium">{l.startDate}</td>
                      <td className="px-3 py-2.5 font-medium">{l.endDate}</td>
                      <td className="px-3 py-2.5 font-bold text-slate-800 dark:text-slate-350">{l.daysCount}d</td>
                      <td className="px-3 py-2.5 capitalize">
                        <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          l.type === 'annual' 
                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30' 
                            : l.type === 'sick' 
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/30' 
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800'
                        }`}>
                          {l.type}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-500 dark:text-slate-400 truncate max-w-[120px]" title={l.notes}>
                        {l.notes || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <button
                          onClick={() => handleDeleteLeave(l._id)}
                          className="text-slate-300 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
