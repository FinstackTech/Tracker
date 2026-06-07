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
    const { actor, ...docData } = body;
    
    // Auto-calculate size labels if not set
    if (!docData.fileSize && docData.sizeBytes) {
      const kb = docData.sizeBytes / 1024;
      if (kb >= 1024) {
        docData.fileSize = `${(kb / 1024).toFixed(1)} MB`;
      } else {
        docData.fileSize = `${Math.round(kb)} KB`;
      }
    }
    
    if (!docData.lastUpdated) {
      docData.lastUpdated = new Date().toISOString().replace('T', ' ').substring(0, 16);
    }
    
    const document = await Document.create(docData);

    try {
      const { routeActionNotification } = require('@/lib/notificationRouter');
      await routeActionNotification({
        actor: actor || document.owner || 'User',
        actionType: 'create',
        module: 'document',
        projectId: document.projectId,
        itemId: document._id,
        itemTitle: `Document uploaded: "${document.name}"`,
        details: document
      });
    } catch (e) {
      console.error("Failed to route document create notification:", e);
    }

    return NextResponse.json({ success: true, data: document });
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
      return NextResponse.json({ success: false, error: "Document ID (_id) is required for update" }, { status: 400 });
    }
    
    updateData.lastUpdated = new Date().toISOString().replace('T', ' ').substring(0, 16);
    
    const document = await Document.findByIdAndUpdate(_id, updateData, { new: true });

    try {
      const { routeActionNotification } = require('@/lib/notificationRouter');
      await routeActionNotification({
        actor: actor || document.owner || 'User',
        actionType: 'update',
        module: 'document',
        projectId: document.projectId,
        itemId: document._id,
        itemTitle: `Document updated: "${document.name}"`,
        details: document
      });
    } catch (e) {
      console.error("Failed to route document update notification:", e);
    }

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
    const actor = searchParams.get('actor') || "User";
    
    if (!id) {
      return NextResponse.json({ success: false, error: "Document ID is required" }, { status: 400 });
    }
    
    const document = await Document.findById(id);
    if (!document) {
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }

    await Document.findByIdAndDelete(id);

    try {
      const { routeActionNotification } = require('@/lib/notificationRouter');
      await routeActionNotification({
        actor: actor,
        actionType: 'delete',
        module: 'document',
        projectId: document.projectId,
        itemId: document._id,
        itemTitle: `Document deleted: "${document.name}"`,
        details: document
      });
    } catch (e) {
      console.error("Failed to route document delete notification:", e);
    }

    return NextResponse.json({ success: true, message: "Document deleted successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
