import { useState, useMemo } from 'react';
import { 
  FileText, Search, Plus, ExternalLink, Download, Trash2, Filter, Info, Link as LinkIcon, BookOpen
} from 'lucide-react';

const INITIAL_DOCUMENTS = [
  {
    _id: "doc-1",
    name: "Eximbills_Enterprise_Upgrade_Specs.pdf",
    category: "Specifications",
    fileType: "pdf",
    fileSize: "2.8 MB",
    url: "https://github.com/FinstackTech/Tracker/blob/main/docs/specs.pdf",
    description: "Detailed system and data requirements mapping for the Al Rajhi Bank Eximbills platform core upgrade."
  },
  {
    _id: "doc-2",
    name: "Al_Rajhi_Sanctions_Integration_Guide.docx",
    category: "Integrations",
    fileType: "docx",
    fileSize: "1.4 MB",
    url: "https://github.com/FinstackTech/Tracker/blob/main/docs/sanctions_guide.docx",
    description: "Technical workflow specification mapping task flows to the FircoSoft sanctions check backend."
  },
  {
    _id: "doc-3",
    name: "Bawatech_Phase3_API_Schema.json",
    category: "Schemas",
    fileType: "json",
    fileSize: "256 KB",
    url: "https://github.com/FinstackTech/Tracker/blob/main/docs/api_schema.json",
    description: "Structured JSON schemas for the Bawatech Phase 3 API endpoint integrations."
  },
  {
    _id: "doc-4",
    name: "Notion_Styling_Theme_Manual.md",
    category: "Notion wiki",
    fileType: "notion",
    fileSize: "Notion URL",
    url: "https://notion.so/finstack/theme-sharing-guide",
    description: "Live Notion documentation detailing style tokens, fonts, and Apple design rules."
  },
  {
    _id: "doc-5",
    name: "Export_LC_Financing_Formulas.xlsx",
    category: "Templates",
    fileType: "xlsx",
    fileSize: "780 KB",
    url: "https://github.com/FinstackTech/Tracker/blob/main/docs/formulas.xlsx",
    description: "Financial formulas matrix supporting Bai' Ajel export LC pricing calculations."
  }
];

