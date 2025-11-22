// ============================================
// EDITOR MAIN - Sistema completo sin Fabric.js
// Carga configuración desde localStorage (AdminPanel)
// PARTE 1 DE 2
// ============================================

// Estado global del editor
const EditorState = {
    canvas: null,
    elements: [],
    selectedElement: null,
    history: [],
    historyIndex: -1,
    isDragging: false,
    dragOffset: { x: 0, y: 0 },
    configManager: null,
    fonts: [],
    colors: [],
    currentProduct: null,
    welcomeBackground: null
};

// ============================================
// CONFIG MANAGER (Mini versión para el editor)
// ============================================
class ConfigManager {
    constructor() {
        this.storageKey = 'crk2_event_config';
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
                    configured: parsed.configured || false
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
            configured: false
        };
    }

    getConfig() {
        return this.loadConfig();
    }
}

// ============================================
// CARGAR CONFIGURACIÓN
// ============================================
function loadConfig() {
    EditorState.configManager = new ConfigManager();
    const config = EditorState.configManager.getConfig();
    
    console.log('📦 Configuración cargada:', config);
    console.log('📦 Productos:', config.products.length);
    console.log('📦 Cliparts:', config.cliparts.length);
    console.log('📦 Imágenes custom:', config.customImages.length);
    console.log('📦 Colores:', config.colors);
    console.log('📦 Fuentes:', config.fonts);
    console.log('📦 Background:', config.welcomeBackground);
    
    if (!config.configured || config.products.length === 0) {
        console.warn('⚠️ No hay configuración. Redirigiendo al admin...');
        alert('No hay productos configurados. Redirigiendo al panel de administración...');
        setTimeout(() => {
            window.location.href = 'admin.html';
        }, 1500);
        return;
    }
    
    EditorState.welcomeBackground = config.welcomeBackground;
    initializeWithConfig(config);
}

