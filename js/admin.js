/* ============================================
   CONFIG MANAGER + ADMIN - OPTIMIZADO
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
                    colors: Array.isArray(parsed.colors) ? parsed.colors : ['#000000', '#FFFFFF', '#FF0000'],
                    fonts: Array.isArray(parsed.fonts) ? parsed.fonts : ['Roboto', 'Montserrat', 'Bebas Neue'],
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
            colors: ['#000000', '#FFFFFF', '#FF0000'],
            fonts: ['Roboto', 'Montserrat', 'Bebas Neue'],
            configured: false,
            lastUpdate: null
        };
    }

    // Verificar espacio disponible en localStorage
    checkStorageSpace() {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length + key.length;
            }
        }
        const totalMB = (total / 1024 / 1024).toFixed(2);
        const limitMB = 5; // Límite conservador
        const usedPercent = ((total / (limitMB * 1024 * 1024)) * 100).toFixed(1);
        
        console.log(`📊 Storage: ${totalMB}MB / ~${limitMB}MB (${usedPercent}%)`);
        
        return {
            total: total,
            totalMB: parseFloat(totalMB),
            usedPercent: parseFloat(usedPercent),
            available: (limitMB * 1024 * 1024) - total
        };
    }

    saveConfig() {
        try {
            this.config.lastUpdate = new Date().toISOString();
            const configString = JSON.stringify(this.config);
            const configSize = (configString.length / 1024 / 1024).toFixed(2);
            
            console.log(`💾 Guardando configuración: ${configSize}MB`);
            
            localStorage.setItem(this.storageKey, configString);
            
            const storageInfo = this.checkStorageSpace();
            
            if (storageInfo.usedPercent > 90) {
                console.warn('⚠️ Storage casi lleno, considera reducir imágenes');
            }
            
            return true;
        } catch (error) {
            console.error('❌ Error guardando:', error.message);
            
            if (error.name === 'QuotaExceededError') {
                const storageInfo = this.checkStorageSpace();
                alert(`❌ Límite de almacenamiento excedido\n\n` +
                      `Espacio usado: ${storageInfo.totalMB}MB\n` +
                      `Las imágenes se comprimirán más automáticamente.\n\n` +
                      `Sugerencias:\n` +
                      `• Reduce la cantidad de productos\n` +
                      `• Usa imágenes más pequeñas\n` +
                      `• Elimina imágenes no necesarias`);
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

    setColors(colors) {
        this.config.colors = colors;
        return this.saveConfig();
    }

    setFonts(fonts) {
        this.config.fonts = fonts;
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
            colors: ['#000000', '#FFFFFF', '#FF0000'],
            fonts: ['Roboto', 'Montserrat', 'Bebas Neue'],
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
        this.availableFonts = [
            'Roboto', 'Montserrat', 'Bebas Neue', 'Pacifico', 
            'Dancing Script', 'Playfair Display', 'Permanent Marker',
            'Satisfy', 'Lobster', 'Oswald', 'Raleway', 'Poppins',
            'Merriweather', 'Great Vibes', 'Josefin Sans', 'Anton',
            'Cinzel', 'Kaushan Script', 'Righteous', 'Archivo Black'
        ];
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
            colorInputs: document.getElementById('color-inputs'),
            addColorBtn: document.getElementById('add-color-btn'),
            availableFonts: document.getElementById('available-fonts'),
            fontsCounter: document.getElementById('fonts-counter'),
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
        this.initializeColors();
        this.initializeFonts();
    }

    setupEventListeners() {
        this.elements.backgroundInput.addEventListener('change', (e) => this.handleBackgroundUpload(e));
        this.elements.logoInput.addEventListener('change', (e) => this.handleLogoUpload(e));
        this.elements.productsInput.addEventListener('change', (e) => this.handleProductsUpload(e));
        this.elements.customImagesInput.addEventListener('change', (e) => this.handleCustomImagesUpload(e));
        this.elements.clipartsInput.addEventListener('change', (e) => this.handleClipartsUpload(e));
        this.elements.addColorBtn.addEventListener('click', () => this.addColorInput());
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

    // ============================================
    // COMPRESIÓN INTELIGENTE DE IMÁGENES
    // ============================================
    async compressImageSmart(file, targetType, maxAttempts = 3) {
        const configs = {
            'background': { maxWidth: 1920, maxHeight: 1920, quality: 0.85, targetKB: 350, minQuality: 0.65 },
            'logo': { maxWidth: 1920, maxHeight: 1920, quality: 0.95, targetKB: 500, minQuality: 0.85 }, // MÁXIMA PRIORIDAD
            'product': { maxWidth: 1000, maxHeight: 1000, quality: 0.80, targetKB: 200, minQuality: 0.60 },
            'customImage': { maxWidth: 800, maxHeight: 800, quality: 0.78, targetKB: 180, minQuality: 0.55 },
            'clipart': { maxWidth: 600, maxHeight: 600, quality: 0.80, targetKB: 120, minQuality: 0.60 }
        };

        const config = configs[targetType];
        let attempt = 0;
        let quality = config.quality;
        let result = null;

        console.log(`🎨 Comprimiendo ${targetType}: ${file.name}`);

        while (attempt < maxAttempts) {
            attempt++;
            
            result = await this.compressImage(
                file, 
                config.maxWidth, 
                config.maxHeight, 
                quality
            );

            const sizeKB = result.length / 1024;
            
            console.log(`   Intento ${attempt}: ${sizeKB.toFixed(0)}KB (calidad: ${(quality * 100).toFixed(0)}%)`);

            // Si está dentro del límite, listo
            if (sizeKB <= config.targetKB) {
                console.log(`   ✅ Compresión exitosa: ${sizeKB.toFixed(0)}KB`);
                return result;
            }

            // Si es el último intento, devolver lo que hay
            if (attempt === maxAttempts) {
                console.log(`   ⚠️ Usando resultado del último intento: ${sizeKB.toFixed(0)}KB`);
                return result;
            }

            // Reducir calidad progresivamente, respetando mínimos
            quality = quality - 0.08;
            if (quality < config.minQuality) quality = config.minQuality;
        }

        return result;
    }

    async compressImage(file, maxWidth, maxHeight, quality) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                
                img.onload = () => {
                    let width = img.width;
                    let height = img.height;
                    
                    // Mantener aspecto original
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
                    
                    // Mejorar calidad de renderizado
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Detectar transparencia
                    const imageData = ctx.getImageData(0, 0, width, height);
                    const hasTransparency = imageData.data.some((_, i) => 
                        i % 4 === 3 && imageData.data[i] < 255
                    );
                    
                    // Usar PNG solo si tiene transparencia
                    const format = hasTransparency ? 'image/png' : 'image/jpeg';
                    const compressedDataUrl = canvas.toDataURL(format, quality);
                    
                    resolve(compressedDataUrl);
                };
                
                img.onerror = () => reject(new Error('Error al cargar la imagen'));
                img.src = e.target.result;
            };
            
            reader.onerror = () => reject(new Error('Error al leer el archivo'));
            reader.readAsDataURL(file);
        });
    }

    // ============================================
    // HANDLERS DE UPLOAD OPTIMIZADOS
    // ============================================
    async handleBackgroundUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        this.showStatus('warning', '⏳ Comprimiendo fondo...');

        try {
            const compressed = await this.compressImageSmart(file, 'background');
            const saved = configManager.setWelcomeBackground(compressed);
            
            if (!saved) {
                throw new Error('No se pudo guardar. Intenta con una imagen más pequeña.');
            }
            
            this.displayBackground(compressed);
            const sizeKB = (compressed.length / 1024).toFixed(0);
            this.showStatus('success', `✓ Fondo cargado (${sizeKB}KB)`);
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
            const compressed = await this.compressImageSmart(file, 'logo');
            const saved = configManager.setEventLogo(compressed);
            
            if (!saved) {
                throw new Error('No se pudo guardar el logo');
            }
            
            this.displayLogo(compressed);
            const sizeKB = (compressed.length / 1024).toFixed(0);
            this.showStatus('success', `✓ Logo cargado (${sizeKB}KB)`);
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

        let successCount = 0;
        let failCount = 0;

        try {
            for (const file of files) {
                try {
                    const compressed = await this.compressImageSmart(file, 'product');
                    
                    const product = {
                        id: Date.now() + Math.random(),
                        name: file.name.replace(/\.[^/.]+$/, ''),
                        image: compressed
                    };
                    
                    const saved = configManager.addProduct(compressed, product.name);
                    
                    if (saved) {
                        this.addProductCard(product);
                        successCount++;
                    } else {
                        failCount++;
                        console.warn(`⚠️ No se pudo guardar: ${file.name}`);
                    }
                } catch (err) {
                    failCount++;
                    console.error(`❌ Error con ${file.name}:`, err);
                }
            }
            
            if (successCount > 0) {
                this.showStatus('success', `✓ ${successCount} producto(s) agregado(s)` + 
                    (failCount > 0 ? ` (${failCount} fallaron)` : ''));
                this.updateButtonStates();
            } else {
                this.showStatus('error', '✗ No se pudieron agregar productos');
            }
            
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

        let successCount = 0;

        try {
            for (const file of files) {
                try {
                    const compressed = await this.compressImageSmart(file, 'customImage');
                    
                    const customImage = {
                        id: Date.now() + Math.random(),
                        name: file.name.replace(/\.[^/.]+$/, ''),
                        image: compressed
                    };
                    
                    const saved = configManager.addCustomImage(compressed, customImage.name);
                    
                    if (saved) {
                        this.addCustomImageCard(customImage);
                        successCount++;
                    }
                } catch (err) {
                    console.error(`Error con ${file.name}:`, err);
                }
            }
            
            if (successCount > 0) {
                this.showStatus('success', `✓ ${successCount} imagen(es) agregada(s)`);
            }
            
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

        let successCount = 0;

        try {
            for (const file of files) {
                try {
                    const compressed = await this.compressImageSmart(file, 'clipart');
                    
                    const clipart = {
                        id: Date.now() + Math.random(),
                        name: file.name.replace(/\.[^/.]+$/, ''),
                        image: compressed
                    };
                    
                    configManager.addClipart(compressed, clipart.name);
                    this.addClipartCard(clipart);
                    successCount++;
                } catch (err) {
                    console.error(`Error con ${file.name}:`, err);
                }
            }
            
            if (successCount > 0) {
                this.showStatus('success', `✓ ${successCount} clipart(s) agregado(s)`);
            }
            
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

    // ============================================
    // COLORES
    // ============================================
    initializeColors() {
        const config = configManager.getConfig();
        this.elements.colorInputs.innerHTML = '';
        
        config.colors.forEach(color => {
            this.addColorInput(color);
        });
    }

    addColorInput(color = '#000000') {
        const config = configManager.getConfig();
        
        if (config.colors.length >= 10) {
            this.showStatus('warning', '⚠️ Máximo 10 colores permitidos');
            return;
        }

        const colorItem = document.createElement('div');
        colorItem.className = 'color-item';
        
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = color;
        colorInput.className = 'color-input';
        
        const colorLabel = document.createElement('span');
        colorLabel.className = 'color-label';
        colorLabel.textContent = color.toUpperCase();
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-color-btn';
        removeBtn.innerHTML = '×';
        removeBtn.onclick = () => this.removeColorInput(colorItem);
        
        colorInput.addEventListener('change', (e) => {
            colorLabel.textContent = e.target.value.toUpperCase();
            this.updateColors();
        });
        
        colorItem.appendChild(colorInput);
        colorItem.appendChild(colorLabel);
        colorItem.appendChild(removeBtn);
        
        this.elements.colorInputs.appendChild(colorItem);
        this.updateColors();
    }

    removeColorInput(colorItem) {
        const config = configManager.getConfig();
        
        if (config.colors.length <= 3) {
            this.showStatus('warning', '⚠️ Mínimo 3 colores requeridos');
            return;
        }
        
        colorItem.remove();
        this.updateColors();
    }

    updateColors() {
        const colorInputs = this.elements.colorInputs.querySelectorAll('.color-input');
        const colors = Array.from(colorInputs).map(input => input.value);
        configManager.setColors(colors);
    }

    // ============================================
    // FUENTES
    // ============================================
    initializeFonts() {
        const config = configManager.getConfig();
        this.elements.availableFonts.innerHTML = '';
        
        this.availableFonts.forEach(font => {
            const fontItem = document.createElement('div');
            fontItem.className = 'font-checkbox-item';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `font-${font.replace(/\s+/g, '-')}`;
            checkbox.value = font;
            checkbox.checked = config.fonts.includes(font);
            
            const label = document.createElement('label');
            label.htmlFor = checkbox.id;
            label.style.fontFamily = font;
            label.textContent = font;
            
            checkbox.addEventListener('change', () => this.updateFonts());
            
            fontItem.appendChild(checkbox);
            fontItem.appendChild(label);
            this.elements.availableFonts.appendChild(fontItem);
        });
        
        this.updateFontsCounter();
    }

    updateFonts() {
        const checkboxes = this.elements.availableFonts.querySelectorAll('input[type="checkbox"]:checked');
        const selectedFonts = Array.from(checkboxes).map(cb => cb.value);
        
        if (selectedFonts.length < 3) {
            this.showStatus('warning', '⚠️ Mínimo 3 fuentes requeridas');
            const lastUnchecked = this.elements.availableFonts.querySelector('input[type="checkbox"]:not(:checked)');
            if (lastUnchecked) lastUnchecked.checked = true;
            return;
        }
        
        if (selectedFonts.length > 15) {
            this.showStatus('warning', '⚠️ Máximo 15 fuentes permitidas');
            const lastChecked = Array.from(checkboxes).pop();
            if (lastChecked) lastChecked.checked = false;
            return;
        }
        
        configManager.setFonts(selectedFonts);
        this.updateFontsCounter();
    }

    updateFontsCounter() {
        const config = configManager.getConfig();
        this.elements.fontsCounter.textContent = `${config.fonts.length} fuentes seleccionadas`;
    }

    // ============================================
    // PREVIEW Y GUARDADO
    // ============================================
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

        if (config.colors.length < 3) {
            this.showStatus('error', '✗ Debes configurar al menos 3 colores');
            return;
        }

        if (config.fonts.length < 3) {
            this.showStatus('error', '✗ Debes seleccionar al menos 3 fuentes');
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
        
        this.initializeColors();
        this.initializeFonts();
        
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