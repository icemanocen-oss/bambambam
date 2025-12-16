// Chat functionality with Socket.IO

let socket;
let currentConversation = null;
let conversations = [];
let onlineUsers = new Set();
let typingTimeout;

document.addEventListener('DOMContentLoaded', async () => {
    await initializeSocket();
    await loadConversations();
    setupEventListeners();
    
    // Check if user ID in URL query
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('user');
    if (userId) {
        openConversation(userId);
    }
});

function initializeSocket() {
    return new Promise((resolve, reject) => {
        try {
            socket = io(API_BASE_URL, {
                auth: {
                    token: getToken()
                }
            });

            socket.on('connect', () => {
                console.log('Socket connected');
                resolve();
            });

            socket.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
                reject(error);
            });

            // Handle incoming messages
            socket.on('new_message', (message) => {
                handleNewMessage(message);
            });

            // Handle user online status
            socket.on('user_online', (data) => {
                onlineUsers.add(data.userId);
                updateOnlineStatus(data.userId, true);
            });

            socket.on('user_offline', (data) => {
                onlineUsers.delete(data.userId);
                updateOnlineStatus(data.userId, false);
            });

            // Handle typing indicator
            socket.on('user_typing', (data) => {
                if (currentConversation && data.userId === currentConversation._id) {
                    showTypingIndicator(data.isTyping);
                }
            });

            socket.on('message_sent', (message) => {
                appendMessage(message, true);
            });

        } catch (error) {
            console.error('Socket initialization error:', error);
            reject(error);
        }
    });
}

function setupEventListeners() {
    // Search conversations
    document.getElementById('searchConversations').addEventListener('input', (e) => {
        filterConversations(e.target.value);
    });
}

