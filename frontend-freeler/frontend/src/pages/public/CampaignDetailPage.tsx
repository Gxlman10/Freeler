import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface Campaign {
  id: number;
  nombre: string;
  razon_social: string;
  ruc: string;
  fecha_inicio: string;
  fecha_fin: string;
  comision: number;
  descripcion: string;
  images: string[];
}

const CampaignDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    // Simular carga de campaña
    setCampaign({
      id: 1,
      nombre: 'Venta de Lotes - Las Palmeras',
      razon_social: 'Inmobiliaria Las Palmeras SAC',
      ruc: '20123456789',
      fecha_inicio: '2024-01-01',
      fecha_fin: '2024-12-31',
      comision: 5.0,
      descripcion: 'Excelente oportunidad de inversión en lotes residenciales ubicados en zona de crecimiento. Los lotes cuentan con todos los servicios básicos y están ubicados en una zona de alta valorización.',
      images: [
        'https://via.placeholder.com/180x120?text=Imagen+1',
        'https://via.placeholder.com/180x120?text=Imagen+2',
        'https://via.placeholder.com/180x120?text=Imagen+3'
      ]
    });
  }, [id]);

  if (!campaign) {
    return <div className="flex justify-center items-center h-screen">Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4">
        <div className="max-w-4xl mx-auto">
          <Link to="/" className="text-blue-200 hover:text-white">← Volver a campañas</Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto bg-white mt-8 p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-blue-600 mb-6">{campaign.nombre}</h1>
        
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="space-y-3">
            <p><strong>Razón Social:</strong> {campaign.razon_social}</p>
            <p><strong>RUC:</strong> {campaign.ruc}</p>
            <p><strong>Fecha de inicio:</strong> {campaign.fecha_inicio}</p>
            <p><strong>Fecha de fin:</strong> {campaign.fecha_fin}</p>
            <p><strong>Comisión:</strong> {campaign.comision}%</p>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Contenido de la campaña</h2>
          <p className="text-gray-700 leading-relaxed">{campaign.descripcion}</p>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Imágenes</h3>
          <div className="flex gap-4 flex-wrap">
            {campaign.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Imagen ${index + 1}`}
                className="w-44 h-32 object-cover rounded-lg border"
              />
            ))}
          </div>
        </div>

        <div className="text-center">
          {user ? (
            <Link
              to={`/campaign/${campaign.id}/refer`}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 inline-block"
            >
              Agregar referido
            </Link>
          ) : (
            <Link
              to="/login"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 inline-block"
            >
              Iniciar sesión para referir
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampaignDetailPage;