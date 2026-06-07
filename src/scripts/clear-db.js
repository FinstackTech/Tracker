const mongoose = require('mongoose');
const MONGODB_URI = 'mongodb://localhost:27017/tracker_db';

// Define mini schemas for deletion execution
const ProjectSchema = new mongoose.Schema({});
const TaskSchema = new mongoose.Schema({});
const IssueSchema = new mongoose.Schema({});
const DailyLogSchema = new mongoose.Schema({});
const LeaveSchema = new mongoose.Schema({});
const TransactionSchema = new mongoose.Schema({});
const NotificationSchema = new mongoose.Schema({});
const IntegrationSchema = new mongoose.Schema({});
const DocumentSchema = new mongoose.Schema({});
const EmployeeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, default: 'Employee' },
  email: { type: String, required: true },
  password: { type: String, default: 'user' },
  team: { type: String, default: 'Engineering' },
  status: { type: String, default: 'Active' }
});

const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);
const Issue = mongoose.models.Issue || mongoose.model('Issue', IssueSchema);
const DailyLog = mongoose.models.DailyLog || mongoose.model('DailyLog', DailyLogSchema);
const Leave = mongoose.models.Leave || mongoose.model('Leave', LeaveSchema);
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
const Integration = mongoose.models.Integration || mongoose.model('Integration', IntegrationSchema);
const Document = mongoose.models.Document || mongoose.model('Document', DocumentSchema);
const Employee = mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);

async function clear() {
  console.log("Connecting to database:", MONGODB_URI);
  await mongoose.connect(MONGODB_URI);
  console.log("Wiping all database collections...");

  await Project.deleteMany({});
  await Task.deleteMany({});
  await Issue.deleteMany({});
  await DailyLog.deleteMany({});
  await Leave.deleteMany({});
  await Transaction.deleteMany({});
  await Notification.deleteMany({});
  await Integration.deleteMany({});
  await Document.deleteMany({});
  await Employee.deleteMany({});

  console.log("Creating default Superadmin profile so login remains operational...");
  await Employee.create({
    name: 'Superadmin',
    role: 'Admin',
    email: 'superadmin@company.com',
    password: 'admin',
    team: 'Operations',
    status: 'Active'
  });

  console.log("Database successfully cleared and reset!");
  await mongoose.disconnect();
}

clear().catch(err => {
  console.error("Reset failed:", err);
  process.exit(1);
});
