import dbConnect from '@/lib/db';
import { Epic } from '@/lib/models';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    
    const query = projectId ? { projectId } : {};
    const epics = await Epic.find(query).sort({ createdAt: 1 });
    
    return NextResponse.json({ success: true, data: epics });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const epic = await Epic.create(body);
    return NextResponse.json({ success: true, data: epic });
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
      return NextResponse.json({ success: false, error: "Epic ID is required" }, { status: 400 });
    }
    
    await Epic.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Epic deleted successfully" });
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
      return NextResponse.json({ success: false, error: "Epic ID (_id) is required for update" }, { status: 400 });
    }
    
    const epic = await Epic.findByIdAndUpdate(_id, updateData, { new: true });
    return NextResponse.json({ success: true, data: epic });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
