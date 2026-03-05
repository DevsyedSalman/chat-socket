import ScrollToBottom from "react-scroll-to-bottom"
import Message from "../Message"
import "../Messages/Messages.css"

const Messages = ({ messages, name, messagesEndRef }) => (
  <ScrollToBottom className="messages">
    {messages.map((message, index) => (
      <div key={message.id || index} ref={index === messages.length - 1 ? messagesEndRef : null}>
        <Message message={message} name={name} />
      </div>
    ))}
  </ScrollToBottom>
)

export default Messages
