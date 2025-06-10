/**
 * TICKET MODEL - REENTRASTE
 * ==========================
 * Modelo de datos para entradas/tickets
 * 
 * Archivo: /models/Ticket.js
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const TicketSchema = new mongoose.Schema({
  // ==========================================================================
  // RELACIONES
  // ==========================================================================
  
  eventoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true
  },
  
  vendedorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  compradorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },

  // ==========================================================================
  // INFORMACIÓN DE LA ENTRADA
  // ==========================================================================
  
  tipoEntrada: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
    index: true
  },
  
  cantidad: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
    default: 1
  },
  
  precio: {
    type: Number,
    required: true,
    min: 0,
    index: true
  },
  
  precioOriginal: {
    type: Number,
    min: 0
  },
  
  moneda: {
    type: String,
    default: 'UYU',
    enum: ['UYU', 'USD', 'EUR']
  },

  // ==========================================================================
  // DETALLES DEL ASIENTO/UBICACIÓN
  // ==========================================================================
  
  sector: {
    type: String,
    trim: true,
    maxlength: 50
  },
  
  fila: {
    type: String,
    trim: true,
    maxlength: 10
  },
  
  asiento: {
    type: String,
    trim: true,
    maxlength: 20
  },
  
  puerta: {
    type: String,
    trim: true,
    maxlength: 20
  },
  
  ubicacionDetalle: {
    type: String,
    trim: true,
    maxlength: 200
  },

  // ==========================================================================
  // ESTADO Y VALIDACIÓN
  // ==========================================================================
  
  estado: {
    type: String,
    enum: ['disponible', 'reservada', 'vendida', 'cancelada', 'expirada', 'en_disputa'],
    default: 'disponible',
    index: true
  },
  
  codigoQR: {
    type: String,
    unique: true,
    sparse: true
  },
  
  numeroSerie: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  
  hashValidacion: {
    type: String,
    unique: true,
    sparse: true
  },
  
  validada: {
    type: Boolean,
    default: false,
    index: true
  },
  
  fechaValidacion: {
    type: Date
  },

  // ==========================================================================
  // INFORMACIÓN DE VENTA
  // ==========================================================================
  
  descripcion: {
    type: String,
    maxlength: 500,
    trim: true
  },
  
  condiciones: {
    type: String,
    maxlength: 300,
    trim: true
  },
  
  transferible: {
    type: Boolean,
    default: true
  },
  
  reembolsable: {
    type: Boolean,
    default: false
  },
  
  fechaLimiteVenta: {
    type: Date
  },

  // ==========================================================================
  // ARCHIVOS Y MEDIA
  // ==========================================================================
  
  imagenes: [{
    url: String,
    tipo: {
      type: String,
      enum: ['entrada_fisica', 'qr_code', 'comprobante', 'otro']
    },
    descripcion: String
  }],
  
  archivoEntrada: {
    type: String, // URL del PDF o imagen de la entrada
    trim: true
  },

  // ==========================================================================
  // COMISIONES Y PAGOS
  // ==========================================================================
  
  comision: {
    porcentaje: {
      type: Number,
      min: 0,
      max: 50,
      default: 10
    },
    
    monto: {
      type: Number,
      min: 0
    },
    
    calculada: {
      type: Boolean,
      default: false
    }
  },
  
  gananciaVendedor: {
    type: Number,
    min: 0
  },

  // ==========================================================================
  // PROCESO DE COMPRA
  // ==========================================================================
  
  transaccion: {
    id: String,
    metodo_pago: {
      type: String,
      enum: ['transferencia', 'efectivo', 'mercadopago', 'paypal', 'crypto']
    },
    
    estado_pago: {
      type: String,
      enum: ['pendiente', 'pagado', 'fallido', 'reembolsado'],
      default: 'pendiente'
    },
    
    fecha_pago: Date,
    
    comprobante: String,
    
    datos_pago: {
      // Información específica del método de pago
      // Se encripta información sensible
      type: mongoose.Schema.Types.Mixed
    }
  },

  // ==========================================================================
  // INFORMACIÓN DE CONTACTO
  // ==========================================================================
  
  contactoVendedor: {
    whatsapp: String,
    email: String,
    telegram: String,
    instagram: String,
    
    prefiere_contacto: {
      type: String,
      enum: ['whatsapp', 'email', 'telegram', 'instagram'],
      default: 'whatsapp'
    }
  },

  // ==========================================================================
  // VERIFICACIÓN Y CONFIANZA
  // ==========================================================================
  
  verificacion: {
    comprobante_compra: {
      url: String,
      verificado: { type: Boolean, default: false },
      verificado_por: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      fecha_verificacion: Date
    },
    
    entrada_original: {
      verificada: { type: Boolean, default: false },
      metodo_verificacion: String, // 'manual', 'automatico', 'api_venue'
      confianza_score: {
        type: Number,
        min: 0,
        max: 100,
        default: 50
      }
    }
  },

  // ==========================================================================
  // ENTREGA
  // ==========================================================================
  
  entrega: {
    metodo: {
      type: String,
      enum: ['digital', 'presencial', 'envio_postal', 'punto_encuentro'],
      required: true,
      default: 'digital'
    },
    
    direccion: String,
    
    punto_encuentro: {
      ubicacion: String,
      fecha_hora: Date,
      contacto: String
    },
    
    estado_entrega: {
      type: String,
      enum: ['pendiente', 'enviado', 'entregado', 'fallido'],
      default: 'pendiente'
    },
    
    fecha_entrega: Date,
    
    codigo_seguimiento: String
  },

  // ==========================================================================
  // ESTADÍSTICAS Y MÉTRICAS
  // ==========================================================================
  
  metricas: {
    vistas: {
      type: Number,
      default: 0,
      min: 0
    },
    
    contactos: {
      type: Number,
      default: 0,
      min: 0
    },
    
    favoritos: {
      type: Number,
      default: 0,
      min: 0
    },
    
    reportes: {
      type: Number,
      default: 0,
      min: 0
    }
  },

  // ==========================================================================
  // FECHAS IMPORTANTES
  // ==========================================================================
  
  fechaPublicacion: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  fechaReserva: {
    type: Date,
    index: true
  },
  
  fechaVenta: {
    type: Date,
    index: true
  },
  
  fechaExpiracion: {
    type: Date,
    index: true
  },
  
  fechaActualizacion: {
    type: Date,
    default: Date.now
  },

  // ==========================================================================
  // METADATA
  // ==========================================================================
  
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  notas_internas: {
    type: String,
    maxlength: 500
  },
  
  reportes: [{
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    motivo: {
      type: String,
      enum: ['precio_excesivo', 'entrada_falsa', 'vendedor_sospechoso', 'informacion_incorrecta', 'spam', 'otro']
    },
    descripcion: String,
    fecha: {
      type: Date,
      default: Date.now
    }
  }],

  // ==========================================================================
  // CONFIGURACIÓN
  // ==========================================================================
  
  configuracion: {
    negociable: {
      type: Boolean,
      default: false
    },
    
    acepta_intercambio: {
      type: Boolean,
      default: false
    },
    
    precio_minimo: {
      type: Number,
      min: 0
    },
    
    auto_renovar: {
      type: Boolean,
      default: false
    },
    
    destacada: {
      type: Boolean,
      default: false
    }
  }

}, {
  timestamps: true,
  collection: 'tickets'
});

// ==========================================================================
// ÍNDICES
// ==========================================================================

// Índices para búsquedas comunes
TicketSchema.index({ eventoId: 1, estado: 1, precio: 1 });
TicketSchema.index({ vendedorId: 1, estado: 1 });
TicketSchema.index({ estado: 1, fechaExpiracion: 1 });
TicketSchema.index({ tipoEntrada: 1, sector: 1 });
TicketSchema.index({ precio: 1, moneda: 1 });
TicketSchema.index({ fechaPublicacion: -1 });

// Índice de texto para búsqueda
TicketSchema.index({
  tipoEntrada: 'text',
  sector: 'text',
  descripcion: 'text'
});

// Índice compuesto para performance
TicketSchema.index({ 
  eventoId: 1, 
  estado: 1, 
  fechaExpiracion: 1,
  precio: 1 
});

// ==========================================================================
// MIDDLEWARE PRE-SAVE
// ==========================================================================

TicketSchema.pre('save', function(next) {
  // Generar código QR único
  if (this.isNew && !this.codigoQR) {
    this.codigoQR = this.generarCodigoQR();
  }
  
  // Generar número de serie único
  if (this.isNew && !this.numeroSerie) {
    this.numeroSerie = this.generarNumeroSerie();
  }
  
  // Generar hash de validación
  if (this.isNew) {
    this.hashValidacion = this.generarHashValidacion();
  }
  
  // Calcular comisión si cambió el precio
  if (this.isModified('precio') || this.isNew) {
    this.calcularComision();
  }
  
  // Establecer fecha límite de venta si no existe
  if (this.isNew && !this.fechaLimiteVenta) {
    this.fechaLimiteVenta = this.calcularFechaLimiteVenta();
  }
  
  // Actualizar fecha de modificación
  this.fechaActualizacion = new Date();
  
  next();
});

// ==========================================================================
// MIDDLEWARE POST-SAVE
// ==========================================================================

TicketSchema.post('save', async function(doc) {
  // Actualizar estadísticas del evento
  if (doc.isNew) {
    await mongoose.model('Event').findByIdAndUpdate(doc.eventoId, {
      $inc: { totalEntradas: doc.cantidad }
    });
  }
  
  // Si se vendió, actualizar estadísticas
  if (doc.isModified('estado') && doc.estado === 'vendida') {
    await mongoose.model('Event').findByIdAndUpdate(doc.eventoId, {
      $inc: { entradasVendidas: doc.cantidad }
    });
  }
});

// ==========================================================================
// MÉTODOS DE INSTANCIA
// ==========================================================================

/**
 * Generar código QR único
 */
