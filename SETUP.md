# Admin Dashboard Setup Guide

## Quick Start

1. **Install dependencies:**
   ```bash
   cd adminWebsite
   npm install
   ```

2. **Create `.env` file:**
   ```bash
   VITE_API_BASE_URL=http://localhost:3000/api/v1
   ```
   Update the URL if your backend is running on a different port or host.

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Access the dashboard:**
   Open your browser to the URL shown in the terminal (usually `http://localhost:5173`)

## Setting Up Admin User

To access the dashboard, you need a user with `role: 'admin'` in your MongoDB database.

### Option 1: Update existing user via MongoDB

1. Connect to your MongoDB database
2. Find your user document in the `users` collection
3. Update the `role` field:
   ```javascript
   db.users.updateOne(
     { email: "your-email@example.com" },
     { $set: { role: "admin" } }
   )
   ```

### Option 2: Create admin user via backend (if you add an endpoint)

You can add a script or endpoint to create an admin user.

## Features

- ✅ Dark mode UI
- ✅ Firebase Authentication (Email/Password & Google)
- ✅ Role-based access control (admin only)
- ✅ Create creators with:
  - Photo upload (base64)
  - Name
  - About section
  - Category selection
  - Price
- ✅ Edit creators
- ✅ Delete creators
- ✅ View all creators

## Notes

- Photo uploads are currently stored as base64 strings in the database
- For production, consider uploading photos to Firebase Storage or another cloud service
- Make sure your backend server is running before using the dashboard
- The dashboard requires Firebase authentication and admin role
