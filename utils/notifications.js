import Notification from "../models/Notification.js";
import { io, onlineUsers } from "../server.js";

export async function notifyUser(userId, message) {
  // Save in DB
  const notif = await Notification.create({
    user: userId,
    message,
    createdAt: new Date(),
    read: false,
  });

  // Send via socket if online
  const socketId = onlineUsers.get(userId.toString());
  if (socketId) {
    io.to(socketId).emit("notification", notif);
  }

  return notif;
}
