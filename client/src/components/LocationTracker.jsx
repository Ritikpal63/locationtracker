import React, { useState, useEffect } from 'react';
import axios from 'axios';

const LocationTracker = ({ sessionId }) => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [watchId, setWatchId] = useState(null);
  const [isWatching, setIsWatching] = useState(false);
  const [locationHistory, setLocationHistory] = useState([]);

  // Check if browser supports geolocation
  const isGeolocationSupported = 'geolocation' in navigator;

  // Get current location
  const getCurrentLocation = () => {
    if (!isGeolocationSupported) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const locationData = {
          latitude,
          longitude,
          accuracy,
          timestamp: new Date().toISOString()
        };

        setLocation(locationData);
        setLocationHistory(prev => [...prev, locationData]);

        // Send to backend
        try {
          await axios.post('/location', {
            sessionId,
            latitude,
            longitude,
            accuracy
          });
          console.log('Location saved successfully');
        } catch (error) {
          console.error('Error saving location:', error);
          setError('Failed to save location to server');
        }

        setLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setError(`Error getting location: ${error.message}`);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Start watching location
  const startWatching = () => {
    if (!isGeolocationSupported) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    if (watchId) {
      stopWatching();
    }

    setIsWatching(true);
    setError(null);

    const id = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const locationData = {
          latitude,
          longitude,
          accuracy,
          timestamp: new Date().toISOString()
        };

        setLocation(locationData);
        setLocationHistory(prev => [...prev, locationData]);

        try {
          await axios.post('/location', {
            sessionId,
            latitude,
            longitude,
            accuracy
          });
        } catch (error) {
          console.error('Error saving location:', error);
        }
      },
      (error) => {
        console.error('Watch error:', error);
        setError(`Error watching location: ${error.message}`);
        setIsWatching(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    setWatchId(id);
  };

  // Stop watching location
  const stopWatching = () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setIsWatching(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return (
    <div className="bg-white rounded-xl shadow-xl p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">📍 Location Tracker</h2>
      
      {!isGeolocationSupported && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <p className="text-yellow-700">Geolocation is not supported by your browser</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap gap-4">
          <button
            onClick={getCurrentLocation}
            disabled={loading || !isGeolocationSupported}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
          >
            {loading ? 'Getting location...' : '📍 Get Current Location'}
          </button>

          <button
            onClick={isWatching ? stopWatching : startWatching}
            disabled={!isGeolocationSupported}
            className={`px-6 py-2 rounded-lg transition duration-200 ${
              isWatching 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-green-600 text-white hover:bg-green-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isWatching ? '⏹ Stop Tracking' : '▶ Start Tracking'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Current Location Display */}
        {location && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-2">Current Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Latitude:</span>
                <span className="ml-2 font-mono">{location.latitude}</span>
              </div>
              <div>
                <span className="text-gray-500">Longitude:</span>
                <span className="ml-2 font-mono">{location.longitude}</span>
              </div>
              <div>
                <span className="text-gray-500">Accuracy:</span>
                <span className="ml-2 font-mono">±{location.accuracy}m</span>
              </div>
              <div>
                <span className="text-gray-500">Time:</span>
                <span className="ml-2 font-mono">{new Date(location.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
            <div className="mt-3">
              <a
                href={`https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}&zoom=15`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-800 text-sm"
              >
                View on OpenStreetMap →
              </a>
            </div>
          </div>
        )}

        {/* Location History */}
        {locationHistory.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold text-gray-700 mb-2">
              Location History ({locationHistory.length} entries)
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
              {locationHistory.slice().reverse().map((loc, index) => (
                <div key={index} className="text-sm py-1 border-b border-gray-200 last:border-0">
                  <span className="font-mono">
                    {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
                  </span>
                  <span className="text-gray-500 ml-4">
                    {new Date(loc.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationTracker;