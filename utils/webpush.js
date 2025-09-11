import webpush from "web-push";

export function initWebPush() {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.warn("WebPush VAPID keys not set (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY).");
    return;
  }
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@https://renteaseone.vercel.app.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export default webpush;