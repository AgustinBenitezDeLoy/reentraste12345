// kyc-guard.js - Incluir en páginas que requieren KYC aprobado
// Usar: <script src="kyc-guard.js"></script> en el <head> de páginas protegidas

(async function kycGuard() {
  // Verificar si hay token
  const token = localStorage.getItem('token');
  if (!token || token === 'null' || token === 'undefined') {
    window.location.href = 'login.html';
    return;
  }

  try {
    // Verificar estado de KYC
    const response = await fetch('/api/kyc/estado', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // Si el token es inválido, redirigir al login
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem('token');
      window.location.href = 'login.html';
      return;
    }

    const contentType = response.headers.get('content-type');
    if (!response.ok || !contentType || !contentType.includes('application/json')) {
      // Error del servidor, permitir continuar pero mostrar aviso
      console.warn('⚠️ No se pudo verificar el estado de KYC');
      return;
    }

    const data = await response.json();
    
    if (data.success) {
      const kycStatus = data.data.status;
      
      // Si no está verificado, redirigir a KYC
      if (!kycStatus || ['pendiente', 'iniciado', 'en_proceso', 'rechazado'].includes(kycStatus)) {
        window.location.href = 'kyc-status.html';
        return;
      }
      
      // Si está aprobado, continuar normalmente
      if (kycStatus === 'aprobado') {
        console.log('✅ KYC verificado');
        return;
      }
    }
    
    // En caso de respuesta inesperada, redirigir a KYC por seguridad
    window.location.href = 'kyc-status.html';
    
  } catch (error) {
    console.error('❌ Error verificando KYC:', error);
    // En caso de error de red, permitir continuar
    // pero podrías cambiar esto para redirigir a kyc-status.html
  }
})();

// Función auxiliar para verificar KYC en cualquier momento
window.checkKYCStatus = async function() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  try {
    const response = await fetch('/api/kyc/estado', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.success ? data.data.status : null;
  } catch {
    return null;
  }
};