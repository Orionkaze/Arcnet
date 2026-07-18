import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import { createClient } from "redis";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

app.use(express.json());

const apiRouter = express.Router();

apiRouter.get("/health", (req, res) => {
  res.status(200).json({ status: "Backend is running!" });
});

apiRouter.post("/api/broadcast", (req, res) => {
  const { channelId, message } = req.body;
  if (channelId && message) {
    io.to(channelId).emit("new_message", message);
    res.status(200).json({ status: "Broadcasted successfully" });
  } else {
    res.status(400).json({ error: "Missing channelId or message" });
  }
});

apiRouter.post("/api/broadcast-dm", (req, res) => {
  const { toUserId, message } = req.body;
  if (toUserId && message) {
    io.to(`user_${toUserId}`).emit("new_dm", message);
    res.status(200).json({ status: "Broadcasted successfully" });
  } else {
    res.status(400).json({ error: "Missing toUserId or message" });
  }
});

apiRouter.post("/api/broadcast-pin", (req, res) => {
  const { channelId, pinnedMessage } = req.body;
  if (channelId) {
    io.to(channelId).emit("pin_updated", pinnedMessage ?? null);
    res.status(200).json({ status: "Broadcasted successfully" });
  } else {
    res.status(400).json({ error: "Missing channelId" });
  }
});

// Mount router under root and sub-route for Firebase compatibility
app.use("/", apiRouter);
app.use("/_/backend", apiRouter);

// Redis setup for Pub/Sub
const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 2) {
        // Stop retrying after 2 attempts to avoid flooding logs
        return false;
      }
      return 1000; // retry after 1s
    }
  }
});

redisClient.on("error", (err) => {
  // Only log if connection was actually established once, or let the start function handle initial failure
});

async function startRedis() {
  try {
    await redisClient.connect();
    
    // Subscribe to channel
    await redisClient.subscribe("chat_messages", (messageStr) => {
      try {
        const data = JSON.parse(messageStr);
        if (data.channelId && data.message) {
          io.to(data.channelId).emit("new_message", data.message);
        }
      } catch(err) {
        console.error("Error parsing redis message", err);
      }
    });
    console.log("Connected to Redis successfully.");
  } catch (err) {
    console.log("Could not connect to Redis. Local fallback mode enabled.");
  }
}
startRedis();

// Socket state tracking
const userSockets = new Map<string, string>(); // socketId -> userId
const hubUsers = new Map<string, Set<string>>(); // hubId -> Set<userId>

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // When a user identifies themselves
  socket.on("identify", ({ userId }) => {
    userSockets.set(socket.id, userId);
    // Join a personal room so this user can receive direct messages.
    socket.join(`user_${userId}`);
  });
  
  // Join a specific chat channel to receive messages
  socket.on("join_channel", (channelId) => {
    socket.join(channelId);
  });

  socket.on("leave_channel", (channelId) => {
    socket.leave(channelId);
  });

  // Join a hub to receive and broadcast online status
  socket.on("join_hub", (hubId) => {
    socket.join(`hub_${hubId}`);
    const userId = userSockets.get(socket.id);
    if (userId) {
      if (!hubUsers.has(hubId)) {
        hubUsers.set(hubId, new Set());
      }
      hubUsers.get(hubId)!.add(userId);
      // Broadcast online status to others in the hub
      io.to(`hub_${hubId}`).emit("user_online", userId);
      // Send the current list of online users to the joining user
      socket.emit("online_users", Array.from(hubUsers.get(hubId)!));
    }
  });

  socket.on("leave_hub", (hubId) => {
    socket.leave(`hub_${hubId}`);
    const userId = userSockets.get(socket.id);
    if (userId && hubUsers.has(hubId)) {
      hubUsers.get(hubId)!.delete(userId);
      io.to(`hub_${hubId}`).emit("user_offline", userId);
    }
  });

  // Typing indicators
  socket.on("typing", ({ channelId, userId, username }) => {
    socket.to(channelId).emit("user_typing", { userId, username });
  });

  socket.on("stop_typing", ({ channelId, userId, username }) => {
    socket.to(channelId).emit("user_stop_typing", { userId, username });
  });

  socket.on("disconnect", () => {
    const userId = userSockets.get(socket.id);
    if (userId) {
      // Remove user from all hubs they were in
      hubUsers.forEach((users, hubId) => {
        if (users.has(userId)) {
          users.delete(userId);
          io.to(`hub_${hubId}`).emit("user_offline", userId);
        }
      });
      userSockets.delete(socket.id);
    }
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5001;

server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
