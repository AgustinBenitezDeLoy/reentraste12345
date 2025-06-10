/**
 * EVENT MATCHER SERVICE - REENTRASTE
 * ===================================
 * Servicio para matching inteligente de eventos
 * 
 * Archivo: /services/event-matcher.service.js
 */

const EventModel = require('../models/Event');
const VenueModel = require('../models/Venue');

class EventMatcherService {
  
  // ==========================================================================
  // BÚSQUEDA PRINCIPAL DE EVENTOS
  // ==========================================================================

  /**
   * Busca eventos usando múltiples estrategias
   * @param {string} query - Término de búsqueda
   * @param {string} fecha - Fecha del evento (opcional)
   * @param {string} ciudad - Ciudad (opcional)
   * @param {string} categoria - Categoría (opcional)
   * @param {number} limit - Límite de resultados
   * @returns {Array} Eventos encontrados
   */
  async buscarEventos(query, filters = {}) {
    const { fecha, ciudad, categoria, limit = 20 } = filters;
    
    if (!query || query.length < 2) {
      return await this.getEventosPopulares(limit);
    }

    const queryNormalizado = this.normalizarTexto(query);
    let eventos = [];

    try {
      // 1. Búsqueda exacta por nombre
      eventos = await this.busquedaExacta(queryNormalizado, filters);
      
      // 2. Si no hay resultados, buscar por keywords
      if (eventos.length === 0) {
        eventos = await this.busquedaPorKeywords(queryNormalizado, filters);
      }
      
      // 3. Si aún no hay resultados, búsqueda difusa
      if (eventos.length === 0) {
        eventos = await this.busquedaDifusa(queryNormalizado, filters);
      }
      
      // 4. Filtrar y ordenar resultados
      eventos = await this.filtrarYOrdenar(eventos, query, filters);
      
      return eventos.slice(0, limit);
      
    } catch (error) {
      console.error('❌ Error en búsqueda de eventos:', error);
      return [];
    }
  }

  /**
   * Autocompletado para búsqueda en tiempo real
   */
  async autocompletar(query, limit = 8) {
    if (!query || query.length < 2) {
      return await this.getEventosRecientes(limit);
    }

    const queryNorm = this.normalizarTexto(query);
    
    try {
      const eventos = await EventModel.find({
        $or: [
          { nombreNormalizado: { $regex: queryNorm, $options: 'i' } },
          { keywords: { $elemMatch: { $regex: queryNorm, $options: 'i' } } },
          { aliases: { $elemMatch: { $regex: queryNorm, $options: 'i' } } }
        ],
        estado: 'activo',
        fecha: { $gte: new Date() }
      })
      .select('nombre fecha ubicacion categoria imagen totalEntradas precioMin popularidad')
      .sort({ 
        popularidad: -1,
        totalEntradas: -1,
        fecha: 1
      })
      .limit(limit)
      .lean();

      return eventos;
      
    } catch (error) {
      console.error('❌ Error en autocompletado:', error);
      return [];
    }
  }

  // ==========================================================================
  // ESTRATEGIAS DE BÚSQUEDA
  // ==========================================================================

  /**
   * Búsqueda exacta por nombre normalizado
   */
  async busquedaExacta(queryNorm, filters) {
    const query = {
      nombreNormalizado: { $regex: `^${this.escapeRegex(queryNorm)}`, $options: 'i' },
      estado: 'activo'
    };
    
    this.aplicarFiltros(query, filters);
    
    return await EventModel.find(query)
      .sort({ fecha: 1, popularidad: -1 })
      .limit(10)
      .lean();
  }

  /**
   * Búsqueda por keywords y aliases
   */
  async busquedaPorKeywords(queryNorm, filters) {
    const palabras = queryNorm.split(' ').filter(p => p.length > 2);
    
    if (palabras.length === 0) return [];
    
    const query = {
      $or: [
        { keywords: { $in: palabras } },
        { aliases: { $elemMatch: { $regex: palabras.join('|'), $options: 'i' } } },
        { nombreNormalizado: { $regex: palabras.join('|'), $options: 'i' } }
      ],
      estado: 'activo'
    };
    
    this.aplicarFiltros(query, filters);
    
    return await EventModel.find(query)
      .sort({ popularidad: -1, fecha: 1 })
      .limit(15)
      .lean();
  }

