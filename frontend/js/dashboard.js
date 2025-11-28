// Dashboard functionality

document.addEventListener('DOMContentLoaded', async () => {
    await loadDashboardData();
});

async function loadDashboardData() {
    try {
        // Load matches
        loadMatches();
        
        // Load recommended groups
        loadRecommendedGroups();
        
        // Load upcoming events
        loadUpcomingEvents();
        
        // Load stats
        loadStats();
        
        // Load unread message count
        loadUnreadCount();
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showAlert('Error loading dashboard data', 'danger');
    }
}

async function loadMatches() {
    try {
        const matches = await apiRequest('/api/users/matches');
        const container = document.getElementById('matchesContainer');
        
        if (matches.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-user-friends fa-3x text-muted mb-3"></i>
                    <p class="text-muted">No matches found yet. Complete your profile to get better matches!</p>
                    <a href="profile.html" class="btn btn-primary btn-sm">Update Profile</a>
                </div>
            `;
            return;
        }
        
        container.innerHTML = matches.slice(0, 3).map(match => `
            <div class="user-card mb-3">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="d-flex">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(match.user.name)}&background=random" 
                             alt="${match.user.name}" class="user-avatar me-3">
                        <div>
                            <h6 class="mb-1">${match.user.name}</h6>
                            <small class="text-muted">${match.user.userType}</small>
                            <div class="mt-2">
                                ${match.commonInterests.slice(0, 3).map(interest => 
                                    `<span class="interest-tag common">${interest}</span>`
                                ).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="text-end">
                        <div class="match-score mb-2">${match.matchScore}% Match</div>
                        <a href="chat.html?user=${match.user._id}" class="btn btn-sm btn-primary">
                            <i class="fas fa-comment"></i> Chat
                        </a>
                    </div>
                </div>
            </div>
        `).join('');
        
        document.getElementById('matchCount').textContent = matches.length;
    } catch (error) {
        console.error('Error loading matches:', error);
        document.getElementById('matchesContainer').innerHTML = `
            <p class="text-danger">Error loading matches</p>
        `;
    }
}

async function loadRecommendedGroups() {
    try {
        const recommendations = await apiRequest('/api/groups/recommendations');
        const container = document.getElementById('groupsContainer');
        
        if (recommendations.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-users fa-3x text-muted mb-3"></i>
                    <p class="text-muted">No group recommendations yet.</p>
                    <a href="groups.html" class="btn btn-success btn-sm">Browse All Groups</a>
                </div>
            `;
            return;
        }
        
        container.innerHTML = recommendations.slice(0, 3).map(rec => `
            <div class="group-card mb-3">
                <div class="group-header">
                    <h6 class="mb-0">${rec.group.name}</h6>
                    <small>${rec.group.members?.length || 0} members</small>
                </div>
                <div class="p-3">
                    <p class="text-muted small mb-2">${rec.group.description}</p>
                    <div class="mb-2">
                        ${rec.matchedInterests.map(interest => 
                            `<span class="interest-tag common">${interest}</span>`
                        ).join('')}
                    </div>
                    <button class="btn btn-sm btn-success w-100" onclick="joinGroup('${rec.group._id}')">
                        <i class="fas fa-plus"></i> Join Group
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading groups:', error);
        document.getElementById('groupsContainer').innerHTML = `
            <p class="text-danger">Error loading groups</p>
        `;
    }
}

async function loadUpcomingEvents() {
    try {
        const events = await apiRequest('/api/events');
        const container = document.getElementById('eventsContainer');
        
        if (events.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-calendar fa-3x text-muted mb-3"></i>
                    <p class="text-muted">No upcoming events.</p>
                    <a href="events.html" class="btn btn-warning btn-sm">Browse Events</a>
                </div>
            `;
            return;
        }
        
        container.innerHTML = events.slice(0, 3).map(event => `
            <div class="event-card">
                <div class="d-flex">
                    <div class="event-date me-3">
                        <div class="fw-bold">${new Date(event.date).getDate()}</div>
                        <div class="small">${new Date(event.date).toLocaleString('en', {month: 'short'})}</div>
                    </div>
                    <div class="flex-grow-1">
                        <h6 class="mb-1">${event.title}</h6>
                        <p class="text-muted small mb-2">${event.description}</p>
                        <div class="d-flex gap-2">
                            <small class="text-muted">
                                <i class="fas fa-map-marker-alt"></i> ${event.location}
                            </small>
                            <small class="text-muted">
                                <i class="fas fa-users"></i> ${event.participants?.length || 0}/${event.maxParticipants}
                            </small>
                            <small class="text-muted">
                                <i class="fas fa-clock"></i> ${new Date(event.date).toLocaleString()}
                            </small>
                        </div>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-outline-primary" onclick="joinEvent('${event._id}')">
                            Join
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        document.getElementById('eventCount').textContent = events.length;
    } catch (error) {
        console.error('Error loading events:', error);
        document.getElementById('eventsContainer').innerHTML = `
            <p class="text-danger">Error loading events</p>
        `;
    }
}

async function loadStats() {
    try {
        const [groups, events] = await Promise.all([
            apiRequest('/api/groups/user/my-groups'),
            apiRequest('/api/events/user/my-events')
        ]);
        
        document.getElementById('groupCount').textContent = groups.length;
        document.getElementById('eventCount').textContent = events.length;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadUnreadCount() {
    try {
        const data = await apiRequest('/api/messages/unread-count');
        const badge = document.getElementById('unreadBadge');
        const messageCount = document.getElementById('messageCount');
        
        if (data.count > 0) {
            badge.textContent = data.count;
            badge.style.display = 'inline-block';
        }
        
        messageCount.textContent = data.count;
    } catch (error) {
        console.error('Error loading unread count:', error);
    }
}

async function joinGroup(groupId) {
    try {
        await apiRequest(`/api/groups/${groupId}/join`, {
            method: 'POST'
        });
        
        showAlert('Successfully joined the group!', 'success');
        loadRecommendedGroups();
        loadStats();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function joinEvent(eventId) {
    try {
        await apiRequest(`/api/events/${eventId}/join`, {
            method: 'POST'
        });
        
        showAlert('Successfully joined the event!', 'success');
        loadUpcomingEvents();
        loadStats();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}
