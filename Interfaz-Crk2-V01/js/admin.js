/* ============================================
   CONFIG MANAGER + ADMIN - TODO EN UNO
============================================ */

// CONFIG MANAGER
class ConfigManager {
    constructor() {
        this.storageKey = 'crk2_event_config';
        this.configuredKey = 'crk2_event_configured';
        this.config = this.loadConfig();
    }

    loadConfig() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                return {
                    welcomeBackground: parsed.welcomeBackground || null,
                    eventLogo: parsed.eventLogo || null,
                    products: Array.isArray(parsed.products) ? parsed.products : [],
                    customImages: Array.isArray(parsed.customImages) ? parsed.customImages : [],
                    cliparts: Array.isArray(parsed.cliparts) ? parsed.cliparts : [],
                    configured: parsed.configured || false,
                    lastUpdate: parsed.lastUpdate || null
                };
            }
        } catch (error) {
            console.error('Error cargando configuración:', error);
        }
        
        return {
            welcomeBackground: null,
            eventLogo: null,
            products: [],
            customImages: [],
            cliparts: [],
            configured: false,
            lastUpdate: null
        };
    }

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

    setWelcomeBackground(imageDataUrl) {
        this.config.welcomeBackground = imageDataUrl;
        return this.saveConfig();
    }

    setEventLogo(imageDataUrl) {
        this.config.eventLogo = imageDataUrl;
        return this.saveConfig();
    }

    addProduct(imageDataUrl, name = 'Producto') {
        const product = {
            id: Date.now() + Math.random(),
            name: name,
            image: imageDataUrl
        };
        this.config.products.push(product);
        return this.saveConfig();
    }

    removeProduct(productId) {
        this.config.products = this.config.products.filter(p => p.id !== productId);
        return this.saveConfig();
    }
    addCustomImage(imageDataUrl, name = 'Imagen') {
    const customImage = {
        id: Date.now() + Math.random(),
        name: name,
        image: imageDataUrl
    };
    this.config.customImages.push(customImage);
    return this.saveConfig();
}

    removeCustomImage(imageId) {
    this.config.customImages = this.config.customImages.filter(img => img.id !== imageId);
    return this.saveConfig();
    }   

    addClipart(imageDataUrl, name = 'Clipart') {
        const clipart = {
            id: Date.now() + Math.random(),
            name: name,
            image: imageDataUrl
        };
        this.config.cliparts.push(clipart);
        return this.saveConfig();
    }

    removeClipart(clipartId) {
        this.config.cliparts = this.config.cliparts.filter(c => c.id !== clipartId);
        return this.saveConfig();
    }

    markAsConfigured() {
        this.config.configured = true;
        localStorage.setItem(this.configuredKey, 'true');
        return this.saveConfig();
    }

    isConfigured() {
        const freshConfig = this.loadConfig();
        const configuredFlag = localStorage.getItem(this.configuredKey) === 'true';
        const hasBackground = freshConfig.welcomeBackground !== null && 
                            freshConfig.welcomeBackground !== undefined && 
                            freshConfig.welcomeBackground.length > 0;
        const hasProducts = Array.isArray(freshConfig.products) && freshConfig.products.length > 0;
        
        return (configuredFlag || freshConfig.configured) && hasBackground && hasProducts;
    }

    getConfig() {
        return this.loadConfig();
    }

    reset() {
        this.config = {
            welcomeBackground: null,
            eventLogo: null,
            products: [],
            customImages: [],
            cliparts: [],
            configured: false,
            lastUpdate: null
        };
        localStorage.removeItem(this.configuredKey);
        localStorage.removeItem(this.storageKey);
        return this.saveConfig();
    }
}

// Instancia global
const configManager = new ConfigManager();

// ADMIN PANEL
class AdminPanel {
    constructor() {
        this.elements = {};
        this.init();
    }

    init() {
        this.elements = {
            backgroundInput: document.getElementById('background-input'),
            logoInput: document.getElementById('logo-input'),
            productsInput: document.getElementById('products-input'),
            customImagesInput: document.getElementById('custom-images-input'),
            clipartsInput: document.getElementById('cliparts-input'),
            bgUploadZone: document.getElementById('bg-upload-zone'),
            logoUploadZone: document.getElementById('logo-upload-zone'),
            bgStatus: document.getElementById('bg-status'),
            logoStatus: document.getElementById('logo-status'),
            bgPreview: document.getElementById('bg-preview'),
            logoPreview: document.getElementById('logo-preview'),
            productsList: document.getElementById('products-list'),
            customImagesList: document.getElementById('custom-images-list'),
            clipartsList: document.getElementById('cliparts-list'),
            previewBtn: document.getElementById('preview-btn'),
            saveBtn: document.getElementById('save-config-btn'),
            resetBtn: document.getElementById('reset-btn'),
            closePreviewBtn: document.getElementById('close-preview'),
            previewModal: document.getElementById('preview-modal'),
            previewScreen: document.getElementById('preview-screen'),
            configStatus: document.getElementById('config-status')
        };

        this.setupEventListeners();
        this.loadExistingConfig();
    }

