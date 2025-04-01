import React, { useState } from 'react';
import './Split.css';

const Split = ({ onClose, onSubmit, selectedEvent }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState({
        days: '',
        hoursPerDay: '',
        preferredTime: '',
        additionalCourses: 'No',
        courses: []
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
            text: "How many hours can you study per day?",
            type: "number",
            field: "hoursPerDay",
            validation: (value) => value > 0 && value <= 24,
            errorMessage: "Please enter a number between 1 and 24"
        },
        {
            id: 3,
            text: "What is your preferred study time?",
            type: "select",
            field: "preferredTime",
            options: ["Morning", "Afternoon", "Evening", "Night"]
        },
        {
            id: 4,
            text: "Do you want to add additional courses?",
            type: "select",
            field: "additionalCourses",
            options: ["Yes", "No"]
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
        if (currentQuestion.validation) {
            const value = Number(answers[currentQuestion.field]);
            if (!currentQuestion.validation(value)) {
                setError(currentQuestion.errorMessage);
                return;
            }
        }
        
        if (currentStep < questions.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            createStudyPlan();
        }
    };

    const createStudyPlan = () => {
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
            switch (answers.preferredTime) {
                case 'Morning':
                    eventDate.setHours(9, 0);
                    break;
                case 'Afternoon':
                    eventDate.setHours(14, 0);
                    break;
                case 'Evening':
                    eventDate.setHours(18, 0);
                    break;
                case 'Night':
                    eventDate.setHours(20, 0);
                    break;
            }

            const endDate = new Date(eventDate);
            endDate.setHours(eventDate.getHours() + hoursPerDay);

            const dayChunks = materialChunks.slice(
                day * chunksPerDay,
                (day + 1) * chunksPerDay
            ).join('\n');

            studyEvents.push({
                title: `Study Session ${day + 1}`,
                start: eventDate.toISOString(),
                end: endDate.toISOString(),
                courseMaterial: dayChunks,
                eventType: 'study',
                parentEventId: selectedEvent.id
            });
        }

        onSubmit(studyEvents);
    };

    const currentQuestion = questions[currentStep];

    return (
        <div className="modal-overlay">
            <div className="modal-content">
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

                <div className="modal-buttons">
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