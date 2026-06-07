import dbConnect from './db';
import { Employee, Notification, Task, Issue, Project } from './models';
import { dispatchAlert } from './integrations';

/**
 * Route actions dynamically based on roles, projects, assignments, mentions, watchers, and workflow levels.
 * Dispatches to bell notifications, email simulations, MS Teams webhooks, and mobile push targets.
 */
export async function routeActionNotification({
  actor,
  actionType, // 'create', 'update', 'delete', 'comment', 'status_change', 'approve', 'reject'
  module,     // 'task', 'issue', 'leave', 'finance', 'document', 'project', 'standup'
  projectId,
  itemId,
  itemTitle,
  details = {}
}) {
  try {
    await dbConnect();

    const recipients = new Set();
    
    // 1. Fetch all employees to resolve roles and preferences
    const allEmployees = await Employee.find({});
    
    // Helper to scan for match
    const getEmployeeByName = (name) => 
      allEmployees.find(e => e.name.toLowerCase() === name.trim().toLowerCase());

    // 2. Fetch project context if available
    let project = null;
    if (projectId) {
      project = await Project.findById(projectId);
    }

    const subject = itemTitle || details?.title || `${module.toUpperCase()} Item`;
    let actionDesc = `${actionType}d`;
    if (actionType === 'status_change') {
      actionDesc = `updated status to "${details?.status || 'unknown'}" for`;
    } else if (actionType === 'comment') {
      actionDesc = `commented on`;
    } else if (actionType === 'approve') {
      actionDesc = `approved`;
    } else if (actionType === 'reject') {
      actionDesc = `rejected`;
    }

    const baseMessage = `${actionDesc} ${module}: "${subject}"`;

    // ─── RULE 1: ROLE & MODULE ROUTING ───
    if (module === 'leave') {
      // HR managers, Admins, and PMs need to review leaves
      allEmployees.forEach(emp => {
        const role = (emp.role || '').toLowerCase();
        if (role === 'hr' || role === 'admin' || role === 'superadmin' || role === 'manager') {
          recipients.add(emp.name);
        }
      });
      // If someone else is approving/rejecting/modifying a leave, notify the applicant
      if (details?.employeeName && details.employeeName !== actor) {
        recipients.add(details.employeeName);
      }
    } else if (module === 'finance') {
      // Financial logs require visibility for Admin, Manager, and Sales
      allEmployees.forEach(emp => {
        const role = (emp.role || '').toLowerCase();
        if (role === 'admin' || role === 'superadmin' || role === 'manager' || role === 'sales') {
          recipients.add(emp.name);
        }
      });
    } else if (module === 'project') {
      // Project creations/modifications: PMs, Leads, and Admins
      allEmployees.forEach(emp => {
        const role = (emp.role || '').toLowerCase();
        if (role === 'admin' || role === 'superadmin' || role === 'manager' || role === 'pm' || role === 'lead') {
          recipients.add(emp.name);
        }
      });
    } else if (module === 'task' || module === 'issue') {
      // Notify leads, project managers, and administrators
      allEmployees.forEach(emp => {
        const role = (emp.role || '').toLowerCase();
        if (role === 'pm' || role === 'lead' || role === 'admin' || role === 'superadmin' || role === 'manager') {
          recipients.add(emp.name);
        }
      });
    } else if (module === 'document') {
      // Document upload: notify managers and leads
      allEmployees.forEach(emp => {
        const role = (emp.role || '').toLowerCase();
        if (role === 'pm' || role === 'lead' || role === 'admin' || role === 'superadmin') {
          recipients.add(emp.name);
        }
      });
    }

    // ─── RULE 2: ASSIGNED USERS ROUTING ───
    // Direct assignees for task or issue
    if (details?.owner) recipients.add(details.owner);
    if (details?.assignee) recipients.add(details.assignee);

    let dbItem = null;
    if (itemId) {
      if (module === 'task') dbItem = await Task.findById(itemId);
      else if (module === 'issue') dbItem = await Issue.findById(itemId);

      if (dbItem) {
        if (dbItem.owner) recipients.add(dbItem.owner);
        if (dbItem.assignee) recipients.add(dbItem.assignee);
        if (dbItem.reporter) recipients.add(dbItem.reporter);
      }
    }

    // ─── RULE 3: MENTIONED USERS ROUTING ───
    // Scan description, notes, comments, and titles for @Mentions
    const contentText = [
      subject,
      details?.description || '',
      details?.notes || '',
      details?.commentText || '',
      details?.text || ''
    ].join(' ');

    allEmployees.forEach(emp => {
      const escapedName = emp.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const nameRegex = new RegExp(`@${escapedName}\\b`, 'gi');
      if (nameRegex.test(contentText)) {
        recipients.add(emp.name);
      }
    });

    // ─── RULE 4: WATCHERS & FOLLOWERS ROUTING ───
    // Define watchers as anyone who commented on the ticket, was assigned, or created/reported it
    if (dbItem) {
      if (dbItem.reporter) recipients.add(dbItem.reporter);
      
      if (dbItem.comments && Array.isArray(dbItem.comments)) {
        dbItem.comments.forEach(comment => {
          if (comment.author) recipients.add(comment.author);
        });
      }
      
      if (dbItem.history && Array.isArray(dbItem.history)) {
        dbItem.history.forEach(h => {
          if (h.actor) recipients.add(h.actor);
        });
      }
    }

    // ─── RULE 5: PROJECT MEMBERS ROUTING ───
    if (projectId) {
      // Fetch distinct list of people assigned tasks/issues inside this project
      const taskOwners = await Task.find({ projectId }).distinct('owner');
      const issueAssignees = await Issue.find({ projectId }).distinct('assignee');
      const issueReporters = await Issue.find({ projectId }).distinct('reporter');

      taskOwners.forEach(name => { if (name) recipients.add(name); });
      issueAssignees.forEach(name => { if (name) recipients.add(name); });
      issueReporters.forEach(name => { if (name) recipients.add(name); });
    }

    // ─── RULE 6: APPROVAL / WORKFLOW LEVEL ROUTING ───
    if ((module === 'leave' || module === 'finance') && actionType === 'create') {
      // Notify approvers directly
      allEmployees.forEach(emp => {
        const role = (emp.role || '').toLowerCase();
        if (role === 'admin' || role === 'superadmin' || role === 'hr' || role === 'manager') {
          recipients.add(emp.name);
        }
      });
    }

    // ─── CLEAN RECIPIENT LIST ───
    recipients.delete(actor); // Never notify the actor of their own action

    const validRecipients = Array.from(recipients).map(name => getEmployeeByName(name)).filter(Boolean);

    console.log(`[NotificationRouter] Routing actions for ${module} (${actionType}) to ${validRecipients.length} user(s).`);

    // ─── ROUTE BASED ON PREFERENCES ───
    for (const recipient of validRecipients) {
      const prefs = recipient.notificationPreferences || { bell: true, email: true, teams: false, push: false };
      const recipientName = recipient.name;

      let link = 'dashboard';
      if (module === 'task') link = 'tasks';
      else if (module === 'issue') link = 'issues';
      else if (module === 'leave') link = 'hr';
      else if (module === 'finance') link = 'finance';
      else if (module === 'document') link = 'documents';
      else if (module === 'project') link = 'projects';

      const isMentioned = new RegExp(`@${recipientName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'gi').test(contentText);
      const customizedMessage = isMentioned 
        ? `mentioned you: "${subject}"` 
        : baseMessage;

      // 1. System Bell Notification (In-App)
      if (prefs.bell !== false) {
        await Notification.create({
          employeeName: recipientName,
          actor: actor,
          message: customizedMessage,
          link: link,
          read: false
        });
        console.log(` -> Dispatched Bell notification to ${recipientName}`);
      }

      // 2. Email / Outlook Integration (Simulation)
      if (prefs.email !== false) {
        console.log(`[OUTLOOK EMAIL DISPATCH MOCK]
          To: ${recipient.email || `${recipientName}@company.com`}
          Subject: [PPM Tracker Alert] ${actor} ${customizedMessage}
          Body: Hello ${recipientName},
                This is an automated notification from Enterprise PPM Platform.
                Actor: ${actor}
                Action: ${actor} ${customizedMessage}
                Context: Module: ${module} | Item ID: ${itemId || 'N/A'}
                View in app: http://localhost:3000/${link}`);
      }

      // 3. Microsoft Teams Integration (User-level or fallback to global)
      if (prefs.teams === true) {
        const webhookUrl = recipient.teamsWebhookUrl || null;
        if (webhookUrl) {
          console.log(` -> Dispatching Microsoft Teams notification to ${recipientName}'s personal webhook: ${webhookUrl}`);
          try {
            await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                "@type": "MessageCard",
                "@context": "http://schema.org/extensions",
                "themeColor": "4F46E5",
                "summary": `Notification for ${recipientName}`,
                "sections": [{
                  "activityTitle": `Direct Notification: ${recipientName}`,
                  "activitySubtitle": `Triggered by ${actor}`,
                  "text": `*${actor}* ${customizedMessage}`,
                  "facts": [
                    { "name": "Module", "value": module },
                    { "name": "Project", "value": project ? project.name : "N/A" }
                  ]
                }]
              })
            });
          } catch (e) {
            console.error(`Failed to send MS Teams notification to ${recipientName}:`, e.message);
          }
        } else {
          // Fall back to system webhook or general logging
          console.log(` -> User ${recipientName} has Teams enabled but no teamsWebhookUrl set. Dispatched to global webhook alert.`);
        }
      }

      // 4. Mobile Push Notification (Simulation)
      if (prefs.push === true) {
        const pushToken = recipient.mobilePushToken || 'simulated-token-123';
        console.log(`[MOBILE PUSH DISPATCH MOCK]
          Target Device Token: ${pushToken}
          Recipient: ${recipientName}
          Title: ${actor} ${actionDesc} ${module}
          Message: ${customizedMessage}`);
      }
    }

    // Always log project level integrations for slack/discord/etc. globally if matches triggers
    await dispatchAlert({
      event: actionType === 'status_change' && details?.status === 'done' ? 'task_done' : undefined,
      title: `${module.toUpperCase()} Action Alert`,
      message: `*${actor}* ${baseMessage}`,
      details: {
        Module: module,
        Action: actionType,
        Item: subject,
        Project: project ? `${project.name} (${project.code})` : 'N/A',
        Actor: actor
      }
    });

    return { success: true, count: validRecipients.length };
  } catch (error) {
    console.error("Error in routeActionNotification:", error);
    return { success: false, error: error.message };
  }
}
