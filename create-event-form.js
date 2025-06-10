/**
 * CREATE EVENT FORM - REENTRASTE
 * ===============================
 * Formulario para crear nuevos eventos
 * 
 * Archivo: /js/components/create-event-form.js
 */

class CreateEventForm {
  constructor() {
    this.isVisible = false;
    this.duplicateCheckTimeout = null;
    this.venueSearchTimeout = null;
    this.selectedVenue = null;
    this.uploadedImage = null;
  }

  // ==========================================================================
  // RENDERIZADO DEL FORMULARIO
  // ==========================================================================

  show() {
    if (this.isVisible) return;
    
    this.createOverlay();
    this.render();
    this.bindEvents();
    this.isVisible = true;
    
    // Focus en el primer campo
    setTimeout(() => {
      document.getElementById('eventName')?.focus();
    }, 100);
  }

  createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'createEventOverlay';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-container">
        <div id="createEventFormContainer" class="create-event-form-container">
          <!-- El formulario se renderiza aquí -->
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Cerrar con ESC o click fuera
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) this.close();
    });
  }

  render() {
    const container = document.getElementById('createEventFormContainer');
    
    container.innerHTML = `
      <div class="create-event-form">
        <!-- Header -->
        <div class="form-header">
          <h2>🎪 Crear Nuevo Evento</h2>
          <button class="close-btn" onclick="CreateEventForm.close()">&times;</button>
        </div>

        <!-- Formulario -->
        <form id="createEventForm" class="event-form">
          
          <!-- Nombre del evento -->
          <div class="form-section">
            <label for="eventName" class="form-label required">Nombre del evento</label>
            <input 
              type="text" 
              id="eventName" 
              name="nombre"
              class="form-input" 
              placeholder="Ej: Creamfields Uruguay 2025"
              required
            >
            <div id="duplicateWarning" class="warning-message hidden">
              <div class="warning-content">
                <span class="warning-icon">⚠️</span>
                <div class="warning-text">
                  <strong>Encontramos eventos similares</strong>
                  <p>¿Es alguno de estos el evento que buscas?</p>
                </div>
              </div>
              <div id="similarEvents" class="similar-events">
                <!-- Se llenan dinámicamente -->
              </div>
            </div>
            <div class="form-help">Usa el nombre oficial del evento</div>
          </div>

          <!-- Fecha y hora -->
          <div class="form-row">
            <div class="form-field">
              <label for="eventDate" class="form-label required">Fecha</label>
              <input 
                type="date" 
                id="eventDate" 
                name="fecha"
                class="form-input"
                min="${new Date().toISOString().split('T')[0]}"
                required
              >
            </div>
            <div class="form-field">
              <label for="eventTime" class="form-label">Hora</label>
              <input 
                type="time" 
                id="eventTime" 
                name="hora"
                class="form-input"
                value="21:00"
              >
            </div>
            <div class="form-field">
              <label for="eventEndDate" class="form-label">Fecha fin (opcional)</label>
              <input 
                type="date" 
                id="eventEndDate" 
                name="fechaFin"
                class="form-input"
                min="${new Date().toISOString().split('T')[0]}"
              >
            </div>
          </div>

          <!-- Ubicación -->
          <div class="form-section">
            <label for="eventVenue" class="form-label required">Lugar del evento</label>
            <div class="venue-input-container">
              <input 
                type="text" 
                id="eventVenue" 
                name="venue"
                class="form-input venue-input" 
                placeholder="Ej: Antel Arena, Sala del Museo, Punta Carretas..."
                autocomplete="off"
                required
              >
              <div id="venueSuggestions" class="venue-suggestions hidden">
                <!-- Sugerencias de venues -->
              </div>
            </div>
            
            <!-- Dirección completa -->
            <div class="venue-details">
              <div class="form-row">
                <div class="form-field">
                  <label for="eventCity" class="form-label">Ciudad</label>
                  <select id="eventCity" name="ciudad" class="form-input">
                    <option value="Montevideo" selected>Montevideo</option>
                    <option value="Canelones">Canelones</option>
                    <option value="Maldonado">Maldonado</option>
                    <option value="Colonia">Colonia</option>
                    <option value="Salto">Salto</option>
                    <option value="Paysandú">Paysandú</option>
                    <option value="Rivera">Rivera</option>
                    <option value="Tacuarembó">Tacuarembó</option>
                    <option value="Otra">Otra</option>
                  </select>
                </div>
                <div class="form-field">
                  <label for="eventAddress" class="form-label">Dirección (opcional)</label>
                  <input 
                    type="text" 
                    id="eventAddress" 
                    name="direccion"
                    class="form-input" 
                    placeholder="Ej: Av. Dr. Américo Ricaldoni 2222"
                  >
                </div>
              </div>
            </div>
          </div>

          <!-- Categoría y géneros -->
          <div class="form-row">
            <div class="form-field">
              <label for="eventCategory" class="form-label required">Tipo de evento</label>
              <select id="eventCategory" name="categoria" class="form-input" required>
                <option value="">Selecciona una categoría</option>
                <option value="concierto">🎵 Concierto</option>
                <option value="festival">🎪 Festival</option>
                <option value="teatro">🎭 Teatro</option>
                <option value="deportes">⚽ Deportes</option>
                <option value="fiesta">🎉 Fiesta/Discoteca</option>
                <option value="conferencia">🎤 Conferencia</option>
                <option value="exposicion">🖼️ Exposición</option>
                <option value="otro">📅 Otro</option>
              </select>
            </div>
            <div class="form-field">
              <label for="eventGenres" class="form-label">Géneros (opcional)</label>
              <input 
                type="text" 
                id="eventGenres" 
                name="generos"
                class="form-input" 
                placeholder="Ej: electrónica, house, techno"
              >
              <div class="form-help">Separar con comas</div>
            </div>
          </div>

          <!-- Descripción -->
          <div class="form-section">
            <label for="eventDescription" class="form-label">Descripción (opcional)</label>
            <textarea 
              id="eventDescription" 
              name="descripcion"
              class="form-textarea" 
              rows="3"
              placeholder="Describe el evento, artistas, detalles importantes..."
              maxlength="500"
            ></textarea>
            <div class="char-counter">
              <span id="descriptionCounter">0</span>/500 caracteres
            </div>
          </div>

          <!-- Imagen del evento -->
          <div class="form-section">
            <label class="form-label">Imagen del evento</label>
            <div class="image-upload-container">
              <input type="file" id="eventImage" name="imagen" accept="image/*" class="hidden">
              <div class="image-upload-area" onclick="document.getElementById('eventImage').click()">
                <div id="imagePreview" class="image-preview hidden">
                  <img id="previewImg" src="" alt="Preview">
                  <button type="button" class="remove-image" onclick="CreateEventForm.removeImage()">&times;</button>
                </div>
                <div id="uploadPlaceholder" class="upload-placeholder">
                  <div class="upload-icon">📷</div>
                  <h4>Sube una imagen del evento</h4>
                  <p>Formatos: JPG, PNG (máx. 5MB)</p>
                  <button type="button" class="upload-btn">Seleccionar imagen</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Información adicional -->
          <div class="form-section collapsible">
            <button type="button" class="collapsible-header" onclick="CreateEventForm.toggleSection('additionalInfo')">
              <span>ℹ️ Información adicional (opcional)</span>
              <span class="collapse-icon">▼</span>
            </button>
            <div id="additionalInfo" class="collapsible-content hidden">
              <div class="form-row">
                <div class="form-field">
                  <label for="eventCapacity" class="form-label">Capacidad estimada</label>
                  <input 
                    type="number" 
                    id="eventCapacity" 
                    name="capacidad"
                    class="form-input" 
                    placeholder="1000"
                    min="1"
                  >
                </div>
                <div class="form-field">
                  <label for="eventAgeLimit" class="form-label">Edad mínima</label>
                  <select id="eventAgeLimit" name="edadMinima" class="form-input">
                    <option value="">Sin restricción</option>
                    <option value="16">16+</option>
                    <option value="18">18+</option>
                    <option value="21">21+</option>
                  </select>
                </div>
              </div>
              
              <div class="form-field">
                <label for="eventTags" class="form-label">Tags</label>
                <input 
                  type="text" 
                  id="eventTags" 
                  name="tags"
                  class="form-input" 
                  placeholder="Ej: outdoor, internacional, weekend"
                >
                <div class="form-help">Palabras clave separadas por comas</div>
              </div>
            </div>
          </div>

          <!-- Botones de acción -->
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="CreateEventForm.close()">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" id="submitEventBtn">
              <span class="btn-text">Crear Evento</span>
              <span class="btn-loading hidden">Creando...</span>
            </button>
          </div>

        </form>
      </div>
    `;
  }

  // ==========================================================================
  // EVENT HANDLERS
  // ==========================================================================

  bindEvents() {
    // Formulario
    const form = document.getElementById('createEventForm');
    form.addEventListener('submit', (e) => this.handleSubmit(e));

    // Verificación de duplicados en nombre
    const nameInput = document.getElementById('eventName');
    nameInput.addEventListener('input', (e) => this.checkDuplicates(e.target.value));

    // Búsqueda de venues
    const venueInput = document.getElementById('eventVenue');
    venueInput.addEventListener('input', (e) => this.searchVenues(e.target.value));
    venueInput.addEventListener('focus', () => this.showPopularVenues());

    // Upload de imagen
    const imageInput = document.getElementById('eventImage');
    imageInput.addEventListener('change', (e) => this.handleImageUpload(e));

    // Contador de caracteres para descripción
    const descriptionTextarea = document.getElementById('eventDescription');
    descriptionTextarea.addEventListener('input', (e) => this.updateCharCounter(e.target.value));

    // Auto-llenar fecha fin
    const startDate = document.getElementById('eventDate');
    startDate.addEventListener('change', (e) => this.updateEndDate(e.target.value));
  }

  // ==========================================================================
  // VERIFICACIÓN DE DUPLICADOS
  // ==========================================================================

  async checkDuplicates(eventName) {
    if (eventName.length < 3) {
      this.hideDuplicateWarning();
      return;
    }

    clearTimeout(this.duplicateCheckTimeout);
    this.duplicateCheckTimeout = setTimeout(async () => {
      try {
        const response = await fetch(`/api/events/check-duplicates?name=${encodeURIComponent(eventName)}`);
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
          this.showDuplicateWarning(data.data);
        } else {
          this.hideDuplicateWarning();
        }
      } catch (error) {
        console.error('Error verificando duplicados:', error);
      }
    }, 800);
  }

  showDuplicateWarning(similarEvents) {
    const warning = document.getElementById('duplicateWarning');
    const container = document.getElementById('similarEvents');
    
    container.innerHTML = similarEvents.map(event => `
      <div class="similar-event-item" onclick="CreateEventForm.selectSimilarEvent('${event.id}')">
        <img src="${event.imagen || '/images/default-event.jpg'}" alt="${event.nombre}">
        <div class="similar-event-info">
          <h5>${event.nombre}</h5>
          <p>${this.formatDate(event.fecha)} • ${event.ubicacion.venue}</p>
        </div>
        <button type="button" class="select-similar-btn">Usar este evento</button>
      </div>
    `).join('');
    
    warning.classList.remove('hidden');
  }

  hideDuplicateWarning() {
    document.getElementById('duplicateWarning').classList.add('hidden');
  }

  selectSimilarEvent(eventId) {
    // Cerrar formulario y seleccionar el evento similar
    this.close();
    if (window.EventSelector) {
      window.EventSelector.selectEvent(eventId);
    }
  }

  // ==========================================================================
  // BÚSQUEDA DE VENUES
  // ==========================================================================

  async searchVenues(query) {
    if (query.length < 2) {
      this.hideVenueSuggestions();
      return;
    }

    clearTimeout(this.venueSearchTimeout);
    this.venueSearchTimeout = setTimeout(async () => {
      try {
        const response = await fetch(`/api/venues/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.success) {
          this.showVenueSuggestions(data.data);
        }
      } catch (error) {
        console.error('Error buscando venues:', error);
      }
    }, 300);
  }

  async showPopularVenues() {
    try {
      const response = await fetch('/api/venues/popular?limit=5');
      const data = await response.json();
      
      if (data.success) {
        this.showVenueSuggestions(data.data, 'Venues populares');
      }
    } catch (error) {
      console.error('Error cargando venues populares:', error);
    }
  }

  showVenueSuggestions(venues, title = null) {
    const container = document.getElementById('venueSuggestions');
    
    container.innerHTML = `
      ${title ? `<div class="suggestions-title">${title}</div>` : ''}
      ${venues.map(venue => `
        <div class="venue-suggestion" onclick="CreateEventForm.selectVenue('${venue.id}')">
          <div class="venue-icon">📍</div>
          <div class="venue-info">
            <h5>${venue.nombre}</h5>
            <p>${venue.direccion}, ${venue.ciudad}</p>
            ${venue.capacidad ? `<span class="venue-capacity">Capacidad: ${venue.capacidad}</span>` : ''}
          </div>
        </div>
      `).join('')}
    `;
    
    container.classList.remove('hidden');
  }

  hideVenueSuggestions() {
    document.getElementById('venueSuggestions').classList.add('hidden');
  }

  selectVenue(venueId) {
    // Obtener información del venue y autocompletar campos
    fetch(`/api/venues/${venueId}`)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          const venue = data.data;
          document.getElementById('eventVenue').value = venue.nombre;
          document.getElementById('eventCity').value = venue.ciudad;
          document.getElementById('eventAddress').value = venue.direccion || '';
          if (venue.capacidad) {
            document.getElementById('eventCapacity').value = venue.capacidad;
          }
          this.selectedVenue = venue;
          this.hideVenueSuggestions();
        }
      })
      .catch(error => console.error('Error seleccionando venue:', error));
  }

  // ==========================================================================
  // MANEJO DE IMAGEN
  // ==========================================================================

  handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validaciones
    if (file.size > 5 * 1024 * 1024) { // 5MB
      alert('La imagen es muy grande. Máximo 5MB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Solo se permiten archivos de imagen.');
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('previewImg').src = e.target.result;
      document.getElementById('imagePreview').classList.remove('hidden');
      document.getElementById('uploadPlaceholder').classList.add('hidden');
    };
    reader.readAsDataURL(file);

    this.uploadedImage = file;
  }

  removeImage() {
    document.getElementById('eventImage').value = '';
    document.getElementById('imagePreview').classList.add('hidden');
    document.getElementById('uploadPlaceholder').classList.remove('hidden');
    this.uploadedImage = null;
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  updateCharCounter(text) {
    document.getElementById('descriptionCounter').textContent = text.length;
  }

  updateEndDate(startDate) {
    const endDateInput = document.getElementById('eventEndDate');
    if (!endDateInput.value) {
      endDateInput.min = startDate;
    }
  }

  toggleSection(sectionId) {
    const section = document.getElementById(sectionId);
    const icon = section.previousElementSibling.querySelector('.collapse-icon');
    
    section.classList.toggle('hidden');
    icon.textContent = section.classList.contains('hidden') ? '▼' : '▲';
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-UY', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  }

  // ==========================================================================
  // SUBMIT DEL FORMULARIO
  // ==========================================================================

  async handleSubmit(event) {
    event.preventDefault();
    
    const submitBtn = document.getElementById('submitEventBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    
    // UI de loading
    submitBtn.disabled = true;
    btnText.classList.add('hidden');
    btnLoading.classList.remove('hidden');

    try {
      const formData = this.collectFormData();
      const response = await this.submitEvent(formData);
      
      if (response.success) {
        this.showSuccess('¡Evento creado exitosamente!');
        
        // Cerrar formulario y seleccionar el nuevo evento
        setTimeout(() => {
          this.close();
          if (window.EventSelector) {
            window.EventSelector.selectEvent(response.data.id);
          }
        }, 1500);
      } else {
        throw new Error(response.error || 'Error al crear el evento');
      }
      
    } catch (error) {
      console.error('Error creando evento:', error);
      this.showError(error.message);
    } finally {
      // Restaurar botón
      submitBtn.disabled = false;
      btnText.classList.remove('hidden');
      btnLoading.classList.add('hidden');
    }
  }

  collectFormData() {
    const form = document.getElementById('createEventForm');
    const formData = new FormData(form);
    
    // Convertir géneros y tags a arrays
    const generos = formData.get('generos');
    if (generos) {
      formData.set('generos', generos.split(',').map(g => g.trim()).filter(g => g));
    }
    
    const tags = formData.get('tags');
    if (tags) {
      formData.set('tags', tags.split(',').map(t => t.trim()).filter(t => t));
    }
    
    // Agregar imagen si existe
    if (this.uploadedImage) {
      formData.set('imagen', this.uploadedImage);
    }
    
    // Agregar venue seleccionado
    if (this.selectedVenue) {
      formData.set('venueId', this.selectedVenue.id);
    }
    
    return formData;
  }

  async submitEvent(formData) {
    const response = await fetch('/api/events/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    });
    
    return await response.json();
  }

  // ==========================================================================
  // CERRAR FORMULARIO
  // ==========================================================================

  close() {
    const overlay = document.getElementById('createEventOverlay');
    if (overlay) {
      overlay.remove();
    }
    this.isVisible = false;
    this.selectedVenue = null;
    this.uploadedImage = null;
  }

  // ==========================================================================
  // FEEDBACK AL USUARIO
  // ==========================================================================

  showSuccess(message) {
    // Implementar notificación de éxito
    console.log('✅', message);
  }

  showError(message) {
    // Implementar notificación de error
    console.error('❌', message);
    alert(message); // Temporal
  }
}

// ==========================================================================
// INSTANCIA GLOBAL
// ==========================================================================

window.CreateEventForm = new CreateEventForm();