function initializeWithConfig(config) {
    if (config.eventLogo) {
        document.body.style.backgroundImage = `url(${config.eventLogo})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundRepeat = 'no-repeat';
        document.body.style.backgroundAttachment = 'fixed';
        console.log('✅ Background aplicado');
    }
    
    EditorState.colors = config.colors || ['#000000', '#FFFFFF', '#FF0000'];
    EditorState.fonts = config.fonts || ['Roboto', 'Montserrat', 'Bebas Neue'];
    
    console.log('✅ Colores cargados:', EditorState.colors);
    console.log('✅ Fuentes cargadas:', EditorState.fonts);
    
    loadProducts(config.products);
    loadCliparts(config.cliparts);
    loadCustomImages(config.customImages);
    loadFonts();
    loadColorPalette();
    
    console.log('✅ Editor inicializado con configuración');
}

// ============================================
// CARGAR PRODUCTOS
// ============================================
function loadProducts(products) {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = '';
    
    if (!products || products.length === 0) {
        grid.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No hay productos disponibles</p>';
        return;
    }
    
    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.dataset.productId = product.id;
        
        const img = document.createElement('img');
        img.src = product.image;
        img.alt = product.name;
        
        const name = document.createElement('div');
        name.className = 'product-name';
        name.textContent = product.name;
        
        card.appendChild(img);
        card.appendChild(name);
        card.addEventListener('click', () => selectProduct(product, card));
        grid.appendChild(card);
    });
    
    console.log(`✅ ${products.length} productos cargados`);
}

function selectProduct(product, card) {
    document.querySelectorAll('.product-card.selected').forEach(c => {
        c.classList.remove('selected');
    });
    
    card.classList.add('selected');
    EditorState.currentProduct = product;
    
    const canvas = document.getElementById('editor-canvas');
    const existingProductImg = canvas.querySelector('.product-background-image');
    if (existingProductImg) {
        existingProductImg.remove();
    }
    
    if (product.image) {
        const productImg = document.createElement('img');
        productImg.src = product.image;
        productImg.className = 'product-background-image';
        productImg.style.position = 'absolute';
        productImg.style.top = '50%';
        productImg.style.left = '50%';
        productImg.style.transform = 'translate(-50%, -50%)';
        productImg.style.maxWidth = '100%';
        productImg.style.maxHeight = '100%';
        productImg.style.width = 'auto';
        productImg.style.height = 'auto';
        productImg.style.objectFit = 'contain';
        productImg.style.pointerEvents = 'none';
        productImg.style.zIndex = '0';
        productImg.draggable = false;
        
        canvas.insertBefore(productImg, canvas.firstChild);
    }
    
    console.log('✅ Producto seleccionado:', product.name);
}

// ============================================
// CARGAR CLIPARTS/STICKERS
// ============================================
function loadCliparts(cliparts) {
    const list = document.getElementById('cliparts-list');
    list.innerHTML = '';
    
    if (!cliparts || cliparts.length === 0) {
        list.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No hay stickers disponibles</p>';
        return;
    }
    
    cliparts.forEach(clipart => {
        const item = document.createElement('div');
        item.className = 'clipart-item';
        
        const img = document.createElement('img');
        img.src = clipart.image;
        img.alt = clipart.name || 'Sticker';
        
        item.appendChild(img);
        item.addEventListener('click', () => createImageElement(clipart.image));
        list.appendChild(item);
    });
    
    console.log(`✅ ${cliparts.length} stickers cargados`);
}

// ============================================
// CARGAR IMÁGENES PERSONALIZADAS
// ============================================
function loadCustomImages(images) {
    const list = document.getElementById('custom-images-list');
    list.innerHTML = '';
    
    if (images && images.length > 0) {
        images.forEach(image => {
            const item = document.createElement('div');
            item.className = 'clipart-item';
            
            const img = document.createElement('img');
            img.src = image.image;
            img.alt = image.name || 'Imagen';
            
            item.appendChild(img);
            item.addEventListener('click', () => createImageElement(image.image));
            list.appendChild(item);
        });
        console.log(`✅ ${images.length} imágenes personalizadas cargadas`);
    } else {
        list.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No hay imágenes personalizadas</p>';
    }
}

// ============================================
// CARGAR PALETA DE COLORES (desde config)
// ============================================
function loadColorPalette() {
    const colorPickerPanel = document.getElementById('color-picker-panel');
    if (!colorPickerPanel) return;
    
    colorPickerPanel.innerHTML = '';
    
    const palette = document.createElement('div');
    palette.className = 'color-palette';
    palette.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(45px, 1fr));
        gap: 10px;
        padding: 16px;
    `;
    
    EditorState.colors.forEach(color => {
        const colorBtn = document.createElement('button');
        colorBtn.className = 'color-palette-btn';
        colorBtn.style.cssText = `
            width: 45px;
            height: 45px;
            border-radius: 8px;
            background-color: ${color};
            border: 3px solid var(--border-color);
            cursor: pointer;
            transition: all 0.2s;
            position: relative;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        `;
        
        colorBtn.title = color.toUpperCase();
        
        colorBtn.addEventListener('click', () => {
            if (!EditorState.selectedElement) {
                alert('Primero selecciona un texto');
                return;
            }
            
            if (!EditorState.selectedElement.classList.contains('text-element')) {
                alert('Solo puedes cambiar el color de textos');
                return;
            }
            
            changeTextColor(color);
            
            document.querySelectorAll('.color-palette-btn').forEach(btn => {
                btn.style.borderColor = 'var(--border-color)';
                btn.style.borderWidth = '3px';
            });
            colorBtn.style.borderColor = 'var(--accent-color)';
            colorBtn.style.borderWidth = '4px';
        });
        
        colorBtn.addEventListener('mouseenter', () => {
            colorBtn.style.transform = 'scale(1.15)';
            colorBtn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
        });
        
        colorBtn.addEventListener('mouseleave', () => {
            colorBtn.style.transform = 'scale(1)';
            colorBtn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        });
        
        palette.appendChild(colorBtn);
    });
    
    colorPickerPanel.appendChild(palette);
    console.log(`✅ ${EditorState.colors.length} colores cargados desde Admin Panel`);
}

// ============================================
// CARGAR FUENTES (desde config)
// ============================================
function loadFonts() {
    const list = document.getElementById('fonts-list');
    list.innerHTML = '';
    
    if (!EditorState.fonts || EditorState.fonts.length === 0) {
        list.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No hay fuentes configuradas</p>';
        return;
    }
    
    EditorState.fonts.forEach(font => {
        const item = document.createElement('div');
        item.className = 'font-item';
        item.dataset.font = font;
        
        const preview = document.createElement('div');
        preview.className = 'font-preview';
        preview.style.fontFamily = font;
        preview.textContent = font;
        
        item.appendChild(preview);
        item.addEventListener('click', () => applyFont(font, item));
        list.appendChild(item);
    });
    
    console.log(`✅ ${EditorState.fonts.length} fuentes cargadas desde Admin Panel`);
}

function applyFont(font, item) {
    if (!EditorState.selectedElement) {
        alert('Primero selecciona un texto en el canvas');
        return;
    }
    
    if (!EditorState.selectedElement.classList.contains('text-element')) {
        alert('Solo puedes cambiar la fuente de textos');
        return;
    }
    
    EditorState.selectedElement.style.fontFamily = font;
    
    document.querySelectorAll('.font-item.selected').forEach(f => {
        f.classList.remove('selected');
    });
    item.classList.add('selected');
    
    saveState();
    console.log('✅ Fuente aplicada:', font);
}

// ============================================
// CREAR ELEMENTOS
// ============================================
function createTextElement(text = 'Tu texto') {
    const canvas = document.getElementById('editor-canvas');
    const canvasRect = canvas.getBoundingClientRect();
    
    const element = document.createElement('div');
    element.className = 'canvas-element text-element';
    element.contentEditable = true;
    element.textContent = text;
    element.style.position = 'absolute';
    element.style.fontSize = '32px';
    element.style.fontFamily = EditorState.fonts[0] || 'Roboto';
    element.style.color = EditorState.colors[0] || '#000000';
    element.style.fontWeight = 'bold';
    element.style.padding = '8px';
    element.style.cursor = 'move';
    element.style.userSelect = 'none';
    element.style.WebkitUserSelect = 'none';
    element.style.zIndex = '10';
    element.style.whiteSpace = 'nowrap';
    
    canvas.appendChild(element);
    
    const elementRect = element.getBoundingClientRect();
    const centerX = (canvasRect.width - elementRect.width) / 2;
    const centerY = (canvasRect.height - elementRect.height) / 2;
    
    element.style.left = centerX + 'px';
    element.style.top = centerY + 'px';
    
    setupElementEvents(element);
    EditorState.elements.push(element);
    selectElement(element);
    saveState();
    
    console.log('✅ Texto agregado al canvas (centrado)');
}

function createImageElement(src) {
    const element = document.createElement('div');
    element.className = 'canvas-element image-element';
    element.style.position = 'absolute';
    element.style.left = '100px';
    element.style.top = '100px';
    element.style.width = '150px';
    element.style.height = '150px';
    element.style.cursor = 'move';
    element.style.zIndex = '10';
    
    const img = document.createElement('img');
    img.src = src;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'contain';
    img.style.pointerEvents = 'none';
    img.draggable = false;
    
    element.appendChild(img);
    
    setupElementEvents(element);
    EditorState.canvas.appendChild(element);
    EditorState.elements.push(element);
    selectElement(element);
    saveState();
    
    console.log('✅ Imagen agregada al canvas');
}

// ============================================
// FIN DE LA PRIMERA MITAD
// ============================================

// ============================================
// EDITOR MAIN - PARTE 2 DE 2
// Eventos, Gestión de Estado, Exportación
// ============================================

// ============================================
// EVENTOS DE ELEMENTOS
// ============================================
function setupElementEvents(element) {
    let isEditing = false;
    let touchTimer = null;
    
    element.addEventListener('mousedown', (e) => {
        if (element.classList.contains('text-element') && isEditing) {
            return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        
        selectElement(element);
        startDrag(e, element);
    });
    
    if (element.classList.contains('text-element')) {
        element.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            enterEditMode(element);
            isEditing = true;
        });
        
        element.addEventListener('blur', () => {
            isEditing = false;
            element.style.cursor = 'move';
            element.style.userSelect = 'none';
            element.style.WebkitUserSelect = 'none';
            saveState();
        });
        
        element.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                element.blur();
            }
        });
    }
    
    element.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        selectElement(element);
        
        if (element.classList.contains('text-element')) {
            touchTimer = setTimeout(() => {
                enterEditMode(element);
                isEditing = true;
                touchTimer = null;
            }, 500);
        }
        
        const touchMoveHandler = () => {
            if (touchTimer) {
                clearTimeout(touchTimer);
                touchTimer = null;
            }
        };
        
        element.addEventListener('touchmove', touchMoveHandler, { once: true, passive: true });
        startDrag(e.touches[0], element);
    }, { passive: false });
    
    element.addEventListener('touchend', () => {
        if (touchTimer) {
            clearTimeout(touchTimer);
            touchTimer = null;
        }
    });
}

