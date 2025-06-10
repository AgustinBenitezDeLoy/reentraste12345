/**
 * EVENTS ROUTES - REENTRASTE
 * ===========================
 * Rutas API para el sistema de eventos
 * 
 * Archivo: /routes/events.routes.js
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const { controller, createEventValidation, searchValidation } = require('../controllers/events.controller');
const { authenticateToken, requireAdmin } = require('../middleware/auth.middleware');
const { rateLimiter } = require('../middleware/rate-limiter.middleware');

const router = express.Router();

// ==========================================================================
// CONFIGURACIÓN DE MULTER PARA UPLOAD DE IMÁGENES
// ==========================================================================

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/events/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'event-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Verificar que sea una imagen
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
    files: 1 // Solo un archivo por request
  }
});

// ==========================================================================
// MIDDLEWARE DE RATE LIMITING
// ==========================================================================

const searchRateLimit = rateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 30, // 30 búsquedas por minuto
  message: 'Demasiadas búsquedas, intenta nuevamente en un minuto'
});

const createEventRateLimit = rateLimiter({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 5, // 5 eventos por 10 minutos
  message: 'Demasiados eventos creados, intenta nuevamente en 10 minutos'
});

// ==========================================================================
// RUTAS PÚBLICAS (SIN AUTENTICACIÓN)
// ==========================================================================

/**
 * GET /api/events/search
 * Búsqueda general de eventos
 */
router.get('/search', 
  searchRateLimit,
  searchValidation,
  controller.searchEvents
);

/**
 * GET /api/events/autocomplete
 * Autocompletado para búsqueda en tiempo real
 */
router.get('/autocomplete', 
  searchRateLimit,
  controller.autocomplete
);

/**
 * GET /api/events/popular
 * Eventos populares
 */
router.get('/popular', controller.getPopularEvents);

/**
 * GET /api/events/categories
 * Eventos por categoría
 */
router.get('/categories', controller.getEventsByCategory);

/**
 * GET /api/events/categories/stats
 * Estadísticas de categorías
 */
router.get('/categories/stats', controller.getCategoryStats);

/**
 * GET /api/events/check-duplicates
 * Verificar duplicados (puede ser público para mejor UX)
 */
router.get('/check-duplicates', controller.checkDuplicates);

/**
 * GET /api/events/:id
 * Obtener evento por ID
 */
router.get('/:id', controller.getEventById);

// ==========================================================================
// RUTAS PROTEGIDAS (REQUIEREN AUTENTICACIÓN)
// ==========================================================================

/**
 * POST /api/events/create
 * Crear nuevo evento
 */
router.post('/create',
  createEventRateLimit,
  authenticateToken,
  upload.single('imagen'),
  createEventValidation,
  controller.createEvent
);

/**
 * PUT /api/events/:id
 * Actualizar evento (solo creador o admin)
 */
router.put('/:id',
  authenticateToken,
  upload.single('imagen'),
  controller.updateEvent
);

/**
 * DELETE /api/events/:id
 * Eliminar evento (solo creador o admin)
 */
router.delete('/:id',
  authenticateToken,
  controller.deleteEvent
);

// ==========================================================================
// RUTAS DE MODERACIÓN (SOLO ADMIN)
// ==========================================================================

/**
 * GET /api/events/pending
 * Eventos pendientes de moderación
 */
router.get('/admin/pending',
  authenticateToken,
  requireAdmin,
  controller.getPendingEvents
);

/**
 * PUT /api/events/:id/moderate
 * Moderar evento (aprobar/rechazar)
 */
router.put('/:id/moderate',
  authenticateToken,
  requireAdmin,
  controller.moderateEvent
);

// ==========================================================================
// RUTAS ADICIONALES
// ==========================================================================

/**
 * GET /api/events/user/:userId
 * Eventos creados por un usuario específico
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const eventos = await EventModel.find({
      creadoPor: userId,
      estado: { $nin: ['eliminado'] }
    })
    .select('nombre fecha ubicacion categoria imagen estado totalEntradas')
    .sort({ fecha: -1 })
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit))
    .lean();
    
    res.json({
      success: true,
      data: eventos
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo eventos del usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo eventos del usuario'
    });
  }
});

/**
 * GET /api/events/:id/tickets
 * Obtener entradas disponibles para un evento
 */
