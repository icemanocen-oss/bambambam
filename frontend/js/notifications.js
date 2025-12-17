// Notification helper functions - include in all pages

// Load notification count badge
async function loadNotificationCount() {
    try {
        const data = await apiRequest('/api/notifications/unread-count');
        const badge = document.getElementById('notifBadge');
        
        if (badge) {
            if (data.count > 0) {
                badge.textContent = data.count > 99 ? '99+' : data.count;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error loading notification count:', error);
    }
}

// Setup notification socket listeners
function setupNotificationSocket(socket) {
    if (!socket) return;

    socket.on('new_notification', (notification) => {
        // Update badge
        loadNotificationCount();
        
        // Show browser notification if supported
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('InterestConnect', {
                body: `${notification.sender?.name || 'Someone'} ${notification.content}`,
                icon: 'https://ui-avatars.com/api/?name=IC&background=0d6efd&color=fff'
            });
        }
        
        // Show in-app toast
        showNotificationToast(notification);
    });
}

// Request notification permission
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// Show notification toast
function showNotificationToast(notification) {
    const toast = document.createElement('div');
    toast.className = 'toast show position-fixed bottom-0 end-0 m-3';
    toast.setAttribute('role', 'alert');
    toast.style.zIndex = '9999';
    
    toast.innerHTML = `
        <div class="toast-header bg-primary text-white">
            <i class="fas fa-bell me-2"></i>
            <strong class="me-auto">New Notification</strong>
            <button type="button" class="btn-close btn-close-white" onclick="this.closest('.toast').remove()"></button>
        </div>
        <div class="toast-body">
            <strong>${notification.sender?.name || 'Someone'}</strong> ${notification.content}
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// Initialize on page load
if (isAuthenticated()) {
    document.addEventListener('DOMContentLoaded', () => {
        loadNotificationCount();
        requestNotificationPermission();
    });
}