import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';

/**
 * Uploads an image file to Firebase Storage under creators/{creatorId}/profile.jpg
 * @param file - The image file to upload
 * @param creatorId - The creator ID (or 'temp-{uuid}' for new creators)
 * @returns The download URL of the uploaded image
 */
export async function uploadCreatorProfileImage(
  file: File,
  creatorId: string
): Promise<string> {
  try {
    // Create a reference to the file location
    const storageRef = ref(storage, `creators/${creatorId}/profile.jpg`);
    
    // Upload the file
    await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    
    return downloadURL;
  } catch (error: any) {
    console.error('Error uploading image to Firebase Storage:', error);
    console.error('Error code:', error?.code);
    console.error('Error message:', error?.message);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to upload image to Firebase Storage';
    if (error?.code === 'storage/unauthorized') {
      errorMessage = 'Unauthorized: Please check Firebase Storage security rules. You need to be authenticated and have write permissions.';
    } else if (error?.code === 'storage/permission-denied') {
      errorMessage = 'Permission denied: Firebase Storage security rules are blocking the upload.';
    } else if (error?.code === 'storage/unauthenticated') {
      errorMessage = 'Not authenticated: Please log in to upload images.';
    } else if (error?.message) {
      errorMessage = `Upload failed: ${error.message}`;
    }
    
    throw new Error(errorMessage);
  }
}

/**
 * Deletes an image from Firebase Storage
 * @param creatorId - The creator ID
 */
export async function deleteCreatorProfileImage(creatorId: string): Promise<void> {
  try {
    const storageRef = ref(storage, `creators/${creatorId}/profile.jpg`);
    await deleteObject(storageRef);
  } catch (error) {
    // Ignore errors if file doesn't exist
    console.warn('Error deleting image from Firebase Storage:', error);
  }
}

/**
 * Generates a temporary ID for uploading images before creator creation
 * @returns A temporary ID string
 */
export function generateTempCreatorId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
