import { db } from "./firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

// Calculate compatibility score between two users based on their questionnaire responses
const calculateCompatibilityScore = (currentUserProfile, otherUserProfile) => {
  let score = 0;
  const maxScore = 100;
  
  // Calculate score based on study hours per day preference
  if (currentUserProfile.studyHoursPerDay === otherUserProfile.studyHoursPerDay) {
    score += 20;
  } else {
    // Give partial points for close ranges
    const hourRanges = ["1-3", "4-6", "6-9", ">9"];
    const currentIndex = hourRanges.indexOf(currentUserProfile.studyHoursPerDay);
    const otherIndex = hourRanges.indexOf(otherUserProfile.studyHoursPerDay);
    
    // Calculate difference in preference
    const diff = Math.abs(currentIndex - otherIndex);
    if (diff === 1) score += 10; // Close ranges
    else if (diff === 2) score += 5; // Further ranges
  }
  
  // Calculate score based on partner study hours preference
  if (currentUserProfile.partnerStudyHours === otherUserProfile.partnerStudyHours) {
    score += 20;
  } else {
    const hourRanges = ["1-3", "4-6", "6-9", ">9"];
    const currentIndex = hourRanges.indexOf(currentUserProfile.partnerStudyHours);
    const otherIndex = hourRanges.indexOf(otherUserProfile.partnerStudyHours);
    
    const diff = Math.abs(currentIndex - otherIndex);
    if (diff === 1) score += 10;
    else if (diff === 2) score += 5;
  }
  
  // Calculate score based on environment preference
  if (currentUserProfile.environment === otherUserProfile.environment) {
    score += 25;
  } else {
    const environments = ["Completely silent", "Moderately quiet", "Moderately loud", "Loud room"];
    const currentIndex = environments.indexOf(currentUserProfile.environment);
    const otherIndex = environments.indexOf(otherUserProfile.environment);
    
    const diff = Math.abs(currentIndex - otherIndex);
    if (diff === 1) score += 15; // Adjacent environments
    else if (diff === 2) score += 5; // Further environments
  }
  
  // Calculate score based on study techniques overlap
  const commonTechniques = currentUserProfile.studyTechniques.filter(
    technique => otherUserProfile.studyTechniques.includes(technique)
  );
  
  const uniqueTechniques = [
    ...new Set([
      ...currentUserProfile.studyTechniques,
      ...otherUserProfile.studyTechniques
    ])
  ];
  
  // Score based on percentage of common techniques
  const techniqueScore = (commonTechniques.length / uniqueTechniques.length) * 15;
  score += techniqueScore;
  
  // Calculate score based on session type preference
  if (currentUserProfile.sessionType === otherUserProfile.sessionType) {
    score += 20;
  } else {
    // Session types with similar interaction levels
    const sessionTypes = ["Independent", "Hybrid", "Mixed", "Interactive"];
    const currentIndex = sessionTypes.indexOf(currentUserProfile.sessionType);
    const otherIndex = sessionTypes.indexOf(otherUserProfile.sessionType);
    
    const diff = Math.abs(currentIndex - otherIndex);
    if (diff === 1) score += 10; // Similar session types
    else if (diff === 2) score += 5; // Less similar types
  }
  
  // Ensure score doesn't exceed max
  return Math.min(Math.round(score), maxScore);
};

// Get current user's profile
export const getCurrentUserProfile = async (userId) => {
  try {
    const profileDoc = await getDoc(doc(db, "profiles", userId));
    if (profileDoc.exists()) {
      return profileDoc.data();
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

// Find compatible study partners, minimum compatibility score is 60 for 
export const findCompatiblePartners = async (userId, minCompatibilityScore = 60) => {
  try {
    // Get current user's profile
    const currentUserProfile = await getCurrentUserProfile(userId);
    if (!currentUserProfile) {
      throw new Error("User profile not found");
    }
    
    // Get all users' profiles
    const profilesSnapshot = await getDocs(collection(db, "profiles"));
    
    // Calculate compatibility with each user
    const compatiblePartners = [];
    
    profilesSnapshot.forEach((doc) => {
      const otherUserId = doc.id;
      const otherUserProfile = doc.data();
      
      // Skip current user
      if (otherUserId === userId) return;
      
      // Calculate compatibility score
      const compatibilityScore = calculateCompatibilityScore(currentUserProfile, otherUserProfile);
      
      // Include user if above minimum threshold
      if (compatibilityScore >= minCompatibilityScore) {
        compatiblePartners.push({
          userId: otherUserId,
          profile: otherUserProfile,
          compatibilityScore
        });
      }
    });
    
    // Sort by compatibility score (highest first)
    return compatiblePartners.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  } 
  catch (error) {
    console.error("Error finding compatible partners:", error);
    return [];
  }
};

// export function to be used in other files
export default compareQuestionnaire;
