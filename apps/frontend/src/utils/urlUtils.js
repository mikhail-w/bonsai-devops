import { API_BASE_URL } from './axiosConfig';

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
 * Debug function to log URL construction for troubleshooting
 * @param {string} path - The original URL path
 * @param {string} type - The type of URL (media, api, static)
 */
export const debugUrlPath = (path, type = 'media') => {
  if (!path) {
    console.log('DEBUG: No path provided');
    return;
  }

  const baseUrl = API_BASE_URL;
  const cleanPath = path
    .replace(/^\/+|\/+$/g, '')
    .replace(new RegExp(`^\/${type}\/|\/${type}\/`, 'g'), '')
    .replace(/\/+/g, '/');
  
  const finalUrl = `${baseUrl}/${type}/${cleanPath}`;
  
  console.log({
    originalPath: path,
    pathType: type,
    baseUrl: baseUrl,
    cleanedPath: cleanPath,
    finalUrl: finalUrl,
    envVariables: {
      VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
      VITE_API_URL: import.meta.env.VITE_API_URL,
      VITE_MEDIA_URL: import.meta.env.VITE_MEDIA_URL,
      VITE_STATIC_URL: import.meta.env.VITE_STATIC_URL
    }
  });
  
  return finalUrl;
};

/**
 * Constructs an API URL with proper path handling
 * @param {string} endpoint - API endpoint to append
 * @returns {string} - Complete API URL
 */
export const getApiUrl = (endpoint) => {
  if (!endpoint) return import.meta.env.VITE_API_URL || `${API_BASE_URL}/api`;

  // Clean endpoint of leading slash
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  
  // Get API URL
  const apiUrl = import.meta.env.VITE_API_URL || `${API_BASE_URL}/api`;
  
  return `${apiUrl}/${cleanEndpoint}`;
};

/**
 * Constructs a static URL with proper path handling
 * @param {string} path - Path to the static file
 * @returns {string} - Complete static URL
 */
export const getStaticUrl = (path) => {
  if (!path) return '';

  // Clean path of leading slash and static prefix
  const cleanPath = path
    .replace(/^\/+/, '')
    .replace(/^static\//, '');
  
  // Get static URL
  const staticUrl = import.meta.env.VITE_STATIC_URL || `${API_BASE_URL}/static`;
  
  return `${staticUrl}/${cleanPath}`;
};