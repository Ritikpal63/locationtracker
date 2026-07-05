import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import LocationTracker from './components/LocationTracker';
import CameraCapture from './components/CameraCapture';
import Dashboard from './components/Dashboard';
import axios from 'axios';

// Configure axios base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
axios.defaults.baseURL = API_URL;

function App() {
  const [sessionId, setSessionId] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeSession = async () => {
      try {
        let storedSessionId = localStorage.getItem('sessionId');
        
        const response = await axios.post('/session', {}, {
          headers: {
            'X-Session-Id': storedSessionId || ''
          }
        });

        if (response.data.success) {
          const newSessionId = response.data.sessionId;
          setSessionId(newSessionId);
          setUserId(response.data.userId);
          localStorage.setItem('sessionId', newSessionId);
          localStorage.setItem('userId', response.data.userId);
        }
      } catch (error) {
        console.error('Session initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeSession();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex space-x-8">
                <Link to="/" className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:border-b-2 hover:border-indigo-500">
                  📍 Location
                </Link>
                <Link to="/camera" className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:border-b-2 hover:border-indigo-500">
                  📸 Camera
                </Link>
                <Link to="/dashboard" className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:border-b-2 hover:border-indigo-500">
                  📊 Dashboard
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  Session: {sessionId?.substring(0, 12)}...
                </span>
                {userId && (
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    ID: {userId}
                  </span>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<LocationTracker sessionId={sessionId} />} />
            <Route path="/camera" element={<CameraCapture sessionId={sessionId} />} />
            <Route path="/dashboard" element={<Dashboard sessionId={sessionId} />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;