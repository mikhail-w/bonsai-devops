import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Product from '../components/Product';
import Loader from '../components/Loader';
import Message from '../components/Message';
import Paginate from '../components/Paginate';
import { useNavigate } from 'react-router-dom';
import { listProducts } from '../actions/productActions';
import {
  SimpleGrid,
  Center,
  Box,
  Container,
  Heading,
  Text,
} from '@chakra-ui/react';

function ProductsPage() {
  const dispatch = useDispatch();
  const productList = useSelector(state => state.productList);
  const { error, loading, products, page, pages } = productList;
  const navigate = useNavigate();
  let keyword = location.search;

  useEffect(() => {
    dispatch(listProducts(keyword));
  }, [dispatch, keyword]);

  // Scroll to top after the keyword or page changes
  useEffect(() => {
    if (!loading) {
      setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth',
        });
      }, 100);
    }
  }, [keyword, page, loading]);

  return (
    <Container
      maxW="container.xl"
      mt={100}
      minH="100vh"
      pt={{ base: 10, md: 0 }} // Padding at the top for mobile view
      mb={100}
    >
      <Center flexDirection="column" mb={5} textAlign="center">
        <Heading
          textTransform={'uppercase'}
          as="h1"
          size="2xl"
          mb={100}
          fontFamily="roza"
        >
          All Products
        </Heading>
        <Text fontFamily={'lato'} fontSize="lg" color="gray.600">
          Discover our wide selection of bonsai plants and accessories
        </Text>
      </Center>

      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : (
        <>
          <SimpleGrid
            columns={{ base: 1, sm: 2, lg: 4 }}
            spacing={16}
            mb={16}
            minChildWidth="260px"
          >
            {products.map(product => (
              <Box key={product._id} w="100%" m="auto">
                <Product product={product} />
              </Box>
            ))}
          </SimpleGrid>
          {/* <Center marginBottom={'100px'}> */}
          <Center>
            <Paginate page={page} pages={pages} keyword={keyword} />
          </Center>
        </>
      )}
    </Container>
  );
}

export default ProductsPage;
