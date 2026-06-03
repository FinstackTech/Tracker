import dbConnect from '@/lib/db';
import { Task } from '@/lib/models';
import { NextResponse } from 'next/server';
import { dispatchAlert } from '@/lib/integrations';

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    
    const query = projectId ? { projectId } : {};
    const tasks = await Task.find(query)
      .populate('epicId')
      .sort({ order: 1, createdAt: 1 });
    
    return NextResponse.json({ success: true, data: tasks });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const task = await Task.create(body);
    return NextResponse.json({ success: true, data: task });
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
      return NextResponse.json({ success: false, error: "Task ID (_id) is required for update" }, { status: 400 });
    }
    
    // Fetch current task for history logging comparison
    const currentTask = await Task.findById(_id);
    if (!currentTask) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    }

    const historyLogs = [];
    const changeActor = actor || "User";

    if (updateData.status !== undefined && updateData.status !== currentTask.status) {
      historyLogs.push({ actor: changeActor, action: `changed status from "${currentTask.status}" to "${updateData.status}"` });
    }
    if (updateData.owner !== undefined && updateData.owner !== currentTask.owner) {
      historyLogs.push({ actor: changeActor, action: `assigned task to "${updateData.owner || 'Unassigned'}"` });
    }
    if (updateData.priority !== undefined && updateData.priority !== currentTask.priority) {
      historyLogs.push({ actor: changeActor, action: `changed priority from "${currentTask.priority}" to "${updateData.priority}"` });
    }
    if (updateData.blocked !== undefined && updateData.blocked !== currentTask.blocked) {
      historyLogs.push({ actor: changeActor, action: updateData.blocked ? "flagged task as BLOCKED ⚠️" : "removed blocker status ✅" });
    }
    if (updateData.epicId !== undefined && String(updateData.epicId || '') !== String(currentTask.epicId || '')) {
      historyLogs.push({ actor: changeActor, action: "updated Epic linkage" });
    }
    if (updateData.storyPoints !== undefined && Number(updateData.storyPoints || 0) !== Number(currentTask.storyPoints || 0)) {
      historyLogs.push({ actor: changeActor, action: `changed story points from ${currentTask.storyPoints || 0} to ${updateData.storyPoints || 0}` });
    }
    if (updateData.dueDate !== undefined && String(updateData.dueDate || '') !== String(currentTask.dueDate || '')) {
      historyLogs.push({ actor: changeActor, action: `updated due date to "${updateData.dueDate || 'None'}"` });
    }
    if (updateData.icon !== undefined && String(updateData.icon || '') !== String(currentTask.icon || '')) {
      historyLogs.push({ actor: changeActor, action: `updated item icon to "${updateData.icon || 'None'}"` });
    }

    if (historyLogs.length > 0) {
      // Append logs to existing history
      updateData.$push = { history: { $each: historyLogs } };
    }

    const task = await Task.findByIdAndUpdate(_id, updateData, { new: true }).populate('epicId');

    // Dispatch webhook alert if task is done
    if (updateData.status === 'done' && currentTask.status !== 'done') {
      await dispatchAlert({
        event: 'task_done',
        title: "TASK COMPLETED ✅",
        message: `Task "${task.title}" has been marked as completed by ${changeActor}.`,
        details: {
          "Task Title": task.title,
          "Completed By": changeActor,
          "Category": task.category || "General",
          "Owner": task.owner || "Unassigned"
        }
      });
    }

    return NextResponse.json({ success: true, data: task });
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
      return NextResponse.json({ success: false, error: "Task ID is required for delete" }, { status: 400 });
    }
    
    const task = await Task.findByIdAndDelete(id);
    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: task });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
