// Posts functionality
let posts = [];
let currentPage = 1;
let totalPages = 1;
let socket;

document.addEventListener('DOMContentLoaded', async () => {
    await loadPosts();
    setupEventListeners();
    initializeSocket();
});

function initializeSocket() {
    socket = io(API_BASE_URL, {
        auth: { token: getToken() }
    });

    socket.on('connect', () => {
        console.log('Socket connected for posts');
    });

    socket.on('new_notification', (notification) => {
        // Refresh notification badge
        loadNotificationCount();
    });
}

function setupEventListeners() {
    // Character count
    document.getElementById('postContent').addEventListener('input', (e) => {
        const count = e.target.value.length;
        document.getElementById('charCount').textContent = `${count}/5000`;
    });

    // Create post
    document.getElementById('createPostForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await createPost();
    });
}

async function loadPosts() {
    try {
        const data = await apiRequest(`/api/posts?page=${currentPage}&limit=10`);
        
        if (currentPage === 1) {
            posts = data.posts;
        } else {
            posts = [...posts, ...data.posts];
        }
        
        totalPages = data.pagination.pages;
        
        displayPosts(posts);
        
        // Show/hide load more button
        const loadMoreBtn = document.getElementById('loadMoreContainer');
        if (currentPage < totalPages) {
            loadMoreBtn.style.display = 'block';
        } else {
            loadMoreBtn.style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading posts:', error);
        showAlert('Error loading posts', 'danger');
    }
}

function displayPosts(postList) {
    const container = document.getElementById('postsContainer');
    const currentUser = getCurrentUser();

    if (postList.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-newspaper fa-4x text-muted mb-3"></i>
                <h5 class="text-muted">No posts yet</h5>
                <p class="text-muted">Be the first to share something!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = postList.map(post => {
        const isLiked = post.likes?.some(like => like._id === currentUser.id);
        const isAuthor = post.author._id === currentUser.id;
        
        return `
            <div class="post-card" id="post-${post._id}">
                <div class="post-header">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="d-flex align-items-center">
                            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(post.author.name)}&size=50&background=random" 
                                 alt="${post.author.name}" class="rounded-circle me-3" width="50" height="50">
                            <div>
                                <h6 class="mb-0">${post.author.name}</h6>
                                <small class="text-muted">${timeAgo(post.createdAt)}</small>
                            </div>
                        </div>
                        ${isAuthor ? `
                            <div class="dropdown">
                                <button class="btn btn-sm btn-link text-muted" data-bs-toggle="dropdown">
                                    <i class="fas fa-ellipsis-v"></i>
                                </button>
                                <ul class="dropdown-menu">
                                    <li><a class="dropdown-item text-danger" href="#" onclick="deletePost('${post._id}')">
                                        <i class="fas fa-trash"></i> Delete
                                    </a></li>
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="post-content">
                    <p class="mb-0" style="white-space: pre-wrap;">${post.content}</p>
                    ${post.image ? `<img src="${post.image}" class="img-fluid mt-3 rounded" alt="Post image">` : ''}
                </div>
                
                <div class="post-actions">
                    <button class="post-action-btn ${isLiked ? 'active' : ''}" onclick="toggleLike('${post._id}')">
                        <i class="fas fa-heart"></i> <span id="likes-${post._id}">${post.likes?.length || 0}</span>
                    </button>
                    <button class="post-action-btn" onclick="toggleComments('${post._id}')">
                        <i class="fas fa-comment"></i> ${post.comments?.length || 0}
                    </button>
                </div>
                
                <div class="comment-section" id="comments-${post._id}" style="display: none;">
                    <div id="comment-list-${post._id}">
                        ${(post.comments || []).map(comment => `
                            <div class="comment">
                                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author.name)}&size=40&background=random" 
                                     alt="${comment.author.name}" class="rounded-circle" width="40" height="40">
                                <div class="comment-content">
                                    <strong>${comment.author.name}</strong>
                                    <small class="text-muted ms-2">${timeAgo(comment.createdAt)}</small>
                                    <p class="mb-0 mt-1">${comment.content}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <form onsubmit="addComment(event, '${post._id}')" class="mt-3">
                        <div class="input-group">
                            <input type="text" class="form-control" placeholder="Write a comment..." 
                                   id="comment-input-${post._id}" required>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }).join('');
}

async function createPost() {
    try {
        const content = document.getElementById('postContent').value.trim();
        
        if (!content) {
            showAlert('Please enter some content', 'warning');
            return;
        }

        const postBtn = document.getElementById('postBtn');
        postBtn.disabled = true;
        postBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Posting...';

        const result = await apiRequest('/api/posts', {
            method: 'POST',
            body: JSON.stringify({ content, type: 'text' })
        });

        // Clear form
        document.getElementById('postContent').value = '';
        document.getElementById('charCount').textContent = '0/5000';

        showAlert('Post created successfully!', 'success');
        
        // Reload posts
        currentPage = 1;
        await loadPosts();

    } catch (error) {
        showAlert(error.message, 'danger');
    } finally {
        const postBtn = document.getElementById('postBtn');
        postBtn.disabled = false;
        postBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Post';
    }
}

async function toggleLike(postId) {
    try {
        const result = await apiRequest(`/api/posts/${postId}/like`, {
            method: 'POST'
        });

        // Update UI
        const likesElement = document.getElementById(`likes-${postId}`);
        if (likesElement) {
            likesElement.textContent = result.likesCount;
        }

        const likeBtn = event.currentTarget;
        if (result.liked) {
            likeBtn.classList.add('active');
        } else {
            likeBtn.classList.remove('active');
        }

        // Send notification if liked
        if (result.liked && socket) {
            const post = posts.find(p => p._id === postId);
            if (post && post.author._id !== getCurrentUser().id) {
                socket.emit('send_notification', {
                    recipientId: post.author._id,
                    type: 'post_like',
                    content: 'liked your post',
                    relatedId: postId,
                    relatedModel: 'Post'
                });
            }
        }

    } catch (error) {
        showAlert('Error updating like', 'danger');
    }
}

function toggleComments(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    if (commentsSection.style.display === 'none') {
        commentsSection.style.display = 'block';
    } else {
        commentsSection.style.display = 'none';
    }
}

async function addComment(event, postId) {
    event.preventDefault();
    
    try {
        const input = document.getElementById(`comment-input-${postId}`);
        const content = input.value.trim();
        
        if (!content) return;

        const result = await apiRequest(`/api/posts/${postId}/comment`, {
            method: 'POST',
            body: JSON.stringify({ content })
        });

        // Clear input
        input.value = '';

        // Add comment to UI
        const commentList = document.getElementById(`comment-list-${postId}`);
        const newComment = result.comment;
        
        commentList.innerHTML += `
            <div class="comment">
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(newComment.author.name)}&size=40&background=random" 
                     alt="${newComment.author.name}" class="rounded-circle" width="40" height="40">
                <div class="comment-content">
                    <strong>${newComment.author.name}</strong>
                    <small class="text-muted ms-2">just now</small>
                    <p class="mb-0 mt-1">${newComment.content}</p>
                </div>
            </div>
        `;

        // Send notification
        if (socket) {
            const post = posts.find(p => p._id === postId);
            if (post && post.author._id !== getCurrentUser().id) {
                socket.emit('send_notification', {
                    recipientId: post.author._id,
                    type: 'post_comment',
                    content: 'commented on your post',
                    relatedId: postId,
                    relatedModel: 'Post'
                });
            }
        }

    } catch (error) {
        showAlert('Error adding comment', 'danger');
    }
}

async function deletePost(postId) {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
        await apiRequest(`/api/posts/${postId}`, {
            method: 'DELETE'
        });

        showAlert('Post deleted successfully', 'success');
        
        // Remove from UI
        const postElement = document.getElementById(`post-${postId}`);
        if (postElement) {
            postElement.remove();
        }

        // Remove from array
        posts = posts.filter(p => p._id !== postId);

    } catch (error) {
        showAlert('Error deleting post', 'danger');
    }
}

async function loadMorePosts() {
    currentPage++;
    await loadPosts();
}

async function loadNotificationCount() {
    try {
        const data = await apiRequest('/api/notifications/unread-count');
        const badge = document.getElementById('notifBadge');
        if (data.count > 0) {
            badge.textContent = data.count;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading notification count:', error);
    }
}

// Load notification count on page load
loadNotificationCount();