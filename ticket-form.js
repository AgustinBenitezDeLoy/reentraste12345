/**
 * TICKET FORM COMPONENT - REENTRASTE
 * ===================================
 * Formulario para crear y publicar entradas
 * 
 * Archivo: /js/components/ticket-form.js
 */

class TicketForm {
  constructor() {
    this.selectedEvent = null;
    this.currentStep = 2; // Empezamos en paso 2 (después de seleccionar evento)
    this.formData = {};
    this.imageFiles = [];
    this.isSubmitting = false;
    
    this.init();
  }

  // ==========================================================================
  // INICIALIZACIÓN
  // ==========================================================================

  init() {
    this.loadFromStorage();
    this.bindEvents();
  }

  setEvent(event) {
    this.selectedEvent = event;
    this.updateEventInfo();
    this.saveToStorage();
  }

  show() {
    const container = document.getElementById('ticketFormContainer');
    if (container) {
      container.classList.remove('hidden');
      this.render();
    }
  }

  hide() {
    const container = document.getElementById('ticketFormContainer');
    if (container) {
      container.classList.add('hidden');
    }
  }

  // ==========================================================================
  // PERSISTENCIA DE DATOS
  // ==========================================================================

  saveToStorage() {
    const data = {
      formData: this.formData,
      currentStep: this.currentStep,
      selectedEvent: this.selectedEvent
    };
    localStorage.setItem('ticketFormDraft', JSON.stringify(data));
  }

