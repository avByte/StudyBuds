import React, { useState, useEffect } from 'react';
import './MatchMaking.css';

// Test users data
const testUsers = [
  {
    id: 'test1',
    fullName: 'Sarah Chen',
    email: 'sarah.chen@test.com',
    studyHoursPerDay: '4-6',
    partnerStudyHours: '4-6',
    environment: 'Moderately quiet',
    sessionType: 'Interactive',
    studyTechniques: ['Flashcards', 'Practice exams', 'Active recall'],
    questionnaireCompleted: true
  },
  {
    id: 'test2',
    fullName: 'Michael Rodriguez',
    email: 'michael.r@test.com',
    studyHoursPerDay: '6-9',
    partnerStudyHours: '6-9',
    environment: 'Completely silent',
    sessionType: 'Independent',
    studyTechniques: ['Making notes/Cornell notes', 'Mind maps', 'Spaced repetition'],
    questionnaireCompleted: true
  },
  {
    id: 'test3',
    fullName: 'Emma Thompson',
    email: 'emma.t@test.com',
    studyHoursPerDay: '1-3',
    partnerStudyHours: '1-3',
    environment: 'Moderately loud',
    sessionType: 'Mixed',
    studyTechniques: ['Pomodoro technique', 'Flashcards', 'Active recall'],
    questionnaireCompleted: true
  },
  {
    id: 'test4',
    fullName: 'James Wilson',
    email: 'james.w@test.com',
    studyHoursPerDay: '>9',
    partnerStudyHours: '4-6',
    environment: 'Moderately quiet',
    sessionType: 'Hybrid',
    studyTechniques: ['Practice exams', 'Spaced repetition', 'Mind maps'],
    questionnaireCompleted: true
  },
  {
    id: 'test5',
    fullName: 'Sophia Patel',
    email: 'sophia.p@test.com',
    studyHoursPerDay: '4-6',
    partnerStudyHours: '6-9',
    environment: 'Completely silent',
    sessionType: 'Interactive',
    studyTechniques: ['Making notes/Cornell notes', 'Active recall', 'Pomodoro technique'],
    questionnaireCompleted: true
  }
];

function MatchMaking() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Set loading to false immediately since we're using hardcoded data
    setLoading(false);
  }, []);

  const handleSwipe = (direction) => {
    if (currentIndex < testUsers.length) {
      const currentMatch = testUsers[currentIndex];
      if (direction === 'right') {
        // Add to matches
        setMatches(prev => [...prev, currentMatch]);
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

  if (currentIndex >= testUsers.length) {
    return (
      <div className="no-more-matches">
        <h2>No more potential matches!</h2>
        <p>Check back later for new study buddies.</p>
      </div>
    );
  }

  const currentMatch = testUsers[currentIndex];

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