import mongoose from 'mongoose';

// ─── 1. PROJECT SCHEMA ───
const ProjectSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  client: { type: String, default: 'Internal' },
  type: { type: String, enum: ['delivery', 'maintenance'], default: 'delivery' },
  status: { type: String, enum: ['pipeline', 'active', 'completed', 'on-hold'], default: 'active' },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' }
}, { timestamps: true });

// ─── 2. EPIC SCHEMA ───
const EpicSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  name: { type: String, required: true },
  color: { type: String, default: '#4f46e5' }
}, { timestamps: true });

// ─── TASK/ISSUE SUB-SCHEMAS ───
const CommentSchema = new mongoose.Schema({
  author: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const SubtaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false }
});

const HistorySchema = new mongoose.Schema({
  actor: { type: String, required: true },
  action: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const AttachmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, default: '' },
  fileType: { type: String, default: 'pdf' },
  fileSize: { type: String, default: '0 KB' },
  createdAt: { type: Date, default: Date.now }
});

// ─── 3. TASK SCHEMA ───
const TaskSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['task', 'heading', 'bug', 'feature', 'maintenance'], default: 'task' },
  category: { type: String, default: 'General' },
  owner: { type: String, default: '' },
  status: { type: String, default: 'not-started' }, // e.g. "not-started", "in-progress", "in-sit", "done", "on-hold"
  manDays: { type: Number, default: 0 },
  timeline: { type: String, default: '' },
  notes: { type: String, default: '' },
  order: { type: Number, default: 0 },
  
  // Advanced Extensions
  description: { type: String, default: '' },
  priority: { type: String, enum: ['lowest', 'low', 'medium', 'high', 'critical'], default: 'medium' },
  epicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Epic' },
  blocked: { type: Boolean, default: false },
  timeSpent: { type: Number, default: 0 },
  timeEstimate: { type: Number, default: 8 },
  icon: { type: String, default: '' },
  storyPoints: { type: Number, default: 0 },
  dueDate: { type: String, default: '' },
  comments: [CommentSchema],
  subtasks: [SubtaskSchema],
  history: [HistorySchema],
  attachments: [AttachmentSchema]
}, { timestamps: true });

// ─── 4. ISSUE SCHEMA ───
const IssueSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  type: { type: String, enum: ['bug', 'incident', 'vulnerability', 'support'], default: 'bug' },
  priority: { type: String, enum: ['lowest', 'low', 'medium', 'high', 'critical'], default: 'medium' },
  status: { type: String, enum: ['open', 'in-progress', 'under-review', 'resolved', 'closed'], default: 'open' },
  assignee: { type: String, default: '' },
  reporter: { type: String, default: '' },
  resolutionNotes: { type: String, default: '' },
  
  // Advanced Extensions
  epicId: { type: mongoose.Schema.Types.ObjectId, ref: 'Epic' },
  blocked: { type: Boolean, default: false },
  timeSpent: { type: Number, default: 0 },
  timeEstimate: { type: Number, default: 8 },
  icon: { type: String, default: '' },
  storyPoints: { type: Number, default: 0 },
  dueDate: { type: String, default: '' },
  comments: [CommentSchema],
  subtasks: [SubtaskSchema],
  history: [HistorySchema],
  attachments: [AttachmentSchema]
}, { timestamps: true });

