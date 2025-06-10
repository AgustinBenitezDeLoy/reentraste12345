/**
 * REENTRASTE - BACKEND GOOGLE AUTHENTICATION ENDPOINTS
 * ====================================================
 * Endpoints para manejar autenticación con Google OAuth
 */

const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');

// Configuración
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '1025977436092-krrda2hrlhc7julccgrj5cc0ivp5eqag.apps.googleusercontent.com';
const JWT_SECRET = process.env.JWT_SECRET;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// ==========================================================================
// ENDPOINT: REGISTRO CON GOOGLE
// ==========================================================================

/**
 * POST /api/auth/google-register
 * Registra un nuevo usuario usando Google OAuth
 */
async function googleRegister(req, res) {
  try {
    const { credential, client_id } = req.body;

    // Verificar el token de Google
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: client_id
    });

    const payload = ticket.getPayload();
    const {
      sub: googleId,
      email,
      name,
      picture,
      email_verified
    } = payload;

    // Verificar que el email esté verificado
    if (!email_verified) {
      return res.status(400).json({
        success: false,
        error: 'El email de Google debe estar verificado'
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ 
      $or: [
        { email: email },
        { googleId: googleId }
      ]
    });

    if (existingUser) {
      // Si ya existe, hacer login en lugar de registro
      const token = jwt.sign(
        { 
          userId: existingUser._id,
          email: existingUser.email 
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return res.json({
        success: true,
        data: {
          token,
          user: {
            id: existingUser._id,
            nombre: existingUser.nombre,
            email: existingUser.email
          },
          isNewUser: false
        }
      });
    }

    // Crear nuevo usuario
    const newUser = new User({
      nombre: name,
      email: email,
      googleId: googleId,
      avatar: picture,
      emailVerified: true, // Google ya verificó el email
      provider: 'google',
      // No necesita contraseña porque usa Google
      createdAt: new Date()
    });

    await newUser.save();

    // Generar JWT token
    const token = jwt.sign(
      { 
        userId: newUser._id,
        email: newUser.email 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: newUser._id,
          nombre: newUser.nombre,
          email: newUser.email
        },
        isNewUser: true
      }
    });

  } catch (error) {
    console.error('❌ Error en Google Register:', error);
    
    if (error.message.includes('Wrong number of segments')) {
      return res.status(400).json({
        success: false,
        error: 'Token de Google inválido'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}

// ==========================================================================
// ENDPOINT: LOGIN CON GOOGLE
// ==========================================================================

/**
 * POST /api/auth/google-login
 * Autentica un usuario existente usando Google OAuth
 */
async function googleLogin(req, res) {
  try {
    const { credential, client_id } = req.body;

    // Verificar el token de Google
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: client_id
    });

    const payload = ticket.getPayload();
    const {
      sub: googleId,
      email,
      name,
      picture,
      email_verified
    } = payload;

    // Verificar que el email esté verificado
    if (!email_verified) {
      return res.status(400).json({
        success: false,
        error: 'El email de Google debe estar verificado'
      });
    }

    // Buscar usuario existente
    let user = await User.findOne({ 
      $or: [
        { email: email },
        { googleId: googleId }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'No existe una cuenta con este email. ¿Quieres crear una cuenta nueva?'
      });
    }

    // Si el usuario existe pero no tiene googleId, agregarlo
    if (!user.googleId) {
      user.googleId = googleId;
      user.avatar = user.avatar || picture;
      await user.save();
    }

    // Actualizar última conexión
    user.lastLogin = new Date();
    await user.save();

    // Generar JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          nombre: user.nombre,
          email: user.email
        },
        isNewUser: false
      }
    });

  } catch (error) {
    console.error('❌ Error en Google Login:', error);
    
    if (error.message.includes('Wrong number of segments')) {
      return res.status(400).json({
        success: false,
        error: 'Token de Google inválido'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
}

// ==========================================================================
// ENDPOINT: CALLBACK PARA POPUP (OPCIONAL)
// ==========================================================================

/**
 * GET /auth/google/callback
 * Maneja el callback del popup de Google (método alternativo)
 */
async function googleCallback(req, res) {
  try {
    const { code, state } = req.query;
    
    if (!code) {
      return res.status(400).send('Código de autorización no encontrado');
    }

    // Decodificar state para obtener el modo (login/register)
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    const { mode } = stateData;

    // Intercambiar código por tokens
    const { tokens } = await client.getToken({
      code,
      redirect_uri: `${req.protocol}://${req.get('host')}/auth/google/callback`
    });

    // Obtener información del usuario
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    // ... procesar según el modo (login/register)

    // Cerrar popup y comunicar con la ventana padre
    res.send(`
      <script>
        window.opener.postMessage({
          type: 'google-auth-success',
          mode: '${mode}',
          data: ${JSON.stringify(payload)}
        }, '*');
        window.close();
      </script>
    `);

  } catch (error) {
    console.error('❌ Error en Google Callback:', error);
    res.send(`
      <script>
        window.opener.postMessage({
          type: 'google-auth-error',
          error: '${error.message}'
        }, '*');
        window.close();
      </script>
    `);
  }
}

// ==========================================================================
// MIDDLEWARE DE VALIDACIÓN
// ==========================================================================

/**
 * Middleware para validar requests de Google Auth
 */
function validateGoogleAuthRequest(req, res, next) {
  const { credential, client_id } = req.body;

  if (!credential) {
    return res.status(400).json({
      success: false,
      error: 'Token de Google requerido'
    });
  }

  if (!client_id || client_id !== GOOGLE_CLIENT_ID) {
    return res.status(400).json({
      success: false,
      error: 'Client ID inválido'
    });
  }

  next();
}

// ==========================================================================
// EXPORTAR ENDPOINTS
// ==========================================================================

module.exports = {
  googleRegister,
  googleLogin,
  googleCallback,
  validateGoogleAuthRequest
};

// ==========================================================================
// EJEMPLO DE USO EN EXPRESS
// ==========================================================================

/*
const express = require('express');
const router = express.Router();
const { 
  googleRegister, 
  googleLogin, 
  googleCallback, 
  validateGoogleAuthRequest 
} = require('./google-auth-endpoints');

// Rutas de Google Auth
router.post('/auth/google-register', validateGoogleAuthRequest, googleRegister);
router.post('/auth/google-login', validateGoogleAuthRequest, googleLogin);
router.get('/auth/google/callback', googleCallback);

module.exports = router;
*/