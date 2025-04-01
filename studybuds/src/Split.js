import React, { useState } from 'react';
import './Split.css';
import { auth, db } from './firebase';
import { collection, addDoc } from 'firebase/firestore';

const Split = ({ onClose, onSubmit, selectedEvent }) => {
    const [error, setError] = useState('');
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState({});

    const questions = [
        {
            id: 'topic',
            label: 'What topic will you be studying?',
            type: 'text'
        },
        {
            id: 'duration',
            label: 'How long do you plan to study (in minutes)?',
            type: 'number'
        },
        {
            id: 'goals',
            label: 'What are your study goals for this session?',
            type: 'text'
        }
    ];

    const createStudyPlan = async () => {
        const user = auth.currentUser;
        if (!user) {
            setError('You must be logged in to create a study plan');
            return;
        }

        try {
            const studyPlanData = {
                userId: user.uid,
                eventId: selectedEvent?.id,
                ...answers,
                createdAt: new Date()
            };

            await addDoc(collection(db, 'studyPlans'), studyPlanData);
            onSubmit(studyPlanData);
            onClose();
        } catch (err) {
            setError('Failed to create study plan: ' + err.message);
        }
    };

    const handleInputChange = (questionId, value) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));
    };

    const validateAndProceed = () => {
        const currentQuestion = questions[currentStep];
        if (!answers[currentQuestion.id]) {
            setError('Please answer the question before proceeding');
            return;
        }
        setError('');
        if (currentStep < questions.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            createStudyPlan();
        }
    };

    const currentQuestion = questions[currentStep];

    return (
        <div className="split-container">
            <button className="split-close" onClick={onClose}>&times;</button>
            
            {error && <div className="error-message">{error}</div>}
            
            <div className="split-form">
                <h3>{currentQuestion.label}</h3>
                
                {currentQuestion.type === 'text' && (
                    <input
                        type="text"
                        value={answers[currentQuestion.id] || ''}
                        onChange={(e) => handleInputChange(currentQuestion.id, e.target.value)}
                        className="split-input"
                    />
                )}
                
                {currentQuestion.type === 'number' && (
                    <input
                        type="number"
                        value={answers[currentQuestion.id] || ''}
                        onChange={(e) => handleInputChange(currentQuestion.id, e.target.value)}
                        className="split-input"
                        min="1"
                    />
                )}
                
                <div className="button-group">
                    {currentStep > 0 && (
                        <button
                            className="split-button"
                            onClick={() => setCurrentStep(prev => prev - 1)}
                        >
                            Previous
                        </button>
                    )}
                    
                    <button
                        className="split-button"
                        onClick={validateAndProceed}
                    >
                        {currentStep === questions.length - 1 ? 'Submit' : 'Next'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Split; 