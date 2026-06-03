import dbConnect from '@/lib/db';
import { Integration } from '@/lib/models';
import { NextResponse } from 'next/server';
import { dispatchAlert } from '@/lib/integrations';

export async function GET() {
  try {
    await dbConnect();
    let settings = await Integration.findOne({});
    if (!settings) {
      // Create default empty settings document
      settings = await Integration.create({});
    }
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    
    // Check if settings document already exists
    let settings = await Integration.findOne({});
    if (settings) {
      settings = await Integration.findByIdAndUpdate(settings._id, body, { new: true });
    } else {
      settings = await Integration.create(body);
    }
    
    // Check if test payload is requested
    if (body.testDispatch) {
      await dispatchAlert({
        title: "INTEGRATION DIAGNOSTIC TEST 🛠️",
        message: "This is a diagnostic trigger dispatched from the PPM Settings Hub. Webhooks are functional!",
        details: {
          "Dispatched By": body.actor || "PPM System Admin",
          "MS Teams Integration": body.msTeamsUrl ? "Connected ✅" : "Not Linked ❌",
          "Slack Integration": body.slackUrl ? "Connected ✅" : "Not Linked ❌",
          "Discord Integration": body.discordUrl ? "Connected ✅" : "Not Linked ❌",
          "Telegram Bot Chat": body.telegramToken ? "Connected ✅" : "Not Linked ❌",
          "WhatsApp Channel": body.whatsAppToken ? "Connected ✅" : "Not Linked ❌",
          "Custom Webhook": body.customWebhookUrl ? "Connected ✅" : "Not Linked ❌",
          "Timestamp": new Date().toISOString()
        }
      });
    }

    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
