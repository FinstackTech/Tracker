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
    
    // Auto-calculate days count if not provided
    if (!body.daysCount && body.startDate && body.endDate) {
      const start = new Date(body.startDate);
      const end = new Date(body.endDate);
      const timeDiff = end.getTime() - start.getTime();
      const days = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
      body.daysCount = days > 0 ? days : 1;
    }
    
    const leave = await Leave.create(body);
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
    
    if (!id) {
      return NextResponse.json({ success: false, error: "Leave ID is required" }, { status: 400 });
    }
    
    await Leave.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Leave deleted successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
export async function PUT(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { _id, ...updateData } = body;
    
    if (!_id) {
      return NextResponse.json({ success: false, error: "Leave ID (_id) is required for update" }, { status: 400 });
    }
    
    const leave = await Leave.findByIdAndUpdate(_id, updateData, { new: true });
    return NextResponse.json({ success: true, data: leave });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
