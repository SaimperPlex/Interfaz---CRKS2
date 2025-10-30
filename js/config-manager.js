/* ============================================
   CONFIG MANAGER
   Maneja la configuración del evento
   Guarda en localStorage
============================================ */

class ConfigManager {
    constructor() {
        this.storageKey = 'crk2_event_config';
        this.configuredKey = 'crk2_event_configured';
        this.config = this.loadConfig();
    }

    // Cargar configuración desde localStorage
    loadConfig() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Asegurar que todos los campos existan
                return {
                    welcomeBackground: parsed.welcomeBackground || null,
                    eventLogo: parsed.eventLogo || null,
                    products: Array.isArray(parsed.products) ? parsed.products : [],
                    customImages: Array.isArray(parsed.customImages) ? parsed.customImages : [], // ✅ AGREGADO
                    cliparts: Array.isArray(parsed.cliparts) ? parsed.cliparts : [],
                    configured: parsed.configured || false,
                    lastUpdate: parsed.lastUpdate || null
                };
            }
        } catch (error) {
            console.error('Error cargando configuración:', error);
        }
        
        // Configuración por defecto
        return {
            welcomeBackground: null,
            eventLogo: null,
            products: [],
            customImages: [], // ✅ AGREGADO
            cliparts: [],
            configured: false,
            lastUpdate: null
        };
    }

    // Guardar configuración en localStorage
    saveConfig() {
        try {
            this.config.lastUpdate = new Date().toISOString();
            localStorage.setItem(this.storageKey, JSON.stringify(this.config));
            return true;
        } catch (error) {
            console.error('❌ Error guardando:', error.message);
            if (error.name === 'QuotaExceededError') {
                alert('Error: Las imágenes son muy grandes. Por favor usa imágenes más pequeñas.');
            }
            return false;
        }
    }

    // Establecer fondo de bienvenida
    setWelcomeBackground(imageDataUrl) {
        this.config.welcomeBackground = imageDataUrl;
        return this.saveConfig();
    }

    // Establecer logo del evento
    setEventLogo(imageDataUrl) {
        this.config.eventLogo = imageDataUrl;
        return this.saveConfig();
    }

    // Agregar producto
    addProduct(imageDataUrl, name = 'Producto') {
        const product = {
            id: Date.now() + Math.random(),
            name: name,
            image: imageDataUrl
        };
        this.config.products.push(product);
        return this.saveConfig();
    }

    // Eliminar producto
    removeProduct(productId) {
        this.config.products = this.config.products.filter(p => p.id !== productId);
        return this.saveConfig();
    }

    // ✅ AGREGAR IMAGEN PERSONALIZADA
    addCustomImage(imageDataUrl, name = 'Imagen') {
        const customImage = {
            id: Date.now() + Math.random(),
            name: name,
            image: imageDataUrl
        };
        this.config.customImages.push(customImage);
        return this.saveConfig();
    }

    // ✅ ELIMINAR IMAGEN PERSONALIZADA
    removeCustomImage(imageId) {
        this.config.customImages = this.config.customImages.filter(img => img.id !== imageId);
        return this.saveConfig();
    }

    // Agregar clipart
    addClipart(imageDataUrl, name = 'Clipart') {
        const clipart = {
            id: Date.now() + Math.random(),
            name: name,
            image: imageDataUrl
        };
        this.config.cliparts.push(clipart);
        return this.saveConfig();
    }

    // Eliminar clipart
    removeClipart(clipartId) {
        this.config.cliparts = this.config.cliparts.filter(c => c.id !== clipartId);
        return this.saveConfig();
    }

    // Marcar como configurado
    markAsConfigured() {
        this.config.configured = true;
        localStorage.setItem(this.configuredKey, 'true');
        return this.saveConfig();
    }

    // Verificar si está configurado
    isConfigured() {
        // ✅ Recargar config fresca para evitar desincronización
        const freshConfig = this.loadConfig();
        const configuredFlag = localStorage.getItem(this.configuredKey) === 'true';
        const hasBackground = freshConfig.welcomeBackground !== null && 
                            freshConfig.welcomeBackground !== undefined && 
                            freshConfig.welcomeBackground.length > 0;
        const hasProducts = Array.isArray(freshConfig.products) && freshConfig.products.length > 0;
        
        return (configuredFlag || freshConfig.configured) && hasBackground && hasProducts;
    }

    // ✅ Obtener configuración actual (SIEMPRE RECARGA DESDE LOCALSTORAGE)
    getConfig() {
        this.config = this.loadConfig(); // ✅ Sincronizar antes de devolver
        return this.config;
    }

    // Obtener fondo de bienvenida
    getWelcomeBackground() {
        return this.config.welcomeBackground;
    }

    // Obtener logo
    getEventLogo() {
        return this.config.eventLogo;
    }

    // Obtener productos
    getProducts() {
        return [...this.config.products];
    }

    // ✅ OBTENER IMÁGENES PERSONALIZADAS
    getCustomImages() {
        return [...this.config.customImages];
    }

    // Obtener cliparts
    getCliparts() {
        return [...this.config.cliparts];
    }

    // Resetear configuración
    reset() {
        this.config = {
            welcomeBackground: null,
            eventLogo: null,
            products: [],
            customImages: [], // ✅ AGREGADO
            cliparts: [],
            configured: false,
            lastUpdate: null
        };
        localStorage.removeItem(this.configuredKey);
        localStorage.removeItem(this.storageKey);
        return this.saveConfig();
    }

    // Exportar configuración (para backup)
    exportConfig() {
        return JSON.stringify(this.config, null, 2);
    }

    // Importar configuración (desde backup)
    importConfig(jsonString) {
        try {
            const imported = JSON.parse(jsonString);
            this.config = imported;
            return this.saveConfig();
        } catch (error) {
            console.error('Error importando configuración:', error);
            return false;
        }
    }
}

// Instancia global
const configManager = new ConfigManager();