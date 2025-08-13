// Global variables
let lostItems = [];
let foundItems = [];
let allItems = [];

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
    
    // Load items from localStorage
    loadItemsFromStorage();
    
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
function handleLostForm(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const lostItem = {
        id: generateId(),
        type: 'lost',
        itemName: formData.get('itemName'),
        category: formData.get('category'),
        location: formData.get('location'),
        dateLost: formData.get('dateLost'),
        timeLost: formData.get('timeLost'),
        description: formData.get('description'),
        contact: formData.get('contact'),
        reward: formData.get('reward'),
        datePosted: new Date().toISOString(),
        status: 'active'
    };
    
    // Add to lost items
    lostItems.push(lostItem);
    
    // Save to localStorage
    saveItemsToStorage();
    
    // Display items
    displayItems();
    
    // Show success message
    showSuccessModal('Lost item reported successfully! We\'ll help you find it.');
    
    // Reset form
    event.target.reset();
    document.getElementById('lostDate').value = new Date().toISOString().split('T')[0];
}

// Handle found item form submission
function handleFoundForm(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const foundItem = {
        id: generateId(),
        type: 'found',
        itemName: formData.get('itemName'),
        category: formData.get('category'),
        location: formData.get('location'),
        dateFound: formData.get('dateFound'),
        timeFound: formData.get('timeFound'),
        description: formData.get('description'),
        image: formData.get('image') ? 'sample-image.jpg' : null,
        contact: formData.get('contact'),
        currentLocation: formData.get('currentLocation'),
        datePosted: new Date().toISOString(),
        status: 'active'
    };
    
    // Add to found items
    foundItems.push(foundItem);
    
    // Save to localStorage
    saveItemsToStorage();
    
    // Display items
    displayItems();
    
    // Show success message
    showSuccessModal('Found item posted successfully! Thank you for helping reunite it with its owner.');
    
    // Reset form
    event.target.reset();
    document.getElementById('foundDate').value = new Date().toISOString().split('T')[0];
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
                        <span style="color: #00d4aa; font-weight: bold;">FOUND!</span>
                    </div>
                ` : ''}
            </div>
            
            <div class="item-actions">
                <button class="btn-contact" onclick="contactOwner('${item.id}')">
                    <i class="fas fa-${isLost ? 'phone' : 'envelope'}"></i>
                    ${isLost ? 'Contact Owner' : 'Contact Finder'}
                </button>
                ${isLost && item.status !== 'found' ? `
                    <button class="btn-contact" onclick="markAsFound('${item.id}')" style="background: #00d4aa;">
                        <i class="fas fa-check"></i> Mark Found
                    </button>
                ` : ''}
                ${isFoundFromLost ? `
                    <button class="btn-contact" onclick="contactOwner('${item.id}')" style="background: #00d4aa;">
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
    const lostItem = lostItems.find(item => item.id === itemId);
    if (lostItem) {
        // Get finder contact and current location
        const finderContact = prompt('Please enter your contact information (phone/email):');
        if (!finderContact) return;
        
        const currentLocation = prompt('Where is the item currently kept? (e.g., Security Office, Library Desk):');
        if (!currentLocation) return;
        
        // Create a new found item
        const foundItem = {
            id: generateId(),
            type: 'found',
            itemName: lostItem.itemName,
            category: lostItem.category,
            location: lostItem.location,
            dateFound: new Date().toISOString(),
            timeFound: new Date().toLocaleTimeString(),
            description: lostItem.description,
            image: null,
            contact: finderContact,
            currentLocation: currentLocation,
            datePosted: new Date().toISOString(),
            status: 'active',
            originalLostItemId: lostItem.id,
            originalOwnerContact: lostItem.contact,
            reward: lostItem.reward
        };
        
        // Mark original lost item as found
        lostItem.status = 'found';
        lostItem.dateFound = foundItem.dateFound;
        lostItem.foundItemId = foundItem.id;
        
        // Add to found items
        foundItems.push(foundItem);
        
        // Save to localStorage
        saveItemsToStorage();
        
        // Display items
        displayItems();
        
        showSuccessModal(`🎉 Item successfully marked as found!\n\n✅ ${foundItem.itemName} has been moved to Found Items\n📞 Contact: ${foundItem.contact}\n📍 Current Location: ${foundItem.currentLocation}\n\nThe original owner will be notified!`);
    }
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

// Load items from localStorage
function loadItemsFromStorage() {
    try {
        const storedLostItems = localStorage.getItem('lostItems');
        const storedFoundItems = localStorage.getItem('foundItems');
        
        if (storedLostItems) {
            lostItems = JSON.parse(storedLostItems);
        }
        
        if (storedFoundItems) {
            foundItems = JSON.parse(storedFoundItems);
        }
        
        // If no items exist, add sample data
        if (lostItems.length === 0 && foundItems.length === 0) {
            addSampleData();
        }
    } catch (error) {
        console.error('Error loading items from storage:', error);
        addSampleData();
    }
}

// Save items to localStorage
function saveItemsToStorage() {
    try {
        localStorage.setItem('lostItems', JSON.stringify(lostItems));
        localStorage.setItem('foundItems', JSON.stringify(foundItems));
    } catch (error) {
        console.error('Error saving items to storage:', error);
    }
}

// Add sample data
function addSampleData() {
    const sampleLostItems = [
        {
            id: 'sample-lost-1',
            type: 'lost',
            itemName: 'iPhone 13 Pro',
            category: 'electronics',
            location: 'Library - Study Room 3',
            dateLost: '2024-01-15',
            timeLost: '14:30',
            description: 'Black iPhone 13 Pro with clear case. Has a small scratch on the back. Last seen charging on the desk.',
            contact: 'john.doe@campus.edu',
            reward: '$50',
            datePosted: '2024-01-15T14:30:00.000Z',
            status: 'active'
        },
        {
            id: 'sample-lost-2',
            type: 'lost',
            itemName: 'Calculus Textbook',
            category: 'books',
            location: 'Mathematics Building - Room 201',
            dateLost: '2024-01-14',
            timeLost: '16:00',
            description: 'Calculus: Early Transcendentals 8th Edition by James Stewart. Has my name "Sarah Johnson" written inside.',
            contact: 'sarah.johnson@campus.edu',
            reward: 'Coffee',
            datePosted: '2024-01-14T16:00:00.000Z',
            status: 'active'
        }
    ];
    
    const sampleFoundItems = [
        {
            id: 'sample-found-1',
            type: 'found',
            itemName: 'Silver Laptop',
            category: 'electronics',
            location: 'Cafeteria - Table near window',
            dateFound: '2024-01-15',
            timeFound: '12:00',
            description: 'Silver MacBook Air with stickers on the lid. Found on table after lunch rush.',
            image: null,
            contact: 'security@campus.edu',
            currentLocation: 'Campus Security Office',
            datePosted: '2024-01-15T12:00:00.000Z',
            status: 'active'
        },
        {
            id: 'sample-found-2',
            type: 'found',
            itemName: 'Red Water Bottle',
            category: 'other',
            location: 'Gym - Weight Room',
            dateFound: '2024-01-14',
            timeFound: '18:30',
            description: 'Red Hydro Flask water bottle with "Mike" written on it. Found near the bench press.',
            image: null,
            contact: 'gym.staff@campus.edu',
            currentLocation: 'Gym Front Desk',
            datePosted: '2024-01-14T18:30:00.000Z',
            status: 'active'
        }
    ];
    
    lostItems = sampleLostItems;
    foundItems = sampleFoundItems;
    saveItemsToStorage();
}

// Format date for display
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Cleanup old found items (older than 1 day)
function cleanupOldItems() {
    if (confirm('This will remove all found items older than 1 day. Continue?')) {
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        
        const originalFoundCount = foundItems.length;
        
        // Remove found items older than 1 day
        foundItems = foundItems.filter(item => {
            const foundDate = new Date(item.dateFound);
            return foundDate > oneDayAgo;
        });
        
        const removedCount = originalFoundCount - foundItems.length;
        
        // Save to localStorage
        saveItemsToStorage();
        
        // Display items
        displayItems();
        
        showSuccessModal(`🧹 Cleanup completed!\n\n✅ Removed ${removedCount} old found items\n📊 ${foundItems.length} found items remaining\n\nOld items have been automatically cleaned up.`);
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