    setupEventListeners() {
        this.elements.backgroundInput.addEventListener('change', (e) => this.handleBackgroundUpload(e));
        this.elements.logoInput.addEventListener('change', (e) => this.handleLogoUpload(e));
        this.elements.productsInput.addEventListener('change', (e) => this.handleProductsUpload(e));
        this.elements.customImagesInput.addEventListener('change', (e) => this.handleCustomImagesUpload(e));
        this.elements.clipartsInput.addEventListener('change', (e) => this.handleClipartsUpload(e));
        this.elements.previewBtn.addEventListener('click', () => this.showPreview());
        this.elements.saveBtn.addEventListener('click', () => this.saveConfiguration());
        this.elements.resetBtn.addEventListener('click', () => this.resetConfiguration());
        this.elements.closePreviewBtn.addEventListener('click', () => this.closePreview());
        
        this.elements.previewModal.addEventListener('click', (e) => {
            if (e.target === this.elements.previewModal) {
                this.closePreview();
            }
        });
    }

    loadExistingConfig() {
        const config = configManager.getConfig();
        
        if (config.welcomeBackground) {
            this.displayBackground(config.welcomeBackground);
        }
        
        if (config.eventLogo) {
            this.displayLogo(config.eventLogo);
        }
        
        config.products.forEach(product => {
            this.addProductCard(product);
        });
        config.customImages.forEach(image => {
            this.addCustomImageCard(image);
        });
        config.cliparts.forEach(clipart => {
            this.addClipartCard(clipart);
        });
        
        this.updateButtonStates();
    }

    async compressImage(file, maxWidth, maxHeight, quality) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                
                img.onload = () => {
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > height) {
                        if (width > maxWidth) {
                            height = height * (maxWidth / width);
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = width * (maxHeight / height);
                            height = maxHeight;
                        }
                    }
                    
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Detectar si tiene transparencia
                    const imageData = ctx.getImageData(0, 0, width, height);
                    const hasTransparency = imageData.data.some((_, i) => i % 4 === 3 && imageData.data[i] < 255);
                    
                    // Usar PNG solo si tiene transparencia, sino JPEG (más liviano)
                    const format = hasTransparency ? 'image/png' : 'image/jpeg';
                    const compressedDataUrl = canvas.toDataURL(format, quality);
                    
                    console.log(`✅ Comprimido: ${img.width}x${img.height} → ${width}x${height} (${format}) (${(compressedDataUrl.length / 1024).toFixed(0)} KB)`);
                    
