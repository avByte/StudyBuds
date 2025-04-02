import React, { useState, useEffect } from 'react'; 
import FullCalendar from '@fullcalendar/react'; 
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { auth, db } from './firebase';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import './Calendar.css';
import Split from './Split';
import { getMatches } from './Message';

function Calendar() {
  const [events, setEvents] = useState([]); 
  const [viewEvent, setViewEvent] = useState(false); 
  const [selectedEvent, setSelectedEvent] = useState(null); 
  const [newEvent, setNewEvent] = useState({ 
    title: '',
    start: '',
    end: '',
    courseMaterial: '',
    eventType: 'other'
  });
  const [showAddEventWindow, setShowAddEventWindow] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [shareEmail, setShareEmail] = useState(''); // Email to share the event with
  const [showShareDropdown, setShowShareDropdown] = useState(false);
  const [acceptedMatches, setAcceptedMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCalendarToggle, setShowCalendarToggle] = useState(false);
  const [sharedCalendars, setSharedCalendars] = useState([]);
  const [activeCalendar, setActiveCalendar] = useState(null);
  const [allEvents, setAllEvents] = useState([]);

  useEffect(() => {
    fetchEvents();
    fetchAcceptedMatches();
    fetchSharedCalendars();
  }, []);

  const fetchEvents = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const eventsRef = collection(db, 'events');
        const q = query(eventsRef, where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        
        const eventsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        setEvents(eventsData);
        setAllEvents(eventsData); // Store all events in allEvents state
    } catch (error) {
        console.error('Error fetching events:', error);
    }
  };

  const fetchAcceptedMatches = async () => {
    try {
      const matches = await getMatches();
      // Filter only accepted matches
      const accepted = matches.filter(match => match.status === 'accepted');
      setAcceptedMatches(accepted);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSharedCalendars = async () => {
    const user = auth.currentUser;
    if (!user) {
        console.log('No user logged in');
        return;
    }

    try {
        console.log('Fetching shared calendars for user:', user.uid);
        // Fetch calendars where user is the recipient
        const sharedRef = collection(db, 'sharedCalendars');
        const q = query(sharedRef, where('sharedWith', '==', user.uid));
        const querySnapshot = await getDocs(q);
        
        console.log('Found shared calendars:', querySnapshot.size);
        const calendars = [];
        for (const docSnapshot of querySnapshot.docs) {
            const data = docSnapshot.data();
            console.log('Calendar data:', data);
            const ownerDoc = await getDoc(doc(db, 'users', data.ownerId));
            if (ownerDoc.exists()) {
                calendars.push({
                    id: docSnapshot.id,
                    ownerId: data.ownerId,
                    ownerName: ownerDoc.data().fullName,
                    status: data.status || 'pending',
                    events: data.events || []
                });
            }
        }
        console.log('Processed calendars:', calendars);
        setSharedCalendars(calendars);
    } catch (error) {
        console.error('Error fetching shared calendars:', error);
    }
  };

  const handleDateSelect = (selectInfo) => { 
    setNewEvent({
      ...newEvent,
      start: selectInfo.startStr,
      end: selectInfo.endStr
    });
    setShowAddEventWindow(true);
  };

  const handleEventAdd = async () => { 
    const user = auth.currentUser;
    if (!user) return;

    try {
      const eventDate = new Date(newEvent.start);
      const [hours, minutes] = newEvent.time.split(':');
      eventDate.setHours(parseInt(hours), parseInt(minutes));

      const docRef = await addDoc(collection(db, 'events'), {
        ...newEvent,
        start: eventDate.toISOString(),
        end: eventDate.toISOString(), 
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

  const handleEventDelete = async () => { 
    if (window.confirm('Are you sure you want to delete this event?')) { 
      try { 
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
        const addedEvents = [];
        for (const event of studyEvents) {
            const docRef = await addDoc(collection(db, 'events'), {
                ...event,
                userId: user.uid,
                createdAt: new Date()
            });
            addedEvents.push({ id: docRef.id, ...event });
        }

        setEvents(prevEvents => [...prevEvents, ...addedEvents]);
        setShowSplitModal(false);
        setViewEvent(false);
        alert('Study plan has been created and added to your calendar!');
        
    } catch (error) {
        console.error('Error creating study events:', error);
        alert('Failed to create study events');
    }
  };

  const handleShareEvent = async (eventId) => {
    try {
      const response = await fetch('http://localhost:5000/share-calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          sharedWith: shareEmail
        })
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      alert(data.message);
      setShareEmail(''); 
    } catch (error) {
      console.error('Error sharing event:', error);
      alert('Failed to share the event.');
    }
  };

  const handleShareCalendar = async (friendId) => {
    const user = auth.currentUser;
    if (!user) {
        console.log('No user logged in');
        return;
    }

    try {
        console.log('Sharing calendar with:', friendId);
        // Create a shared calendar document
        const sharedRef = await addDoc(collection(db, 'sharedCalendars'), {
            ownerId: user.uid,
            sharedWith: friendId,
            status: 'pending',
            createdAt: new Date()
        });

        console.log('Created shared calendar document:', sharedRef.id);

        // Share all current events
        const eventsRef = collection(db, 'events');
        const q = query(eventsRef, where('userId', '==', user.uid));
        const userEvents = await getDocs(q);
        
        const events = userEvents.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        console.log('Sharing events:', events.length);

        await updateDoc(doc(db, 'sharedCalendars', sharedRef.id), {
            events: events,
            status: 'pending'
        });

        console.log('Updated shared calendar with events');
        alert('Calendar shared successfully!');
        setShowShareDropdown(false);
        fetchSharedCalendars(); // Refresh the shared calendars list
    } catch (error) {
        console.error('Error sharing calendar:', error);
        alert('Failed to share calendar');
    }
  };

  const handleAcceptSharedCalendar = async (calendarId) => {
    try {
      await updateDoc(doc(db, 'sharedCalendars', calendarId), {
        status: 'accepted'
      });
      fetchSharedCalendars();
    } catch (error) {
      console.error('Error accepting shared calendar:', error);
      alert('Failed to accept shared calendar');
    }
  };

  const handleDeclineSharedCalendar = async (calendarId) => {
    try {
      await deleteDoc(doc(db, 'sharedCalendars', calendarId));
      fetchSharedCalendars();
    } catch (error) {
      console.error('Error declining shared calendar:', error);
      alert('Failed to decline shared calendar');
    }
  };

  const handleToggleCalendar = (calendar) => {
    if (activeCalendar?.id === calendar.id) {
        // If toggling off, just show your own events
        setActiveCalendar(null);
        setEvents(allEvents);
    } else {
        // If toggling on, show your events plus the shared calendar's events
        setActiveCalendar(calendar);
        const sharedEvents = calendar.events.map(event => ({
            ...event,
            backgroundColor: '#dc3545', // Red color for shared events
            borderColor: '#dc3545'
        }));
        setEvents([...allEvents, ...sharedEvents]);
    }
  };

  const formatDate = (dateString) => { 
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => { 
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
        <div className="calendar-actions">
          <div className="calendar-toggle-container">
            <button 
              className="calendar-toggle-btn"
              onClick={() => setShowCalendarToggle(!showCalendarToggle)}
            >
              Calendar Toggle
            </button>
            {showCalendarToggle && (
              <div className="calendar-toggle-dropdown">
                {sharedCalendars.length === 0 ? (
                  <div className="no-shared">No shared calendars</div>
                ) : (
                  sharedCalendars.map(calendar => (
                    <div key={calendar.id} className="shared-calendar-item">
                      <span>{calendar.ownerName}</span>
                      {calendar.status === 'pending' ? (
                        <div className="calendar-actions">
                          <button 
                            className="accept-btn"
                            onClick={() => handleAcceptSharedCalendar(calendar.id)}
                          >
                            Accept
                          </button>
                          <button 
                            className="decline-btn"
                            onClick={() => handleDeclineSharedCalendar(calendar.id)}
                          >
                            Decline
                          </button>
                        </div>
                      ) : (
                        <button 
                          className={`toggle-btn ${activeCalendar?.id === calendar.id ? 'active' : ''}`}
                          onClick={() => handleToggleCalendar(calendar)}
                        >
                          {activeCalendar?.id === calendar.id ? 'Hide' : 'Show'}
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <div className="share-calendar-container">
            <button 
              className="share-calendar-btn"
              onClick={() => setShowShareDropdown(!showShareDropdown)}
            >
              Share Calendar
            </button>
            {showShareDropdown && (
              <div className="share-dropdown">
                {loading ? (
                  <div className="loading">Loading...</div>
                ) : acceptedMatches.length === 0 ? (
                  <div className="no-matches">No accepted matches to share with</div>
                ) : (
                  acceptedMatches.map(match => {
                    const matchedUser = match.users.find(uid => uid !== auth.currentUser?.uid);
                    const userDetails = match.userDetails[matchedUser];
                    return (
                      <button
                        key={match.id}
                        className="friend-share-btn"
                        onClick={() => handleShareCalendar(matchedUser)}
                      >
                        {userDetails.fullName}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="calendar-wrapper">
        <FullCalendar 
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

      {showAddEventWindow && ( 
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

      {viewEvent && selectedEvent && ( 
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

      {selectedEvent && (
        <div className="share-modal">
          <h3>Share Event</h3>
          <input
            type="email"
            placeholder="Enter email to share with"
            value={shareEmail}
            onChange={(e) => setShareEmail(e.target.value)}
          />
          <button onClick={() => handleShareEvent(selectedEvent.id)}>Share</button>
        </div>
      )}
    </div>
  );
}

export default Calendar;