import dbConnect from '@/lib/db';
import { Project } from '@/lib/models';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await dbConnect();
    const projects = await Project.find({});
    return NextResponse.json({ success: true, data: projects });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { actor, ...projectData } = body;
    const project = await Project.create(projectData);

    try {
      const { routeActionNotification } = require('@/lib/notificationRouter');
      await routeActionNotification({
        actor: actor || 'User',
        actionType: 'create',
        module: 'project',
        projectId: project._id,
        itemId: project._id,
        itemTitle: `Project profile initialized: "${project.name}"`,
        details: project
      });
    } catch (e) {
      console.error("Failed to route project create notification:", e);
    }

    return NextResponse.json({ success: true, data: project });
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
      return NextResponse.json({ success: false, error: "Project ID is required for delete" }, { status: 400 });
    }
    
    const project = await Project.findById(id);
    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }

    await Project.findByIdAndDelete(id);

    try {
      const { routeActionNotification } = require('@/lib/notificationRouter');
      await routeActionNotification({
        actor: actor,
        actionType: 'delete',
        module: 'project',
        projectId: project._id,
        itemId: project._id,
        itemTitle: `Project profile deleted: "${project.name}"`,
        details: project
      });
    } catch (e) {
      console.error("Failed to route project delete notification:", e);
    }
    
    return NextResponse.json({ success: true, data: project });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
