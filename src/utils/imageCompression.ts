/**
 * Compress and resize an image file
 * @param file - The image file to compress
 * @param maxWidth - Maximum width in pixels (default: 800)
 * @param maxHeight - Maximum height in pixels (default: 800)
 * @param quality - JPEG quality 0-1 (default: 0.7)
 * @param maxSizeKB - Maximum file size in KB (default: 200)
 * @returns Promise<string> - Base64 encoded compressed image
 */
export async function compressImage(
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.7,
  maxSizeKB: number = 200
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio;
          height = height * ratio;
        }
        
        // Create canvas and draw resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Draw image with better quality
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 with compression
        let compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        
        // If still too large, reduce quality further
        let currentQuality = quality;
        const maxSizeBytes = maxSizeKB * 1024;
        
        // Estimate base64 size (base64 is ~33% larger than binary)
        const base64Size = (compressedBase64.length * 3) / 4;
        
        if (base64Size > maxSizeBytes && currentQuality > 0.3) {
          // Try reducing quality in steps
          const qualitySteps = [0.6, 0.5, 0.4, 0.3];
          for (const stepQuality of qualitySteps) {
            compressedBase64 = canvas.toDataURL('image/jpeg', stepQuality);
            const stepSize = (compressedBase64.length * 3) / 4;
            if (stepSize <= maxSizeBytes) {
              break;
            }
          }
        }
        
        resolve(compressedBase64);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      if (e.target?.result) {
        img.src = e.target.result as string;
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}
