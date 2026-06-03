import { useState, useRef, useEffect } from 'react';
import { 
  Plus, Trash2, ArrowUpRight, ArrowDownRight, Landmark, Tag, Calendar, DollarSign, PenSquare
} from 'lucide-react';

const REVENUE_STATUSES = [
  { value: 'paid', label: 'Fully Paid', bg: '#ecfdf5', text: '#059669' },
  { value: 'part-paid', label: 'Partially Paid', bg: '#fef3c7', text: '#d97706' },
  { value: 'awaiting-po', label: 'Awaiting PO', bg: '#fef2f2', text: '#dc2626' },
  { value: 'on-hold', label: 'Balance On Hold', bg: '#f1f5f9', text: '#475569' }
];

const EXPENSE_CATEGORIES = [
  "Salary", "Infrastructure", "Software License", "Travel", "Hardware", "Consulting", "Other"
];

export default function FinanceHubTab({ 
  transactions, 
  setTransactions, 
  activeProject 
}) {
  const [editingCell, setEditingCell] = useState(null); // { transId, field }
  
  // Expense Form State
  const [expCategory, setExpCategory] = useState('Salary');
  const [expDescription, setExpDescription] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expDate, setExpDate] = useState('');
  const [addingExpense, setAddingExpense] = useState(false);

  // Revenue Form State
  const [revPO, setRevPO] = useState('');
  const [revDesc, setRevDesc] = useState('');
  const [revAmount, setRevAmount] = useState('');
  const [revPaid, setRevPaid] = useState('');
  const [revDate, setRevDate] = useState('');
  const [showAddRevenue, setShowAddRevenue] = useState(false);

  // Filter transactions for active project
  const projTrans = transactions.filter(t => t.projectId?._id === activeProject._id || t.projectId === activeProject._id);
  const revenues = projTrans.filter(t => t.type === 'revenue');
  const expenses = projTrans.filter(t => t.type === 'expense');

  // Calculations
  const totalRevenue = revenues.reduce((sum, r) => sum + r.amount, 0);
  const totalPaidRevenue = revenues.reduce((sum, r) => sum + r.paid, 0);
  const totalOutstanding = totalRevenue - totalPaidRevenue;
  
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const netMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

  // ─── API HANDLERS ───
  const handleUpdateTransaction = async (transId, fields) => {
    // Determine status based on paid vs total amount if not explicitly passed
    const transObj = transactions.find(t => t._id === transId);
    let updatedFields = { ...fields };
    
    if (transObj && (fields.amount !== undefined || fields.paid !== undefined)) {
      const amt = fields.amount !== undefined ? Number(fields.amount) : transObj.amount;
      const pd = fields.paid !== undefined ? Number(fields.paid) : transObj.paid;
      
      if (pd >= amt && amt > 0) {
        updatedFields.status = 'paid';
      } else if (pd > 0 && pd < amt) {
        updatedFields.status = 'part-paid';
      }
    }

    // 1. Local update
    setTransactions(prev => prev.map(t => t._id === transId ? { ...t, ...updatedFields } : t));

    // 2. Database update
    try {
      const response = await fetch('/api/financials', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id: transId, ...updatedFields })
      });
      const res = await response.json();
      if (!res.success) {
        console.error("Failed to sync financial transaction:", res.error);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTransaction = async (type, payload) => {
    const transactionData = {
      projectId: activeProject._id,
      type: type,
      ...payload
    };

    try {
      const response = await fetch('/api/financials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData)
      });
      const res = await response.json();
      if (res.success) {
        setTransactions(prev => [res.data, ...prev]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTransaction = async (transId) => {
    if (!confirm("Are you sure you want to delete this financial log?")) return;
    try {
      const response = await fetch(`/api/financials?id=${transId}`, {
        method: 'DELETE'
      });
      const res = await response.json();
      if (res.success) {
        setTransactions(prev => prev.filter(t => t._id !== transId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const submitExpense = async (e) => {
    e.preventDefault();
    if (!expDescription.trim() || !expAmount) return;
    setAddingExpense(true);

    const payload = {
      category: expCategory,
      description: expDescription,
      amount: Number(expAmount),
      paid: Number(expAmount),
      date: expDate || new Date().toISOString().split('T')[0],
      status: 'paid'
    };

    await handleCreateTransaction('expense', payload);
    setExpDescription('');
    setExpAmount('');
    setAddingExpense(false);
  };

  const submitRevenue = async (e) => {
    e.preventDefault();
    if (!revDesc.trim() || !revAmount) return;

    const amt = Number(revAmount);
    const pd = Number(revPaid || 0);
    
    let status = 'awaiting-po';
    if (pd >= amt && amt > 0) status = 'paid';
    else if (pd > 0) status = 'part-paid';

    const payload = {
      category: revPO === 'Pending' || !revPO ? 'SOW Extra' : 'PO',
      reference: revPO || 'Pending',
      description: revDesc,
      amount: amt,
      paid: pd,
      date: revDate || new Date().toISOString().split('T')[0],
      status: status
    };

    await handleCreateTransaction('revenue', payload);
    setRevPO('');
    setRevDesc('');
    setRevAmount('');
    setRevPaid('');
    setShowAddRevenue(false);
  };

  // Cell Editor Component
  function CellInput({ transId, field, value, type = 'text', selectOptions = null }) {
    const [draft, setDraft] = useState(value);
    const inputRef = useRef(null);

    useEffect(() => {
      if (inputRef.current) inputRef.current.focus();
    }, []);

    const commit = () => {
      setEditingCell(null);
      if (draft !== value) {
        handleUpdateTransaction(transId, { [field]: type === 'number' ? Number(draft) : draft });
      }
    };

    if (selectOptions) {
      return (
        <select
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          className="rounded border border-indigo-500 bg-white p-0.5 text-xs outline-none dark:bg-slate-900"
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
        className="rounded border border-indigo-500 bg-white px-2 py-0.5 text-xs outline-none dark:bg-slate-900 w-full"
      />
    );
  }

  return (
    <div className="space-y-6">
      
      {/* ─── FINANCIAL P&L SUMMARY CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Total Revenues */}
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-slate-450 dark:text-slate-400">
            <Landmark className="h-4 w-4 text-emerald-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Contract Revenue</span>
          </div>
          <h3 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">${totalRevenue.toLocaleString()}</h3>
          <span className="text-[10px] text-slate-405 font-semibold">Projected receivables</span>
        </div>

        {/* Invoiced Paid */}
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-slate-450 dark:text-slate-400">
            <Landmark className="h-4 w-4 text-teal-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Paid & Cleared Cash</span>
          </div>
          <h3 className="mt-2 text-xl font-bold text-emerald-600">${totalPaidRevenue.toLocaleString()}</h3>
          <span className="text-[10px] text-emerald-600/70 font-bold">{totalRevenue > 0 ? Math.round((totalPaidRevenue/totalRevenue)*100) : 0}% of contract</span>
        </div>

        {/* Outstanding Invoices */}
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-slate-450 dark:text-slate-400">
            <Landmark className="h-4 w-4 text-amber-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Outstanding Accounts Receivable</span>
          </div>
          <h3 className="mt-2 text-xl font-bold text-amber-600">${totalOutstanding.toLocaleString()}</h3>
          <span className="text-[10px] text-amber-650/70 font-semibold">PO/Invoicing pipeline</span>
        </div>

        {/* Expenses */}
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-slate-450 dark:text-slate-400">
            <Landmark className="h-4 w-4 text-rose-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Operations Expense</span>
          </div>
          <h3 className="mt-2 text-xl font-bold text-rose-600">${totalExpenses.toLocaleString()}</h3>
          <span className="text-[10px] text-slate-400">SaaS, hardware & salaries</span>
        </div>

        {/* Profit Margin */}
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-slate-450 dark:text-slate-400">
            <Landmark className="h-4 w-4 text-indigo-500" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Project Operating Profit</span>
          </div>
          <h3 className={`mt-2 text-xl font-bold ${
            netProfit >= 0 ? 'text-indigo-600' : 'text-rose-600'
          }`}>
            ${netProfit.toLocaleString()} ({netMargin}%)
          </h3>
          <span className="text-[10px] text-slate-400">P&L Margin allocation</span>
        </div>

      </div>

      {/* ─── SECTION 1: REVENUE / PO EDITABLE SPREADSHEET ─── */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm dark:border-slate-800 dark:bg-slate-900">
        
        {/* Table header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/40">
          <div className="flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              Project Revenues (POs & Invoice Milestones)
            </h4>
          </div>
          
          <button
            onClick={() => setShowAddRevenue(!showAddRevenue)}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-indigo-700"
          >
            Create PO/Invoice Row
          </button>
        </div>

        {/* Add Revenue Form Panel */}
        {showAddRevenue && (
          <form onSubmit={submitRevenue} className="border-b border-slate-150 p-4 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/20 grid grid-cols-1 sm:grid-cols-5 gap-3">
            <input
              type="text"
              placeholder="PO No. (e.g. 2070349)"
              value={revPO}
              onChange={e => setRevPO(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none dark:border-slate-800 dark:bg-slate-900"
            />
            <input
              type="text"
              placeholder="Description / Milestone"
              value={revDesc}
              onChange={e => setRevDesc(e.target.value)}
              className="col-span-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none dark:border-slate-800 dark:bg-slate-900"
              required
            />
            <input
              type="number"
              placeholder="Total PO Value ($)"
              value={revAmount}
              onChange={e => setRevAmount(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none dark:border-slate-800 dark:bg-slate-900"
              required
            />
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Paid ($)"
                value={revPaid}
                onChange={e => setRevPaid(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none dark:border-slate-800 dark:bg-slate-900"
              />
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 shrink-0"
              >
                Add
              </button>
            </div>
          </form>
        )}

        {/* Revenue Table Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 font-bold text-slate-400 bg-slate-50/20 dark:border-slate-800 dark:bg-slate-950/20">
                <th className="px-4 py-2 w-32">PO No.</th>
                <th className="px-4 py-2 w-28">Date</th>
                <th className="px-4 py-2 min-w-[240px]">Milestone / PO Description</th>
                <th className="px-4 py-2 w-28">Total PO ($)</th>
                <th className="px-4 py-2 w-28">Paid ($)</th>
                <th className="px-4 py-2 w-28">Outstanding ($)</th>
                <th className="px-4 py-2 w-36">Status</th>
                <th className="px-4 py-2 min-w-[160px]">Invoice Ref & Comments</th>
                <th className="px-4 py-2 w-12 text-center"></th>
              </tr>
            </thead>
            <tbody>
              {revenues.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-6 text-center text-slate-400 italic">No revenue milestones recorded.</td>
                </tr>
              ) : (
                revenues.map((r) => {
                  const curStatus = REVENUE_STATUSES.find(s => s.value === r.status) || REVENUE_STATUSES[0];
                  const outstanding = r.amount - r.paid;
                  
                  return (
                    <tr 
                      key={r._id}
                      className="border-b border-slate-100 hover:bg-slate-50/50 dark:border-slate-850"
                    >
                      {/* PO Ref */}
                      <td 
                        onClick={() => setEditingCell({ transId: r._id, field: 'reference' })}
                        className="px-4 py-2.5 font-bold cursor-text"
                      >
                        {editingCell?.transId === r._id && editingCell?.field === 'reference' ? (
                          <CellInput transId={r._id} field="reference" value={r.reference} />
                        ) : (
                          <span className="hover:bg-slate-100/50 dark:hover:bg-slate-800 px-1 rounded block">{r.reference || 'Pending'}</span>
                        )}
                      </td>

                      {/* Date */}
                      <td 
                        onClick={() => setEditingCell({ transId: r._id, field: 'date' })}
                        className="px-4 py-2.5 cursor-text text-slate-550"
                      >
                        {editingCell?.transId === r._id && editingCell?.field === 'date' ? (
                          <CellInput transId={r._id} field="date" value={r.date} />
                        ) : (
                          <span className="hover:bg-slate-100/50 dark:hover:bg-slate-800 px-1 rounded block">{r.date}</span>
                        )}
                      </td>

                      {/* Description */}
                      <td 
                        onClick={() => setEditingCell({ transId: r._id, field: 'description' })}
                        className="px-4 py-2.5 cursor-text font-medium text-slate-800 dark:text-slate-200"
                      >
                        {editingCell?.transId === r._id && editingCell?.field === 'description' ? (
                          <CellInput transId={r._id} field="description" value={r.description} />
                        ) : (
                          <span className="hover:bg-slate-100/50 dark:hover:bg-slate-800 px-1 rounded block truncate max-w-sm" title={r.description}>{r.description}</span>
                        )}
                      </td>

                      {/* Total */}
                      <td 
                        onClick={() => setEditingCell({ transId: r._id, field: 'amount' })}
                        className="px-4 py-2.5 cursor-text font-bold"
                      >
                        {editingCell?.transId === r._id && editingCell?.field === 'amount' ? (
                          <CellInput transId={r._id} field="amount" value={r.amount} type="number" />
                        ) : (
                          <span className="hover:bg-slate-100/50 dark:hover:bg-slate-800 px-1 rounded block">${r.amount.toLocaleString()}</span>
                        )}
                      </td>

                      {/* Paid */}
                      <td 
                        onClick={() => setEditingCell({ transId: r._id, field: 'paid' })}
                        className="px-4 py-2.5 cursor-text font-bold text-emerald-600"
                      >
                        {editingCell?.transId === r._id && editingCell?.field === 'paid' ? (
                          <CellInput transId={r._id} field="paid" value={r.paid} type="number" />
                        ) : (
                          <span className="hover:bg-slate-100/50 dark:hover:bg-slate-800 px-1 rounded block">${r.paid.toLocaleString()}</span>
                        )}
                      </td>

                      {/* Outstanding */}
                      <td className="px-4 py-2.5 font-bold text-slate-800 dark:text-slate-300">
                        ${outstanding.toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-2.5">
                        {editingCell?.transId === r._id && editingCell?.field === 'status' ? (
                          <CellInput 
                            transId={r._id} 
                            field="status" 
                            value={r.status} 
                            selectOptions={REVENUE_STATUSES}
                          />
                        ) : (
                          <button
                            onClick={() => setEditingCell({ transId: r._id, field: 'status' })}
                            className="inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase transition-all"
                            style={{ backgroundColor: curStatus.bg, color: curStatus.text }}
                          >
                            {curStatus.label}
                          </button>
                        )}
                      </td>

                      {/* Comments */}
                      <td 
                        onClick={() => setEditingCell({ transId: r._id, field: 'comments' })}
                        className="px-4 py-2.5 cursor-text text-slate-500 dark:text-slate-400"
                      >
                        {editingCell?.transId === r._id && editingCell?.field === 'comments' ? (
                          <CellInput transId={r._id} field="comments" value={r.comments} />
                        ) : (
                          <span className="hover:bg-slate-100/50 dark:hover:bg-slate-800 px-1 rounded block max-w-xs truncate" title={r.comments}>{r.comments || '-'}</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-2.5 text-center">
                        <button
                          onClick={() => handleDeleteTransaction(r._id)}
                          className="text-slate-300 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

      {/* ─── SECTION 2: OPERATIONAL EXPENSES HUB ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Form: Log operational expense */}
        <div className="rounded-2xl border border-slate-150 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 h-fit">
          <div className="flex items-center gap-2 text-rose-500 mb-4">
            <ArrowDownRight className="h-4 w-4" />
            <h4 className="text-xs font-bold text-slate-850 dark:text-slate-100 uppercase tracking-wider">
              Log Operations Expense
            </h4>
          </div>

          <form onSubmit={submitExpense} className="space-y-4">
            
            {/* Category */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Expense Category
              </label>
              <select
                value={expCategory}
                onChange={e => setExpCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-350"
                required
              >
                {EXPENSE_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Description / Line Item
              </label>
              <input
                type="text"
                placeholder="e.g. Server hosting, Contractor billing, Travel tickets..."
                value={expDescription}
                onChange={e => setExpDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                required
              />
            </div>

            {/* Row: Amount and Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Amount Spent ($)
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={expAmount}
                  onChange={e => setExpAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-350"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Transaction Date
                </label>
                <input
                  type="date"
                  value={expDate}
                  onChange={e => setExpDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={addingExpense}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-700 active:scale-[0.98] transition-all shadow-md shadow-rose-100 dark:shadow-none"
            >
              <Plus className="h-3.5 w-3.5" />
              {addingExpense ? 'Logging...' : 'Log Expense Item'}
            </button>

          </form>
        </div>

        {/* Right Spreadsheet: Expense rows registry */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-150 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden flex flex-col">
          <h4 className="text-sm font-bold text-slate-850 dark:text-slate-100 mb-4 uppercase tracking-wider">
            Operational Expenses Ledger
          </h4>

          <div className="flex-1 overflow-y-auto max-h-[360px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wide bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/20">
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2 min-w-[200px]">Expense Description</th>
                  <th className="px-3 py-2 text-right">Cost Value ($)</th>
                  <th className="px-3 py-2 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-400 italic">No operational expenses logged.</td>
                  </tr>
                ) : (
                  expenses.map((e) => (
                    <tr 
                      key={e._id}
                      className="border-b border-slate-100 hover:bg-slate-50/50 dark:border-slate-850"
                    >
                      <td className="px-3 py-2.5 font-bold">
                        <span className="inline-flex items-center gap-1.5 text-rose-600">
                          <Tag className="h-3 w-3" />
                          {e.category}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-500">{e.date}</td>
                      <td className="px-3 py-2.5 font-medium text-slate-800 dark:text-slate-200">{e.description}</td>
                      <td className="px-3 py-2.5 font-bold text-rose-600 text-right">${e.amount.toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-right">
                        <button
                          onClick={() => handleDeleteTransaction(e._id)}
                          className="text-slate-305 hover:text-rose-600 transition-colors"
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
