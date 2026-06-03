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
    const transaction = await Transaction.create(body);
    const populated = await Transaction.findById(transaction._id).populate('projectId');
    return NextResponse.json({ success: true, data: populated });
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
      return NextResponse.json({ success: false, error: "Transaction ID (_id) is required" }, { status: 400 });
    }
    
    const transaction = await Transaction.findByIdAndUpdate(_id, updateData, { new: true })
      .populate('projectId');
      
    if (!transaction) {
      return NextResponse.json({ success: false, error: "Transaction not found" }, { status: 404 });
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
    
    if (!id) {
      return NextResponse.json({ success: false, error: "Transaction ID is required" }, { status: 400 });
    }
    
    await Transaction.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Transaction deleted successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
