import React, { useState, useEffect } from 'react';
import './MatchMaking.css';
import { auth, db } from './firebase';
import { collection, query, where, getDocs, doc, getDoc, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

function MatchMaking() {
  const navigate = useNavigate();
  console.log('MatchMaking component initialized');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [potentialMatches, setPotentialMatches] = useState([]);

  useEffect(() => {
    console.log('Starting to fetch potential matches...');
    const fetchPotentialMatches = async () => {
      const user = auth.currentUser;
      console.log('Current user:', user?.email);
      if (!user) {
        console.log('No user logged in');
        return;
      }

      try {
        // Get all users who have completed the questionnaire
        const usersRef = collection(db, 'users');
        const q = query(usersRef, 
          where('questionnaireCompleted', '==', true)
        );
        const querySnapshot = await getDocs(q);
        console.log('Found users:', querySnapshot.size);
        
        // Filter out current user and get profiles for each remaining user
        const matchesPromises = querySnapshot.docs
          .filter(doc => doc.data().email !== user.email)
          .map(async (userDoc) => {
            console.log('Processing user:', userDoc.data().email);
            const profileDoc = await getDoc(doc(db, 'profiles', userDoc.id));
            console.log('Profile exists:', profileDoc.exists());
            return {
              id: userDoc.id,
              ...userDoc.data(),
              ...profileDoc.data()
            };
          });

        const matches = await Promise.all(matchesPromises);
        console.log('Final matches:', matches);
        setPotentialMatches(matches);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching matches:', error);
        setLoading(false);
      }
    };

    fetchPotentialMatches();
  }, []);

  const createMatch = async (matchedUserId) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      // Create a new match document with pending status
      const matchData = {
        users: [currentUser.uid, matchedUserId],
        initiatorId: currentUser.uid,
        status: 'pending',
        createdAt: new Date(),
        userDetails: {
          [currentUser.uid]: {
            email: currentUser.email,
            fullName: currentUser.displayName || currentUser.email
          },
          [matchedUserId]: {
            email: potentialMatches[currentIndex].email,
            fullName: potentialMatches[currentIndex].fullName
          }
        }
      };

      const matchRef = await addDoc(collection(db, 'matches'), matchData);
      console.log('Pending match created successfully');
      
      // Navigate to chat with the new match
      navigate('/chat', { state: { newMatchId: matchRef.id } });
    } catch (error) {
      console.error('Error creating match:', error);
    }
  };

  const handleSwipe = async (direction) => {
    if (currentIndex < potentialMatches.length) {
      const currentMatch = potentialMatches[currentIndex];
      if (direction === 'right') {
        // Create match in Firebase and navigate to chat
        await createMatch(currentMatch.id);
      }
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'ArrowLeft') {
      handleSwipe('left');
    } else if (event.key === 'ArrowRight') {
      handleSwipe('right');
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (currentIndex >= potentialMatches.length) {
    return (
      <div className="no-more-matches">
        <h2>No more potential matches!</h2>
        <p>Check back later for new study buddies.</p>
      </div>
    );
  }

  const currentMatch = potentialMatches[currentIndex];

  return (
    <div className="match-making-container">
      <div className="card-container">
        <div className="study-card">
          <div className="card-header">
            <h2>{currentMatch.fullName}</h2>
            <p className="study-hours">{currentMatch.studyHoursPerDay} hours/day</p>
          </div>
          <div className="card-content">
            <div className="preference-section">
              <h3>Study Preferences</h3>
              <p>Environment: {currentMatch.environment}</p>
              <p>Session Type: {currentMatch.sessionType}</p>
              <p>Partner Study Hours: {currentMatch.partnerStudyHours}/week</p>
            </div>
            <div className="techniques-section">
              <h3>Study Techniques</h3>
              <div className="techniques-list">
                {currentMatch.studyTechniques?.map((technique, index) => (
                  <span key={index} className="technique-tag">{technique}</span>
                ))}
              </div>
            </div>
            <div className="swipe-buttons">
              <button 
                className="swipe-button left"
                onClick={() => handleSwipe('left')}
              >
                ✕
              </button>
              <button 
                className="swipe-button right"
                onClick={() => handleSwipe('right')}
              >
                ✓
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="keyboard-hint">
        <p>Use arrow keys to swipe: ← →</p>
      </div>
    </div>
  );
}

export default MatchMaking; 