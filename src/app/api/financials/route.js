import dbConnect from '@/lib/db';
import { Transaction } from '@/lib/models';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    
    const query = projectId ? { projectId } : {};
    const transactions = await Transaction.find(query)
      .populate('projectId')
      .sort({ date: -1 });
      
    return NextResponse.json({ success: true, data: transactions });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { actor, ...transactionData } = body;
    const transaction = await Transaction.create(transactionData);
    const populated = await Transaction.findById(transaction._id).populate('projectId');

    try {
      const { routeActionNotification } = require('@/lib/notificationRouter');
      await routeActionNotification({
        actor: actor || 'User',
        actionType: 'create',
        module: 'finance',
        projectId: transaction.projectId,
        itemId: transaction._id,
        itemTitle: `${transaction.type === 'revenue' ? 'Revenue' : 'Expense'} logged: "${transaction.description}" (${transaction.amount} AED)`,
        details: transaction
      });
    } catch (e) {
      console.error("Failed to route financial create notification:", e);
    }

    return NextResponse.json({ success: true, data: populated });
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
      return NextResponse.json({ success: false, error: "Transaction ID (_id) is required" }, { status: 400 });
    }
    
    const transaction = await Transaction.findByIdAndUpdate(_id, updateData, { new: true })
      .populate('projectId');
      
    if (!transaction) {
      return NextResponse.json({ success: false, error: "Transaction not found" }, { status: 404 });
    }

    try {
      const { routeActionNotification } = require('@/lib/notificationRouter');
      await routeActionNotification({
        actor: actor || 'User',
        actionType: 'update',
        module: 'finance',
        projectId: transaction.projectId,
        itemId: transaction._id,
        itemTitle: `${transaction.type === 'revenue' ? 'Revenue' : 'Expense'} updated: "${transaction.description}" (${transaction.amount} AED)`,
        details: transaction
      });
    } catch (e) {
      console.error("Failed to route financial update notification:", e);
    }
    
    return NextResponse.json({ success: true, data: transaction });
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
      return NextResponse.json({ success: false, error: "Transaction ID is required" }, { status: 400 });
    }
    
    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return NextResponse.json({ success: false, error: "Transaction not found" }, { status: 404 });
    }

    await Transaction.findByIdAndDelete(id);

    try {
      const { routeActionNotification } = require('@/lib/notificationRouter');
      await routeActionNotification({
        actor: actor,
        actionType: 'delete',
        module: 'finance',
        projectId: transaction.projectId,
        itemId: transaction._id,
        itemTitle: `${transaction.type === 'revenue' ? 'Revenue' : 'Expense'} deleted: "${transaction.description}"`,
        details: transaction
      });
    } catch (e) {
      console.error("Failed to route financial delete notification:", e);
    }

    return NextResponse.json({ success: true, message: "Transaction deleted successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