  loadFromStorage() {
    const saved = localStorage.getItem('ticketFormDraft');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.formData = data.formData || {};
        this.currentStep = data.currentStep || 2;
        this.selectedEvent = data.selectedEvent || null;
      } catch (error) {
        console.error('Error loading form data:', error);
      }
    }
  }

  clearStorage() {
    localStorage.removeItem('ticketFormDraft');
  }

  reset() {
    this.formData = {};
    this.imageFiles = [];
    this.currentStep = 2;
    this.selectedEvent = null;
    this.isSubmitting = false;
    this.clearStorage();
  }

  // ==========================================================================
  // RENDERIZADO
  // ==========================================================================

  render() {
    const container = document.getElementById('ticketFormContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="ticket-form-container">
        ${this.renderStepContent()}
      </div>
    `;

    this.bindFormEvents();
    this.loadSimilarTickets();
    this.populateFormData();
  }

  populateFormData() {
    // Llenar formulario con datos guardados
    Object.keys(this.formData).forEach(key => {
      const element = document.getElementById(key);
      if (element) {
        if (element.type === 'checkbox') {
          element.checked = !!this.formData[key];
        } else {
          element.value = this.formData[key] || '';
        }
      }
    });

    // Actualizar contadores de caracteres
    this.updateCharCounters();
    
    // Actualizar precios en revisión si estamos en el paso 4
    if (this.currentStep === 4) {
      setTimeout(() => this.updateReviewPricing(), 100);
    }
  }

  renderStepContent() {
    switch (this.currentStep) {
      case 2:
        return this.renderTicketDetailsStep();
      case 3:
        return this.renderContactStep();
      case 4:
        return this.renderReviewStep();
      default:
        return this.renderTicketDetailsStep();
    }
  }

  renderTicketDetailsStep() {
    return `
      <div class="form-step step-2">
        <div class="step-header">
          <h2>📝 Detalles de tu entrada</h2>
          <p>Proporciona información detallada para que los compradores confíen en tu entrada</p>
        </div>

        ${this.renderEventSummary()}
        
        <form id="ticketDetailsForm" class="ticket-form">
          <!-- Tipo de entrada -->
          <div class="form-section">
            <h3>🎫 Información básica</h3>
            
            <div class="form-row">
              <div class="form-field">
                <label for="tipoEntrada" class="form-label required">Tipo de entrada</label>
                <select id="tipoEntrada" name="tipoEntrada" class="form-input" required>
                  <option value="">Selecciona el tipo</option>
                  <option value="General">General</option>
                  <option value="VIP">VIP</option>
                  <option value="Early Bird">Early Bird</option>
                  <option value="Premium">Premium</option>
                  <option value="Palco">Palco</option>
                  <option value="Campo">Campo</option>
                  <option value="Platea">Platea</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              
              <div class="form-field">
                <label for="cantidad" class="form-label required">Cantidad</label>
                <select id="cantidad" name="cantidad" class="form-input" required>
                  <option value="1">1 entrada</option>
                  <option value="2">2 entradas</option>
                  <option value="3">3 entradas</option>
                  <option value="4">4 entradas</option>
                  <option value="5">5 entradas</option>
                  <option value="6">6 entradas</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Ubicación -->
          <div class="form-section">
            <h3>📍 Ubicación en el evento</h3>
            
            <div class="form-row">
              <div class="form-field">
                <label for="sector" class="form-label">Sector</label>
                <input type="text" id="sector" name="sector" class="form-input" 
                       placeholder="Ej: Campo, Platea A, VIP Zone">
              </div>
              
              <div class="form-field">
                <label for="fila" class="form-label">Fila</label>
                <input type="text" id="fila" name="fila" class="form-input" 
                       placeholder="Ej: 15, A, Premium">
              </div>
              
              <div class="form-field">
                <label for="asiento" class="form-label">Asiento(s)</label>
                <input type="text" id="asiento" name="asiento" class="form-input" 
                       placeholder="Ej: 23-24, 156, A1-A2">
              </div>
            </div>
            
            <div class="form-field">
              <label for="ubicacionDetalle" class="form-label">Detalles adicionales de ubicación</label>
              <textarea id="ubicacionDetalle" name="ubicacionDetalle" class="form-textarea" rows="2"
                        placeholder="Ej: Cerca del escenario, lado derecho, con buena vista..."></textarea>
            </div>
          </div>

          <!-- Precio -->
          <div class="form-section">
            <h3>💰 Precio y condiciones</h3>
            
            <div class="form-row">
              <div class="form-field">
                <label for="precio" class="form-label required">Precio de venta (UYU)</label>
                <div class="price-input-wrapper">
                  <span class="currency-symbol">$</span>
                  <input type="number" id="precio" name="precio" class="form-input price-input" 
                         min="100" max="50000" step="50" required
                         placeholder="2500">
                </div>
                <div class="price-suggestion" id="priceSuggestion">
                  <!-- Se llena dinámicamente -->
                </div>
              </div>
              
              <div class="form-field">
                <label for="precioOriginal" class="form-label">Precio original (opcional)</label>
                <div class="price-input-wrapper">
                  <span class="currency-symbol">$</span>
                  <input type="number" id="precioOriginal" name="precioOriginal" class="form-input price-input" 
                         min="100" max="50000" step="50"
                         placeholder="3000">
                </div>
                <div class="form-help">Ayuda a los compradores a ver si es una oferta</div>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-field checkbox-field">
                <label class="checkbox-label">
                  <input type="checkbox" id="negociable" name="negociable">
                  <span class="checkmark"></span>
                  Precio negociable
                </label>
              </div>
              
              <div class="form-field checkbox-field">
                <label class="checkbox-label">
                  <input type="checkbox" id="acepta_intercambio" name="acepta_intercambio">
                  <span class="checkmark"></span>
                  Acepto intercambios
                </label>
              </div>
            </div>
          </div>

          <!-- Descripción -->
          <div class="form-section">
            <h3>📄 Descripción</h3>
            
            <div class="form-field">
              <label for="descripcion" class="form-label">Describe tu entrada</label>
              <textarea id="descripcion" name="descripcion" class="form-textarea" rows="4"
                        placeholder="Ej: Entrada original en perfecto estado. Comprada en preventa. Ubicación excelente con vista directa al escenario. Vendo por no poder asistir..."
                        maxlength="500"></textarea>
              <div class="char-counter">
                <span id="descripcionCounter">0</span>/500 caracteres
              </div>
            </div>
            
            <div class="form-field">
              <label for="condiciones" class="form-label">Condiciones de venta</label>
              <textarea id="condiciones" name="condiciones" class="form-textarea" rows="2"
                        placeholder="Ej: Pago por transferencia bancaria. Entrega digital inmediata tras confirmación de pago..."
                        maxlength="300"></textarea>
              <div class="char-counter">
                <span id="condicionesCounter">0</span>/300 caracteres
              </div>
            </div>
          </div>

          <!-- Imágenes -->
          <div class="form-section">
            <h3>📸 Fotos de la entrada</h3>
            <p class="section-description">Sube fotos claras de tu entrada para generar confianza</p>
            
            <div class="image-upload-area" id="imageUploadArea">
              <input type="file" id="ticketImages" name="images" multiple accept="image/*" class="hidden">
              <div class="upload-placeholder" id="uploadPlaceholder">
                <div class="upload-icon">📷</div>
                <h4>Sube fotos de tu entrada</h4>
                <p>Arrastra archivos aquí o haz clic para seleccionar</p>
                <p class="upload-specs">JPG, PNG (máx. 5MB cada una)</p>
                <button type="button" class="upload-btn" onclick="document.getElementById('ticketImages').click()">
                  Seleccionar fotos
                </button>
              </div>
              <div id="imagePreviewContainer" class="image-preview-container hidden">
                <!-- Se llenan dinámicamente -->
              </div>
            </div>
          </div>

          <!-- Navegación -->
          <div class="form-navigation">
            <button type="button" class="btn btn-secondary" onclick="TicketForm.goBack()">
              ← Cambiar evento
            </button>
            <button type="submit" class="btn btn-primary">
              Continuar →
            </button>
          </div>
        </form>
      </div>
    `;
  }

  renderContactStep() {
    return `
      <div class="form-step step-3">
        <div class="step-header">
          <h2>📞 Información de contacto</h2>
          <p>¿Cómo prefieres que te contacten los compradores interesados?</p>
        </div>

        ${this.renderEventSummary()}
        ${this.renderTicketSummary()}
        
        <form id="contactForm" class="ticket-form">
          <div class="form-section">
            <h3>📱 Métodos de contacto</h3>
            <p class="section-description">Selecciona al menos un método. Tu información se mantendrá privada hasta que tengas un comprador serio.</p>
            
            <div class="contact-methods">
              <div class="contact-method">
                <div class="method-header">
                  <label class="checkbox-label">
                    <input type="checkbox" id="whatsapp_enabled" name="whatsapp_enabled" checked>
                    <span class="checkmark"></span>
                    <span class="method-icon">📱</span>
                    WhatsApp
                  </label>
                  <span class="recommended-badge">Recomendado</span>
                </div>
                <div class="method-content">
                  <input type="tel" id="whatsapp" name="whatsapp" class="form-input" 
                         placeholder="+598 99 123 456" value="${this.getCurrentUser()?.phone || ''}">
                  <div class="method-benefits">
                    <span>✓ Respuesta más rápida</span>
                    <span>✓ Comunicación directa</span>
                    <span>✓ Confirmación de entrega</span>
                  </div>
                </div>
              </div>
              
              <div class="contact-method">
                <div class="method-header">
                  <label class="checkbox-label">
                    <input type="checkbox" id="email_enabled" name="email_enabled">
                    <span class="checkmark"></span>
                    <span class="method-icon">📧</span>
                    Email
                  </label>
                </div>
                <div class="method-content">
                  <input type="email" id="email_contacto" name="email_contacto" class="form-input" 
                         placeholder="tu@email.com" value="${this.getCurrentUser()?.email || ''}" readonly>
                  <div class="form-help">Se usará tu email de cuenta</div>
                </div>
              </div>
              
              <div class="contact-method">
                <div class="method-header">
                  <label class="checkbox-label">
                    <input type="checkbox" id="telegram_enabled" name="telegram_enabled">
                    <span class="checkmark"></span>
                    <span class="method-icon">📨</span>
                    Telegram
                  </label>
                </div>
                <div class="method-content">
                  <input type="text" id="telegram" name="telegram" class="form-input" 
                         placeholder="@usuario">
                </div>
              </div>
              
              <div class="contact-method">
                <div class="method-header">
                  <label class="checkbox-label">
                    <input type="checkbox" id="instagram_enabled" name="instagram_enabled">
                    <span class="checkmark"></span>
                    <span class="method-icon">📸</span>
                    Instagram
                  </label>
                </div>
                <div class="method-content">
                  <input type="text" id="instagram" name="instagram" class="form-input" 
                         placeholder="@usuario">
                </div>
              </div>
            </div>
          </div>

          <div class="form-section">
            <h3>⚡ Preferencias de comunicación</h3>
            
            <div class="form-field">
              <label for="prefiere_contacto" class="form-label">Método preferido</label>
              <select id="prefiere_contacto" name="prefiere_contacto" class="form-input">
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
                <option value="telegram">Telegram</option>
                <option value="instagram">Instagram</option>
              </select>
            </div>
            
            <div class="form-field">
              <label for="horario_contacto" class="form-label">Horario de contacto</label>
              <select id="horario_contacto" name="horario_contacto" class="form-input">
                <option value="cualquier_momento">Cualquier momento</option>
                <option value="horario_laboral">Horario laboral (9-18hs)</option>
                <option value="tardes_noches">Tardes y noches (18-22hs)</option>
                <option value="fines_semana">Solo fines de semana</option>
              </select>
            </div>
            
            <div class="contact-tips">
              <h4>💡 Consejos para vender rápido:</h4>
              <ul>
                <li>Responde rápido a los mensajes (dentro de 2 horas)</li>
                <li>Sé claro sobre el método de pago y entrega</li>
                <li>Mantén un tono amigable y profesional</li>
                <li>Confirma la disponibilidad antes de acordar encuentros</li>
              </ul>
            </div>
          </div>

          <!-- Navegación -->
          <div class="form-navigation">
            <button type="button" class="btn btn-secondary" onclick="TicketForm.prevStep()">
              ← Volver
            </button>
            <button type="submit" class="btn btn-primary">
              Continuar →
            </button>
          </div>
        </form>
      </div>
    `;
  }

  renderReviewStep() {
    return `
      <div class="form-step step-4">
        <div class="step-header">
          <h2>✅ Revisar y publicar</h2>
          <p>Revisa todos los detalles antes de publicar tu entrada</p>
        </div>

        <div class="review-container">
          ${this.renderEventSummary()}
          ${this.renderTicketSummary()}
          ${this.renderContactSummary()}
          
          <div class="preview-section">
            <h3>👀 Vista previa</h3>
            <p>Así verán tu entrada los compradores:</p>
            
            <div class="ticket-preview-card">
              ${this.renderTicketPreview()}
            </div>
          </div>
          
          <div class="terms-section">
            <h3>📋 Términos y condiciones</h3>
            
            <div class="terms-content">
              <label class="checkbox-label large">
                <input type="checkbox" id="accept_terms" name="accept_terms" required>
                <span class="checkmark"></span>
                <div class="terms-text">
                  Acepto los <a href="/terminos" target="_blank">términos y condiciones</a> de Reentraste y confirmo que:
                  <ul>
                    <li>La entrada es auténtica y está en mi posesión</li>
                    <li>No he vendido esta entrada en otra plataforma</li>
                    <li>Me comprometo a entregar la entrada según lo acordado</li>
                    <li>Acepto pagar la comisión del 10% sobre la venta</li>
                  </ul>
                </div>
              </label>
            </div>
            
            <div class="commission-info">
              <div class="commission-breakdown">
                <div class="breakdown-item">
                  <span>Precio de venta:</span>
                  <span id="reviewPrecio">$0</span>
                </div>
                <div class="breakdown-item">
                  <span>Comisión Reentraste (10%):</span>
                  <span id="reviewComision">$0</span>
                </div>
                <div class="breakdown-item total">
                  <span>Recibirás:</span>
                  <span id="reviewGanancia">$0</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Navegación final -->
          <div class="form-navigation">
            <button type="button" class="btn btn-secondary" onclick="TicketForm.prevStep()">
              ← Volver
            </button>
            <button type="button" class="btn btn-primary btn-large" id="publishButton" onclick="TicketForm.publishTicket()">
              <span class="btn-text">🚀 Publicar entrada</span>
              <span class="btn-loading hidden">Publicando...</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderEventSummary() {
    if (!this.selectedEvent) return '';
    
    return `
      <div class="event-summary-card">
        <div class="event-summary-content">
          <img src="${this.selectedEvent.imagen || '/images/default-event.jpg'}" alt="${this.selectedEvent.nombre}">
          <div class="event-summary-info">
            <h4>${this.selectedEvent.nombre}</h4>
            <p>📅 ${this.formatDate(this.selectedEvent.fecha)}</p>
            <p>📍 ${this.selectedEvent.ubicacion.venue}, ${this.selectedEvent.ubicacion.ciudad}</p>
          </div>
        </div>
      </div>
    `;
  }

  renderTicketSummary() {
    if (!this.formData.tipoEntrada) return '';
    
    return `
      <div class="summary-card">
        <h4>🎫 Resumen de entrada</h4>
        <div class="summary-content">
          <div class="summary-item">
            <span>Tipo:</span>
            <span>${this.formData.tipoEntrada}</span>
          </div>
          <div class="summary-item">
            <span>Cantidad:</span>
            <span>${this.formData.cantidad} entrada(s)</span>
          </div>
          ${this.formData.sector ? `
          <div class="summary-item">
            <span>Ubicación:</span>
            <span>${this.formData.sector}${this.formData.fila ? ` - Fila ${this.formData.fila}` : ''}${this.formData.asiento ? ` - Asiento ${this.formData.asiento}` : ''}</span>
          </div>
          ` : ''}
          <div class="summary-item price">
            <span>Precio:</span>
            <span>$${this.formData.precio?.toLocaleString()}</span>
          </div>
        </div>
      </div>
    `;
  }

  renderContactSummary() {
    return `
      <div class="summary-card">
        <h4>📞 Contacto</h4>
        <div class="summary-content">
          <div class="summary-item">
            <span>Método preferido:</span>
            <span>${this.getContactMethodName(this.formData.prefiere_contacto)}</span>
          </div>
          <div class="summary-item">
            <span>Horario:</span>
            <span>${this.getScheduleName(this.formData.horario_contacto)}</span>
          </div>
        </div>
      </div>
    `;
  }

  renderTicketPreview() {
    return `
      <div class="ticket-listing-preview">
        <div class="preview-header">
          <div class="preview-event">${this.selectedEvent?.nombre}</div>
          <div class="preview-price">$${this.formData.precio?.toLocaleString()}</div>
        </div>
        <div class="preview-details">
          <span class="preview-type">${this.formData.tipoEntrada}</span>
          <span class="preview-quantity">${this.formData.cantidad} entrada(s)</span>
          ${this.formData.sector ? `<span class="preview-location">${this.formData.sector}</span>` : ''}
        </div>
        ${this.formData.descripcion ? `
        <div class="preview-description">
          ${this.formData.descripcion.substring(0, 100)}${this.formData.descripcion.length > 100 ? '...' : ''}
        </div>
        ` : ''}
        <div class="preview-footer">
          <span class="preview-seller">Por ti</span>
          <span class="preview-contact">${this.getContactMethodName(this.formData.prefiere_contacto)}</span>
        </div>
      </div>
    `;
  }

  updateReviewPricing() {
    const precio = parseFloat(this.formData.precio) || 0;
    const comision = precio * 0.1;
    const ganancia = precio - comision;
    
    const precioElement = document.getElementById('reviewPrecio');
    const comisionElement = document.getElementById('reviewComision');
    const gananciaElement = document.getElementById('reviewGanancia');
    
    if (precioElement) precioElement.textContent = `$${precio.toLocaleString()}`;
    if (comisionElement) comisionElement.textContent = `$${comision.toLocaleString()}`;
    if (gananciaElement) gananciaElement.textContent = `$${ganancia.toLocaleString()}`;
  }

  // ==========================================================================
  // EVENT HANDLERS
  // ==========================================================================

  bindEvents() {
    // Este método se llama una sola vez al inicializar
  }

  bindFormEvents() {
    // Event listeners específicos del formulario actual
    this.bindStepSpecificEvents();
    this.bindImageUpload();
    this.bindPriceSuggestions();
    this.bindCharCounters();
  }

  bindStepSpecificEvents() {
    const currentForm = document.querySelector('.ticket-form form');
    if (!currentForm) return;

    currentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleFormSubmit(e);
    });

    // Validación en tiempo real
    const inputs = currentForm.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.addEventListener('change', () => this.updateFormData());
      input.addEventListener('input', () => this.updateFormData());
      input.addEventListener('blur', () => this.validateField(input));
    });
  }

  bindImageUpload() {
    const imageInput = document.getElementById('ticketImages');
    const uploadArea = document.getElementById('imageUploadArea');
    
    if (!imageInput || !uploadArea) return;

    // Drag & drop
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('drag-over');
      
      const files = Array.from(e.dataTransfer.files);
      this.handleImageFiles(files);
    });

    // File input change
    imageInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      this.handleImageFiles(files);
    });
  }

  bindPriceSuggestions() {
    const precioInput = document.getElementById('precio');
    if (!precioInput) return;

    precioInput.addEventListener('input', async (e) => {
      const precio = parseFloat(e.target.value);
      if (precio > 0) {
        await this.updatePriceSuggestion(precio);
      }
    });
  }

  bindCharCounters() {
    const textareas = document.querySelectorAll('textarea[maxlength]');
    textareas.forEach(textarea => {
      const counterId = textarea.id + 'Counter';
      const counter = document.getElementById(counterId);
      
      if (counter) {
        textarea.addEventListener('input', () => {
          counter.textContent = textarea.value.length;
        });
      }
    });
  }

  updateCharCounters() {
    const textareas = document.querySelectorAll('textarea[maxlength]');
    textareas.forEach(textarea => {
      const counterId = textarea.id + 'Counter';
      const counter = document.getElementById(counterId);
      
      if (counter) {
        counter.textContent = textarea.value.length;
      }
    });
  }

  // ==========================================================================
  // NAVIGATION
  // ==========================================================================

  nextStep() {
    if (this.currentStep < 4) {
      this.currentStep++;
      this.render();
      this.onStepChange(this.currentStep);
      this.saveToStorage();
    }
  }

  prevStep() {
    if (this.currentStep > 2) {
      this.currentStep--;
      this.render();
      this.onStepChange(this.currentStep);
      this.saveToStorage();
    }
  }

  goBack() {
    // Volver al selector de eventos
    this.currentStep = 1;
    this.hide();
    this.onStepChange(1);
    this.saveToStorage();
  }

  // ==========================================================================
  // FORM HANDLING
  // ==========================================================================

  async handleFormSubmit(e) {
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    // Validar formulario
    if (!this.validateCurrentStep(data)) {
      return;
    }
    
    // Actualizar datos del formulario
    Object.assign(this.formData, data);
    this.saveToStorage();
    
    // Avanzar al siguiente paso
    this.nextStep();
  }

  updateFormData() {
    const form = document.querySelector('.ticket-form form');
    if (!form) return;

    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    Object.assign(this.formData, data);
    
    // Guardar en localStorage
    this.saveToStorage();
  }

  validateCurrentStep(data) {
    switch (this.currentStep) {
      case 2:
        return this.validateTicketDetails(data);
      case 3:
        return this.validateContactInfo(data);
      case 4:
        return this.validateTerms();
      default:
        return true;
    }
  }

  validateTicketDetails(data) {
    const errors = [];
    
    if (!data.tipoEntrada) {
      errors.push('Tipo de entrada es requerido');
    }
    
    if (!data.cantidad || data.cantidad < 1) {
      errors.push('Cantidad debe ser al menos 1');
    }
    
    if (!data.precio || data.precio < 100) {
      errors.push('Precio debe ser al menos $100');
    }
    
    if (errors.length > 0) {
      this.showErrors(errors);
      return false;
    }
    
    return true;
  }

  validateContactInfo(data) {
    const hasContact = data.whatsapp_enabled || data.email_enabled || 
                      data.telegram_enabled || data.instagram_enabled;
    
    if (!hasContact) {
      this.showErrors(['Debes seleccionar al menos un método de contacto']);
      return false;
    }
    
    // Validar WhatsApp si está habilitado
    if (data.whatsapp_enabled && !data.whatsapp) {
      this.showErrors(['WhatsApp está seleccionado pero no has ingresado un número']);
      return false;
    }
    
    // Validar otros métodos si están habilitados
    if (data.telegram_enabled && !data.telegram) {
      this.showErrors(['Telegram está seleccionado pero no has ingresado un usuario']);
      return false;
    }
    
    if (data.instagram_enabled && !data.instagram) {
      this.showErrors(['Instagram está seleccionado pero no has ingresado un usuario']);
      return false;
    }
    
    return true;
  }

  validateTerms() {
    const acceptTerms = document.getElementById('accept_terms');
    
    if (!acceptTerms?.checked) {
      this.showErrors(['Debes aceptar los términos y condiciones']);
      return false;
    }
    
    return true;
  }

  validateField(field) {
    // Validación individual de campos
    field.classList.remove('error');
    
    if (field.required && !field.value.trim()) {
      field.classList.add('error');
      return false;
    }
    
    return true;
  }

  // ==========================================================================
  // IMAGE HANDLING
  // ==========================================================================

  handleImageFiles(files) {
    const maxImages = 5;
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (this.imageFiles.length >= maxImages) {
      this.showNotification(`Máximo ${maxImages} imágenes permitidas`, 'error');
      return;
    }
    
    const validFiles = files.filter(file => {
      if (!allowedTypes.includes(file.type)) {
        this.showNotification(`${file.name}: Tipo de archivo no permitido`, 'error');
        return false;
      }
      
      if (file.size > maxSize) {
        this.showNotification(`${file.name}: Archivo muy grande (máx. 5MB)`, 'error');
        return false;
      }
      
      return true;
    });
    
    const availableSlots = maxImages - this.imageFiles.length;
    const filesToAdd = validFiles.slice(0, availableSlots);
    
    if (filesToAdd.length < validFiles.length) {
      this.showNotification(`Solo se agregaron ${filesToAdd.length} imágenes (límite alcanzado)`, 'warning');
    }
    
    this.imageFiles = [...this.imageFiles, ...filesToAdd];
    this.renderImagePreviews();
  }

  renderImagePreviews() {
    const container = document.getElementById('imagePreviewContainer');
    const placeholder = document.getElementById('uploadPlaceholder');
    
    if (!container) return;
    
    // Limpiar URLs anteriores
    const existingPreviews = container.querySelectorAll('.image-preview img');
    existingPreviews.forEach(img => {
      if (img.src.startsWith('blob:')) {
        URL.revokeObjectURL(img.src);
      }
    });
    
    if (this.imageFiles.length > 0) {
      placeholder.classList.add('hidden');
      container.classList.remove('hidden');
      
      container.innerHTML = this.imageFiles.map((file, index) => `
        <div class="image-preview" data-index="${index}">
          <img src="${URL.createObjectURL(file)}" alt="Preview ${index + 1}">
          <button type="button" class="remove-image" onclick="TicketForm.removeImage(${index})">×</button>
          <div class="image-name">${file.name}</div>
        </div>
      `).join('') + (this.imageFiles.length < 5 ? `
        <div class="add-more-images" onclick="document.getElementById('ticketImages').click()">
          <div class="add-icon">+</div>
          <div>Agregar más</div>
        </div>
      ` : '');
    } else {
      placeholder.classList.remove('hidden');
      container.classList.add('hidden');
    }
  }

  removeImage(index) {
    // Limpiar URL del blob
    const file = this.imageFiles[index];
    if (file instanceof File) {
      const imgElement = document.querySelector(`[data-index="${index}"] img`);
      if (imgElement && imgElement.src.startsWith('blob:')) {
        URL.revokeObjectURL(imgElement.src);
      }
    }
    
    this.imageFiles.splice(index, 1);
    this.renderImagePreviews();
  }

  // ==========================================================================
  // PRICE SUGGESTIONS
  // ==========================================================================

  async updatePriceSuggestion(precio) {
    try {
      const response = await fetch(`/api/tickets/price-analysis?eventId=${this.selectedEvent.id}&precio=${precio}`);
      const data = await response.json();
      
      if (data.success) {
        this.renderPriceSuggestion(data.data);
      }
    } catch (error) {
      console.error('Error obteniendo sugerencias de precio:', error);
    }
  }

  renderPriceSuggestion(analysis) {
    const container = document.getElementById('priceSuggestion');
    if (!container) return;
    
    const { promedio, minimo, maximo, percentil } = analysis;
    
    let suggestionClass = 'neutral';
    let suggestionText = '';
    
    if (percentil < 25) {
      suggestionClass = 'low';
      suggestionText = 'Precio muy competitivo - se venderá rápido';
    } else if (percentil > 75) {
      suggestionClass = 'high';
      suggestionText = 'Precio alto - puede tomar más tiempo vender';
    } else {
      suggestionClass = 'good';
      suggestionText = 'Precio en el rango normal del mercado';
    }
    
    container.innerHTML = `
      <div class="price-analysis ${suggestionClass}">
        <div class="analysis-text">${suggestionText}</div>
        <div class="market-range">
          Rango del mercado: $${minimo.toLocaleString()} - $${maximo.toLocaleString()} (promedio: $${promedio.toLocaleString()})
        </div>
      </div>
    `;
  }

  // ==========================================================================
  // SIMILAR TICKETS
  // ==========================================================================

  async loadSimilarTickets() {
    if (!this.selectedEvent) return;
    
    try {
      const response = await fetch(`/api/events/${this.selectedEvent.id}/tickets?limit=3`);
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        this.renderSimilarTickets(data.data);
      }
    } catch (error) {
      console.error('Error cargando entradas similares:', error);
    }
  }

  renderSimilarTickets(tickets) {
    // Mostrar entradas similares para referencia de precios
    const container = document.querySelector('.form-step');
    if (!container || !tickets.length) return;
    
    const similarTicketsHTML = `
      <div class="similar-tickets-section">
        <h4>💡 Entradas similares en venta</h4>
        <div class="similar-tickets-grid">
          ${tickets.map(ticket => `
            <div class="similar-ticket-card">
              <div class="ticket-type">${ticket.tipoEntrada}</div>
              <div class="ticket-price">$${ticket.precio.toLocaleString()}</div>
              <div class="ticket-location">${ticket.sector || 'Sin sector'}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    
    container.insertAdjacentHTML('beforeend', similarTicketsHTML);
  }

  // ==========================================================================
  // PUBLISH TICKET
  // ==========================================================================

  async publishTicket() {
    if (this.isSubmitting) return;
    
    this.isSubmitting = true;
    this.updatePublishButton(true);
    
    try {
      // Preparar datos
      const ticketData = this.prepareTicketData();
      
      // Crear FormData para imágenes
      const formData = new FormData();
      
      // Agregar datos del ticket
      Object.keys(ticketData).forEach(key => {
        if (ticketData[key] !== undefined && ticketData[key] !== null) {
          if (typeof ticketData[key] === 'object') {
            formData.append(key, JSON.stringify(ticketData[key]));
          } else {
            formData.append(key, ticketData[key]);
          }
        }
      });
      
      // Agregar imágenes
      this.imageFiles.forEach((file, index) => {
        formData.append(`images`, file);
      });
      
      // Enviar a la API
      const response = await fetch('/api/tickets/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.showNotification('¡Entrada publicada exitosamente!', 'success');
        this.onTicketCreated(result.data);
      } else {
        throw new Error(result.error || 'Error al publicar entrada');
      }
      
    } catch (error) {
      console.error('Error publicando entrada:', error);
      this.showNotification(error.message, 'error');
    } finally {
      this.isSubmitting = false;
      this.updatePublishButton(false);
    }
  }

  prepareTicketData() {
    return {
      eventoId: this.selectedEvent.id,
      ...this.formData,
      // Procesar checkboxes
      negociable: !!this.formData.negociable,
      acepta_intercambio: !!this.formData.acepta_intercambio,
      // Procesar contacto
      contactoVendedor: {
        whatsapp: this.formData.whatsapp_enabled ? this.formData.whatsapp : null,
        email: this.formData.email_enabled ? this.formData.email_contacto : null,
        telegram: this.formData.telegram_enabled ? this.formData.telegram : null,
        instagram: this.formData.instagram_enabled ? this.formData.instagram : null,
        prefiere_contacto: this.formData.prefiere_contacto,
        horario_contacto: this.formData.horario_contacto
      }
    };
  }

  updatePublishButton(loading) {
    const button = document.getElementById('publishButton');
    const text = button?.querySelector('.btn-text');
    const loader = button?.querySelector('.btn-loading');
    
    if (!button) return;
    
    if (loading) {
      button.disabled = true;
      text?.classList.add('hidden');
      loader?.classList.remove('hidden');
    } else {
      button.disabled = false;
      text?.classList.remove('hidden');
      loader?.classList.add('hidden');
    }
  }

  // ==========================================================================
  // UTILITIES
  // ==========================================================================

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-UY', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getContactMethodName(method) {
    const names = {
      whatsapp: 'WhatsApp',
      email: 'Email',
      telegram: 'Telegram',
      instagram: 'Instagram'
    };
    return names[method] || method;
  }

  getScheduleName(schedule) {
    const names = {
      cualquier_momento: 'Cualquier momento',
      horario_laboral: 'Horario laboral',
      tardes_noches: 'Tardes y noches',
      fines_semana: 'Fines de semana'
    };
    return names[schedule] || schedule;
  }

  getCurrentUser() {
    // Obtener usuario actual del contexto global
    return window.currentUser || {};
  }

  showNotification(message, type = 'info') {
    // Usar el sistema de notificaciones global
    if (window.showNotification) {
      window.showNotification(message, type);
    } else {
      alert(message);
    }
  }

  showErrors(errors) {
    errors.forEach(error => this.showNotification(error, 'error'));
  }

  updateEventInfo() {
    // Actualizar información del evento en el paso actual
    const summaryElements = document.querySelectorAll('.event-summary-card');
    summaryElements.forEach(el => {
      el.outerHTML = this.renderEventSummary();
    });
  }

  // ==========================================================================
  // CALLBACKS
  // ==========================================================================

  onStepChange(step) {
    // Callback para cuando cambia el paso
    console.log('Paso cambiado a:', step);
  }

  onTicketCreated(ticket) {
    console.log('Entrada creada:', ticket);
    
    // Limpiar datos del formulario
    this.clearStorage();
    this.reset();
    
    // Redirigir o mostrar página de confirmación
    if (typeof window.router !== 'undefined') {
      window.router.navigate(`/ticket/${ticket.id}`);
    } else if (typeof window.location !== 'undefined') {
      window.location.href = `/ticket/${ticket.id}`;
    }
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  destroy() {
    // Limpiar event listeners y recursos
    this.imageFiles.forEach((file, index) => {
      if (file instanceof File) {
        const imgElement = document.querySelector(`[data-index="${index}"] img`);
        if (imgElement && imgElement.src.startsWith('blob:')) {
          URL.revokeObjectURL(imgElement.src);
        }
      }
    });
    
    this.imageFiles = [];
    this.clearStorage();
    console.log('🧹 TicketForm destroyed');
  }

  // ==========================================================================
  // MÉTODOS ESTÁTICOS PARA EL HTML
  // ==========================================================================

  static goBack() {
    window.TicketForm.goBack();
  }

  static prevStep() {
    window.TicketForm.prevStep();
  }

  static nextStep() {
    window.TicketForm.nextStep();
  }

  static removeImage(index) {
    window.TicketForm.removeImage(index);
  }

  static publishTicket() {
    window.TicketForm.publishTicket();
  }
}

// ==========================================================================
// INSTANCIA GLOBAL
// ==========================================================================

window.TicketForm = new TicketForm();