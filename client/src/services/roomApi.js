import apiClient from './api';

export const fetchRooms = async () => {
  const res = await apiClient.get('/rooms');
  return res.data;
};

export const fetchRoom = async (roomId) => {
  const res = await apiClient.get(`/rooms/${roomId}`);
  return res.data;
};

export const createRoom = async (name) => {
  const res = await apiClient.post('/rooms', { name });
  return res.data;
};

export const updateRoom = async (roomId, name) => {
  const res = await apiClient.patch(`/rooms/${roomId}`, { name });
  return res.data;
};

export const deleteRoom = async (roomId) => {
  const res = await apiClient.delete(`/rooms/${roomId}`);
  return res.data;
};
