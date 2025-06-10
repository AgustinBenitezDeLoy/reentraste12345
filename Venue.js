/**
 * VENUE MODEL - REENTRASTE
 * =========================
 * Modelo de datos para venues/locales
 * 
 * Archivo: /models/Venue.js
 */

const mongoose = require('mongoose');

const VenueSchema = new mongoose.Schema({
  // ==========================================================================
  // INFORMACIÓN BÁSICA
  // ==========================================================================
  
  nombre: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
    index: true
  },
  
  slug: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true
  },
  
  nombreNormalizado: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  
  descripcion: {
    type: String,
    maxlength: 500,
    trim: true
  },
  
  tipo: {
    type: String,
    enum: ['arena', 'estadio', 'teatro', 'club', 'bar', 'salon', 'centro_convenciones', 'outdoor', 'otro'],
    required: true,
    index: true
  },

  // ==========================================================================
  // UBICACIÓN
  // ==========================================================================
  
  direccion: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  
  ciudad: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
    index: true
  },
  
  departamento: {
    type: String,
    trim: true,
    maxlength: 50
  },
  
  pais: {
    type: String,
    default: 'Uruguay',
    maxlength: 50
  },
  
  codigoPostal: {
    type: String,
    trim: true,
    maxlength: 10
  },
  
  coordenadas: {
    latitud: {
      type: Number,
      min: -90,
      max: 90
    },
    longitud: {
      type: Number,
      min: -180,
      max: 180
    }
  },
  
  // Para MongoDB geospatial queries
  ubicacionGeo: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitud, latitud]
      index: '2dsphere'
    }
  },

  // ==========================================================================
  // CAPACIDAD Y CARACTERÍSTICAS
  // ==========================================================================
  
  capacidad: {
    total: {
      type: Number,
      min: 1,
      max: 200000
    },
    
    sectores: [{
      nombre: String, // VIP, General, Platea, etc.
      capacidad: Number,
      precio_referencia: Number
    }]
  },
  
  caracteristicas: {
    aire_acondicionado: { type: Boolean, default: false },
    estacionamiento: { type: Boolean, default: false },
    acceso_discapacitados: { type: Boolean, default: false },
    bar: { type: Boolean, default: false },
    restaurante: { type: Boolean, default: false },
    wifi: { type: Boolean, default: false },
    seguridad: { type: Boolean, default: false },
    sonido_profesional: { type: Boolean, default: false },
    iluminacion_profesional: { type: Boolean, default: false }
  },

  // ==========================================================================
  // CONTACTO Y GESTIÓN
  // ==========================================================================
  
  contacto: {
    telefono: {
      type: String,
      trim: true
    },
    
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    
    sitio_web: {
      type: String,
      trim: true
    },
    
    redes_sociales: {
      facebook: String,
      instagram: String,
      twitter: String
    }
  },
  
  gerente: {
    nombre: String,
    telefono: String,
    email: String
  },

  // ==========================================================================
  // MEDIA
  // ==========================================================================
  
  imagenes: [{
    url: String,
    tipo: {
      type: String,
      enum: ['principal', 'interior', 'exterior', 'escenario', 'capacidad']
    },
    descripcion: String
  }],
  
  logo: {
    type: String,
    trim: true
  },

  // ==========================================================================
  // ESTADO Y VERIFICACIÓN
  // ==========================================================================
  
  estado: {
    type: String,
    enum: ['activo', 'inactivo', 'en_construccion', 'cerrado_temporal', 'cerrado_permanente'],
    default: 'activo',
    index: true
  },
  
  verificado: {
    type: Boolean,
    default: false,
    index: true
  },
  
  destacado: {
    type: Boolean,
    default: false
  },

  // ==========================================================================
  // ESTADÍSTICAS
  // ==========================================================================
  
  estadisticas: {
    total_eventos: {
      type: Number,
      default: 0,
      min: 0
    },
    
    eventos_este_mes: {
      type: Number,
      default: 0,
      min: 0
    },
    
    popularidad: {
      type: Number,
      default: 0,
      min: 0
    },
    
    rating_promedio: {
      type: Number,
      min: 1,
      max: 5
    },
    
    total_reviews: {
      type: Number,
      default: 0,
      min: 0
    }
  },

  // ==========================================================================
  // CONFIGURACIÓN
  // ==========================================================================
  
  configuracion: {
    permite_eventos_publicos: {
      type: Boolean,
      default: true
    },
    
    requiere_aprobacion: {
      type: Boolean,
      default: false
    },
    
    horario_apertura: String,
    horario_cierre: String,
    
    dias_disponibles: [{
      type: String,
      enum: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
    }]
  },

  // ==========================================================================
  // METADATA
  // ==========================================================================
  
  aliases: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  keywords: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  zona: {
    type: String,
    trim: true,
    index: true // Ej: "Ciudad Vieja", "Pocitos", "Centro"
  },

  // ==========================================================================
  // USUARIOS
  // ==========================================================================
  
  creadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  administradores: [{
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rol: {
      type: String,
      enum: ['propietario', 'gerente', 'coordinador'],
      default: 'coordinador'
    },
    agregadoEn: {
      type: Date,
      default: Date.now
    }
  }],

  // ==========================================================================
  // TIMESTAMPS
  // ==========================================================================
  
  creadoEn: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  actualizadoEn: {
    type: Date,
    default: Date.now
  },
  
  verificadoEn: {
    type: Date
  }

}, {
  timestamps: true,
  collection: 'venues'
});

