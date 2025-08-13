// Global variables
let lostItems = [];
let foundItems = [];
let allItems = [];

// API base URL
const API_BASE_URL = 'http://localhost:3000/api';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

// Initialize the application
async function initializeApp() {
    // Set current date for date inputs
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('lostDate').value = today;
    document.getElementById('foundDate').value = today;
    
    // Load items from API
    await loadItemsFromAPI();
    
    // Display items
    displayItems();
}

// Setup event listeners
function setupEventListeners() {
    // Form submissions
    document.getElementById('lostForm').addEventListener('submit', handleLostForm);
    document.getElementById('foundForm').addEventListener('submit', handleFoundForm);
    
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
    
    // Mobile navigation toggle
    document.querySelector('.nav-toggle').addEventListener('click', toggleMobileNav);
    
    // Modal close
    document.querySelector('.close').addEventListener('click', closeModal);
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal();
        }
    });
    
    // Search functionality
    document.getElementById('searchInput').addEventListener('input', debounce(searchItems, 300));
    document.getElementById('categoryFilter').addEventListener('change', filterItems);
    document.getElementById('typeFilter').addEventListener('change', filterItems);
}

// Handle lost item form submission
async function handleLostForm(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const lostItem = {
        itemName: formData.get('itemName'),
        category: formData.get('category'),
        location: formData.get('location'),
        dateLost: formData.get('dateLost'),
        timeLost: formData.get('timeLost'),
        description: formData.get('description'),
        contact: formData.get('contact'),
        reward: formData.get('reward')
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/items/lost`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(lostItem)
        });
        
        if (response.ok) {
            const newItem = await response.json();
            lostItems.push(newItem);
            displayItems();
            showSuccessModal('Lost item reported successfully! We\'ll help you find it.');
            event.target.reset();
            document.getElementById('lostDate').value = new Date().toISOString().split('T')[0];
        } else {
            throw new Error('Failed to add lost item');
        }
    } catch (error) {
        console.error('Error:', error);
        showSuccessModal('Error: Failed to report lost item. Please try again.');
    }
}

// Handle found item form submission
async function handleFoundForm(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const foundItem = {
        itemName: formData.get('itemName'),
        category: formData.get('category'),
        location: formData.get('location'),
        dateFound: formData.get('dateFound'),
        timeFound: formData.get('timeFound'),
        description: formData.get('description'),
        image: formData.get('image') ? 'sample-image.jpg' : null,
        contact: formData.get('contact'),
        currentLocation: formData.get('currentLocation')
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/items/found`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(foundItem)
        });
        
        if (response.ok) {
            const newItem = await response.json();
            foundItems.push(newItem);
            displayItems();
            showSuccessModal('Found item posted successfully! Thank you for helping reunite it with its owner.');
            event.target.reset();
            document.getElementById('foundDate').value = new Date().toISOString().split('T')[0];
        } else {
            throw new Error('Failed to add found item');
        }
    } catch (error) {
        console.error('Error:', error);
        showSuccessModal('Error: Failed to post found item. Please try again.');
    }
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Display items in the grid
function displayItems() {
    const container = document.getElementById('itemsContainer');
    allItems = [...lostItems, ...foundItems].sort((a, b) => new Date(b.datePosted) - new Date(a.datePosted));
    
    if (allItems.length === 0) {
        container.innerHTML = `
            <div class="no-items">
                <i class="fas fa-search" style="font-size: 4rem; color: #ccc; margin-bottom: 1rem;"></i>
                <h3>No items found</h3>
                <p>Be the first to report a lost item or post a found item!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = allItems.map(item => createItemCard(item)).join('');
}

// Create item card HTML
function createItemCard(item) {
    const isLost = item.type === 'lost';
    const dateField = isLost ? 'dateLost' : 'dateFound';
    const timeField = isLost ? 'timeLost' : 'timeFound';
    const locationField = isLost ? 'location' : 'location';
    
    // Check if this is a found item that was originally lost
    const isFoundFromLost = !isLost && item.originalLostItemId;
    
    return `
        <div class="item-card fade-in ${isFoundFromLost ? 'found-success' : ''}">
            <div class="item-header">
                <span class="item-type ${item.type}">${item.type.toUpperCase()}</span>
                <span class="item-category">${item.category}</span>
                ${isFoundFromLost ? '<span class="success-badge">🎉 SUCCESS!</span>' : ''}
            </div>
            
            <h3 class="item-title">${item.itemName}</h3>
            <p class="item-description">${item.description}</p>
            
            ${item.image ? `<img src="${item.image}" alt="${item.itemName}" class="item-image">` : ''}
            
            <div class="item-details">
                <div class="item-detail">
                    <strong>${isLost ? 'Last Seen Location:' : 'Found Location:'}</strong><br>
                    <span>${item[locationField]}</span>
                </div>
                <div class="item-detail">
                    <strong>${isLost ? 'Date Lost:' : 'Date Found:'}</strong><br>
                    <span>${formatDate(item[dateField])}</span>
                </div>
                ${item[timeField] ? `
                    <div class="item-detail">
                        <strong>${isLost ? 'Time Lost:' : 'Time Found:'}</strong><br>
                        <span>${item[timeField]}</span>
                    </div>
                ` : ''}
                ${isLost && item.reward ? `
                    <div class="item-detail">
                        <strong>Reward:</strong><br>
                        <span>${item.reward}</span>
                    </div>
                ` : ''}
                ${!isLost ? `
                    <div class="item-detail">
                        <strong>Current Location:</strong><br>
                        <span>${item.currentLocation}</span>
                    </div>
                    ${item.originalOwnerContact ? `
                        <div class="item-detail">
                            <strong>Original Owner:</strong><br>
                            <span>${item.originalOwnerContact}</span>
                        </div>
                    ` : ''}
                ` : ''}
                ${isLost && item.status === 'found' ? `
                    <div class="item-detail success-detail">
                        <strong>✅ Status:</strong><br>
                        <span style="color: #27ae60; font-weight: bold;">FOUND!</span>
                    </div>
                ` : ''}
            </div>
            
            <div class="item-actions">
                <button class="btn-contact" onclick="contactOwner('${item.id}')">
                    <i class="fas fa-${isLost ? 'phone' : 'envelope'}"></i>
                    ${isLost ? 'Contact Owner' : 'Contact Finder'}
                </button>
                ${isLost && item.status !== 'found' ? `
                    <button class="btn-contact" onclick="markAsFound('${item.id}')" style="background: #27ae60;">
                        <i class="fas fa-check"></i> Mark Found
                    </button>
                ` : ''}
                ${isFoundFromLost ? `
                    <button class="btn-contact" onclick="contactOwner('${item.id}')" style="background: #27ae60;">
                        <i class="fas fa-handshake"></i> Reunite with Owner
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

// Search items
function searchItems() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const typeFilter = document.getElementById('typeFilter').value;
    
    let filteredItems = allItems;
    
    // Apply search filter
    if (searchTerm) {
        filteredItems = filteredItems.filter(item => 
            item.itemName.toLowerCase().includes(searchTerm) ||
            item.description.toLowerCase().includes(searchTerm) ||
            item.location.toLowerCase().includes(searchTerm)
        );
    }
    
    // Apply category filter
    if (categoryFilter) {
        filteredItems = filteredItems.filter(item => item.category === categoryFilter);
    }
    
    // Apply type filter
    if (typeFilter) {
        filteredItems = filteredItems.filter(item => item.type === typeFilter);
    }
    
    displayFilteredItems(filteredItems);
}

// Display filtered items
function displayFilteredItems(items) {
    const container = document.getElementById('itemsContainer');
    
    if (items.length === 0) {
        container.innerHTML = `
            <div class="no-items">
                <i class="fas fa-search" style="font-size: 4rem; color: #ccc; margin-bottom: 1rem;"></i>
                <h3>No items found</h3>
                <p>Try adjusting your search criteria or filters.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = items.map(item => createItemCard(item)).join('');
}

// Filter items
function filterItems() {
    searchItems();
}

// Clear all filters
function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('typeFilter').value = '';
    displayItems();
}

// Contact owner/finder
function contactOwner(itemId) {
    const item = allItems.find(item => item.id === itemId);
    if (item) {
        const contactInfo = item.contact;
        const itemType = item.type === 'lost' ? 'owner' : 'finder';
        
        showSuccessModal(`Contact the ${itemType} at: ${contactInfo}`);
    }
}

// Mark lost item as found
function markAsFound(itemId) {
    markAsFoundAPI(itemId);
}

// Navigation handling
function handleNavigation(event) {
    event.preventDefault();
    
    // Remove active class from all links
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    
    // Add active class to clicked link
    event.target.classList.add('active');
    
    // Scroll to section
    const targetId = event.target.getAttribute('href').substring(1);
    scrollToSection(targetId);
}

// Scroll to section
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const headerHeight = document.querySelector('.header').offsetHeight;
        const targetPosition = section.offsetTop - headerHeight - 20;
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
}

