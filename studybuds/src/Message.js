import { auth, db } from './firebase';
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    addDoc, 
    orderBy, 
    onSnapshot,
    serverTimestamp 
} from 'firebase/firestore';

// Get all matches for the current user
export const getMatches = async () => {
    const user = auth.currentUser;
    if (!user) return [];

    try {
        const matchesRef = collection(db, 'matches');
        const q = query(
            matchesRef,
            where('users', 'array-contains', user.uid)
        );
        const querySnapshot = await getDocs(q);
        
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting matches:', error);
        return [];
    }
};

// Get chat messages for a specific match
export const getChatMessages = async (matchId) => {
    try {
        const messagesRef = collection(db, `matches/${matchId}/messages`);
        const q = query(messagesRef, orderBy('timestamp', 'asc'));
        const querySnapshot = await getDocs(q);
        
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting messages:', error);
        return [];
    }
};

// Subscribe to real-time messages
export const subscribeToMessages = (matchId, callback) => {
    const messagesRef = collection(db, `matches/${matchId}/messages`);
    const q = query(messagesRef, orderBy('timestamp', 'asc'));
    
    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(messages);
    });
};

// Send a new message
export const sendMessage = async (matchId, content) => {
    const user = auth.currentUser;
    if (!user || !content.trim()) return;

    try {
        const messagesRef = collection(db, `matches/${matchId}/messages`);
        await addDoc(messagesRef, {
            content: content.trim(),
            senderId: user.uid,
            senderName: user.displayName || user.email,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error('Error sending message:', error);
    }
};
