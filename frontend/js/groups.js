// Groups page functionality

let allGroups = [];
let currentUserGroups = [];

document.addEventListener('DOMContentLoaded', async () => {
    await loadGroups();
    setupEventListeners();
});

function setupEventListeners() {
    // Search input with debounce
    let searchTimeout;
    document.getElementById('searchInput').addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            loadGroups();
        }, 500);
    });

    // Category filter
    document.getElementById('categoryFilter').addEventListener('change', loadGroups);

    // Enter key in search
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            loadGroups();
        }
    });
}

async function loadGroups() {
    try {
        const searchQuery = document.getElementById('searchInput').value;
        const categoryFilter = document.getElementById('categoryFilter').value;
        
        let url = '/api/groups';
        const params = new URLSearchParams();
        
        if (searchQuery) params.append('search', searchQuery);
        if (categoryFilter) params.append('category', categoryFilter);
        
        if (params.toString()) {
            url += '?' + params.toString();
        }

        const groups = await apiRequest(url);
        allGroups = groups;
        
        // Load user's groups for join/leave status
        currentUserGroups = await apiRequest('/api/groups/user/my-groups');
        
        displayGroups(groups);
    } catch (error) {
        console.error('Error loading groups:', error);
        showAlert('Error loading communities', 'danger');
    }
}