// Mobile navigation toggle
function toggleMobileNav() {
    const navMenu = document.querySelector('.nav-menu');
    navMenu.classList.toggle('active');
}

// Show success modal
function showSuccessModal(message) {
    document.getElementById('modalMessage').textContent = message;
    document.getElementById('successModal').style.display = 'block';
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        closeModal();
    }, 3000);
}

// Close modal
function closeModal() {
    document.getElementById('successModal').style.display = 'none';
}

// Load items from API
async function loadItemsFromAPI() {
    try {
        const response = await fetch(`${API_BASE_URL}/items`);
        if (response.ok) {
            const data = await response.json();
            lostItems = data.lostItems || [];
            foundItems = data.foundItems || [];
        } else {
            console.error('Failed to load items from API');
        }
    } catch (error) {
        console.error('Error loading items:', error);
    }
}

// Mark lost item as found via API
async function markAsFoundAPI(itemId) {
    try {
        // Get finder contact and current location
        const finderContact = prompt('Please enter your contact information (phone/email):');
        if (!finderContact) return;
        
        const currentLocation = prompt('Where is the item currently kept? (e.g., Security Office, Library Desk):');
        if (!currentLocation) return;
        
        const response = await fetch(`${API_BASE_URL}/items/lost/${itemId}/found`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                finderContact: finderContact,
                currentLocation: currentLocation
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            
            // Update local data
            const lostItem = lostItems.find(item => item.id === itemId);
            if (lostItem) {
                lostItem.status = 'found';
                lostItem.dateFound = result.updatedLostItem.dateFound;
                lostItem.foundItemId = result.updatedLostItem.foundItemId;
            }
            
            // Add the new found item to local data
            if (result.foundItem) {
                foundItems.push(result.foundItem);
            }
            
            displayItems();
            showSuccessModal(`🎉 Item successfully marked as found!\n\n✅ ${result.foundItem.itemName} has been moved to Found Items\n📞 Contact: ${result.foundItem.contact}\n📍 Current Location: ${result.foundItem.currentLocation}\n\nThe original owner will be notified!`);
        } else {
            throw new Error('Failed to mark item as found');
        }
    } catch (error) {
        console.error('Error:', error);
        showSuccessModal('Error: Failed to mark item as found. Please try again.');
    }
}

// Format date for display
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Cleanup old found items (older than 1 day)
async function cleanupOldItems() {
    if (confirm('This will remove all found items older than 1 day. Continue?')) {
        try {
            const response = await fetch(`${API_BASE_URL}/cleanup`, {
                method: 'POST'
            });
            
            if (response.ok) {
                const result = await response.json();
                
                // Reload items from API to reflect changes
                await loadItemsFromAPI();
                displayItems();
                
                showSuccessModal(`🧹 Cleanup completed!\n\n✅ Removed ${result.removedCount} old found items\n📊 ${result.remainingFoundItems} found items remaining\n\nOld items have been automatically cleaned up.`);
            } else {
                throw new Error('Failed to cleanup old items');
            }
        } catch (error) {
            console.error('Error:', error);
            showSuccessModal('Error: Failed to cleanup old items. Please try again.');
        }
    }
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
// Add smooth scrolling for all internal links
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});
// Add intersection observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
        }
    });
}, observerOptions);
// Observe all sections for animation
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.section').forEach(section => {
        observer.observe(section);
    });
});
