import React, { useState } from 'react';
import { Box, Image } from '@chakra-ui/react';

// Get environment variables
const IS_DEVELOPMENT = import.meta.env.VITE_ENV === 'development';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const S3_BASE_URL = import.meta.env.VITE_S3_PATH;
const MEDIA_URL = import.meta.env.VITE_MEDIA_URL || `${API_BASE_URL}/media/`;

const S3ImageHandler = ({
  imagePath,
  alt,
  roundedTop,
  objectFit,
  height,
  width,
  transition,
}) => {
  const [imageError, setImageError] = useState(false);

  const getImageUrl = path => {
    if (!path) return null;

    // If it's already a full URL, return it as is
    if (path.startsWith('http')) {
      return path;
    }

    // Clean the path by removing any prefixes and extra slashes
    const cleanPath = path
      .replace(/^\/+|\/+$/g, '') // Remove leading/trailing slashes
      .replace(/^media\/?/, '') // Remove 'media/' prefix if exists
      .replace(/\/+/g, '/'); // Replace multiple slashes with single

    // Use the MEDIA_URL environment variable
    return `${MEDIA_URL.replace(/\/+$/, '')}/${cleanPath}`;
  };

  const handleError = () => {
    console.error(`Image failed to load: ${imagePath}`);
    setImageError(true);
  };

  // Placeholder component for failed/missing images
  const ImagePlaceholder = () => (
    <Box
      height={height}
      width={width}
      bg="gray.100"
      display="flex"
      alignItems="center"
      justifyContent="center"
      roundedTop={roundedTop}
    >
      <svg
        width="60"
        height="60"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ color: '#A0AEC0' }}
      >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    </Box>
  );

  if (imageError || !imagePath) {
    return <ImagePlaceholder />;
  }

  return (
    <Image
      src={getImageUrl(imagePath)}
      alt={alt}
      roundedTop={roundedTop}
      objectFit={objectFit}
      height={height}
      width={width}
      transition={transition}
      onError={handleError}
      loading="lazy"
    />
  );
};

export default S3ImageHandler;