/**
 * EVENT SELECTOR - REENTRASTE
 * ============================
 * Componente para buscar y seleccionar eventos existentes
 * 
 * Archivo: /js/components/event-selector.js
 */

class EventSelector {
  constructor() {
    this.selectedEvent = null;
    this.searchTimeout = null;
    this.isLoading = false;
  }

  // ==========================================================================
  // RENDERIZADO DEL COMPONENTE
  // ==========================================================================

  render(containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = `
      <div class="event-selector-container">
        <!-- Header -->
        <div class="selector-header">
          <h3>¿Para qué evento vendes tu entrada?</h3>
          <p class="subtitle">Busca el evento o créalo si no existe</p>
        </div>

        <!-- Búsqueda principal -->
        <div class="search-section">
          <div class="search-container">
            <div class="search-input-wrapper">
              <span class="search-icon">🔍</span>
              <input 
                id="eventSearch" 
                type="text"
                placeholder="Ej: Creamfields, Lollapalooza, Peñarol vs Nacional..."
                class="search-input"
                autocomplete="off"
              >
              <div id="searchLoading" class="search-loading hidden">
                <div class="spinner"></div>
              </div>
            </div>
            <div id="searchSuggestions" class="suggestions-dropdown hidden"></div>
          </div>
        </div>

        <!-- Eventos populares -->
        <div class="popular-section">
          <h4>📈 Eventos populares esta semana</h4>
          <div id="popularEvents" class="popular-events-grid">
            <!-- Se llena dinámicamente -->
          </div>
        </div>

        <!-- Eventos por categoría -->
        <div class="categories-section">
          <h4>🎭 Buscar por categoría</h4>
          <div class="category-buttons">
            <button class="category-btn" data-category="concierto">🎵 Conciertos</button>
            <button class="category-btn" data-category="festival">🎪 Festivales</button>
            <button class="category-btn" data-category="deportes">⚽ Deportes</button>
            <button class="category-btn" data-category="teatro">🎭 Teatro</button>
            <button class="category-btn" data-category="fiesta">🎉 Fiestas</button>
            <button class="category-btn" data-category="otro">📅 Otros</button>
          </div>
        </div>

        <!-- Crear nuevo evento -->
        <div class="create-section">
          <div class="divider">
            <span>o si no encuentras tu evento</span>
          </div>
          <button id="createNewEventBtn" class="create-new-btn">
            <span class="btn-icon">➕</span>
            Crear nuevo evento
          </button>
        </div>

        <!-- Evento seleccionado -->
        <div id="selectedEventPreview" class="selected-event-preview hidden">
          <!-- Se muestra cuando selecciona un evento -->
        </div>
      </div>
    `;

    this.bindEvents();
    this.loadPopularEvents();
  }

  // ==========================================================================
  // EVENT HANDLERS
  // ==========================================================================