function displayGroups(groups) {
    const container = document.getElementById('groupsContainer');
    
    if (groups.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-users fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">No communities found</h5>
                <p class="text-muted">Try adjusting your search or create a new community</p>
                <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#createGroupModal">
                    Create Community
                </button>
            </div>
        `;
        return;
    }

    container.innerHTML = groups.map(group => {
        const isMember = currentUserGroups.some(g => g._id === group._id);
        const isCreator = group.creator._id === getCurrentUser().id;
        const memberCount = group.members?.length || 0;
        
        return `
            <div class="col-lg-4 col-md-6 mb-4">
                <div class="card border-0 shadow-sm h-100">
                    <div class="card-header bg-primary text-white">
                        <div class="d-flex justify-content-between align-items-start">
                            <h6 class="mb-0">${group.name}</h6>
                            <span class="badge bg-light text-dark">${group.category}</span>
                        </div>
                    </div>
                    <div class="card-body d-flex flex-column">
                        <p class="card-text flex-grow-1">${group.description}</p>
                        
                        <div class="mb-3">
                            ${group.interests?.slice(0, 3).map(interest => 
                                `<span class="interest-tag">${interest}</span>`
                            ).join('')}
                            ${group.interests?.length > 3 ? 
                                `<span class="interest-tag">+${group.interests.length - 3} more</span>` : ''
                            }
                        </div>
                        
                        <div class="d-flex justify-content-between align-items-center text-muted small mb-3">
                            <span>
                                <i class="fas fa-users"></i> ${memberCount}/${group.maxMembers} members
                            </span>
                            <span>
                                <i class="fas fa-user"></i> ${group.creator.name}
                            </span>
                        </div>
                        
                        <div class="d-flex gap-2">
                            <button class="btn btn-sm btn-outline-primary flex-fill" onclick="viewGroupDetails('${group._id}')">
                                <i class="fas fa-eye"></i> View Details
                            </button>
                            ${!isMember && !isCreator ? 
                                `<button class="btn btn-sm btn-success flex-fill" onclick="joinGroup('${group._id}')">
                                    <i class="fas fa-plus"></i> JOIN COMMUNITY
                                </button>` : ''
                            }
                            ${isMember && !isCreator ? 
                                `<button class="btn btn-sm btn-danger flex-fill" onclick="leaveGroup('${group._id}')">
                                    <i class="fas fa-sign-out-alt"></i> Leave
                                </button>` : ''
                            }
                            ${isCreator ? 
                                `<button class="btn btn-sm btn-secondary flex-fill" disabled>
                                    <i class="fas fa-crown"></i> Creator
                                </button>` : ''
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function createGroup() {
    try {
        const interests = document.getElementById('groupInterests').value
            .split(',')
            .map(i => i.trim())
            .filter(i => i);

        const groupData = {
            name: document.getElementById('groupName').value,
            description: document.getElementById('groupDescription').value,
            category: document.getElementById('groupCategory').value,
            interests: interests,
            maxMembers: parseInt(document.getElementById('maxMembers').value),
            isPrivate: document.getElementById('isPrivate').checked
        };

        const result = await apiRequest('/api/groups', {
            method: 'POST',
            body: JSON.stringify(groupData)
        });

        // Close modal and reset form
        const modal = bootstrap.Modal.getInstance(document.getElementById('createGroupModal'));
        modal.hide();
        document.getElementById('createGroupForm').reset();

        showAlert('Community created successfully!', 'success');
        await loadGroups();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function joinGroup(groupId) {
    try {
        await apiRequest(`/api/groups/${groupId}/join`, {
            method: 'POST'
        });

        showAlert('Successfully joined the community!', 'success');
        await loadGroups();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function leaveGroup(groupId) {
    if (!confirm('Are you sure you want to leave this community?')) return;

    try {
        await apiRequest(`/api/groups/${groupId}/leave`, {
            method: 'POST'
        });

        showAlert('Left community successfully', 'success');
        await loadGroups();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function viewGroupDetails(groupId) {
    try {
        const group = await apiRequest(`/api/groups/${groupId}`);
        
        const isMember = currentUserGroups.some(g => g._id === group._id);
        const isCreator = group.creator._id === getCurrentUser().id;

        let actionsHtml = '';
        if (!isMember && !isCreator) {
            actionsHtml = `<button class="btn btn-success w-100" onclick="joinGroupFromDetails('${group._id}')">
                <i class="fas fa-plus"></i> JOIN COMMUNITY
            </button>`;
        } else if (isMember && !isCreator) {
            actionsHtml = `<button class="btn btn-danger w-100" onclick="leaveGroupFromDetails('${group._id}')">
                <i class="fas fa-sign-out-alt"></i> Leave Community
            </button>`;
        }

        const detailsHtml = `
            <div class="row">
                <div class="col-md-8">
                    <h4>${group.name}</h4>
                    <p class="text-muted">${group.description}</p>
                    
                    <div class="mb-3">
                        <strong>Category:</strong>
                        <span class="badge bg-primary ms-2">${group.category}</span>
                    </div>
                    
                    <div class="mb-3">
                        <strong>Interests:</strong>
                        <div class="mt-1">
                            ${group.interests?.map(interest => 
                                `<span class="interest-tag">${interest}</span>`
                            ).join('')}
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <strong>Privacy:</strong>
                        <span class="badge ${group.isPrivate ? 'bg-warning' : 'bg-success'} ms-2">
                            ${group.isPrivate ? 'Private' : 'Public'}
                        </span>
                    </div>
                </div>
                
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-body">
                            <h6>Community Info</h6>
                            <div class="mb-2">
                                <i class="fas fa-users text-primary"></i>
                                <strong> ${group.members?.length || 0}/${group.maxMembers} members</strong>
                            </div>
                            <div class="mb-2">
                                <i class="fas fa-user text-success"></i>
                                <strong> Creator:</strong> ${group.creator.name}
                            </div>
                            <div class="mb-3">
                                <i class="fas fa-calendar text-info"></i>
                                <strong> Created:</strong> ${formatDate(group.createdAt)}
                            </div>
                            ${actionsHtml}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="mt-4">
                <h5>Members (${group.members?.length || 0})</h5>
                <div class="row">
                    ${group.members?.slice(0, 12).map(member => `
                        <div class="col-6 col-md-3 mb-2">
                            <div class="d-flex align-items-center">
                                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&size=40&background=random" 
                                     alt="${member.name}" class="rounded-circle me-2">
                                <div>
                                    <div class="small">${member.name}</div>
                                    <small class="text-muted">${member.userType}</small>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                    ${group.members?.length > 12 ? `
                        <div class="col-12">
                            <small class="text-muted">+${group.members.length - 12} more members</small>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        document.getElementById('groupDetailsTitle').textContent = group.name;
        document.getElementById('groupDetailsContent').innerHTML = detailsHtml;
        
        const modal = new bootstrap.Modal(document.getElementById('groupDetailsModal'));
        modal.show();
    } catch (error) {
        showAlert('Error loading community details', 'danger');
    }
}

async function joinGroupFromDetails(groupId) {
    await joinGroup(groupId);
    const modal = bootstrap.Modal.getInstance(document.getElementById('groupDetailsModal'));
    modal.hide();
}

async function leaveGroupFromDetails(groupId) {
    await leaveGroup(groupId);
    const modal = bootstrap.Modal.getInstance(document.getElementById('groupDetailsModal'));
    modal.hide();
}