function enterEditMode(element) {
    element.style.cursor = 'text';
    element.style.userSelect = 'text';
    element.style.WebkitUserSelect = 'text';
    element.focus();
    
    const range = document.createRange();
    range.selectNodeContents(element);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    
    console.log('✏️ Modo edición activado');
}

function selectElement(element) {
    if (EditorState.selectedElement) {
        EditorState.selectedElement.classList.remove('selected');
    }
    
    element.classList.add('selected');
    EditorState.selectedElement = element;
    
    const deleteBtn = document.getElementById('delete-btn');
    if (deleteBtn) deleteBtn.disabled = false;
}

function startDrag(e, element) {
    EditorState.isDragging = true;
    element.classList.add('dragging');
    
    const rect = element.getBoundingClientRect();
    const canvasRect = EditorState.canvas.getBoundingClientRect();
    
    EditorState.dragOffset = {
        x: (e.clientX || e.pageX) - rect.left,
        y: (e.clientY || e.pageY) - rect.top
    };
    
    const onMove = (moveEvent) => {
        if (!EditorState.isDragging) return;
        
        moveEvent.preventDefault();
        
        const clientX = moveEvent.clientX || moveEvent.touches?.[0]?.clientX;
        const clientY = moveEvent.clientY || moveEvent.touches?.[0]?.clientY;
        
        const newX = clientX - canvasRect.left - EditorState.dragOffset.x;
        const newY = clientY - canvasRect.top - EditorState.dragOffset.y;
        
        element.style.left = Math.max(0, Math.min(newX, canvasRect.width - rect.width)) + 'px';
        element.style.top = Math.max(0, Math.min(newY, canvasRect.height - rect.height)) + 'px';
    };
    
    const onEnd = () => {
        EditorState.isDragging = false;
        element.classList.remove('dragging');
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onEnd);
        document.removeEventListener('touchmove', onMove);
        document.removeEventListener('touchend', onEnd);
        saveState();
    };
    
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
}

