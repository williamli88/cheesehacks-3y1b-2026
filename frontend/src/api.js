import axios from 'axios';

const API_BASE = 'http://localhost:8080';

const api = axios.create({ baseURL: API_BASE });

export const login = (username, password) =>
  api.post('/auth/login', { username, password });

export const register = (username, email, password, campus) =>
  api.post('/auth/register', { username, email, password, campus });

export const getUsers = () =>
  api.get('/auth/users');

export const getFeed = (userId) =>
  api.get(`/feed/${userId}`);

export const postSwipe = (userIdFrom, itemIdTo, action) =>
  api.post('/swipe', { userIdFrom, itemIdTo, action });

export const getMatches = (userId) =>
  api.get(`/matches/${userId}`);

export const getImpact = (userId) =>
  api.get(`/impact/${userId}`);

export const postItem = (item) =>
  api.post('/items', item);

export const getUserItems = (userId) =>
  api.get(`/items/user/${userId}`);

export const getLikedItems = (userId) =>
  api.get(`/items/liked/${userId}`);
