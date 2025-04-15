import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Box, VStack, Text, Button, useColorModeValue } from '@chakra-ui/react';

const AugmentedReality = ({ setQrCodeUrl }) => {
  const canvasRef = useRef();

  // URL for the `.glb` and `.usdz` files hosted on AWS S3
  const gltfUrl = `${import.meta.env.VITE_S3_PATH}/media/ficus_bonsai.glb`;
  const usdzUrl = `${import.meta.env.VITE_S3_PATH}/media/ficus_bonsai.usdz`; // For iOS devices

  // Detect if the user is on an iOS device
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

  // Construct the AR viewer link based on the platform
  const arLink = isIOS
    ? usdzUrl // iOS uses .usdz files for Quick Look
    : `https://arvr.google.com/scene-viewer/1.0?file=${gltfUrl}&mode=ar-only`; // Android uses .glb files for Scene Viewer

  const textColor = useColorModeValue('green.600', 'white.700');

  useEffect(() => {
    // Generate a QR code for the AR link
    QRCode.toCanvas(canvasRef.current, arLink, { width: 200 });

    // Generate the QR code as a data URL and pass it to the parent component
    QRCode.toDataURL(arLink, { width: 200 }, (err, dataUrl) => {
      if (!err && setQrCodeUrl) {
        setQrCodeUrl(dataUrl); // Pass the data URL to the parent component if setQrCodeUrl is provided
      }
    });
  }, [arLink, setQrCodeUrl]);

  return (
    <Box textAlign="center" fontSize="xl" p={5} mt={'100px'}>
      <VStack spacing={5}>
        <Text
          fontFamily={'rale'}
          fontSize="2xl"
          fontWeight="400"
          color={textColor}
          textAlign="center"
        >
          View Bonsai in AR
        </Text>
        {/* Canvas element to render the QR Code */}
        <canvas ref={canvasRef} />
        <Button
          fontFamily={'rale'}
          colorScheme="green"
          as="a"
          href={arLink}
          target="_blank"
          rel="noopener noreferrer"
          visibility={{ base: 'visible', md: 'hidden', lg: 'hidden' }}
        >
          Open in AR
        </Button>
      </VStack>
    </Box>
  );
};

export default AugmentedReality;
