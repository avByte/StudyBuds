import React, { useState } from 'react';
import './Split.css';
import { auth, db } from './firebase';
import { collection, addDoc } from 'firebase/firestore';

const Split = ({ onClose, onSubmit, selectedEvent }) => {
    // ... existing state and questions code ...

    const createStudyPlan = async () => {
        const user = auth.currentUser;
        if (!user) {
            setError("User not authenticated");
            return;
        }

        try {
            const startDate = new Date(selectedEvent.start);
            const studyEvents = [];
            const totalDays = Number(answers.days);
            const hoursPerDay = Number(answers.hoursPerDay);
            
            // Split the course material into chunks
            const materialChunks = selectedEvent.extendedProps.courseMaterial.split('\n')
                .filter(chunk => chunk.trim() !== '');
            
            const chunksPerDay = Math.ceil(materialChunks.length / totalDays);

            for (let day = 0; day < totalDays; day++) {
                const eventDate = new Date(startDate);
                eventDate.setDate(startDate.getDate() + day);
                
                // Set the time based on preferred study time
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
                endDate.setHours(startHour + hoursPerDay, 0, 0);

                const dayChunks = materialChunks.slice(
                    day * chunksPerDay,
                    (day + 1) * chunksPerDay
                ).join('\n');

                // Create and immediately upload each study event to Firebase
                const studyEvent = {
                    title: `Study Session ${day + 1}: ${selectedEvent.title}`,
                    start: eventDate.toISOString(),
                    end: endDate.toISOString(),
                    courseMaterial: dayChunks,
                    eventType: 'study',
                    parentEventId: selectedEvent.id,
                    userId: user.uid,
                    createdAt: new Date().toISOString(),
                    studyDetails: {
                        dayNumber: day + 1,
                        totalDays: totalDays,
                        preferredTime: answers.preferredTime,
                        hoursPerDay: hoursPerDay,
                        originalEventTitle: selectedEvent.title
                    }
                };

                // Add to Firebase
                await addDoc(collection(db, 'events'), studyEvent);
                studyEvents.push(studyEvent);
            }

            // Notify parent component and close modal
            onSubmit(studyEvents);
            onClose();
        } catch (error) {
            console.error('Error creating study plan:', error);
            setError('Failed to create study plan. Please try again.');
        }
    };

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
                        onChange={(e) => handleInputChange(currentQuestion.field, e.target.value)}
                        min="1"
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