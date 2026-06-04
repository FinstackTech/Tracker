import { useState, useMemo } from 'react';
import { 
  FileText, Search, Plus, ExternalLink, Download, Trash2, Filter, Info, Link as LinkIcon, BookOpen, 
  Share2, Eye, Edit, CloudLightning, HardDrive, AlertCircle, X, Check, Copy, RefreshCw, FileArchive
} from 'lucide-react';

const INITIAL_DOCUMENTS = [
  {
    _id: "doc-1",
    name: "Eximbills_Enterprise_Upgrade_Specs.pdf",
    category: "Specifications",
    fileType: "pdf",
    fileSize: "2.8 MB",
    sizeBytes: 2936012,
    owner: "Superadmin",
    lastUpdated: "2026-06-03 14:32",
    url: "https://github.com/FinstackTech/Tracker/blob/main/docs/specs.pdf",
    description: "Detailed system and data requirements mapping for the Al Rajhi Bank Eximbills platform core upgrade."
  },
  {
    _id: "doc-2",
    name: "Al_Rajhi_Sanctions_Integration_Guide.docx",
    category: "Integrations",
    fileType: "docx",
    fileSize: "1.4 MB",
    sizeBytes: 1468006,
    owner: "Superadmin",
    lastUpdated: "2026-06-02 09:15",
    url: "https://github.com/FinstackTech/Tracker/blob/main/docs/sanctions_guide.docx",
    description: "Technical workflow specification mapping task flows to the FircoSoft sanctions check backend."
  },
  {
    _id: "doc-3",
    name: "Bawatech_Phase3_API_Schema.json",
    category: "Schemas",
    fileType: "json",
    fileSize: "256 KB",
    sizeBytes: 262144,
    owner: "Superadmin",
    lastUpdated: "2026-06-03 17:10",
    url: "https://github.com/FinstackTech/Tracker/blob/main/docs/api_schema.json",
    description: "Structured JSON schemas for the Bawatech Phase 3 API endpoint integrations."
  },
  {
    _id: "doc-4",
    name: "Styling_Theme_Manual.md",
    category: "Workspace wiki",
    fileType: "wiki",
    fileSize: "Wiki URL",
    sizeBytes: 0,
    owner: "Superadmin",
    lastUpdated: "2026-06-01 11:20",
    url: "https://finstack/theme-sharing-guide",
    description: "Live documentation detailing style tokens, fonts, and Apple design rules."
  },
  {
    _id: "doc-5",
    name: "Export_LC_Financing_Formulas.xlsx",
    category: "Templates",
    fileType: "xlsx",
    fileSize: "780 KB",
    sizeBytes: 798720,
    owner: "Superadmin",
    lastUpdated: "2026-05-28 16:45",
    url: "https://github.com/FinstackTech/Tracker/blob/main/docs/formulas.xlsx",
    description: "Financial formulas matrix supporting Bai' Ajel export LC pricing calculations."
  }
];

