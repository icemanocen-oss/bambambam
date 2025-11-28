// Profile page functionality

let currentProfile = null;

document.addEventListener('DOMContentLoaded', async () => {
    await loadProfile();
    setupEventListeners();
});

async function loadProfile() {
    try {
        currentProfile = await apiRequest('/api/users/profile');
        displayProfile(currentProfile);
        loadMyGroups();
    } catch (error) {
        console.error('Error loading profile:', error);
        showAlert('Error loading profile', 'danger');
    }
}

function displayProfile(profile) {
    // Update profile card
    document.getElementById('displayName').textContent = profile.name;
    document.getElementById('displayEmail').textContent = profile.email;
    document.getElementById('displayUserType').textContent = profile.userType.charAt(0).toUpperCase() + profile.userType.slice(1);
    document.getElementById('joinedDate').textContent = formatDate(profile.createdAt);
    document.getElementById('lastActive').textContent = timeAgo(profile.lastActive);
    
    // Update profile image
    document.getElementById('profileImage').src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&size=150&background=random`;
    
    // Fill form
    document.getElementById('name').value = profile.name || '';
    document.getElementById('age').value = profile.age || '';
    document.getElementById('userType').value = profile.userType || 'student';
    document.getElementById('location').value = profile.location || '';
    document.getElementById('bio').value = profile.bio || '';
    document.getElementById('interests').value = profile.interests?.join(', ') || '';
    document.getElementById('skills').value = profile.skills?.join(', ') || '';
    
    // Privacy settings
    document.getElementById('showEmail').checked = profile.privacySettings?.showEmail || false;
    document.getElementById('showAge').checked = profile.privacySettings?.showAge !== false;
    document.getElementById('showLocation').checked = profile.privacySettings?.showLocation !== false;
    
    // Display tags
    displayTags(profile.interests, 'interestTags');
    displayTags(profile.skills, 'skillTags');
}

function displayTags(items, containerId) {
    const container = document.getElementById(containerId);
    if (!items || items.length === 0) {
        container.innerHTML = '<small class="text-muted">No items added yet</small>';
        return;
    }
    
    container.innerHTML = items.map(item => 
        `<span class="interest-tag">${item}</span>`
    ).join('');
}

function setupEventListeners() {
    // Update tags on input
    document.getElementById('interests').addEventListener('input', (e) => {
        const interests = e.target.value.split(',').map(i => i.trim()).filter(i => i);
        displayTags(interests, 'interestTags');
    });
    
    document.getElementById('skills').addEventListener('input', (e) => {
        const skills = e.target.value.split(',').map(s => s.trim()).filter(s => s);
        displayTags(skills, 'skillTags');
    });
    
    // Profile form submit
    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await updateProfile();
    });
}

async function updateProfile() {
    try {
        const interests = document.getElementById('interests').value
            .split(',')
            .map(i => i.trim())
            .filter(i => i);
        
        const skills = document.getElementById('skills').value
            .split(',')
            .map(s => s.trim())
            .filter(s => s);
        
        const data = {
            name: document.getElementById('name').value,
            age: parseInt(document.getElementById('age').value),
            userType: document.getElementById('userType').value,
            location: document.getElementById('location').value,
            bio: document.getElementById('bio').value,
            interests,
            skills
        };
        
        const result = await apiRequest('/api/users/profile', {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        
        // Update stored user data
        const user = getCurrentUser();
        user.name = result.user.name;
        localStorage.setItem('user', JSON.stringify(user));
        
        showAlert('Profile updated successfully!', 'success');
        await loadProfile();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function updatePrivacy() {
    try {
        const privacySettings = {
            showEmail: document.getElementById('showEmail').checked,
            showAge: document.getElementById('showAge').checked,
            showLocation: document.getElementById('showLocation').checked
        };
        
        await apiRequest('/api/users/profile', {
            method: 'PUT',
            body: JSON.stringify({ privacySettings })
        });
        
        showAlert('Privacy settings updated!', 'success');
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}

async function loadMyGroups() {
    try {
        const groups = await apiRequest('/api/groups/user/my-groups');
        const container = document.getElementById('groupsContainer');
        
        if (groups.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-users fa-3x text-muted mb-3"></i>
                    <p class="text-muted">You haven't joined any groups yet.</p>
                    <a href="groups.html" class="btn btn-primary btn-sm">Browse Groups</a>
                </div>
            `;
            return;
        }
        
        container.innerHTML = groups.map(group => `
            <div class="group-card mb-3">
                <div class="group-header">
                    <h6 class="mb-0">${group.name}</h6>
                    <small>${group.members?.length || 0} members</small>
                </div>
                <div class="p-3">
                    <p class="text-muted small mb-2">${group.description}</p>
                    <div class="d-flex gap-2">
                        <button class="btn btn-sm btn-outline-primary" onclick="window.location.href='groups.html?id=${group._id}'">
                            View Group
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="leaveGroup('${group._id}')">
                            Leave
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading groups:', error);
    }
}

async function leaveGroup(groupId) {
    if (!confirm('Are you sure you want to leave this group?')) return;
    
    try {
        await apiRequest(`/api/groups/${groupId}/leave`, {
            method: 'POST'
        });
        
        showAlert('Left group successfully', 'success');
        await loadMyGroups();
    } catch (error) {
        showAlert(error.message, 'danger');
    }
}
