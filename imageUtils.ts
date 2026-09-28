/**
 * Resizes and re-compresses an image entirely in the browser before it's
 * ever uploaded. This is the real fix for uploads getting rejected: a
 * modern phone camera photo is routinely 5-15MB, well past what's
 * reasonable to store and serve to every visitor on mobile data. Capping
 * the longest side and re-encoding as JPEG at a solid quality typically
 * brings a phone photo down to a few hundred KB with no visible quality
 * loss at the sizes this app actually displays images.
 *
 * Falls back to the original file untouched if compression fails for any
 * reason (unsupported format, browser quirk, etc.) -- never blocks an
 * upload just because compression itself had a problem.
 */
export async function compressImage(
  file: File,
  maxDimension: number = 1600,
  quality: number = 0.82
): Promise<File> {
  // Nothing to gain compressing formats that are already efficient and
  // typically small, or animated (GIF) where re-encoding as JPEG would
  // destroy the animation.
  if (file.type === 'image/gif') {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    let { width, height } = bitmap;

    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob: Blob | null = await new Promise(resolve =>
      canvas.toBlob(resolve, 'image/jpeg', quality)
    );
    if (!blob) return file;

    // Only use the compressed version if it's actually smaller -- a tiny
    // source image could theoretically grow slightly after re-encoding.
    if (blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], newName, { type: 'image/jpeg' });
  } catch (err) {
    console.warn('[imageUtils] compression failed, using original file:', err);
    return file;
  }
}
