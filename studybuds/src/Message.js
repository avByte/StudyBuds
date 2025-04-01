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
    doc,
    getDoc,
    deleteDoc
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
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate()
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
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate()
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
        const matchDoc = await getDoc(matchRef);
        
        if (!matchDoc.exists() || matchDoc.data().status !== 'accepted') {
            throw new Error('Cannot send message - match not accepted');
        }

        const messagesRef = collection(db, `matches/${matchId}/messages`);
        const messageData = {
            content: content.trim(),
            senderId: user.uid,
            senderName: user.displayName || user.email,
            timestamp: serverTimestamp()
        };

        await addDoc(messagesRef, messageData);
        console.log('Message sent successfully');
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
};

// Cancel a match request (only for initiator)
export const cancelMatch = async (matchId) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const matchRef = doc(db, 'matches', matchId);
        const matchDoc = await getDoc(matchRef);
        
        if (!matchDoc.exists()) {
            throw new Error('Match not found');
        }

        const matchData = matchDoc.data();
        if (matchData.initiatorId !== user.uid) {
            throw new Error('Only the initiator can cancel the match');
        }

        if (matchData.status !== 'pending') {
            throw new Error('Can only cancel pending matches');
        }

        // Delete all messages in the chat
        const messagesRef = collection(db, `matches/${matchId}/messages`);
        const messagesSnapshot = await getDocs(messagesRef);
        const deletePromises = messagesSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);

        // Delete the match document
        await deleteDoc(matchRef);
        
        console.log('Match and messages deleted successfully');
    } catch (error) {
        console.error('Error cancelling match:', error);
        throw error;
    }
};
