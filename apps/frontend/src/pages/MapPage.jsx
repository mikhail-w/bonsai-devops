import {
  Box,
  Text,
  Button,
  useDisclosure,
  Spinner,
  useBreakpointValue,
} from '@chakra-ui/react';
import useMapLogic from '../hooks/useMapLogic';
import React, { useState, useRef } from 'react';
import { useLoadScript } from '@react-google-maps/api';
import MapContainer from '../components/Map/MapContainer';
import MapSidebar from '../components/Map/MapSidebar';
import MapDetailsPanel from '../components/Map/MapDetailsPanel';
import MapDrawer from '../components/Map/MapDrawer';

function MapPage() {
  const { isLoaded, loadError } = useMapLogic();

  const [markers, setMarkers] = useState([]);
  const [activeMarker, setActiveMarker] = useState(null); // Track active marker
  const [locationList, setLocationList] = useState([]);
  const [center, setCenter] = useState({ lat: 0, lng: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [infoWindowVisible, setInfoWindowVisible] = useState(false);
  const [isMouseOver, setIsMouseOver] = useState(false); // Track if the mouse is over the marker or InfoWindow
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isPanelOpen, setPanelOpen] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [panTo, setPanTo] = useState(null);
  const closeTimeoutRef = useRef(null);

  // Determine if the screen size is mobile
  const isMobile = useBreakpointValue({ base: true, md: false });

  if (loadError) return <Text color="red.500">Error loading maps</Text>;
  if (!isLoaded) return <Spinner size="xl" />;

  const handleMouseOver = marker => {
    clearTimeout(closeTimeoutRef.current);
    setSelectedMarker(marker);
    setInfoWindowVisible(true);
    setIsMouseOver(true);
  };

  const handleMouseOut = () => {
    // Set a timeout to close the InfoWindow after a delay if the mouse isn't over the marker or InfoWindow
    closeTimeoutRef.current = setTimeout(() => {
      if (!isMouseOver) {
        setInfoWindowVisible(false);
        setSelectedMarker(null);
      }
    }, 200); // Adjust the delay as needed
  };

  const handleInfoWindowMouseOver = () => {
    clearTimeout(closeTimeoutRef.current);
    setIsMouseOver(true);
  };

  const handleInfoWindowMouseOut = () => {
    setIsMouseOver(false);
    // If the mouse leaves the window and the marker, hide the InfoWindow after a delay
    closeTimeoutRef.current = setTimeout(() => {
      if (!isMouseOver) {
        setInfoWindowVisible(false);
        setSelectedMarker(null);
      }
    }, 200); // Adjust the delay as needed
  };

  const handleInfoWindowCloseClick = () => {
    // Close the InfoWindow when the close button is clicked
    setInfoWindowVisible(false);
    setSelectedMarker(null);
  };

  const handleSearch = () => {
    // console.log('Search Term: ', searchTerm);
    setSearchTerm(searchTerm);
    if (searchTerm.trim()) {
      setMarkers([]);
      setLocationList([]);
    }
  };

  const handleIconClick = location => {
    // console.log('Selected Marker:', location);
    setSelectedLocation(location);
    const selectedMarker = markers.find(marker => marker.id === location.id);
    setActiveMarker(selectedMarker); // Update the active marker when a location link is clicked
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
  };

  if (loadError) return <Text color="red.500">Error loading maps</Text>;
  if (!isLoaded) return <Spinner size="xl" />;

  return (
    <Box
      display={{ md: 'flex' }}
      height="90vh"
      position="relative"
      overflow="hidden"
    >
      <MapSidebar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        handleSearch={handleSearch}
        locationList={locationList}
        setCenter={setCenter}
        panTo={panTo}
        setSelectedMarker={setSelectedMarker}
        handleIconClick={handleIconClick}
        handleSelectLocation={handleMouseOver}
      />

      <MapDrawer
        isOpen={isOpen}
        onClose={onClose}
        locationList={locationList}
        setCenter={setCenter}
        setSelectedMarker={setSelectedMarker}
        handleIconClick={handleIconClick}
      />

      <MapContainer
        setCenter={setCenter}
        searchTerm={searchTerm}
        center={center}
        markers={markers}
        setMarkers={setMarkers}
        locationList={locationList}
        setLocationList={setLocationList}
        handleMouseOver={handleMouseOver}
        handleMouseOut={handleMouseOut}
        handleInfoWindowCloseClick={handleInfoWindowCloseClick}
        selectedMarker={selectedMarker}
        setSelectedMarker={setSelectedMarker}
        infoWindowVisible={infoWindowVisible}
        onInfoWindowMouseOver={handleInfoWindowMouseOver}
        onInfoWindowMouseOut={handleInfoWindowMouseOut}
        setPanTo={setPanTo}
        activeMarker={activeMarker} // Pass the active marker state
      />

      <MapDetailsPanel
        selectedLocation={selectedLocation}
        closePanel={closePanel}
        isPanelOpen={isPanelOpen}
      />

      {isMobile && (
        <Button
          position="fixed"
          bottom="0"
          left="0"
          width="100%"
          // colorScheme="green"
          backgroundColor={'green.400'}
          onClick={onOpen}
          zIndex="1000"
          borderRadius={0}
          height={'50px'}
        >
          Show Locations
        </Button>
      )}
    </Box>
  );
}

export default MapPage;
