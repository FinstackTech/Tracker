import dbConnect from '@/lib/db';
import { Document } from '@/lib/models';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    
    const query = projectId ? { projectId } : {};
    const documents = await Document.find(query).sort({ updatedAt: -1 });
    return NextResponse.json({ success: true, data: documents });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    
    // Auto-calculate size labels if not set
    if (!body.fileSize && body.sizeBytes) {
      const kb = body.sizeBytes / 1024;
      if (kb >= 1024) {
        body.fileSize = `${(kb / 1024).toFixed(1)} MB`;
      } else {
        body.fileSize = `${Math.round(kb)} KB`;
      }
    }
    
    if (!body.lastUpdated) {
      body.lastUpdated = new Date().toISOString().replace('T', ' ').substring(0, 16);
    }
    
    const document = await Document.create(body);
    return NextResponse.json({ success: true, data: document });
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
      return NextResponse.json({ success: false, error: "Document ID (_id) is required for update" }, { status: 400 });
    }
    
    updateData.lastUpdated = new Date().toISOString().replace('T', ' ').substring(0, 16);
    
    const document = await Document.findByIdAndUpdate(_id, updateData, { new: true });
    return NextResponse.json({ success: true, data: document });
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
      return NextResponse.json({ success: false, error: "Document ID is required" }, { status: 400 });
    }
    
    await Document.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Document deleted successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
