// Search and Friends functionality

let matches = [];
let friends = [];
let suggestions = [];
let friendsCache = new Set();

document.addEventListener('DOMContentLoaded', async () => {
    await loadMatches();
    await loadFriends();
    setupEventListeners();
});

function setupEventListeners() {
    // Search on Enter key
    document.getElementById('searchQuery').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchUsers();
    });

    // Tab switching
    document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
        tab.addEventListener('shown.bs.tab', function(e) {
            if (e.target.id === 'friends-tab') {
                loadFriends();
            } else if (e.target.id === 'suggestions-tab') {
                loadSuggestions();
            }
        });
    });
}

async function loadMatches() {
    try {
        matches = await apiRequest('/api/users/matches');
        await updateFriendsCache();
        displayUsers(matches, 'matchesContainer', true);
    } catch (error) {
        console.error('Error loading matches:', error);
        document.getElementById('matchesContainer').innerHTML = `
            <div class="col-12 text-center py-5 text-danger">
                Error loading matches
            </div>
        `;
    }
}

async function searchUsers() {
    try {
        const query = document.getElementById('searchQuery').value;
        const userType = document.getElementById('userTypeFilter').value;
        const interests = document.getElementById('interestsFilter').value;

        if (!query && !userType && !interests) {
            showAlert('Please enter at least one search criterion', 'warning');
            return;
        }

        let url = '/api/users/search?';
        if (query) url += `query=${encodeURIComponent(query)}&`;
        if (userType) url += `userType=${userType}&`;
        if (interests) url += `interests=${encodeURIComponent(interests)}`;

        const results = await apiRequest(url);
        await updateFriendsCache();
        
        // Format as match objects for consistency
        const formattedResults = results.map(user => ({
            user: user,
            matchScore: 0,
            commonInterests: [],
            commonSkills: []
        }));

        displayUsers(formattedResults, 'searchResults', false);
    } catch (error) {
        console.error('Search error:', error);
        showAlert('Search failed', 'danger');
    }
}

async function loadFriends() {
    try {
        friends = await apiRequest('/api/friends');
        displayFriends(friends, 'friendsContainer');
        await updateFriendsCache();
    } catch (error) {
        console.error('Error loading friends:', error);
        document.getElementById('friendsContainer').innerHTML = `
            <div class="col-12 text-center py-5 text-danger">
                Error loading friends
            </div>
        `;
    }
}

async function loadSuggestions() {
    try {
        suggestions = await apiRequest('/api/friends/suggestions');
        await updateFriendsCache();
        displaySuggestions(suggestions, 'suggestionsContainer');
    } catch (error) {
        console.error('Error loading suggestions:', error);
        document.getElementById('suggestionsContainer').innerHTML = `
            <div class="col-12 text-center py-5 text-danger">
                Error loading suggestions
            </div>
        `;
    }
}

async function updateFriendsCache() {
    try {
        const friendsList = await apiRequest('/api/friends');
        friendsCache = new Set(friendsList.map(f => f._id));
    } catch (error) {
        console.error('Error updating friends cache:', error);
    }
}

