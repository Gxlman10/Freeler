import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface Campaign {
  id: number;
  nombre: string;
  descripcion: string;
  comision: number;
  fecha_fin: string;
}

const HomePage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    // Simular carga de campañas
    setCampaigns([
      {
        id: 1,
        nombre: 'Venta de Lotes - Las Palmeras',
        descripcion: 'Excelente oportunidad de inversión en lotes residenciales ubicados en zona de crecimiento...',
        comision: 5.0,
        fecha_fin: '2024-12-31'
      },
      {
        id: 2,
        nombre: 'Departamentos Vista Mar',
        descripcion: 'Modernos departamentos con vista al mar, acabados de primera calidad...',
        comision: 3.5,
        fecha_fin: '2024-11-30'
      }
    ]);
  }, []);

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Freeler</h1>
          <div className="space-x-4">
            {user ? (
              <span>Hola, {user.nombres}</span>
            ) : (
              <Link 
                to="/login" 
                className="bg-blue-700 px-4 py-2 rounded hover:bg-blue-800"
              >
                Iniciar sesión
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto p-8">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Buscar campañas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
            Buscar
          </button>
        </div>
      </div>

      {/* Campaigns */}
      <div className="max-w-4xl mx-auto px-4">
        <div className="grid gap-6">
          {filteredCampaigns.map(campaign => (
            <div key={campaign.id} className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-3">{campaign.nombre}</h2>
              <p className="text-gray-600 mb-4">{campaign.descripcion}</p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  Comisión: {campaign.comision}%
                </span>
                <Link
                  to={`/campaign/${campaign.id}`}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Ver más
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;