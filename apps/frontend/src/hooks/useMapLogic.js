import { useLoadScript } from '@react-google-maps/api';

const LIBRARIES = ['places'];

const useMapLogic = () => {
  // Get API key from runtime environment variables
  const apiKey = window._env_?.VITE_GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;
  
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES,
  });

  if (loadError) {
    console.error('Google Maps load error:', loadError);
  }

  return { isLoaded, loadError };
};

export default useMapLogic;
