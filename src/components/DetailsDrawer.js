import { useState, useEffect, useRef } from 'react';
import { 
  X, CheckSquare, Plus, MessageSquare, Clock, AlertOctagon, Trash2, CheckCircle2, 
  Circle, Tag, Timer, Calendar, ShieldAlert, Sparkles, HelpCircle, Code, Paperclip, Download
} from 'lucide-react';

const PRIORITY_LEVELS = [
  { value: 'lowest', label: 'Lowest', color: '#64748b', bg: '#f1f5f9' },
  { value: 'low', label: 'Low', color: '#3b82f6', bg: '#eff6ff' },
  { value: 'medium', label: 'Medium', color: '#f59e0b', bg: '#fef3c7' },
  { value: 'high', label: 'High', color: '#ef4444', bg: '#fef2f2' },
  { value: 'critical', label: 'Critical', color: '#be123c', bg: '#fff1f2' }
];

const SLASH_COMMANDS = [
  { id: 'todo', label: 'To-Do Checkbox', desc: 'Add checkbox item', text: '\n- [ ] ' },
  { id: 'bullet', label: 'Bullet List', desc: 'Add bullet item', text: '\n• ' },
  { id: 'h1', label: 'Heading 1', desc: 'Large section heading', text: '\n# ' },
  { id: 'h2', label: 'Heading 2', desc: 'Medium section heading', text: '\n## ' },
  { id: 'divider', label: 'Divider', desc: 'Visual partition line', text: '\n\n---\n\n' },
  { id: 'quote', label: 'Blockquote', desc: 'Add visual quotation', text: '\n> ' },
  { id: 'callout', label: 'Callout Box', desc: 'Highlight key callout info', text: '\n> [!IMPORTANT]\n> Enter callout context here...\n' },
  { id: 'code', label: 'Code Block', desc: 'Add monospaced wrapper', text: '\n```javascript\n\n```\n' },
  { id: 'table', label: 'Data Table', desc: 'Insert markdown table', text: '\n| Header 1 | Header 2 |\n|---|---|\n| Cell 1 | Cell 2 |\n' }
];

const POPULAR_EMOJIS = ["📝", "🚀", "🐛", "🎯", "💡", "🔧", "🚨", "📅", "✨", "🔒", "🛠️", "📈", "🎨", "🔥", "✅", "⚠️", "🌍", "💻", "⚡"];

