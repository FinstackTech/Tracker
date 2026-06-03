const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/tracker_db';

// Inline Schema definitions for node script
const ProjectSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  client: { type: String, default: 'Internal' },
  type: { type: String, enum: ['delivery', 'maintenance'], default: 'delivery' },
  status: { type: String, enum: ['pipeline', 'active', 'completed', 'on-hold'], default: 'active' },
  startDate: { type: String, default: '' },
  endDate: { type: String, default: '' }
});

const TaskSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['task', 'heading', 'bug', 'feature', 'maintenance'], default: 'task' },
  category: { type: String, default: 'General' },
  owner: { type: String, default: '' },
  status: { type: String, default: 'not-started' },
  manDays: { type: Number, default: 0 },
  timeline: { type: String, default: '' },
  notes: { type: String, default: '' },
  order: { type: Number, default: 0 },
  
  description: { type: String, default: '' },
  priority: { type: String, enum: ['lowest', 'low', 'medium', 'high', 'critical'], default: 'medium' },
  comments: [{ author: String, text: String, createdAt: Date }],
  subtasks: [{ title: String, completed: Boolean }]
});

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
  comments: [{ author: String, text: String, createdAt: Date }],
  subtasks: [{ title: String, completed: Boolean }]
});

const DailyLogSchema = new mongoose.Schema({
  employeeName: { type: String, required: true },
  date: { type: String, required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  taskDescription: { type: String, required: true },
  hoursSpent: { type: Number, required: true, default: 0 },
  status: { type: String, enum: ['in-progress', 'completed', 'blocked'], default: 'completed' },
  blockers: { type: String, default: '' }
});

const LeaveSchema = new mongoose.Schema({
  employeeName: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  daysCount: { type: Number, default: 1 },
  type: { type: String, enum: ['annual', 'sick', 'casual', 'unpaid'], default: 'annual' },
  notes: { type: String, default: '' }
});

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
});

const NotificationSchema = new mongoose.Schema({
  employeeName: { type: String, required: true },
  actor: { type: String, default: '' },
  message: { type: String, required: true },
  link: { type: String, default: '' },
  read: { type: Boolean, default: false }
});

const IntegrationSchema = new mongoose.Schema({
  msTeamsUrl: { type: String, default: '' },
  telegramToken: { type: String, default: '' },
  telegramChatId: { type: String, default: '' },
  whatsAppToken: { type: String, default: '' },
  whatsAppPhone: { type: String, default: '' },
  triggerOnBlocker: { type: Boolean, default: true },
  triggerOnCriticalBug: { type: Boolean, default: true }
});

const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);
const Issue = mongoose.models.Issue || mongoose.model('Issue', IssueSchema);
const DailyLog = mongoose.models.DailyLog || mongoose.model('DailyLog', DailyLogSchema);
const Leave = mongoose.models.Leave || mongoose.model('Leave', LeaveSchema);
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
const Integration = mongoose.models.Integration || mongoose.model('Integration', IntegrationSchema);

