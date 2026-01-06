"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "./messages.module.css";

export default function MessagesSheet() {
    const [message, setMessage] = useState("");
    const [activeChannel, setActiveChannel] = useState("general");
    const [showChannelModal, setShowChannelModal] = useState(false);
    const [newChannelName, setNewChannelName] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const recordingIntervalRef = useRef(null);

    const [channels] = useState([
        { id: "general", name: "general", description: "Team discussions and updates" },
        { id: "random", name: "random", description: "Non-work related conversations" },
        { id: "dev-team", name: "dev-team", description: "Development team discussions" },
    ]);

    const [users] = useState([
        { id: 1, username: "john.doe", name: "John Doe", avatar: "JD", status: "online" },
        { id: 2, username: "sarah.wilson", name: "Sarah Wilson", avatar: "SW", status: "online" },
        { id: 3, username: "mike.chen", name: "Mike Chen", avatar: "MC", status: "away" },
        { id: 4, username: "shora", name: "Shora", avatar: "SH", status: "online" },
    ]);

    const [messages, setMessages] = useState({
        general: [
            { id: 1, user: "John Doe", username: "john.doe", avatar: "JD", message: "Good morning team! Ready for another productive day?", timestamp: "9:00 AM", type: "text" },
            { id: 2, user: "Sarah Wilson", username: "sarah.wilson", avatar: "SW", message: "Morning John! Just deployed new features to production", timestamp: "9:05 AM", type: "text" },
            { id: 3, user: "Mike Chen", username: "mike.chen", avatar: "MC", message: "Great work Sarah! I'll monitor the system for any issues", timestamp: "9:10 AM", type: "text" },
            { id: 4, user: "Shora", username: "shora", avatar: "SH", message: "Voice message", timestamp: "9:15 AM", type: "voice", duration: "0:05" },
        ],
        random: [
            { id: 5, user: "Shora", username: "shora", avatar: "SH", message: "Anyone up for coffee? ☕", timestamp: "10:30 AM", type: "text" },
        ],
        "dev-team": [
            { id: 6, user: "Sarah Wilson", username: "sarah.wilson", avatar: "SW", message: "Code review needed for PR #123", timestamp: "11:00 AM", type: "text" },
        ]
    });

    // Emoji list
    const emojis = ["😀", "😂", "😍", "🤔", "👍", "👎", "❤️", "🎉", "🔥", "💯", "😎", "🚀", "💪", "👏", "🙌", "✨"];

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, activeChannel]);

    // Typing indicator timeout
    useEffect(() => {
        if (isTyping) {
            const timer = setTimeout(() => {
                setIsTyping(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isTyping]);

    // Recording timer
    useEffect(() => {
        if (isRecording) {
            recordingIntervalRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } else {
            if (recordingIntervalRef.current) {
                clearInterval(recordingIntervalRef.current);
            }
            setRecordingTime(0);
        }
        return () => {
            if (recordingIntervalRef.current) {
                clearInterval(recordingIntervalRef.current);
            }
        };
    }, [isRecording]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!message.trim()) return;

        const newMessage = {
            id: Date.now(),
            user: "You",
            username: "you",
            avatar: "YU",
            message: message.trim(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: "text"
        };

        setMessages(prev => ({
            ...prev,
            [activeChannel]: [...(prev[activeChannel] || []), newMessage]
        }));
        setMessage("");
        setIsTyping(false);
    };

    const handleInputChange = (e) => {
        setMessage(e.target.value);
        if (!isTyping && e.target.value.trim()) {
            setIsTyping(true);
        }
    };

    const handleEmojiClick = (emoji) => {
        setMessage(prev => prev + emoji);
        setShowEmojiPicker(false);
    };

    const handleFileAttachment = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            const newMessage = {
                id: Date.now(),
                user: "You",
                username: "you",
                avatar: "YU",
                message: `📎 ${file.name}`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                type: "file",
                fileName: file.name
            };

            setMessages(prev => ({
                ...prev,
                [activeChannel]: [...(prev[activeChannel] || []), newMessage]
            }));
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            setMediaRecorder(recorder);
            setIsRecording(true);
            
            const audioChunks = [];
            recorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };
            
            recorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                const newMessage = {
                    id: Date.now(),
                    user: "You",
                    username: "you",
                    avatar: "YU",
                    message: "Voice message",
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    type: "voice",
                    duration: formatTime(recordingTime),
                    audioBlob: audioBlob
                };

                setMessages(prev => ({
                    ...prev,
                    [activeChannel]: [...(prev[activeChannel] || []), newMessage]
                }));
                
                stream.getTracks().forEach(track => track.stop());
            };
            
            recorder.start();
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Could not access microphone. Please check permissions.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            setIsRecording(false);
            setMediaRecorder(null);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const createChannel = () => {
        if (!newChannelName.trim()) return;
        // In a real app, this would create a new channel
        setNewChannelName("");
        setShowChannelModal(false);
    };

    const parseMessage = (text) => {
        return text
            .split(/(\s+)/)
            .map((part, index) => {
                // Handle mentions (@username)
                if (part.match(/^@\w+/)) {
                    return <span key={index} className={styles.mention}>{part}</span>;
                }
                // Handle channels (#channel)
                if (part.match(/^#\w+/)) {
                    return <span key={index} className={styles.channel}>{part}</span>;
                }
                return part;
            });
    };

    return (
        <div className={styles.slackContainer}>
            {/* Sidebar */}
            <div className={styles.sidebar}>
                {/* Workspace Header */}
                <div className={styles.workspaceHeader}>
                    <h2>Acme Inc</h2>
                    <span className={styles.workspaceStatus}>● Online</span>
                </div>

                {/* Channels Section */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <span>Channels</span>
                        <button 
                            className={styles.addBtn}
                            onClick={() => setShowChannelModal(true)}
                        >
                            +
                        </button>
                    </div>
                    {channels.map((channel) => (
                        <div
                            key={channel.id}
                            className={`${styles.channelItem} ${activeChannel === channel.id ? styles.active : ''}`}
                            onClick={() => setActiveChannel(channel.id)}
                        >
                            # {channel.name}
                        </div>
                    ))}
                </div>

                {/* Direct Messages Section */}
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <span>Direct Messages</span>
                        <button className={styles.addBtn}>+</button>
                    </div>
                    {users.map((user) => (
                        <div key={user.id} className={styles.userItem}>
                            <div className={`${styles.statusDot} ${styles[user.status]}`}></div>
                            <span>{user.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className={styles.chatArea}>
                {/* Chat Header */}
                <div className={styles.chatHeader}>
                    <div className={styles.channelInfo}>
                        <h3># {channels.find(c => c.id === activeChannel)?.name}</h3>
                        <span>{channels.find(c => c.id === activeChannel)?.description}</span>
                    </div>
                    <div className={styles.headerActions}>
                        <button className={styles.headerBtn}>📌</button>
                        <button className={styles.headerBtn}>⭐</button>
                        <button className={styles.headerBtn}>👥</button>
                    </div>
                </div>

                {/* Messages Container */}
                <div className={styles.messagesContainer}>
                    {(messages[activeChannel] || []).map((msg) => (
                        <div key={msg.id} className={styles.message}>
                            <div className={styles.messageAvatar}>
                                {msg.avatar}
                            </div>
                            <div className={styles.messageContent}>
                                <div className={styles.messageHeader}>
                                    <span className={styles.messageUser}>{msg.user}</span>
                                    <span className={styles.messageTime}>{msg.timestamp}</span>
                                </div>
                                <div className={styles.messageText}>
                                    {msg.type === "voice" ? (
                                        <div className={styles.voiceMessage}>
                                            <button className={styles.playBtn}>▶️</button>
                                            <div className={styles.voiceWave}>
                                                <div className={styles.waveBar}></div>
                                                <div className={styles.waveBar}></div>
                                                <div className={styles.waveBar}></div>
                                                <div className={styles.waveBar}></div>
                                                <div className={styles.waveBar}></div>
                                            </div>
                                            <span className={styles.voiceDuration}>{msg.duration}</span>
                                        </div>
                                    ) : msg.type === "file" ? (
                                        <div className={styles.fileMessage}>
                                            <span className={styles.fileIcon}>📎</span>
                                            <span className={styles.fileName}>{msg.fileName}</span>
                                        </div>
                                    ) : (
                                        parseMessage(msg.message)
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {/* Typing Indicator */}
                    {isTyping && (
                        <div className={styles.typingIndicator}>
                            <div className={styles.messageAvatar}>
                                YU
                            </div>
                            <div className={styles.typingContent}>
                                <div className={styles.typingBubble}>
                                    <div className={styles.typingDots}>
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className={styles.messageInputContainer}>
                    {/* Recording Indicator */}
                    {isRecording && (
                        <div className={styles.recordingIndicator}>
                            <div className={styles.recordingDot}></div>
                            <span>Recording... {formatTime(recordingTime)}</span>
                            <button 
                                className={styles.stopRecordingBtn}
                                onClick={stopRecording}
                            >
                                Stop
                            </button>
                        </div>
                    )}
                    
                    <form className={styles.messageForm} onSubmit={handleSendMessage}>
                        <div className={styles.inputWrapper}>
                            <input
                                type="text"
                                className={styles.messageInput}
                                placeholder={`Message #${channels.find(c => c.id === activeChannel)?.name}`}
                                value={message}
                                onChange={handleInputChange}
                                disabled={isRecording}
                            />
                            <div className={styles.inputActions}>
                                <button 
                                    type="button" 
                                    className={styles.actionBtn}
                                    onClick={handleFileAttachment}
                                    title="Attach file"
                                >
                                    📎
                                </button>
                                <button 
                                    type="button" 
                                    className={styles.actionBtn}
                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                    title="Add emoji"
                                >
                                    😊
                                </button>
                                <button 
                                    type="button" 
                                    className={`${styles.actionBtn} ${isRecording ? styles.recording : ''}`}
                                    onMouseDown={startRecording}
                                    onMouseUp={stopRecording}
                                    onMouseLeave={stopRecording}
                                    title="Hold to record voice message"
                                >
                                    🎤
                                </button>
                            </div>
                        </div>
                    </form>
                    
                    {/* Emoji Picker */}
                    {showEmojiPicker && (
                        <div className={styles.emojiPicker}>
                            {emojis.map((emoji, index) => (
                                <button
                                    key={index}
                                    className={styles.emojiBtn}
                                    onClick={() => handleEmojiClick(emoji)}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    )}
                    
                    <div className={styles.inputHint}>
                        <strong>@someone</strong> to mention • <strong>#channel</strong> to link • Hold 🎤 for voice
                    </div>
                    
                    {/* Hidden file input */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                        accept="*/*"
                    />
                </div>
            </div>

            {/* Create Channel Modal */}
            {showChannelModal && (
                <div className={styles.modalOverlay} onClick={() => setShowChannelModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h3>Create a channel</h3>
                            <button 
                                className={styles.closeBtn}
                                onClick={() => setShowChannelModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <label>Channel name</label>
                            <input
                                type="text"
                                value={newChannelName}
                                onChange={(e) => setNewChannelName(e.target.value)}
                                placeholder="e.g. marketing"
                                className={styles.modalInput}
                            />
                            <p className={styles.modalHint}>
                                Channels are where your team communicates. They're best when organized around a topic — #marketing, for example.
                            </p>
                        </div>
                        <div className={styles.modalFooter}>
                            <button 
                                className={styles.cancelBtn}
                                onClick={() => setShowChannelModal(false)}
                            >
                                Cancel
                            </button>
                            <button 
                                className={styles.createBtn}
                                onClick={createChannel}
                                disabled={!newChannelName.trim()}
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}