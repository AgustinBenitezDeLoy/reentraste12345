/**
 * VENDER ENTRADA PAGE - REENTRASTE
 * =================================
 * Script principal para la página de venta de entradas
 * 
 * Archivo: /js/pages/vender-entrada.js
 */

class VenderEntradaPage {
  constructor() {
    this.currentStep = 1;
    this.selectedEvent = null;
    this.ticketData = null;
    this.isLoading = false;
    
    this.init();
  }

  // ==========================================================================
  // INICIALIZACIÓN
  // ==========================================================================

  init() {
    this.checkAuthentication();
    this.loadPageStats();
    this.setupEventListeners();
    this.initializeComponents();
  }

  async checkAuthentication() {
    const token = localStorage.getItem('token');
    
    if (!token || token === 'null' || token === 'undefined') {
      // Mostrar modal de login o redirigir
      this.showAuthRequired();
      return;
    }

    try {
      // Verificar si el token es válido
      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Token inválido');
      }

      const userData = await response.json();
      this.currentUser = userData.data;
      this.updateUserInterface();
      
    } catch (error) {
      console.error('❌ Error verificando autenticación:', error);
      localStorage.removeItem('token');
      this.showAuthRequired();
    }
  }

  updateUserInterface() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const userMenu = document.getElementById('userMenu');
    const userAvatar = document.getElementById('userAvatar');

    if (this.currentUser) {
      // Ocultar botones de login/registro
      loginBtn.classList.add('hidden');
      registerBtn.classList.add('hidden');
      
      // Mostrar menú de usuario
      userMenu.classList.remove('hidden');
      
      // Actualizar avatar
      if (this.currentUser.avatar) {
        userAvatar.src = this.currentUser.avatar;
      } else {
        userAvatar.src = `/api/avatars/${this.currentUser.nombre.charAt(0).toUpperCase()}`;
      }
    }
  }

  showAuthRequired() {
    const overlay = document.createElement('div');
    overlay.className = 'auth-required-overlay';
    overlay.innerHTML = `
      <div class="auth-required-modal">
        <div class="modal-header">
          <h3>🔐 Autenticación requerida</h3>
        </div>
        <div class="modal-content">
          <p>Para vender entradas necesitas tener una cuenta en Reentraste.</p>
          <p>Es rápido, fácil y completamente gratis.</p>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" onclick="window.location.href='/login'">
            Iniciar sesión
          </button>
          <button class="btn-primary" onclick="window.location.href='/register'">
            Crear cuenta gratis
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
  }

  // ==========================================================================
  // ESTADÍSTICAS DE LA PÁGINA
  // ==========================================================================

  async loadPageStats() {
    try {
      const response = await fetch('/api/stats/homepage');
      const data = await response.json();
      
      if (data.success) {
        this.updateStatsDisplay(data.data);
      }
    } catch (error) {
      console.error('❌ Error cargando estadísticas:', error);
      // Usar valores por defecto
      this.updateStatsDisplay({
        totalEvents: 1247,
        totalTickets: 8945,
        satisfaction: 98
      });
    }
  }

  updateStatsDisplay(stats) {
    const totalEventsEl = document.getElementById('totalEvents');
    const totalTicketsEl = document.getElementById('totalTickets');
    
    if (totalEventsEl) {
      this.animateNumber(totalEventsEl, stats.totalEvents);
    }
    
    if (totalTicketsEl) {
      this.animateNumber(totalTicketsEl, stats.totalTickets);
    }
  }

  animateNumber(element, targetValue, duration = 2000) {
    const startValue = 0;
    const increment = targetValue / (duration / 16);
    let currentValue = startValue;
    
    const timer = setInterval(() => {
      currentValue += increment;
      
      if (currentValue >= targetValue) {
        element.textContent = targetValue.toLocaleString();
        clearInterval(timer);
      } else {
        element.textContent = Math.floor(currentValue).toLocaleString();
      }
    }, 16);
  }

  // ==========================================================================
  // EVENT LISTENERS
  // ==========================================================================

  setupEventListeners() {
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleLogout();
      });
    }

    // Progress steps click
    document.querySelectorAll('.step').forEach(step => {
      step.addEventListener('click', (e) => {
        const stepNumber = parseInt(e.currentTarget.dataset.step);
        if (stepNumber <= this.getMaxAllowedStep()) {
          this.goToStep(stepNumber);
        }
      });
    });

    // Scroll animations
    this.setupScrollAnimations();
  }

  setupScrollAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    // Observar elementos animables
    document.querySelectorAll('.tips-card, .popular-event-card, .stat-item')
      .forEach(el => observer.observe(el));
  }

  handleLogout() {
    localStorage.removeItem('token');
    sessionStorage.clear();
    
    // Mostrar mensaje de confirmación
    this.showNotification('Sesión cerrada correctamente', 'success');
    
    // Redirigir después de un momento
    setTimeout(() => {
      window.location.href = '/';
    }, 1500);
  }

  // ==========================================================================
  // GESTIÓN DE PASOS
  // ==========================================================================

  goToStep(stepNumber) {
    if (stepNumber < 1 || stepNumber > 4) return;
    
    // Actualizar paso actual
    this.currentStep = stepNumber;
    
    // Actualizar UI de pasos
    this.updateStepsUI();
    
    // Mostrar/ocultar secciones
    this.updateSectionsVisibility();
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  updateStepsUI() {
    document.querySelectorAll('.step').forEach((step, index) => {
      const stepNumber = index + 1;
      
      if (stepNumber <= this.currentStep) {
        step.classList.add('active');
      } else {
        step.classList.remove('active');
      }
      
      if (stepNumber < this.currentStep) {
        step.classList.add('completed');
      } else {
        step.classList.remove('completed');
      }
    });
  }

  updateSectionsVisibility() {
    // Ocultar todas las secciones
    document.getElementById('eventSelectorContainer').classList.add('hidden');
    document.getElementById('ticketFormContainer').classList.add('hidden');
    
    // Mostrar sección correspondiente
    switch (this.currentStep) {
      case 1:
        document.getElementById('eventSelectorContainer').classList.remove('hidden');
        break;
      case 2:
      case 3:
      case 4:
        document.getElementById('ticketFormContainer').classList.remove('hidden');
        break;
    }
  }

  getMaxAllowedStep() {
    if (!this.selectedEvent) return 1;
    if (!this.ticketData) return 2;
    return 4;
  }

  // ==========================================================================
  // INICIALIZACIÓN DE COMPONENTES
  // ==========================================================================

  initializeComponents() {
    // Inicializar EventSelector
    if (window.EventSelector) {
      window.EventSelector.render('eventSelectorContainer');
      
      // Override del callback de selección
      const originalCallback = window.EventSelector.onEventSelected;
      window.EventSelector.onEventSelected = (event) => {
        this.handleEventSelected(event);
        if (originalCallback) originalCallback(event);
      };
    }

    // Inicializar TicketForm cuando se necesite
    this.initializeTicketFormWhenNeeded();
  }

  initializeTicketFormWhenNeeded() {
    // Verificar si TicketForm existe y inicializarlo
    if (window.TicketForm && this.selectedEvent) {
      window.TicketForm.setEvent(this.selectedEvent);
      window.TicketForm.render('ticketFormContainer');
      
      // Override callbacks
      window.TicketForm.onStepChange = (step) => {
        this.goToStep(step + 1); // Ajustar numeración
      };
      
      window.TicketForm.onTicketCreated = (ticket) => {
        this.handleTicketCreated(ticket);
      };
    }
  }

  // ==========================================================================
  // HANDLERS DE EVENTOS
  // ==========================================================================

  handleEventSelected(event) {
    this.selectedEvent = event;
    
    this.showNotification(
      `Evento seleccionado: ${event.nombre}`, 
      'success'
    );
    
    // Avanzar al siguiente paso
    this.goToStep(2);
    
    // Inicializar formulario de ticket
    this.initializeTicketFormWhenNeeded();
    
    // Analytics
    this.trackEvent('event_selected', {
      eventId: event.id,
      eventName: event.nombre,
      eventDate: event.fecha
    });
  }

  handleTicketCreated(ticket) {
    this.ticketData = ticket;
    
    this.showNotification(
      '¡Entrada publicada exitosamente!', 
      'success'
    );
    
    // Analytics
    this.trackEvent('ticket_created', {
      ticketId: ticket.id,
      eventId: this.selectedEvent.id,
      price: ticket.precio,
      type: ticket.tipoEntrada
    });
    
    // Redirigir a la página de éxito o al perfil
    setTimeout(() => {
      window.location.href = `/mis-entradas?new=${ticket.id}`;
    }, 2000);
  }

  // ==========================================================================
  // UTILIDADES
  // ==========================================================================

  showNotification(message, type = 'info', duration = 5000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">${this.getToastIcon(type)}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;
    
    container.appendChild(toast);
    
    // Auto-remove
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, duration);
    
    // Animate in
    setTimeout(() => {
      toast.classList.add('toast-show');
    }, 100);
  }

  getToastIcon(type) {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type] || icons.info;
  }

  showLoading(message = 'Cargando...') {
    const overlay = document.getElementById('loadingOverlay');
    const messageEl = document.getElementById('loadingMessage');
    
    if (overlay && messageEl) {
      messageEl.textContent = message;
      overlay.classList.remove('hidden');
    }
    
    this.isLoading = true;
  }

  hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.classList.add('hidden');
    }
    
    this.isLoading = false;
  }

  trackEvent(eventName, properties = {}) {
    // Analytics tracking
    try {
      if (window.gtag) {
        window.gtag('event', eventName, {
          custom_parameter: properties,
          user_id: this.currentUser?.id
        });
      }
      
      if (window.analytics) {
        window.analytics.track(eventName, properties);
      }
      
      console.log(`📊 Event tracked: ${eventName}`, properties);
    } catch (error) {
      console.error('❌ Error tracking event:', error);
    }
  }

  // ==========================================================================
  // API HELPERS
  // ==========================================================================

  async apiCall(endpoint, options = {}) {
    try {
      const token = localStorage.getItem('token');
      const defaultOptions = {
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      };
      
      const response = await fetch(endpoint, { ...defaultOptions, ...options });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`❌ API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  destroy() {
    // Limpiar event listeners
    // Limpiar timers
    // Limpiar observers
    console.log('🧹 VenderEntradaPage destroyed');
  }
}

