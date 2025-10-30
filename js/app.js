/* ============================================
   APP PRINCIPAL
   Inicialización y control de la aplicación
============================================ */

class PersonalizadorApp {
    constructor() {
        this.currentScreen = 'config';
        this.exporter = null;
        this.init();
    }

    init() {
        // Elementos del DOM
        this.elements = {
            // Pantallas
            configScreen: document.getElementById('config-screen'),
            editorScreen: document.getElementById('editor-screen'),
            
            // Inputs de configuración
            productUpload: document.getElementById('product-upload'),
            logoUpload: document.getElementById('logo-upload'),
            clipartsUpload: document.getElementById('cliparts-upload'),
            
            // Previews
            productStatus: document.getElementById('product-status'),
            logoStatus: document.getElementById('logo-status'),
            clipartsStatus: document.getElementById('cliparts-status'),
            productPreview: document.getElementById('product-preview'),
            logoPreview: document.getElementById('logo-preview'),
            clipartsPreview: document.getElementById('cliparts-preview'),
            
            // Botones
            startEditorBtn: document.getElementById('start-editor-btn'),
            addTextBtn: document.getElementById('add-text-btn'),
            colorBtn: document.getElementById('color-btn'),
            saveBtn: document.getElementById('save-btn'),
            undoBtn: document.getElementById('undo-btn'),
            redoBtn: document.getElementById('redo-btn'),
            deleteBtn: document.getElementById('delete-btn'),
            resetBtn: document.getElementById('reset-btn'),
            
            // Otros
            textColorInput: document.getElementById('text-color'),
            colorPickerPanel: document.getElementById('color-picker-panel'),
            clipartsList: document.getElementById('cliparts-list'),
            canvas: document.getElementById('main-canvas')
        };

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Carga de archivos
        this.elements.productUpload.addEventListener('change', (e) => this.handleProductUpload(e));
        this.elements.logoUpload.addEventListener('change', (e) => this.handleLogoUpload(e));
        this.elements.clipartsUpload.addEventListener('change', (e) => this.handleClipartsUpload(e));
        
        // Iniciar editor
        this.elements.startEditorBtn.addEventListener('click', () => this.startEditor());
        
        // Herramientas del editor
        this.elements.addTextBtn.addEventListener('click', () => this.addText());
        this.elements.colorBtn.addEventListener('click', () => this.toggleColorPicker());
        this.elements.saveBtn.addEventListener('click', () => this.saveDesign());
        this.elements.undoBtn.addEventListener('click', () => this.undo());
        this.elements.redoBtn.addEventListener('click', () => this.redo());
        this.elements.deleteBtn.addEventListener('click', () => this.deleteSelected());
        this.elements.resetBtn.addEventListener('click', () => this.reset());
        
        // Color
        this.elements.textColorInput.addEventListener('change', (e) => {
            canvasController.changeTextColor(e.target.value);
        });
    }

    // Cargar producto
    async handleProductUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const imageUrl = await fileManager.loadProduct(file);
            this.elements.productStatus.textContent = '✓ Producto Cargado';
            this.elements.productPreview.innerHTML = `<img src="${imageUrl}" alt="Producto">`;
            this.updateStartButton();
        } catch (error) {
            alert('Error al cargar producto: ' + error);
        }
    }

    // Cargar logo
    async handleLogoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const imageUrl = await fileManager.loadLogo(file);
            this.elements.logoStatus.textContent = '✓ Logo Cargado';
            this.elements.logoPreview.innerHTML = `<img src="${imageUrl}" alt="Logo">`;
        } catch (error) {
            alert('Error al cargar logo: ' + error);
        }
    }

    // Cargar cliparts
    async handleClipartsUpload(e) {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        try {
            const cliparts = await fileManager.loadCliparts(files);
            const total = fileManager.cliparts.length;
            this.elements.clipartsStatus.textContent = `✓ ${total} Cliparts Cargados`;
            
            // Mostrar preview
            this.elements.clipartsPreview.innerHTML = '';
            const preview = fileManager.cliparts.slice(0, 5);
            preview.forEach(clip => {
                const img = document.createElement('img');
                img.src = clip.src;
                this.elements.clipartsPreview.appendChild(img);
            });
            
            if (total > 5) {
                const badge = document.createElement('div');
                badge.className = 'more-badge';
                badge.textContent = `+${total - 5}`;
                this.elements.clipartsPreview.appendChild(badge);
            }
        } catch (error) {
            alert('Error al cargar cliparts: ' + error);
        }
    }

    // Actualizar botón de inicio
    updateStartButton() {
        const hasProduct = fileManager.productImage !== null;
        this.elements.startEditorBtn.disabled = !hasProduct;
    }

    // Iniciar editor
    async startEditor() {
        const resources = fileManager.getResources();
        if (!resources.product) {
            alert('Debes cargar un producto primero');
            return;
        }

        // Cambiar a pantalla de editor
        this.elements.configScreen.classList.remove('active');
        this.elements.editorScreen.classList.add('active');
        this.currentScreen = 'editor';

        // Inicializar canvas
        const canvasElement = this.elements.canvas;
        const wrapper = canvasElement.parentElement;
        const width = wrapper.clientWidth;
        const height = wrapper.clientHeight;
        
        canvasController.init(canvasElement, width, height);

        // Cargar imagen de producto
        await canvasController.setProductImage(resources.product);

        // Cargar logo si existe
        if (resources.logo) {
            await canvasController.addLogo(resources.logo);
        }

        // Cargar cliparts en el panel
        this.loadClipartsPanel(resources.cliparts);

        // Inicializar exporter
        this.exporter = new Exporter(canvasController.canvas);

        // Actualizar botones
        this.updateToolbarButtons();
    }

    // Cargar cliparts en el panel lateral
    loadClipartsPanel(cliparts) {
        this.elements.clipartsList.innerHTML = '';
        
        cliparts.forEach(clipart => {
            const item = document.createElement('div');
            item.className = 'clipart-item';
            item.innerHTML = `<img src="${clipart.src}" alt="${clipart.name}">`;
            item.addEventListener('click', () => {
                canvasController.addImage(clipart.src);
            });
            this.elements.clipartsList.appendChild(item);
        });
    }

    // Agregar texto
    addText() {
        canvasController.addText();
        this.updateToolbarButtons();
    }

    // Toggle color picker
    toggleColorPicker() {
        this.elements.colorPickerPanel.classList.toggle('active');
    }

    // Guardar diseño
    async saveDesign() {
        const clientName = prompt('Ingresa el nombre del cliente:');
        if (!clientName) return;

        try {
            const fileName = await this.exporter.exportToJPG(clientName);
            alert(`✓ Diseño guardado: ${fileName}`);
        } catch (error) {
            alert('Error al guardar: ' + error);
        }
    }

    // Deshacer
    undo() {
        canvasController.undo();
        this.updateToolbarButtons();
    }

    // Rehacer
    redo() {
        canvasController.redo();
        this.updateToolbarButtons();
    }

    // Eliminar seleccionado
    deleteSelected() {
        canvasController.deleteSelected();
        this.updateToolbarButtons();
    }

    // Reset
    reset() {
        if (confirm('¿Seguro que quieres reiniciar el diseño?')) {
            canvasController.reset();
            this.updateToolbarButtons();
        }
    }

    // Actualizar estado de botones
    updateToolbarButtons() {
        this.elements.undoBtn.disabled = !canvasController.canUndo();
        this.elements.redoBtn.disabled = !canvasController.canRedo();
        this.elements.deleteBtn.disabled = !canvasController.getActiveObject();
    }
}

// Inicializar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    const app = new PersonalizadorApp();
});