  bindEvents() {
    // Búsqueda con autocompletado
    const searchInput = document.getElementById('eventSearch');
    searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
    searchInput.addEventListener('focus', () => this.showRecentSearches());
    
    // Click fuera para cerrar sugerencias
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-container')) {
        this.hideSuggestions();
      }
    });

    // Botones de categorías
    document.querySelectorAll('.category-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const category = e.target.dataset.category;
        this.searchByCategory(category);
      });
    });

    // Crear nuevo evento
    document.getElementById('createNewEventBtn').addEventListener('click', () => {
      this.showCreateEventForm();
    });
  }

  // ==========================================================================
  // BÚSQUEDA Y AUTOCOMPLETADO
  // ==========================================================================

  async handleSearch(query) {
    if (query.length < 2) {
      this.hideSuggestions();
      return;
    }

    this.showLoading(true);

    // Debounce para evitar muchas consultas
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(async () => {
      try {
        const suggestions = await this.fetchSuggestions(query);
        this.showSuggestions(suggestions, query);
      } catch (error) {
        console.error('Error en búsqueda:', error);
        this.showError('Error al buscar eventos');
      } finally {
        this.showLoading(false);
      }
    }, 300);
  }

  async fetchSuggestions(query) {
    const response = await fetch(`/api/events/autocomplete?q=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      throw new Error('Error en la búsqueda');
    }

    const data = await response.json();
    return data.success ? data.data : [];
  }

  showSuggestions(events, query) {
    const container = document.getElementById('searchSuggestions');
    
    if (events.length === 0) {
      container.innerHTML = `
        <div class="no-results">
          <div class="no-results-icon">🔍</div>
          <h4>No encontramos "${query}"</h4>
          <p>¿Quieres crear este evento?</p>
          <button class="create-from-search-btn" onclick="EventSelector.createEventFromSearch('${query}')">
            ➕ Crear "${query}"
          </button>
        </div>
      `;
    } else {
      container.innerHTML = events.map(event => `
        <div class="suggestion-item" onclick="EventSelector.selectEvent('${event.id}')">
          <div class="suggestion-image">
            <img src="${event.imagen || '/images/default-event.jpg'}" alt="${event.nombre}">
          </div>
          <div class="suggestion-content">
            <h4 class="event-name">${this.highlightMatch(event.nombre, query)}</h4>
            <div class="event-details">
              <span class="event-date">📅 ${this.formatDate(event.fecha)}</span>
              <span class="event-venue">📍 ${event.ubicacion.venue}</span>
              <span class="event-category">🏷️ ${event.categoria}</span>
            </div>
            <div class="event-stats">
              <span class="tickets-count">${event.totalEntradas} entradas disponibles</span>
              <span class="price-range">desde $${event.precioMin}</span>
            </div>
          </div>
          <div class="suggestion-arrow">→</div>
        </div>
      `).join('');
    }

    container.classList.remove('hidden');
  }

  hideSuggestions() {
    document.getElementById('searchSuggestions').classList.add('hidden');
  }

  showLoading(show) {
    const loader = document.getElementById('searchLoading');
    loader.classList.toggle('hidden', !show);
    this.isLoading = show;
  }

  // ==========================================================================
  // EVENTOS POPULARES
  // ==========================================================================

  async loadPopularEvents() {
    try {
      const response = await fetch('/api/events/popular?limit=6');
      const data = await response.json();
      
      if (data.success) {
        this.renderPopularEvents(data.data);
      }
    } catch (error) {
      console.error('Error cargando eventos populares:', error);
    }
  }

  renderPopularEvents(events) {
    const container = document.getElementById('popularEvents');
    
    container.innerHTML = events.map(event => `
      <div class="popular-event-card" onclick="EventSelector.selectEvent('${event.id}')">
        <div class="card-image">
          <img src="${event.imagen || '/images/default-event.jpg'}" alt="${event.nombre}">
          <div class="card-badge">${event.totalEntradas} entradas</div>
        </div>
        <div class="card-content">
          <h5 class="card-title">${event.nombre}</h5>
          <p class="card-date">${this.formatDate(event.fecha)}</p>
          <p class="card-venue">${event.ubicacion.venue}</p>
          <div class="card-price">desde $${event.precioMin}</div>
        </div>
      </div>
    `).join('');
  }

  // ==========================================================================
  // BÚSQUEDA POR CATEGORÍA
  // ==========================================================================

  async searchByCategory(category) {
    try {
      // Highlight botón activo
      document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      document.querySelector(`[data-category="${category}"]`).classList.add('active');

      const response = await fetch(`/api/events/search?category=${category}&limit=10`);
      const data = await response.json();
      
      if (data.success) {
        this.showCategoryResults(data.data, category);
      }
    } catch (error) {
      console.error('Error buscando por categoría:', error);
    }
  }

  showCategoryResults(events, category) {
    const container = document.getElementById('searchSuggestions');
    
    container.innerHTML = `
      <div class="category-results">
        <h4>Eventos de ${this.getCategoryName(category)}</h4>
        <div class="category-events">
          ${events.map(event => `
            <div class="category-event-item" onclick="EventSelector.selectEvent('${event.id}')">
              <img src="${event.imagen || '/images/default-event.jpg'}" alt="${event.nombre}">
              <div class="event-info">
                <h5>${event.nombre}</h5>
                <p>${this.formatDate(event.fecha)} • ${event.ubicacion.venue}</p>
                <span class="ticket-count">${event.totalEntradas} entradas</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    
    container.classList.remove('hidden');
  }

  // ==========================================================================
  // SELECCIÓN DE EVENTO
  // ==========================================================================

  async selectEvent(eventId) {
    try {
      const response = await fetch(`/api/events/${eventId}`);
      const data = await response.json();
      
      if (data.success) {
        this.selectedEvent = data.data;
        this.showSelectedEvent(this.selectedEvent);
        this.hideSuggestions();
        
        // Trigger evento para continuar con venta
        this.onEventSelected(this.selectedEvent);
      }
    } catch (error) {
      console.error('Error seleccionando evento:', error);
      this.showError('Error al cargar el evento');
    }
  }

  showSelectedEvent(event) {
    const preview = document.getElementById('selectedEventPreview');
    
    preview.innerHTML = `
      <div class="selected-event-card">
        <div class="selected-header">
          <h4>✅ Evento seleccionado</h4>
          <button class="change-event-btn" onclick="EventSelector.clearSelection()">Cambiar</button>
        </div>
        <div class="selected-content">
          <img src="${event.imagen || '/images/default-event.jpg'}" alt="${event.nombre}">
          <div class="selected-info">
            <h3>${event.nombre}</h3>
            <p class="selected-date">📅 ${this.formatDate(event.fecha)}</p>
            <p class="selected-venue">📍 ${event.ubicacion.venue}, ${event.ubicacion.ciudad}</p>
            <p class="selected-category">🏷️ ${event.categoria}</p>
          </div>
        </div>
      </div>
    `;
    
    preview.classList.remove('hidden');
  }

  clearSelection() {
    this.selectedEvent = null;
    document.getElementById('selectedEventPreview').classList.add('hidden');
    document.getElementById('eventSearch').value = '';
    document.getElementById('eventSearch').focus();
  }

  // ==========================================================================
  // CREAR NUEVO EVENTO
  // ==========================================================================

  showCreateEventForm() {
    // Trigger para mostrar formulario de creación
    if (window.CreateEventForm) {
      window.CreateEventForm.show();
    } else {
      // Fallback - redirigir a página de creación
      window.location.href = '/crear-evento';
    }
  }

  createEventFromSearch(query) {
    this.showCreateEventForm();
    // Pre-llenar el nombre del evento
    setTimeout(() => {
      const nameInput = document.getElementById('eventName');
      if (nameInput) {
        nameInput.value = query;
        nameInput.focus();
      }
    }, 100);
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  highlightMatch(text, query) {
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Mañana';
    if (diffDays < 7) return `En ${diffDays} días`;
    
    return date.toLocaleDateString('es-UY', { 
      day: 'numeric', 
      month: 'short',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  }

  getCategoryName(category) {
    const names = {
      'concierto': 'Conciertos',
      'festival': 'Festivales', 
      'deportes': 'Deportes',
      'teatro': 'Teatro',
      'fiesta': 'Fiestas',
      'otro': 'Otros'
    };
    return names[category] || category;
  }

  showError(message) {
    // Mostrar toast o notificación de error
    console.error(message);
  }

  showRecentSearches() {
    // Mostrar búsquedas recientes del localStorage
    const recent = JSON.parse(localStorage.getItem('recentEventSearches') || '[]');
    if (recent.length > 0) {
      // Implementar mostrar búsquedas recientes
    }
  }

  // ==========================================================================
  // CALLBACKS
  // ==========================================================================

  onEventSelected(event) {
    // Callback cuando se selecciona un evento
    // Para ser implementado por la página que use este componente
    console.log('Evento seleccionado:', event);
    
    // Ejemplo: continuar al formulario de venta
    if (window.TicketSaleForm) {
      window.TicketSaleForm.setEvent(event);
      window.TicketSaleForm.show();
    }
  }
}

// ==========================================================================
// INSTANCIA GLOBAL
// ==========================================================================

// Crear instancia global para uso en HTML
window.EventSelector = new EventSelector();

// Auto-inicializar si existe el contenedor
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('eventSelectorContainer');
  if (container) {
    window.EventSelector.render('eventSelectorContainer');
  }
});