// ==========================================================================
// ÍNDICES
// ==========================================================================

// Índice de texto completo
VenueSchema.index({
  nombre: 'text',
  descripcion: 'text',
  direccion: 'text',
  keywords: 'text'
}, {
  weights: {
    nombre: 10,
    aliases: 8,
    direccion: 5,
    keywords: 3,
    descripcion: 1
  },
  name: 'venue_texto_completo'
});

// Índices compuestos
VenueSchema.index({ ciudad: 1, estado: 1 });
VenueSchema.index({ tipo: 1, ciudad: 1 });
VenueSchema.index({ estado: 1, verificado: 1 });
VenueSchema.index({ 'estadisticas.popularidad': -1 });

// ==========================================================================
// MIDDLEWARE PRE-SAVE
// ==========================================================================

VenueSchema.pre('save', function(next) {
  // Generar slug
  if (this.isModified('nombre') && !this.slug) {
    this.slug = this.nombre
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);
  }
  
  // Normalizar nombre
  if (this.isModified('nombre')) {
    this.nombreNormalizado = this.nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  // Actualizar coordenadas geoespaciales si cambiaron
  if (this.isModified('coordenadas') && this.coordenadas.latitud && this.coordenadas.longitud) {
    this.ubicacionGeo = {
      type: 'Point',
      coordinates: [this.coordenadas.longitud, this.coordenadas.latitud]
    };
  }
  
  // Generar keywords automáticamente
  if (this.isModified('nombre') || this.isModified('tipo') || this.isModified('zona')) {
    this.keywords = this.generarKeywords();
  }
  
  this.actualizadoEn = new Date();
  next();
});

// ==========================================================================
// MÉTODOS DE INSTANCIA
// ==========================================================================

/**
 * Generar keywords para búsqueda
 */
VenueSchema.methods.generarKeywords = function() {
  const keywords = [];
  
  if (this.nombre) {
    keywords.push(...this.nombre.toLowerCase().split(/\s+/));
  }
  
  if (this.tipo) {
    keywords.push(this.tipo);
  }
  
  if (this.zona) {
    keywords.push(this.zona.toLowerCase());
  }
  
  if (this.ciudad) {
    keywords.push(this.ciudad.toLowerCase());
  }
  
  return [...new Set(keywords)].filter(k => k.length > 2);
};

/**
 * Calcular distancia a coordenadas dadas
 */
VenueSchema.methods.calcularDistancia = function(latitud, longitud) {
  if (!this.coordenadas.latitud || !this.coordenadas.longitud) return null;
  
  const R = 6371; // Radio de la Tierra en km
  const dLat = this.toRad(latitud - this.coordenadas.latitud);
  const dLon = this.toRad(longitud - this.coordenadas.longitud);
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(this.toRad(this.coordenadas.latitud)) * Math.cos(this.toRad(latitud)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

VenueSchema.methods.toRad = function(value) {
  return value * Math.PI / 180;
};

/**
 * Obtener imagen principal
 */
VenueSchema.methods.getImagenPrincipal = function() {
  const principal = this.imagenes.find(img => img.tipo === 'principal');
  return principal ? principal.url : '/images/default-venue.jpg';
};

/**
 * Verificar si está disponible en una fecha
 */
VenueSchema.methods.isDisponible = function(fecha) {
  if (this.estado !== 'activo') return false;
  
  const diaSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'][fecha.getDay()];
  
  if (this.configuracion.dias_disponibles.length > 0) {
    return this.configuracion.dias_disponibles.includes(diaSemana);
  }
  
  return true;
};

// ==========================================================================
// MÉTODOS ESTÁTICOS
// ==========================================================================

/**
 * Buscar venues por proximidad
 */
VenueSchema.statics.findNearby = function(latitud, longitud, maxDistance = 10000) {
  return this.find({
    ubicacionGeo: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitud, latitud]
        },
        $maxDistance: maxDistance // en metros
      }
    },
    estado: 'activo'
  });
};

/**
 * Buscar venues populares
 */
VenueSchema.statics.findPopular = function(limit = 10) {
  return this.find({
    estado: 'activo'
  })
  .sort({ 'estadisticas.popularidad': -1 })
  .limit(limit);
};

/**
 * Buscar por capacidad
 */
VenueSchema.statics.findByCapacity = function(minCapacity, maxCapacity) {
  return this.find({
    'capacidad.total': {
      $gte: minCapacity,
      $lte: maxCapacity
    },
    estado: 'activo'
  });
};

// ==========================================================================
// VIRTUAL FIELDS
// ==========================================================================

VenueSchema.virtual('direccionCompleta').get(function() {
  return `${this.direccion}, ${this.ciudad}`;
});

VenueSchema.virtual('capacidadTexto').get(function() {
  if (!this.capacidad.total) return 'No especificada';
  
  if (this.capacidad.total < 100) return 'Íntimo (menos de 100)';
  if (this.capacidad.total < 500) return 'Pequeño (100-500)';
  if (this.capacidad.total < 1000) return 'Mediano (500-1000)';
  if (this.capacidad.total < 5000) return 'Grande (1000-5000)';
  return 'Masivo (más de 5000)';
});

VenueSchema.virtual('url').get(function() {
  return `/venues/${this.slug || this._id}`;
});

// ==========================================================================
// CONFIGURACIÓN
// ==========================================================================

VenueSchema.set('toJSON', { virtuals: true });
VenueSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Venue', VenueSchema);