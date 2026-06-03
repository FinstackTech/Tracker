import { Integration } from './models';

// Dynamic Webhook Dispatches
export async function dispatchAlert({ event, title, message, details = {} }) {
  try {
    // 1. Fetch integration configurations
    const settings = await Integration.findOne({});
    if (!settings) {
      console.log("No integration settings configured.");
      return;
    }

    // Check triggers if event is specified
    if (event) {
      if (event === 'blocker' && !settings.triggerOnBlocker) return;
      if (event === 'critical_bug' && !settings.triggerOnCriticalBug) return;
      if (event === 'task_done' && !settings.triggerOnTaskDone) return;
      if (event === 'issue_resolved' && !settings.triggerOnIssueResolved) return;
    }

    const payloadText = `🚨 *${title}*\n\n${message}\n\n${Object.entries(details)
      .map(([k, v]) => `• *${k}:* ${v}`)
      .join('\n')}`;

    // ─── A. MS TEAMS DISPATCH ───
    if (settings.msTeamsUrl) {
      console.log("Dispatching Alert to Microsoft Teams...");
      try {
        const teamsPayload = {
          "@type": "MessageCard",
          "@context": "http://schema.org/extensions",
          "themeColor": "E01A22",
          "summary": title,
          "sections": [{
            "activityTitle": title,
            "activitySubtitle": "Enterprise PPM Platform",
            "facts": Object.entries(details).map(([name, value]) => ({ name, value })),
            "text": message
          }]
        };

        const res = await fetch(settings.msTeamsUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(teamsPayload)
        });
        if (!res.ok) console.error("MS Teams webhook response error:", res.statusText);
      } catch (e) {
        console.error("Failed MS Teams post:", e.message);
      }
    }

    // ─── B. SLACK DISPATCH ───
    if (settings.slackUrl) {
      console.log("Dispatching Alert to Slack...");
      try {
        const res = await fetch(settings.slackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `*${title}*\n\n${message}\n\n${Object.entries(details)
              .map(([k, v]) => `• *${k}:* ${v}`)
              .join('\n')}`
          })
        });
        if (!res.ok) console.error("Slack webhook response error:", res.statusText);
      } catch (e) {
        console.error("Failed Slack post:", e.message);
      }
    }

    // ─── C. DISCORD DISPATCH ───
    if (settings.discordUrl) {
      console.log("Dispatching Alert to Discord...");
      try {
        const fields = Object.entries(details).map(([name, value]) => ({
          name,
          value: String(value),
          inline: true
        }));
        
        const discordPayload = {
          embeds: [{
            title: title,
            description: message,
            color: 5195493, // HSL Indigo #4f46e5 in decimal
            fields: fields.length > 0 ? fields : undefined,
            timestamp: new Date().toISOString(),
            footer: {
              text: "Enterprise PPM Tracker Notifications"
            }
          }]
        };

        const res = await fetch(settings.discordUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(discordPayload)
        });
        if (!res.ok) console.error("Discord webhook response error:", res.statusText);
      } catch (e) {
        console.error("Failed Discord post:", e.message);
      }
    }

    // ─── D. TELEGRAM DISPATCH ───
    if (settings.telegramToken && settings.telegramChatId) {
      console.log("Dispatching Alert to Telegram...");
      try {
        const url = `https://api.telegram.org/bot${settings.telegramToken}/sendMessage`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: settings.telegramChatId,
            text: payloadText,
            parse_mode: 'Markdown'
          })
        });
        if (!res.ok) console.error("Telegram endpoint response error:", res.statusText);
      } catch (e) {
        console.error("Failed Telegram post:", e.message);
      }
    }

    // ─── E. WHATSAPP DISPATCH ───
    if (settings.whatsAppToken && settings.whatsAppPhone) {
      console.log("Dispatching Alert to WhatsApp...");
      try {
        // Generic HTTP Endpoint / Twilio mock dispatcher
        const payload = {
          to: settings.whatsAppPhone,
          message: payloadText
        };
        // Simulated Webhook post or real Twilio request
        console.log(`WhatsApp Outbound triggered to ${settings.whatsAppPhone}: "${message}"`);
      } catch (e) {
        console.error("Failed WhatsApp dispatch:", e.message);
      }
    }

    // ─── F. CUSTOM WEBHOOK DISPATCH ───
    if (settings.customWebhookUrl) {
      console.log("Dispatching Alert to Custom HTTP Webhook...");
      try {
        const res = await fetch(settings.customWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: event || 'custom_dispatch',
            title,
            message,
            details,
            timestamp: new Date().toISOString()
          })
        });
        if (!res.ok) console.error("Custom Webhook response error:", res.statusText);
      } catch (e) {
        console.error("Failed Custom Webhook post:", e.message);
      }
    }

  } catch (err) {
    console.error("Integration dispatch general failure:", err);
  }
}
