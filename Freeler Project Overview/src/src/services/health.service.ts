import api from '../lib/api';

export const healthService = {
  root: async () => {
    const res = await api.get('/');
    return res.data;
  },
};

