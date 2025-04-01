import { db } from './firebase';
import { collection, query, where, getDocs, addDoc, orderBy, onSnapshot } from 'firebase/firestore';
import { auth } from './firebase';

// Get all matches for the current user
export const getMatches = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return [];

    const matchesRef = collection(db, 'matches');
    const q = query(matchesRef, where('users', 'array-contains', currentUser.uid));
    const querySnapshot = await getDocs(q);
    
    const matches = [];
    querySnapshot.forEach((doc) => {
        matches.push({ id: doc.id, ...doc.data() });
    });
    
    return matches;
};

// Get chat messages between two users
export const getChatMessages = async (matchId) => {
    const messagesRef = collection(db, 'messages');
    const q = query(
        messagesRef,
        where('matchId', '==', matchId),
        orderBy('timestamp', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const messages = [];
    querySnapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() });
    });
    
    return messages;
};

// Subscribe to real-time chat messages
export const subscribeToMessages = (matchId, callback) => {
    const messagesRef = collection(db, 'messages');
    const q = query(
        messagesRef,
        where('matchId', '==', matchId),
        orderBy('timestamp', 'asc')
    );
    
    return onSnapshot(q, (snapshot) => {
        const messages = [];
        snapshot.forEach((doc) => {
            messages.push({ id: doc.id, ...doc.data() });
        });
        callback(messages);
    });
};

// Send a new message
export const sendMessage = async (matchId, content) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return null;

    const messagesRef = collection(db, 'messages');
    const newMessage = {
        content,
        senderId: currentUser.uid,
        matchId,
        timestamp: new Date(),
        senderName: currentUser.displayName || 'Anonymous'
    };

    try {
        const docRef = await addDoc(messagesRef, newMessage);
        return { id: docRef.id, ...newMessage };
    } catch (error) {
        console.error('Error sending message:', error);
        return null;
    }
};