const WORKFLOW_CHECKLIST_DATA = {
  "Standing Module": [
    { type: "heading", task: "Object Maintenance Functions - There should be individual functions to:", owner: "", notes: "" },
    { type: "task", task: "Add / edit / delete Exceptions", owner: "Vishnu", notes: "" },
    { type: "task", task: "Add / edit / delete TBML Red Flags", owner: "Vishnu", notes: "" },
    { type: "task", task: "Add / edit / delete Checklist Line Items", owner: "Vishnu", notes: "" },
    { type: "heading", task: "Group Maintenance Functions - There should also be separate functions to:", owner: "", notes: "" },
    { type: "task", task: "Add Exceptions to an Exception Group", owner: "Vishnu", notes: "" },
    { type: "task", task: "Add TBML Red Flags to a TBML Group", owner: "Vishnu", notes: "" },
    { type: "task", task: "Add Checklist Line Items to a Checklist Group", owner: "Vishnu", notes: "" },
    { type: "heading", task: "Common Linkage Function", owner: "Vishnu", notes: "" },
    { type: "task", task: "A common function should then be introduced called Link Group to Function", owner: "Vishnu", notes: "This function will allow the admin user to link a previously created group to a processing function." }
  ],
  "Dashboard & Inquiry": [
    { type: "task", task: "Create dashboard tabs for: My Tasks, Group Tasks, Assignment, Awaiting Response, and Inquiry", owner: "", notes: "" },
    { type: "task", task: "Add action buttons for each dashboard column (Process, Claim, Disclaim)", owner: "Bharath", notes: "" },
    { type: "task", task: "Implement configurable dashboard columns so selected columns remain visible on the dashboard and unselected columns move to the side panel", owner: "Bharath", notes: "" },
    { type: "task", task: "Implement configurable filter criteria accessible through a side panel", owner: "Bharath", notes: "" },
    { type: "task", task: "Add visual SLA priority display with color coding", owner: "Bharath", notes: "" },
    { type: "task", task: "Add remaining time display with color coding", owner: "Bharath", notes: "" },
    { type: "task", task: "Add history view access from the Inquiry dashboard", owner: "Bharath", notes: "" },
    { type: "task", task: "Add document view access from the Inquiry dashboard", owner: "Bharath", notes: "" },
    { type: "task", task: "Implement a three-dot action menu on the Inquiry dashboard (View Summary, Transaction, Documents, Audit, Memo)", owner: "Bharath", notes: "" },
    { type: "task", task: "Add an Audit Log tab to the transaction screen", owner: "Bharath", notes: "" },
    { type: "task", task: "Add a Memo Entries tab to the transaction screen", owner: "Bharath", notes: "" },
    { type: "task", task: "Add top toolbar buttons on the transaction screen for Memo, Audit, and Document View", owner: "Bharath", notes: "" },
    { type: "task", task: "Implement two separate views: Summary View / Master View and Transaction View", owner: "Bharath", notes: "" },
    { type: "task", task: "Configure Inquiry dashboard Document View to show only documents for the selected process", owner: "Bharath", notes: "" },
    { type: "task", task: "Ensure Inquiry dashboard Document View does not include Current Process / All Process tabs", owner: "Bharath", notes: "" },
    { type: "task", task: "Ensure Inquiry dashboard Document View does not include an upload panel", owner: "Bharath", notes: "" },
    { type: "task", task: "Add a separate View All Documents option to show all case-level documents grouped by process instance ID", owner: "Bharath", notes: "" },
    { type: "task", task: "Keep transaction history unfiltered in the initial version", owner: "Bharath", notes: "" },
    { type: "task", task: "Add future enhancement option to introduce transaction history filtering if later required", owner: "Bharath", notes: "" },
    { type: "task", task: "Ensure card and side panel fields follow dashboard configuration logic", owner: "Bharath", notes: "" },
    { type: "task", task: "Use Process ID for display where technically required", owner: "Bharath", notes: "" },
    { type: "task", task: "Obtain sample JSON payloads for Memo and Audit from Nanjing", owner: "Bharath", notes: "" }
  ],
  "Document Overlay": [
    { type: "task", task: "Current Process documents uploaded in the current step; All Process documents grouped by process instance ID", owner: "Bharath", notes: "" },
    { type: "task", task: "Allow document upload, replacement, and deletion", owner: "Bharath", notes: "" },
    { type: "task", task: "Enable capture of additional document attributes for each document during processing", owner: "Bharath", notes: "" },
    { type: "task", task: "Ensure document attributes are stored in Maktaba", owner: "Bharath", notes: "" },
    { type: "task", task: "Ensure document attributes are visible during inquiry", owner: "Bharath", notes: "" },
    { type: "task", task: "In the current process view, display only pack-level documents", owner: "Bharath", notes: "" },
    { type: "task", task: "Clearly segregate historical documents uploaded by previous actors from current process documents", owner: "Bharath", notes: "" },
    { type: "task", task: "Label historical documents with the uploader and the stage at which they were uploaded", owner: "Bharath", notes: "" },
    { type: "task", task: "Add a separate Inquiry button to access all documents across all events for a case", owner: "Bharath", notes: "" },
    { type: "task", task: "Ensure case-level document inquiry sits outside the current transaction flow", owner: "Bharath", notes: "" },
    { type: "task", task: "Support parallel document viewing in Inquiry to meet document examiner usage needs", owner: "Bharath", notes: "" },
    { type: "task", task: "Rename buttons and tabs using clear, business-meaningful terminology", owner: "Bharath", notes: "" },
    { type: "task", task: "Make the main document access button prominent in the UI", owner: "Bharath", notes: "" },
    { type: "task", task: "Ensure the main document access button has an intuitive, user-friendly name", owner: "Bharath", notes: "" }
  ],
  "Transaction Tabs": [
    { type: "task", task: "Referral Feedback Screen", owner: "Vishnu", notes: "" },
    { type: "task", task: "Maker Tabs for referral (mostly done)", owner: "Vishnu", notes: "" },
    { type: "task", task: "TBML Tab - displayed to trade maker", owner: "Vishnu", notes: "" }
  ]
};

