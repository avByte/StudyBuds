import React, { useState, useEffect, useCallback } from "react";
import { auth, db } from "./firebase";
import { findCompatiblePartners } from "./CompareQuestionnaire";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./FindPartners.css";


function FindPartners() {
  console.log("FindPartners component rendering");
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [minScore, setMinScore] = useState(60);
  const [connectionStatus, setConnectionStatus] = useState({});
  const navigate = useNavigate();

  const loadPartners = useCallback(async () => {
    console.log("loadPartners function called");
    setLoading(true);
    setError(null);
    
    try {
      const user = auth.currentUser;
      console.log("Current user:", user);
      
      if (!user) {
        throw new Error("You must be logged in to find study partners");
      }
      
      console.log("Calling findCompatiblePartners with userId:", user.uid, "and minScore:", minScore);
      const compatiblePartners = await findCompatiblePartners(user.uid, minScore);
      console.log("Compatible partners found:", compatiblePartners);
      
      // Fetch user names for each partner
      const partnersWithNames = await Promise.all(
        compatiblePartners.map(async (partner) => {
          try {
            const userDoc = await getDoc(doc(db, "users", partner.userId));
            const userData = userDoc.exists() ? userDoc.data() : {};
            
            // Always show the full name that was entered during signup
            let displayName = "Anonymous User";
            if (userData.fullName && userData.fullName.trim() !== "") {
              displayName = userData.fullName;
            } else if (userData.displayName && userData.displayName.trim() !== "") {
              displayName = userData.displayName;
            } else if (userData.email) {
              displayName = userData.email;
            }
            
            return {
              ...partner,
              name: displayName
            };
          } catch (err) {
            console.error(`Error fetching user data for ${partner.userId}:`, err);
            return {
              ...partner,
              name: "Anonymous User"
            };
          }
        })
      );
      
      setPartners(partnersWithNames);
    } catch (err) {
      console.error("Error finding partners:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [minScore]);

  useEffect(() => {
    console.log("useEffect in FindPartners triggered");
    loadPartners();
  }, [loadPartners]);

  const handleFilterChange = (e) => {
    setMinScore(parseInt(e.target.value, 10));
  };

  const getScoreClass = (score) => {
    if (score >= 80) return 'high-match';
    if (score >= 60) return 'medium-match';
    return 'low-match';
  };

  // Function to send a chat connection request
  const requestConnection = async (userId, userName) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("You must be logged in to send connection requests");
      }
      
      // Get current user's name
      const currentUserDoc = await getDoc(doc(db, "users", currentUser.uid));
      const currentUserData = currentUserDoc.exists() ? currentUserDoc.data() : {};
      
      // Always show the full name that was entered during signup
      let currentUserName = "Anonymous User";
      if (currentUserData.fullName && currentUserData.fullName.trim() !== "") {
        currentUserName = currentUserData.fullName;
      } else if (currentUserData.displayName && currentUserData.displayName.trim() !== "") {
        currentUserName = currentUserData.displayName;
      } else if (currentUserData.email) {
        currentUserName = currentUserData.email;
      }
      
      // Create a match request in the matches collection
      const matchData = {
        initiatorId: currentUser.uid,
        users: [currentUser.uid, userId],
        status: "pending",
        createdAt: serverTimestamp(),
        userDetails: {
          [currentUser.uid]: {
            fullName: currentUserName,
            email: currentUser.email || ""
          },
          [userId]: {
            fullName: userName,
            email: "" // We don't have the email here
          }
        },
        message: `Hi, I'd like to study with you! We have a ${getScoreClass(partners.find(p => p.userId === userId)?.compatibilityScore || 0)} compatibility score.`
      };
      
      // Add to matches collection
      await addDoc(collection(db, "matches"), matchData);
      
      // Update connection status
      setConnectionStatus(prev => ({
        ...prev,
        [userId]: "sent"
      }));
      
      // Show success message
      alert(`Connection request sent to ${userName}`);
      
      // Navigate to chat page
      navigate("/chat");
    } catch (err) {
      console.error("Error sending connection request:", err);
      alert(`Failed to send connection request: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="find-partners-container">
        <h2>Find Study Partners</h2>
        <div className="loading">
          <p>Finding compatible study partners...</p>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="find-partners-container">
        <h2>Find Study Partners</h2>
        <div className="error">
          <p>Error: {error}</p>
          <p>Please make sure you've completed the questionnaire and try again.</p>
          <button onClick={loadPartners} className="retry-button">Retry</button>
        </div>
      </div>
    );
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
          <button onClick={loadPartners} className="retry-button">Refresh</button>
        </div>
      ) : (
        <div className="partners-list">
          {partners.map((partner) => (
            <div className="partner-card" key={partner.userId}>
              <div className={`compatibility-score ${getScoreClass(partner.compatibilityScore)}`}>
                {partner.compatibilityScore}%
              </div>
              
              <div className="partner-details">
                <h3>{partner.name}</h3>
                
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
                    {partner.profile.studyTechniques && partner.profile.studyTechniques.length > 0 ? (
                      partner.profile.studyTechniques.map(technique => (
                        <span key={technique} className="technique-tag">{technique}</span>
                      ))
                    ) : (
                      <p>No study techniques specified</p>
                    )}
                  </div>
                </div>
                
                <button 
                  className="connect-button"
                  onClick={() => requestConnection(partner.userId, partner.name)}
                  disabled={connectionStatus[partner.userId] === "sent"}
                >
                  {connectionStatus[partner.userId] === "sent" ? "Request Sent" : "Connect"}
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