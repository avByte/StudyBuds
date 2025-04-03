import React, { useState } from 'react';
import './Split.css';
import { auth, db } from './firebase';
import { collection, addDoc } from 'firebase/firestore';

const Split = ({ onClose, onSubmit, selectedEvent }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState({
        topic: '',
        frequency: '',
        duration: '',
        preferredTime: '',
    });
    const [error, setError] = useState('');

    const questions = [
        {
            id: 1,
            text: "How many days do you want to split your study material across?",
            type: "number",
            field: "days",
            validation: (value) => value > 0 && value <= 365,
            errorMessage: "Please enter a number between 1 and 365"
        },
        {
            id: 2,
            text: "How often do you want to study this? (days per week)",
            type: "select",
            field: "frequency",
            options: ["1", "2", "3", "4", "5", "6", "7"]
        },
        {
            id: 3,
            text: "How long will each session be? (hours)",
            type: "select",
            field: "duration",
            options: ["0.5", "1", "1.5", "2", "2.5", "3"]
        },
        {
            id: 4,
            text: "What is your preferred study time?",
            type: "select",
            field: "preferredTime",
            options: ["Morning", "Afternoon", "Evening", "Night"]
        }
    ];

    const handleInputChange = (field, value) => {
        setAnswers(prev => ({
            ...prev,
            [field]: value
        }));
        setError('');
    };

    const validateAndProceed = () => {
        const currentQuestion = questions[currentStep];
        if (currentStep < questions.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            createStudyPlan();
        }
    };

    const createStudyPlan = async () => {
        const user = auth.currentUser;
        if (!user) {
            setError("User not authenticated");
            return;
        }

        try {
            const startDate = new Date(selectedEvent.start);
            const studyEvents = [];
            const daysPerWeek = Number(answers.frequency);
            const hoursPerSession = Number(answers.duration);
            
            // Calculate for 4 weeks (1 month) of study sessions
            for (let week = 0; week < 4; week++) {
                for (let day = 0; day < daysPerWeek; day++) {
                    const eventDate = new Date(startDate);
                    eventDate.setDate(startDate.getDate() + (week * 7) + day);
                    
                    // Set time based on preference
                    let startHour = 9; // default to morning
                    switch (answers.preferredTime) {
                        case 'Morning':
                            startHour = 9;
                            break;
                        case 'Afternoon':
                            startHour = 14;
                            break;
                        case 'Evening':
                            startHour = 18;
                            break;
                        case 'Night':
                            startHour = 20;
                            break;
                    }
                    
                    eventDate.setHours(startHour, 0, 0);
                    const endDate = new Date(eventDate);
                    endDate.setHours(startHour + Math.floor(hoursPerSession));
                    endDate.setMinutes((hoursPerSession % 1) * 60);

                    const studyEvent = {
                        title: `${answers.topic} Study Session`,
                        start: eventDate.toISOString(),
                        end: endDate.toISOString(),
                        eventType: 'study',
                        userId: user.uid,
                        createdAt: new Date().toISOString(),
                        studyDetails: {
                            topic: answers.topic,
                            frequency: daysPerWeek,
                            duration: hoursPerSession,
                            preferredTime: answers.preferredTime,
                            weekNumber: week + 1
                        }
                    };

                    // Add to Firebase
                    await addDoc(collection(db, 'events'), studyEvent);
                    studyEvents.push(studyEvent);
                }
            }

            // Notify parent component and close modal
            onSubmit(studyEvents);
            onClose();
        } catch (error) {
            console.error('Error creating study plan:', error);
            setError('Failed to create study plan. Please try again.');
        }
    };

    const currentQuestion = questions[currentStep];

    return (
        <div className="split-overlay">
            <div className="split-content">
                <div className="progress-bar">
                    <div 
                        className="progress" 
                        style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
                    ></div>
                </div>

                <h2>{currentQuestion.text}</h2>
                
                {error && <div className="error-message">{error}</div>}

                {currentQuestion.type === "number" && (
                    <input
                        type="number"
                        value={answers[currentQuestion.field]}
                        onChange={(e) => 
                            handleInputChange(currentQuestion.field, e.target.value)}
                        required
                    />
                )}

                {currentQuestion.type === "select" && (
                    <div className="button-group">
                        {currentQuestion.options.map(option => (
                            <button
                                key={option}
                                className={answers[currentQuestion.field] === option ? 'selected' : ''}
                                onClick={() => handleInputChange(currentQuestion.field, option)}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                )}

                <div className="split-buttons">
                    {currentStep > 0 && (
                        <button onClick={() => setCurrentStep(prev => prev - 1)}>
                            Back
                        </button>
                    )}
                    <button onClick={validateAndProceed}>
                        {currentStep === questions.length - 1 ? 'Create Study Plan' : 'Next'}
                    </button>
                    <button onClick={onClose}>Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default Split; 