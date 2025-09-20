import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./DiscussionsPage.css";
import { useSelector } from "react-redux";
import { formatDate } from "../utils/formatDate.jsx";
import { renderIcon } from "../utils/renderIcon.jsx";
import { io } from "socket.io-client";
import EmojiPicker from "emoji-picker-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../components/ThemeProvider.jsx";
function DiscussionsPage() {
  const { theme } = useTheme();
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isChannelsOpen, setIsChannelsOpen] = useState(false);
  const [channels, setChannels] = useState([]);
  const [isLoadingChannels, setIsLoadingChannels] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMembersPopup, setShowMembersPopup] = useState(false);
  const [currentGroupMembers, setCurrentGroupMembers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const navigate = useNavigate();
  const { userData, token } = useSelector((state) => state.user);
  const api = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_BASEURL,
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token?.trim() || ""}`,
    },
  });

  // Initialize Socket.IO client
  const socket = useRef(null);

  const handleShowMembers = (channel) => {
    if (channel && channel.members) {
      setCurrentGroupMembers(channel.members);
      setShowMembersPopup(true);
    }
  };

  useEffect(() => {
    // Connect to the Socket.IO server
    socket.current = io(`${import.meta.env.VITE_BACKEND_BASEURL}`, {
      withCredentials: true,
      auth: {
        token: `Bearer ${token?.trim() || ""}`,
      },
    });

    // Listen for new group messages
    socket.current.on("receive-group-message", (newMessage) => {
      setMessages((prevMessages) => {
        // Check if message already exists to prevent duplicates
        if (!prevMessages.some((msg) => msg._id === newMessage._id)) {
          return [...prevMessages, newMessage];
        }
        return prevMessages;
      });
    });

    // Listen for typing events
    socket.current.on("typing", ({ chatId, username }) => {
      if (activeChannel && activeChannel._id === chatId) {
        setIsTyping(true);

        // Clear previous timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        // Set new timeout
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
        }, 3000);
      }
    });

    // Cleanup on component unmount
    return () => {
      socket.current.disconnect();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [activeChannel]);

  useEffect(() => {
    if (userData?._id) {
      socket.current.emit("new-user-add", userData._id);
    }
  }, [userData]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle file selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      alert("You can only upload up to 5 files at once");
      return;
    }

    setSelectedFiles(files);

    // Create preview URLs for images
    const urls = files.map((file) => {
      if (file.type.startsWith("image/")) {
        return URL.createObjectURL(file);
      }
      return null;
    });
    setPreviewUrls(urls);
  };

  // Clear preview URLs when component unmounts
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [previewUrls]);

  // Remove a file from selection
  const removeFile = (index) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);

    const newUrls = [...previewUrls];
    if (newUrls[index]) URL.revokeObjectURL(newUrls[index]);
    newUrls.splice(index, 1);
    setPreviewUrls(newUrls);
  };

  // Fetch user chats on component mount
  useEffect(() => {
    const fetchUserChats = async () => {
      try {
        setIsLoadingChannels(true);
        const { data } = await api.get("/user/chats");
        await setChannels(data.chats);

        if (data.chats.length > 0) {
          setActiveChannel(data.chats[0]);
          fetchMessages(data.chats[0]._id);
        }
      } catch (error) {
        console.error("Error fetching user chats:", error);
      } finally {
        setIsLoadingChannels(false);
      }
    };

    fetchUserChats();
  }, []);

  // Fetch messages for a specific chat
  const fetchMessages = async (chatId) => {
    try {
      setIsLoadingMessages(true);
      const response = await api.get(`/message/all/${chatId}`);
      const sortedMessages = response.data.messages.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
      setMessages(sortedMessages);

      // Join the group room
      socket.current.emit("join-group", chatId);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Handle typing notification
  const handleTyping = () => {
    if (activeChannel) {
      socket.current.emit("typing", {
        chatId: activeChannel._id,
        username: userData.username,
      });
    }
  };

  // Send a new message with attachments
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedFiles.length && !activeChannel) return;

    try {
      const formData = new FormData();
      formData.append("chatId", activeChannel._id);
      // Always include content, even if empty
      formData.append("content", newMessage.trim() ? newMessage : "");

      // Append all selected files
      selectedFiles.forEach((file) => {
        formData.append("attachments", file);
      });

      const response = await api.post(`/message/send`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const newMessageWithSender = {
        ...response.data.newMessage,
        sender: userData,
      };

      socket.current.emit("send-group-message", {
        chatId: activeChannel._id,
        message: newMessageWithSender,
      });

      setMessages((prevMessages) => [...prevMessages, newMessageWithSender]);
      setNewMessage("");
      setSelectedFiles([]);
      setPreviewUrls([]);
      setShowEmojiPicker(false);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Toggle channels sidebar on mobile
  const toggleChannels = () => {
    setIsChannelsOpen(!isChannelsOpen);
  };

  // Filter channels based on search query
  const filteredChannels = channels.filter(
    (channel) =>
      channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      channel.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const onEmojiClick = (emojiData) => {
    setNewMessage((prev) => prev + emojiData.emoji);
  };

  // Render file preview or icon based on file type
  const renderAttachment = (attachment) => {
    if (attachment.fileType === "image") {
      return (
        <div className="attachment-image-container">
          <img
            src={attachment.url || "/placeholder.svg"}
            alt={attachment.fileName}
            className="attachment-image"
          />
        </div>
      );
    } else {
      return (
        <div className="attachment-file">
          <div className="attachment-icon">
            {attachment.fileType === "application" ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                <polyline points="13 2 13 9 20 9"></polyline>
              </svg>
            )}
          </div>
          <div className="attachment-name">{attachment.fileName}</div>
        </div>
      );
    }
  };

  return (
    <div className={`discussions-content ${theme}`}>
      {/* Animated background */}
      <div className="animated-background">
        <div className="cyber-grid"></div>
        <div className="glow-orb orb1"></div>
        <div className="glow-orb orb2"></div>
        <div className="glow-orb orb3"></div>
        <div className="particles-container">
          <div className="particles"></div>
        </div>
      </div>

      {/* Channels sidebar */}
      <div className={`discussions-channels ${isChannelsOpen ? "open" : ""}`}>
        <div className="discussions-channels-header">
          {/* <div className="discussions-search">
            <div className="discussions-search-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <input
              type="text"
              className="discussions-search-input"
              placeholder="Search channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div> */}

          {activeChannel && (
            <button
              className="view-members-button"
              onClick={() => handleShowMembers(activeChannel)}
              title="View group members"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <span>Members</span>
            </button>
          )}
        </div>

        <div className="discussions-channels-list">
          {isLoadingChannels ? (
            <div className="discussions-loader">
              <div className="quantum-spinner">
                <div className="quantum-spinner-ring"></div>
                <div className="quantum-spinner-ring"></div>
                <div className="quantum-spinner-ring"></div>
              </div>
              <span>Loading channels...</span>
            </div>
          ) : (
            filteredChannels.map((channel) => (
              <div
                key={channel._id}
                className={`discussions-channel ${
                  activeChannel?._id === channel._id ? "active" : ""
                }`}
                onClick={() => {
                  setActiveChannel(channel);
                  fetchMessages(channel._id);
                  setIsChannelsOpen(false);
                }}
              >
                <div className="discussions-channel-icon">
                  {renderIcon(channel.icon)}
                </div>
                <div className="discussions-channel-info">
                  <div className="discussions-channel-name">{channel.name}</div>
                  <div className="discussions-channel-description">
                    {channel.description}
                  </div>
                </div>
                {channel.unread > 0 && (
                  <div className="discussions-channel-badge">
                    {channel.unread}
                  </div>
                )}
                <div className="channel-hover-effect"></div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Mobile backdrop */}
      <div
        className={`discussions-backdrop ${isChannelsOpen ? "active" : ""}`}
        onClick={() => setIsChannelsOpen(false)}
      ></div>

      {/* Chat area */}
      <div className="discussions-chat">
        <div className="discussions-chat-header">
          <button
            className="discussions-channels-toggle"
            onClick={toggleChannels}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="4" y1="6" x2="20" y2="6"></line>
              <line x1="4" y1="12" x2="20" y2="12"></line>
              <line x1="4" y1="18" x2="20" y2="18"></line>
            </svg>
          </button>
          {activeChannel && (
            <div className="discussions-chat-info">
              <div className="discussions-chat-avatar">
                {renderIcon(activeChannel.icon)}
              </div>
              <div className="discussions-chat-details">
                <div className="discussions-chat-name">
                  {activeChannel.name}
                </div>
                <div className="discussions-chat-status">
                  <span className="status-dot"></span>
                  {activeChannel.members.length} members
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="discussions-messages" ref={messagesContainerRef}>
          {isLoadingMessages ? (
            <div className="discussions-loader">
              <div className="quantum-spinner">
                <div className="quantum-spinner-ring"></div>
                <div className="quantum-spinner-ring"></div>
                <div className="quantum-spinner-ring"></div>
              </div>
              <span>Loading messages...</span>
            </div>
          ) : !userData ? (
            <div className="discussions-loader">
              <div className="quantum-spinner">
                <div className="quantum-spinner-ring"></div>
                <div className="quantum-spinner-ring"></div>
                <div className="quantum-spinner-ring"></div>
              </div>
              <span>Loading user data...</span>
            </div>
          ) : (
            messages.map((message, index) => {
              const isCurrentUser = message.sender._id === userData._id;
              const uniqueKey = `${message._id}-${message.createdAt}`;
              const showAvatar =
                index === 0 ||
                messages[index - 1].sender._id !== message.sender._id;

              return (
                <div
                  key={uniqueKey}
                  className={`discussions-message ${
                    isCurrentUser ? "discussions-message-outgoing" : ""
                  } ${showAvatar ? "" : "no-avatar"}`}
                  style={{
                    animationDelay: `${index * 0.05}s`,
                  }}
                >
                  {showAvatar && (
                    <img
                      className="discussions-message-avatar"
                      src={message.sender.avatar || "/placeholder.svg"}
                      alt={message.sender.username}
                    />
                  )}
                  <div className="discussions-message-content">
                    <div className="discussions-message-bubble">
                      {showAvatar && (
                        <div className="discussions-message-author">
                          {message.sender.username}
                        </div>
                      )}
                      <div className="message-text">{message.content}</div>
                      {message.attachments &&
                        message.attachments.length > 0 && (
                          <div className="message-attachments">
                            {message.attachments.map((attachment, index) => (
                              <div key={index} className="message-attachment">
                                {renderAttachment(attachment)}
                              </div>
                            ))}
                          </div>
                        )}
                      <div className="holographic-effect"></div>
                    </div>
                    <div className="discussions-message-meta">
                      <div className="discussions-message-time">
                        {formatDate(message.createdAt)}
                      </div>
                      {isCurrentUser && (
                        <div
                          className={`discussions-message-status ${
                            message.read ? "read" : ""
                          }`}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          {isTyping && (
            <div className="typing-indicator">
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* File preview area */}
        {previewUrls.length > 0 && (
          <div className="file-previews">
            {previewUrls.map((url, index) => (
              <div key={index} className="file-preview">
                {url ? (
                  <>
                    <img
                      src={url || "/placeholder.svg"}
                      alt="Preview"
                      className="image-preview"
                    />
                    <button
                      className="remove-file-btn"
                      onClick={() => removeFile(index)}
                    >
                      ×
                    </button>
                  </>
                ) : (
                  <div className="file-preview-info">
                    <span>{selectedFiles[index].name}</span>
                    <button
                      className="remove-file-btn"
                      onClick={() => removeFile(index)}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <form className="discussions-input" onSubmit={handleSendMessage}>
          <div className="discussions-input-container">
            <div className="discussions-input-actions">
              <button
                type="button"
                className="discussions-input-button"
                onClick={() => fileInputRef.current.click()}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                  multiple
                  accept="image/*, application/pdf, .doc, .docx"
                />
              </button>
              <button
                type="button"
                className="discussions-input-button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                  <line x1="9" y1="9" x2="9.01" y2="9"></line>
                  <line x1="15" y1="9" x2="15.01" y2="9"></line>
                </svg>
              </button>
            </div>
            <div className="discussions-input-field">
              <textarea
                className="discussions-input-textarea"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                onInput={handleTyping}
                rows={1}
              />
            </div>
            <button
              type="submit"
              className="discussions-input-button send-button"
              disabled={!newMessage.trim() && !selectedFiles.length}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
              <div className="send-button-glow"></div>
            </button>
          </div>
        </form>

        {showEmojiPicker && (
          <div className="emoji-picker-container" ref={emojiPickerRef}>
            <EmojiPicker onEmojiClick={onEmojiClick} width={300} height={350} />
          </div>
        )}
      </div>

      {showMembersPopup && (
        <div
          className="members-popup-overlay"
          onClick={() => setShowMembersPopup(false)}
        >
          <div className="members-popup" onClick={(e) => e.stopPropagation()}>
            <div className="members-popup-header">
              <h3>Group Members</h3>
              <button
                className="close-popup"
                onClick={() => setShowMembersPopup(false)}
              >
                ×
              </button>
            </div>
            <div className="members-list">
              {currentGroupMembers.map((member) => (
                <div key={member._id} className="member-item">
                  <img
                    src={member.avatar || "/placeholder.svg"}
                    alt={member.username}
                    className="member-avatar"
                  />
                  <div className="member-info">
                    <span className="member-username">{member.username}</span>
                    <span className="member-email">{member.email}</span>
                  </div>
                  <div className="member-hover-effect"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DiscussionsPage;