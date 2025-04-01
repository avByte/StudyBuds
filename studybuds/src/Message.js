import { db } from './firebase';
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
import { auth } from './firebase';

export const getMatches = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return [];

    try {
        const matchesRef = collection(db, 'matches');
        const q = query(matchesRef, where('users', 'array-contains', currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        const matches = [];
        for (const doc of querySnapshot.docs) {
            const matchData = doc.data();
            const userDetails = {};
            
            // Get user details for each user in the match
            for (const userId of matchData.users) {
                const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', userId)));
                if (!userDoc.empty) {
                    userDetails[userId] = userDoc.docs[0].data();
                }
            }
            
            matches.push({
                id: doc.id,
                ...matchData,
                userDetails
            });
        }
        
        return matches;
    } catch (error) {
        console.error('Error getting matches:', error);
        return [];
    }
};

export const getChatMessages = async (matchId) => {
    try {
        const messagesRef = collection(db, 'messages');
        const q = query(
            messagesRef,
            where('matchId', '==', matchId),
            orderBy('timestamp', 'asc')
        );
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

export const subscribeToMessages = (matchId, callback) => {
    const messagesRef = collection(db, 'messages');
    const q = query(
        messagesRef,
        where('matchId', '==', matchId),
        orderBy('timestamp', 'asc')
    );
    
    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(messages);
    });
};

export const sendMessage = async (matchId, content) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('User not authenticated');

    try {
        const messagesRef = collection(db, 'messages');
        await addDoc(messagesRef, {
            matchId,
            content,
            senderId: currentUser.uid,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
};
