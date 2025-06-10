/**
 * NOTIFICATIONS SYSTEM - REENTRASTE
 * ==================================
 * Sistema de notificaciones toast y push
 * 
 * Archivo: /js/utils/notifications.js
 */

class NotificationSystem {
  constructor() {
    this.container = null;
    this.notifications = new Map();
    this.maxNotifications = 5;
    this.defaultDuration = 5000;
    this.animationDuration = 300;
    
    this.init();
  }

  // ==========================================================================
  // INICIALIZACIÓN
  // ==========================================================================

  init() {
    this.createContainer();
    this.requestPermission();
    this.setupServiceWorker();
  }

  createContainer() {
    // Crear contenedor para las notificaciones toast
    this.container = document.createElement('div');
    this.container.className = 'notifications-container';
    this.container.innerHTML = `
      <style>
        .notifications-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 10000;
          pointer-events: none;
        }
        
        .notification-toast {
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
          border: 1px solid rgba(0, 0, 0, 0.08);
          padding: 16px 20px;
          margin-bottom: 12px;
          min-width: 300px;
          max-width: 400px;
          pointer-events: auto;
          transform: translateX(420px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          opacity: 0;
        }
        
        .notification-toast.show {
          transform: translateX(0);
          opacity: 1;
        }
        
        .notification-toast.success {
          border-left: 4px solid #10b981;
        }
        
        .notification-toast.error {
          border-left: 4px solid #ef4444;
        }
        
        .notification-toast.warning {
          border-left: 4px solid #f59e0b;
        }
        
        .notification-toast.info {
          border-left: 4px solid #3b82f6;
        }
        
        .notification-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        
        .notification-icon {
          font-size: 20px;
          margin-right: 12px;
        }
        
        .notification-title {
          font-weight: 600;
          font-size: 14px;
          color: #1f2937;
          flex: 1;
        }
        
        .notification-close {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #6b7280;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
        }
        
        .notification-close:hover {
          background: rgba(0, 0, 0, 0.05);
        }
        
        .notification-message {
          color: #4b5563;
          font-size: 13px;
          line-height: 1.4;
        }
        
        .notification-progress {
          height: 2px;
          background: rgba(0, 0, 0, 0.1);
          border-radius: 1px;
          margin-top: 12px;
          overflow: hidden;
        }
        
        .notification-progress-bar {
          height: 100%;
          background: currentColor;
          transition: width linear;
        }
        
        .notification-actions {
          margin-top: 12px;
          display: flex;
          gap: 8px;
        }
        
        .notification-action {
          background: rgba(0, 0, 0, 0.05);
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          transition: background 0.2s;
        }
        
        .notification-action:hover {
          background: rgba(0, 0, 0, 0.1);
        }
        
        .notification-action.primary {
          background: #3b82f6;
          color: white;
        }
        
        .notification-action.primary:hover {
          background: #2563eb;
        }
      </style>
    `;
    
    document.body.appendChild(this.container);
  }

  // ==========================================================================
  // MÉTODOS PRINCIPALES
  // ==========================================================================

  show(message, type = 'info', options = {}) {
    const config = {
      title: null,
      duration: this.defaultDuration,
      persistent: false,
      actions: [],
      icon: null,
      onClick: null,
      onClose: null,
      ...options
    };

    // Generar ID único
    const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Crear elemento de notificación
    const notification = this.createNotificationElement(id, message, type, config);
    
    // Agregar al contenedor
    this.container.appendChild(notification);
    
    // Guardar referencia
    this.notifications.set(id, {
      element: notification,
      type,
      config,
      startTime: Date.now()
    });
    
    // Animar entrada
    requestAnimationFrame(() => {
      notification.classList.add('show');
    });
    
    // Auto-cerrar si no es persistente
    if (!config.persistent && config.duration > 0) {
      setTimeout(() => this.hide(id), config.duration);
    }
    
    // Limpiar notificaciones viejas si hay muchas
    this.cleanupOldNotifications();
    
    return id;
  }

