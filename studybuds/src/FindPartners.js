import React, { useState, useEffect } from "react";
import { auth } from "./firebase";
import { findCompatiblePartners } from "./MatchingService";
import "./FindPartners.css";

function FindPartners() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [minScore, setMinScore] = useState(60);

  useEffect(() => {
    loadPartners();
  }, [minScore]);

  const loadPartners = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error("You must be logged in to find study partners");
      }
      
      const compatiblePartners = await findCompatiblePartners(user.uid, minScore);
      setPartners(compatiblePartners);
    } catch (err) {
      console.error("Error finding partners:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setMinScore(parseInt(e.target.value, 10));
  };

  const getScoreClass = (score) => {
    if (score >= 80) return 'high-match';
    if (score >= 60) return 'medium-match';
    return 'low-match';
  };

  // Mock function - in a real app, this would send a connection request
  const requestConnection = (userId) => {
    // In a real implementation, you would send a request to the backend
    alert(`Connection request sent to user ${userId}`);
  };

  if (loading) {
    return <div className="loading">Finding compatible study partners...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="find-partners-container">
      <h2>Find Study Partners</h2>
      
      <div className="filter-controls">
        <label>
          Minimum Compatibility Score:
          <input
            type="range"
            min="0"
            max="100"
            value={minScore}
            onChange={handleFilterChange}
          />
          <span>{minScore}%</span>
        </label>
      </div>

      {partners.length === 0 ? (
        <div className="no-results">
          <p>No compatible study partners found with the current filter.</p>
          <p>Try lowering the minimum compatibility score or updating your preferences.</p>
        </div>
      ) : (
        <div className="partners-list">
          {partners.map((partner) => (
            <div className="partner-card" key={partner.userId}>
              <div className={`compatibility-score ${getScoreClass(partner.compatibilityScore)}`}>
                {partner.compatibilityScore}%
              </div>
              
              <div className="partner-details">
                <h3>Study Partner</h3>
                
                <div className="preference-match">
                  <h4>Study Preferences:</h4>
                  <ul>
                    <li>
                      <span>Study Hours:</span> {partner.profile.studyHoursPerDay}
                    </li>
                    <li>
                      <span>Partner Study Hours:</span> {partner.profile.partnerStudyHours}
                    </li>
                    <li>
                      <span>Environment:</span> {partner.profile.environment}
                    </li>
                    <li>
                      <span>Session Type:</span> {partner.profile.sessionType}
                    </li>
                  </ul>
                </div>
                
                <div className="study-techniques">
                  <h4>Study Techniques:</h4>
                  <div className="techniques-list">
                    {partner.profile.studyTechniques.map(technique => (
                      <span key={technique} className="technique-tag">{technique}</span>
                    ))}
                  </div>
                </div>
                
                <button 
                  className="connect-button"
                  onClick={() => requestConnection(partner.userId)}
                >
                  Connect
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
    </div>
  );
}

export default FindPartners;