/**
 * Compresses an image file on the client side using HTML5 Canvas.
 * Resizes the image to fit within maxDimensions (default 1200x1200px)
 * and compresses it with the specified quality (default 0.75).
 */
export function compressImage(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.75
): Promise<File> {
  return new Promise((resolve) => {
    // Only compress image files
    if (!file.type.startsWith('image/')) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions maintaining aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const widthRatio = maxWidth / width;
          const heightRatio = maxHeight / height;
          const bestRatio = Math.min(widthRatio, heightRatio);

          width = Math.round(width * bestRatio);
          height = Math.round(height * bestRatio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(file);
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas content to compressed jpeg blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve(file);
            }
            // Create a new File object with the compressed blob
            const extension = 'jpg';
            const baseName = file.name.replace(/\.[^/.]+$/, "");
            const newName = `${baseName}_optimized.${extension}`;
            const compressedFile = new File([blob], newName, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });

            console.log(
              `[Image Compression] Compressed "${file.name}" (${(file.size / 1024 / 1024).toFixed(2)} MB) to "${newName}" (${(compressedFile.size / 1024).toFixed(1)} KB)`
            );
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => {
        console.warn(`[Image Compression] Failed to load image element for "${file.name}". Uploading original file.`);
        resolve(file);
      };
    };
    reader.onerror = () => {
      console.warn(`[Image Compression] Failed to read file "${file.name}". Uploading original file.`);
      resolve(file);
    };
  });
}
