import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const CameraCapture = ({ sessionId }) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [photoHistory, setPhotoHistory] = useState([]);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Check if browser supports getUserMedia
  const isCameraSupported = 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices;

  // Start camera
  const startCamera = async () => {
    if (!isCameraSupported) {
      setError('Camera is not supported by your browser');
      return;
    }

    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (error) {
      console.error('Camera error:', error);
      setError(`Error accessing camera: ${error.message}`);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsCameraActive(false);
      setCapturedImage(null);
    }
  };

  // Capture photo
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageData);
  };

  // Save photo to server
  const savePhoto = async () => {
    if (!capturedImage) return;

    setIsSaving(true);
    setError(null);

    try {
      const deviceInfo = navigator.userAgent || 'Unknown device';
      
      // Get current location if available
      let location = null;
      if ('geolocation' in navigator) {
        try {
          const pos = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          location = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          };
        } catch (error) {
          console.log('Location not available for photo metadata');
        }
      }

      await axios.post('/photo', {
        sessionId,
        imageData: capturedImage,
        location,
        deviceInfo
      });

      // Add to history
      setPhotoHistory(prev => [{
        imageData: capturedImage,
        timestamp: new Date().toISOString()
      }, ...prev]);

      // Clear captured image
      setCapturedImage(null);
      
      alert('Photo saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      setError('Failed to save photo');
    } finally {
      setIsSaving(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="bg-white rounded-xl shadow-xl p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">📸 Camera Capture</h2>

      {!isCameraSupported && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <p className="text-yellow-700">Camera is not supported by your browser</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Camera Controls */}
        <div className="flex flex-wrap gap-4">
          {!isCameraActive ? (
            <button
              onClick={startCamera}
              disabled={!isCameraSupported}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
            >
              📷 Start Camera
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-200"
            >
              ⏹ Stop Camera
            </button>
          )}

          {isCameraActive && (
            <button
              onClick={capturePhoto}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-200"
            >
              📸 Capture Photo
            </button>
          )}

          {capturedImage && (
            <button
              onClick={savePhoto}
              disabled={isSaving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
            >
              {isSaving ? 'Saving...' : '💾 Save Photo'}
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} className="hidden"></canvas>

        {/* Video Display */}
        {isCameraActive && (
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full max-h-[500px] object-contain"
              playsInline
              autoPlay
              muted
            />
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
              Camera Active
            </div>
          </div>
        )}

        {/* Captured Image Preview */}
        {capturedImage && (
          <div className="mt-4">
            <h3 className="font-semibold text-gray-700 mb-2">Captured Photo</h3>
            <div className="relative bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full max-h-[400px] object-contain"
              />
              <button
                onClick={() => setCapturedImage(null)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition duration-200"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Photo History */}
        {photoHistory.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold text-gray-700 mb-2">
              Photo History ({photoHistory.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-64 overflow-y-auto p-2 bg-gray-50 rounded-lg">
              {photoHistory.map((photo, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <img
                    src={photo.imageData}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-32 object-cover"
                  />
                  <div className="text-xs text-gray-500 p-1 text-center">
                    {new Date(photo.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CameraCapture;