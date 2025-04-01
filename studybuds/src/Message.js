import { auth, db } from './firebase';
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    addDoc, 
    orderBy, 
    onSnapshot,
    serverTimestamp,
    updateDoc,
    doc 
} from 'firebase/firestore';

// Get all matches for the current user (both pending and accepted)
export const getMatches = async () => {
    const user = auth.currentUser;
    if (!user) return [];

    try {
        const matchesRef = collection(db, 'matches');
        // Get matches where user is either the initiator or the receiver
        const q = query(
            matchesRef,
            where('users', 'array-contains', user.uid)
        );
        const querySnapshot = await getDocs(q);
        
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            isPending: doc.data().status === 'pending',
            isInitiator: doc.data().initiatorId === user.uid
        }));
    } catch (error) {
        console.error('Error getting matches:', error);
        return [];
    }
};

// Accept a match request
export const acceptMatch = async (matchId) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const matchRef = doc(db, 'matches', matchId);
        await updateDoc(matchRef, {
            status: 'accepted',
            acceptedAt: serverTimestamp()
        });
        console.log('Match accepted successfully');
    } catch (error) {
        console.error('Error accepting match:', error);
    }
};

// Decline a match request
export const declineMatch = async (matchId) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const matchRef = doc(db, 'matches', matchId);
        await updateDoc(matchRef, {
            status: 'declined',
            declinedAt: serverTimestamp()
        });
        console.log('Match declined successfully');
    } catch (error) {
        console.error('Error declining match:', error);
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

// Send a new message (only if match is accepted)
export const sendMessage = async (matchId, content) => {
    const user = auth.currentUser;
    if (!user || !content.trim()) return;

    try {
        // Check if match is accepted
        const matchRef = doc(db, 'matches', matchId);
        const matchDoc = await getDocs(matchRef);
        if (!matchDoc.exists() || matchDoc.data().status !== 'accepted') {
            throw new Error('Cannot send message - match not accepted');
        }

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
