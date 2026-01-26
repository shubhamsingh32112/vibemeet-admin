# Firebase Storage Setup Guide

## Problem
If you're getting "Failed to upload image to Firebase Storage" errors, you need to configure Firebase Storage security rules.

## Solution: Configure Firebase Storage Security Rules

Firebase Storage requires security rules to allow uploads. You need to set up rules that allow authenticated users to upload files.

### Step 1: Go to Firebase Console

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `vidcall-f853e`
3. Navigate to **Storage** in the left sidebar
4. Click on the **Rules** tab

### Step 2: Set Up Security Rules

Replace the default rules with the following:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload creator profile images
    match /creators/{creatorId}/{allPaths=**} {
      // Allow read access to everyone
      allow read: if true;
      
      // Allow write access only to authenticated users
      allow write: if request.auth != null;
    }
    
    // Default: deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

### Step 3: Publish the Rules

1. Click **Publish** to save the rules
2. Wait a few seconds for the rules to propagate

### Step 4: Verify Authentication

Make sure you're logged in to the admin dashboard. The upload will only work if:
- You're authenticated with Firebase Auth
- Your user has the `admin` role in the backend

## Alternative: More Restrictive Rules (Recommended for Production)

For production, you might want more restrictive rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Creator profile images
    match /creators/{creatorId}/profile.jpg {
      // Allow read access to everyone
      allow read: if true;
      
      // Allow write only to authenticated users
      // You can add additional checks here, like:
      // - Check if user is admin
      // - Check file size
      // - Check file type
      allow write: if request.auth != null
                   && request.resource.size < 5 * 1024 * 1024  // 5MB max
                   && request.resource.contentType.matches('image/.*');
    }
    
    // Deny all other paths
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

## Testing

After setting up the rules:

1. Make sure you're logged in to the admin dashboard
2. Try uploading a creator profile image
3. Check the browser console for any error messages
4. If you still get errors, check:
   - Are you logged in? (Check the Firebase Auth state)
   - Are the rules published?
   - Is the file size reasonable? (Try a small image first)

## Troubleshooting

### Error: "storage/unauthorized" or "storage/permission-denied"
- **Solution**: Check that your Firebase Storage rules allow authenticated users to write
- **Solution**: Make sure you're logged in to the admin dashboard

### Error: "storage/unauthenticated"
- **Solution**: Log in to the admin dashboard first

### Error: "storage/quota-exceeded"
- **Solution**: Check your Firebase Storage quota in the Firebase Console

### Still having issues?
1. Check the browser console for detailed error messages
2. Verify you're authenticated: `firebase.auth().currentUser` should not be null
3. Check Firebase Console > Storage > Rules to ensure rules are published
4. Try uploading a very small image file first to test

## No Environment Variables Needed

**You don't need to add any environment variables** for Firebase Storage. The configuration is already in `adminWebsite/src/config/firebase.ts` with the Firebase project credentials.

The issue is purely about Firebase Storage security rules, not environment variables.
