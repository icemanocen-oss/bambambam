// Authentication helper functions

// Check if user is logged in on page load
function checkAuth() {
    if (!isAuthenticated()) {
        // Redirect to login if on protected page
        const protectedPages = ['dashboard.html', 'profile.html', 'search.html', 'groups.html', 'events.html', 'chat.html'];
        const currentPage = window.location.pathname.split('/').pop();
        
        if (protectedPages.includes(currentPage)) {
            window.location.href = 'login.html';
        }
    }
}

// Initialize authentication check
checkAuth();

// Update user info in navbar/sidebar
function updateUserInfo() {
    const user = getCurrentUser();
    if (!user) return;
    
    const userNameElements = document.querySelectorAll('.user-name');
    const userEmailElements = document.querySelectorAll('.user-email');
    
    userNameElements.forEach(el => el.textContent = user.name);
    userEmailElements.forEach(el => el.textContent = user.email);
}

// Call on page load if on dashboard
if (isAuthenticated()) {
    document.addEventListener('DOMContentLoaded', updateUserInfo);
}
