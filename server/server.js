import { app } from "./app.js";
import dotenv from "dotenv";
import { connection } from "./database/connection.js";
import cron from "node-cron"; // Import cron for scheduling
import { updatePostStatus } from "./utils/updatePostStatus.js"; // Import the function
import http from "http"; // Import http module
import { Server } from "socket.io"; // Import Socket.IO
import { redis } from "./app.js";

// Load environment variables
dotenv.config();
const start = performance.now();
redis.ping()
  .then((pong) => console.log(`Redis ping: ${pong}, Time: ${(performance.now() - start).toFixed(2)}ms`))
  .catch((err) => console.error("Redis ping error:", err));
// Connect to the database
connection()
  .then(() => {
    console.log("DATABASE CONNECTION ESTABLISHED");
  })
  .catch((e) => {
    console.error("DATABASE CONNECTION FAILED:", e);
  });


console.log("Setting up cron job...");
cron.schedule("*/30 * * * *", async () => {
  const now = new Date().toISOString();
  console.log(`Cron job triggered at ${now}`);
  try {
    console.log("Executing updatePostStatus...");
    await updatePostStatus();
    console.log("updatePostStatus completed successfully.");
  } catch (error) {
    console.error("Error in updatePostStatus:", error.message);
    console.error("Stack trace:", error.stack);
  }
}, {
  timezone: "UTC" // Explicitly set timezone to avoid discrepancies
});


// Optional: Uncomment to revert to daily midnight schedule after testing
/*
cron.schedule("0 0 * * *", async () => {
  const now = new Date().toISOString();
  console.log(`Cron job triggered at ${now}`);
  try {
    console.log("Executing updatePostStatus...");
    await updatePostStatus();
    console.log("updatePostStatus completed successfully.");
  } catch (error) {
    console.error("Error in updatePostStatus:", error.message);
    console.error("Stack trace:", error.stack);
  }
}, {
  timezone: "UTC"
});
*/

// Create an HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: `${process.env.FRONTEND_URL}`, 
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD", "TRACE", "CONNECT"],
    credentials: true,
  },
});

// Track active users
let activeUsers = [];

// Handle Socket.IO connections
io.on("connection", (socket) => {
  // Add new user to activeUsers
  socket.on("new-user-add", (newUserId) => {
    if (!activeUsers.some((user) => user.userId === newUserId)) {
      activeUsers.push({ userId: newUserId, socketId: socket.id });
    }
    io.emit("get-users", activeUsers);
  });

  // Handle joining a group
  socket.on("join-group", (chatId) => {
    socket.join(chatId);
  });

  // Handle sending a group message
  socket.on("send-group-message", (data) => {
    const { chatId, message } = data;
    io.to(chatId).emit("receive-group-message", message);
  });

  // Handle user disconnection
  socket.on("disconnect", () => {
    activeUsers = activeUsers.filter((user) => user.socketId !== socket.id);
    io.emit("get-users", activeUsers);
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("SERVER IS RUNNING ON PORT ", PORT);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err.message);
  console.error("Stack trace:", err.stack);
  console.log("SHUTTING DOWN THE SERVER!!!");
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:", err.message);
  console.error("Stack trace:", err.stack);
  console.log("SHUTTING DOWN THE SERVER!!!");
  server.close(() => {
    process.exit(1);
  });
});