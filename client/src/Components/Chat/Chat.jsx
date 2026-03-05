"use client"

import { useState, useEffect, useRef } from "react"
import queryString from "query-string"
import { useLocation } from "react-router-dom"
import io from "socket.io-client"
import "./Chat.css"
import InfoBar from "../InfoBar/InfoBar"
import axios from "axios"
import Input from "../Input/Input"
import Messages from "../Message/Messages/Messages"
import TextContainer from "../TextContainer/TextContainer"

let socket

const Chat = () => {
  const [name, setName] = useState("")
  const [room, setRoom] = useState("")
  const [photoURL, setPhotoURL] = useState("")
  const [users, setUsers] = useState([])
  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState("")
  const [typingUsers, setTypingUsers] = useState([])
  const ENDPOINT = "http://localhost:8000"

  const messagesEndRef = useRef(null)

  const location = useLocation()

  useEffect(() => {
    const { name, room, photoURL } = queryString.parse(location.search)
    const fetchChatHistory = async () => {
      try {
        const response = await axios.get(`${ENDPOINT}/chatHistory`, {
          params: { room },
        })
        setMessages(response.data)
      } catch (error) {
        console.error("Error fetching chat history:", error)
      }
    }
    socket = io(ENDPOINT)

    socket.on("chatHistory", (messages) => {
      setMessages(messages)
    })

    setName(name)
    setRoom(room)
    // setPhotoURL(decodeURIComponent(photoURL));
    fetchChatHistory()
    socket.emit("join", { name, room, photoURL: photoURL }, (error) => {
      console.log(`Chat photo URL: ${photoURL}`)
      if (error) {
        alert(error)
      }
    })

    return () => {
      socket.disconnect()
      socket.off()
    }
  }, [ENDPOINT, location.search])

  useEffect(() => {
    socket.on("message", (message) => {
      setMessages((messages) => [...messages, message])
    })

    socket.on("roomData", ({ users }) => {
      setUsers(users)
    })

    socket.on("typingUsers", (users) => {
      setTypingUsers(users)
    })

    socket.on("messageStatus", ({ messageId, seenBy }) => {
      setMessages((prevMessages) => prevMessages.map((msg) => (msg.id === messageId ? { ...msg, seenBy } : msg)))
    })

    return () => {
      socket.off("message")
      socket.off("roomData")
      socket.off("typingUsers")
      socket.off("messageStatus")
    }
  }, [])

  // Mark messages as seen when they come into view
  useEffect(() => {
    if (messages.length > 0) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.target.dataset.messageId) {
              // Only emit messageSeen if the message is actually visible
              socket.emit("messageSeen", entry.target.dataset.messageId)
            }
          })
        },
        { threshold: 0.5 },
      )

      // Wait for DOM to update before observing
      setTimeout(() => {
        const messageElements = document.querySelectorAll(".message-item")
        messageElements.forEach((el) => {
          if (el.dataset.messageId) {
            observer.observe(el)
          }
        })
      }, 100)

      return () => {
        observer.disconnect()
      }
    }
  }, [messages])

  const sendMessage = (event) => {
    event.preventDefault()

    if (message) {
      socket.emit("sendMessage", message, () => {
        setMessage("")
        // Stop typing when message is sent
        socket.emit("stopTyping")
      })
    }
  }

  const handleTyping = (value) => {
    setMessage(value)

    if (value && value.length > 0) {
      socket.emit("typing")
    } else {
      socket.emit("stopTyping")
    }
  }

  return (
    <div className="outerContainer">
      <div className="container">
        <InfoBar room={room} />
        <Messages messages={messages} name={name} messagesEndRef={messagesEndRef} />
        {typingUsers.length > 0 && (
          <div className="typingIndicator">
            {typingUsers.length === 1 ? `${typingUsers[0]} is typing...` : `${typingUsers.join(", ")} are typing...`}
          </div>
        )}
        <Input message={message} setMessage={handleTyping} sendMessage={sendMessage} />
      </div>
      <TextContainer users={users} />
    </div>
  )
}

export default Chat
