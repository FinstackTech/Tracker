import dbConnect from '@/lib/db';
import { Issue } from '@/lib/models';
import { NextResponse } from 'next/server';
import { dispatchAlert } from '@/lib/integrations';

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    
    const query = projectId ? { projectId } : {};
    const issues = await Issue.find(query)
      .populate('epicId')
      .sort({ createdAt: -1 });
    
    return NextResponse.json({ success: true, data: issues });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const issue = await Issue.create(body);
    
    // Dispatch webhook alert if bug is critical
    if (issue.priority === 'critical') {
      await dispatchAlert({
        event: 'critical_bug',
        title: "CRITICAL BUG REPORTED 🐛",
        message: `A critical priority issue has been raised: "${issue.title}"`,
        details: {
          "Project ID": issue.projectId.toString(),
          "Type": issue.type,
          "Reporter": issue.reporter || "Anonymous",
          "Status": issue.status
        }
      });
    }

    return NextResponse.json({ success: true, data: issue });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PUT(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { _id, actor, ...updateData } = body;
    
    if (!_id) {
      return NextResponse.json({ success: false, error: "Issue ID is required" }, { status: 400 });
    }
    
    // Fetch current issue for audit history comparison
    const currentIssue = await Issue.findById(_id);
    if (!currentIssue) {
      return NextResponse.json({ success: false, error: "Issue not found" }, { status: 454 });
    }

    const historyLogs = [];
    const changeActor = actor || "User";

    if (updateData.status !== undefined && updateData.status !== currentIssue.status) {
      historyLogs.push({ actor: changeActor, action: `changed status from "${currentIssue.status}" to "${updateData.status}"` });
    }
    if (updateData.assignee !== undefined && updateData.assignee !== currentIssue.assignee) {
      historyLogs.push({ actor: changeActor, action: `reassigned issue to "${updateData.assignee || 'Unassigned'}"` });
    }
    if (updateData.priority !== undefined && updateData.priority !== currentIssue.priority) {
      historyLogs.push({ actor: changeActor, action: `changed priority from "${currentIssue.priority}" to "${updateData.priority}"` });
    }
    if (updateData.blocked !== undefined && updateData.blocked !== currentIssue.blocked) {
      historyLogs.push({ actor: changeActor, action: updateData.blocked ? "flagged issue as BLOCKED ⚠️" : "removed blocker status ✅" });
    }
    if (updateData.epicId !== undefined && String(updateData.epicId || '') !== String(currentIssue.epicId || '')) {
      historyLogs.push({ actor: changeActor, action: "updated Epic linkage" });
    }
    if (updateData.storyPoints !== undefined && Number(updateData.storyPoints || 0) !== Number(currentIssue.storyPoints || 0)) {
      historyLogs.push({ actor: changeActor, action: `changed story points from ${currentIssue.storyPoints || 0} to ${updateData.storyPoints || 0}` });
    }
    if (updateData.dueDate !== undefined && String(updateData.dueDate || '') !== String(currentIssue.dueDate || '')) {
      historyLogs.push({ actor: changeActor, action: `updated due date to "${updateData.dueDate || 'None'}"` });
    }
    if (updateData.icon !== undefined && String(updateData.icon || '') !== String(currentIssue.icon || '')) {
      historyLogs.push({ actor: changeActor, action: `updated item icon to "${updateData.icon || 'None'}"` });
    }

    if (historyLogs.length > 0) {
      updateData.$push = { history: { $each: historyLogs } };
    }

    const issue = await Issue.findByIdAndUpdate(_id, updateData, { new: true }).populate('epicId');
    
    // Dispatch webhook alert if priority was changed to critical
    if (updateData.priority === 'critical') {
      await dispatchAlert({
        event: 'critical_bug',
        title: "BUG SEVERITY ESCALATED TO CRITICAL 🚨",
        message: `The issue: "${issue.title}" has been escalated to critical severity.`,
        details: {
          "Assignee": issue.assignee || "Unassigned",
          "Status": issue.status
        }
      });
    }

    // Dispatch webhook alert if issue is resolved
    if (updateData.status === 'resolved' && currentIssue.status !== 'resolved') {
      await dispatchAlert({
        event: 'issue_resolved',
        title: "ISSUE RESOLVED ✅",
        message: `The issue: "${issue.title}" has been resolved by ${changeActor}.`,
        details: {
          "Issue Title": issue.title,
          "Resolved By": changeActor,
          "Assignee": issue.assignee || "Unassigned",
          "Resolution Notes": updateData.resolutionNotes || "Not specified"
        }
      });
    }

    return NextResponse.json({ success: true, data: issue });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ success: false, error: "Issue ID is required" }, { status: 400 });
    }
    
    await Issue.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Issue deleted successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