export default function DocManagerTab({ activeProject, currentUser }) {
  const [documents, setDocuments] = useState(INITIAL_DOCUMENTS);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAddDoc, setShowAddDoc] = useState(false);

  // Form States
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Specifications');
  const [newType, setNewType] = useState('pdf');
  const [newSize, setNewSize] = useState('1.2 MB');
  const [newUrl, setNewUrl] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Head';

  // Categories list
  const categories = ['All', 'Specifications', 'Integrations', 'Schemas', 'Notion wiki', 'Templates'];

  // Filtered documents list
  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      const matchSearch = doc.name.toLowerCase().includes(search.toLowerCase()) || 
                          doc.description.toLowerCase().includes(search.toLowerCase());
      const matchCat = selectedCategory === 'All' || doc.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [documents, search, selectedCategory]);

  const handleAddDocument = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newDoc = {
      _id: `doc-${Date.now()}`,
      name: newName.trim(),
      category: newCategory,
      fileType: newType,
      fileSize: newType === 'notion' ? 'Notion URL' : newSize,
      url: newUrl.trim() || 'https://github.com/FinstackTech/Tracker',
      description: newDesc.trim() || "No description provided."
    };

    setDocuments(prev => [newDoc, ...prev]);
    
    // Reset Form
    setNewName('');
    setNewUrl('');
    setNewDesc('');
    setShowAddDoc(false);
  };

  const handleDeleteDoc = (id) => {
    if (!confirm("Are you sure you want to delete this document reference?")) return;
    setDocuments(prev => prev.filter(d => d._id !== id));
  };

  const getFileIconColor = (type) => {
    switch (type) {
      case 'pdf': return 'bg-rose-500 text-white';
      case 'docx': return 'bg-blue-500 text-white';
      case 'xlsx': return 'bg-emerald-600 text-white';
      case 'json': return 'bg-amber-500 text-white';
      case 'notion': return 'bg-slate-900 text-white dark:bg-slate-800';
      default: return 'bg-slate-500 text-white';
    }
  };

  return (
    <div className="apple-card p-6">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-150/40 pb-4 dark:border-slate-800/40">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-500">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-850 dark:text-slate-100 uppercase tracking-wider">
              Document Management Vault
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Wiki databases, file references, specs, and external attachments</p>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowAddDoc(!showAddDoc)}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-755 px-4 py-2.5 text-xs font-bold text-white shadow-sm cursor-pointer select-none"
          >
            <Plus className="h-4 w-4" />
            Attach Document
          </button>
        )}
      </div>

      {/* Add Document Panel Form */}
      {showAddDoc && (
        <form onSubmit={handleAddDocument} className="mb-6 p-4 rounded-2xl bg-slate-50/50 border border-slate-100 dark:bg-slate-955/20 dark:border-slate-850 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <h5 className="text-[10px] font-black text-slate-450 uppercase tracking-wider">Reference Outbound Attachment / Document</h5>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-[9px] font-black uppercase text-slate-400">File Name / Page Title</label>
              <input
                type="text"
                placeholder="e.g. Eximbills_Integration_Specs"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full rounded-xl border border-slate-205 bg-white px-3.5 py-1.5 text-xs outline-none focus:border-indigo-500 dark:border-slate-850 dark:bg-slate-900 dark:text-slate-300 font-semibold"
                required
              />
            </div>
            
            <div className="space-y-1">
              <label className="block text-[9px] font-black uppercase text-slate-400">Category Folder</label>
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-205 bg-white px-3.5 py-1.5 text-xs outline-none focus:border-indigo-500 dark:border-slate-850 dark:bg-slate-900 dark:text-slate-300 font-bold"
              >
                {categories.slice(1).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="block text-[9px] font-black uppercase text-slate-400">Format</label>
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value)}
                  className="w-full rounded-xl border border-slate-205 bg-white px-3.5 py-1.5 text-xs outline-none focus:border-indigo-500 dark:border-slate-850 dark:bg-slate-900 dark:text-slate-300 font-bold"
                >
                  <option value="pdf">PDF File</option>
                  <option value="docx">Word Doc</option>
                  <option value="xlsx">Excel Sheet</option>
                  <option value="json">JSON Schema</option>
                  <option value="notion">Notion URL</option>
                </select>
              </div>
              
              <div className="space-y-1">
                <label className="block text-[9px] font-black uppercase text-slate-400">File Size</label>
                <input
                  type="text"
                  placeholder="e.g. 2.4 MB"
                  value={newSize}
                  disabled={newType === 'notion'}
                  onChange={e => setNewSize(e.target.value)}
                  className="w-full rounded-xl border border-slate-205 bg-white px-3.5 py-1.5 text-xs outline-none focus:border-indigo-500 dark:border-slate-850 dark:bg-slate-900 dark:text-slate-300 font-semibold disabled:opacity-50"
                />
              </div>
            </div>

            <div className="sm:col-span-3 space-y-1">
              <label className="block text-[9px] font-black uppercase text-slate-400">File link URL / Notion URL</label>
              <input
                type="url"
                placeholder="https://notion.so/... or repository file link"
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                className="w-full rounded-xl border border-slate-205 bg-white px-3.5 py-1.5 text-xs outline-none focus:border-indigo-500 dark:border-slate-850 dark:bg-slate-900 dark:text-slate-300 font-semibold"
              />
            </div>

            <div className="sm:col-span-3 space-y-1">
              <label className="block text-[9px] font-black uppercase text-slate-400">Brief Description / Usage Notes</label>
              <textarea
                rows="2"
                placeholder="Explain the contents of this document..."
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                className="w-full rounded-xl border border-slate-205 bg-white px-3.5 py-2 text-xs outline-none focus:border-indigo-500 dark:border-slate-850 dark:bg-slate-900 dark:text-slate-300 font-semibold resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddDoc(false)}
              className="rounded-xl border border-slate-200 hover:bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 dark:border-slate-800 dark:hover:bg-slate-900 dark:text-slate-300 cursor-pointer select-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 hover:bg-indigo-755 px-4.5 py-2 text-xs font-bold text-white shadow-sm cursor-pointer select-none"
            >
              Confirm Attach
            </button>
          </div>
        </form>
      )}

      {/* Toolbar filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
        
        {/* Search */}
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search document vault..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-205 bg-slate-50/50 pl-10 pr-4 py-2.5 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-850 dark:bg-slate-950 dark:text-slate-300 font-semibold"
          />
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none py-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold shrink-0 cursor-pointer transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-100/40'
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100 dark:bg-slate-950 dark:text-slate-400 dark:hover:bg-slate-900 border border-transparent'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDocs.map(doc => (
          <div 
            key={doc._id} 
            className="p-4 rounded-2xl border border-slate-100 bg-slate-50/15 dark:border-slate-850 dark:bg-slate-955/10 hover:border-slate-200 dark:hover:border-slate-800 transition-all flex gap-3.5 relative group"
          >
            {/* Format Icon */}
            <div className={`h-11 w-11 rounded-xl flex flex-col items-center justify-center font-bold text-[10px] uppercase shrink-0 ${getFileIconColor(doc.fileType)}`}>
              <FileText className="h-5 w-5 mb-0.5" />
              <span className="text-[7.5px] leading-none font-black">{doc.fileType}</span>
            </div>

            {/* Document Details */}
            <div className="flex-1 min-w-0 pr-6">
              <h5 className="text-xs font-bold text-slate-850 dark:text-slate-200 truncate leading-tight mb-1" title={doc.name}>
                {doc.name}
              </h5>
              
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[8px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-100/20 dark:bg-indigo-950/20 dark:text-indigo-455">
                  {doc.category}
                </span>
                <span className="text-[8.5px] text-slate-400 font-semibold">{doc.fileSize}</span>
              </div>

              <p className="text-[10px] text-slate-455 leading-relaxed font-medium line-clamp-2">
                {doc.description}
              </p>
            </div>

            {/* Action buttons (Right Overlay) */}
            <div className="absolute right-3.5 top-3.5 flex items-center gap-1.5">
              <a 
                href={doc.url} 
                target="_blank" 
                rel="noreferrer"
                className="p-1 rounded bg-white hover:bg-slate-50 text-slate-500 border border-slate-150 dark:bg-slate-950 dark:border-slate-850 dark:text-slate-400 dark:hover:bg-slate-900 cursor-pointer"
                title={doc.fileType === 'notion' ? "Open Notion Wiki" : "Preview Document"}
              >
                {doc.fileType === 'notion' ? <BookOpen className="h-3.5 w-3.5" /> : <ExternalLink className="h-3.5 w-3.5" />}
              </a>
              {isAdmin && (
                <button
                  onClick={() => handleDeleteDoc(doc._id)}
                  className="p-1 rounded bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-150 dark:bg-slate-950 dark:border-slate-850 dark:hover:bg-rose-955/20 cursor-pointer"
                  title="Remove Document reference"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}

        {filteredDocs.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-450 italic text-xs">
            No matching documents found in this folder.
          </div>
        )}
      </div>

    </div>
  );
}