router.get('/:id/tickets', async (req, res) => {
  try {
    const { id } = req.params;
    const { sortBy = 'precio', order = 'asc', tipoEntrada, sector } = req.query;
    
    const TicketModel = require('../models/Ticket');
    
    const filtros = {
      eventoId: id,
      estado: 'disponible'
    };
    
    if (tipoEntrada) filtros.tipoEntrada = tipoEntrada;
    if (sector) filtros.sector = sector;
    
    const sortOptions = {};
    sortOptions[sortBy] = order === 'desc' ? -1 : 1;
    
    const entradas = await TicketModel.find(filtros)
      .populate('vendedorId', 'nombre avatar verificado')
      .sort(sortOptions)
      .lean();
    
    res.json({
      success: true,
      data: entradas
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo entradas:', error);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo entradas'
    });
  }
});

/**
 * POST /api/events/:id/view
 * Registrar vista de evento (para analytics)
 */
router.post('/:id/view',
  rateLimiter({
    windowMs: 1 * 60 * 1000,
    max: 10,
    skipSuccessfulRequests: true
  }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { userId, sessionId } = req.body;
      
      // Incrementar contador de vistas
      await EventModel.findByIdAndUpdate(id, {
        $inc: { vistas: 1 }
      });
      
      // TODO: Guardar analytics más detallados si es necesario
      
      res.json({
        success: true,
        message: 'Vista registrada'
      });
      
    } catch (error) {
      console.error('❌ Error registrando vista:', error);
      res.status(500).json({
        success: false,
        error: 'Error registrando vista'
      });
    }
  }
);

/**
 * GET /api/events/nearby
 * Eventos cercanos a una ubicación
 */
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 50 } = req.query; // radius en km
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitud y longitud requeridas'
      });
    }
    
    const radiusInMeters = parseFloat(radius) * 1000;
    
    const eventos = await EventModel.find({
      'ubicacion.coordenadas': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radiusInMeters
        }
      },
      estado: 'activo',
      fecha: { $gte: new Date() }
    })
    .select('nombre fecha ubicacion categoria imagen totalEntradas precioMin')
    .limit(20)
    .lean();
    
    res.json({
      success: true,
      data: eventos
    });
    
  } catch (error) {
    console.error('❌ Error buscando eventos cercanos:', error);
    res.status(500).json({
      success: false,
      error: 'Error buscando eventos cercanos'
    });
  }
});

/**
 * GET /api/events/trending
 * Eventos trending (más buscados/vistos recientemente)
 */
router.get('/trending', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Eventos con más actividad en los últimos 7 días
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 7);
    
    const eventos = await EventModel.find({
      estado: 'activo',
      fecha: { $gte: new Date() },
      actualizadoEn: { $gte: fechaLimite }
    })
    .select('nombre fecha ubicacion categoria imagen totalEntradas precioMin popularidad vistas')
    .sort({ 
      vistas: -1, 
      popularidad: -1,
      totalEntradas: -1 
    })
    .limit(parseInt(limit))
    .lean();
    
    res.json({
      success: true,
      data: eventos
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo eventos trending:', error);
    res.status(500).json({
      success: false,
      error: 'Error obteniendo eventos trending'
    });
  }
});

// ==========================================================================
// MIDDLEWARE DE MANEJO DE ERRORES
// ==========================================================================

// Manejo de errores de multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'El archivo es muy grande. Máximo 5MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Solo se permite un archivo por vez.'
      });
    }
  }
  
  if (error.message === 'Solo se permiten archivos de imagen') {
    return res.status(400).json({
      success: false,
      error: 'Solo se permiten archivos de imagen (JPG, PNG, GIF)'
    });
  }
  
  next(error);
});

// ==========================================================================
// EXPORTAR ROUTER
// ==========================================================================

module.exports = router;