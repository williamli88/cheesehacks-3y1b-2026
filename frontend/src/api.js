import axios from 'axios';

const API_BASE = 'http://localhost:8080';

const api = axios.create({ baseURL: API_BASE });

export const login = (username, password) =>
  api.post('/auth/login', { username, password });

export const register = (username, email, password, campus, phoneNumber) =>
  api.post('/auth/register', { username, email, password, campus, phoneNumber });

export const getUsers = () =>
  api.get('/auth/users');

export const getFeed = (userId, filters = {}) =>
  api.get(`/feed/${userId}`, { params: filters });

export const postSwipe = (userIdFrom, itemIdTo, action) =>
  api.post('/swipe', { userIdFrom, itemIdTo, action });

export const getMatches = (userId) =>
  api.get(`/matches/${userId}`);

export const confirmMatch = (userId, itemId) =>
  api.post('/matches/confirm', { userId, itemId });

export const getImpact = (userId) =>
  api.get(`/impact/${userId}`);

export const postItem = (item) =>
  api.post('/items', item);

export const getUserItems = (userId) =>
  api.get(`/items/user/${userId}`);

export const getLikedItems = (userId) =>
  api.get(`/items/liked/${userId}`);
