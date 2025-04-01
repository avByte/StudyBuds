import React, { useState, useEffect, useRef } from 'react';
import { getMatches, getChatMessages, subscribeToMessages, sendMessage } from './Message';
import { auth } from './firebase';
import './chat.css';

const Chat = () => {
    const [matches, setMatches] = useState([]);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);
    const unsubscribeRef = useRef(null);

    useEffect(() => {
        loadMatches();
        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
            }
        };
    }, []);

    useEffect(() => {
        if (selectedMatch) {
            loadMessages(selectedMatch.id);
        }
    }, [selectedMatch]);

    const loadMatches = async () => {
        const userMatches = await getMatches();
        setMatches(userMatches);
    };

    const loadMessages = async (matchId) => {
        // Unsubscribe from previous chat if exists
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
        }

        // Subscribe to real-time messages
        unsubscribeRef.current = subscribeToMessages(matchId, (updatedMessages) => {
            setMessages(updatedMessages);
            scrollToBottom();
        });
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedMatch) return;

        await sendMessage(selectedMatch.id, newMessage.trim());
        setNewMessage('');
    };

    const getMatchedUserDetails = (match) => {
        const currentUser = auth.currentUser;
        const matchedUserId = match.users.find(id => id !== currentUser.uid);
        return match.userDetails[matchedUserId];
    };

    return (
        <div className="chat-container">
            <div className="matches-list">
                <h2>Your Study Buddies</h2>
                {matches.length === 0 ? (
                    <div className="no-matches">
                        No matches yet. Start swiping to find study buddies!
                    </div>
                ) : (
                    matches.map((match) => {
                        const matchedUser = getMatchedUserDetails(match);
                        return (
                            <div
                                key={match.id}
                                className={`match-item ${selectedMatch?.id === match.id ? 'selected' : ''}`}
                                onClick={() => setSelectedMatch(match)}
                            >
                                <div className="match-info">
                                    <div className="match-name">{matchedUser.fullName}</div>
                                    <div className="match-email">{matchedUser.email}</div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
            
            <div className="chat-box">
                {selectedMatch ? (
                    <>
                        <div className="chat-header">
                            <h3>{getMatchedUserDetails(selectedMatch).fullName}</h3>
                        </div>
                        <div className="messages-container">
                            {messages.length === 0 ? (
                                <div className="no-messages">
                                    No messages yet. Say hello to your study buddy!
                                </div>
                            ) : (
                                messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`message ${
                                            message.senderId === auth.currentUser.uid
                                                ? 'sent'
                                                : 'received'
                                        }`}
                                    >
                                        <div className="message-content">
                                            <div className="message-text">
                                                {message.content}
                                            </div>
                                            <div className="message-time">
                                                {message.timestamp?.toDate().toLocaleTimeString()}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                        
                        <form onSubmit={handleSendMessage} className="message-input">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                            />
                            <button type="submit">Send</button>
                        </form>
                    </>
                ) : (
                    <div className="no-chat-selected">
                        Select a study buddy to start chatting
                    </div>
                )}
            </div>
        </div>
    );
};

export default Chat;