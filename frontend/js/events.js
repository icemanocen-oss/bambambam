// Events page functionality

let allEvents = [];
let myEvents = [];

document.addEventListener('DOMContentLoaded', async () => {
    await loadEvents();
    await loadMyEvents();
    setupEventListeners();
    setMinDateTime();
    
    // Make functions globally available
    window.createEvent = createEvent;
    window.joinEvent = joinEvent;
    window.leaveEvent = leaveEvent;
    window.viewEventDetails = viewEventDetails;
    window.joinEventFromDetails = joinEventFromDetails;
    window.leaveEventFromDetails = leaveEventFromDetails;
});

function setMinDateTime() {
    // Set minimum date to current time
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    const minDateTime = now.toISOString().slice(0, 16);
    
    const dateInput = document.getElementById('eventDate');
    if (dateInput) {
        dateInput.min = minDateTime;
    }
}

function setupEventListeners() {
    // Category and type filters
    document.getElementById('categoryFilter').addEventListener('change', loadEvents);
    document.getElementById('typeFilter').addEventListener('change', loadEvents);

    // Online/Offline toggle
    document.getElementById('isOnline').addEventListener('change', function() {
        const locationField = document.getElementById('locationField');
        const linkField = document.getElementById('linkField');
        
        if (this.checked) {
            locationField.style.display = 'none';
            linkField.style.display = 'block';
            document.getElementById('eventLocation').required = false;
            document.getElementById('meetingLink').required = true;
        } else {
            locationField.style.display = 'block';
            linkField.style.display = 'none';
            document.getElementById('eventLocation').required = true;
            document.getElementById('meetingLink').required = false;
        }
    });

    // Tab switching
    document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
        tab.addEventListener('shown.bs.tab', function(e) {
            if (e.target.id === 'my-tab') {
                loadMyEvents();
            }
        });
    });
    
    // Create Event Button
    const createBtn = document.getElementById('createEventBtn');
    if (createBtn) {
        createBtn.addEventListener('click', createEvent);
    }
}

async function loadEvents() {
    try {
        const category = document.getElementById('categoryFilter').value;
        const isOnline = document.getElementById('typeFilter').value;

        let url = '/api/events?';
        if (category) url += `category=${category}&`;
        if (isOnline) url += `isOnline=${isOnline}`;

        allEvents = await apiRequest(url);
        displayEvents(allEvents, 'eventsContainer');
    } catch (error) {
        console.error('Error loading events:', error);
        showAlert('Error loading events', 'danger');
    }
}

async function loadMyEvents() {
    try {
        myEvents = await apiRequest('/api/events/user/my-events');
        displayEvents(myEvents, 'myEventsContainer', true);
    } catch (error) {
        console.error('Error loading my events:', error);
        document.getElementById('myEventsContainer').innerHTML = `
            <div class="text-center py-5 text-danger">
                Error loading your events
            </div>
        `;
    }
}

