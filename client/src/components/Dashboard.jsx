import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = ({ sessionId }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/data/${sessionId}`);
        if (response.data.success) {
          setUserData(response.data.data);
        }
      } catch (error) {
        console.error('Data fetch error:', error);
        setError('Failed to fetch user data');
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchData();
    }
  }, [sessionId]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-xl p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading your data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-xl p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="bg-white rounded-xl shadow-xl p-6">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-xl p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">📊 Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-indigo-50 rounded-lg p-4">
            <div className="text-sm text-indigo-600 font-semibold">Session ID</div>
            <div className="text-sm font-mono mt-1 break-all">{userData.session_id}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-green-600 font-semibold">First Visit</div>
            <div className="text-sm mt-1">{new Date(userData.first_visit).toLocaleString()}</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm text-purple-600 font-semibold">Last Updated</div>
            <div className="text-sm mt-1">{new Date(userData.last_updated).toLocaleString()}</div>
          </div>
        </div>

        {/* Location Data */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">📍 Location Information</h3>
          {userData.location && userData.location.latitude ? (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div>
                  <span className="text-gray-500">Latitude:</span>
                  <span className="ml-2 font-mono">{userData.location.latitude}</span>
                </div>
                <div>
                  <span className="text-gray-500">Longitude:</span>
                  <span className="ml-2 font-mono">{userData.location.longitude}</span>
                </div>
                <div>
                  <span className="text-gray-500">Accuracy:</span>
                  <span className="ml-2 font-mono">±{userData.location.accuracy}m</span>
                </div>
              </div>
              <div className="mt-2">
                <a
                  href={`https://www.openstreetmap.org/?mlat=${userData.location.latitude}&mlon=${userData.location.longitude}&zoom=15`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-800 text-sm"
                >
                  View on OpenStreetMap →
                </a>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No location data available</p>
          )}
        </div>

        {/* Photos */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            📸 Photos ({userData.photos?.length || 0})
          </h3>
          {userData.photos && userData.photos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {userData.photos.map((photo, index) => (
                <div key={index} className="bg-gray-50 rounded-lg overflow-hidden shadow-md">
                  <img
                    src={photo.image_data}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-2 text-xs text-gray-500">
                    {new Date(photo.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No photos captured yet</p>
          )}
        </div>

        {/* Device Info */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">🖥️ Device Information</h3>
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600 overflow-x-auto">
            <code>{userData.user_agent || 'Unknown'}</code>
          </div>
          {userData.ip_address && (
            <div className="mt-2 bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
              <span className="font-semibold">IP Address: </span>
              <code>{userData.ip_address}</code>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;