import { API_BASE_URL } from './axiosConfig';

/**
 * Get the proper image URL based on environment and path
 * @param {string} imagePath - Path to the image
 * @returns {string} - Full URL to the image
 */
export const getImagePath = imagePath => {
  if (!imagePath) {
    console.log('No image path provided, using placeholder');
    return `${API_BASE_URL}/media/default/placeholder.jpg`;
  }

  // If it's already a full URL (http, https, or S3), return it as is
  if (imagePath.startsWith('http') || imagePath.includes('amazonaws.com')) {
    return imagePath;
  }
  
  // Get base URL from environment or imported constant
  const baseUrl = API_BASE_URL;
  
  // Clean up the path - remove leading/trailing slashes and media prefixes
  let cleanPath = imagePath
    .replace(/^\/+|\/+$/g, '') // Remove leading/trailing slashes
    .replace(/^media\/|^\/media\//g, '') // Remove media prefix if present
    .replace(/\/+/g, '/'); // Replace multiple slashes with single

  // Ensure we have a clean path to append - no duplicate /media/ segments
  return `${baseUrl}/media/${cleanPath}`;
};

/**
 * Cleans URL paths by removing duplicate media segments and normalizing slashes.
 * This function handles both full URLs and relative paths.
 *
 * @param {string} path - The original URL or path
 * @returns {string} - The cleaned and properly formatted URL
 */
export const cleanMediaPath = (path) => {
  if (!path) return '';

  // If it's already a full URL, return it as is
  if (path.startsWith('http')) {
    return path;
  }

  // Get base URL from environment or imported constant
  const baseUrl = API_BASE_URL;

  // Remove leading/trailing slashes and clean up the path
  const cleanPath = path
    .replace(/^\/+|\/+$/g, '') // Remove leading/trailing slashes
    .replace(/\/media\/media\//g, '/media/') // Remove duplicate media segments
    .replace(/^media\/|^\/media\//g, '') // Remove media prefix if present
    .replace(/\/+/g, '/'); // Replace multiple slashes with single

  // Combine the base URL with the cleaned path
  return `${baseUrl}/media/${cleanPath}`;
};

/**
 * Extract a relative media path from an absolute URL or path
 * Used in order creation to store just the relative path
 * @param {string} fullPath - The full image path or URL
 * @returns {string} - Just the media path portion
 */
export const extractMediaPath = (fullPath) => {
  if (!fullPath) return '';
  
  try {
    // If it's a full URL, parse it
    if (fullPath.startsWith('http')) {
      const url = new URL(fullPath);
      let path = url.pathname;
      
      // Remove any /media/ prefix and clean up
      return path
        .replace(/^\/media\/|^media\//g, '')
        .replace(/\/media\/media\//g, '/media/')
        .replace(/^\/+|\/+$/g, '')
        .replace(/\/+/g, '/');
    } else {
      // For relative paths, just clean them up
      return fullPath
        .replace(/^\/media\/|^media\//g, '')
        .replace(/\/media\/media\//g, '/media/')
        .replace(/^\/+|\/+$/g, '')
        .replace(/\/+/g, '/');
    }
  } catch (e) {
    console.error('Error extracting media path:', e);
    // Fallback: try to clean the path without URL parsing
    return fullPath
      .replace(/^\/media\/|^media\//g, '')
      .replace(/\/media\/media\//g, '/media/')
      .replace(/^\/+|\/+$/g, '')
      .replace(/\/+/g, '/');
  }
};

/**
 * Debug function to log media URL construction for troubleshooting
 * @param {string} path - The original image path
 */
export const debugImagePath = (path) => {
  if (!path) {
    console.log('DEBUG: No path provided');
    return;
  }

  const baseUrl = API_BASE_URL;
  const cleanPath = path
    .replace(/^\/+|\/+$/g, '')
    .replace(/\/media\/media\//g, '/media/')
    .replace(/^media\/|\/media$/g, '')
    .replace(/\/+/g, '/');
  
  const finalUrl = `${baseUrl}/media/${cleanPath}`;
  
  console.log({
    originalPath: path,
    baseUrl: baseUrl,
    cleanedPath: cleanPath,
    finalUrl: finalUrl,
    envVariables: {
      VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
      VITE_API_URL: import.meta.env.VITE_API_URL,
      VITE_MEDIA_URL: import.meta.env.VITE_MEDIA_URL
    }
  });
  
  return finalUrl;
};