  /**
   * Búsqueda difusa con tolerancia a errores
   */
  async busquedaDifusa(queryNorm, filters) {
    // Usar MongoDB text search si está disponible
    const query = {
      $text: { $search: queryNorm },
      estado: 'activo'
    };
    
    this.aplicarFiltros(query, filters);
    
    try {
      return await EventModel.find(query, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' }, popularidad: -1 })
        .limit(10)
        .lean();
    } catch (error) {
      // Fallback si no hay text index
      return await this.busquedaPorSimilitud(queryNorm, filters);
    }
  }

  /**
   * Búsqueda por similitud de strings (fallback)
   */
  async busquedaPorSimilitud(queryNorm, filters) {
    const todosEventos = await EventModel.find({
      estado: 'activo',
      fecha: { $gte: new Date() }
    })
    .select('nombre nombreNormalizado fecha ubicacion categoria imagen totalEntradas precioMin popularidad')
    .limit(100)
    .lean();

    // Calcular similitud para cada evento
    const eventosConSimilitud = todosEventos
      .map(evento => ({
        ...evento,
        similitud: this.calcularSimilitud(queryNorm, evento.nombreNormalizado)
      }))
      .filter(evento => evento.similitud > 0.3) // Mínimo 30% similitud
      .sort((a, b) => b.similitud - a.similitud);

    return eventosConSimilitud.slice(0, 8);
  }

  // ==========================================================================
  // VERIFICACIÓN DE DUPLICADOS
  // ==========================================================================

  /**
   * Verifica si hay eventos similares al crear uno nuevo
   */
  async verificarDuplicados(nombreEvento, fecha = null, venue = null) {
    const nombreNorm = this.normalizarTexto(nombreEvento);
    const palabrasClave = nombreNorm.split(' ').filter(p => p.length > 2);
    
    if (palabrasClave.length === 0) return [];

    const query = {
      $or: [
        { nombreNormalizado: { $regex: this.escapeRegex(nombreNorm), $options: 'i' } },
        { 
          $and: palabrasClave.map(palabra => ({
            nombreNormalizado: { $regex: palabra, $options: 'i' }
          }))
        }
      ],
      estado: { $in: ['activo', 'pendiente'] }
    };

    // Filtrar por fecha si se proporciona (±3 días)
    if (fecha) {
      const fechaEvento = new Date(fecha);
      const fechaMin = new Date(fechaEvento);
      fechaMin.setDate(fechaMin.getDate() - 3);
      const fechaMax = new Date(fechaEvento);
      fechaMax.setDate(fechaMax.getDate() + 3);
      
      query.fecha = { $gte: fechaMin, $lte: fechaMax };
    }

    // Filtrar por venue si se proporciona
    if (venue) {
      query['ubicacion.venue'] = { $regex: this.escapeRegex(venue), $options: 'i' };
    }

    const similares = await EventModel.find(query)
      .select('nombre fecha ubicacion categoria imagen totalEntradas')
      .sort({ fecha: 1 })
      .limit(5)
      .lean();

    // Calcular score de similitud para ranking
    return similares.map(evento => ({
      ...evento,
      similitud: this.calcularSimilitud(nombreNorm, evento.nombreNormalizado)
    })).sort((a, b) => b.similitud - a.similitud);
  }

  // ==========================================================================
  // EVENTOS POPULARES Y RECIENTES
  // ==========================================================================

  /**
   * Obtiene eventos populares
   */
  async getEventosPopulares(limit = 12) {
    return await EventModel.find({
      estado: 'activo',
      fecha: { $gte: new Date() },
      totalEntradas: { $gt: 0 }
    })
    .select('nombre fecha ubicacion categoria imagen totalEntradas precioMin popularidad')
    .sort({ 
      popularidad: -1, 
      totalEntradas: -1,
      fecha: 1 
    })
    .limit(limit)
    .lean();
  }

  /**
   * Obtiene eventos recientes (creados recientemente)
   */
  async getEventosRecientes(limit = 8) {
    return await EventModel.find({
      estado: 'activo',
      fecha: { $gte: new Date() }
    })
    .select('nombre fecha ubicacion categoria imagen totalEntradas precioMin')
    .sort({ creadoEn: -1 })
    .limit(limit)
    .lean();
  }

  /**
   * Obtiene eventos por categoría
   */
  async getEventosPorCategoria(categoria, limit = 15) {
    return await EventModel.find({
      categoria: categoria,
      estado: 'activo',
      fecha: { $gte: new Date() }
    })
    .select('nombre fecha ubicacion categoria imagen totalEntradas precioMin popularidad')
    .sort({ 
      popularidad: -1,
      fecha: 1 
    })
    .limit(limit)
    .lean();
  }

  // ==========================================================================
  // UTILIDADES
  // ==========================================================================

  /**
   * Normaliza texto para comparaciones
   */
  normalizarTexto(texto) {
    if (!texto) return '';
    
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
      .replace(/[^\w\s]/g, ' ') // Solo letras, números y espacios
      .replace(/\s+/g, ' ') // Espacios múltiples → uno solo
      .trim();
  }

  /**
   * Escapa caracteres especiales para regex
   */
  escapeRegex(texto) {
    return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Calcula similitud entre dos strings usando algoritmo Levenshtein
   */
  calcularSimilitud(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    
    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;
    
    const matrix = Array(len1 + 1).fill().map(() => Array(len2 + 1).fill(0));
    
    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;
    
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // deletion
          matrix[i][j - 1] + 1,      // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }
    
    const maxLen = Math.max(len1, len2);
    return (maxLen - matrix[len1][len2]) / maxLen;
  }

  /**
   * Aplica filtros adicionales a la query
   */
  aplicarFiltros(query, filters) {
    const { fecha, ciudad, categoria } = filters;
    
    // Filtro por fecha (eventos futuros por defecto)
    if (fecha) {
      const fechaEvento = new Date(fecha);
      const fechaMin = new Date(fechaEvento);
      fechaMin.setHours(0, 0, 0, 0);
      const fechaMax = new Date(fechaEvento);
      fechaMax.setHours(23, 59, 59, 999);
      
      query.fecha = { $gte: fechaMin, $lte: fechaMax };
    } else {
      query.fecha = { $gte: new Date() };
    }
    
    // Filtro por ciudad
    if (ciudad) {
      query['ubicacion.ciudad'] = { $regex: this.escapeRegex(ciudad), $options: 'i' };
    }
    
    // Filtro por categoría
    if (categoria) {
      query.categoria = categoria;
    }
  }

  /**
   * Filtra y ordena resultados finales
   */
  async filtrarYOrdenar(eventos, queryOriginal, filters) {
    if (eventos.length === 0) return [];
    
    // Agregar información adicional si es necesario
    const eventosEnriquecidos = await Promise.all(
      eventos.map(async (evento) => {
        // Calcular relevancia basada en múltiples factores
        const relevancia = this.calcularRelevancia(evento, queryOriginal);
        
        return {
          ...evento,
          relevancia
        };
      })
    );
    
    // Ordenar por relevancia, popularidad y fecha
    return eventosEnriquecidos.sort((a, b) => {
      if (Math.abs(a.relevancia - b.relevancia) > 0.1) {
        return b.relevancia - a.relevancia;
      }
      if (Math.abs(a.popularidad - b.popularidad) > 10) {
        return b.popularidad - a.popularidad;
      }
      return new Date(a.fecha) - new Date(b.fecha);
    });
  }

  /**
   * Calcula relevancia de un evento para una búsqueda
   */
  calcularRelevancia(evento, query) {
    const queryNorm = this.normalizarTexto(query);
    const nombreNorm = evento.nombreNormalizado || this.normalizarTexto(evento.nombre);
    
    let score = 0;
    
    // Coincidencia exacta en nombre (peso: 1.0)
    if (nombreNorm.includes(queryNorm)) {
      score += 1.0;
    }
    
    // Coincidencia por palabras (peso: 0.7)
    const palabrasQuery = queryNorm.split(' ');
    const palabrasNombre = nombreNorm.split(' ');
    const coincidencias = palabrasQuery.filter(p => 
      palabrasNombre.some(n => n.includes(p))
    ).length;
    score += (coincidencias / palabrasQuery.length) * 0.7;
    
    // Popularidad del evento (peso: 0.3)
    score += (evento.popularidad || 0) / 100 * 0.3;
    
    // Disponibilidad de entradas (peso: 0.2)
    score += Math.min((evento.totalEntradas || 0) / 50, 1) * 0.2;
    
    // Bonus por eventos verificados (peso: 0.1)
    if (evento.verificado) {
      score += 0.1;
    }
    
    return Math.min(score, 1.0); // Max 1.0
  }

  // ==========================================================================
  // ESTADÍSTICAS Y MÉTRICAS
  // ==========================================================================

  /**
   * Actualiza popularidad de un evento
   */
  async actualizarPopularidad(eventoId, accion) {
    const incrementos = {
      'vista': 1,
      'busqueda': 2,
      'click': 3,
      'entrada_publicada': 5,
      'entrada_vendida': 10
    };
    
    const incremento = incrementos[accion] || 1;
    
    await EventModel.findByIdAndUpdate(eventoId, {
      $inc: { popularidad: incremento }
    });
  }

  /**
   * Obtiene estadísticas de búsqueda
   */
  async getEstadisticasBusqueda(periodo = 7) {
    // Implementar analytics de búsquedas más populares
    // Por ahora retorna datos mock
    return {
      terminosPopulares: ['creamfields', 'lollapalooza', 'peñarol'],
      busquedasSinResultados: ['evento x', 'fiesta y'],
      categoriasPopulares: ['concierto', 'festival', 'deportes']
    };
  }
}

module.exports = new EventMatcherService();