  hide(id) {
    const notification = this.notifications.get(id);
    if (!notification) return;
    
    const element = notification.element;
    
    // Animar salida
    element.style.transform = 'translateX(420px)';
    element.style.opacity = '0';
    
    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      this.notifications.delete(id);
      
      // Callback onClose
      if (notification.config.onClose) {
        notification.config.onClose();
      }
    }, this.animationDuration);
  }

  createNotificationElement(id, message, type, config) {
    const div = document.createElement('div');
    div.className = `notification-toast ${type}`;
    div.setAttribute('data-id', id);
    
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    
    const titles = {
      success: 'Éxito',
      error: 'Error',
      warning: 'Advertencia',
      info: 'Información'
    };
    
    const icon = config.icon || icons[type];
    const title = config.title || titles[type];
    
    div.innerHTML = `
      <div class="notification-header">
        <div style="display: flex; align-items: center;">
          ${icon ? `<span class="notification-icon">${icon}</span>` : ''}
          <span class="notification-title">${title}</span>
        </div>
        <button class="notification-close" onclick="notifications.hide('${id}')">&times;</button>
      </div>
      <div class="notification-message">${message}</div>
      ${config.actions.length > 0 ? this.createActionsHTML(id, config.actions) : ''}
      ${!config.persistent && config.duration > 0 ? this.createProgressHTML(config.duration) : ''}
    `;
    
    // Event listeners
    if (config.onClick) {
      div.addEventListener('click', config.onClick);
      div.style.cursor = 'pointer';
    }
    
    return div;
  }

  createActionsHTML(id, actions) {
    return `
      <div class="notification-actions">
        ${actions.map(action => `
          <button class="notification-action ${action.primary ? 'primary' : ''}" 
                  onclick="notifications.handleAction('${id}', '${action.id}')">
            ${action.label}
          </button>
        `).join('')}
      </div>
    `;
  }

  createProgressHTML(duration) {
    return `
      <div class="notification-progress">
        <div class="notification-progress-bar" style="width: 0%; transition-duration: ${duration}ms;"></div>
      </div>
    `;
  }

  handleAction(notificationId, actionId) {
    const notification = this.notifications.get(notificationId);
    if (!notification) return;
    
    const action = notification.config.actions.find(a => a.id === actionId);
    if (action?.onClick) {
      action.onClick();
    }
    
    // Cerrar notificación después de la acción
    this.hide(notificationId);
  }

  cleanupOldNotifications() {
    if (this.notifications.size <= this.maxNotifications) return;
    
    // Obtener notificaciones ordenadas por tiempo
    const sorted = Array.from(this.notifications.entries())
      .sort((a, b) => a[1].startTime - b[1].startTime);
    
    // Cerrar las más viejas
    const toRemove = sorted.slice(0, sorted.length - this.maxNotifications);
    toRemove.forEach(([id]) => this.hide(id));
  }

  // ==========================================================================
  // MÉTODOS DE CONVENIENCIA
  // ==========================================================================

  success(message, options = {}) {
    return this.show(message, 'success', options);
  }

  error(message, options = {}) {
    return this.show(message, 'error', {
      duration: 8000, // Errores duran más
      ...options
    });
  }

  warning(message, options = {}) {
    return this.show(message, 'warning', options);
  }

  info(message, options = {}) {
    return this.show(message, 'info', options);
  }

  // Notificación de confirmación con acciones
  confirm(message, onConfirm, onCancel = null) {
    return this.show(message, 'warning', {
      title: 'Confirmación',
      persistent: true,
      actions: [
        {
          id: 'confirm',
          label: 'Confirmar',
          primary: true,
          onClick: onConfirm
        },
        {
          id: 'cancel',
          label: 'Cancelar',
          onClick: onCancel || (() => {})
        }
      ]
    });
  }

  // ==========================================================================
  // PUSH NOTIFICATIONS
  // ==========================================================================

  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('Este navegador no soporta notificaciones');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  async showPushNotification(title, options = {}) {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) return;

    const notification = new Notification(title, {
      icon: '/images/logo-192.png',
      badge: '/images/badge-72.png',
      tag: 'reentraste',
      renotify: true,
      ...options
    });

    notification.onclick = options.onClick || function() {
      window.focus();
      this.close();
    };

    return notification;
  }

  // ==========================================================================
  // SERVICE WORKER
  // ==========================================================================

  async setupServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registrado:', registration);
      
      // Suscribirse a push notifications si es necesario
      this.setupPushSubscription(registration);
    } catch (error) {
      console.error('Error registrando Service Worker:', error);
    }
  }

  async setupPushSubscription(registration) {
    try {
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(process.env.VAPID_PUBLIC_KEY || '')
      });

      // Enviar suscripción al servidor
      if (window.api) {
        await window.api.post('/notifications/subscribe', {
          subscription: subscription.toJSON()
        });
      }
    } catch (error) {
      console.error('Error configurando push notifications:', error);
    }
  }

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // ==========================================================================
  // UTILIDADES
  // ==========================================================================

  clear() {
    this.notifications.forEach((_, id) => this.hide(id));
  }

  getActiveNotifications() {
    return Array.from(this.notifications.keys());
  }

  // Mostrar notificación de estado de conexión
  showConnectionStatus(online) {
    if (online) {
      this.success('Conexión restaurada', {
        duration: 3000,
        icon: '🌐'
      });
    } else {
      this.warning('Sin conexión a internet', {
        persistent: true,
        icon: '📶'
      });
    }
  }

  // Notificación de nueva entrada encontrada
  showNewTicketFound(ticket) {
    this.info(`Nueva entrada: ${ticket.evento}`, {
      duration: 8000,
      actions: [
        {
          id: 'view',
          label: 'Ver entrada',
          primary: true,
          onClick: () => {
            if (window.router) {
              window.router.navigate(`/ticket/${ticket.id}`);
            }
          }
        }
      ]
    });
  }

  // Notificación de mensaje recibido
  showNewMessage(message) {
    this.info(`Nuevo mensaje de ${message.sender}`, {
      duration: 6000,
      actions: [
        {
          id: 'reply',
          label: 'Responder',
          primary: true,
          onClick: () => {
            if (window.router) {
              window.router.navigate(`/messages/${message.conversationId}`);
            }
          }
        }
      ]
    });
  }
}

// ==========================================================================
// INSTANCIA GLOBAL
// ==========================================================================

const notifications = new NotificationSystem();

// Hacer disponible globalmente
window.notifications = notifications;
window.showNotification = (message, type, options) => notifications.show(message, type, options);

// Para módulos ES6
export default notifications;