// ============================================
// GESTIÓN DE ESTADO (UNDO/REDO)
// ============================================
function saveState() {
    const state = {
        productId: EditorState.currentProduct?.id,
        elements: EditorState.elements.map(el => ({
            type: el.classList.contains('text-element') ? 'text' : 'image',
            left: el.style.left,
            top: el.style.top,
            fontSize: el.style.fontSize,
            fontFamily: el.style.fontFamily,
            color: el.style.color,
            width: el.style.width,
            height: el.style.height,
            content: el.classList.contains('text-element') ? el.textContent : el.querySelector('img')?.src
        }))
    };
    
    EditorState.history = EditorState.history.slice(0, EditorState.historyIndex + 1);
    EditorState.history.push(state);
    EditorState.historyIndex++;
    
    if (EditorState.history.length > 50) {
        EditorState.history.shift();
        EditorState.historyIndex--;
    }
    
    updateUndoRedoButtons();
}

function undo() {
    if (EditorState.historyIndex > 0) {
        EditorState.historyIndex--;
        restoreState(EditorState.history[EditorState.historyIndex]);
        updateUndoRedoButtons();
        console.log('⏪ Deshacer');
    }
}

function redo() {
    if (EditorState.historyIndex < EditorState.history.length - 1) {
        EditorState.historyIndex++;
        restoreState(EditorState.history[EditorState.historyIndex]);
        updateUndoRedoButtons();
        console.log('⏩ Rehacer');
    }
}

