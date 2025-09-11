import webpush from "./webpush.js"; // this exports default webpush as well as initWebPush
import User from "../models/User.js";

export async function sendPushToSubscription(subscription, payload) {
  try {
    // subscription is the raw object stored in DB
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return true;
  } catch (err) {
    // bubble up
    throw err;
  }
}

export async function sendPushToUser(user, payload) {
  const subs = user.pushSubscriptions || [];
  for (const s of subs) {
    try {
      await sendPushToSubscription(s, payload);
    } catch (err) {
      const status = err?.statusCode || err?.status;
      // remove stale subscription
      if (status === 410 || status === 404) {
        await User.updateOne({ _id: user._id }, { $pull: { pushSubscriptions: { endpoint: s.endpoint } } });
      } else {
        console.error("push error for user", user._id, err);
      }
    }
  }
}
