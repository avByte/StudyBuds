import React, { useState, useEffect, useRef } from 'react';
import { getMatches, getChatMessages, subscribeToMessages, sendMessage } from './Message';
import { auth } from './firebase';
import './chat.css';

const Chat = () => {
    const [matches, setMatches] = useState([]);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
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
        try {
            setIsLoading(true);
            setError(null);
            const userMatches = await getMatches();
            setMatches(userMatches);
        } catch (err) {
            console.error('Error loading matches:', err);
            setError('Failed to load matches. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const loadMessages = async (matchId) => {
        try {
            // Unsubscribe from previous chat if exists
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
            }

            // Subscribe to real-time messages
            unsubscribeRef.current = subscribeToMessages(matchId, (updatedMessages) => {
                setMessages(updatedMessages);
                scrollToBottom();
            });
        } catch (err) {
            console.error('Error loading messages:', err);
            setError('Failed to load messages. Please try again later.');
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedMatch) return;

        try {
            await sendMessage(selectedMatch.id, newMessage.trim());
            setNewMessage('');
        } catch (err) {
            console.error('Error sending message:', err);
            setError('Failed to send message. Please try again.');
        }
    };

    const getMatchedUserDetails = (match) => {
        if (!match || !match.users || !match.userDetails) return null;
        
        const currentUser = auth.currentUser;
        if (!currentUser) return null;
        
        const matchedUserId = match.users.find(id => id !== currentUser.uid);
        return match.userDetails[matchedUserId] || null;
    };

    return (
        <div className="chat-container">
            <div className="matches-list">
                <h2>Your Study Buddies</h2>
                {isLoading ? (
                    <div className="loading-message">
                        Loading matches...
                    </div>
                ) : error ? (
                    <div className="error-message">
                        {error}
                    </div>
                ) : matches.length === 0 ? (
                    <div className="no-matches">
                        No matches yet. Start swiping to find study buddies!
                    </div>
                ) : (
                    matches.map((match) => {
                        const matchedUser = getMatchedUserDetails(match);
                        if (!matchedUser) return null;
                        
                        return (
                            <div
                                key={match.id}
                                className={`match-item ${selectedMatch?.id === match.id ? 'selected' : ''}`}
                                onClick={() => setSelectedMatch(match)}
                            >
                                <div className="match-info">
                                    <div className="match-name">{matchedUser.fullName || 'Unknown User'}</div>
                                    <div className="match-email">{matchedUser.email || 'No email'}</div>
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
                            <h3>{getMatchedUserDetails(selectedMatch)?.fullName || 'Unknown User'}</h3>
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