const STATUS_MAPPINGS = [
  { value: 'not-started', label: 'Not Started' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'in-sit', label: 'In SIT' },
  { value: 'in-uat', label: 'In UAT' },
  { value: 'on-hold', label: 'On Hold' },
  { value: 'done', label: 'Done' },
  { value: 'open', label: 'Open' },
  { value: 'under-review', label: 'Under Review' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' }
];

const EMPLOYEES = ["Superadmin"];

export default function DetailsDrawer({ 
  item, 
  itemType, // 'task' or 'issue'
  epics = [],
  onClose, 
  onUpdate,
  onDelete,
  activeUser,
  currentUser
}) {
  const [description, setDescription] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [newComment, setNewComment] = useState('');
  
  // Work log state
  const [logHours, setLogHours] = useState('');
  
  // Slash commands popup state
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashCoords, setSlashCoords] = useState({ top: 0, left: 0 });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const descRef = useRef(null);

  // Simulated file upload state variables
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState('pdf');
  const [newFileSize, setNewFileSize] = useState('1.2 MB');
  const [showAttachForm, setShowAttachForm] = useState(false);

  const getFileTypeStyle = (type) => {
    switch (type?.toLowerCase()) {
      case 'pdf':
        return { bg: 'bg-rose-500', text: 'PDF' };
      case 'docx':
      case 'doc':
        return { bg: 'bg-blue-500', text: 'DOC' };
      case 'xlsx':
      case 'xls':
        return { bg: 'bg-emerald-500', text: 'XLSX' };
      case 'json':
        return { bg: 'bg-purple-500', text: 'JSON' };
      case 'png':
      case 'jpg':
      case 'jpeg':
        return { bg: 'bg-amber-500', text: 'IMG' };
      default:
        return { bg: 'bg-slate-500', text: 'FILE' };
    }
  };

  const handleAddAttachment = (e) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    const newAttach = {
      name: newFileName.trim() + (newFileName.includes('.') ? '' : `.${newFileType}`),
      fileType: newFileType,
      fileSize: newFileSize.trim() || '1.0 MB',
      createdAt: new Date().toISOString(),
      url: '#'
    };

    const updatedAttachments = [...(item.attachments || []), newAttach];
    onUpdate(item._id, { attachments: updatedAttachments, actor: activeUser });
    setNewFileName('');
    setNewFileSize('1.2 MB');
    setShowAttachForm(false);
  };

  const handleRemoveAttachment = (idx) => {
    const updatedAttachments = (item.attachments || []).filter((_, i) => i !== idx);
    onUpdate(item._id, { attachments: updatedAttachments, actor: activeUser });
  };

  const isReadOnly = 
    currentUser?.role === 'HR' || 
    currentUser?.role === 'Sales' || 
    currentUser?.role === 'Support Member' || 
    currentUser?.role === 'Team Member';

  useEffect(() => {
    if (item) {
      setDescription(item.description || '');
    }
  }, [item]);

  if (!item) return null;

  const handleDescBlur = () => {
    if (description !== (item.description || '')) {
      onUpdate(item._id, { description, actor: activeUser });
    }
  };

  const handleDescKeyDown = (e) => {
    // Detect `/` to open template commands menu
    if (e.key === '/') {
      const { selectionStart } = e.target;
      // Approximate coordinates based on text cursor
      const textNode = e.target;
      const rect = textNode.getBoundingClientRect();
      
      setSlashCoords({
        top: textNode.offsetTop + 20,
        left: Math.min(textNode.offsetLeft + 10, rect.width - 150)
      });
      setShowSlashMenu(true);
    } else if (e.key === 'Escape' || e.key === 'Backspace') {
      setShowSlashMenu(false);
    }
  };

  const insertSlashCommand = (cmdText) => {
    if (descRef.current) {
      const input = descRef.current;
      const start = input.selectionStart;
      const end = input.selectionEnd;
      
      // Remove the `/` that was typed and insert command text
      const newText = description.substring(0, start - 1) + cmdText + description.substring(end);
      setDescription(newText);
      onUpdate(item._id, { description: newText, actor: activeUser });
      
      setShowSlashMenu(false);
      
      // Set focus back and move cursor
      setTimeout(() => {
        input.focus();
        const cursor = start - 1 + cmdText.length;
        input.setSelectionRange(cursor, cursor);
      }, 50);
    }
  };

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    
    const updatedSubtasks = [...(item.subtasks || []), { title: newSubtask.trim(), completed: false }];
    onUpdate(item._id, { subtasks: updatedSubtasks, actor: activeUser });
    setNewSubtask('');
  };

  const handleToggleSubtask = (idx) => {
    const updatedSubtasks = (item.subtasks || []).map((sub, i) => 
      i === idx ? { ...sub, completed: !sub.completed } : sub
    );
    onUpdate(item._id, { subtasks: updatedSubtasks, actor: activeUser });
  };

  const handleRemoveSubtask = (idx) => {
    const updatedSubtasks = (item.subtasks || []).filter((_, i) => i !== idx);
    onUpdate(item._id, { subtasks: updatedSubtasks, actor: activeUser });
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const newCommentObj = {
      author: activeUser,
      text: newComment.trim(),
      createdAt: new Date().toISOString()
    };
    const updatedComments = [...(item.comments || []), newCommentObj];
    onUpdate(item._id, { comments: updatedComments, actor: activeUser });
    setNewComment('');
  };

  const handleLogWork = (e) => {
    e.preventDefault();
    const hrs = Number(logHours);
    if (!hrs || hrs <= 0) return;

    const currentSpent = item.timeSpent || 0;
    onUpdate(item._id, { timeSpent: currentSpent + hrs, actor: activeUser });
    setLogHours('');
  };

  const formattedCreated = new Date(item.createdAt || Date.now()).toLocaleDateString('default', {
    month: 'short', day: 'numeric', year: 'numeric'
  });

  // Calculate work log percentages
  const estimate = item.timeEstimate || 8;
  const spent = item.timeSpent || 0;
  const loggedPercentage = Math.min(Math.round((spent / estimate) * 100), 100);

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex pl-10 animate-in slide-in-from-right duration-200">
      <div className="fixed inset-0 -z-10 bg-slate-900/10 backdrop-blur-[1px]" onClick={onClose} />

      <div className="w-[500px] sm:w-[560px] bg-white border-l border-slate-200 p-6 flex flex-col h-full dark:border-slate-800 dark:bg-slate-900 shadow-2xl overflow-hidden">
               {/* HEADER: Title & actions */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3 mb-4 dark:border-slate-800 shrink-0">
          <div className="flex items-start gap-3 flex-1 pr-4 min-w-0">
            {/* Page Icon Picker Button */}
            <div className="relative shrink-0">
              <button
                disabled={isReadOnly}
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-xl hover:bg-slate-100 transition-all dark:bg-slate-950 dark:border-slate-850 cursor-pointer disabled:opacity-60"
                title="Select Page Icon"
              >
                {item.icon || "📝"}
              </button>
              
              {showEmojiPicker && (
                <div className="absolute left-0 mt-2 z-55 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-slate-800 dark:bg-slate-950 grid grid-cols-5 gap-1.5">
                  {POPULAR_EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        onUpdate(item._id, { icon: emoji, actor: activeUser });
                        setShowEmojiPicker(false);
                      }}
                      className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-lg transition-colors cursor-pointer dark:hover:bg-slate-900"
                    >
                      {emoji}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      onUpdate(item._id, { icon: "", actor: activeUser });
                      setShowEmojiPicker(false);
                    }}
                    className="col-span-5 text-[9px] font-bold text-center text-rose-500 hover:bg-rose-50 py-1 rounded-lg border border-dashed border-rose-200 dark:hover:bg-rose-950/20"
                  >
                    Remove Icon
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                {itemType} Details · {item.category || 'General'}
              </span>
              <h3 className="text-sm sm:text-base font-bold text-slate-850 dark:text-white leading-snug mt-0.5 truncate" title={item.title}>
                {item.title}
              </h3>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            {!isReadOnly && (
              <button 
                onClick={() => onDelete(item._id)}
                className="text-slate-350 hover:text-rose-600 transition-colors p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-950"
                title="Delete Item"
              >
                <Trash2 className="h-4.5 w-4.5" />
              </button>
            )}
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-slate-655 hover:bg-slate-50 p-1.5 rounded-lg dark:hover:bg-slate-950"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* SCROLLABLE BODY PANELS */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1 select-text">
          
          {isReadOnly && (
            <div className="rounded-xl bg-amber-50 border border-amber-205 p-3 text-[11px] font-semibold text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/50 flex items-center gap-2">
              <AlertOctagon className="h-4.5 w-4.5 text-amber-500 shrink-0" />
              <span>You are viewing this workspace in read-only mode because of your role permissions.</span>
            </div>
          )}

          {/* ─── PROPERTIES GRID ─── */}
          <div className="border border-slate-100/70 rounded-2xl p-4 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/20 space-y-3.5 text-xs">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 mb-2 dark:border-slate-800">
              Database properties
            </div>

            {/* Property: Status */}
            <div className="grid grid-cols-3 items-center">
              <span className="font-semibold text-slate-400 uppercase tracking-wide text-[10px]">Status</span>
              <div className="col-span-2">
                <select
                  disabled={isReadOnly}
                  value={item.status}
                  onChange={e => onUpdate(item._id, { status: e.target.value, actor: activeUser })}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold outline-none dark:border-slate-800 dark:bg-slate-900 disabled:opacity-60"
                >
                  {STATUS_MAPPINGS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>

            {/* Property: Assignee */}
            <div className="grid grid-cols-3 items-center">
              <span className="font-semibold text-slate-400 uppercase tracking-wide text-[10px]">Assignee</span>
              <div className="col-span-2">
                <select
                  disabled={isReadOnly}
                  value={item.owner || item.assignee || ''}
                  onChange={e => {
                    const val = e.target.value;
                    onUpdate(item._id, itemType === 'task' ? { owner: val, actor: activeUser } : { assignee: val, actor: activeUser });
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold outline-none dark:border-slate-800 dark:bg-slate-900 disabled:opacity-60"
                >
                  <option value="">Unassigned</option>
                  {EMPLOYEES.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                </select>
              </div>
            </div>

            {/* Property: Priority */}
            <div className="grid grid-cols-3 items-center">
              <span className="font-semibold text-slate-400 uppercase tracking-wide text-[10px]">Priority</span>
              <div className="col-span-2">
                <select
                  disabled={isReadOnly}
                  value={item.priority || 'medium'}
                  onChange={e => onUpdate(item._id, { priority: e.target.value, actor: activeUser })}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold outline-none dark:border-slate-800 dark:bg-slate-900 disabled:opacity-60"
                >
                  {PRIORITY_LEVELS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
            </div>

            {/* Property: Linked Epic */}
            <div className="grid grid-cols-3 items-center">
              <span className="font-semibold text-slate-400 uppercase tracking-wide text-[10px] flex items-center gap-1">
                <Tag className="h-3.5 w-3.5 text-indigo-400" />
                Epic Link
              </span>
              <div className="col-span-2">
                <select
                  disabled={isReadOnly}
                  value={item.epicId?._id || item.epicId || ''}
                  onChange={e => onUpdate(item._id, { epicId: e.target.value || null, actor: activeUser })}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold outline-none dark:border-slate-800 dark:bg-slate-900 w-full max-w-[200px] disabled:opacity-60"
                >
                  <option value="">No Epic linked</option>
                  {epics.map(ep => (
                    <option key={ep._id} value={ep._id}>{ep.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Property: Story Points */}
            <div className="grid grid-cols-3 items-center">
              <span className="font-semibold text-slate-400 uppercase tracking-wide text-[10px] flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                Story Points
              </span>
              <div className="col-span-2">
                <input
                  type="number"
                  disabled={isReadOnly}
                  value={item.storyPoints || 0}
                  onChange={e => onUpdate(item._id, { storyPoints: Number(e.target.value), actor: activeUser })}
                  className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-xs text-center font-bold dark:border-slate-800 dark:bg-slate-900 disabled:opacity-60"
                  min="0"
                />
              </div>
            </div>

            {/* Property: Due Date */}
            <div className="grid grid-cols-3 items-center">
              <span className="font-semibold text-slate-400 uppercase tracking-wide text-[10px] flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-rose-500" />
                Due Date
              </span>
              <div className="col-span-2">
                <input
                  type="date"
                  disabled={isReadOnly}
                  value={item.dueDate || ''}
                  onChange={e => onUpdate(item._id, { dueDate: e.target.value, actor: activeUser })}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold outline-none dark:border-slate-800 dark:bg-slate-900 disabled:opacity-60"
                />
              </div>
            </div>

            {/* Property: Blocker Switch */}
            <div className="grid grid-cols-3 items-center">
              <span className="font-semibold text-slate-400 uppercase tracking-wide text-[10px] flex items-center gap-1">
                <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
                Blocked
              </span>
              <div className="col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    disabled={isReadOnly}
                    type="checkbox"
                    checked={item.blocked || false}
                    onChange={e => onUpdate(item._id, { blocked: e.target.checked, actor: activeUser })}
                    className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4 disabled:opacity-60"
                  />
                  <span className="text-[10px] font-bold text-slate-400">Flag delivery blockage</span>
                </label>
              </div>
            </div>

            {/* Property: Estimates & Log Work */}
            <div className="grid grid-cols-3 items-start">
              <span className="font-semibold text-slate-400 uppercase tracking-wide text-[10px] flex items-center gap-1 mt-1">
                <Timer className="h-3.5 w-3.5 text-emerald-500" />
                Time Tracker
              </span>
              <div className="col-span-2 space-y-2">
                
                {/* Time Estimate input */}
                <div className="flex items-center gap-2">
                  <input
                    disabled={isReadOnly}
                    type="number"
                    value={item.timeEstimate || 8}
                    onChange={e => onUpdate(item._id, { timeEstimate: Number(e.target.value), actor: activeUser })}
                    className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-xs text-center font-bold dark:border-slate-800 dark:bg-slate-900 disabled:opacity-60"
                  />
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Estimated Hours</span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="h-1.5 w-full bg-slate-100 rounded-full dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${loggedPercentage}%` }} />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                    <span>{spent}h logged</span>
                    <span>{loggedPercentage}% estimated</span>
                  </div>
                </div>

                {/* Log work hours form */}
                {!isReadOnly && (
                  <form onSubmit={handleLogWork} className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Log hrs"
                      value={logHours}
                      onChange={e => setLogHours(e.target.value)}
                      className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-xs text-center dark:border-slate-800 dark:bg-slate-900"
                    />
                    <button
                      type="submit"
                      className="rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-250 px-2 py-0.5 text-[10px] font-bold dark:bg-emerald-950/20 dark:text-emerald-400 cursor-pointer"
                    >
                      Log Time
                    </button>
                  </form>
                )}

              </div>
            </div>

            {/* Property: Created Timestamp */}
            <div className="grid grid-cols-3 items-center">
              <span className="font-semibold text-slate-400 uppercase tracking-wide text-[10px] flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                Created At
              </span>
              <span className="col-span-2 font-bold text-slate-500">{formattedCreated}</span>
            </div>

          </div>

          {/* ─── DESCRIPTION BOX (WITH SLASH COMMANDS) ─── */}
          <div className="relative">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-yellow-500" />
              Workspace Description (Type / for commands)
            </label>
            <textarea
              disabled={isReadOnly}
              ref={descRef}
              placeholder={isReadOnly ? "No description available..." : "Add details. Use / for templates..."}
              value={description}
              onChange={e => {
                setDescription(e.target.value);
                // Hide slash menu if slash is deleted
                if (!e.target.value.includes('/')) setShowSlashMenu(false);
              }}
              onKeyDown={handleDescKeyDown}
              onBlur={handleDescBlur}
              rows="6"
              className="w-full rounded-xl border border-slate-205 bg-slate-50 px-3.5 py-2.5 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-850 dark:bg-slate-950 dark:text-slate-355 font-sans leading-relaxed disabled:opacity-75 disabled:bg-slate-100/50"
            />

            {/* Floating Slash Commands Menu */}
            {showSlashMenu && (
              <div 
                className="absolute z-50 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl dark:border-slate-800 dark:bg-slate-950 animate-in fade-in zoom-in-95 duration-100 text-xs"
                style={{ top: slashCoords.top, left: slashCoords.left }}
              >
                <div className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 mb-1 dark:border-slate-800">
                  Document Block Templates
                </div>
                {SLASH_COMMANDS.map(cmd => (
                  <button
                    key={cmd.id}
                    type="button"
                    onClick={() => insertSlashCommand(cmd.text)}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-slate-650 hover:bg-slate-50 dark:text-slate-350 dark:hover:bg-slate-900 transition-colors"
                  >
                    <div>
                      <div>{cmd.label}</div>
                      <div className="text-[9px] text-slate-400 font-normal">{cmd.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Subtasks Checklist */}
          <div className="border-t border-slate-100 pt-4 dark:border-slate-850">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-705 dark:text-slate-200 mb-3 uppercase tracking-wider">
              <CheckSquare className="h-4 w-4 text-indigo-500" />
              <span>Sub-Tasks / Acceptance Criteria</span>
            </div>

            <div className="space-y-2 mb-3">
              {(item.subtasks || []).map((sub, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between gap-2 bg-slate-50/50 hover:bg-slate-50 px-3 py-2 rounded-xl dark:bg-slate-950/20 dark:hover:bg-slate-950"
                >
                  <button
                    disabled={isReadOnly}
                    onClick={() => handleToggleSubtask(idx)}
                    className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 text-left flex-1"
                  >
                    {sub.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 animate-in zoom-in-50 duration-150" />
                    ) : (
                      <Circle className="h-4 w-4 text-slate-305 shrink-0" />
                    )}
                    <span className={sub.completed ? 'line-through text-slate-405' : ''}>
                      {sub.title}
                    </span>
                  </button>
                  {!isReadOnly && (
                    <button
                      onClick={() => handleRemoveSubtask(idx)}
                      className="text-slate-300 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
              
              {(item.subtasks || []).length === 0 && (
                <div className="text-[10px] text-slate-400 italic p-1">No checklist subtasks.</div>
              )}
            </div>

            {!isReadOnly && (
              <form onSubmit={handleAddSubtask} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add sub-task..."
                  value={newSubtask}
                  onChange={e => setNewSubtask(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-850 dark:bg-slate-950 dark:text-slate-300"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-205 p-1.5 text-slate-655 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>

          {/* ─── ATTACHMENTS & DOCUMENT MANAGER ─── */}
          <div className="border-t border-slate-105 pt-4.5 dark:border-slate-850">
            <div className="flex items-center justify-between mb-3.5 select-none">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-705 dark:text-slate-200 uppercase tracking-wider">
                <Paperclip className="h-4 w-4 text-indigo-500 shrink-0" />
                <span>Linked Documents ({(item.attachments || []).length})</span>
              </div>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => setShowAttachForm(!showAttachForm)}
                  className="text-[9px] font-extrabold uppercase bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-900 border border-slate-205 dark:border-slate-800 text-slate-505 hover:text-indigo-600 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  {showAttachForm ? 'Cancel' : 'Attach File'}
                </button>
              )}
            </div>

            {/* Simulated file upload form details */}
            {showAttachForm && !isReadOnly && (
              <form onSubmit={handleAddAttachment} className="bg-slate-50/40 dark:bg-slate-955/20 p-4 rounded-xl border border-slate-150/60 dark:border-slate-850/60 mb-4 space-y-3">
                <div className="text-[9px] font-black text-slate-450 uppercase tracking-wider">Configure Simulated Document Registry</div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[8px] font-bold uppercase tracking-wider text-slate-400 mb-1">File Name</label>
                    <input
                      type="text"
                      placeholder="e.g. DIB-Integration-Specs"
                      value={newFileName}
                      onChange={e => setNewFileName(e.target.value)}
                      className="w-full rounded-lg border border-slate-205 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500 dark:border-slate-850 dark:bg-slate-900 dark:text-slate-300 font-semibold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-bold uppercase tracking-wider text-slate-400 mb-1">File Size</label>
                    <input
                      type="text"
                      placeholder="e.g. 1.5 MB, 320 KB"
                      value={newFileSize}
                      onChange={e => setNewFileSize(e.target.value)}
                      className="w-full rounded-lg border border-slate-205 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500 dark:border-slate-850 dark:bg-slate-900 dark:text-slate-300 font-semibold"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[8px] font-bold uppercase tracking-wider text-slate-400 mb-1">Document Format</label>
                    <select
                      value={newFileType}
                      onChange={e => setNewFileType(e.target.value)}
                      className="w-full rounded-lg border border-slate-205 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500 dark:border-slate-850 dark:bg-slate-900 dark:text-slate-300 font-bold cursor-pointer"
                    >
                      <option value="pdf">PDF Specification Document (*.pdf)</option>
                      <option value="docx">Word Specification Draft (*.docx)</option>
                      <option value="xlsx">Excel Project Roadmap (*.xlsx)</option>
                      <option value="json">JSON Node API Payload Config (*.json)</option>
                      <option value="png">PNG Screenshot Mockup (*.png)</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="flex items-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3.5 py-1.5 text-[10px] font-bold text-white shadow-sm cursor-pointer hover:scale-[1.01] active:scale-95 duration-100"
                  >
                    <Plus className="h-3 w-3" />
                    Attach Document
                  </button>
                </div>
              </form>
            )}

            {/* List of attachments inside the document vault */}
            <div className="space-y-2 mb-4 max-h-56 overflow-y-auto pr-1">
              {(item.attachments || []).map((attach, idx) => {
                const style = getFileTypeStyle(attach.fileType);
                const attachDate = new Date(attach.createdAt || Date.now()).toLocaleDateString('default', {
                  month: 'short', day: 'numeric'
                });
                return (
                  <div 
                    key={idx} 
                    className="bg-slate-50/20 hover:bg-slate-50/50 dark:bg-slate-955/10 dark:hover:bg-slate-950/20 px-3 py-2 rounded-2xl border border-slate-150/50 dark:border-slate-850/55 flex items-center justify-between gap-3 group transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Document extensions badges */}
                      <div className={`h-8 w-8 rounded-lg ${style.bg} text-white flex items-center justify-center font-black text-[9px] shrink-0 shadow-sm select-none`}>
                        {style.text}
                      </div>
                      
                      <div className="min-w-0 select-all">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-205 truncate leading-snug" title={attach.name}>
                          {attach.name}
                        </div>
                        <div className="text-[8.5px] text-slate-400 mt-0.5 font-bold flex items-center gap-1.5 leading-none">
                          <span>{attach.fileSize}</span>
                          <span>•</span>
                          <span>{attachDate}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity select-none">
                      <a 
                        href="#" 
                        onClick={(e) => { e.preventDefault(); alert(`Simulating file download/preview for: ${attach.name}`); }}
                        className="text-slate-400 hover:text-indigo-600 transition-colors p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900"
                        title="Download Attachment"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(idx)}
                          className="text-slate-350 hover:text-rose-600 transition-colors p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
                          title="Remove Attachment"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {(item.attachments || []).length === 0 && (
                <div className="text-[10px] text-slate-400 italic p-1">No documents attached to this {itemType}.</div>
              )}
            </div>
          </div>

          {/* Discussion comments feed */}
          <div className="border-t border-slate-100 pt-4 dark:border-slate-850">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-705 dark:text-slate-200 mb-3 uppercase tracking-wider">
              <MessageSquare className="h-4 w-4 text-indigo-500" />
              <span>Discussion Activity</span>
            </div>

            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-1">
              {(item.comments || []).map((c, idx) => {
                const cDate = new Date(c.createdAt).toLocaleDateString('default', {
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                });
                return (
                  <div key={idx} className="bg-slate-50/70 p-3 rounded-2xl dark:bg-slate-950/20">
                    <div className="flex items-center justify-between text-[9px] font-bold text-slate-450 uppercase mb-1">
                      <span>{c.author}</span>
                      <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {cDate}</span>
                    </div>
                    <p className="text-xs text-slate-705 dark:text-slate-300 leading-normal">{c.text}</p>
                  </div>
                );
              })}
              
              {(item.comments || []).length === 0 && (
                <div className="text-[10px] text-slate-400 italic p-1">No comments posted yet.</div>
              )}
            </div>

            {!isReadOnly && (
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-850 dark:bg-slate-950 dark:text-slate-300"
                  required
                />
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 shrink-0 cursor-pointer"
                >
                  Send
                </button>
              </form>
            )}
          </div>

          {/* ─── AUDIT HISTORY STREAM ─── */}
          <div className="border-t border-slate-100 pt-4 dark:border-slate-850">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-705 dark:text-slate-200 mb-3 uppercase tracking-wider">
              <Clock className="h-4 w-4 text-indigo-500" />
              <span>Audit History Logs</span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {(item.history || []).map((h, idx) => {
                const hDate = new Date(h.createdAt).toLocaleDateString('default', {
                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                });
                return (
                  <div key={idx} className="flex items-start gap-2 text-[10px] text-slate-450 leading-relaxed font-mono">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <strong className="text-slate-650 dark:text-slate-350">{h.actor}</strong> {h.action}
                    </div>
                    <span className="text-[8px] whitespace-nowrap opacity-75">{hDate}</span>
                  </div>
                );
              })}
              
              {(item.history || []).length === 0 && (
                <div className="text-[10px] text-slate-400 italic p-1">No action audit history recorded.</div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
