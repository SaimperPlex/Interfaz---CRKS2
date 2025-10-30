/* ============================================
   EDITOR.JS
   Lógica del editor de personalización
============================================ */

class EditorApp {
    constructor() {
        this.currentProduct = null;
        this.elements = {};
        this.selectedFont = '"Arial", sans-serif';
        this.fontsLoaded = false;
        this.init();
    }

    init() {
        // Verificar que esté configurado
        if (!configManager.isConfigured()) {
            alert('El evento no está configurado. Redirigiendo...');
            window.location.href = 'index.html';
            return;
        }

        // Obtener elementos del DOM
        this.elements = {
            
            // Selector de productos
            productSelector: document.getElementById('product-selector'),
            productsGrid: document.getElementById('products-grid'),
            toggleProductsBtn: document.getElementById('toggle-products-btn'),
            
            // Editor
            editorContainer: document.getElementById('editor-container'),
            customImagesPanel: document.getElementById('custom-images-panel'),
            customImagesList: document.getElementById('custom-images-list'),
            toggleCustomImagesBtn: document.getElementById('toggle-custom-images-btn'),
            clipartsPanel: document.getElementById('cliparts-panel'),
            clipartsList: document.getElementById('cliparts-list'),
            canvas: document.getElementById('editor-canvas'),
            
            // Panel de fuentes (texto)
            fontsPanel: document.getElementById('fonts-panel'),
            fontsList: document.getElementById('fonts-list'),
            toggleTextBtn: document.getElementById('toggle-text-btn'),
            addTextAction: document.getElementById('add-text-action'),
            closeFontsBtn: document.getElementById('close-fonts-btn'),
            
            // Herramientas
            undoBtn: document.getElementById('undo-btn'),
            redoBtn: document.getElementById('redo-btn'),
            deleteBtn: document.getElementById('delete-btn'),
            resetBtn: document.getElementById('reset-btn'),
            toggleClipartsBtn: document.getElementById('toggle-cliparts-btn'),
            colorBtn: document.getElementById('color-btn'),
            saveBtn: document.getElementById('save-btn'),
            
            // Color picker
            colorPickerPanel: document.getElementById('color-picker-panel'),
            textColorInput: document.getElementById('text-color-input'),
            
            // Modales
            saveModal: document.getElementById('save-modal'),
            successModal: document.getElementById('success-modal'),
            clientNameInput: document.getElementById('client-name-input'),
            cancelSaveBtn: document.getElementById('cancel-save-btn'),
            confirmSaveBtn: document.getElementById('confirm-save-btn'),
            newDesignBtn: document.getElementById('new-design-btn'),
            successMessage: document.getElementById('success-message')
        };

        this.setupEventListeners();
        this.loadConfiguration();
        this.loadFonts();
        
        // Cargar fuentes de Google en segundo plano (NO BLOQUEA)
        setTimeout(() => this.loadGoogleFonts(), 100);
    }

