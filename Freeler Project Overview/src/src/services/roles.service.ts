import api from '../lib/api';

export interface Rol {
  id_rol: number;
  nombre: string;
  descripcion?: string | null;
}

export const rolesService = {
  getAll: async (): Promise<Rol[]> => {
    const res = await api.get<Rol[]>('/roles');
    return res.data;
  },
  ping: async () => {
    const res = await api.get('/roles/ping');
    return res.data;
  }
};

export default rolesService;