// ─── 5. DAILY STANDUP / ACTIVITY LOG ───
const DailyLogSchema = new mongoose.Schema({
  employeeName: { type: String, required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  taskDescription: { type: String, required: true },
  hoursSpent: { type: Number, required: true, default: 0 },
  status: { type: String, enum: ['in-progress', 'completed', 'blocked'], default: 'completed' },
  blockers: { type: String, default: '' }
}, { timestamps: true });

// ─── 6. EMPLOYEE LEAVE SCHEMA ───
const LeaveSchema = new mongoose.Schema({
  employeeName: { type: String, required: true },
  startDate: { type: String, required: true }, // YYYY-MM-DD
  endDate: { type: String, required: true },   // YYYY-MM-DD
  daysCount: { type: Number, default: 1 },
  type: { type: String, enum: ['annual', 'sick', 'casual', 'unpaid'], default: 'annual' },
  notes: { type: String, default: '' }
}, { timestamps: true });

// ─── 7. FINANCIAL TRANSACTION (REVENUE & EXPENSE) ───
const TransactionSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  type: { type: String, enum: ['revenue', 'expense'], required: true },
  category: { type: String, required: true }, 
  reference: { type: String, default: '' },   
  date: { type: String, required: true },     
  description: { type: String, required: true },
  amount: { type: Number, required: true, default: 0 },
  paid: { type: Number, default: 0 },
  status: { type: String, default: 'paid' },
  comments: { type: String, default: '' }
}, { timestamps: true });

// ─── 8. NOTIFICATION SCHEMA ───
const NotificationSchema = new mongoose.Schema({
  employeeName: { type: String, required: true }, 
  actor: { type: String, default: '' },
  message: { type: String, required: true },
  link: { type: String, default: '' }, 
  read: { type: Boolean, default: false }
}, { timestamps: true });

// ─── 9. INTEGRATION SETTINGS SCHEMA ───
const IntegrationSchema = new mongoose.Schema({
  msTeamsUrl: { type: String, default: '' },
  slackUrl: { type: String, default: '' },
  discordUrl: { type: String, default: '' },
  telegramToken: { type: String, default: '' },
  telegramChatId: { type: String, default: '' },
  whatsAppToken: { type: String, default: '' },
  whatsAppPhone: { type: String, default: '' },
  customWebhookUrl: { type: String, default: '' },
  triggerOnBlocker: { type: Boolean, default: true },
  triggerOnCriticalBug: { type: Boolean, default: true },
  triggerOnTaskDone: { type: Boolean, default: false },
  triggerOnIssueResolved: { type: Boolean, default: false }
}, { timestamps: true });

const EmployeeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  role: { type: String, default: 'Employee' },
  email: { type: String, required: true },
  password: { type: String, default: 'user' },
  team: { type: String, default: 'Engineering' },
  status: { type: String, default: 'Active' },
  lastLogin: { type: String, default: '' },
  notificationPreferences: {
    bell: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    teams: { type: Boolean, default: false },
    push: { type: Boolean, default: false }
  },
  teamsWebhookUrl: { type: String, default: '' },
  mobilePushToken: { type: String, default: '' }
}, { timestamps: true });

// ─── 10. DOCUMENT / ATTACHMENT VAULT SCHEMA ───
const DocumentSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  fileType: { type: String, required: true },
  fileSize: { type: String, default: '0 KB' },
  sizeBytes: { type: Number, default: 0 },
  owner: { type: String, required: true },
  url: { type: String, default: '' },
  description: { type: String, default: '' },
  lastUpdated: { type: String, default: '' }
}, { timestamps: true });

// Clear cached models in development to pick up schema upgrades
if (process.env.NODE_ENV !== 'production') {
  delete mongoose.models.Project;
  delete mongoose.models.Epic;
  delete mongoose.models.Task;
  delete mongoose.models.Issue;
  delete mongoose.models.DailyLog;
  delete mongoose.models.Leave;
  delete mongoose.models.Transaction;
  delete mongoose.models.Notification;
  delete mongoose.models.Integration;
  delete mongoose.models.Employee;
  delete mongoose.models.Document;
}

export const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
export const Epic = mongoose.models.Epic || mongoose.model('Epic', EpicSchema);
export const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);
export const Issue = mongoose.models.Issue || mongoose.model('Issue', IssueSchema);
export const DailyLog = mongoose.models.DailyLog || mongoose.model('DailyLog', DailyLogSchema);
export const Leave = mongoose.models.Leave || mongoose.model('Leave', LeaveSchema);
export const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
export const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
export const Integration = mongoose.models.Integration || mongoose.model('Integration', IntegrationSchema);
export const Employee = mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);
export const Document = mongoose.models.Document || mongoose.model('Document', DocumentSchema);

