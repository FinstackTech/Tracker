import { useState, useEffect } from 'react';
import { 
  Settings, Key, Webhook, Bell, Send, CheckCircle, MessageSquare, AlertCircle, Tag, Trash2, Plus, Lock, FolderKanban, Cpu, GitBranch, Users, MessageCircle, Globe, Copy, Check
} from 'lucide-react';

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button 
      type="button" 
      onClick={handleCopy}
      className="px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-350 border border-slate-205 dark:border-slate-750 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
      title="Copy to clipboard"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-emerald-500 shrink-0" />
          <span className="text-emerald-500">Copied</span>
        </>
      ) : (
        <>
          <Copy className="h-3 w-3 text-slate-400 shrink-0" />
          <span>Copy</span>
        </>
      )}
    </button>
  );
};


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

const SlackIcon = (props) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...props}>
    <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523 2.528 2.528 0 0 1-2.522-2.523 2.528 2.528 0 0 1 2.522-2.52h2.52v2.52zm1.261 0a2.528 2.528 0 0 1 2.52-2.52h5.043a2.528 2.528 0 0 1 2.522 2.52v5.042a2.528 2.528 0 0 1-2.522 2.52H8.823a2.528 2.528 0 0 1-2.52-2.52v-5.042zM8.823 5.043a2.528 2.528 0 0 1-2.52-2.522A2.528 2.528 0 0 1 8.823 0a2.528 2.528 0 0 1 2.52 2.521v2.522h-2.52zm0 1.261a2.528 2.528 0 0 1 2.52 2.52v5.043a2.528 2.528 0 0 1-2.52 2.522H3.78a2.528 2.528 0 0 1-2.522-2.522V8.824a2.528 2.528 0 0 1 2.522-2.52h5.043zm10.135 3.764a2.528 2.528 0 0 1 2.52-2.52 2.528 2.528 0 0 1 2.522 2.52 2.528 2.528 0 0 1-2.522 2.52h-2.52v-2.52zm-1.262 0a2.528 2.528 0 0 1-2.52-2.52h-5.043a2.528 2.528 0 0 1-2.522-2.52V5.043a2.528 2.528 0 0 1 2.522-2.52h5.043a2.528 2.528 0 0 1 2.52 2.52v5.043zm-3.781 10.135a2.528 2.528 0 0 1 2.52 2.522 2.528 2.528 0 0 1-2.52-2.521 2.528 2.528 0 0 1-2.522-2.521v-2.522h2.522zm0-1.262a2.528 2.528 0 0 1-2.522-2.52v-5.043a2.528 2.528 0 0 1 2.522-2.52h5.043a2.528 2.528 0 0 1 2.522 2.52v5.043h-5.043z" />
  </svg>
);

const DiscordIcon = (props) => (
  <svg viewBox="0 0 127.14 96.36" width="16" height="16" fill="currentColor" {...props}>
    <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.5-5c1-.73,2-1.5,2.92-2.3a75.46,75.46,0,0,0,72.06,0c.93.8,1.92,1.57,2.92,2.3a68.43,68.43,0,0,1-10.5,5,77.7,77.7,0,0,0,6.63,10.85,105.73,105.73,0,0,0,31-18.83C129.07,48.24,122.9,25.43,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z" />
  </svg>
);