function restoreState(state) {
    const productImg = EditorState.canvas.querySelector('.product-background-image');
    
    const elementsToRemove = EditorState.canvas.querySelectorAll('.canvas-element');
    elementsToRemove.forEach(el => el.remove());
    
    EditorState.elements = [];
    
    state.elements.forEach(elData => {
        if (elData.type === 'text') {
            const el = document.createElement('div');
            el.className = 'canvas-element text-element';
            el.contentEditable = true;
            el.textContent = elData.content;
            el.style.position = 'absolute';
            el.style.left = elData.left;
            el.style.top = elData.top;
            el.style.fontSize = elData.fontSize;
            el.style.fontFamily = elData.fontFamily;
            el.style.color = elData.color;
            el.style.fontWeight = 'bold';
            el.style.padding = '8px';
            el.style.cursor = 'move';
            el.style.zIndex = '10';
            el.style.userSelect = 'none';
            el.style.WebkitUserSelect = 'none';
            
            setupElementEvents(el);
            EditorState.canvas.appendChild(el);
            EditorState.elements.push(el);
        } else if (elData.type === 'image') {
            const el = document.createElement('div');
            el.className = 'canvas-element image-element';
            el.style.position = 'absolute';
            el.style.left = elData.left;
            el.style.top = elData.top;
            el.style.width = elData.width;
            el.style.height = elData.height;
            el.style.cursor = 'move';
            el.style.zIndex = '10';
            
            const img = document.createElement('img');
            img.src = elData.content;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'contain';
            img.style.pointerEvents = 'none';
            img.draggable = false;
            el.appendChild(img);
            
            setupElementEvents(el);
            EditorState.canvas.appendChild(el);
            EditorState.elements.push(el);
        }
    });
}

function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    
    if (undoBtn) undoBtn.disabled = EditorState.historyIndex <= 0;
    if (redoBtn) redoBtn.disabled = EditorState.historyIndex >= EditorState.history.length - 1;
}

// ============================================
// ACCIONES DEL TOOLBAR
// ============================================
function deleteSelected() {
    if (!EditorState.selectedElement) return;
    
    EditorState.selectedElement.remove();
    EditorState.elements = EditorState.elements.filter(el => el !== EditorState.selectedElement);
    EditorState.selectedElement = null;
    
    document.getElementById('delete-btn').disabled = true;
    saveState();
    
    console.log('🗑️ Elemento eliminado');
}

function resetCanvas() {
    if (!confirm('¿Estás seguro de que quieres reiniciar el diseño?')) return;
    
    EditorState.canvas.innerHTML = '';
    EditorState.elements = [];
    EditorState.selectedElement = null;
    EditorState.history = [];
    EditorState.historyIndex = -1;
    EditorState.currentProduct = null;
    
    document.querySelectorAll('.product-card.selected').forEach(c => {
        c.classList.remove('selected');
    });
    
    updateUndoRedoButtons();
    document.getElementById('delete-btn').disabled = true;
    
    saveState();
    
    console.log('🔄 Canvas reiniciado');
}

