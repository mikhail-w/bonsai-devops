import axios from 'axios';
import {
  USER_LOGIN_REQUEST,
  USER_LOGIN_SUCCESS,
  USER_LOGIN_FAIL,
  USER_LOGOUT,
  USER_REGISTER_REQUEST,
  USER_REGISTER_SUCCESS,
  USER_REGISTER_FAIL,
  USER_DETAILS_REQUEST,
  USER_DETAILS_SUCCESS,
  USER_DETAILS_FAIL,
  USER_DETAILS_RESET,
  USER_UPDATE_PROFILE_REQUEST,
  USER_UPDATE_PROFILE_SUCCESS,
  USER_UPDATE_PROFILE_FAIL,
  USER_LIST_REQUEST,
  USER_LIST_SUCCESS,
  USER_LIST_FAIL,
  USER_LIST_RESET,
  USER_DELETE_REQUEST,
  USER_DELETE_SUCCESS,
  USER_DELETE_FAIL,
  USER_UPDATE_REQUEST,
  USER_UPDATE_SUCCESS,
  USER_UPDATE_FAIL,
} from '../constants/userConstants';
import { ORDER_LIST_MY_RESET } from '../constants/orderConstants';

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

// Utility to extract error messages
const getErrorPayload = error => {
  const detail = error.response?.data?.detail;
  if (detail) {
    return typeof detail === 'string' ? detail : JSON.stringify(detail);
  }
  return error.message;
};

// Login User
export const login = (email, password) => async dispatch => {
  try {
    dispatch({ type: USER_LOGIN_REQUEST });

    const { data } = await axiosClient.post(`/users/login/`, {
      username: email,
      password,
    });

    dispatch({ type: USER_LOGIN_SUCCESS, payload: data });
    localStorage.setItem('userInfo', JSON.stringify(data));
  } catch (error) {
    console.error('Login error:', error);
    dispatch({ type: USER_LOGIN_FAIL, payload: getErrorPayload(error) });
  }
};

// Logout User
export const logout = () => dispatch => {
  localStorage.removeItem('userInfo');
  localStorage.removeItem('shippingAddress');
  dispatch({ type: USER_LOGOUT });
  dispatch({ type: USER_DETAILS_RESET });
  dispatch({ type: ORDER_LIST_MY_RESET });
  dispatch({ type: USER_LIST_RESET });
};

// Register User
export const register = formData => async dispatch => {
  try {
    dispatch({ type: USER_REGISTER_REQUEST });

    const config = {
      headers: { 
        'Content-Type': 'multipart/form-data' 
      },
    };

    const { data } = await axiosClient.post(`/users/register/`, formData, config);

    dispatch({ type: USER_REGISTER_SUCCESS, payload: data });
    dispatch({ type: USER_LOGIN_SUCCESS, payload: data });
    localStorage.setItem('userInfo', JSON.stringify(data));
  } catch (error) {
    console.error('Register error:', error);
    dispatch({ type: USER_REGISTER_FAIL, payload: getErrorPayload(error) });
  }
};

// Get User Details
export const getUserDetails = id => async (dispatch, getState) => {
  try {
    dispatch({ type: USER_DETAILS_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        Authorization: userInfo ? `Bearer ${userInfo.token}` : '',
      },
    };

    const { data } = await axiosClient.get(`/users/${id}/`, config);

    dispatch({ type: USER_DETAILS_SUCCESS, payload: data });
  } catch (error) {
    dispatch({ type: USER_DETAILS_FAIL, payload: getErrorPayload(error) });
  }
};

// Update User Profile
export const updateUserProfile = userData => async (dispatch, getState) => {
  try {
    dispatch({ type: USER_UPDATE_PROFILE_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();

    const isFormData = userData instanceof FormData;
    const config = {
      headers: {
        'Content-Type': isFormData ? 'multipart/form-data' : 'application/json',
        Authorization: userInfo ? `Bearer ${userInfo.token}` : '',
      },
    };

    const { data } = await axiosClient.put(`/users/profile/update/`, userData, config);

    dispatch({ type: USER_UPDATE_PROFILE_SUCCESS, payload: data });
    dispatch({ type: USER_LOGIN_SUCCESS, payload: data });
    localStorage.setItem('userInfo', JSON.stringify(data));
    return data;
  } catch (error) {
    dispatch({
      type: USER_UPDATE_PROFILE_FAIL,
      payload: getErrorPayload(error),
    });
    throw error;
  }
};

// List Users
export const listUsers = () => async (dispatch, getState) => {
  try {
    dispatch({ type: USER_LIST_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        Authorization: userInfo ? `Bearer ${userInfo.token}` : '',
      },
    };

    const { data } = await axiosClient.get(`/users/`, config);

    dispatch({ type: USER_LIST_SUCCESS, payload: data });
  } catch (error) {
    dispatch({ type: USER_LIST_FAIL, payload: getErrorPayload(error) });
  }
};

// Delete User
export const deleteUser = id => async (dispatch, getState) => {
  try {
    dispatch({ type: USER_DELETE_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        Authorization: userInfo ? `Bearer ${userInfo.token}` : '',
      },
    };

    await axiosClient.delete(`/users/delete/${id}/`, config);

    dispatch({ type: USER_DELETE_SUCCESS });
  } catch (error) {
    dispatch({ type: USER_DELETE_FAIL, payload: getErrorPayload(error) });
  }
};

// Update User
export const updateUser = user => async (dispatch, getState) => {
  try {
    dispatch({ type: USER_UPDATE_REQUEST });

    const {
      userLogin: { userInfo },
    } = getState();

    const config = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: userInfo ? `Bearer ${userInfo.token}` : '',
      },
    };

    const { data } = await axiosClient.put(`/users/update/${user._id}/`, user, config);

    dispatch({ type: USER_UPDATE_SUCCESS });
    dispatch({ type: USER_DETAILS_SUCCESS, payload: data });
  } catch (error) {
    dispatch({ type: USER_UPDATE_FAIL, payload: getErrorPayload(error) });
  }
};