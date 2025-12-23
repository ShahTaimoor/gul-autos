/**
 * Image Service
 * Image-related utility functions (fetching images for download/export)
 */
export const imageService = {
  /**
   * Fetch image as blob
   * @param {string} imageUrl - Image URL
   * @param {number} timeout - Request timeout in milliseconds
   * @returns {Promise<Blob>} Image blob
   */
  fetchImageBlob: async (imageUrl, timeout = 10000) => {
    const response = await fetch(imageUrl, {
      signal: AbortSignal.timeout(timeout),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.blob();
  },

  /**
   * Download image
   * @param {string} imageUrl - Image URL
   * @param {string} filename - Download filename
   * @returns {Promise<void>}
   */
  downloadImage: async (imageUrl, filename) => {
    try {
      const blob = await imageService.fetchImageBlob(imageUrl);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      throw new Error(`Failed to download image: ${error.message}`);
    }
  },
};

