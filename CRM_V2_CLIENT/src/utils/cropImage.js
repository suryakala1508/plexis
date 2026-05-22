/**
 * Creates a cropped image from the original image and crop area
 * @param {string} imageSrc - The source image URL
 * @param {Object} pixelCrop - The crop area in pixels {x, y, width, height}
 * @param {number} rotation - Rotation angle in degrees
 * @returns {Promise<Blob>} - The cropped image as a Blob
 */
export const createCroppedImage = async (imageSrc, pixelCrop, rotation = 0) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('Could not get canvas context');
    }

    const maxSize = Math.max(image.width, image.height);
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

    // Set canvas size to accommodate rotation
    canvas.width = safeArea;
    canvas.height = safeArea;

    // Translate canvas context to center
    ctx.translate(safeArea / 2, safeArea / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-safeArea / 2, -safeArea / 2);

    // Draw rotated image
    ctx.drawImage(
        image,
        safeArea / 2 - image.width * 0.5,
        safeArea / 2 - image.height * 0.5
    );

    const data = ctx.getImageData(0, 0, safeArea, safeArea);

    // Set canvas to final crop size
    canvas.width = Math.max(1, pixelCrop.width);
    canvas.height = Math.max(1, pixelCrop.height);

    // Paste cropped area
    ctx.putImageData(
        data,
        Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
        Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
    );

    // Convert canvas to blob
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
            } else {
                console.error('Canvas.toBlob returned null. Canvas size:', canvas.width, 'x', canvas.height);
                reject(new Error('Canvas is empty or could not be converted to blob'));
            }
        }, 'image/jpeg', 0.95);
    });
};

/**
 * Helper function to create an image element from a source
 * @param {string} url - Image source URL
 * @returns {Promise<HTMLImageElement>}
 */
const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        if (!url.startsWith('data:')) {
            image.setAttribute('crossOrigin', 'anonymous');
        }
        image.src = url;
    });

/**
 * Converts a File or Blob to a data URL
 * @param {File|Blob} file - The file to convert
 * @returns {Promise<string>} - Data URL string
 */
export const readFile = (file) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.addEventListener('load', () => resolve(reader.result), false);
        reader.readAsDataURL(file);
    });
};
