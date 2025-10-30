/* ============================================
   SERVICE WORKER REGISTRATION
   Registro del Service Worker
============================================ */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('js/service-worker.js')
      .then((registration) => {
        console.log('✅ Service Worker registrado:', registration.scope);
        
        // Verificar actualizaciones
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('🔄 Nueva versión disponible');
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              // Mostrar notificación de actualización
              if (confirm('Nueva versión disponible. ¿Recargar la aplicación?')) {
                window.location.reload();
              }
            }
          });
        });
      })
      .catch((error) => {
        console.log('❌ Error al registrar Service Worker:', error);
      });
  });

  // Detectar cuando la app está online/offline
  window.addEventListener('online', () => {
    console.log('🌐 Conexión restaurada');
    document.body.classList.remove('offline');
  });

  window.addEventListener('offline', () => {
    console.log('📴 Sin conexión - Modo offline');
    document.body.classList.add('offline');
  });
}