async function loadConversations() {
    try {
        conversations = await apiRequest('/api/messages/conversations');
        displayConversations(conversations);
    } catch (error) {
        console.error('Error loading conversations:', error);
        document.getElementById('conversationsList').innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-exclamation-circle text-danger fa-3x mb-3"></i>
                <p class="text-muted">Error loading conversations</p>
            </div>
        `;
    }
}

function displayConversations(convs) {
    const container = document.getElementById('conversationsList');
    
    if (convs.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
                <p class="text-muted">No conversations yet</p>
                <a href="search.html" class="btn btn-primary btn-sm">Find Partners</a>
            </div>
        `;
        return;
    }

    container.innerHTML = convs.map(conv => {
        const isOnline = onlineUsers.has(conv.user._id);
        const lastMessage = conv.lastMessage?.content || 'No messages yet';
        const truncated = lastMessage.length > 50 ? lastMessage.substring(0, 50) + '...' : lastMessage;
        
        return `
            <div class="conversation-item" onclick="openConversation('${conv.user._id}')">
                <div class="d-flex align-items-start">
                    <div class="position-relative">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(conv.user.name)}&size=50&background=random" 
                             alt="${conv.user.name}" class="rounded-circle me-3" width="50" height="50">
                        <span class="online-status ${isOnline ? 'online' : 'offline'} position-absolute" 
                              style="bottom: 5px; right: 15px;"></span>
                    </div>
                    <div class="flex-grow-1">
                        <div class="d-flex justify-content-between">
                            <h6 class="mb-1">${conv.user.name}</h6>
                            <small class="text-muted">${timeAgo(conv.lastMessage?.createdAt)}</small>
                        </div>
                        <p class="text-muted small mb-0">${truncated}</p>
                        ${conv.unreadCount > 0 ? `
                            <span class="badge bg-primary mt-1">${conv.unreadCount} new</span>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function filterConversations(query) {
    if (!query) {
        displayConversations(conversations);
        return;
    }

    const filtered = conversations.filter(conv => 
        conv.user.name.toLowerCase().includes(query.toLowerCase())
    );
    displayConversations(filtered);
}

async function openConversation(userId) {
    try {
        // Get user info
        const user = await apiRequest(`/api/users/${userId}`);
        currentConversation = user;

        // Load messages
        const messages = await apiRequest(`/api/messages/conversation/${userId}`);

        // Update UI
        displayChatArea(user, messages);
        highlightConversation(userId);

        // Reload conversations to update unread count
        await loadConversations();

    } catch (error) {
        console.error('Error opening conversation:', error);
        showAlert('Error loading conversation', 'danger');
    }
}

function displayChatArea(user, messages) {
    const isOnline = onlineUsers.has(user._id);
    const currentUserId = getCurrentUser().id;

    document.getElementById('chatMain').innerHTML = `
        <div class="chat-header">
            <div class="d-flex align-items-center justify-content-between">
                <div class="d-flex align-items-center">
                    <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&size=50&background=random" 
                         alt="${user.name}" class="rounded-circle me-3" width="50" height="50">
                    <div>
                        <h6 class="mb-0">${user.name}</h6>
                        <small class="text-muted">
                            <span class="online-status ${isOnline ? 'online' : 'offline'}"></span>
                            ${isOnline ? 'Online' : 'Offline'}
                        </small>
                    </div>
                </div>
                <div>
                    <a href="profile.html?user=${user._id}" class="btn btn-sm btn-outline-primary">
                        <i class="fas fa-user"></i> View Profile
                    </a>
                </div>
            </div>
        </div>

        <div class="chat-messages" id="chatMessages">
            ${messages.map(msg => {
                const isSent = msg.sender._id === currentUserId;
                return `
                    <div class="message ${isSent ? 'sent' : 'received'}">
                        <div class="message-bubble">
                            <div>${msg.content}</div>
                            <small class="text-muted d-block mt-1" style="font-size: 0.75rem;">
                                ${timeAgo(msg.createdAt)}
                            </small>
                        </div>
                    </div>
                `;
            }).join('')}
            <div id="typingIndicator" class="typing-indicator" style="display: none;">
                ${user.name} is typing...
            </div>
        </div>

        <div class="chat-input-container">
            <form id="messageForm" onsubmit="sendMessage(event)">
                <div class="input-group">
                    <input type="text" class="form-control" id="messageInput" 
                           placeholder="Type a message..." required autocomplete="off">
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-paper-plane"></i> Send
                    </button>
                </div>
            </form>
        </div>
    `;

    // Scroll to bottom
    scrollToBottom();

    // Setup typing indicator
    document.getElementById('messageInput').addEventListener('input', handleTyping);
}

function handleTyping() {
    if (!currentConversation) return;

    // Clear existing timeout
    clearTimeout(typingTimeout);

    // Emit typing start
    socket.emit('typing', {
        receiverId: currentConversation._id,
        isTyping: true
    });

    // Set timeout to emit typing stop
    typingTimeout = setTimeout(() => {
        socket.emit('typing', {
            receiverId: currentConversation._id,
            isTyping: false
        });
    }, 1000);
}

function showTypingIndicator(isTyping) {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.style.display = isTyping ? 'block' : 'none';
        if (isTyping) scrollToBottom();
    }
}

async function sendMessage(event) {
    event.preventDefault();

    const input = document.getElementById('messageInput');
    const content = input.value.trim();

    if (!content || !currentConversation) return;

    try {
        // Send via socket
        socket.emit('send_message', {
            receiverId: currentConversation._id,
            content: content
        });

        // Clear input
        input.value = '';

        // Stop typing indicator
        socket.emit('typing', {
            receiverId: currentConversation._id,
            isTyping: false
        });

    } catch (error) {
        console.error('Error sending message:', error);
        showAlert('Failed to send message', 'danger');
    }
}

function handleNewMessage(message) {
    const currentUserId = getCurrentUser().id;

    // If message is for current conversation, append it
    if (currentConversation && 
        (message.sender._id === currentConversation._id || 
         message.receiver?._id === currentConversation._id)) {
        appendMessage(message, message.sender._id === currentUserId);
    }

    // Reload conversations to update list
    loadConversations();
}

function appendMessage(message, isSent) {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;

    const messageHtml = `
        <div class="message ${isSent ? 'sent' : 'received'}">
            <div class="message-bubble">
                <div>${message.content}</div>
                <small class="text-muted d-block mt-1" style="font-size: 0.75rem;">
                    ${timeAgo(message.createdAt)}
                </small>
            </div>
        </div>
    `;

    // Remove typing indicator before appending
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.style.display = 'none';
    }

    messagesContainer.insertAdjacentHTML('beforeend', messageHtml);
    scrollToBottom();
}

function scrollToBottom() {
    const messagesContainer = document.getElementById('chatMessages');
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

function highlightConversation(userId) {
    document.querySelectorAll('.conversation-item').forEach(item => {
        item.classList.remove('active');
    });

    const activeItem = document.querySelector(`.conversation-item[onclick*="${userId}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }
}

function updateOnlineStatus(userId, isOnline) {
    // Update in conversations list
    document.querySelectorAll('.conversation-item').forEach(item => {
        if (item.onclick && item.onclick.toString().includes(userId)) {
            const statusIndicator = item.querySelector('.online-status');
            if (statusIndicator) {
                statusIndicator.classList.remove('online', 'offline');
                statusIndicator.classList.add(isOnline ? 'online' : 'offline');
            }
        }
    });

    // Update in chat header if current conversation
    if (currentConversation && currentConversation._id === userId) {
        const headerStatus = document.querySelector('.chat-header .online-status');
        const headerText = document.querySelector('.chat-header small.text-muted');
        
        if (headerStatus) {
            headerStatus.classList.remove('online', 'offline');
            headerStatus.classList.add(isOnline ? 'online' : 'offline');
        }
        
        if (headerText) {
            headerText.innerHTML = `
                <span class="online-status ${isOnline ? 'online' : 'offline'}"></span>
                ${isOnline ? 'Online' : 'Offline'}
            `;
        }
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (socket) {
        socket.disconnect();
    }
});