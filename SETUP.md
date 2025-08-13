# 🚀 Setup Guide for Campus Find the Lost Portal

This guide will help you set up the backend server so that all users can share the same lost and found data.

## 📋 Prerequisites

- **Node.js** (version 14 or higher)
- **npm** (comes with Node.js)
- A modern web browser

## 🔧 Installation Steps

### 1. Install Node.js
If you don't have Node.js installed, download it from [nodejs.org](https://nodejs.org/)

### 2. Open Terminal/Command Prompt
Navigate to your project folder:
```bash
cd path/to/Findthelostproject
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Start the Server
```bash
npm start
```

Or for development with auto-restart:
```bash
npm run dev
```

### 5. Access the Portal
Open your browser and go to:
```
http://localhost:3000
```

## ✅ What You'll See

When the server starts successfully, you should see:
```
🚀 Campus Find the Lost Portal Server running on port 3000
📱 Open http://localhost:3000 in your browser
🔗 API available at http://localhost:3000/api
```

## 🌐 How It Works Now

- **Shared Data**: All users see the same lost and found items
- **Real-time Updates**: Items posted from any device appear everywhere
- **Persistent Storage**: Data is saved in a JSON file on the server
- **API Endpoints**: RESTful API for all operations

## 📁 File Structure After Setup

```
Findthelostproject/
├── index.html          # Frontend portal
├── style.css           # Styling
├── script.js           # Frontend JavaScript (updated)
├── server.js           # Backend server
├── package.json        # Dependencies
├── database.json       # Data storage (created automatically)
├── README.md           # Project documentation
└── SETUP.md            # This file
```

## 🔍 API Endpoints

- `GET /api/items` - Get all items
- `GET /api/items/lost` - Get lost items only
- `GET /api/items/found` - Get found items only
- `POST /api/items/lost` - Add new lost item
- `POST /api/items/found` - Add new found item
- `PUT /api/items/lost/:id/found` - Mark item as found
- `DELETE /api/items/:type/:id` - Delete item
- `GET /api/items/search` - Search items with filters

## 🚨 Troubleshooting

### Port Already in Use
If you see "port 3000 already in use", change the port in `server.js`:
```javascript
const PORT = process.env.PORT || 3001; // Change to 3001 or another port
```

### Dependencies Not Found
If you get module errors, run:
```bash
npm install
```

### Database Issues
If the database file gets corrupted, delete `database.json` and restart the server - it will recreate with sample data.

## 🌍 Making It Accessible to Campus

### Option 1: Local Network
Other devices on the same WiFi can access:
```
http://YOUR_COMPUTER_IP:3000
```
Find your IP with:
- **Windows**: `ipconfig`
- **Mac/Linux**: `ifconfig` or `ip addr`

### Option 2: Internet Access
For campus-wide access, you'll need:
- A server or cloud hosting service
- Domain name configuration
- SSL certificate for security

## 🔒 Security Notes

- This is a basic implementation for demonstration
- For production use, consider adding:
  - User authentication
  - Input validation
  - Rate limiting
  - HTTPS encryption

## 📞 Support

If you encounter issues:
1. Check the console for error messages
2. Ensure Node.js version is 14+
3. Verify all dependencies are installed
4. Check if port 3000 is available

---

**🎉 Congratulations! Your campus portal now has shared data storage!**

All students can now see the same lost and found items, making it a truly useful campus tool.
