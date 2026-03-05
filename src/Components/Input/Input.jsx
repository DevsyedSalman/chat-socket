"use client"
import "./Input.css"

const Input = ({ setMessage, sendMessage, message }) => {
  const handleChange = ({ target: { value } }) => {
    setMessage(value)
  }

  const handleKeyPress = (event) => {
    if (event.key === "Enter") {
      sendMessage(event)
    }
  }

  return (
    <form className="form">
      <input
        className="input"
        type="text"
        placeholder="Type a message..."
        value={message}
        onChange={handleChange}
        onKeyPress={handleKeyPress}
      />
      <button className="sendButton" onClick={(e) => sendMessage(e)}>
        Send
      </button>
    </form>
  )
}

export default Input
