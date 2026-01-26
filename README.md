# Admin Dashboard

React + Vite admin dashboard for managing creators in the zztherapy app.

## Features

- 🔐 Firebase Authentication (Email/Password & Google)
- 👥 User roles: user, creator, admin
- 🎨 Dark mode UI
- ➕ Add creators with photo, name, about, categories, and price
- ✏️ Edit creators
- 🗑️ Delete creators
- 📋 View all creators

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Configure environment variables:**
Create a `.env` file in the root directory:
```
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

3. **Run the development server:**
```bash
npm run dev
```

4. **Build for production:**
```bash
npm run build
```

## Usage

1. Login with an admin account (must have `role: 'admin'` in the database)
2. Click "Add Creator" to create a new creator
3. Fill in the form:
   - Upload a photo
   - Enter name
   - Write about section
   - Select categories
   - Set price
4. Click "Create Creator" to save

## User Roles

The backend supports three user roles:
- **user**: Regular app user
- **creator**: Content creator
- **admin**: Admin dashboard access

Only users with `role: 'admin'` can access this dashboard.

## API Endpoints

The dashboard uses the following backend endpoints:
- `GET /api/v1/creator` - Get all creators
- `GET /api/v1/creator/:id` - Get creator by ID
- `POST /api/v1/creator` - Create creator (admin only)
- `PUT /api/v1/creator/:id` - Update creator (admin only)
- `DELETE /api/v1/creator/:id` - Delete creator (admin only)

## Notes

- Photo uploads are currently stored as base64 strings. For production, consider uploading to Firebase Storage or another cloud storage service.
- Make sure your backend server is running and accessible at the URL specified in `VITE_API_BASE_URL`.
