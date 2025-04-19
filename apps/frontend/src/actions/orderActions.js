import axios from 'axios';
import {
  ORDER_CREATE_REQUEST,
  ORDER_CREATE_SUCCESS,
  ORDER_CREATE_FAIL,
  ORDER_DETAILS_REQUEST,
  ORDER_DETAILS_SUCCESS,
  ORDER_DETAILS_FAIL,
  ORDER_PAY_REQUEST,
  ORDER_PAY_SUCCESS,
  ORDER_PAY_FAIL,
  ORDER_LIST_MY_REQUEST,
  ORDER_LIST_MY_SUCCESS,
  ORDER_LIST_MY_FAIL,
  ORDER_LIST_REQUEST,
  ORDER_LIST_SUCCESS,
  ORDER_LIST_FAIL,
  ORDER_DELIVER_REQUEST,
  ORDER_DELIVER_SUCCESS,
  ORDER_DELIVER_FAIL,
} from '../constants/orderConstants';

import { CART_CLEAR_ITEMS } from '../constants/cartConstants';

// Define API URLs from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_URL = import.meta.env.VITE_API_URL || `${API_BASE_URL}/api`;

/**
 * Extract a relative media path from an absolute URL or path
 * Used in order creation to store just the relative path
 * @param {string} fullPath - The full image path or URL
 * @returns {string} - Just the media path portion
 */
const extractMediaPath = (fullPath) => {
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
    // Fallback: try to clean the path without URL parsing
    return fullPath
      .replace(/^\/media\/|^media\//g, '')
      .replace(/\/media\/media\//g, '/media/')
      .replace(/^\/+|\/+$/g, '')
      .replace(/\/+/g, '/');
  }
};

// Main order creation action
export const createOrder = order => async (dispatch, getState) => {
  let config;
  try {
    dispatch({
      type: ORDER_CREATE_REQUEST,
    });

    const {
      userLogin: { userInfo },
    } = getState();

    const orderData = {
      ...order,
      itemsPrice: Number(order.itemsPrice),
      shippingPrice: Number(order.shippingPrice),
      taxPrice: Number(order.taxPrice),
      totalPrice: Number(order.totalPrice),
      orderItems: order.orderItems.map(item => {
        // Use the extractMediaPath utility to get just the relative path
        const relativePath = extractMediaPath(item.image);

        return {
          product: item.product,
          name: item.name,
          qty: Number(item.qty),
          price: Number(item.price),
          image: relativePath,
        };
      }),
    };

    config = {
      headers: {
        'Content-type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await axios.post(
      `${API_URL}/orders/add/`,
      orderData,
      config
    );

    dispatch({
      type: ORDER_CREATE_SUCCESS,
      payload: data,
    });

    dispatch({
      type: CART_CLEAR_ITEMS,
    });

    localStorage.removeItem('cartItems');
  } catch (error) {
    console.error('Order creation failed:', {
      error: error.response?.data || error.message,
      statusCode: error.response?.status,
    });

    dispatch({
      type: ORDER_CREATE_FAIL,
      payload: error.response?.data?.detail || error.message,
    });
  }
};

// Action to get details of a specific order
export const getOrderDetails = id => async (dispatch, getState) => {
  try {
    dispatch({
      type: ORDER_DETAILS_REQUEST,
    });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        'Content-type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await axios.get(`${API_URL}/orders/${id}/`, config);

    dispatch({
      type: ORDER_DETAILS_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: ORDER_DETAILS_FAIL,
      payload:
        error.response && error.response.data.detail
          ? error.response.data.detail
          : error.message,
    });
  }
};

// Action to handle order payment
export const payOrder = (id, paymentResult) => async (dispatch, getState) => {
  try {
    dispatch({
      type: ORDER_PAY_REQUEST,
    });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        'Content-type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await axios.put(
      `${API_URL}/orders/${id}/pay/`,
      paymentResult,
      config
    );

    dispatch({
      type: ORDER_PAY_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: ORDER_PAY_FAIL,
      payload:
        error.response && error.response.data.detail
          ? error.response.data.detail
          : error.message,
    });
  }
};

// Action to mark an order as delivered
export const deliverOrder = order => async (dispatch, getState) => {
  try {
    dispatch({
      type: ORDER_DELIVER_REQUEST,
    });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        'Content-type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await axios.put(
      `${API_URL}/orders/${order._id}/deliver/`,
      {},
      config
    );

    dispatch({
      type: ORDER_DELIVER_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: ORDER_DELIVER_FAIL,
      payload:
        error.response && error.response.data.detail
          ? error.response.data.detail
          : error.message,
    });
  }
};

// Action to fetch user's orders
export const listMyOrders = () => async (dispatch, getState) => {
  try {
    dispatch({
      type: ORDER_LIST_MY_REQUEST,
    });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        'Content-type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await axios.get(`${API_URL}/orders/myorders/`, config);

    dispatch({
      type: ORDER_LIST_MY_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: ORDER_LIST_MY_FAIL,
      payload:
        error.response && error.response.data.detail
          ? error.response.data.detail
          : error.message,
    });
  }
};

// Action to fetch all orders (admin only)
export const listOrders = () => async (dispatch, getState) => {
  try {
    dispatch({
      type: ORDER_LIST_REQUEST,
    });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        'Content-type': 'application/json',
        Authorization: `Bearer ${userInfo.token}`,
      },
    };

    const { data } = await axios.get(`${API_URL}/orders/`, config);

    dispatch({
      type: ORDER_LIST_SUCCESS,
      payload: data,
    });
  } catch (error) {
    dispatch({
      type: ORDER_LIST_FAIL,
      payload:
        error.response && error.response.data.detail
          ? error.response.data.detail
          : error.message,
    });
  }
};