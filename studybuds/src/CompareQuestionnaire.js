import { db } from "./firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

// Calculate compatibility score between two users based on their questionnaire responses
const calculateCompatibilityScore = (currentUserProfile, otherUserProfile) => {
  console.log("Calculating compatibility score between profiles:", currentUserProfile, otherUserProfile);
  let score = 0;
  const maxScore = 100;
  
  // Ensure both profiles have the required fields
  if (!currentUserProfile || !otherUserProfile) {
    console.log("One or both profiles are missing");
    return 0;
  }
  
  // Calculate score based on study hours per day preference
  if (currentUserProfile.studyHoursPerDay && otherUserProfile.studyHoursPerDay) {
    if (currentUserProfile.studyHoursPerDay === otherUserProfile.studyHoursPerDay) {
      score += 20;
    } else {
      // Give partial points for close ranges
      const hourRanges = ["1-3", "4-6", "6-9", ">9"];
      const currentIndex = hourRanges.indexOf(currentUserProfile.studyHoursPerDay);
      const otherIndex = hourRanges.indexOf(otherUserProfile.studyHoursPerDay);
      
      // Calculate difference in preference
      if (currentIndex !== -1 && otherIndex !== -1) {
        const diff = Math.abs(currentIndex - otherIndex);
        if (diff === 1) score += 10; // Close ranges
        else if (diff === 2) score += 5; // Further ranges
      }
    }
  }
  
  // Calculate score based on partner study hours preference
  if (currentUserProfile.partnerStudyHours && otherUserProfile.partnerStudyHours) {
    if (currentUserProfile.partnerStudyHours === otherUserProfile.partnerStudyHours) {
      score += 20;
    } else {
      const hourRanges = ["1-3", "4-6", "6-9", ">9"];
      const currentIndex = hourRanges.indexOf(currentUserProfile.partnerStudyHours);
      const otherIndex = hourRanges.indexOf(otherUserProfile.partnerStudyHours);
      
      if (currentIndex !== -1 && otherIndex !== -1) {
        const diff = Math.abs(currentIndex - otherIndex);
        if (diff === 1) score += 10;
        else if (diff === 2) score += 5;
      }
    }
  }
  
  // Calculate score based on environment preference
  if (currentUserProfile.environment && otherUserProfile.environment) {
    if (currentUserProfile.environment === otherUserProfile.environment) {
      score += 25;
    } else {
      const environments = ["Completely silent", "Moderately quiet", "Moderately loud", "Loud room"];
      const currentIndex = environments.indexOf(currentUserProfile.environment);
      const otherIndex = environments.indexOf(otherUserProfile.environment);
      
      if (currentIndex !== -1 && otherIndex !== -1) {
        const diff = Math.abs(currentIndex - otherIndex);
        if (diff === 1) score += 15; // Adjacent environments
        else if (diff === 2) score += 5; // Further environments
      }
    }
  }
  
  // Calculate score based on study techniques overlap
  if (currentUserProfile.studyTechniques && otherUserProfile.studyTechniques && 
      Array.isArray(currentUserProfile.studyTechniques) && Array.isArray(otherUserProfile.studyTechniques)) {
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
    if (uniqueTechniques.length > 0) {
      const techniqueScore = (commonTechniques.length / uniqueTechniques.length) * 15;
      score += techniqueScore;
    }
  }
  
  // Calculate score based on session type preference
  if (currentUserProfile.sessionType && otherUserProfile.sessionType) {
    if (currentUserProfile.sessionType === otherUserProfile.sessionType) {
      score += 20;
    } else {
      // Session types with similar interaction levels
      const sessionTypes = ["Independent", "Hybrid", "Mixed", "Interactive"];
      const currentIndex = sessionTypes.indexOf(currentUserProfile.sessionType);
      const otherIndex = sessionTypes.indexOf(otherUserProfile.sessionType);
      
      if (currentIndex !== -1 && otherIndex !== -1) {
        const diff = Math.abs(currentIndex - otherIndex);
        if (diff === 1) score += 10; // Similar session types
        else if (diff === 2) score += 5; // Less similar types
      }
    }
  }
  
  // Ensure score doesn't exceed max
  return Math.min(Math.round(score), maxScore);
};

// Get current user's profile
export const getCurrentUserProfile = async (userId) => {
  console.log("Getting current user profile for userId:", userId);
  try {
    const profileDoc = await getDoc(doc(db, "profiles", userId));
    console.log("Profile document exists:", profileDoc.exists());
    if (profileDoc.exists()) {
      const profileData = profileDoc.data();
      console.log("Profile data:", profileData);
      return profileData;
    }
    console.log("Profile not found");
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

// Find compatible study partners
export const findCompatiblePartners = async (userId, minCompatibilityScore = 60) => {
  console.log("Finding compatible partners for userId:", userId, "with min score:", minCompatibilityScore);
  try {
    // Get current user's profile
    const currentUserProfile = await getCurrentUserProfile(userId);
    if (!currentUserProfile) {
      console.log("Current user profile not found");
      throw new Error("User profile not found. Please complete the questionnaire first.");
    }
    
    // Check if the profile has the required fields
    const requiredFields = ['studyHoursPerDay', 'partnerStudyHours', 'environment', 'studyTechniques', 'sessionType'];
    const missingFields = requiredFields.filter(field => !currentUserProfile[field]);
    
    if (missingFields.length > 0) {
      console.log("Missing required fields:", missingFields);
      throw new Error(`Your profile is missing required fields: ${missingFields.join(', ')}. Please update your questionnaire.`);
    }
    
    // Get all users' profiles
    console.log("Fetching all user profiles");
    const profilesSnapshot = await getDocs(collection(db, "profiles"));
    
    if (profilesSnapshot.empty) {
      console.log("No profiles found in the database");
      return [];
    }
    
    console.log("Found", profilesSnapshot.size, "profiles in the database");
    
    // Calculate compatibility with each user
    const compatiblePartners = [];
    
    profilesSnapshot.forEach((doc) => {
      const otherUserId = doc.id;
      const otherUserProfile = doc.data();
      
      // Skip current user
      if (otherUserId === userId) {
        console.log("Skipping current user");
        return;
      }
      
      // Skip profiles with missing required fields
      const otherMissingFields = requiredFields.filter(field => !otherUserProfile[field]);
      if (otherMissingFields.length > 0) {
        console.log(`Skipping user ${otherUserId} due to missing fields: ${otherMissingFields.join(', ')}`);
        return;
      }
      
      // Calculate compatibility score
      const compatibilityScore = calculateCompatibilityScore(currentUserProfile, otherUserProfile);
      console.log(`Compatibility score with user ${otherUserId}:`, compatibilityScore);
      
      // Include user if above minimum threshold
      if (compatibilityScore >= minCompatibilityScore) {
        compatiblePartners.push({
          userId: otherUserId,
          profile: otherUserProfile,
          compatibilityScore
        });
      }
    });
    
    console.log("Found", compatiblePartners.length, "compatible partners");
    
    // Sort by compatibility score (highest first)
    return compatiblePartners.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  } catch (error) {
    console.error("Error finding compatible partners:", error);
    throw error; // Re-throw the error to be handled by the component
  }
};