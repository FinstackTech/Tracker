import { useState, useEffect } from 'react';
import { 
  Webhook, Send, CheckCircle, MessageSquare, Tag, Trash2, Lock, Cpu, GitBranch, MessageCircle, Globe, Copy, Check, Bell
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
      className="px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase bg-slate-100 hover:bg-slate-200 dark:bg-slate-805 dark:hover:bg-slate-700 dark:text-slate-350 border border-slate-205 dark:border-slate-750 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
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
  currentUser,
  showToast
}) {
  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Head';
  
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
      console.error("Failed to load integrations", e);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);

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
        if (showToast) {
          showToast("Webhooks & connectors saved successfully", "success");
        } else {
          alert("Integration settings updated successfully!");
        }
      }
    } catch (err) {
      console.error(err);
      if (showToast) showToast("Error syncing integration settings", "error");
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
        if (showToast) {
          showToast("Diagnostic test triggers dispatched!", "success");
        } else {
          alert("Diagnostic test trigger dispatched successfully! Check configured channels.");
        }
      }
    } catch (e) {
      console.error(e);
      if (showToast) showToast("Error sending diagnostic test", "error");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* ─── WEBHOOK CONFIGURATION FORM ─── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_2px_8px_rgba(99,102,241,0.02)] dark:bg-slate-900 dark:border-slate-805/80">
        
        <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-500">
              <Webhook className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-850 dark:text-slate-100 uppercase tracking-wider">
                Third-Party Integrations Hub
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Route real-time alerts directly to enterprise messaging dashboards</p>
            </div>
          </div>
          <span className="text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-100/40 dark:border-indigo-900/30">
            Finstack Connect
          </span>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 min-h-[300px]">
            
            {/* Left Selection List */}
            <div className="md:col-span-4 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible gap-1.5 pb-2 md:pb-0 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 md:pr-4">
              
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
                    className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-3 shrink-0 md:shrink border hover:scale-[1.01] active:scale-[0.99] duration-150 ${
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
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-sm" />
                        )}
                      </div>
                      <div className="text-[9px] text-slate-400 truncate max-w-[120px] font-semibold">{c.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right Input Panel */}
            <div className="md:col-span-8 space-y-4">
              
              {activeConnector === 'teams' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-violet-500" />
                    <h5 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                      Microsoft Teams Connector URL
                    </h5>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal font-medium">
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
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <h5 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                      Slack Webhook Connector
                    </h5>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal font-medium">
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
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-indigo-500" />
                    <h5 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                      Discord Webhook integration
                    </h5>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal font-medium">
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
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-sky-500" />
                    <h5 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
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
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    <h5 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
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
                        className="w-full rounded-xl border border-slate-205 bg-slate-50/50 px-3.5 py-2.5 text-xs outline-none focus:border-indigo-500 focus:bg-white dark:border-slate-850 dark:bg-slate-950 dark:text-slate-355 disabled:opacity-60 font-semibold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeConnector === 'custom' && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-slate-500" />
                    <h5 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                      Custom Webhook API (JSON POST)
                    </h5>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal font-medium">
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
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h5 className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wide">
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

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-100 bg-slate-50/20 dark:border-slate-850 dark:bg-slate-955/20 hover:bg-slate-50/60 dark:hover:bg-slate-950/50 cursor-pointer select-none">
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
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            {isAdmin ? (
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
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-xs font-bold text-white shadow-md cursor-pointer select-none animate-all"
                >
                  {saving ? 'Saving...' : 'Save Hub Config'}
                </button>
              </>
            ) : (
              <div className="text-[10px] text-amber-600 font-bold bg-amber-50 dark:bg-amber-955/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" />
                <span>Integration settings are locked for non-administrators</span>
              </div>
            )}
          </div>

        </form>
      </div>

      {/* ─── MODEL CONTEXT PROTOCOL (MCP) CARD ─── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_2px_8px_rgba(99,102,241,0.02)] dark:bg-slate-900 dark:border-slate-805/80">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-500">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-850 dark:text-slate-100 uppercase tracking-wider">
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
              <span className="text-[8.5px] font-bold text-slate-400 uppercase bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-150 dark:border-slate-850">
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

          <div className="space-y-2.5 pt-3.5 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <p className="font-black text-slate-750 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                Claude Desktop Configuration Setup:
              </p>
              <CopyButton text={`{\n  "mcpServers": {\n    "ppm-tracker": {\n      "command": "npx",\n      "args": [\n        "-y",\n        "@modelcontextprotocol/server-http",\n        "http://localhost:3000/api/mcp"\n      ]\n    }\n  }\n}`} />
            </div>
            <p className="text-[10px] text-slate-405 leading-normal font-medium">
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
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_2px_8px_rgba(99,102,241,0.02)] dark:bg-slate-900 dark:border-slate-805/80">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-500">
              <GitBranch className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-850 dark:text-slate-100 uppercase tracking-wider">
                Local Gitea Webhook Service
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Automate tracker history entries and auto-resolve tasks using Gitea commit pushes</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 text-xs font-sans">
          <div className="rounded-2xl bg-slate-50/50 p-4.5 dark:bg-slate-955/15 border border-slate-150/60 dark:border-slate-850/60 space-y-3">
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
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_2px_8px_rgba(99,102,241,0.02)] dark:bg-slate-900 dark:border-slate-805/80">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-500">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-850 dark:text-slate-100 uppercase tracking-wider">
                ChatGPT Custom GPT Action
              </h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Integrate the workspace API directly into Custom ChatGPT models as custom actions</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 text-xs font-sans">
          
          <div className="text-[10px] bg-indigo-50/20 dark:bg-indigo-950/20 p-4 rounded-2xl border border-indigo-100/50 dark:border-indigo-950/50 text-slate-655 dark:text-slate-350 leading-relaxed font-medium space-y-2">
            <strong className="text-indigo-755 dark:text-indigo-405 block uppercase tracking-wider text-[10px]">🚀 Connecting this Workspace to ChatGPT (Step-by-Step):</strong>
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

    </div>
  );
}