    // Cargar fuentes de Google en segundo plano
    loadGoogleFonts() {
        const fontsToLoad = [
            'Roboto', 'Pacifico', 'Bebas Neue', 'Dancing Script',
            'Montserrat', 'Playfair Display', 'Permanent Marker', 'Satisfy'
        ];

        // Crear contenedor invisible
        const testContainer = document.createElement('div');
        testContainer.style.cssText = 'position:fixed;top:-9999px;left:-9999px;visibility:hidden;';
        
        fontsToLoad.forEach(font => {
            const span = document.createElement('span');
            span.style.fontFamily = `"${font}", sans-serif`;
            span.textContent = 'Test';
            testContainer.appendChild(span);
        });

        document.body.appendChild(testContainer);

        // Intentar cargar con Font Loading API
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => {
                this.fontsLoaded = true;
                console.log('✓ Fuentes cargadas');
            });
        } else {
            setTimeout(() => {
                this.fontsLoaded = true;
            }, 2000);
        }
    }

    setupEventListeners() {
        // Herramientas principales
        this.elements.toggleProductsBtn.addEventListener('click', () => this.toggleProductSelector());
        this.elements.toggleTextBtn.addEventListener('click', () => this.toggleTextPanel());
        this.elements.toggleCustomImagesBtn.addEventListener('click', () => this.toggleCustomImagesPanel());
        this.elements.addTextAction.addEventListener('click', () => this.addText());
        this.elements.closeFontsBtn.addEventListener('click', () => this.closeTextPanel());
        this.elements.toggleClipartsBtn.addEventListener('click', () => this.toggleClipartsPanel());
        this.elements.colorBtn.addEventListener('click', () => this.toggleColorPicker());
        this.elements.saveBtn.addEventListener('click', () => this.openSaveModal());
        
        // Controles
        this.elements.undoBtn.addEventListener('click', () => this.undo());
        this.elements.redoBtn.addEventListener('click', () => this.redo());
        this.elements.deleteBtn.addEventListener('click', () => this.deleteSelected());
        this.elements.resetBtn.addEventListener('click', () => this.resetCanvas());
        
        // Color
        this.elements.textColorInput.addEventListener('input', (e) => {
            canvasController.changeTextColor(e.target.value);
        });
        
        // Modales
        this.elements.cancelSaveBtn.addEventListener('click', () => this.closeSaveModal());
        this.elements.confirmSaveBtn.addEventListener('click', () => this.saveDesign());
        this.elements.newDesignBtn.addEventListener('click', () => this.createNewDesign());
        
        // Cerrar modales al hacer click fuera
        this.elements.saveModal.addEventListener('click', (e) => {
            if (e.target === this.elements.saveModal) {
                this.closeSaveModal();
            }
        });
        
        this.elements.successModal.addEventListener('click', (e) => {
            if (e.target === this.elements.successModal) {
                this.closeSuccessModal();
            }
        });
        
        // Enter en input de nombre
        this.elements.clientNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveDesign();
            }
        });
    }

  loadConfiguration() {
    const config = configManager.getConfig();
    
    // 🔥 CARGAR FLYER CON MÁXIMA CALIDAD
    const flyerBackground = document.getElementById('flyer-background');
    if (config.eventLogo && flyerBackground) {
        // Limpiar contenido previo
        flyerBackground.innerHTML = '';
        
        // Crear elemento IMG para mejor calidad
        const img = document.createElement('img');
        img.src = config.eventLogo;
        img.alt = 'Flyer background';
        flyerBackground.appendChild(img);
        
        console.log('✓ Flyer cargado con máxima calidad');
    }
    
    // Cargar imágenes personalizadas
    this.loadCustomImages(config.customImages);
    
    // Cargar cliparts
    this.loadCliparts(config.cliparts);
    
    // Cargar productos
    if (config.products.length === 1) {
        // Si hay solo un producto, cargarlo directamente
        this.selectProduct(config.products[0]);
    } else if (config.products.length > 1) {
        // Si hay varios, mostrar selector
        this.showProductSelector(config.products);
    } else {
        alert('No hay productos configurados');
        window.location.href = 'index.html';
    }
}
    toggleProductSelector() {
        // Cerrar otros paneles
        this.elements.customImagesPanel.classList.remove('open');
        this.elements.clipartsPanel.classList.remove('open');
        this.elements.fontsPanel.classList.remove('open');
        this.elements.colorPickerPanel.classList.remove('active');
        
        // Si hay más de un producto, mostrar/ocultar el selector
        const config = configManager.getConfig();
        if (config.products.length > 1) {
            this.elements.productSelector.classList.toggle('open');
        } else {
            alert('Solo hay un producto disponible');
        }
    }

    showProductSelector(products) {
        products.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `<img src="${product.image}" alt="${product.name}">`;
            
            card.addEventListener('click', () => {
                // Remover selección anterior
                document.querySelectorAll('.product-card').forEach(c => {
                    c.classList.remove('selected');
                });
                card.classList.add('selected');
                
                // Seleccionar producto
                this.selectProduct(product);
                
                // Ocultar selector después de seleccionar
                this.elements.productSelector.classList.remove('open');
            });
            
            this.elements.productsGrid.appendChild(card);
        });
    }

    selectProduct(product) {
        console.log('Producto seleccionado:', product);
        this.currentProduct = product;
        this.initializeCanvas(product.image);
    }

    initializeCanvas(productImage) {
        console.log('Inicializando canvas con:', productImage);
        
        const wrapper = this.elements.canvas.parentElement;
        const width = wrapper.clientWidth;
        const height = wrapper.clientHeight;
        
        console.log('Dimensiones canvas:', width, 'x', height);
        
        // Inicializar canvas con Fabric.js
        canvasController.init(this.elements.canvas, width, height);
        
        // Establecer producto como fondo
        canvasController.setProductImage(productImage).then(() => {
            console.log('✓ Producto cargado correctamente');
            this.updateToolbarButtons();
        }).catch(error => {
            console.error('Error al cargar producto:', error);
            alert('Error al cargar el producto');
        });
        
        // Agregar listeners del canvas
        this.setupCanvasListeners();
    }

    setupCanvasListeners() {
        const canvas = canvasController.canvas;
        
        // Actualizar botones cuando cambia la selección
        canvas.on('selection:created', () => this.updateToolbarButtons());
        canvas.on('selection:updated', () => this.updateToolbarButtons());
        canvas.on('selection:cleared', () => this.updateToolbarButtons());
        
        // Actualizar después de modificar
        canvas.on('object:modified', () => this.updateToolbarButtons());
        canvas.on('object:added', () => this.updateToolbarButtons());
        canvas.on('object:removed', () => this.updateToolbarButtons());
    }

    loadCliparts(cliparts) {
        if (!cliparts || cliparts.length === 0) {
            return;
        }
        
        cliparts.forEach(clipart => {
            const item = document.createElement('div');
            item.className = 'clipart-item';
            item.innerHTML = `<img src="${clipart.image}" alt="${clipart.name}">`;
            item.addEventListener('click', () => {
                canvasController.addImage(clipart.image);
                // Cerrar panel después de agregar
                this.elements.clipartsPanel.classList.remove('open');
            });
            
            this.elements.clipartsList.appendChild(item);
        });
    }
    loadCustomImages(customImages) {
    console.log('🔍 Custom Images recibidas:', customImages); // DEBUG
    
    if (!customImages || customImages.length === 0) {
        console.log('⚠️ No hay custom images para cargar');
        return;
    }
    
    console.log(`✅ Cargando ${customImages.length} imágenes personalizadas`); // DEBUG
    
    customImages.forEach((image, index) => {
        console.log(`Imagen ${index}:`, image.name, image.image.substring(0, 50)); // DEBUG
        
        const item = document.createElement('div');
        item.className = 'clipart-item';
        item.innerHTML = `<img src="${image.image}" alt="${image.name}">`;
        
        item.addEventListener('click', () => {
            console.log('🖼️ Click en imagen:', image.name); // DEBUG
            canvasController.addImage(image.image);
            this.elements.customImagesPanel.classList.remove('open');
        });
        
        this.elements.customImagesList.appendChild(item);
        console.log('✓ Imagen agregada al DOM'); // DEBUG
    });
    
    console.log('✅ Total en customImagesList:', this.elements.customImagesList.children.length); // DEBUG
}

