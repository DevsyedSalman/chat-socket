import "./Message.css"

const Message = ({ message, name }) => {
  const trimmedName = name.trim().toLowerCase()
  const isSentByCurrentUser = message.user === trimmedName

  const showSeenStatus =
    isSentByCurrentUser &&
    message.seenBy &&
    message.seenBy.length > 0 &&
    message.seenBy.some((user) => user !== trimmedName)

  const otherUsersSeen = message.seenBy ? message.seenBy.filter((user) => user !== trimmedName) : []

  const getInitials = (userName) => {
    return userName
      .split(" ")
      .map((word) => word[0]?.toUpperCase())
      .join("")
  }

  return isSentByCurrentUser ? (
    <div className="messageContainer justifyEnd message-item" data-message-id={message.id}>
      <p className="sentText pr-10">{trimmedName}</p>
      <div className="messageBox backgroundBlue">
        <p className="messageText colorWhite">{message.text}</p>
        {showSeenStatus && otherUsersSeen.length > 0 && (
          <div className="seenStatus">Seen by {otherUsersSeen.join(", ")}</div>
        )}
      </div>
    </div>
  ) : (
    <div className="messageContainer justifyStart message-item" data-message-id={message.id}>
      {message.photoURL ? (
        <img className="avatarImage" src={message.photoURL} alt="Profile" />
      ) : (
        <div className="avatarFallback">{getInitials(message.user)}</div>
      )}
      <div className="messageBox backgroundLight">
        <p className="messageText colorDark">{message.text}</p>
      </div>
      <p className="sentText pl-10">{message.user}</p>
    </div>
  )
}

export default Message
