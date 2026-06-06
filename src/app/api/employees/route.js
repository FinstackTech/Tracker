import dbConnect from '@/lib/db';
import { Employee } from '@/lib/models';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await dbConnect();
    let employees = await Employee.find({}).sort({ name: 1 });
    
    // Auto-seed a default Superadmin profile if the collection is empty
    if (employees.length === 0) {
      const defaultAdmin = await Employee.create({
        name: 'Superadmin',
        role: 'Admin',
        email: 'superadmin@company.com',
        password: 'admin',
        team: 'Operations',
        status: 'Active'
      });
      employees = [defaultAdmin];
    }
    
    return NextResponse.json({ success: true, data: employees });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const employee = await Employee.create(body);
    return NextResponse.json({ success: true, data: employee });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PUT(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { _id, ...updateData } = body;
    
    if (!_id && body.name) {
      // Find by name if _id is not present (e.g. from mobile request)
      const employee = await Employee.findOneAndUpdate({ name: body.name }, updateData, { new: true });
      return NextResponse.json({ success: true, data: employee });
    }
    
    if (!_id) {
      return NextResponse.json({ success: false, error: "Employee ID (_id) or name is required for update" }, { status: 400 });
    }
    
    const employee = await Employee.findByIdAndUpdate(_id, updateData, { new: true });
    return NextResponse.json({ success: true, data: employee });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const name = searchParams.get('name');
    
    if (!id && !name) {
      return NextResponse.json({ success: false, error: "Employee ID or name is required for delete" }, { status: 400 });
    }
    
    let employee;
    if (id) {
      employee = await Employee.findByIdAndDelete(id);
    } else {
      employee = await Employee.findOneAndDelete({ name: name });
    }
    
    if (!employee) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: employee });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