toggleCustomImagesPanel() {
    // Cerrar otros paneles
    this.elements.clipartsPanel.classList.remove('open');
    this.elements.fontsPanel.classList.remove('open');
    this.elements.productSelector.classList.remove('open');
    this.elements.colorPickerPanel.classList.remove('active');
    
    // Toggle imágenes personalizadas
    this.elements.customImagesPanel.classList.toggle('open');
}
    loadFonts() {
        const fonts = [
            { name: 'Arial', family: '"Arial", "Helvetica", sans-serif', displayName: 'Arial' },
            { name: 'Helvetica', family: '"Helvetica", "Arial", sans-serif', displayName: 'Helvetica' },
            { name: 'Roboto', family: '"Roboto", "Arial", sans-serif', displayName: 'Roboto' },
            { name: 'Montserrat', family: '"Montserrat", "Arial", sans-serif', displayName: 'Montserrat Bold' },
            { name: 'Bebas Neue', family: '"Bebas Neue", "Impact", sans-serif', displayName: 'Bebas Neue' },
            { name: 'Pacifico', family: '"Pacifico", cursive, sans-serif', displayName: 'Pacifico' },
            { name: 'Dancing Script', family: '"Dancing Script", cursive, sans-serif', displayName: 'Dancing Script' },
            { name: 'Playfair Display', family: '"Playfair Display", serif, sans-serif', displayName: 'Playfair Display' },
            { name: 'Permanent Marker', family: '"Permanent Marker", cursive, sans-serif', displayName: 'Permanent Marker' },
            { name: 'Satisfy', family: '"Satisfy", cursive, sans-serif', displayName: 'Satisfy' },
              // 🔥 10 nuevas fuentes modernas
        { name: 'Lobster', family: '"Lobster", cursive, sans-serif', displayName: 'Lobster' },
        { name: 'Oswald', family: '"Oswald", "Arial Narrow", sans-serif', displayName: 'Oswald' },
        { name: 'Raleway', family: '"Raleway", "Helvetica Neue", sans-serif', displayName: 'Raleway' },
        { name: 'Poppins', family: '"Poppins", "Arial", sans-serif', displayName: 'Poppins' },
        { name: 'Merriweather', family: '"Merriweather", serif, sans-serif', displayName: 'Merriweather' },
        { name: 'Great Vibes', family: '"Great Vibes", cursive, sans-serif', displayName: 'Great Vibes' },
        { name: 'Josefin Sans', family: '"Josefin Sans", "Arial", sans-serif', displayName: 'Josefin Sans' },
        { name: 'Anton', family: '"Anton", "Impact", sans-serif', displayName: 'Anton' },
        { name: 'Cinzel', family: '"Cinzel", serif, sans-serif', displayName: 'Cinzel' },
        { name: 'Kaushan Script', family: '"Kaushan Script", cursive, sans-serif', displayName: 'Kaushan Script' }
    
        ];

        fonts.forEach((font, index) => {
            const item = document.createElement('div');
            item.className = 'font-item';
            if (index === 0) {
                item.classList.add('selected');
                this.selectedFont = font.family;
            }
            
            const preview = document.createElement('span');
            preview.className = 'font-preview';
            preview.textContent = font.displayName;
            preview.style.fontFamily = font.family;
            
            item.appendChild(preview);
            
            item.addEventListener('click', () => {
                // Remover selección anterior
                document.querySelectorAll('.font-item').forEach(f => {
                    f.classList.remove('selected');
                });
                item.classList.add('selected');
                
                // Guardar fuente seleccionada
                this.selectedFont = font.family;
                
                console.log('Fuente seleccionada:', font.family);
                
                // Si hay un texto seleccionado en el canvas, aplicar la fuente
                const activeObject = canvasController.getActiveObject();
                if (activeObject && (activeObject.type === 'i-text' || activeObject.type === 'text')) {
                    this.changeFont(font.family);
                }
            });
            
            this.elements.fontsList.appendChild(item);
        });
    }

    toggleTextPanel() {
        // Cerrar otros paneles
        this.elements.customImagesPanel.classList.remove('open');
        this.elements.clipartsPanel.classList.remove('open');
        this.elements.productSelector.classList.remove('open');
        this.elements.colorPickerPanel.classList.remove('active');
        
        // Toggle panel de texto/fuentes
        this.elements.fontsPanel.classList.toggle('open');
    }

    closeTextPanel() {
        this.elements.fontsPanel.classList.remove('open');
    }

    toggleClipartsPanel() {
        // Cerrar otros paneles
        this.elements.customImagesPanel.classList.remove('open');
        this.elements.fontsPanel.classList.remove('open');
        this.elements.productSelector.classList.remove('open');
        this.elements.colorPickerPanel.classList.remove('active');
        
        // Toggle cliparts
        this.elements.clipartsPanel.classList.toggle('open');
    }

    toggleColorPicker() {
        // Cerrar otros paneles
        this.elements.customImagesPanel.classList.remove('open');
        this.elements.clipartsPanel.classList.remove('open');
        this.elements.fontsPanel.classList.remove('open');
        this.elements.productSelector.classList.remove('open');
        
        // Toggle color picker
        this.elements.colorPickerPanel.classList.toggle('active');
    }

    changeFont(fontFamily) {
        const activeObject = canvasController.getActiveObject();
        
        if (activeObject && (activeObject.type === 'i-text' || activeObject.type === 'text')) {
            console.log('Aplicando fuente:', fontFamily);
            activeObject.set('fontFamily', fontFamily);
            canvasController.canvas.renderAll();
        }
    }

    addText() {
        console.log('Agregando texto con fuente:', this.selectedFont);
        
        // Agregar texto con la fuente seleccionada
        const newText = canvasController.addText('Tu Texto', {
            fontFamily: this.selectedFont
        });
        
        // Hacer que el texto sea editable inmediatamente
        if (newText) {
            setTimeout(() => {
                canvasController.canvas.setActiveObject(newText);
                newText.enterEditing();
                newText.selectAll();
                canvasController.canvas.renderAll();
            }, 150);
        }
        
        this.updateToolbarButtons();
    }

    undo() {
        canvasController.undo();
        this.updateToolbarButtons();
    }

    redo() {
        canvasController.redo();
        this.updateToolbarButtons();
    }

    deleteSelected() {
        canvasController.deleteSelected();
        this.updateToolbarButtons();
    }

    resetCanvas() {
        if (confirm('¿Seguro que quieres reiniciar? Perderás todos los cambios.')) {
            canvasController.reset();
            this.updateToolbarButtons();
        }
    }

    updateToolbarButtons() {
        // Actualizar estado de botones según el canvas
        this.elements.undoBtn.disabled = !canvasController.canUndo();
        this.elements.redoBtn.disabled = !canvasController.canRedo();
        this.elements.deleteBtn.disabled = !canvasController.getActiveObject();
    }

    openSaveModal() {
        this.elements.saveModal.classList.add('active');
        this.elements.clientNameInput.value = '';
        this.elements.clientNameInput.focus();
    }

    closeSaveModal() {
        this.elements.saveModal.classList.remove('active');
    }

    async saveDesign() {
        const clientName = this.elements.clientNameInput.value.trim();
        
        if (!clientName) {
            alert('Por favor ingresa tu nombre');
            this.elements.clientNameInput.focus();
            return;
        }

        try {
            // Cerrar modal de guardar
            this.closeSaveModal();
            
            // Crear exporter
            const exporter = new Exporter(canvasController.canvas);
            
            // Exportar
            const fileName = await exporter.exportToJPG(clientName);
            
            // Mostrar modal de éxito
            this.elements.successMessage.textContent = `Tu diseño "${fileName}" ha sido guardado correctamente`;
            this.elements.successModal.classList.add('active');
            
        } catch (error) {
            alert('Error al guardar el diseño: ' + error);
            console.error(error);
        }
    }

    closeSuccessModal() {
        this.elements.successModal.classList.remove('active');
    }

    createNewDesign() {
        this.closeSuccessModal();
        
        // Resetear canvas
        canvasController.reset();
        this.updateToolbarButtons();
        
        // Si había selector de productos, volver a mostrarlo
        const config = configManager.getConfig();
        if (config.products.length > 1) {
            this.elements.productSelector.classList.add('open');
            document.querySelectorAll('.product-card').forEach(c => {
                c.classList.remove('selected');
            });
        }
    }
}
document.getElementById("home-btn").addEventListener("click", () => {
    window.location.href = "index.html"; // Cambia si tu home tiene otro nombre
});

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.editorApp = new EditorApp();
});

// ============================================
// DARK MODE TOGGLE
// ============================================

class ThemeManager {
    constructor() {
        this.darkMode = false;
        this.init();
    }

    init() {
        // Cargar preferencia guardada
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            this.enableDarkMode();
        }

        // Setup botón
        const themeToggleBtn = document.getElementById('theme-toggle-btn');
        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', () => this.toggle());
        }
    }

    toggle() {
        if (this.darkMode) {
            this.enableLightMode();
        } else {
            this.enableDarkMode();
        }
    }

    enableDarkMode() {
        document.documentElement.classList.add('dark-mode');
        this.darkMode = true;
        localStorage.setItem('theme', 'dark');
        this.updateIcon();
    }

    enableLightMode() {
        document.documentElement.classList.remove('dark-mode');
        this.darkMode = false;
        localStorage.setItem('theme', 'light');
        this.updateIcon();
    }

    updateIcon() {
        const icon = document.getElementById('theme-icon');
        if (!icon) return;

        if (this.darkMode) {
            // Icono de sol (para activar modo claro)
            icon.innerHTML = `
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            `;
        } else {
            // Icono de luna (para activar modo oscuro)
            icon.innerHTML = `<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>`;
        }
    }
}

// Inicializar Theme Manager
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
});