function changeTextColor(color) {
    if (!EditorState.selectedElement) {
        alert('Primero selecciona un texto');
        return;
    }
    
    if (!EditorState.selectedElement.classList.contains('text-element')) {
        alert('Solo puedes cambiar el color de textos');
        return;
    }
    
    EditorState.selectedElement.style.color = color;
    saveState();
    
    console.log('🎨 Color cambiado:', color);
}

// ============================================
// THEME TOGGLE
// ============================================
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    
    const icon = document.getElementById('theme-icon');
    if (isDark) {
        icon.innerHTML = '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
    } else {
        icon.innerHTML = '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>';
    }
    
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    console.log('🌓 Tema:', isDark ? 'oscuro' : 'claro');
}

// ============================================
// PANEL TOGGLES
// ============================================
function togglePanel(panelId) {
    const panels = ['product-selector', 'fonts-panel', 'custom-images-panel', 'cliparts-panel'];
    
    panels.forEach(id => {
        const panel = document.getElementById(id);
        if (panel) {
            if (id === panelId) {
                panel.classList.toggle('open');
            } else {
                panel.classList.remove('open');
            }
        }
    });
    
    const colorPanel = document.getElementById('color-picker-panel');
    if (colorPanel) colorPanel.classList.remove('active');
}

function toggleColorPicker() {
    const panel = document.getElementById('color-picker-panel');
    if (!panel) return;
    
    panel.classList.toggle('active');
    
    ['product-selector', 'fonts-panel', 'custom-images-panel', 'cliparts-panel'].forEach(id => {
        const p = document.getElementById(id);
        if (p) p.classList.remove('open');
    });
}

// ============================================
// GUARDAR DISEÑO Y EXPORTAR (CON DOMEXPORTER)
// ============================================
function saveDesign() {
    if (!EditorState.currentProduct) {
        alert('Primero selecciona un producto');
        return;
    }
    
    const modal = document.getElementById('save-modal');
    if (modal) modal.classList.add('active');
}