function displayEvents(events, containerId, showActions = false) {
    const container = document.getElementById(containerId);
    const currentUserId = getCurrentUser().id;

    if (events.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-calendar-times fa-4x text-muted mb-3"></i>
                <h5 class="text-muted">No events found</h5>
                ${showActions ? 
                    '<p class="text-muted">Create your first event to get started!</p>' :
                    '<p class="text-muted">Try adjusting your filters or create an event</p>'
                }
            </div>
        `;
        return;
    }

    container.innerHTML = events.map(event => {
        const isOrganizer = event.organizer._id === currentUserId;
        const isParticipant = event.participants?.some(p => p._id === currentUserId);
        const isFull = event.participants?.length >= event.maxParticipants;
        const eventDate = new Date(event.date);
        const isPast = eventDate < new Date();

        return `
            <div class="card border-0 shadow-sm mb-3">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-2 text-center">
                            <div class="event-date">
                                <div class="fw-bold" style="font-size: 2rem;">${eventDate.getDate()}</div>
                                <div>${eventDate.toLocaleString('en', {month: 'short'})}</div>
                                <div class="small">${eventDate.toLocaleString('en', {hour: '2-digit', minute: '2-digit'})}</div>
                            </div>
                        </div>
                        <div class="col-md-7">
                            <div class="d-flex align-items-start mb-2">
                                <h5 class="mb-0 me-2">${event.title}</h5>
                                <span class="badge bg-${event.isOnline ? 'info' : 'success'}">
                                    <i class="fas fa-${event.isOnline ? 'video' : 'map-marker-alt'}"></i>
                                    ${event.isOnline ? 'Online' : 'In-Person'}
                                </span>
                                <span class="badge bg-secondary ms-2">${event.category}</span>
                            </div>
                            <p class="text-muted mb-2">${event.description}</p>
                            <div class="d-flex gap-3 text-muted small">
                                <span>
                                    <i class="fas fa-user"></i> ${event.organizer.name}
                                </span>
                                <span>
                                    <i class="fas fa-users"></i> ${event.participants?.length || 0}/${event.maxParticipants}
                                </span>
                                <span>
                                    <i class="fas fa-clock"></i> ${event.duration} min
                                </span>
                                <span>
                                    <i class="fas fa-${event.isOnline ? 'link' : 'map-marker-alt'}"></i> 
                                    ${event.isOnline ? 'Virtual' : event.location}
                                </span>
                            </div>
                        </div>
                        <div class="col-md-3 text-end">
                            ${isPast ? 
                                '<span class="badge bg-secondary">Event Ended</span>' :
                                isOrganizer ? 
                                    '<span class="badge bg-primary mb-2">You\'re hosting</span>' :
                                    isParticipant ? 
                                        `<button class="btn btn-danger btn-sm w-100 mb-2" onclick="leaveEvent('${event._id}')">
                                            <i class="fas fa-sign-out-alt"></i> Leave
                                        </button>` :
                                        isFull ?
                                            '<span class="badge bg-warning">Event Full</span>' :
                                            `<button class="btn btn-success btn-sm w-100 mb-2" onclick="joinEvent('${event._id}')">
                                                <i class="fas fa-plus"></i> Join
                                            </button>`
                            }
                            <button class="btn btn-outline-primary btn-sm w-100" onclick="viewEventDetails('${event._id}')">
                                <i class="fas fa-eye"></i> View Details
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function createEvent() {
    try {
        const isOnline = document.getElementById('isOnline').checked;
        const dateInput = document.getElementById('eventDate').value;
        
        // Validate date
        if (!dateInput) {
            showAlert('Please select a date and time for the event', 'warning');
            return;
        }
        
        // Convert datetime-local format to ISO string
        const eventDate = new Date(dateInput);
        
        // Check if date is valid
        if (isNaN(eventDate.getTime())) {
            showAlert('Invalid date format. Please select a valid date and time', 'warning');
            return;
        }
        
        // Check if date is in the future
        if (eventDate < new Date()) {
            showAlert('Event date must be in the future', 'warning');
            return;
        }

        const eventData = {
            title: document.getElementById('eventTitle').value,
            description: document.getElementById('eventDescription').value,
            category: document.getElementById('eventCategory').value,
            date: eventDate.toISOString(), // Send as ISO string
            duration: parseInt(document.getElementById('eventDuration').value),
            maxParticipants: parseInt(document.getElementById('eventMaxParticipants').value),
            isOnline: isOnline,
            location: isOnline ? 'Online' : document.getElementById('eventLocation').value,
            meetingLink: isOnline ? document.getElementById('meetingLink').value : null
        };

        const result = await apiRequest('/api/events', {
            method: 'POST',
            body: JSON.stringify(eventData)
        });

        // Close modal
        const modalElement = document.getElementById('createEventModal');
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
            modal.hide();
        } else {
            // If instance doesn't exist, create one and hide it
            const newModal = new bootstrap.Modal(modalElement);
            newModal.hide();
        }
        
        // Reset form
        document.getElementById('createEventForm').reset();

        showAlert('Event created successfully!', 'success');
        await loadEvents();
        await loadMyEvents();
    } catch (error) {
        console.error('Create event error:', error);
        showAlert(error.message || 'Failed to create event', 'danger');
    }
}

async function joinEvent(eventId) {
    try {
        await apiRequest(`/api/events/${eventId}/join`, {
            method: 'POST'
        });

        showAlert('Successfully joined the event!', 'success');
        await loadEvents();
        await loadMyEvents();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function leaveEvent(eventId) {
    if (!confirm('Are you sure you want to leave this event?')) return;

    try {
        await apiRequest(`/api/events/${eventId}/leave`, {
            method: 'POST'
        });

        showAlert('Left event successfully', 'success');
        await loadEvents();
        await loadMyEvents();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function viewEventDetails(eventId) {
    try {
        const event = await apiRequest(`/api/events/${eventId}`);
        const currentUserId = getCurrentUser().id;
        const isOrganizer = event.organizer._id === currentUserId;
        const isParticipant = event.participants?.some(p => p._id === currentUserId);
        const isFull = event.participants?.length >= event.maxParticipants;
        const eventDate = new Date(event.date);
        const isPast = eventDate < new Date();

        let actionsHtml = '';
        if (!isPast) {
            if (isOrganizer) {
                actionsHtml = '<span class="badge bg-primary">You are the organizer</span>';
            } else if (isParticipant) {
                actionsHtml = `
                    <button class="btn btn-danger w-100" onclick="leaveEventFromDetails('${event._id}')">
                        <i class="fas fa-sign-out-alt"></i> Leave Event
                    </button>
                `;
            } else if (!isFull) {
                actionsHtml = `
                    <button class="btn btn-success w-100" onclick="joinEventFromDetails('${event._id}')">
                        <i class="fas fa-plus"></i> Join Event
                    </button>
                `;
            } else {
                actionsHtml = '<span class="badge bg-warning">Event is Full</span>';
            }
        }

        const detailsHtml = `
            <div class="row">
                <div class="col-md-8">
                    <h4>${event.title}</h4>
                    <p class="text-muted">${event.description}</p>
                    
                    <div class="mb-3">
                        <h6><i class="fas fa-calendar"></i> When</h6>
                        <p>${eventDate.toLocaleString('en', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}</p>
                        <p class="text-muted">Duration: ${event.duration} minutes</p>
                    </div>
                    
                    <div class="mb-3">
                        <h6><i class="fas fa-${event.isOnline ? 'video' : 'map-marker-alt'}"></i> Where</h6>
                        ${event.isOnline ? 
                            `<p><i class="fas fa-link"></i> Online Event</p>
                             ${event.meetingLink && isParticipant ? 
                                `<a href="${event.meetingLink}" target="_blank" class="btn btn-sm btn-primary">
                                    <i class="fas fa-external-link-alt"></i> Join Meeting
                                </a>` : 
                                isParticipant ? '' : '<p class="text-muted">Meeting link available after joining</p>'
                             }` :
                            `<p><i class="fas fa-map-marker-alt"></i> ${event.location}</p>`
                        }
                    </div>

                    <div class="mb-3">
                        <h6><i class="fas fa-tag"></i> Category</h6>
                        <span class="badge bg-secondary">${event.category}</span>
                    </div>
                </div>
                
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-body">
                            <h6>Event Info</h6>
                            <div class="mb-2">
                                <strong>Organizer:</strong><br>
                                <div class="d-flex align-items-center mt-1">
                                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(event.organizer.name)}&size=30&background=random" 
                                         class="rounded-circle me-2" width="30" height="30">
                                    ${event.organizer.name}
                                </div>
                            </div>
                            <div class="mb-2">
                                <strong>Participants:</strong> ${event.participants?.length || 0}/${event.maxParticipants}
                            </div>
                            <div class="mb-3">
                                <strong>Status:</strong>
                                <span class="badge bg-${isPast ? 'secondary' : event.status === 'upcoming' ? 'success' : 'info'}">
                                    ${isPast ? 'Ended' : event.status}
                                </span>
                            </div>
                            ${actionsHtml}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="mt-4">
                <h5>Participants (${event.participants?.length || 0})</h5>
                <div class="row">
                    ${event.participants?.map(participant => `
                        <div class="col-6 col-md-3 mb-3">
                            <div class="d-flex align-items-center">
                                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(participant.name)}&size=40&background=random" 
                                     alt="${participant.name}" class="rounded-circle me-2" width="40" height="40">
                                <div>
                                    <div class="small fw-bold">${participant.name}</div>
                                    <small class="text-muted">${participant.userType}</small>
                                </div>
                            </div>
                        </div>
                    `).join('') || '<p class="text-muted">No participants yet</p>'}
                </div>
            </div>
        `;

        document.getElementById('eventDetailsTitle').textContent = event.title;
        document.getElementById('eventDetailsContent').innerHTML = detailsHtml;

        const modal = new bootstrap.Modal(document.getElementById('eventDetailsModal'));
        modal.show();
    } catch (error) {
        showAlert('Error loading event details', 'danger');
    }
}

async function joinEventFromDetails(eventId) {
    await joinEvent(eventId);
    const modal = bootstrap.Modal.getInstance(document.getElementById('eventDetailsModal'));
    modal.hide();
}

async function leaveEventFromDetails(eventId) {
    await leaveEvent(eventId);
    const modal = bootstrap.Modal.getInstance(document.getElementById('eventDetailsModal'));
    modal.hide();
}