                    resolve(compressedDataUrl);
                };
                
                img.onerror = () => reject('Error al cargar la imagen');
                img.src = e.target.result;
            };
            
            reader.onerror = () => reject('Error al leer el archivo');
            reader.readAsDataURL(file);
        });
    }

    async handleBackgroundUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        this.showStatus('warning', '⏳ Comprimiendo imagen...');

        try {
            const compressed = await this.compressImage(file, 1080, 1920, 0.65);
            const saved = configManager.setWelcomeBackground(compressed);
            
            if (!saved) {
                throw new Error('No se pudo guardar. Imagen muy grande.');
            }
            
            this.displayBackground(compressed);
            this.showStatus('success', '✓ Fondo cargado correctamente');
            this.updateButtonStates();
        } catch (error) {
            this.showStatus('error', '✗ ' + error.message);
            console.error(error);
        }
    }

    displayBackground(imageDataUrl) {
        this.elements.bgStatus.textContent = '✓ Fondo Cargado';
        this.elements.bgUploadZone.classList.add('has-file');
        this.elements.bgPreview.innerHTML = `
            <img src="${imageDataUrl}" alt="Fondo">
            <button class="remove-btn" onclick="adminPanel.removeBackground()">×</button>
        `;
    }

    removeBackground() {
        configManager.setWelcomeBackground(null);
        this.elements.bgStatus.textContent = 'Cargar Fondo de Bienvenida';
        this.elements.bgUploadZone.classList.remove('has-file');
        this.elements.bgPreview.innerHTML = '';
        this.elements.backgroundInput.value = '';
        this.updateButtonStates();
        this.showStatus('warning', 'Fondo eliminado');
    }

    async handleLogoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        this.showStatus('warning', '⏳ Comprimiendo logo...');

        try {
            const compressed = await this.compressImage(file, 1920, 1080, 0.92);
            const saved = configManager.setEventLogo(compressed);
            
            if (!saved) {
                throw new Error('No se pudo guardar el logo');
            }
            
            this.displayLogo(compressed);
            this.showStatus('success', '✓ Logo cargado');
        } catch (error) {
            this.showStatus('error', '✗ ' + error.message);
        }
    }

    displayLogo(imageDataUrl) {
        this.elements.logoStatus.textContent = '✓ Logo Cargado';
        this.elements.logoUploadZone.classList.add('has-file');
        this.elements.logoPreview.innerHTML = `
            <img src="${imageDataUrl}" alt="Logo">
            <button class="remove-btn" onclick="adminPanel.removeLogo()">×</button>
        `;
    }

    removeLogo() {
        configManager.setEventLogo(null);
        this.elements.logoStatus.textContent = 'Cargar Logo (Opcional)';
        this.elements.logoUploadZone.classList.remove('has-file');
        this.elements.logoPreview.innerHTML = '';
        this.elements.logoInput.value = '';
        this.showStatus('warning', 'Logo eliminado');
    }

    async handleProductsUpload(e) {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        this.showStatus('warning', `⏳ Comprimiendo ${files.length} producto(s)...`);

        try {
            for (const file of files) {
                const compressed = await this.compressImage(file, 800, 800, 0.7);
                
                const product = {
                    id: Date.now() + Math.random(),
                    name: file.name.replace(/\.[^/.]+$/, ''),
                    image: compressed
                };
                
                const saved = configManager.addProduct(compressed, product.name);
                
                if (saved) {
                    this.addProductCard(product);
                }
            }
            this.showStatus('success', `✓ ${files.length} producto(s) agregado(s)`);
            this.updateButtonStates();
            this.elements.productsInput.value = '';
        } catch (error) {
            this.showStatus('error', '✗ ' + error.message);
        }
    }

    addProductCard(product) {
        const card = document.createElement('div');
        card.className = 'item-card';
        card.dataset.id = product.id;
        card.innerHTML = `
            <img src="${product.image}" alt="${product.name}">
            <div class="item-name">${product.name}</div>
            <button class="remove-item-btn" onclick="adminPanel.removeProduct(${product.id})">
                Eliminar
            </button>
        `;
        this.elements.productsList.appendChild(card);
    }

    removeProduct(productId) {
        configManager.removeProduct(productId);
        const card = this.elements.productsList.querySelector(`[data-id="${productId}"]`);
        if (card) card.remove();
        this.showStatus('warning', 'Producto eliminado');
        this.updateButtonStates();
    }
    async handleCustomImagesUpload(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    this.showStatus('warning', `⏳ Comprimiendo ${files.length} imagen(es)...`);

    try {
        for (const file of files) {
            const compressed = await this.compressImage(file, 800, 800, 0.75);
            
            const customImage = {
                id: Date.now() + Math.random(),
                name: file.name.replace(/\.[^/.]+$/, ''),
                image: compressed
            };
            
            const saved = configManager.addCustomImage(compressed, customImage.name);
            
            if (saved) {
                this.addCustomImageCard(customImage);
            }
        }
        this.showStatus('success', `✓ ${files.length} imagen(es) agregada(s)`);
        this.elements.customImagesInput.value = '';
    } catch (error) {
        this.showStatus('error', '✗ ' + error.message);
    }
}

    addCustomImageCard(image) {
    const card = document.createElement('div');
    card.className = 'item-card';
    card.dataset.id = image.id;
    card.innerHTML = `
        <img src="${image.image}" alt="${image.name}">
        <div class="item-name">${image.name}</div>
        <button class="remove-item-btn" onclick="adminPanel.removeCustomImage(${image.id})">
            Eliminar
        </button>
    `;
    this.elements.customImagesList.appendChild(card);
    }

    removeCustomImage(imageId) {
    configManager.removeCustomImage(imageId);
    const card = this.elements.customImagesList.querySelector(`[data-id="${imageId}"]`);
    if (card) card.remove();
    this.showStatus('warning', 'Imagen eliminada');
    }

    async handleClipartsUpload(e) {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        this.showStatus('warning', `⏳ Comprimiendo ${files.length} clipart(s)...`);

        try {
            for (const file of files) {
                const compressed = await this.compressImage(file, 500, 500, 0.75);
                
                const clipart = {
                    id: Date.now() + Math.random(),
                    name: file.name.replace(/\.[^/.]+$/, ''),
                    image: compressed
                };
                
                configManager.addClipart(compressed, clipart.name);
                this.addClipartCard(clipart);
            }
            this.showStatus('success', `✓ ${files.length} clipart(s) agregado(s)`);
            this.elements.clipartsInput.value = '';
        } catch (error) {
            this.showStatus('error', '✗ ' + error.message);
        }
    }

    addClipartCard(clipart) {
        const card = document.createElement('div');
        card.className = 'item-card';
        card.dataset.id = clipart.id;
        card.innerHTML = `
            <img src="${clipart.image}" alt="${clipart.name}">
            <div class="item-name">${clipart.name}</div>
            <button class="remove-item-btn" onclick="adminPanel.removeClipart(${clipart.id})">
                Eliminar
            </button>
        `;
        this.elements.clipartsList.appendChild(card);
    }

    removeClipart(clipartId) {
        configManager.removeClipart(clipartId);
        const card = this.elements.clipartsList.querySelector(`[data-id="${clipartId}"]`);
        if (card) card.remove();
        this.showStatus('warning', 'Clipart eliminado');
    }

    showPreview() {
        const config = configManager.getConfig();
        this.elements.previewScreen.style.backgroundImage = `url(${config.welcomeBackground})`;
        this.elements.previewScreen.innerHTML = '';
        
        if (config.eventLogo) {
            const logo = document.createElement('img');
            logo.src = config.eventLogo;
            logo.className = 'preview-logo';
            this.elements.previewScreen.appendChild(logo);
        }
        
        const tapButton = document.createElement('div');
        tapButton.className = 'preview-tap-button';
        tapButton.textContent = 'TAP TO START';
        this.elements.previewScreen.appendChild(tapButton);
        
        this.elements.previewModal.classList.add('active');
    }

    closePreview() {
        this.elements.previewModal.classList.remove('active');
    }

    saveConfiguration() {
        const config = configManager.getConfig();
        
        if (!config.welcomeBackground) {
            this.showStatus('error', '✗ Debes cargar un fondo');
            return;
        }

        if (config.products.length === 0) {
            this.showStatus('error', '✗ Debes agregar al menos un producto');
            return;
        }

        const saved = configManager.markAsConfigured();
        
        if (!saved) {
            this.showStatus('error', '✗ Error al guardar');
            return;
        }
        
        this.showStatus('success', '✓ Evento configurado correctamente');
        
        setTimeout(() => {
            if (confirm('¿Ver pantalla de asistentes?')) {
                window.location.href = 'index.html';
            }
        }, 1500);
    }

    resetConfiguration() {
        if (!confirm('¿Eliminar TODA la configuración?')) return;

        configManager.reset();
        
        this.elements.bgPreview.innerHTML = '';
        this.elements.logoPreview.innerHTML = '';
        this.elements.productsList.innerHTML = '';
        this.elements.customImagesList.innerHTML = '';
        this.elements.clipartsList.innerHTML = '';
        
        this.elements.bgStatus.textContent = 'Cargar Fondo de Bienvenida';
        this.elements.logoStatus.textContent = 'Cargar Logo (Opcional)';
        
        this.elements.bgUploadZone.classList.remove('has-file');
        this.elements.logoUploadZone.classList.remove('has-file');
        
        this.elements.backgroundInput.value = '';
        this.elements.logoInput.value = '';
        this.elements.productsInput.value = '';
        this.elements.customImagesInput.value = '';
        this.elements.clipartsInput.value = '';
        
        this.updateButtonStates();
        this.showStatus('warning', 'Configuración eliminada');
    }

    updateButtonStates() {
        const config = configManager.getConfig();
        const hasBackground = config.welcomeBackground !== null;
        const hasProducts = config.products.length > 0;
        
        this.elements.previewBtn.disabled = !hasBackground;
        this.elements.saveBtn.disabled = !(hasBackground && hasProducts);
    }

    showStatus(type, message) {
        this.elements.configStatus.className = `config-status ${type}`;
        this.elements.configStatus.textContent = message;
        
        setTimeout(() => {
            this.elements.configStatus.className = 'config-status';
        }, 5000);
    }
}

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});