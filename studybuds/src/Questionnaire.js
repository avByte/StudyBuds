// src/Questionnaire.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "./firebase";
import { doc, setDoc } from "firebase/firestore";

function Questionnaire() {
  const navigate = useNavigate();

  const [studyHoursPerDay, setStudyHoursPerDay] = useState("");
  const [partnerStudyHours, setPartnerStudyHours] = useState("");
  const [environment, setEnvironment] = useState("");
  const [studyTechniques, setStudyTechniques] = useState([]);
  const [sessionType, setSessionType] = useState("");

  const techniquesList = [
    "Flashcards",
    "Making notes/Cornell notes",
    "Mind maps",
    "Practice exams",
    "Pomodoro technique",
    "Spaced repetition",
    "Active recall"
  ];

  const toggleTechnique = (technique) => {
    setStudyTechniques((prev) =>
      prev.includes(technique)
        ? prev.filter((t) => t !== technique)
        : [...prev, technique]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const user = auth.currentUser;
    if (!user) {
      alert("User not logged in.");
      return;
    }
  
    const answers = {
      studyHoursPerDay,
      partnerStudyHours,
      environment,
      studyTechniques,
      sessionType,
      timestamp: new Date(),
    };
  
    try {
      await setDoc(doc(db, "profiles", user.uid), answers);
      navigate("/calendar");
    } catch (err) {
      alert("Failed to save data. Please try again.");
    }
  };  

  return (
    <div className="form-container">
      <h2>Study Buds Questionnaire</h2>
      <form onSubmit={handleSubmit}>
        <label>1. How many hours on average do you study per day?</label>
        <select required value={studyHoursPerDay} onChange={(e) => setStudyHoursPerDay(e.target.value)}>
          <option value="">Select one</option>
          <option value="1-3">1-3 hours</option>
          <option value="4-6">4-6 hours</option>
          <option value="6-9">6-9 hours</option>
          <option value=">9">More than 9 hours</option>
        </select>

        <label>2. How many hours a week would you like to study with a partner?</label>
        <select required value={partnerStudyHours} onChange={(e) => setPartnerStudyHours(e.target.value)}>
          <option value="">Select one</option>
          <option value="1-3">1-3 hours</option>
          <option value="4-6">4-6 hours</option>
          <option value="6-9">6-9 hours</option>
          <option value=">9">More than 9 hours</option>
        </select>

        <label>3. What surrounding environment do you prefer studying in?</label>
        <select required value={environment} onChange={(e) => setEnvironment(e.target.value)}>
          <option value="">Select one</option>
          <option value="Completely silent">Completely silent</option>
          <option value="Moderately quiet">Moderately quiet</option>
          <option value="Moderately loud">Moderately loud</option>
          <option value="Loud room">Loud room</option>
        </select>

        <label>4. What studying techniques do you enjoy using?</label>
        <div className="option-group">
          {techniquesList.map((technique) => (
            <button
              key={technique}
              type="button"
              className={studyTechniques.includes(technique) ? "selected" : ""}
              onClick={() => toggleTechnique(technique)}
            >
              {technique}
            </button>
          ))}
        </div>

        <label>5. What kind of study sessions are you looking to have?</label>
        <select required value={sessionType} onChange={(e) => setSessionType(e.target.value)}>
          <option value="">Select one</option>
          <option value="Interactive">Interactive (discussing concepts, sharing ideas)</option>
          <option value="Independent">Independent/quiet study</option>
          <option value="Mixed">A mix of quiet and interactive sessions</option>
          <option value="Hybrid">Working independently with occasional collaboration</option>
        </select>

        <button type="submit">Finish</button>
      </form>
    </div>
  );
}

export default Questionnaire;
