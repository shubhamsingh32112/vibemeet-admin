import React, { useState } from 'react';
import type { Creator, CreateCreatorDto } from '../types/creator';
import { compressImage } from '../utils/imageCompression';
import { uploadCreatorProfileImage, generateTempCreatorId } from '../utils/firebaseStorage';
import { creatorService } from '../services/creatorService';

interface CreatorFormProps {
  onSubmit: (data: CreateCreatorDto | { name: string; about: string; photo: string; categories?: string[]; price: number }) => Promise<Creator | void>;
  onCancel?: () => void;
  initialData?: Creator;
  isEditing?: boolean;
  selectedUserId?: string; // User ID when promoting a user to creator
}

const CATEGORIES = [
  'Trauma',
  'Health',
  'Breakup',
  'Low confidence',
  'Loneliness',
  'Stress',
  'Work',
  'Family',
  'Relationship',
];

const CreatorForm: React.FC<CreatorFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isEditing = false,
  selectedUserId,
}) => {
  const [formData, setFormData] = useState<CreateCreatorDto>({
    name: initialData?.name || '',
    about: initialData?.about || '',
    photo: initialData?.photo || '',
    userId: selectedUserId || initialData?.userId || '',
    categories: initialData?.categories || [],
    price: initialData?.price || 0,
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>(initialData?.photo || '');
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file.');
        return;
      }
      
      setError(''); // Clear any previous errors
      setCompressing(true);
      setPhotoFile(file);
      
      try {
        // Compress and resize image: max 800x800px, quality 0.7, max 200KB
        const compressedBase64 = await compressImage(file, 800, 800, 0.7, 200);
        
        // Convert base64 data URL to File for Firebase Storage upload
        const base64Data = compressedBase64.split(',')[1]; // Remove data:image/jpeg;base64, prefix
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/jpeg' });
        const compressedFile = new File([blob], file.name, { type: 'image/jpeg' });
        setCompressedFile(compressedFile);
        
        setPhotoPreview(compressedBase64);
        // Keep the base64 for preview, but we'll upload the file to Firebase Storage on submit
        
        // Log compression info
        const originalSizeKB = (file.size / 1024).toFixed(2);
        const compressedSizeKB = (compressedFile.size / 1024).toFixed(2);
        console.log(`📸 Image compressed: ${originalSizeKB}KB → ${compressedSizeKB}KB`);
      } catch (err: any) {
        console.error('Image compression error:', err);
        setError(err.message || 'Failed to process image. Please try another image.');
        setPhotoFile(null);
        setCompressedFile(null);
        setPhotoPreview('');
      } finally {
        setCompressing(false);
      }
    }
  };

  const handleCategoryToggle = (category: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: (prev.categories ?? []).includes(category)
        ? (prev.categories ?? []).filter((c) => c !== category)
        : [...(prev.categories ?? []), category],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setUploading(false);

    try {
      // Validate that we have a photo (either existing or new upload)
      if (!compressedFile && !initialData?.photo) {
        throw new Error('Please upload a photo');
      }
      
      // Validate userId if creating (not editing)
      if (!isEditing && !selectedUserId && !formData.userId) {
        throw new Error('User ID is required');
      }
      
      if (formData.price < 0) {
        throw new Error('Price must be non-negative');
      }

      let photoURL = formData.photo; // Use existing photo if no new file uploaded

      // If we have a new file to upload, upload it to Firebase Storage
      if (compressedFile) {
        setUploading(true);
        try {
          if (isEditing && initialData?.id) {
            // Editing: Upload directly to creators/{creatorId}/profile.jpg
            photoURL = await uploadCreatorProfileImage(compressedFile, initialData.id);
            console.log('✅ Image uploaded to Firebase Storage:', photoURL);
          } else {
            // Creating: We'll handle this after creation
            // For now, upload to temp location as placeholder
            const tempId = generateTempCreatorId();
            photoURL = await uploadCreatorProfileImage(compressedFile, tempId);
            console.log('✅ Image uploaded to temp location:', photoURL);
          }
        } catch (uploadError: any) {
          console.error('Firebase Storage upload error:', uploadError);
          throw new Error('Failed to upload image to Firebase Storage. Please try again.');
        } finally {
          setUploading(false);
        }
      }

      // Prepare data based on whether we're promoting or editing
      if (selectedUserId && !isEditing) {
        // Promoting user to creator - use promote endpoint format
        const promoteData = {
          name: formData.name,
          about: formData.about,
          photo: photoURL,
          categories: formData.categories && formData.categories.length > 0 ? formData.categories : undefined,
          price: formData.price,
        };
        await onSubmit(promoteData);
      } else {
        // Editing or creating via old endpoint
        const cleanedData: CreateCreatorDto = {
          ...formData,
          photo: photoURL,
          userId: selectedUserId || formData.userId || initialData?.userId || '',
          categories: formData.categories && formData.categories.length > 0 ? formData.categories : undefined,
        };
        
        // If creating with a new image uploaded to temp, handle re-upload after creation
        if (!isEditing && compressedFile && photoURL.includes('temp-')) {
          // Call onSubmit to create the creator
          const createdCreator = await onSubmit(cleanedData);
          
          // If we got the creator back, upload to correct location and update
          if (createdCreator && createdCreator.id) {
            try {
              setUploading(true);
              const finalPhotoURL = await uploadCreatorProfileImage(compressedFile, createdCreator.id);
              console.log('✅ Image uploaded to final location:', finalPhotoURL);
              
              // Update creator with final URL
              await creatorService.update(createdCreator.id, { ...cleanedData, photo: finalPhotoURL });
              
              // Delete temp file
              const tempMatch = photoURL.match(/creators\/(temp-[^/]+)\//);
              if (tempMatch && tempMatch[1]) {
                try {
                  await deleteCreatorProfileImage(tempMatch[1]);
                  console.log('✅ Temp image deleted');
                } catch (deleteError) {
                  console.warn('Failed to delete temp image:', deleteError);
                }
              }
            } catch (uploadError: any) {
              console.error('Error uploading to final location:', uploadError);
              // Creator is created with temp URL, which is acceptable
              console.warn('Creator created with temp image URL. You can update it later.');
            } finally {
              setUploading(false);
            }
          }
        } else {
          await onSubmit(cleanedData);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save creator');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-900/50 border border-red-700 rounded text-red-200 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-gray-300 text-sm font-medium mb-2">
          Photo
        </label>
        <div className="flex items-center gap-4">
          {photoPreview && (
            <img
              src={photoPreview}
              alt="Preview"
              className="w-24 h-24 object-cover rounded-lg border border-gray-600"
            />
          )}
          <div className="flex-1">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={compressing}
              className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-gray-500">
              {compressing 
                ? 'Compressing image...' 
                : 'Upload a photo (will be automatically compressed to ~200KB)'}
            </p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-gray-300 text-sm font-medium mb-2">
          Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          minLength={2}
          maxLength={100}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Creator name"
        />
      </div>

      <div>
        <label className="block text-gray-300 text-sm font-medium mb-2">
          About <span className="text-red-400">*</span>
        </label>
        <textarea
          value={formData.about}
          onChange={(e) => setFormData({ ...formData, about: e.target.value })}
          required
          minLength={10}
          maxLength={1000}
          rows={5}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Tell us about the creator..."
        />
        <p className="mt-1 text-xs text-gray-500">
          {formData.about.length}/1000 characters
        </p>
      </div>


      <div>
        <label className="block text-gray-300 text-sm font-medium mb-2">
          Categories <span className="text-gray-400">(optional)</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CATEGORIES.map((category) => (
            <label
              key={category}
              className={`flex items-center p-3 rounded-lg border cursor-pointer transition ${
                (formData.categories ?? []).includes(category)
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <input
                type="checkbox"
                checked={(formData.categories ?? []).includes(category)}
                onChange={() => handleCategoryToggle(category)}
                className="sr-only"
              />
              <span className="text-sm font-medium">{category}</span>
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Selected: {(formData.categories ?? []).length} category(ies)
        </p>
      </div>

      <div>
        <label className="block text-gray-300 text-sm font-medium mb-2">
          Price <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            $
          </span>
          <input
            type="number"
            value={formData.price}
            onChange={(e) =>
              setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
            }
            required
            min="0"
            step="0.01"
            className="w-full pl-8 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading || uploading 
            ? (uploading ? 'Uploading image...' : 'Saving...') 
            : isEditing ? 'Update Creator' : 'Create Creator'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition disabled:opacity-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default CreatorForm;
