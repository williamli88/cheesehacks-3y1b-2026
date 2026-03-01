import axios from 'axios';

function resolveApiBase() {
  const explicitBase = (import.meta.env.VITE_API_BASE_URL || '').trim();
  if (explicitBase) {
    return explicitBase;
  }

  const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  return `http://${host}:8080`;
}

const API_BASE = resolveApiBase();

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

export const confirmMatch = (userId, itemId, ownItemId) =>
  api.post('/matches/confirm', { userId, itemId, ownItemId });

export const rejectMatch = (userId, itemId) =>
  api.post('/matches/reject', { userId, itemId });

export const getImpact = (userId) =>
  api.get(`/impact/${userId}`);

export const postItem = (item) =>
  api.post('/items', item);

export const updateItem = (itemId, item) =>
  api.put(`/items/${itemId}`, item);

export const deleteItem = (itemId) =>
  api.delete(`/items/${itemId}`);

export const getUserItems = (userId) =>
  api.get(`/items/user/${userId}`);

export const getLikedItems = (userId) =>
  api.get(`/items/liked/${userId}`);