export default function SettingsTab({ 
  activeUser, 
  activeProject, 
  setActiveProject,
  epics = [], 
  setEpics, 
  currentUser,
  userProfiles = [],
  setUserProfiles,
  projects = [],
  setProjects,
  view = 'webhooks'
}) {
  const [epicName, setEpicName] = useState('');
  const [epicColor, setEpicColor] = useState('#4f46e5');
  const [creatingEpic, setCreatingEpic] = useState(false);

  // User Profile Form States
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('Employee');
  const [newUserPassword, setNewUserPassword] = useState('');

  // Project Registry Form States
  const [newProjName, setNewProjName] = useState('');
  const [newProjCode, setNewProjCode] = useState('');
  const [newProjClient, setNewProjClient] = useState('');
  const [newProjType, setNewProjType] = useState('delivery');
  const [addingProject, setAddingProject] = useState(false);

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;
    
    if (userProfiles.some(u => u.name.toLowerCase() === newUserName.trim().toLowerCase())) {
      alert("A user with this name already exists!");
      return;
    }

    const updated = [
      ...userProfiles,
      {
        name: newUserName.trim(),
        role: newUserRole,
        email: newUserEmail.trim(),
        password: newUserPassword.trim() || 'user'
      }
    ];
    setUserProfiles(updated);
    localStorage.setItem('company_user_profiles', JSON.stringify(updated));
    
    setNewUserName('');
    setNewUserEmail('');
    setNewUserRole('Employee');
    setNewUserPassword('');
  };

  const handleDeleteUser = (nameToDelete) => {
    if (nameToDelete === activeUser) {
      alert("You cannot delete the currently logged in user!");
      return;
    }
    if (!confirm(`Are you sure you want to delete profile: ${nameToDelete}?`)) return;

    const updated = userProfiles.filter(u => u.name !== nameToDelete);
    setUserProfiles(updated);
    localStorage.setItem('company_user_profiles', JSON.stringify(updated));
  };

  const handleAddProjectInline = async (e) => {
    e.preventDefault();
    if (!newProjName.trim() || !newProjCode.trim()) return;
    setAddingProject(true);

    const payload = {
      name: newProjName.trim(),
      code: newProjCode.trim().toUpperCase().replace(/\s+/g, '-'),
      client: newProjClient.trim() || 'Internal',
      type: newProjType,
      status: 'active'
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
        setNewProjName('');
        setNewProjCode('');
        setNewProjClient('');
        setNewProjType('delivery');
        alert(`Project "${payload.name}" initialized successfully!`);
      } else {
        alert(res.error || "Failed to create project");
      }
    } catch (err) {
      console.error(err);
      alert("Error initializing project");
    } finally {
      setAddingProject(false);
    }
  };
  
  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Head';
  const isManagerOrAdmin = 
    currentUser?.role === 'Admin' || 
    currentUser?.role === 'Head' || 
    currentUser?.role === 'Project Manager' || 
    currentUser?.role === 'Project Lead' || 
    currentUser?.role === 'Support Manager' || 
    currentUser?.role === 'Support Lead' || 
    currentUser?.role === 'Manager';
  const isReadOnly = !isAdmin && !isManagerOrAdmin;
  const [msTeamsUrl, setMsTeamsUrl] = useState('');
  const [slackUrl, setSlackUrl] = useState('');
  const [discordUrl, setDiscordUrl] = useState('');
  const [telegramToken, setTelegramToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [whatsAppToken, setWhatsAppToken] = useState('');
  const [whatsAppPhone, setWhatsAppPhone] = useState('');
  const [customWebhookUrl, setCustomWebhookUrl] = useState('');
  
  const [triggerOnBlocker, setTriggerOnBlocker] = useState(true);
  const [triggerOnCriticalBug, setTriggerOnCriticalBug] = useState(true);
  const [triggerOnTaskDone, setTriggerOnTaskDone] = useState(false);
  const [triggerOnIssueResolved, setTriggerOnIssueResolved] = useState(false);
  const [activeConnector, setActiveConnector] = useState('teams');
  
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch current integration settings
  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/integrations');
      const res = await response.json();
      if (res.success && res.data) {
        const d = res.data;
        setMsTeamsUrl(d.msTeamsUrl || '');
        setSlackUrl(d.slackUrl || '');
        setDiscordUrl(d.discordUrl || '');
        setTelegramToken(d.telegramToken || '');
        setTelegramChatId(d.telegramChatId || '');
        setWhatsAppToken(d.whatsAppToken || '');
        setWhatsAppPhone(d.whatsAppPhone || '');
        setCustomWebhookUrl(d.customWebhookUrl || '');
        setTriggerOnBlocker(d.triggerOnBlocker !== undefined ? d.triggerOnBlocker : true);
        setTriggerOnCriticalBug(d.triggerOnCriticalBug !== undefined ? d.triggerOnCriticalBug : true);
        setTriggerOnTaskDone(d.triggerOnTaskDone !== undefined ? d.triggerOnTaskDone : false);
        setTriggerOnIssueResolved(d.triggerOnIssueResolved !== undefined ? d.triggerOnIssueResolved : false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    const payload = {
      msTeamsUrl,
      slackUrl,
      discordUrl,
      telegramToken,
      telegramChatId,
      whatsAppToken,
      whatsAppPhone,
      customWebhookUrl,
      triggerOnBlocker,
      triggerOnCriticalBug,
      triggerOnTaskDone,
      triggerOnIssueResolved
    };

    try {
      const response = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const res = await response.json();
      if (res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleTestDispatch = async () => {
    setTesting(true);
    const payload = {
      msTeamsUrl,
      slackUrl,
      discordUrl,
      telegramToken,
      telegramChatId,
      whatsAppToken,
      whatsAppPhone,
      customWebhookUrl,
      triggerOnBlocker,
      triggerOnCriticalBug,
      triggerOnTaskDone,
      triggerOnIssueResolved,
      testDispatch: true,
      actor: activeUser
    };

    try {
      const response = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const res = await response.json();
      if (res.success) {
        alert("Diagnostic test trigger dispatched successfully! Check Teams, Slack, Discord, Telegram or WhatsApp channels.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in-30 duration-200">
      
      {/* ─── WEBHOOK CONFIGURATION FORM ─── */}
      {view === 'webhooks' && (
        <div className="apple-card p-6">
        
        <div className="flex items-center justify-between mb-6 border-b border-slate-150/40 pb-4 dark:border-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-500">
              <Webhook className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-850 dark:text-slate-100 uppercase tracking-wider">
                Third-Party Integrations & Hook Hub
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Route real-time alerts directly to enterprise messaging dashboards</p>
            </div>
          </div>
          <span className="text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-100/40 dark:border-indigo-900/30">
            Finstack Connect
          </span>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-6">
          
          {/* Responsive Connectors Sidebar Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[300px]">
            
            {/* Connector Selection List (Left Column) */}
            <div className="md:col-span-4 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible gap-1.5 pb-2 md:pb-0 border-b md:border-b-0 md:border-r border-slate-150/40 dark:border-slate-800/40 md:pr-4 scrollbar-none">
              
              {[
                { id: 'teams', label: 'MS Teams', desc: 'Office connector', icon: Webhook, color: 'bg-violet-500', active: !!msTeamsUrl, activeBg: 'bg-violet-50/70 border-violet-200 dark:bg-violet-955/20 dark:border-violet-900/50' },
                { id: 'slack', label: 'Slack Webhook', desc: 'Incoming webhook', icon: SlackIcon, color: 'bg-emerald-500', active: !!slackUrl, activeBg: 'bg-emerald-50/70 border-emerald-205 dark:bg-emerald-955/20 dark:border-emerald-900/50' },
                { id: 'discord', label: 'Discord API', desc: 'Server integrations', icon: DiscordIcon, color: 'bg-indigo-500', active: !!discordUrl, activeBg: 'bg-indigo-50/70 border-indigo-200 dark:bg-indigo-955/20 dark:border-indigo-900/50' },
                { id: 'telegram', label: 'Telegram Bot', desc: 'Direct message channels', icon: Send, color: 'bg-sky-500', active: !!telegramToken && !!telegramChatId, activeBg: 'bg-sky-50/70 border-sky-200 dark:bg-sky-955/20 dark:border-sky-900/50' },
                { id: 'whatsapp', label: 'WhatsApp', desc: 'Outbound trigger messages', icon: MessageCircle, color: 'bg-green-500', active: !!whatsAppToken && !!whatsAppPhone, activeBg: 'bg-green-50/70 border-green-200 dark:bg-green-955/20 dark:border-green-900/50' },
                { id: 'custom', label: 'Custom Hook', desc: 'Custom JSON payload', icon: Globe, color: 'bg-slate-550', active: !!customWebhookUrl, activeBg: 'bg-slate-100/70 border-slate-205 dark:bg-slate-900/20 dark:border-slate-800/50' }
              ].map(c => {
                const Icon = c.icon;
                const isSelected = activeConnector === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveConnector(c.id)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-3 shrink-0 md:shrink border hover:scale-[1.02] active:scale-[0.98] duration-150 ${
                      isSelected 
                        ? c.activeBg 
                        : 'border-transparent hover:bg-slate-50/50 dark:hover:bg-slate-900/20'
                    }`}
                  >
                    <div className={`h-7 w-7 rounded-lg ${c.color} text-white flex items-center justify-center shrink-0`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="hidden sm:block text-left overflow-hidden select-none">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-205 flex items-center gap-1.5">
                        {c.label}
                        {c.active && (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-400" />
                        )}
                      </div>
                      <div className="text-[9px] text-slate-450 truncate max-w-[120px] font-semibold">{c.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Connector Inputs Form Panel (Right Column) */}
            <div className="md:col-span-8 space-y-4">
              
              {activeConnector === 'teams' && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-violet-500" />
                    <h5 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                      Microsoft Teams Connector URL
                    </h5>
                  </div>
                  <p className="text-[10px] text-slate-405 leading-normal font-medium">
                    Configure Microsoft Teams Incoming Webhook. The application will post Adaptive Cards with structural details for blocker flags and critical incidents.
                  </p>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Payload Endpoint URL</label>
                    <input
                      type="url"
                      disabled={!isAdmin}
                      placeholder={isAdmin ? "https://yourbank.webhook.office.com/webhookb2/..." : "Restricted to Administrators"}
                      value={msTeamsUrl}
                      onChange={e => setMsTeamsUrl(e.target.value)}
                      className="w-full rounded-xl border border-slate-205 bg-slate-50/50 px-3.5 py-2.5 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-850 dark:bg-slate-950 dark:text-slate-350 disabled:opacity-60 font-semibold"
                    />
                  </div>
                </div>
              )}

              {activeConnector === 'slack' && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <h5 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                      Slack Webhook Connector
                    </h5>
                  </div>
                  <p className="text-[10px] text-slate-405 leading-normal font-medium">
                    Configure a Slack Incoming Webhook App integration. Updates will be pushed directly into your designated Slack workspace channel using formatted Markdown messages.
                  </p>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Slack Incoming Webhook URL</label>
                    <input
                      type="url"
                      disabled={!isAdmin}
                      placeholder={isAdmin ? "e.g. https://hooks.slack.com/services/YOUR_WEBHOOK_URL" : "Restricted to Administrators"}
                      value={slackUrl}
                      onChange={e => setSlackUrl(e.target.value)}
                      className="w-full rounded-xl border border-slate-205 bg-slate-50/50 px-3.5 py-2.5 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-850 dark:bg-slate-950 dark:text-slate-350 disabled:opacity-60 font-semibold"
                    />
                  </div>
                </div>
              )}

              {activeConnector === 'discord' && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-indigo-500" />
                    <h5 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                      Discord Webhook integration
                    </h5>
                  </div>
                  <p className="text-[10px] text-slate-405 leading-normal font-medium">
                    Receive rich embeds with color-coded alerts on your Discord channel. Add a webhook URL from your Discord Server channel settings.
                  </p>
                  <div className="space-y-1">
                    <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Discord Webhook URL</label>
                    <input
                      type="url"
                      disabled={!isAdmin}
                      placeholder={isAdmin ? "e.g. https://discord.com/api/webhooks/YOUR_WEBHOOK_URL" : "Restricted to Administrators"}
                      value={discordUrl}
                      onChange={e => setDiscordUrl(e.target.value)}
                      className="w-full rounded-xl border border-slate-205 bg-slate-50/50 px-3.5 py-2.5 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-850 dark:bg-slate-950 dark:text-slate-350 disabled:opacity-60 font-semibold"
                    />
                  </div>
                </div>
              )}

              {activeConnector === 'telegram' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-sky-500" />
                    <h5 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                      Telegram Bot API Service
                    </h5>
                  </div>
                  <p className="text-[10px] text-slate-405 leading-normal font-medium">
                    Create a bot with BotFather on Telegram to obtain an API token, and set your channel or group Chat ID. Alerts will be pushed as rich Markdown.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Telegram Bot Token</label>
                      <input
                        type="password"
                        disabled={!isAdmin}
                        placeholder={isAdmin ? "e.g. 123456789:ABCdefGhIJK..." : "Restricted"}
                        value={telegramToken}
                        onChange={e => setTelegramToken(e.target.value)}
                        className="w-full rounded-xl border border-slate-205 bg-slate-50/50 px-3.5 py-2.5 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-850 dark:bg-slate-950 dark:text-slate-350 disabled:opacity-60 font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Target Chat / Channel ID</label>
                      <input
                        type="text"
                        disabled={!isAdmin}
                        placeholder={isAdmin ? "e.g. -1001234567890 or @channel" : "Restricted"}
                        value={telegramChatId}
                        onChange={e => setTelegramChatId(e.target.value)}
                        className="w-full rounded-xl border border-slate-205 bg-slate-50/50 px-3.5 py-2.5 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-850 dark:bg-slate-950 dark:text-slate-350 disabled:opacity-60 font-semibold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeConnector === 'whatsapp' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    <h5 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                      WhatsApp Message Hook
                    </h5>
                  </div>
                  <p className="text-[10px] text-slate-405 leading-normal font-medium">
                    Route notifications to mobile devices via WhatsApp Business API / Twilio service mapping.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">WhatsApp Token / API Key</label>
                      <input
                        type="password"
                        disabled={!isAdmin}
                        placeholder={isAdmin ? "Bearer auth credentials" : "Restricted"}
                        value={whatsAppToken}
                        onChange={e => setWhatsAppToken(e.target.value)}
                        className="w-full rounded-xl border border-slate-205 bg-slate-50/50 px-3.5 py-2.5 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-850 dark:bg-slate-950 dark:text-slate-350 disabled:opacity-60 font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Target Phone Number</label>
                      <input
                        type="text"
                        disabled={!isAdmin}
                        placeholder={isAdmin ? "e.g. +966500000000" : "Restricted"}
                        value={whatsAppPhone}
                        onChange={e => setWhatsAppPhone(e.target.value)}
                        className="w-full rounded-xl border border-slate-205 bg-slate-50/50 px-3.5 py-2.5 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-850 dark:bg-slate-950 dark:text-slate-350 disabled:opacity-60 font-semibold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeConnector === 'custom' && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-slate-500" />
                    <h5 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                      Custom Webhook API (JSON POST)
                    </h5>
                  </div>
                  <p className="text-[10px] text-slate-405 leading-normal font-medium">
                    Pushes a structured JSON request payload containing the notification properties, details, actor, and timestamp to a custom server or HTTP target.
                  </p>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-black uppercase text-slate-400 tracking-wider">Custom Webhook Target URL</label>
                      <input
                        type="url"
                        disabled={!isAdmin}
                        placeholder={isAdmin ? "https://yourserver.com/api/tracker-events" : "Restricted to Administrators"}
                        value={customWebhookUrl}
                        onChange={e => setCustomWebhookUrl(e.target.value)}
                        className="w-full rounded-xl border border-slate-205 bg-slate-50/50 px-3.5 py-2.5 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-850 dark:bg-slate-950 dark:text-slate-350 disabled:opacity-60 font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="block text-[8px] font-bold uppercase text-slate-400 tracking-wider">Payload Schema Example:</span>
                      <pre className="bg-slate-950 text-slate-400 p-2.5 rounded-lg text-[9px] font-mono leading-relaxed overflow-x-auto select-none dark:bg-slate-955 border border-slate-800 dark:border-slate-850">
{`{
  "event": "task_done | blocker | ...",
  "title": "TASK COMPLETED ✅",
  "message": "...",
  "details": { ... },
  "timestamp": "2026-06-03..."
}`}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Alert triggers */}
          <div className="space-y-4 pt-4 border-t border-slate-150/40 dark:border-slate-800/40">
            <h5 className="text-xs font-black text-slate-705 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wide">
              <Bell className="h-4 w-4 text-indigo-500" />
              Outbound Event Dispatch Triggers
            </h5>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/20 dark:border-slate-850 dark:bg-slate-950/20 hover:bg-slate-50/60 dark:hover:bg-slate-950/50 cursor-pointer select-none">
                <input
                  disabled={!isAdmin}
                  type="checkbox"
                  checked={triggerOnBlocker}
                  onChange={e => setTriggerOnBlocker(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 mt-0.5 disabled:opacity-60"
                />
                <div>
                  <div className="text-xs font-bold text-slate-750 dark:text-slate-200">Flagged Blockers</div>
                  <div className="text-[9px] text-slate-400 mt-0.5 leading-relaxed">Dispatch alert on team member daily standups marked as Blocked.</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/20 dark:border-slate-850 dark:bg-slate-950/20 hover:bg-slate-50/60 dark:hover:bg-slate-950/50 cursor-pointer select-none">
                <input
                  disabled={!isAdmin}
                  type="checkbox"
                  checked={triggerOnCriticalBug}
                  onChange={e => setTriggerOnCriticalBug(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 mt-0.5 disabled:opacity-60"
                />
                <div>
                  <div className="text-xs font-bold text-slate-750 dark:text-slate-200">Critical Priority Bugs</div>
                  <div className="text-[9px] text-slate-400 mt-0.5 leading-relaxed">Dispatch alert when a blocker or critical priority bug is logged.</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/20 dark:border-slate-850 dark:bg-slate-950/20 hover:bg-slate-50/60 dark:hover:bg-slate-950/50 cursor-pointer select-none">
                <input
                  disabled={!isAdmin}
                  type="checkbox"
                  checked={triggerOnTaskDone}
                  onChange={e => setTriggerOnTaskDone(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 mt-0.5 disabled:opacity-60"
                />
                <div>
                  <div className="text-xs font-bold text-slate-750 dark:text-slate-200">Task Completion</div>
                  <div className="text-[9px] text-slate-400 mt-0.5 leading-relaxed">Dispatch alert when a workspace task is successfully completed.</div>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/20 dark:border-slate-850 dark:bg-slate-950/20 hover:bg-slate-50/60 dark:hover:bg-slate-950/50 cursor-pointer select-none">
                <input
                  disabled={!isAdmin}
                  type="checkbox"
                  checked={triggerOnIssueResolved}
                  onChange={e => setTriggerOnIssueResolved(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 mt-0.5 disabled:opacity-60"
                />
                <div>
                  <div className="text-xs font-bold text-slate-750 dark:text-slate-200">Issue Resolutions</div>
                  <div className="text-[9px] text-slate-400 mt-0.5 leading-relaxed">Dispatch alert when a project bug or incident ticket is resolved.</div>
                </div>
              </label>

            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 border-t border-slate-150/40 pt-4 dark:border-slate-800/40">
            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={handleTestDispatch}
                  disabled={testing}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 dark:border-slate-850 dark:hover:bg-slate-950 dark:text-slate-300 cursor-pointer select-none"
                >
                  <Send className="h-3.5 w-3.5" />
                  {testing ? 'Testing Hub...' : 'Send Diagnostic Test'}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-100 dark:shadow-none cursor-pointer select-none"
                >
                  {saving ? 'Saving...' : 'Save Hub Config'}
                </button>
              </>
            )}
            {!isAdmin && (
              <div className="text-[10px] text-amber-600 font-bold bg-amber-50 dark:bg-amber-955/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" />
                <span>Integration settings are locked for non-administrators</span>
              </div>
            )}
          </div>

          {saveSuccess && (
            <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold justify-end mt-2 select-none animate-fadeIn">
              <CheckCircle className="h-4 w-4" />
Settings updated successfully!
            </div>
          )}

        </form>
      </div>
      )}

      {/* ─── EMPLOYEE & USER REGISTRY CARD ─── */}
      {view === 'users' && (
        <div className="rounded-2xl border border-slate-150 bg-white p-6 shadow-sm dark:border-slate-850 dark:bg-slate-900">
        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4 dark:border-slate-800">
          <Users className="h-5 w-5 text-indigo-500" />
          <div>
            <h4 className="text-sm font-bold text-slate-850 dark:text-slate-100 uppercase tracking-wider">
              Employee & User Registry
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Manage user profiles, assignments, and access control credentials</p>
          </div>
        </div>

        {/* User list card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {userProfiles.map((p) => {
            const isMe = p.name === activeUser;
            return (
              <div 
                key={p.name} 
                className="p-4 rounded-2xl border border-slate-150/60 bg-slate-50/20 dark:border-slate-850/60 dark:bg-slate-955/10 hover:bg-white hover:border-slate-200/80 dark:hover:bg-slate-900/30 dark:hover:border-slate-800 transition-all flex items-center justify-between group hover:scale-[1.01] active:scale-[0.99] duration-150"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-50 to-indigo-100 dark:from-slate-800 dark:to-slate-850 border border-indigo-100/50 dark:border-slate-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xs shrink-0 select-none">
                    {p.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-805 dark:text-slate-200 flex items-center gap-1.5 leading-snug">
                      <span className="truncate">{p.name}</span>
                      {isMe && (
                        <span className="text-[8px] bg-slate-100 dark:bg-slate-950 text-slate-505 px-1.5 py-0.2 rounded font-extrabold uppercase">You</span>
                      )}
                    </div>
                    <div className="text-[9px] text-slate-400 font-medium truncate leading-none mt-0.5">{p.email || 'N/A'}</div>
                    <div className="mt-2">
                      <span className={`inline-block px-1.5 py-0.5 text-[8px] font-extrabold uppercase rounded border ${
                        (p.role === 'Admin' || p.role === 'Head') ? 'bg-rose-50/50 text-rose-700 border-rose-200/50 dark:bg-rose-955/10 dark:text-rose-400 dark:border-rose-955/20' :
                        (p.role === 'Project Manager' || p.role === 'Project Lead' || p.role === 'Support Manager' || p.role === 'Support Lead' || p.role === 'Manager') ? 'bg-violet-50/50 text-violet-755 border-violet-200/50 dark:bg-violet-955/10 dark:text-violet-405 dark:border-violet-955/20' :
                        (p.role === 'HR' || p.role === 'Sales') ? 'bg-amber-50/50 text-amber-705 border-amber-205/50 dark:bg-amber-955/10 dark:text-amber-400 dark:border-amber-955/20' :
                        'bg-emerald-50/50 text-emerald-705 border-emerald-200/50 dark:bg-emerald-955/10 dark:text-emerald-400 dark:border-emerald-955/20'
                      }`}>
                        {p.role}
                      </span>
                    </div>
                  </div>
                </div>
                
                {isAdmin && (
                  <button
                    onClick={() => handleDeleteUser(p.name)}
                    disabled={isMe}
                    className="text-slate-350 hover:text-rose-600 transition-colors p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 shrink-0 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                    title="Remove User Profile"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Add User Profile Form (Admin only) */}
        {isAdmin ? (
          <form onSubmit={handleAddUser} className="bg-slate-50/40 dark:bg-slate-955/25 p-5 rounded-2xl border border-slate-150/60 dark:border-slate-850/85">
            <h5 className="text-[10px] font-black text-slate-450 uppercase tracking-wider mb-3.5">Add New User Profile</h5>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">User Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  className="w-full rounded-xl border border-slate-205 bg-white px-3 py-1.5 text-xs outline-none focus:border-indigo-500 dark:border-slate-850 dark:bg-slate-900 dark:text-slate-300 font-semibold"
                  required
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. john@company.com"
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-205 bg-white px-3 py-1.5 text-xs outline-none focus:border-indigo-500 dark:border-slate-850 dark:bg-slate-900 dark:text-slate-300 font-semibold"
                  required
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Assigned Access Role</label>
                <select
                  value={newUserRole}
                  onChange={e => setNewUserRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-205 bg-white px-3 py-1.5 text-xs outline-none focus:border-indigo-500 dark:border-slate-850 dark:bg-slate-900 dark:text-slate-300 font-bold cursor-pointer"
                >
                  <option value="Admin">Admin</option>
                  <option value="HR">HR</option>
                  <option value="Sales">Sales</option>
                  <option value="Project Manager">Project Manager</option>
                  <option value="Head">Head</option>
                  <option value="Project Lead">Project Lead</option>
                  <option value="Support Manager">Support Manager</option>
                  <option value="Support Lead">Support Lead</option>
                  <option value="Support Member">Support Member</option>
                  <option value="Team Member">Team Member</option>
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Account Password</label>
                <input
                  type="text"
                  placeholder="e.g. user123"
                  value={newUserPassword}
                  onChange={e => setNewUserPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-205 bg-white px-3 py-1.5 text-xs outline-none focus:border-indigo-500 dark:border-slate-850 dark:bg-slate-900 dark:text-slate-300 font-semibold"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2 text-xs font-bold text-white shadow-sm cursor-pointer hover:scale-[1.01] active:scale-95 duration-150"
              >
                <Plus className="h-4 w-4" />
                Add Profile
              </button>
            </div>
          </form>
        ) : (
          <div className="rounded-xl bg-amber-50 dark:bg-amber-955/20 border border-amber-100 dark:border-amber-900/30 p-3.5 text-[10px] font-bold text-amber-700 flex items-center gap-2">
            <Lock className="h-4 w-4 text-amber-500" />
            <span>Adding or removing employee user profiles is restricted to Administrators</span>
          </div>
        )}
      </div>
      )}

      {/* ─── PROJECTS PORTFOLIO VIEW ─── */}
      {view === 'projects' && (
        <>
          {/* Active selected project banner */}
          {activeProject ? (
            <div className="rounded-2xl border border-indigo-150 bg-indigo-50/50 p-5 dark:border-indigo-950/20 dark:bg-indigo-950/20 mb-6 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] font-black text-indigo-550 dark:text-indigo-400 uppercase tracking-widest leading-none">Active Selected Workspace Project</span>
                <h4 className="text-sm font-black text-slate-850 dark:text-slate-100 uppercase tracking-wider mt-1.5 flex items-center gap-2">
                  <span className="font-mono bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 rounded text-indigo-700 dark:text-indigo-300 text-xs">{activeProject.code}</span>
                  <span>{activeProject.name}</span>
                </h4>
              </div>
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" title="Active Project Selected" />
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-150 bg-amber-50/50 p-5 dark:border-amber-955/20 dark:bg-amber-955/20 mb-6 flex items-center gap-3">
              <Lock className="h-5 w-5 text-amber-500 shrink-0" />
              <div>
                <span className="text-[10px] font-black text-amber-600 dark:text-amber-405 uppercase tracking-widest leading-none">No Active Project Selected</span>
                <h4 className="text-sm font-black text-slate-850 dark:text-slate-100 uppercase tracking-wider mt-1.5">
                  Please select or register a project below to activate workspace tracking
                </h4>
              </div>
            </div>
          )}

          {/* ─── PROJECT REGISTRY CARD ─── */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4 dark:border-slate-800">
          <FolderKanban className="h-5 w-5 text-indigo-500" />
          <div>
            <h4 className="text-sm font-bold text-slate-850 dark:text-slate-100 uppercase tracking-wider">
              Project Registry Manager
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Initialize and review enterprise project profiles and delivery scopes</p>
          </div>
        </div>

        {/* Info Box */}
        <div className="text-[10px] bg-slate-50 dark:bg-slate-950/20 p-3.5 rounded-xl border border-slate-150 dark:border-slate-850 mb-6 text-slate-500 dark:text-slate-450 leading-relaxed font-medium">
          <strong className="text-slate-700 dark:text-slate-350 block mb-1">💡 How to add projects in the application:</strong>
          There are two ways to register a project:
          <ul className="list-decimal pl-4 mt-1 space-y-0.5">
            <li>Click the <strong className="text-indigo-600 dark:text-indigo-400 font-bold">"Initialize Project Profile"</strong> button in the top-right header of the main workspace.</li>
            <li>Fill in the inline creator form below (restricted to Administrators & Managers).</li>
          </ul>
        </div>

        {/* Project list cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {projects.map((proj) => {
            const isActive = proj._id === activeProject?._id;
            return (
              <div 
                key={proj._id} 
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between group hover:scale-[1.01] active:scale-[0.99] duration-150 relative overflow-hidden ${
                  isActive 
                    ? 'border-indigo-200 bg-indigo-50/15 dark:border-indigo-900/50 dark:bg-indigo-950/20 shadow-sm shadow-indigo-50/50 dark:shadow-none' 
                    : 'border-slate-150/60 bg-slate-50/20 dark:border-slate-850/60 dark:bg-slate-955/10 hover:bg-white dark:hover:bg-slate-900/30 hover:border-slate-200/80 dark:hover:border-slate-800 cursor-pointer'
                }`}
                onClick={() => { if (!isActive && setActiveProject) setActiveProject(proj); }}
              >
                {isActive && (
                  <div className="absolute top-0 right-0 h-2 w-2 rounded-bl-xl bg-indigo-600 dark:bg-indigo-400" />
                )}
                
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-xs tracking-wider uppercase">
                      {proj.code}
                    </span>
                    <h5 className="text-xs font-bold text-slate-855 dark:text-slate-205 mt-1 leading-snug truncate" title={proj.name}>
                      {proj.name}
                    </h5>
                  </div>
                  {isActive && (
                    <span className="shrink-0 text-[8px] bg-indigo-600 text-white dark:bg-indigo-950 dark:text-indigo-400 px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wide">
                      Active Selected
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-slate-100/60 dark:border-slate-800/60 pt-3 mt-3 text-xs">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-455 truncate">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    <span className="truncate max-w-[120px]">{proj.client}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    {!isActive && setActiveProject && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveProject(proj);
                        }}
                        className="text-[9px] bg-indigo-50/80 hover:bg-indigo-600 hover:text-white dark:bg-indigo-950/40 dark:hover:bg-indigo-600 dark:hover:text-white text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded font-extrabold cursor-pointer transition-all uppercase tracking-wider border border-indigo-100/50 dark:border-indigo-900/40"
                      >
                        Activate Project
                      </button>
                    )}
                    <span className={`inline-block px-1.5 py-0.5 text-[8.5px] font-black rounded uppercase tracking-wide border ${
                      proj.type === 'maintenance' 
                        ? 'bg-amber-50/50 text-amber-705 border-amber-205/65 dark:bg-amber-955/15 dark:text-amber-400 dark:border-amber-950/20' 
                        : 'bg-blue-50/50 text-blue-700 border-blue-200/50 dark:bg-blue-955/15 dark:text-blue-400 dark:border-blue-950/20'
                    }`}>
                      {proj.type === 'maintenance' ? 'SLA support' : 'Implementation'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Project Form (Admin/Manager only) */}
        {isManagerOrAdmin ? (
          <form onSubmit={handleAddProjectInline} className="bg-slate-50/40 dark:bg-slate-955/25 p-5 rounded-2xl border border-slate-150/60 dark:border-slate-850/85">
            <h5 className="text-[10px] font-black text-slate-455 uppercase tracking-wider mb-3.5">Register New Project Profile</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Project Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dubai Islamic Bank Integration"
                  value={newProjName}
                  onChange={e => setNewProjName(e.target.value)}
                  className="w-full rounded-xl border border-slate-205 bg-white px-3 py-1.5 text-xs outline-none focus:border-indigo-500 dark:border-slate-850 dark:bg-slate-900 dark:text-slate-300 font-semibold"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Project Code</label>
                  <input
                    type="text"
                    placeholder="e.g. DIB-INT"
                    value={newProjCode}
                    onChange={e => setNewProjCode(e.target.value)}
                    className="w-full rounded-xl border border-slate-205 bg-white px-3 py-1.5 text-xs outline-none focus:border-indigo-500 dark:border-slate-850 dark:bg-slate-900 dark:text-slate-300 font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Client Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. DIB"
                    value={newProjClient}
                    onChange={e => setNewProjClient(e.target.value)}
                    className="w-full rounded-xl border border-slate-205 bg-white px-3 py-1.5 text-xs outline-none focus:border-indigo-500 dark:border-slate-850 dark:bg-slate-900 dark:text-slate-300 font-semibold"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">Project Focus Delivery Type</label>
                <select
                  value={newProjType}
                  onChange={e => setNewProjType(e.target.value)}
                  className="w-full rounded-xl border border-slate-205 bg-white px-3 py-1.5 text-xs outline-none focus:border-indigo-500 dark:border-slate-850 dark:bg-slate-900 dark:text-slate-300 font-bold cursor-pointer"
                >
                  <option value="delivery">Active Project Delivery (Implementation)</option>
                  <option value="maintenance">SLA Project Maintenance (Ongoing Support)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <button
                type="submit"
                disabled={addingProject}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2 text-xs font-bold text-white shadow-sm cursor-pointer hover:scale-[1.01] active:scale-95 duration-150"
              >
                <Plus className="h-4 w-4" />
                {addingProject ? 'Creating...' : 'Initialize Project'}
              </button>
            </div>
          </form>
        ) : (
          <div className="rounded-xl bg-amber-50 dark:bg-amber-955/20 border border-amber-100 dark:border-amber-900/30 p-3.5 text-[10px] font-bold text-amber-705 flex items-center gap-2">
            <Lock className="h-4 w-4 text-amber-500" />
            <span>Adding new project profiles is restricted to Administrators and Managers</span>
          </div>
        )}
      </div>

      {/* ─── PROJECT EPIC MANAGEMENT PANEL ─── */}
      <div className="rounded-2xl border border-slate-150 bg-white p-6 shadow-sm dark:border-slate-855 dark:bg-slate-900 mt-6">
        <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-indigo-500" />
            <div>
              <h4 className="text-sm font-bold text-slate-850 dark:text-slate-100 uppercase tracking-wider">
                Project Epics Manager
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Manage high-level project modules and feature bodies</p>
            </div>
          </div>
        </div>

        {/* Epics creation form (Admin/Manager only) */}
        {isManagerOrAdmin ? (
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!epicName.trim() || !activeProject) return;
            setCreatingEpic(true);
            try {
              const response = await fetch('/api/epics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  projectId: activeProject._id,
                  name: epicName.trim(),
                  color: epicColor
                })
              });
              const res = await response.json();
              if (res.success) {
                setEpics(prev => [...prev, res.data]);
                setEpicName('');
              }
            } catch (err) {
              console.error(err);
            } finally {
              setCreatingEpic(false);
            }
          }} className="space-y-4 mb-6 bg-slate-50/40 dark:bg-slate-955/25 p-5 rounded-2xl border border-slate-150/60 dark:border-slate-850/85">
            <h5 className="text-[10px] font-black text-slate-450 uppercase tracking-wider">Create New Project Epic</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Epic Name</label>
                <input
                  type="text"
                  placeholder="e.g. Authentication Gateway"
                  value={epicName}
                  onChange={e => setEpicName(e.target.value)}
                  className="w-full rounded-xl border border-slate-205 bg-white px-3.5 py-2 text-xs outline-none focus:border-indigo-500 dark:border-slate-850 dark:bg-slate-900 dark:text-slate-350 font-semibold"
                  required
                />
              </div>
              
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-450 mb-2">Badge Color Selector</label>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  {EPIC_COLORS.map(c => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setEpicColor(c.hex)}
                      className={`h-6.5 w-6.5 rounded-full transition-all flex items-center justify-center border outline-none ${
                        epicColor === c.hex 
                          ? 'ring-2 ring-indigo-500 scale-110 shadow-md border-white dark:border-slate-900' 
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.label}
                    >
                      {epicColor === c.hex && (
                        <span className="text-[10px] text-white font-black drop-shadow">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={creatingEpic || !epicName.trim()}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2 text-xs font-bold text-white shadow-sm cursor-pointer hover:scale-[1.01] active:scale-95 duration-150"
              >
                <Plus className="h-4 w-4" />
                {creatingEpic ? "Creating..." : "Save Epic Module"}
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-6 rounded-xl bg-amber-50 dark:bg-amber-955/20 border border-amber-200 dark:border-amber-900/50 p-3.5 text-[10px] font-bold text-amber-705 flex items-center gap-2">
            <Lock className="h-4 w-4 text-amber-500" />
            <span>Creating Epics is restricted to Admins and Managers.</span>
          </div>
        )}

        {/* Epics list grid */}
        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3">Active Project Epics ({epics.length})</h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
          {epics.map(epic => (
            <div 
              key={epic._id}
              className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 dark:border-slate-850 bg-slate-50/20"
            >
              <div className="flex items-center gap-2">
                <span 
                  className="h-3 w-3 rounded-full shrink-0" 
                  style={{ backgroundColor: epic.color }}
                />
                <span 
                  className="inline-block rounded px-2.5 py-0.5 text-[10px] font-black text-white uppercase tracking-wider"
                  style={{ backgroundColor: epic.color }}
                >
                  {epic.name}
                </span>
              </div>

              {isManagerOrAdmin && (
                <button
                  onClick={async () => {
                    if (!confirm("Delete Epic: " + epic.name + "?")) return;
                    try {
                      const response = await fetch(`/api/epics?id=${epic._id}`, { method: 'DELETE' });
                      const res = await response.json();
                      if (res.success) {
                        setEpics(prev => prev.filter(e => e._id !== epic._id));
                      }
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  className="text-slate-350 hover:text-rose-600 transition-colors p-1"
                  title="Remove Epic"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}

          {epics.length === 0 && (
            <div className="col-span-2 text-center py-6 text-slate-400 italic text-xs">
              No Epics initialized for this project.
            </div>
          )}
        </div>
      </div>
      </>
      )}

      {/* ─── MODEL CONTEXT PROTOCOL (MCP) CARD ─── */}
      {view === 'webhooks' && (
        <>
          <div className="apple-card p-6 mt-6">
        <div className="flex items-center justify-between mb-4 border-b border-slate-150/40 pb-4 dark:border-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-500">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-850 dark:text-slate-100 uppercase tracking-wider">
                Model Context Protocol (MCP) Node
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Expose project tracker data directly to external LLM clients</p>
            </div>
          </div>
        </div>

        <div className="space-y-5 text-xs">
          <div className="rounded-2xl bg-slate-50/50 p-4.5 dark:bg-slate-950/15 border border-slate-150/60 dark:border-slate-850/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-black text-slate-405 uppercase tracking-wider text-[9.5px]">MCP Connection Node URL</span>
              <span className="text-[8.5px] font-bold text-slate-400 uppercase bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-150 dark:border-slate-800">
                JSON-RPC 2.0 HTTP
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-150/70 dark:border-slate-850/70">
              <code className="font-mono text-[10.5px] select-all text-indigo-600 dark:text-indigo-400 font-bold truncate flex-1">
                http://localhost:3000/api/mcp
              </code>
              <CopyButton text="http://localhost:3000/api/mcp" />
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-black text-slate-700 dark:text-slate-305 uppercase tracking-wider text-[10px]">
              Provided Tools Schema:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-550 dark:text-slate-400 font-medium">
              <li><strong className="text-slate-700 dark:text-slate-300">`get_projects`</strong>: Fetch all project profiles, client tags, and statuses.</li>
              <li><strong className="text-slate-700 dark:text-slate-300">`get_tasks`</strong>: Retrieve board tasks filtered by `projectId` or `owner`.</li>
              <li><strong className="text-slate-700 dark:text-slate-300">`get_issues`</strong>: Retrieve ticket issues filtered by `projectId`.</li>
              <li><strong className="text-slate-700 dark:text-slate-300">`get_daily_standups`</strong>: Query standup entries and employee hours.</li>
              <li><strong className="text-slate-700 dark:text-slate-300">`get_financials`</strong>: Query revenue and expense items.</li>
            </ul>
          </div>

          <div className="space-y-2.5 pt-3.5 border-t border-slate-150/40 dark:border-slate-800/40">
            <div className="flex items-center justify-between">
              <p className="font-black text-slate-750 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                Claude Desktop Configuration Setup:
              </p>
              <CopyButton text={`{\n  "mcpServers": {\n    "ppm-tracker": {\n      "command": "npx",\n      "args": [\n        "-y",\n        "@modelcontextprotocol/server-http",\n        "http://localhost:3000/api/mcp"\n      ]\n    }\n  }\n}`} />
            </div>
            <p className="text-[10px] text-slate-400 leading-normal font-medium">
              Copy the following JSON settings block to your <code className="bg-slate-105 px-1 py-0.5 rounded font-mono text-[9px] dark:bg-slate-950 text-slate-655 dark:text-slate-300">claude_desktop_config.json</code> config file (located at <code className="bg-slate-105 px-1 py-0.5 rounded font-mono text-[9px] dark:bg-slate-950 text-slate-655 dark:text-slate-300">%APPDATA%\Claude\claude_desktop_config.json</code> on Windows):
            </p>
            <pre className="bg-slate-950 text-slate-300 p-4 rounded-xl text-[10px] font-mono overflow-x-auto select-all leading-relaxed shadow-sm dark:bg-slate-955 border border-slate-850">
{`{
  "mcpServers": {
    "ppm-tracker": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-http",
        "http://localhost:3000/api/mcp"
      ]
    }
  }
}`}
            </pre>
          </div>
        </div>
      </div>

      {/* ─── GITEA WEBHOOK INTEGRATION CARD ─── */}
      <div className="apple-card p-6 mt-6">
        <div className="flex items-center justify-between mb-4 border-b border-slate-150/40 pb-4 dark:border-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-500">
              <GitBranch className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-850 dark:text-slate-100 uppercase tracking-wider">
                Local Gitea Webhook Service
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Automate tracker history entries and auto-resolve tasks using Gitea commit pushes</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 text-xs">
          <div className="rounded-2xl bg-slate-50/50 p-4.5 dark:bg-slate-950/15 border border-slate-150/60 dark:border-slate-850/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-black text-slate-405 uppercase tracking-wider text-[9.5px]">Webhook Target Payload URL</span>
              <span className="text-[8.5px] font-bold text-slate-400 uppercase bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-150 dark:border-slate-800">
                POST application/json
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-150/70 dark:border-slate-850/70">
              <code className="font-mono text-[10.5px] select-all text-indigo-600 dark:text-indigo-400 font-bold truncate flex-1">
                http://localhost:3000/api/gitea
              </code>
              <CopyButton text="http://localhost:3000/api/gitea" />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <p className="font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
              How to Link Commits to Tasks/Issues:
            </p>
            <p className="text-slate-550 dark:text-slate-400 font-medium leading-relaxed">
              Include the database reference ID prefix with `#` in your commit messages. Gitea pushes will auto-log audit histories on matching tickets:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-550 dark:text-slate-400 font-medium">
              <li><strong className="text-slate-750 dark:text-slate-300">Link only</strong>: Include `#taskId` in your message (e.g. `feat: implement login screen #64821a8d052d...`).</li>
              <li><strong className="text-slate-750 dark:text-slate-300">Link & Resolve</strong>: Prefix with keywords like `fixes`, `closes`, `resolves` followed by `#taskId` (e.g. `fix: server timeout closes #64821a8d052d...`). This transitions the Task status to <code className="bg-slate-100 px-1.5 py-0.2 rounded font-mono text-[9px] dark:bg-slate-900 text-slate-700 dark:text-slate-300 border dark:border-slate-850">Done</code> or Issue status to <code className="bg-slate-100 px-1.5 py-0.2 rounded font-mono text-[9px] dark:bg-slate-900 text-slate-700 dark:text-slate-300 border dark:border-slate-850">Resolved</code>.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ─── CHATGPT CUSTOM GPT ACTION CARD ─── */}
      <div className="apple-card p-6 mt-6">
        <div className="flex items-center justify-between mb-4 border-b border-slate-150/40 pb-4 dark:border-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-500">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-850 dark:text-slate-105 uppercase tracking-wider">
                ChatGPT Custom GPT Action
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Integrate the workspace API directly into Custom ChatGPT models as custom actions</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 text-xs font-sans">
          
          <div className="text-[10px] bg-indigo-50/20 dark:bg-indigo-950/20 p-4 rounded-2xl border border-indigo-100/50 dark:border-indigo-950/50 text-slate-600 dark:text-slate-350 leading-relaxed font-medium space-y-2">
            <strong className="text-indigo-750 dark:text-indigo-450 block uppercase tracking-wider text-[10px]">🚀 Connecting this Workspace to ChatGPT (Step-by-Step):</strong>
            <ol className="list-decimal pl-4 space-y-1.5">
              <li>Open a local HTTP tunnel using ngrok (or localtunnel) to expose the app to the internet:
                <code className="block bg-slate-100 text-slate-700 dark:bg-slate-950 dark:text-slate-300 px-2 py-1 rounded font-mono text-[10px] mt-1 select-all w-fit border dark:border-slate-850">ngrok http 3000</code>
              </li>
              <li>Go to <strong className="text-slate-805 dark:text-slate-100">chatgpt.com</strong>, click your profile and select <strong className="text-slate-805 dark:text-slate-100">"My GPTs"</strong> -&gt; <strong className="text-slate-850 dark:text-slate-100">"Create a GPT"</strong>.</li>
              <li>Under the <strong className="text-slate-805 dark:text-slate-100">Configure</strong> tab, scroll down and click <strong className="text-indigo-600 dark:text-indigo-400 font-bold">"Create new action"</strong>.</li>
              <li>Copy the raw OpenAPI 3.0 schema from the box below and paste it into the <strong className="text-slate-805 dark:text-slate-100">Schema</strong> text area in ChatGPT.</li>
              <li>Replace the placeholder server URL in ChatGPT (or in the schema box below) with your active ngrok tunnel URL (e.g. <code className="font-mono bg-slate-100 dark:bg-slate-950 px-1 py-0.5 rounded border dark:border-slate-850">https://xyz.ngrok-free.app</code>).</li>
            </ol>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-black text-slate-705 dark:text-slate-300 uppercase tracking-wider text-[10px]">OpenAPI 3.0 Integration Schema:</span>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-slate-400 font-bold bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded border dark:border-slate-850">/api/openapi</span>
                <CopyButton text={`{\n  "openapi": "3.0.0",\n  "info": {\n    "title": "PPM Workspace Tracker API",\n    "description": "API for querying tasks, issues, standups, and projects.",\n    "version": "1.0.0"\n  },\n  "servers": [\n    {\n      "url": "YOUR_NGROK_TUNNEL_URL_HERE",\n      "description": "Active tunnel URL"\n    }\n  ],\n  "paths": {\n    "/api/projects": {\n      "get": {\n        "summary": "Fetch all project profiles",\n        "operationId": "getProjects"\n      }\n    },\n    "/api/tasks": {\n      "get": {\n        "summary": "Fetch tasks for a project",\n        "operationId": "getTasks",\n        "parameters": [\n          {\n            "name": "projectId",\n            "in": "query",\n            "required": true,\n            "schema": { "type": "string" }\n          }\n        ]\n      }\n    },\n    "/api/issues": {\n      "get": {\n        "summary": "Fetch issues for a project",\n        "operationId": "getIssues",\n        "parameters": [\n          {\n            "name": "projectId",\n            "in": "query",\n            "required": true,\n            "schema": { "type": "string" }\n          }\n        ]\n      }\n    }\n  }\n}`} />
              </div>
            </div>
            <pre className="bg-slate-950 text-slate-300 p-4 rounded-xl text-[10px] font-mono overflow-x-auto select-all leading-relaxed shadow-sm max-h-60 dark:bg-slate-955 border border-slate-850">
{`{
  "openapi": "3.0.0",
  "info": {
    "title": "PPM Workspace Tracker API",
    "description": "API for querying tasks, issues, standups, and projects.",
    "version": "1.0.0"
  },
  "servers": [
    {
      "url": "YOUR_NGROK_TUNNEL_URL_HERE",
      "description": "Active tunnel URL"
    }
  ],
  "paths": {
    "/api/projects": {
      "get": {
        "summary": "Fetch all project profiles",
        "operationId": "getProjects"
      }
    },
    "/api/tasks": {
      "get": {
        "summary": "Fetch tasks for a project",
        "operationId": "getTasks",
        "parameters": [
          {
            "name": "projectId",
            "in": "query",
            "required": true,
            "schema": { "type": "string" }
          }
        ]
      }
    },
    "/api/issues": {
      "get": {
        "summary": "Fetch issues for a project",
        "operationId": "getIssues",
        "parameters": [
          {
            "name": "projectId",
            "in": "query",
            "required": true,
            "schema": { "type": "string" }
          }
        ]
      }
    }
  }
}`}
            </pre>
          </div>
        </div>
      </div>
      </>
      )}

    </div>
  );
}
