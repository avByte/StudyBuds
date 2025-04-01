import React, { useState, useEffect, useRef } from 'react';
import { auth } from './firebase';
import { getMatches, getChatMessages, sendMessage, subscribeToMessages, acceptMatch, declineMatch } from './Message';
import { useLocation } from 'react-router-dom';
import './chat.css';

function Chat() {
    const location = useLocation();
    const [matches, setMatches] = useState([]);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);
    const unsubscribeRef = useRef(null);

    useEffect(() => {
        const fetchMatches = async () => {
            const matchesList = await getMatches();
            setMatches(matchesList);
            
            // If there's a new match from MatchMaking, select it
            if (location.state?.newMatchId) {
                const newMatch = matchesList.find(match => match.id === location.state.newMatchId);
                if (newMatch) {
                    setSelectedMatch(newMatch);
                    const matchMessages = await getChatMessages(newMatch.id);
                    setMessages(matchMessages);
                }
            }
            
            setLoading(false);
        };

        fetchMatches();
    }, [location.state?.newMatchId]);

    useEffect(() => {
        if (!selectedMatch) return;

        // Unsubscribe from previous chat if exists
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
        }

        // Subscribe to real-time messages
        unsubscribeRef.current = subscribeToMessages(selectedMatch.id, (updatedMessages) => {
            setMessages(updatedMessages);
            scrollToBottom();
        });

        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
            }
        };
    }, [selectedMatch]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleMatchSelect = async (match) => {
        setSelectedMatch(match);
        const matchMessages = await getChatMessages(match.id);
        setMessages(matchMessages);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!selectedMatch || !newMessage.trim()) return;

        await sendMessage(selectedMatch.id, newMessage.trim());
        setNewMessage('');
    };

    const handleAcceptMatch = async (matchId) => {
        await acceptMatch(matchId);
        // Refresh matches list
        const updatedMatches = await getMatches();
        setMatches(updatedMatches);
        
        // Update selected match if it was the one accepted
        if (selectedMatch?.id === matchId) {
            const updatedMatch = updatedMatches.find(m => m.id === matchId);
            setSelectedMatch(updatedMatch);
        }
    };

    const handleDeclineMatch = async (matchId) => {
        await declineMatch(matchId);
        // Refresh matches list
        const updatedMatches = await getMatches();
        setMatches(updatedMatches);
        
        // Clear selected match if it was the one declined
        if (selectedMatch?.id === matchId) {
            setSelectedMatch(null);
            setMessages([]);
        }
    };

    const getMatchedUserDetails = (match) => {
        if (!match || !match.users || !match.userDetails) return null;
        
        const currentUser = auth.currentUser;
        const matchedUserId = match.users.find(id => id !== currentUser.uid);
        return match.userDetails[matchedUserId];
    };

    if (loading) {
        return <div className="chat-container">Loading...</div>;
    }

    return (
        <div className="chat-container">
            <div className="matches-list">
                <div className="chat-header">Study Buddy Matches</div>
                {matches.length === 0 ? (
                    <div className="no-matches">No matches yet</div>
                ) : (
                    matches.map(match => {
                        const matchedUser = getMatchedUserDetails(match);
                        if (!matchedUser) return null;
                        
                        return (
                            <div 
                                key={match.id} 
                                className={`match-item ${selectedMatch?.id === match.id ? 'selected' : ''}`}
                                onClick={() => handleMatchSelect(match)}
                            >
                                <div className="match-info">
                                    <div className="match-name">{matchedUser.fullName}</div>
                                    <div className="match-status">
                                        {match.status === 'pending' && (
                                            <>
                                                {match.isInitiator ? (
                                                    <span className="pending-text">Waiting for response...</span>
                                                ) : (
                                                    <div className="match-actions">
                                                        <button onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleAcceptMatch(match.id);
                                                        }}>Accept</button>
                                                        <button onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeclineMatch(match.id);
                                                        }}>Decline</button>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        {match.status === 'accepted' && <span className="accepted-text">Connected</span>}
                                        {match.status === 'declined' && <span className="declined-text">Declined</span>}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="chat-box">
                {!selectedMatch ? (
                    <div className="no-chat-selected">Select a match to start chatting</div>
                ) : (
                    <>
                        <div className="chat-header">
                            {getMatchedUserDetails(selectedMatch).fullName}
                        </div>
                        <div className="messages-container">
                            {selectedMatch.status === 'pending' ? (
                                <div className="pending-message">
                                    {selectedMatch.isInitiator 
                                        ? "Waiting for them to accept your study buddy request..."
                                        : "Please accept or decline this study buddy request to start chatting"}
                                </div>
                            ) : selectedMatch.status === 'declined' ? (
                                <div className="declined-message">This match was declined</div>
                            ) : messages.length === 0 ? (
                                <div className="no-messages">No messages yet. Say hello!</div>
                            ) : (
                                messages.map(message => (
                                    <div 
                                        key={message.id}
                                        className={`message ${message.senderId === auth.currentUser?.uid ? 'sent' : 'received'}`}
                                    >
                                        <div className="message-content">{message.content}</div>
                                        <div className="message-time">
                                            {message.timestamp?.toDate().toLocaleTimeString()}
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                        {selectedMatch.status === 'accepted' && (
                            <form onSubmit={handleSendMessage} className="message-input">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    disabled={selectedMatch.status !== 'accepted'}
                                />
                                <button type="submit" disabled={selectedMatch.status !== 'accepted'}>
                                    Send
                                </button>
                            </form>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default Chat;