// ==========================================================================
// ESTILOS ADICIONALES PARA TOAST Y MODALES
// ==========================================================================

const additionalStyles = `
<style>
  .auth-required-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(4px);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }

  .auth-required-modal {
    background: white;
    border-radius: 1rem;
    padding: 2rem;
    max-width: 400px;
    width: 100%;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  .auth-required-modal .modal-header h3 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: var(--gray-900);
  }

  .auth-required-modal .modal-content {
    margin-bottom: 2rem;
    color: var(--gray-600);
    line-height: 1.6;
  }

  .auth-required-modal .modal-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
  }

  .toast-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    max-width: 400px;
  }

  .toast {
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    margin-bottom: 0.5rem;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    border-left: 4px solid var(--gray-300);
  }

  .toast.toast-show {
    transform: translateX(0);
  }

  .toast-success {
    border-left-color: var(--success-color);
  }

  .toast-error {
    border-left-color: var(--error-color);
  }

  .toast-warning {
    border-left-color: var(--warning-color);
  }

  .toast-info {
    border-left-color: var(--info-color);
  }

  .toast-content {
    display: flex;
    align-items: center;
    padding: 1rem;
    gap: 0.75rem;
  }

  .toast-icon {
    font-size: 1.25rem;
    flex-shrink: 0;
  }

  .toast-message {
    flex: 1;
    color: var(--gray-700);
    font-weight: 500;
  }

  .toast-close {
    background: none;
    border: none;
    font-size: 1.25rem;
    color: var(--gray-400);
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.3s ease;
  }

  .toast-close:hover {
    background: var(--gray-100);
    color: var(--gray-600);
  }

  .step.completed .step-number {
    background: var(--success-color);
    color: white;
  }

  .step.completed .step-number::after {
    content: '✓';
    position: absolute;
    font-size: 0.75rem;
  }

  .animate-in {
    animation: slideInUp 0.6s ease forwards;
  }

  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .hidden {
    display: none !important;
  }

  @media (max-width: 480px) {
    .toast-container {
      left: 20px;
      right: 20px;
      max-width: none;
    }
    
    .auth-required-modal .modal-actions {
      flex-direction: column;
    }
  }
</style>
`;

// Agregar estilos al head
document.head.insertAdjacentHTML('beforeend', additionalStyles);

// ==========================================================================
// INICIALIZACIÓN AUTOMÁTICA
// ==========================================================================

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.VenderEntradaPageInstance = new VenderEntradaPage();
});

// Cleanup al salir de la página
window.addEventListener('beforeunload', () => {
  if (window.VenderEntradaPageInstance) {
    window.VenderEntradaPageInstance.destroy();
  }
});