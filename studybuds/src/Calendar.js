import React, { useState, useEffect } from 'react'; 
import FullCalendar from '@fullcalendar/react'; // import 
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { auth, db } from './firebase';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import './Calendar.css';
import { useNavigate } from 'react-router-dom';
import Split from './Split'; 

function Calendar() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]); // stores 
  const [viewEvent, setViewEvent] = useState(false); // visibility of event detail
  const [selectedEvent, setSelectedEvent] = useState(null); // stores 
  const [newEvent, setNewEvent] = useState({ // stores the details of a new event 
    title: '',
    start: '',
    end: '',
    courseMaterial: '',
    eventType: 'other'
  });
  const [showAddEventWindow, setShowAddEventWindow] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false); // New state for share modal
  const [friends, setFriends] = useState([]); // List of friends
  const [selectedFriend, setSelectedFriend] = useState(''); // Selected friend for sharing

  useEffect(() => {
    fetchEvents();
    fetchFriends();
  }, []);

  const fetchEvents = async () => { // gets the events from firebase for the logged in user
    const user = auth.currentUser;
    if (!user) return;

    const eventsRef = collection(db, 'events');
    const q = query(eventsRef, where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);
    
    const eventsData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    setEvents(eventsData);
  };

  const fetchFriends = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const friendsRef = collection(db, 'friends');
    const q = query(friendsRef, where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);

    const friendsData = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setFriends(friendsData);
  };

  const handleDateSelect = (selectInfo) => { // opens the 
    setNewEvent({
      ...newEvent,
      start: selectInfo.startStr,
      end: selectInfo.endStr
    });
    setShowAddEventWindow(true);
  };

  const handleEventAdd = async () => { // creates a new event in firestore
    const user = auth.currentUser;
    if (!user) return;

    try {
      // Combine the selected date with the chosen time
      const eventDate = new Date(newEvent.start);
      const [hours, minutes] = newEvent.time.split(':');
      eventDate.setHours(parseInt(hours), parseInt(minutes));

      const docRef = await addDoc(collection(db, 'events'), {
        ...newEvent,
        start: eventDate.toISOString(),
        end: eventDate.toISOString(), // Using same time for end
        userId: user.uid,
        createdAt: new Date()
      });

      setEvents([...events, { id: docRef.id, ...newEvent }]);
      setShowAddEventWindow(false);
      setNewEvent({
        title: '',
        start: '',
        time: '',
        courseMaterial: '',
        eventType: 'other'
      });
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };

  const handleEventDelete = async () => { // 
    if (window.confirm('Are you sure you want to delete this event?')) { // confirms if user wants 
      try { // exception handling
        await deleteDoc(doc(db, 'events', selectedEvent.id));
        setEvents(events.filter(event => event.id !== selectedEvent.id));
        setViewEvent(false);
        setSelectedEvent(null);
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('Failed to delete event');
      }
    }
  };

  const handleSplitMaterial = () => {
    setShowSplitModal(true);
  };

  const handleStudyPlanSubmit = async (studyEvents) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
        // Add all study events to Firestore
        const addedEvents = [];
        for (const event of studyEvents) {
            const docRef = await addDoc(collection(db, 'events'), {
                ...event,
                userId: user.uid,
                createdAt: new Date()
            });
            addedEvents.push({ id: docRef.id, ...event });
        }

        // Update local events state
        setEvents(prevEvents => [...prevEvents, ...addedEvents]);
        
        // Close modals
        setShowSplitModal(false);
        setViewEvent(false);
        
        // Show success message
        alert('Study plan has been created and added to your calendar!');
        
    } catch (error) {
        console.error('Error creating study events:', error);
        alert('Failed to create study events');
    }
  };

  const handleShareCalendar = async () => {
    try {
      if (!selectedFriend) {
        alert('Please select a friend to share with.');
        return;
      }

      console.log(`Sharing calendar with: ${selectedFriend}`);
      setShowShareModal(false);
      alert('Calendar shared successfully!');
    } catch (error) {
      console.error('Error sharing calendar:', error);
      alert('Failed to share calendar.');
    }
  };

  const formatDate = (dateString) => { // formats the date 
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => { // formats the time
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h2>Calendar</h2>
        <button onClick={() => setShowShareModal(true)} className="share-button">
          Share/Merge Calendar
        </button>
      </div>
      <div className="calendar-wrapper">
        <FullCalendar // creates the calendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek'
          }}
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          events={events}
          select={handleDateSelect}
          eventClick={(info) => {
            setSelectedEvent(info.event);
            setViewEvent(true);
          }}
          height="auto"
        />
      </div>

      {showAddEventWindow && ( // window for add event 
        <div className="window-overlay">
          <div className="window-content">
            <h3>Add Event</h3>
            <input
              type="text"
              placeholder="Event Title"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
            />
            <div className="date-time-inputs">
              <div className="date-input-group">
                <label>Date:</label>
                <input
                  type="date"
                  value={newEvent.start.split('T')[0]}
                  onChange={(e) => setNewEvent({ ...newEvent, start: e.target.value })}
                />
              </div>
              <div className="time-input-group">
                <label>Time:</label>
                <input
                  type="time"
                  value={newEvent.time}
                  onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                />
              </div>
            </div>
            <textarea
              placeholder="Add Course Material Here"
              value={newEvent.courseMaterial}
              onChange={(e) => setNewEvent({ ...newEvent, courseMaterial: e.target.value })}
            />
            <select
              value={newEvent.eventType}
              onChange={(e) => setNewEvent({ ...newEvent, eventType: e.target.value })}
            >
              <option value="meeting">Meeting</option>
              <option value="test/exam">Test/Exam</option>
              <option value="assignment">Assignment</option>
              <option value="other">Other</option>
            </select>
            <div className="window-buttons">
              <button onClick={handleEventAdd}>Add</button>
              <button onClick={() => setShowAddEventWindow(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {viewEvent && selectedEvent && ( // window for event details
        <div className="window-overlay">
          <div className="window-content">
            <h3>Event Details</h3>
            <div className="event-details">
              <p><strong>Title:</strong> {selectedEvent.title}</p>
              <p><strong>Date:</strong> {formatDate(selectedEvent.start)}</p>
              <p><strong>Time:</strong> {formatTime(selectedEvent.start)} - {formatTime(selectedEvent.end)}</p>
              <p><strong>Type:</strong> {selectedEvent.extendedProps.eventType}</p>
              <p><strong>Course Material:</strong> {selectedEvent.extendedProps.courseMaterial}</p>
            </div>
            <div className="window-buttons">
              <button className="delete-btn" onClick={handleEventDelete}>
                Delete Event
              </button>
              <button className="split-btn" onClick={handleSplitMaterial}>
                Split Up Course Material
              </button>
              <button onClick={() => setViewEvent(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showSplitModal && selectedEvent && (
        <Split
          onClose={() => setShowSplitModal(false)}
          onSubmit={handleStudyPlanSubmit}
          selectedEvent={selectedEvent}
        />
      )}

      {showShareModal && (
        <div className="modal">
          <h3>Share/Merge Calendar</h3>
          <select
            value={selectedFriend}
            onChange={(e) => setSelectedFriend(e.target.value)}
          >
            <option value="">Select a friend</option>
            {friends.map((friend) => (
              <option key={friend.id} value={friend.id}>
                {friend.name}
              </option>
            ))}
          </select>
          <button onClick={handleShareCalendar}>Share</button>
          <button onClick={() => setShowShareModal(false)}>Cancel</button>
        </div>
      )}
    </div>
  );
}

export default Calendar;