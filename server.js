const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files

// Database file path
const DB_FILE = path.join(__dirname, 'database.json');

// Initialize database if it doesn't exist
async function initializeDatabase() {
    try {
        await fs.access(DB_FILE);
    } catch {
        // Create initial database structure
        const initialData = {
            lostItems: [
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
            ],
            foundItems: [
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
            ]
        };
        
        await fs.writeFile(DB_FILE, JSON.stringify(initialData, null, 2));
        console.log('Database initialized with sample data');
    }
}

// Read database
async function readDatabase() {
    try {
        const data = await fs.readFile(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading database:', error);
        return { lostItems: [], foundItems: [] };
    }
}

// Write database
async function writeDatabase(data) {
    try {
        await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing database:', error);
        return false;
    }
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Routes

// Get all items
app.get('/api/items', async (req, res) => {
    try {
        const data = await readDatabase();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch items' });
    }
});

// Get lost items
app.get('/api/items/lost', async (req, res) => {
    try {
        const data = await readDatabase();
        res.json(data.lostItems);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch lost items' });
    }
});

// Get found items
app.get('/api/items/found', async (req, res) => {
    try {
        const data = await readDatabase();
        res.json(data.foundItems);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch found items' });
    }
});

// Add lost item
app.post('/api/items/lost', async (req, res) => {
    try {
        const data = await readDatabase();
        const newItem = {
            id: generateId(),
            type: 'lost',
            ...req.body,
            datePosted: new Date().toISOString(),
            status: 'active'
        };
        
        data.lostItems.push(newItem);
        await writeDatabase(data);
        
        res.status(201).json(newItem);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add lost item' });
    }
});

// Add found item
app.post('/api/items/found', async (req, res) => {
    try {
        const data = await readDatabase();
        const newItem = {
            id: generateId(),
            type: 'found',
            ...req.body,
            datePosted: new Date().toISOString(),
            status: 'active'
        };
        
        data.foundItems.push(newItem);
        await writeDatabase(data);
        
        res.status(201).json(newItem);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add found item' });
    }
});

// Mark lost item as found
app.put('/api/items/lost/:id/found', async (req, res) => {
    try {
        const data = await readDatabase();
        const item = data.lostItems.find(item => item.id === req.params.id);
        
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        // Create a new found item based on the lost item
        const foundItem = {
            id: generateId(),
            type: 'found',
            itemName: item.itemName,
            category: item.category,
            location: item.location, // Original lost location
            dateFound: new Date().toISOString(),
            timeFound: new Date().toLocaleTimeString(),
            description: item.description,
            image: null,
            contact: req.body.finderContact || 'Contact original owner',
            currentLocation: req.body.currentLocation || 'Contact for pickup',
            datePosted: new Date().toISOString(),
            status: 'active',
            originalLostItemId: item.id, // Link to original lost item
            originalOwnerContact: item.contact, // Preserve original contact
            reward: item.reward // Preserve reward information
        };
        
        // Add to found items
        data.foundItems.push(foundItem);
        
        // Mark original lost item as found
        item.status = 'found';
        item.dateFound = foundItem.dateFound;
        item.foundItemId = foundItem.id; // Link to found item
        
        await writeDatabase(data);
        
        res.json({
            message: 'Item successfully marked as found and moved to found items',
            foundItem: foundItem,
            updatedLostItem: item
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update item' });
    }
});

// Delete item
app.delete('/api/items/:type/:id', async (req, res) => {
    try {
        const data = await readDatabase();
        const { type, id } = req.params;
        
        if (type === 'lost') {
            data.lostItems = data.lostItems.filter(item => item.id !== id);
        } else if (type === 'found') {
            data.foundItems = data.foundItems.filter(item => item.id !== id);
        } else {
            return res.status(400).json({ error: 'Invalid item type' });
        }
        
        await writeDatabase(data);
        res.json({ message: 'Item deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete item' });
    }
});

// Search items
app.get('/api/items/search', async (req, res) => {
    try {
        const { q: searchTerm, category, type } = req.query;
        const data = await readDatabase();
        
        let items = [...data.lostItems, ...data.foundItems];
        
        // Apply search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            items = items.filter(item => 
                item.itemName.toLowerCase().includes(term) ||
                item.description.toLowerCase().includes(term) ||
                item.location.toLowerCase().includes(term)
            );
        }
        
        // Apply category filter
        if (category) {
            items = items.filter(item => item.category === category);
        }
        
        // Apply type filter
        if (type) {
            items = items.filter(item => item.type === type);
        }
        
        // Sort by date posted (newest first)
        items.sort((a, b) => new Date(b.datePosted) - new Date(a.datePosted));
        
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: 'Failed to search items' });
    }
});

// Cleanup old found items (older than 1 day)
app.post('/api/cleanup', async (req, res) => {
    try {
        const data = await readDatabase();
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        
        const originalFoundCount = data.foundItems.length;
        
        // Remove found items older than 1 day
        data.foundItems = data.foundItems.filter(item => {
            const foundDate = new Date(item.dateFound);
            return foundDate > oneDayAgo;
        });
        
        const removedCount = originalFoundCount - data.foundItems.length;
        
        await writeDatabase(data);
        
        res.json({
            message: `Cleanup completed. Removed ${removedCount} old found items.`,
            remainingFoundItems: data.foundItems.length,
            removedCount: removedCount
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to cleanup old items' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
async function startServer() {
    await initializeDatabase();
    
    // Perform initial cleanup of old found items
    try {
        const data = await readDatabase();
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        
        const originalFoundCount = data.foundItems.length;
        
        // Remove found items older than 1 day
        data.foundItems = data.foundItems.filter(item => {
            const foundDate = new Date(item.dateFound);
            return foundDate > oneDayAgo;
        });
        
        const removedCount = originalFoundCount - data.foundItems.length;
        
        if (removedCount > 0) {
            await writeDatabase(data);
            console.log(`🧹 Initial cleanup: Removed ${removedCount} old found items`);
        }
    } catch (error) {
        console.log('⚠️ Initial cleanup failed:', error.message);
    }
    
    app.listen(PORT, () => {
        console.log(`🚀 Campus Find the Lost Portal Server running on port ${PORT}`);
        console.log(`📱 Open http://localhost:${PORT} in your browser`);
        console.log(`🔗 API available at http://localhost:${PORT}/api`);
        console.log(`🧹 Auto-cleanup: Found items older than 1 day are automatically removed`);
    });
}

startServer().catch(console.error);
