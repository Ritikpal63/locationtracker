const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Helper function to generate session ID
const generateSessionId = () => {
  return 'user_' + Date.now() + '_' + uuidv4().substring(0, 8);
};

// Get or create user session
router.post('/session', async (req, res) => {
  try {
    let sessionId = req.headers['x-session-id'];
    let userId = null;
    let userData = null;

    // Check if session exists
    if (sessionId) {
      const [rows] = await pool.query(
        'SELECT * FROM users WHERE session_id = ?',
        [sessionId]
      );
      
      if (rows.length > 0) {
        userId = rows[0].id;
        userData = rows[0];
      }
    }

    // Create new session if not exists
    if (!userId) {
      sessionId = generateSessionId();
      const [result] = await pool.query(
        `INSERT INTO users (session_id, user_agent, ip_address) 
         VALUES (?, ?, ?)`,
        [sessionId, req.headers['user-agent'], req.ip || req.connection.remoteAddress]
      );
      userId = result.insertId;
      
      // Fetch the created user data
      const [rows] = await pool.query(
        'SELECT * FROM users WHERE id = ?',
        [userId]
      );
      userData = rows[0];
    }

    res.json({
      success: true,
      sessionId: sessionId,
      userId: userId,
      data: userData
    });
  } catch (error) {
    console.error('Session error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save location
router.post('/location', async (req, res) => {
  try {
    const { sessionId, latitude, longitude, accuracy } = req.body;

    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'Session ID required' });
    }

    // Get user ID from session
    const [userRows] = await pool.query(
      'SELECT id FROM users WHERE session_id = ?',
      [sessionId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    const userId = userRows[0].id;

    // Insert location
    const [result] = await pool.query(
      `INSERT INTO locations (user_id, latitude, longitude, accuracy) 
       VALUES (?, ?, ?, ?)`,
      [userId, latitude, longitude, accuracy]
    );

    // Update user's last_updated timestamp
    await pool.query(
      'UPDATE users SET last_updated = CURRENT_TIMESTAMP WHERE id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: 'Location saved successfully',
      locationId: result.insertId,
      data: { latitude, longitude, accuracy }
    });
  } catch (error) {
    console.error('Location save error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Save photo
router.post('/photo', async (req, res) => {
  try {
    const { sessionId, imageData, location, deviceInfo } = req.body;

    if (!sessionId || !imageData) {
      return res.status(400).json({ success: false, error: 'Session ID and image data required' });
    }

    // Get user ID from session
    const [userRows] = await pool.query(
      'SELECT id FROM users WHERE session_id = ?',
      [sessionId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    const userId = userRows[0].id;

    // Insert photo
    const [result] = await pool.query(
      `INSERT INTO photos (user_id, image_data, device_info, latitude, longitude) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        userId,
        imageData,
        deviceInfo || 'Unknown device',
        location?.latitude || null,
        location?.longitude || null
      ]
    );

    // Update user's last_updated timestamp
    await pool.query(
      'UPDATE users SET last_updated = CURRENT_TIMESTAMP WHERE id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: 'Photo saved successfully',
      photoId: result.insertId
    });
  } catch (error) {
    console.error('Photo save error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user data
router.get('/data/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Get user
    const [userRows] = await pool.query(
      'SELECT * FROM users WHERE session_id = ?',
      [sessionId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    const user = userRows[0];
    const userId = user.id;

    // Get latest location
    const [locationRows] = await pool.query(
      `SELECT latitude, longitude, accuracy, timestamp 
       FROM locations 
       WHERE user_id = ? 
       ORDER BY timestamp DESC 
       LIMIT 1`,
      [userId]
    );

    // Get all photos
    const [photoRows] = await pool.query(
      `SELECT id, image_data, device_info, latitude, longitude, timestamp 
       FROM photos 
       WHERE user_id = ? 
       ORDER BY timestamp DESC`,
      [userId]
    );

    // Get location history
    const [locationHistory] = await pool.query(
      `SELECT latitude, longitude, accuracy, timestamp 
       FROM locations 
       WHERE user_id = ? 
       ORDER BY timestamp DESC 
       LIMIT 50`,
      [userId]
    );

    res.json({
      success: true,
      data: {
        ...user,
        location: locationRows[0] || null,
        photos: photoRows,
        locationHistory: locationHistory
      }
    });
  } catch (error) {
    console.error('Data fetch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all users (admin endpoint)
router.get('/users', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.*, 
              (SELECT COUNT(*) FROM locations WHERE user_id = u.id) as location_count,
              (SELECT COUNT(*) FROM photos WHERE user_id = u.id) as photo_count,
              (SELECT latitude FROM locations WHERE user_id = u.id ORDER BY timestamp DESC LIMIT 1) as last_latitude,
              (SELECT longitude FROM locations WHERE user_id = u.id ORDER BY timestamp DESC LIMIT 1) as last_longitude
       FROM users u
       ORDER BY u.last_updated DESC`
    );

    res.json({
      success: true,
      count: rows.length,
      users: rows
    });
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get location history for a user
router.get('/locations/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    // Get user
    const [userRows] = await pool.query(
      'SELECT id FROM users WHERE session_id = ?',
      [sessionId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    const userId = userRows[0].id;

    // Get location history
    const [rows] = await pool.query(
      `SELECT latitude, longitude, accuracy, timestamp 
       FROM locations 
       WHERE user_id = ? 
       ORDER BY timestamp DESC 
       LIMIT ?`,
      [userId, limit]
    );

    res.json({
      success: true,
      count: rows.length,
      locations: rows
    });
  } catch (error) {
    console.error('Location history error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;