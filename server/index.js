import 'dotenv/config.js';

import { auth } from './firebase.js';
import http from 'http';
import express from 'express';
import { Server as socketio } from 'socket.io';
import cors from 'cors';
import { addUser, removeUser, getUser, getUsersInRoom } from './users.js';
import router from './router.js';

// // Check if Firebase is connected
// const checkFirebaseConnection = async () => {
//   try {
//     if (auth && auth.app) {
//       console.log("✓ Firebase is connected successfully!");
//       console.log(`✓ Project ID: ${auth.app.options.projectId}`);
//       return true;
//     } else {
//       console.warn("✗ Firebase connection failed - auth not initialized");
//       return false;
//     }
//   } catch (error) {
//     console.error("✗ Firebase connection error:", error.message);
//     return false;
//   }
// };

// Initialize Firebase connection check
// checkFirebaseConnection();

const app = express()
const server = http.createServer(app)
const io = new socketio(server, {
  cors: {
    origin: "http://localhost:5173", // Update to match your frontend origin
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
})

app.use(
  cors({
    origin: "http://localhost:5173", // Update to match your frontend origin
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  }),
)

app.use(router)

const messages = {} // Initialize an object to store messages
const typingUsers = {} // Track users who are typing
const messageStatus = {} // Track message seen status

io.on("connection", (socket) => {
  console.log("New connection")

  socket.on("join", ({ name, room, photoURL }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room, photoURL })

    if (error) return callback(error)

    socket.join(user.room)

    // Initialize typing users for this room if not exists
    if (!typingUsers[user.room]) {
      typingUsers[user.room] = []
    }

    // Initialize message status for this room if not exists
    if (!messageStatus[user.room]) {
      messageStatus[user.room] = {}
    }

    // Send welcome message
    socket.emit("message", {
      user: "admin",
      text: `${user.name}, welcome to room ${user.room}.`,
      photoURL: user.photoURL,
    })
    socket.broadcast
      .to(user.room)
      .emit("message", { user: "admin", text: `${user.name} has joined!`, photoURL: user.photoURL })

    // Send room data to update users list
    io.to(user.room).emit("roomData", { room: user.room, users: getUsersInRoom(user.room) })

    // Send chat history to the user who joined
    if (messages[user.room]) {
      socket.emit("chatHistory", messages[user.room])
    }

    callback()
  })

  socket.on("sendMessage", (message, callback) => {
    const user = getUser(socket.id)

    if (!user) return callback("User not found")

    // Create message object with ID and seen status
    const messageObj = {
      id: Date.now().toString(),
      user: user.name,
      text: message,
      photoURL: user.photoURL,
      timestamp: new Date(),
      seen: {}, // Will track which users have seen this message
      seenBy: [], // Array of names who have seen the message
    }

    // Initialize seen status for all users in room as false
    const usersInRoom = getUsersInRoom(user.room)
    usersInRoom.forEach((roomUser) => {
      if (roomUser.id !== socket.id) {
        // Other users haven't seen the message yet
        messageObj.seen[roomUser.id] = false
      } else {
        // Sender has seen their own message
        messageObj.seen[roomUser.id] = true
        messageObj.seenBy.push(roomUser.name) // Add sender to seenBy list
      }
    })

    // Add message to history
    if (!messages[user.room]) {
      messages[user.room] = []
    }
    messages[user.room].push(messageObj)

    // Remove user from typing list when they send a message
    typingUsers[user.room] = typingUsers[user.room].filter((id) => id !== socket.id)
    io.to(user.room).emit(
      "typingUsers",
      typingUsers[user.room].map((id) => getUser(id)?.name),
    )

    // Broadcast message to room
    io.to(user.room).emit("message", messageObj)

    callback()
  })

  // Handle typing event
  socket.on("typing", () => {
    const user = getUser(socket.id)
    if (!user) return

    // Add user to typing list if not already there
    if (!typingUsers[user.room].includes(socket.id)) {
      typingUsers[user.room].push(socket.id)
      io.to(user.room).emit(
        "typingUsers",
        typingUsers[user.room].map((id) => getUser(id)?.name),
      )
    }
  })

  // Handle stop typing event
  socket.on("stopTyping", () => {
    const user = getUser(socket.id)
    if (!user) return

    // Remove user from typing list
    typingUsers[user.room] = typingUsers[user.room].filter((id) => id !== socket.id)
    io.to(user.room).emit(
      "typingUsers",
      typingUsers[user.room].map((id) => getUser(id)?.name),
    )
  })

  // Handle message seen event
  socket.on("messageSeen", (messageId) => {
    const user = getUser(socket.id)
    if (!user || !messages[user.room]) return

    // Find the message and mark it as seen by this user
    const message = messages[user.room].find((msg) => msg.id === messageId)
    if (message && !message.seen[socket.id]) {
      message.seen[socket.id] = true

      // Update the seenBy array with user names who have seen the message
      message.seenBy = Object.entries(message.seen)
        .filter(([_, seen]) => seen)
        .map(([id, _]) => {
          const seenUser = getUser(id)
          return seenUser ? seenUser.name : null
        })
        .filter(Boolean) // Remove null values

      // Emit updated message status to all users in the room
      io.to(user.room).emit("messageStatus", {
        messageId,
        seenBy: message.seenBy,
      })
    }
  })

  socket.on("disconnect", () => {
    const user = removeUser(socket.id)

    if (user) {
      // Remove user from typing list
      if (typingUsers[user.room]) {
        typingUsers[user.room] = typingUsers[user.room].filter((id) => id !== socket.id)
        io.to(user.room).emit(
          "typingUsers",
          typingUsers[user.room].map((id) => getUser(id)?.name),
        )
      }

      io.to(user.room).emit("message", { user: "admin", text: `${user.name} has left.` })
      io.to(user.room).emit("roomData", { room: user.room, users: getUsersInRoom(user.room) })
    }
  })
})

// Endpoint to retrieve chat history for a room
app.get("/chatHistory", (req, res) => {
  const room = req.query.room
  res.send(messages[room] || [])
  console.log(messages)
})

const PORT = process.env.PORT || 8000
server.listen(PORT, () => {
  console.log(`\n✓ Server has started on port ${PORT}`);
  console.log(`✓ WebSocket server ready for connections`);
  console.log(`✓ All systems operational!\n`);
})