TicketSchema.methods.generarCodigoQR = function() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2);
  return `QR_${timestamp}_${random}`.toUpperCase();
};

/**
 * Generar número de serie único
 */
TicketSchema.methods.generarNumeroSerie = function() {
  const year = new Date().getFullYear().toString().slice(-2);
  const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
  return `RE${year}${month}${random}`;
};

/**
 * Generar hash de validación
 */
TicketSchema.methods.generarHashValidacion = function() {
  const data = `${this.eventoId}_${this.vendedorId}_${this.precio}_${Date.now()}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
};

/**
 * Calcular comisión
 */
TicketSchema.methods.calcularComision = function() {
  const porcentaje = this.comision.porcentaje || 10;
  this.comision.monto = Math.round(this.precio * (porcentaje / 100));
  this.gananciaVendedor = this.precio - this.comision.monto;
  this.comision.calculada = true;
};

/**
 * Calcular fecha límite de venta automática
 */
TicketSchema.methods.calcularFechaLimiteVenta = function() {
  // Por defecto, hasta 2 horas antes del evento
  const fechaEvento = new Date(); // Se debería obtener del evento
  fechaEvento.setHours(fechaEvento.getHours() - 2);
  return fechaEvento;
};

/**
 * Verificar si la entrada está disponible
 */
TicketSchema.methods.isDisponible = function() {
  return this.estado === 'disponible' && 
         (!this.fechaExpiracion || this.fechaExpiracion > new Date()) &&
         (!this.fechaLimiteVenta || this.fechaLimiteVenta > new Date());
};

/**
 * Verificar si la entrada ha expirado
 */
TicketSchema.methods.hasExpirado = function() {
  if (!this.fechaExpiracion) return false;
  return this.fechaExpiracion < new Date();
};

/**
 * Reservar entrada
 */
TicketSchema.methods.reservar = function(compradorId, duracionMinutos = 15) {
  if (!this.isDisponible()) {
    throw new Error('La entrada no está disponible');
  }
  
  this.estado = 'reservada';
  this.compradorId = compradorId;
  this.fechaReserva = new Date();
  this.fechaExpiracion = new Date(Date.now() + duracionMinutos * 60 * 1000);
  
  return this.save();
};

/**
 * Confirmar venta
 */
TicketSchema.methods.confirmarVenta = function(datosTransaccion) {
  if (this.estado !== 'reservada') {
    throw new Error('La entrada debe estar reservada para confirmar la venta');
  }
  
  this.estado = 'vendida';
  this.fechaVenta = new Date();
  this.fechaExpiracion = null;
  this.transaccion = {
    ...this.transaccion,
    ...datosTransaccion,
    fecha_pago: new Date()
  };
  
  return this.save();
};

/**
 * Cancelar reserva
 */
TicketSchema.methods.cancelarReserva = function() {
  if (this.estado === 'reservada') {
    this.estado = 'disponible';
    this.compradorId = null;
    this.fechaReserva = null;
    this.fechaExpiracion = null;
  }
  
  return this.save();
};

/**
 * Obtener precio con descuento si aplicable
 */
TicketSchema.methods.getPrecioFinal = function() {
  // Lógica para aplicar descuentos si los hay
  return this.precio;
};

/**
 * Generar datos para QR de validación
 */
TicketSchema.methods.generarQRValidacion = function() {
  return {
    ticketId: this._id,
    hash: this.hashValidacion,
    evento: this.eventoId,
    tipo: this.tipoEntrada,
    cantidad: this.cantidad
  };
};

// ==========================================================================
// MÉTODOS ESTÁTICOS
// ==========================================================================

/**
 * Buscar entradas disponibles para un evento
 */
TicketSchema.statics.findDisponiblesPorEvento = function(eventoId, filtros = {}) {
  const query = {
    eventoId,
    estado: 'disponible',
    $or: [
      { fechaExpiracion: { $exists: false } },
      { fechaExpiracion: { $gt: new Date() } }
    ]
  };
  
  // Aplicar filtros opcionales
  if (filtros.precioMin) query.precio = { $gte: filtros.precioMin };
  if (filtros.precioMax) query.precio = { ...query.precio, $lte: filtros.precioMax };
  if (filtros.tipoEntrada) query.tipoEntrada = filtros.tipoEntrada;
  if (filtros.sector) query.sector = filtros.sector;
  
  return this.find(query).sort({ precio: 1 });
};

/**
 * Limpiar entradas expiradas
 */
TicketSchema.statics.limpiarExpiradas = function() {
  return this.updateMany(
    {
      estado: 'reservada',
      fechaExpiracion: { $lt: new Date() }
    },
    {
      $set: { 
        estado: 'disponible',
        fechaExpiracion: null,
        compradorId: null,
        fechaReserva: null
      }
    }
  );
};

/**
 * Obtener estadísticas de precios para un evento
 */
TicketSchema.statics.getEstadisticasPrecios = function(eventoId) {
  return this.aggregate([
    {
      $match: {
        eventoId: mongoose.Types.ObjectId(eventoId),
        estado: 'disponible'
      }
    },
    {
      $group: {
        _id: null,
        precioMin: { $min: '$precio' },
        precioMax: { $max: '$precio' },
        precioPromedio: { $avg: '$precio' },
        totalEntradas: { $sum: '$cantidad' }
      }
    }
  ]);
};

// ==========================================================================
// VIRTUAL FIELDS
// ==========================================================================

TicketSchema.virtual('precioTexto').get(function() {
  return `$${this.precio.toLocaleString()} ${this.moneda}`;
});

TicketSchema.virtual('ubicacionCompleta').get(function() {
  const partes = [this.sector, this.fila, this.asiento].filter(Boolean);
  return partes.length > 0 ? partes.join(' - ') : 'Ubicación general';
});

TicketSchema.virtual('diasHastaExpiracion').get(function() {
  if (!this.fechaExpiracion) return null;
  const diffTime = this.fechaExpiracion.getTime() - Date.now();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// ==========================================================================
// CONFIGURACIÓN
// ==========================================================================

TicketSchema.set('toJSON', { virtuals: true });
TicketSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Ticket', TicketSchema);