import { io } from 'socket.io-client';

const URL = import.meta.env.MODE === 'production' ? window.location.origin : 'http://localhost:4000';

export const socket = io(URL, {
  autoConnect: true,
  withCredentials: true
});