async function seed() {
  console.log("Connecting to database:", MONGODB_URI);
  await mongoose.connect(MONGODB_URI);
  console.log("Purging all collections...");

  await Project.deleteMany({});
  await Task.deleteMany({});
  await Issue.deleteMany({});
  await DailyLog.deleteMany({});
  await Leave.deleteMany({});
  await Transaction.deleteMany({});
  await Notification.deleteMany({});
  await Integration.deleteMany({});

  console.log("Seeding default projects...");

  const arbProject = await Project.create({
    code: "ARB-EXIM",
    name: "Al Rajhi Bank (ARB) - Eximbills Upgrade",
    client: "Al Rajhi Bank",
    type: "delivery",
    status: "active",
    startDate: "2024-10-01",
    endDate: "2026-08-30"
  });

  const wfProject = await Project.create({
    code: "WF-TASK",
    name: "Workflow Task Tracker Product",
    client: "Internal Product Team",
    type: "delivery",
    status: "active",
    startDate: "2026-04-01",
    endDate: "2026-07-31"
  });

  const maintenanceProject = await Project.create({
    code: "GLOBAL-MNT",
    name: "Global Trade Platform SLA Maintenance",
    client: "Multiple Banks",
    type: "maintenance",
    status: "active",
    startDate: "2026-01-01",
    endDate: "2026-12-31"
  });

  console.log("Seeding ARB data from Excel JSON...");
  const arbJsonPath = path.join('C:', 'Users', 'ilyas', '.gemini', 'antigravity', 'scratch', 'arb_data.json');
  const arbRaw = fs.readFileSync(arbJsonPath, 'utf8');
  const arbData = JSON.parse(arbRaw);

  const rawTasks = arbData["Task Tracker"] || [];
  let orderCounter = 0;
  for (let i = 2; i < rawTasks.length; i++) {
    const row = rawTasks[i];
    if (!row || row.length === 0) continue;
    const taskName = row[1];
    const category = row[2];
    const owner = row[3];
    const statusText = row[4];
    const manDaysVal = row[5];
    const timeline = row[6];
    const notes = row[7];

    if (!taskName) continue;

    let status = "not-started";
    if (statusText) {
      const st = statusText.toLowerCase();
      if (st.includes("in sit") || st.includes("sit")) status = "in-sit";
      else if (st.includes("in uat") || st.includes("uat")) status = "in-uat";
      else if (st.includes("in progress")) status = "in-progress";
      else if (st.includes("awaiting po") || st.includes("po")) status = "awaiting-po";
      else if (st.includes("on hold")) status = "on-hold";
      else if (st.includes("done")) status = "done";
    }

    await Task.create({
      projectId: arbProject._id,
      title: taskName,
      type: "task",
      category: category || "General",
      owner: owner || "",
      status: status,
      manDays: typeof manDaysVal === 'number' ? manDaysVal : 0,
      timeline: timeline || "",
      notes: notes || "",
      order: orderCounter++,
      priority: 'medium',
      description: `Imported from Excel Row ${i}. Target details: ${notes || 'None'}`
    });
  }

  console.log("Seeding ARB Financial POs...");
  const rawFinances = arbData["Invoice & PO Status"] || [];
  for (let i = 2; i < rawFinances.length - 1; i++) {
    const row = rawFinances[i];
    if (!row || row.length === 0 || !row[1]) continue;
    const poNo = row[1];
    const dateStr = row[2];
    const desc = row[3];
    const totalAmount = row[4];
    const paidAmount = row[5];
    const statusText = row[7];
    const comment = row[9];

    if (desc === "TOTAL") continue;

    let date = "2025-01-01";
    if (dateStr) {
      const parts = dateStr.split('/');
      if (parts.length === 3) {
        date = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
      }
    }

    let status = "paid";
    if (statusText) {
      const st = statusText.toLowerCase();
      if (st.includes("balance on hold")) status = "on-hold";
      else if (st.includes("part-paid")) status = "part-paid";
      else if (st.includes("awaiting po")) status = "awaiting-po";
    }

    await Transaction.create({
      projectId: arbProject._id,
      type: "revenue",
      category: poNo === "Pending" ? "SOW Extra" : "PO",
      reference: poNo,
      date: date,
      description: desc,
      amount: typeof totalAmount === 'number' ? totalAmount : 0,
      paid: typeof paidAmount === 'number' ? paidAmount : 0,
      status: status,
      comments: comment || ""
    });
  }

  console.log("Adding mock operational expenses...");
  await Transaction.create({
    projectId: arbProject._id,
    type: "expense",
    category: "Salary",
    reference: "Salary-Apr26",
    date: "2026-04-30",
    description: "Allocated developers salary cost",
    amount: 45000,
    paid: 45000,
    status: "paid"
  });

  console.log("Seeding Leaves...");
  const rawLeaves = arbData["Leave Tracker"] || [];
  for (let i = 2; i < rawLeaves.length - 2; i++) {
    const row = rawLeaves[i];
    if (!row || row.length === 0 || !row[0]) continue;
    const name = row[0];
    const leaveText = row[1];
    const workingDays = row[2];
    const note = row[3];

    if (name === "Vijayan") {
      await Leave.create({
        employeeName: "Vijayan",
        startDate: "2026-08-01",
        endDate: "2026-08-31",
        daysCount: 22,
        type: "annual",
        notes: "Full month out."
      });
    } else if (name === "Ilyas") {
      await Leave.create({ employeeName: "Ilyas", startDate: "2026-06-30", endDate: "2026-07-15", daysCount: 12, type: "annual", notes: "Summer block 1" });
      await Leave.create({ employeeName: "Ilyas", startDate: "2026-08-15", endDate: "2026-08-31", daysCount: 12, type: "annual", notes: "Summer block 2" });
    } else if (name === "Tom") {
      await Leave.create({ employeeName: "Tom", startDate: "2026-08-08", endDate: "2026-08-31", daysCount: 16, type: "annual", notes: "Overlaps Swift Upgrade crunch" });
    } else {
      await Leave.create({ employeeName: name, startDate: "2026-09-01", endDate: "2026-09-01", daysCount: 0, type: "annual", notes: leaveText || "No leaves" });
    }
  }

  console.log("Seeding Workflow checklist tasks...");
  let orderWf = 0;
  for (const [catName, tasksList] of Object.entries(WORKFLOW_CHECKLIST_DATA)) {
    for (const t of tasksList) {
      await Task.create({
        projectId: wfProject._id,
        title: t.task,
        type: t.type,
        category: catName,
        owner: t.owner,
        status: t.type === "heading" ? "" : "not-started",
        manDays: 0,
        timeline: "",
        notes: t.notes,
        order: orderWf++,
        priority: 'medium',
        description: `Developer Checklist task: ${t.task}`
      });
    }
  }

  console.log("Seeding mock bugs and incidents (Issue Tracker)...");
  // 1. Critical bug
  await Issue.create({
    projectId: arbProject._id,
    title: "Sanctions checking crashes on large shipping documents check-in",
    description: "When checks are executed on files exceeding 12MB, the FircoSoft checker throws a SocketTimeoutException in SIT. Requires payload compression.",
    type: "bug",
    priority: "critical",
    status: "open",
    assignee: "Bharath",
    reporter: "Ilyas",
    comments: [
      { author: "Ilyas", text: "Logged this during validation tests. Need to fix before UAT next week.", createdAt: new Date() }
    ],
    subtasks: [
      { title: "Implement file streaming buffer size", completed: false },
      { title: "Test connection timeout adjustments", completed: false }
    ]
  });

  // 2. Medium bug
  await Issue.create({
    projectId: arbProject._id,
    title: "Predefined rejection dropdown alignment issue in Mobile App",
    description: "The rejection dropdown is pushed slightly to the right, cutting off text on iOS devices.",
    type: "bug",
    priority: "medium",
    status: "in-progress",
    assignee: "Vishnu",
    reporter: "Tom"
  });

  // 3. Incident
  await Issue.create({
    projectId: arbProject._id,
    title: "UAT sandbox DB connection pool leakage",
    description: "UAT sandbox db hits max connection limit after 4 hours of inactivity. Leak detected in connection release middleware.",
    type: "incident",
    priority: "high",
    status: "under-review",
    assignee: "Susanth",
    reporter: "Vijayan"
  });

  console.log("Seeding default webhook configuration...");
  await Integration.create({
    msTeamsUrl: "",
    telegramToken: "",
    telegramChatId: "",
    whatsAppToken: "",
    whatsAppPhone: "",
    triggerOnBlocker: true,
    triggerOnCriticalBug: true
  });

  console.log("Seeding default notifications...");
  await Notification.create({
    employeeName: "Ilyas",
    actor: "Vijayan",
    message: "assigned you a task: 'Bawatech Phase 3 API Changes'",
    link: "tasks",
    read: false
  });

  console.log("Database successfully seeded and initialized!");
  await mongoose.disconnect();
  console.log("Database connection closed cleanly.");
}

seed().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
