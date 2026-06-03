import dbConnect from '@/lib/db';
import { DailyLog } from '@/lib/models';
import { NextResponse } from 'next/server';
import { dispatchAlert } from '@/lib/integrations';

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const employeeName = searchParams.get('employeeName');
    
    let query = {};
    if (date) query.date = date;
    if (employeeName) query.employeeName = employeeName;
    
    const logs = await DailyLog.find(query)
      .populate('projectId')
      .sort({ createdAt: -1 });
      
    return NextResponse.json({ success: true, data: logs });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const log = await DailyLog.create(body);
    const populatedLog = await DailyLog.findById(log._id).populate('projectId');
    
    // Dispatch webhook alert if employee logs blocker
    if (log.status === 'blocked') {
      const projName = populatedLog.projectId ? populatedLog.projectId.name : 'General Task';
      await dispatchAlert({
        event: 'blocker',
        title: "TEAM BLOCKER ENCOUNTERED ⚠️",
        message: `Team member ${log.employeeName} logged a blocker in project "${projName}":`,
        details: {
          "Resource Name": log.employeeName,
          "Logged Activity": log.taskDescription,
          "Blocker Reason": log.blockers || "Not specified",
          "Standup Date": log.date
        }
      });
    }

    return NextResponse.json({ success: true, data: populatedLog });
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
      return NextResponse.json({ success: false, error: "Log ID is required" }, { status: 400 });
    }
    
    await DailyLog.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Log deleted successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