function displayUsers(userMatches, containerId, showScore = false) {
    const container = document.getElementById(containerId);

    if (userMatches.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-user-slash fa-4x text-muted mb-3"></i>
                <h5 class="text-muted">No users found</h5>
                <p class="text-muted">Try adjusting your search criteria or complete your profile for better matches</p>
            </div>
        `;
        return;
    }

    container.innerHTML = userMatches.map(match => {
        const user = match.user;
        const isFriend = friendsCache.has(user._id);

        return `
            <div class="col-lg-6 mb-4">
                <div class="user-card">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="d-flex flex-grow-1">
                            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&size=80&background=random" 
                                 alt="${user.name}" class="user-avatar me-3" width="80" height="80">
                            <div class="flex-grow-1">
                                <h6 class="mb-1">${user.name}</h6>
                                <small class="text-muted">${user.userType} ${user.location ? '• ' + user.location : ''}</small>
                                ${user.bio ? `<p class="text-muted small mt-2 mb-2">${user.bio.substring(0, 100)}${user.bio.length > 100 ? '...' : ''}</p>` : ''}
                                
                                <div class="mt-2">
                                    ${showScore && match.commonInterests?.length > 0 ? 
                                        match.commonInterests.slice(0, 3).map(interest => 
                                            `<span class="interest-tag common">${interest}</span>`
                                        ).join('') : 
                                        user.interests?.slice(0, 3).map(interest => 
                                            `<span class="interest-tag">${interest}</span>`
                                        ).join('') || ''
                                    }
                                    ${(showScore ? match.commonInterests?.length > 3 : user.interests?.length > 3) ? 
                                        `<span class="interest-tag">+${(showScore ? match.commonInterests.length : user.interests.length) - 3} more</span>` : ''
                                    }
                                </div>
                            </div>
                        </div>
                        <div class="text-end ms-3">
                            ${showScore ? `<div class="match-score mb-2">${match.matchScore}% Match</div>` : ''}
                            
                            ${isFriend ? 
                                `<button class="btn btn-sm btn-outline-danger mb-2" onclick="removeFriend('${user._id}', '${user.name}')" title="Remove friend">
                                    <i class="fas fa-user-minus"></i> Unfriend
                                </button>` :
                                `<button class="btn btn-sm btn-success mb-2" onclick="addFriend('${user._id}', '${user.name}')" title="Add friend">
                                    <i class="fas fa-user-plus"></i> Add Friend
                                </button>`
                            }
                            
                            <a href="chat.html?user=${user._id}" class="btn btn-sm btn-primary d-block mb-2">
                                <i class="fas fa-comment"></i> Chat
                            </a>
                            
                            <button class="btn btn-sm btn-outline-secondary d-block" onclick="viewUserProfile('${user._id}')">
                                <i class="fas fa-eye"></i> Profile
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function displayFriends(friendsList, containerId) {
    const container = document.getElementById(containerId);

    if (friendsList.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-user-friends fa-4x text-muted mb-3"></i>
                <h5 class="text-muted">No friends yet</h5>
                <p class="text-muted">Start adding friends to build your network!</p>
                <button class="btn btn-primary" onclick="document.getElementById('matches-tab').click()">
                    Find Friends
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = friendsList.map(friend => `
        <div class="col-lg-6 mb-4">
            <div class="user-card">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="d-flex flex-grow-1">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name)}&size=80&background=random" 
                             alt="${friend.name}" class="user-avatar me-3" width="80" height="80">
                        <div class="flex-grow-1">
                            <h6 class="mb-1">
                                ${friend.name}
                                <span class="status-${new Date() - new Date(friend.lastActive) < 300000 ? 'online' : 'offline'}" 
                                      title="${new Date() - new Date(friend.lastActive) < 300000 ? 'Online' : 'Offline'}"></span>
                            </h6>
                            <small class="text-muted">${friend.userType} ${friend.location ? '• ' + friend.location : ''}</small>
                            ${friend.bio ? `<p class="text-muted small mt-2 mb-2">${friend.bio.substring(0, 100)}${friend.bio.length > 100 ? '...' : ''}</p>` : ''}
                            
                            <div class="mt-2">
                                ${friend.interests?.slice(0, 3).map(interest => 
                                    `<span class="interest-tag">${interest}</span>`
                                ).join('') || ''}
                            </div>
                        </div>
                    </div>
                    <div class="text-end ms-3">
                        <button class="btn btn-sm btn-outline-danger mb-2" onclick="removeFriend('${friend._id}', '${friend.name}')">
                            <i class="fas fa-user-minus"></i> Unfriend
                        </button>
                        
                        <a href="chat.html?user=${friend._id}" class="btn btn-sm btn-primary d-block mb-2">
                            <i class="fas fa-comment"></i> Chat
                        </a>
                        
                        <button class="btn btn-sm btn-outline-secondary d-block" onclick="viewUserProfile('${friend._id}')">
                            <i class="fas fa-eye"></i> Profile
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function displaySuggestions(suggestionsList, containerId) {
    const container = document.getElementById(containerId);

    if (suggestionsList.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-lightbulb fa-4x text-muted mb-3"></i>
                <h5 class="text-muted">No suggestions available</h5>
                <p class="text-muted">Add more friends or complete your profile to get better suggestions</p>
            </div>
        `;
        return;
    }

    container.innerHTML = suggestionsList.map(suggestion => {
        const user = suggestion;
        const isFriend = friendsCache.has(user._id);

        return `
            <div class="col-lg-6 mb-4">
                <div class="user-card">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="d-flex flex-grow-1">
                            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&size=80&background=random" 
                                 alt="${user.name}" class="user-avatar me-3" width="80" height="80">
                            <div class="flex-grow-1">
                                <h6 class="mb-1">${user.name}</h6>
                                <small class="text-muted">${user.userType} ${user.location ? '• ' + user.location : ''}</small>
                                
                                ${user.mutualFriends > 0 ? 
                                    `<div class="mt-1 mb-1">
                                        <small class="text-primary">
                                            <i class="fas fa-users"></i> ${user.mutualFriends} mutual friend${user.mutualFriends > 1 ? 's' : ''}
                                        </small>
                                    </div>` : ''
                                }
                                
                                ${user.commonInterests > 0 ? 
                                    `<div class="mb-1">
                                        <small class="text-success">
                                            <i class="fas fa-heart"></i> ${user.commonInterests} common interest${user.commonInterests > 1 ? 's' : ''}
                                        </small>
                                    </div>` : ''
                                }
                                
                                <div class="mt-2">
                                    ${user.interests?.slice(0, 3).map(interest => 
                                        `<span class="interest-tag">${interest}</span>`
                                    ).join('') || ''}
                                </div>
                            </div>
                        </div>
                        <div class="text-end ms-3">
                            ${isFriend ? 
                                '<span class="badge bg-success mb-2"><i class="fas fa-check"></i> Friends</span>' :
                                `<button class="btn btn-sm btn-success mb-2" onclick="addFriend('${user._id}', '${user.name}')">
                                    <i class="fas fa-user-plus"></i> Add Friend
                                </button>`
                            }
                            
                            <a href="chat.html?user=${user._id}" class="btn btn-sm btn-primary d-block mb-2">
                                <i class="fas fa-comment"></i> Chat
                            </a>
                            
                            <button class="btn btn-sm btn-outline-secondary d-block" onclick="viewUserProfile('${user._id}')">
                                <i class="fas fa-eye"></i> Profile
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function addFriend(userId, userName) {
    try {
        await apiRequest(`/api/friends/${userId}`, {
            method: 'POST'
        });

        showAlert(`Added ${userName} as a friend!`, 'success');
        
        // Update cache and refresh displays
        await updateFriendsCache();
        await loadMatches();
        await loadFriends();
        
        // Refresh current tab
        const activeTab = document.querySelector('.nav-link.active').id;
        if (activeTab === 'suggestions-tab') {
            await loadSuggestions();
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function removeFriend(userId, userName) {
    if (!confirm(`Remove ${userName} from your friends?`)) return;

    try {
        await apiRequest(`/api/friends/${userId}`, {
            method: 'DELETE'
        });

        showAlert(`Removed ${userName} from friends`, 'success');
        
        // Update cache and refresh displays
        await updateFriendsCache();
        await loadMatches();
        await loadFriends();
        
        // Refresh current tab
        const activeTab = document.querySelector('.nav-link.active').id;
        if (activeTab === 'suggestions-tab') {
            await loadSuggestions();
        }
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

function viewUserProfile(userId) {
    // For now, just show alert. You can create a profile view modal later
    showAlert('Profile view feature coming soon!', 'info');
    // TODO: Implement user profile modal or page
}