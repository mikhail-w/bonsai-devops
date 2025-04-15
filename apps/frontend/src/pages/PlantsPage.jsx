import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Product from '../components/Product';
import Loader from '../components/Loader';
import Message from '../components/Message';
import Paginate from '../components/Paginate';
import { listPlantProducts } from '../actions/productActions';
import {
  SimpleGrid,
  Center,
  Container,
  Text,
  Heading,
  VStack,
} from '@chakra-ui/react';
import ScrollToTopButton from '../components/ScrollToTopButton';

function PlantsPage() {
  const dispatch = useDispatch();
  const productPlants = useSelector(state => state.productPlants);
  const { error, loading, products, page, pages } = productPlants;

  let keyword = location.search;

  useEffect(() => {
    dispatch(listPlantProducts(keyword));
  }, [dispatch, keyword]);

  return (
    <>
      <Container maxW="container.xl" mt="100px" minH="100vh">
        <Center
          flexDirection={'column'}
          marginTop={50}
          marginBottom={100}
          minH={'100vh'}
          justifyContent={'space-between'}
        >
          <VStack marginBottom={{ base: '50', md: '100px' }}>
            <Heading
              textTransform={'uppercase'}
              as="h1"
              size="2xl"
              mb={6}
              fontFamily="roza"
            >
              Latest Plants
            </Heading>
            <Text
              textAlign={'center'}
              fontFamily={'lato'}
              fontSize="lg"
              color="gray.600"
            >
              Discover our wide selection of expertly curated bonsai plants
            </Text>
          </VStack>
          <SimpleGrid
            minChildWidth={300}
            spacing="10px"
            width="100%"
            px={5} // Padding to add spacing on small screens
          >
            {loading ? (
              <Center marginBottom={'80vh'}>
                <Loader />
              </Center>
            ) : error ? (
              <Message variant={'danger'}>{error}</Message>
            ) : (
              products.map(product => (
                <Product key={product._id} product={product} />
              ))
            )}
          </SimpleGrid>
          <Paginate page={page} pages={pages} keyword={keyword} />
        </Center>
      </Container>
      <ScrollToTopButton />
    </>
  );
}

export default PlantsPage;
