import dbConnect from '@/lib/db';
import { Notification } from '@/lib/models';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const employeeName = searchParams.get('employeeName');
    
    const query = employeeName ? { employeeName } : {};
    const notifications = await Notification.find(query).sort({ createdAt: -1 });
    
    return NextResponse.json({ success: true, data: notifications });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const notification = await Notification.create(body);
    return NextResponse.json({ success: true, data: notification });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PUT(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { _id, read } = body;
    
    if (!_id) {
      return NextResponse.json({ success: false, error: "Notification ID is required" }, { status: 400 });
    }
    
    const notification = await Notification.findByIdAndUpdate(_id, { read }, { new: true });
    return NextResponse.json({ success: true, data: notification });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
