/**
 * AUTH MIDDLEWARE - REENTRASTE
 * ============================
 * Middleware para autenticación y autorización
 * 
 * Archivo: /middleware/auth.middleware.js
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ==========================================================================
// CONFIGURACIÓN
// ==========================================================================

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_change_in_production';
const TOKEN_EXPIRY = process.env.TOKEN_EXPIRY || '7d';

// ==========================================================================
// MIDDLEWARE DE AUTENTICACIÓN
// ==========================================================================

/**
 * Middleware para verificar token JWT
 * Agrega req.user si el token es válido
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token de acceso requerido',
        code: 'NO_TOKEN'
      });
    }
    
    // Verificar token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Obtener usuario de la base de datos
    const user = await User.findById(decoded.userId)
      .select('-password')
      .lean();
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Verificar si el usuario está activo
    if (user.estado === 'bloqueado' || user.estado === 'eliminado') {
      return res.status(403).json({
        success: false,
        error: 'Cuenta deshabilitada',
        code: 'ACCOUNT_DISABLED'
      });
    }
    
    // Agregar usuario al request
    req.user = user;
    req.userId = user._id;
    req.token = token;
    
    next();
    
  } catch (error) {
    console.error('❌ Error en autenticación:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Token inválido',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expirado',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Error interno de autenticación',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Middleware opcional de autenticación
 * No falla si no hay token, pero agrega req.user si existe
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return next(); // Continuar sin usuario
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId)
      .select('-password')
      .lean();
    
    if (user && user.estado === 'activo') {
      req.user = user;
      req.userId = user._id;
      req.token = token;
    }
    
    next();
    
  } catch (error) {
    // En caso de error, simplemente continuar sin usuario
    next();
  }
};

// ==========================================================================
// MIDDLEWARE DE AUTORIZACIÓN
// ==========================================================================

/**
 * Middleware para requerir rol de administrador
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Autenticación requerida',
      code: 'AUTH_REQUIRED'
    });
  }
  
  if (!req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      error: 'Permisos de administrador requeridos',
      code: 'ADMIN_REQUIRED'
    });
  }
  
  next();
};

/**
 * Middleware para requerir rol de moderador o admin
 */
const requireModerator = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Autenticación requerida',
      code: 'AUTH_REQUIRED'
    });
  }
  
  if (!req.user.isAdmin && !req.user.isModerador) {
    return res.status(403).json({
      success: false,
      error: 'Permisos de moderador requeridos',
      code: 'MODERATOR_REQUIRED'
    });
  }
  
  next();
};

/**
 * Middleware para verificar que el usuario sea propietario del recurso
 */
const requireOwnership = (userIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Autenticación requerida',
        code: 'AUTH_REQUIRED'
      });
    }
    
    const resourceUserId = req.params[userIdField] || req.body[userIdField];
    
    // Admin puede acceder a todo
    if (req.user.isAdmin) {
      return next();
    }
    
    // Usuario debe ser propietario
    if (req.user._id.toString() !== resourceUserId) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permisos para acceder a este recurso',
        code: 'OWNERSHIP_REQUIRED'
      });
    }
    
    next();
  };
};

/**
 * Middleware para verificar cuenta verificada
 */
const requireVerified = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Autenticación requerida',
      code: 'AUTH_REQUIRED'
    });
  }
  
  if (!req.user.verificado) {
    return res.status(403).json({
      success: false,
      error: 'Cuenta no verificada. Completa el proceso de verificación.',
      code: 'VERIFICATION_REQUIRED'
    });
  }
  
  next();
};

/**
 * Middleware para verificar KYC completado
 */
const requireKYC = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Autenticación requerida',
      code: 'AUTH_REQUIRED'
    });
  }
  
  if (!req.user.kycStatus || req.user.kycStatus !== 'aprobado') {
    return res.status(403).json({
      success: false,
      error: 'Verificación de identidad requerida',
      code: 'KYC_REQUIRED',
      kycStatus: req.user.kycStatus
    });
  }
  
  next();
};

// ==========================================================================
// UTILIDADES DE AUTENTICACIÓN
// ==========================================================================

/**
 * Genera un token JWT para un usuario
 */
const generateToken = (user) => {
  const payload = {
    userId: user._id,
    email: user.email,
    isAdmin: user.isAdmin || false,
    isModerador: user.isModerador || false
  };
  
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: TOKEN_EXPIRY,
    issuer: 'reentraste',
    audience: 'reentraste-users'
  });
};

/**
 * Verifica un token JWT sin middleware
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

/**
 * Extrae token del header de autorización
 */
const extractToken = (req) => {
  const authHeader = req.headers['authorization'];
  return authHeader && authHeader.split(' ')[1];
};

/**
 * Middleware para logging de autenticación
 */