export default function DocManagerTab({ activeProject, currentUser, showToast }) {
  const [documents, setDocuments] = useState(INITIAL_DOCUMENTS);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [formatFilter, setFormatFilter] = useState('All');
  const [ownerFilter, setOwnerFilter] = useState('All');
  
  // Modals & Panels State
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null); // Document selected for simulated preview
  const [editingDoc, setEditingDoc] = useState(null); // Document selected for metadata edit
  const [replacingDoc, setReplacingDoc] = useState(null); // Document selected for replacing version
  
  // Form States (New document)
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Specifications');
  const [newType, setNewType] = useState('pdf');
  const [newSize, setNewSize] = useState('1.2 MB');
  const [newUrl, setNewUrl] = useState('');
  const [newDesc, setNewDesc] = useState('');

  // Form States (Editing metadata)
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('Specifications');
  const [editUrl, setEditUrl] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // Form States (Replacing version)
  const [replaceSize, setReplaceSize] = useState('1.5 MB');

  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Head';

  // Categories list
  const categories = ['All', 'Specifications', 'Integrations', 'Schemas', 'Workspace wiki', 'Templates'];
  
  // Unique Owners list
  const uniqueOwners = ['All', ...new Set(documents.map(d => d.owner))];

  // Calculate storage usage
  const totalSizeBytes = useMemo(() => {
    return documents.reduce((sum, d) => sum + (d.sizeBytes || 0), 0);
  }, [documents]);

  const storageMaxBytes = 50 * 1024 * 1024; // 50 MB
  const percentUsed = ((totalSizeBytes / storageMaxBytes) * 100).toFixed(1);
  const totalSizeFormatted = (totalSizeBytes / (1024 * 1024)).toFixed(2);

  // Filtered documents list
  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      const matchSearch = doc.name.toLowerCase().includes(search.toLowerCase()) || 
                          doc.description.toLowerCase().includes(search.toLowerCase());
      const matchCat = selectedCategory === 'All' || doc.category === selectedCategory;
      const matchFormat = formatFilter === 'All' || doc.fileType === formatFilter;
      const matchOwner = ownerFilter === 'All' || doc.owner === ownerFilter;
      return matchSearch && matchCat && matchFormat && matchOwner;
    });
  }, [documents, search, selectedCategory, formatFilter, ownerFilter]);

  const handleAddDocument = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    // Convert size to bytes roughly for storage calculation
    let sizeBytes = 0;
    if (newType !== 'wiki') {
      const numericVal = parseFloat(newSize) || 1.0;
      const isKB = newSize.toLowerCase().includes('kb');
      sizeBytes = isKB ? Math.round(numericVal * 1024) : Math.round(numericVal * 1024 * 1024);
    }

    const newDoc = {
      _id: `doc-${Date.now()}`,
      name: newName.trim().endsWith(`.${newType}`) ? newName.trim() : `${newName.trim()}.${newType}`,
      category: newCategory,
      fileType: newType,
      fileSize: newType === 'wiki' ? 'Wiki URL' : newSize,
      sizeBytes: sizeBytes,
      owner: currentUser?.name || 'Superadmin',
      lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16),
      url: newUrl.trim() || 'https://github.com/FinstackTech/Tracker',
      description: newDesc.trim() || "No description provided."
    };

    setDocuments(prev => [newDoc, ...prev]);
    showToast(`File "${newDoc.name}" attached successfully`, "success");
    
    // Reset Form
    setNewName('');
    setNewUrl('');
    setNewDesc('');
    setShowAddDoc(false);
  };

  const handleSaveMetadata = (e) => {
    e.preventDefault();
    if (!editingDoc || !editName.trim()) return;

    setDocuments(prev => prev.map(d => {
      if (d._id === editingDoc._id) {
        return {
          ...d,
          name: editName.trim(),
          category: editCategory,
          url: editUrl.trim(),
          description: editDesc.trim(),
          lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16)
        };
      }
      return d;
    }));

    showToast(`Metadata updated for "${editName}"`, "success");
    setEditingDoc(null);
  };

  const handleReplaceVersion = (e) => {
    e.preventDefault();
    if (!replacingDoc) return;

    const numericVal = parseFloat(replaceSize) || 1.0;
    const isKB = replaceSize.toLowerCase().includes('kb');
    const sizeBytes = isKB ? Math.round(numericVal * 1024) : Math.round(numericVal * 1024 * 1024);

    setDocuments(prev => prev.map(d => {
      if (d._id === replacingDoc._id) {
        return {
          ...d,
          fileSize: replaceSize,
          sizeBytes: sizeBytes,
          lastUpdated: new Date().toISOString().replace('T', ' ').substring(0, 16)
        };
      }
      return d;
    }));

    showToast(`Replaced file version for "${replacingDoc.name}" (${replaceSize})`, "success");
    setReplacingDoc(null);
  };

  const handleDeleteDoc = (doc) => {
    if (!confirm(`Are you sure you want to permanently delete document reference: "${doc.name}"?`)) return;
    setDocuments(prev => prev.filter(d => d._id !== doc._id));
    showToast(`Removed "${doc.name}" from document vault`, "success");
  };

  const handleShareDoc = (doc) => {
    navigator.clipboard.writeText(doc.url);
    showToast("Copied file link to clipboard!", "success");
  };

  const getFileIconColor = (type) => {
    switch (type) {
      case 'pdf': return 'bg-rose-500 text-white';
      case 'docx': return 'bg-blue-500 text-white';
      case 'xlsx': return 'bg-emerald-600 text-white';
      case 'json': return 'bg-amber-500 text-white';
      case 'wiki': return 'bg-slate-900 text-white dark:bg-slate-800';
      default: return 'bg-slate-500 text-white';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* STORAGE USAGE KPI & VAULT SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Storage Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_2px_8px_rgba(99,102,241,0.02)] dark:bg-slate-900 dark:border-slate-805/80 md:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4.5 w-4.5 text-indigo-500" />
              <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Workspace Cloud Storage</span>
            </div>
            <span className="text-[9.5px] bg-slate-50 border dark:bg-slate-950 dark:border-slate-800 px-2 py-0.5 rounded font-black text-slate-500 uppercase tracking-wide">
              {percentUsed}% Allocated
            </span>
          </div>

          <div className="my-4 space-y-2">
            <div className="h-2.5 w-full bg-slate-100 rounded-full dark:bg-slate-950 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full transition-all duration-500" 
                style={{ width: `${percentUsed}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-bold">
              <span>{totalSizeFormatted} MB Used</span>
              <span>50.0 MB Limit</span>
            </div>
          </div>

          <span className="text-[9.5px] text-slate-400 font-semibold block leading-tight">
            💡 Cloud attachments include specifications, schemas, spreadsheet calculations, and local wiki entries.
          </span>
        </div>

        {/* Totals Summary */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_2px_8px_rgba(99,102,241,0.02)] dark:bg-slate-900 dark:border-slate-805/80 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-455 tracking-wider block">Attached References</span>
            <span className="text-2xl font-black text-slate-800 dark:text-white block mt-1">{documents.length}</span>
            <span className="text-[9.5px] text-slate-400 mt-0.5 block font-semibold">Across {categories.length - 1} folders</span>
          </div>

          {isAdmin ? (
            <button
              onClick={() => setShowAddDoc(true)}
              className="w-full flex items-center justify-center gap-1.5 bg-indigo-650 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-md cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all"
            >
              <Plus className="h-4 w-4" />
              Attach Document
            </button>
          ) : (
            <div className="text-[9.5px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-955/20 border border-amber-100/50 dark:border-amber-950/20 px-3 py-2 rounded-xl text-center">
              ⚠️ Attaching files locked for viewer roles
            </div>
          )}
        </div>

      </div>

      {/* FILTER TOOLBAR */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-[0_2px_8px_rgba(99,102,241,0.02)] dark:bg-slate-900 dark:border-slate-805/80 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full md:max-w-xs shrink-0">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search filenames, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-205 rounded-xl bg-slate-50/50 outline-none text-xs focus:border-indigo-500 focus:bg-white dark:border-slate-850 dark:bg-slate-955 dark:text-slate-300 font-semibold"
          />
        </div>

        {/* Filters Select */}
        <div className="flex flex-wrap items-center gap-3 w-full md:justify-end">
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Format:</span>
            <select
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value)}
              className="border border-slate-205 bg-white text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 dark:border-slate-850 dark:bg-slate-950 dark:text-slate-300 cursor-pointer"
            >
              <option value="All">All Formats</option>
              <option value="pdf">PDF File</option>
              <option value="docx">Word Doc</option>
              <option value="xlsx">Excel Sheet</option>
              <option value="json">JSON Schema</option>
              <option value="wiki">Wiki Page</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Owner:</span>
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="border border-slate-205 bg-white text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 dark:border-slate-850 dark:bg-slate-950 dark:text-slate-300 cursor-pointer"
            >
              {uniqueOwners.map(owner => (
                <option key={owner} value={owner}>{owner}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {/* CATEGORY DIRECTORY TABS */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none select-none border-b border-slate-200 dark:border-slate-850 pb-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-205 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800/80 dark:hover:bg-slate-950/20'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ATTACHMENT LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDocs.map((doc) => (
          <div 
            key={doc._id}
            className="p-4 rounded-2xl bg-white border border-slate-200/80 dark:bg-slate-900 dark:border-slate-805/80 flex gap-4 transition-all hover:scale-[1.005] shadow-[0_2px_8px_rgba(99,102,241,0.01)] relative group"
          >
            {/* Format Avatar */}
            <div className={`h-11 w-11 rounded-xl flex flex-col items-center justify-center font-bold text-[10px] uppercase shrink-0 select-none ${getFileIconColor(doc.fileType)}`}>
              <FileText className="h-5 w-5 mb-0.5" />
              <span className="text-[7.5px] leading-none font-black">{doc.fileType}</span>
            </div>

            {/* Document Info details */}
            <div className="flex-1 min-w-0 pr-16 space-y-1">
              <h5 className="text-xs font-bold text-slate-850 dark:text-slate-200 truncate leading-snug" title={doc.name}>
                {doc.name}
              </h5>
              
              <div className="flex flex-wrap items-center gap-2 text-[9px] font-bold text-slate-400">
                <span className="uppercase px-1.5 py-0.2 rounded bg-indigo-50 border border-indigo-100 text-indigo-650 dark:bg-indigo-950/20 dark:border-indigo-900/40 dark:text-indigo-400">
                  {doc.category}
                </span>
                <span>{doc.fileSize}</span>
                <span>•</span>
                <span>{doc.owner}</span>
              </div>

              <p className="text-[10px] text-slate-455 leading-relaxed font-semibold line-clamp-2">
                {doc.description}
              </p>

              <span className="text-[8px] font-mono text-slate-400 block pt-1.5">Last updated: {doc.lastUpdated}</span>
            </div>

            {/* Actions Quick Column (Always visible immediately to matching side) */}
            <div className="absolute right-4.5 top-4 flex flex-col items-center gap-2">
              
              {/* Preview Button */}
              <button
                onClick={() => setPreviewDoc(doc)}
                className="p-1.8 rounded-lg bg-slate-50 border border-slate-205 hover:bg-slate-100 dark:bg-slate-950 dark:border-slate-800 text-slate-500 dark:text-slate-400 dark:hover:bg-slate-900 cursor-pointer transition-colors"
                title="Preview details"
              >
                <Eye className="h-3.5 w-3.5" />
              </button>

              {/* Share link button */}
              <button
                onClick={() => handleShareDoc(doc)}
                className="p-1.8 rounded-lg bg-slate-50 border border-slate-205 hover:bg-slate-100 dark:bg-slate-955 dark:border-slate-800 text-slate-500 dark:text-slate-400 dark:hover:bg-slate-900 cursor-pointer transition-colors"
                title="Copy share link"
              >
                <Share2 className="h-3.5 w-3.5" />
              </button>

              {/* Admin modifications dropdown simulated */}
              {isAdmin && (
                <div className="flex gap-1.5 mt-2 pt-2 border-t border-slate-100 dark:border-slate-850">
                  {/* Edit Metadata */}
                  <button
                    onClick={() => {
                      setEditingDoc(doc);
                      setEditName(doc.name);
                      setEditCategory(doc.category);
                      setEditUrl(doc.url);
                      setEditDesc(doc.description);
                    }}
                    className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-indigo-650 cursor-pointer"
                    title="Edit specs"
                  >
                    <Edit className="h-3 w-3" />
                  </button>

                  {/* Replace Version */}
                  <button
                    onClick={() => {
                      setReplacingDoc(doc);
                      setReplaceSize(doc.fileSize);
                    }}
                    className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-emerald-600 cursor-pointer"
                    title="Replace file version"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDeleteDoc(doc)}
                    className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-955/25 rounded text-slate-400 hover:text-rose-600 cursor-pointer"
                    title="Remove reference"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )}

            </div>

          </div>
        ))}

        {filteredDocs.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400 italic">
            Zero attachments or document guides found matching filters.
          </div>
        )}
      </div>

      {/* ─── ADD ATTACHMENT MODAL ─── */}
      {showAddDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider dark:text-white">
                Attach Reference Document
              </h3>
              <button onClick={() => setShowAddDoc(false)} className="text-slate-400 hover:text-slate-650 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddDocument} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Document Title / File Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. API_Specifications"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Category Folder
                  </label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-705 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-955 cursor-pointer"
                  >
                    {categories.slice(1).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Document Format
                  </label>
                  <select
                    value={newType}
                    onChange={e => setNewType(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-705 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-955 cursor-pointer"
                  >
                    <option value="pdf">PDF File</option>
                    <option value="docx">Word Document</option>
                    <option value="xlsx">Excel Spreadsheet</option>
                    <option value="json">JSON Schema</option>
                    <option value="wiki">Wiki URL Entry</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    File Size Estimate
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1.2 MB"
                    value={newSize}
                    disabled={newType === 'wiki'}
                    onChange={e => setNewSize(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Target Reference Link URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://finstack.com/doc..."
                    value={newUrl}
                    onChange={e => setNewUrl(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Brief description
                </label>
                <textarea
                  rows="2"
                  placeholder="Summarize document scope and contents..."
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-955 dark:text-slate-300 font-semibold resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-5 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddDoc(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-850 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-650 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-md cursor-pointer"
                >
                  Attach File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── SIMULATED PREVIEW MODAL ─── */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-855 pb-3.5 mb-4">
              <div className="flex items-center gap-2">
                <FileArchive className="h-5 w-5 text-indigo-500" />
                <h3 className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-wider">
                  Document Preview Core
                </h3>
              </div>
              <button 
                onClick={() => setPreviewDoc(null)} 
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-805 text-slate-400 hover:text-slate-655 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Simulated file viewer area */}
            <div className="flex-1 overflow-y-auto space-y-5 pr-1 text-xs">
              <div className="p-5 rounded-2xl bg-slate-950 text-slate-300 font-mono text-[10.5px] border border-slate-850 leading-relaxed shadow-inner select-all overflow-x-auto min-h-[160px]">
                <div className="text-indigo-400 font-bold mb-1"># Finstack Tracker Attachment Gateway</div>
                <div>Document: {previewDoc.name}</div>
                <div>Category: {previewDoc.category}</div>
                <div>Format: {previewDoc.fileType}</div>
                <div>File Size: {previewDoc.fileSize}</div>
                <div>Owner: {previewDoc.owner}</div>
                <div>Last modified: {previewDoc.lastUpdated}</div>
                <div className="text-slate-500 mt-4">// Summary Description:</div>
                <div className="text-slate-200 mt-0.5">{previewDoc.description}</div>
                <div className="text-slate-500 mt-4">// Live Storage URL Target:</div>
                <a href={previewDoc.url} target="_blank" rel="noreferrer" className="text-indigo-455 hover:underline break-all block">{previewDoc.url}</a>
              </div>

              {/* Detailed specs list */}
              <div className="space-y-3">
                <h5 className="font-bold text-slate-800 dark:text-slate-205 uppercase tracking-wide">Attachment specifications metadata</h5>
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-black block">Reference Key ID:</span>
                    <span>{previewDoc._id}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-black block">Storage Size in Bytes:</span>
                    <span>{previewDoc.sizeBytes ? `${previewDoc.sizeBytes.toLocaleString()} bytes` : 'N/A (External WikiLink)'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2.5 border-t border-slate-100 dark:border-slate-855 pt-4 mt-5">
              <button
                onClick={() => handleShareDoc(previewDoc)}
                className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                <LinkIcon className="h-3.5 w-3.5" />
                Copy Share Link
              </button>
              
              <a
                href={previewDoc.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 bg-indigo-650 hover:bg-indigo-700 text-white px-4.5 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                Open File Target
              </a>
            </div>

          </div>
        </div>
      )}

      {/* ─── EDIT METADATA MODAL ─── */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-slate-205 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider dark:text-white">
                Edit Reference Metadata
              </h3>
              <button onClick={() => setEditingDoc(null)} className="text-slate-400 hover:text-slate-655 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMetadata} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  File Name / Title
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-slate-202 bg-slate-50 px-3.5 py-2 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Category Folder
                </label>
                <select
                  value={editCategory}
                  onChange={e => setEditCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-202 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-955 cursor-pointer"
                >
                  {categories.slice(1).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Link / Wiki Page URL
                </label>
                <input
                  type="url"
                  value={editUrl}
                  onChange={e => setEditUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-202 bg-slate-50 px-3.5 py-2 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-955 dark:text-slate-300 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Description / Wiki summary
                </label>
                <textarea
                  rows="3"
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  className="w-full rounded-xl border border-slate-202 bg-slate-50 px-3.5 py-2 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-955 dark:text-slate-300 font-semibold resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-5 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:border-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-650 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 shadow-md cursor-pointer"
                >
                  Save Specs
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── REPLACE VERSION MODAL ─── */}
      {replacingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl border border-slate-202 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider dark:text-white">
                Replace File Version
              </h3>
              <button onClick={() => setReplacingDoc(null)} className="text-slate-405 hover:text-slate-655 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleReplaceVersion} className="space-y-4">
              <p className="text-xs text-slate-505 dark:text-slate-400 leading-relaxed font-semibold">
                Upload or overwrite a new version of file: <strong className="text-indigo-600 dark:text-indigo-400">{replacingDoc.name}</strong>. This updates file size and timestamps.
              </p>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  New File Size Estimate
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1.8 MB"
                  value={replaceSize}
                  onChange={e => setReplaceSize(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-805 dark:bg-slate-950 dark:text-slate-300 font-semibold"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-5 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setReplacingDoc(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 dark:border-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-md cursor-pointer"
                >
                  Confirm Overwrite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
