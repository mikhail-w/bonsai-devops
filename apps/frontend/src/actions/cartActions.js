import axios from 'axios';
import {
  CART_ADD_ITEM,
  CART_REMOVE_ITEM,
  CART_SAVE_SHIPPING_ADDRESS,
  CART_SAVE_PAYMENT_METHOD,
  CART_CLEAR_ITEMS,
} from '../constants/cartConstants';

// Define API URLs from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_URL = import.meta.env.VITE_API_URL || `${API_BASE_URL}/api`;

// Create axios instance with consistent configuration
const axiosClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const addToCart = (id, qty) => async (dispatch, getState) => {
  try {
    const { data } = await axiosClient.get(`/products/${id}/`);

    dispatch({
      type: CART_ADD_ITEM,
      payload: {
        product: data._id,
        name: data.name,
        image: data.image,
        price: data.price,
        countInStock: data.countInStock,
        qty,
      },
    });
    localStorage.setItem('cartItems', JSON.stringify(getState().cart.cartItems));
  } catch (error) {
    console.error('Error adding to cart:', error);
  }
};

export const removeFromCart = id => (dispatch, getState) => {
  dispatch({
    type: CART_REMOVE_ITEM,
    payload: id,
  });

  localStorage.setItem('cartItems', JSON.stringify(getState().cart.cartItems));
};

export const clearCart = () => (dispatch, getState) => {
  dispatch({
    type: CART_CLEAR_ITEMS,
    payload: {},
  });

  localStorage.setItem('cartItems', JSON.stringify(getState().cart.cartItems));
};

export const saveShippingAddress = data => dispatch => {
  dispatch({
    type: CART_SAVE_SHIPPING_ADDRESS,
    payload: data,
  });

  localStorage.setItem('shippingAddress', JSON.stringify(data));
};

export const savePaymentMethod = data => dispatch => {
  dispatch({
    type: CART_SAVE_PAYMENT_METHOD,
    payload: data,
  });

  localStorage.setItem('paymentMethod', JSON.stringify(data));
};