const logAuthActivity = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Log de actividad de autenticación
    if (req.user) {
      console.log(`🔐 Auth Activity: ${req.user.email} - ${req.method} ${req.originalUrl}`);
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

// ==========================================================================
// MIDDLEWARE DE ROLES DINÁMICOS
// ==========================================================================

/**
 * Crea middleware de autorización basado en roles
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Autenticación requerida',
        code: 'AUTH_REQUIRED'
      });
    }
    
    // Admin siempre tiene acceso
    if (req.user.isAdmin) {
      return next();
    }
    
    // Verificar roles específicos
    const userRoles = [];
    if (req.user.isModerador) userRoles.push('moderador');
    if (req.user.isPremium) userRoles.push('premium');
    if (req.user.verificado) userRoles.push('verificado');
    userRoles.push('usuario'); // Rol base
    
    const hasRequiredRole = roles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      return res.status(403).json({
        success: false,
        error: `Permisos insuficientes. Roles requeridos: ${roles.join(', ')}`,
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: roles,
        userRoles: userRoles
      });
    }
    
    next();
  };
};

/**
 * Middleware para verificar permisos específicos
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Autenticación requerida',
        code: 'AUTH_REQUIRED'
      });
    }
    
    // Admin tiene todos los permisos
    if (req.user.isAdmin) {
      return next();
    }
    
    // Verificar permisos específicos
    const userPermissions = req.user.permisos || [];
    
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        error: `Permiso requerido: ${permission}`,
        code: 'PERMISSION_REQUIRED',
        requiredPermission: permission
      });
    }
    
    next();
  };
};

// ==========================================================================
// MIDDLEWARE DE SESIONES
// ==========================================================================

/**
 * Middleware para manejar sesiones múltiples
 */
const trackSession = async (req, res, next) => {
  if (!req.user) {
    return next();
  }
  
  try {
    // Actualizar última actividad
    await User.findByIdAndUpdate(req.user._id, {
      ultimaActividad: new Date(),
      $push: {
        sesiones: {
          token: req.token,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          ultimaActividad: new Date()
        }
      }
    });
    
    next();
    
  } catch (error) {
    console.error('❌ Error tracking session:', error);
    next(); // Continuar aunque falle el tracking
  }
};

/**
 * Middleware para validar sesión activa
 */
const validateSession = async (req, res, next) => {
  if (!req.user || !req.token) {
    return next();
  }
  
  try {
    const user = await User.findById(req.user._id);
    
    // Verificar si la sesión sigue siendo válida
    const validSession = user.sesiones?.some(session => 
      session.token === req.token && 
      session.activa !== false
    );
    
    if (!validSession) {
      return res.status(401).json({
        success: false,
        error: 'Sesión inválida o cerrada',
        code: 'INVALID_SESSION'
      });
    }
    
    next();
    
  } catch (error) {
    console.error('❌ Error validating session:', error);
    next();
  }
};

// ==========================================================================
// MIDDLEWARE DE SEGURIDAD ADICIONAL
// ==========================================================================

/**
 * Middleware para detectar tokens comprometidos
 */
const securityCheck = (req, res, next) => {
  if (!req.user) {
    return next();
  }
  
  // Verificar si la cuenta fue comprometida recientemente
  if (req.user.fechaComprometida && 
      new Date(req.user.fechaComprometida) > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
    
    return res.status(403).json({
      success: false,
      error: 'Cuenta temporalmente bloqueada por razones de seguridad',
      code: 'SECURITY_BLOCK'
    });
  }
  
  next();
};

/**
 * Middleware para limitar acceso por ubicación geográfica
 */
const geoRestriction = (allowedCountries = []) => {
  return (req, res, next) => {
    if (allowedCountries.length === 0) {
      return next(); // Sin restricciones
    }
    
    const country = req.get('CF-IPCountry') || req.get('X-Country-Code');
    
    if (country && !allowedCountries.includes(country)) {
      return res.status(403).json({
        success: false,
        error: 'Acceso no permitido desde esta ubicación',
        code: 'GEO_RESTRICTED'
      });
    }
    
    next();
  };
};

// ==========================================================================
// EXPORTACIONES
// ==========================================================================

module.exports = {
  // Middleware principales
  authenticateToken,
  optionalAuth,
  
  // Middleware de autorización
  requireAdmin,
  requireModerator,
  requireOwnership,
  requireVerified,
  requireKYC,
  requireRole,
  requirePermission,
  
  // Utilidades
  generateToken,
  verifyToken,
  extractToken,
  
  // Middleware adicionales
  logAuthActivity,
  trackSession,
  validateSession,
  securityCheck,
  geoRestriction,
  
  // Constantes
  JWT_SECRET,
  TOKEN_EXPIRY
};