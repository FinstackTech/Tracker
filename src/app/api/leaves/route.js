import dbConnect from '@/lib/db';
import { Leave } from '@/lib/models';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await dbConnect();
    const leaves = await Leave.find({}).sort({ startDate: 1 });
    return NextResponse.json({ success: true, data: leaves });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { actor, ...leaveData } = body;
    
    // Auto-calculate days count if not provided
    if (!leaveData.daysCount && leaveData.startDate && leaveData.endDate) {
      const start = new Date(leaveData.startDate);
      const end = new Date(leaveData.endDate);
      const timeDiff = end.getTime() - start.getTime();
      const days = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
      leaveData.daysCount = days > 0 ? days : 1;
    }
    
    const leave = await Leave.create(leaveData);

    try {
      const { routeActionNotification } = require('@/lib/notificationRouter');
      await routeActionNotification({
        actor: actor || leave.employeeName || 'System',
        actionType: 'create',
        module: 'leave',
        itemId: leave._id,
        itemTitle: `${leave.employeeName}'s ${leave.type} leave request (${leave.daysCount} days)`,
        details: leave
      });
    } catch (e) {
      console.error("Failed to route leave request notification:", e);
    }

    return NextResponse.json({ success: true, data: leave });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const actor = searchParams.get('actor') || "User";
    
    if (!id) {
      return NextResponse.json({ success: false, error: "Leave ID is required" }, { status: 400 });
    }
    
    const leave = await Leave.findById(id);
    if (!leave) {
      return NextResponse.json({ success: false, error: "Leave not found" }, { status: 404 });
    }

    await Leave.findByIdAndDelete(id);

    try {
      const { routeActionNotification } = require('@/lib/notificationRouter');
      await routeActionNotification({
        actor: actor,
        actionType: 'delete',
        module: 'leave',
        itemId: leave._id,
        itemTitle: `${leave.employeeName}'s ${leave.type} leave request`,
        details: leave
      });
    } catch (e) {
      console.error("Failed to route leave delete notification:", e);
    }

    return NextResponse.json({ success: true, message: "Leave deleted successfully" });
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
      return NextResponse.json({ success: false, error: "Leave ID (_id) is required for update" }, { status: 400 });
    }
    
    const leave = await Leave.findByIdAndUpdate(_id, updateData, { new: true });

    try {
      const { routeActionNotification } = require('@/lib/notificationRouter');
      await routeActionNotification({
        actor: actor || 'HR',
        actionType: 'update',
        module: 'leave',
        itemId: leave._id,
        itemTitle: `${leave.employeeName}'s ${leave.type} leave request`,
        details: leave
      });
    } catch (e) {
      console.error("Failed to route leave update notification:", e);
    }

    return NextResponse.json({ success: true, data: leave });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