async function confirmSave() {
    const clientName = document.getElementById('client-name-input')?.value.trim();
    
    if (!clientName) {
        alert('Por favor ingresa tu nombre');
        return;
    }
    
    try {
        const saveModal = document.getElementById('save-modal');
        if (saveModal) saveModal.classList.remove('active');
        
        // ✅ EXPORTAR IMAGEN CON DOMEXPORTER
        if (!window.DOMExporter) {
            throw new Error('DOMExporter no está cargado. Verifica que export-dom.js esté incluido.');
        }
        
        const exporter = new DOMExporter(EditorState.canvas);
        const fileName = await exporter.exportToPNG(clientName);
        
        console.log('✅ Imagen exportada:', fileName);
        
        // Guardar diseño en localStorage
        const designData = {
            id: Date.now(),
            clientName,
            productId: EditorState.currentProduct?.id,
            productName: EditorState.currentProduct?.name,
            fileName: fileName,
            elements: EditorState.elements.map(el => ({
                type: el.classList.contains('text-element') ? 'text' : 'image',
                left: el.style.left,
                top: el.style.top,
                content: el.classList.contains('text-element') ? el.textContent : el.querySelector('img')?.src,
                fontSize: el.style.fontSize,
                fontFamily: el.style.fontFamily,
                color: el.style.color,
                width: el.style.width,
                height: el.style.height
            })),
            timestamp: new Date().toISOString()
        };
        
        const designs = JSON.parse(localStorage.getItem('crk2_designs') || '[]');
        designs.push(designData);
        localStorage.setItem('crk2_designs', JSON.stringify(designs));
        
        // Mostrar modal de éxito
        const successModal = document.getElementById('success-modal');
        const successMessage = document.getElementById('success-message');
        
        if (successModal) successModal.classList.add('active');
        if (successMessage) successMessage.textContent = `¡Diseño guardado y descargado correctamente, ${clientName}!`;
        
        console.log('💾 Diseño guardado:', designData);
        
    } catch (error) {
        console.error('❌ Error al guardar:', error);
        alert('Error al exportar el diseño: ' + error.message);
        
        const saveModal = document.getElementById('save-modal');
        if (saveModal) saveModal.classList.add('active');
    }
}

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando editor...');
    
    EditorState.canvas = document.getElementById('editor-canvas');
    
    if (!EditorState.canvas) {
        console.error('❌ No se encontró el canvas');
        return;
    }
    
    loadConfig();
    
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }
    
    // Event Listeners - Toolbar Secondary
    const themeBtn = document.getElementById('theme-toggle-btn');
    const homeBtn = document.getElementById('home-btn');
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    const deleteBtn = document.getElementById('delete-btn');
    const resetBtn = document.getElementById('reset-btn');
    
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
    if (homeBtn) homeBtn.addEventListener('click', () => window.location.href = 'index.html');
    if (undoBtn) undoBtn.addEventListener('click', undo);
    if (redoBtn) redoBtn.addEventListener('click', redo);
    if (deleteBtn) deleteBtn.addEventListener('click', deleteSelected);
    if (resetBtn) resetBtn.addEventListener('click', resetCanvas);
    
    // Event Listeners - Toolbar Primary
    const productsBtn = document.getElementById('toggle-products-btn');
    const textBtn = document.getElementById('toggle-text-btn');
    const imagesBtn = document.getElementById('toggle-custom-images-btn');
    const clipartsBtn = document.getElementById('toggle-cliparts-btn');
    const colorBtn = document.getElementById('color-btn');
    const saveBtn = document.getElementById('save-btn');
    
    if (productsBtn) productsBtn.addEventListener('click', () => togglePanel('product-selector'));
    if (textBtn) textBtn.addEventListener('click', () => togglePanel('fonts-panel'));
    if (imagesBtn) imagesBtn.addEventListener('click', () => togglePanel('custom-images-panel'));
    if (clipartsBtn) clipartsBtn.addEventListener('click', () => togglePanel('cliparts-panel'));
    if (colorBtn) colorBtn.addEventListener('click', toggleColorPicker);
    if (saveBtn) saveBtn.addEventListener('click', saveDesign);
    
    // Event Listeners - Panels
    const closeFontsBtn = document.getElementById('close-fonts-btn');
    const addTextBtn = document.getElementById('add-text-action');
    
    if (closeFontsBtn) {
        closeFontsBtn.addEventListener('click', () => {
            const fontsPanel = document.getElementById('fonts-panel');
            if (fontsPanel) fontsPanel.classList.remove('open');
        });
    }
    
    if (addTextBtn) addTextBtn.addEventListener('click', () => createTextElement());
    
    // Modales
    const cancelSaveBtn = document.getElementById('cancel-save-btn');
    const confirmSaveBtn = document.getElementById('confirm-save-btn');
    const newDesignBtn = document.getElementById('new-design-btn');
    
    if (cancelSaveBtn) {
        cancelSaveBtn.addEventListener('click', () => {
            const saveModal = document.getElementById('save-modal');
            const clientInput = document.getElementById('client-name-input');
            if (saveModal) saveModal.classList.remove('active');
            if (clientInput) clientInput.value = '';
        });
    }
    
    if (confirmSaveBtn) confirmSaveBtn.addEventListener('click', confirmSave);
    
    if (newDesignBtn) {
        newDesignBtn.addEventListener('click', () => {
            const successModal = document.getElementById('success-modal');
            if (successModal) successModal.classList.remove('active');
            resetCanvas();
        });
    }
    
    // Click fuera del canvas para deseleccionar
    if (EditorState.canvas) {
        EditorState.canvas.addEventListener('click', (e) => {
            if (e.target === EditorState.canvas) {
                if (EditorState.selectedElement) {
                    EditorState.selectedElement.classList.remove('selected');
                    EditorState.selectedElement = null;
                    const deleteBtn = document.getElementById('delete-btn');
                    if (deleteBtn) deleteBtn.disabled = true;
                }
            }
        });
    }
    
    saveState();
    
    console.log('✅ Editor inicializado correctamente');
});

// ============================================
// FIN DE LA SEGUNDA MITAD
// ============================================
