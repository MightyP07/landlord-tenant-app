import cron from "node-cron";
import User from "../models/User.js";
import { sendPushToUser } from "../utils/pushSender.js";

export async function sendRentReminders() {
  const now = new Date();
  const tenants = await User.find({ role: "tenant", "pendingRent.amount": { $exists: true } });

  for (const t of tenants) {
    // throttle: once per 24h
    if (t.lastReminderAt && (now - t.lastReminderAt) < 24 * 60 * 60 * 1000) continue;

    const payload = {
      title: "⚠️ Rent reminder",
      body: `Your rent of ₦${t.pendingRent.amount} is due. Tap to pay.`,
      url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/pay-rent`,
      icon: "/icons/192.png"
    };

    try {
      await sendPushToUser(t, payload);
      t.lastReminderAt = now;
      await t.save();
    } catch (err) {
      console.error("Error sending rent reminder to", t._id, err);
    }
  }
}

// Schedule daily at 09:00 server time
export function scheduleRentReminders() {
  cron.schedule("0 9 * * *", () => {
    console.log("Running scheduled rent reminders");
    sendRentReminders().catch(console.error);
  });
}
