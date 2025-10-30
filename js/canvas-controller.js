/* ============================================
   CANVAS CONTROLLER
   Control del canvas con Fabric.js
============================================ */

class CanvasController {
    constructor() {
        this.canvas = null;
        this.history = [];
        this.historyIndex = -1;
        this.maxHistory = 50;
        this.productImage = null;
        this.productImageUrl = null;
        this.textColor = '#000000';
    }

    // Inicializar canvas
    init(canvasElement, width = 1080, height = 1920) {
        this.canvas = new fabric.Canvas(canvasElement, {
            width: width,
            height: height,
            preserveObjectStacking: true,
            selection: true
        });

        // Eventos del canvas
        this.canvas.on('object:modified', () => this.saveState());
        this.canvas.on('object:added', (e) => {
            // Solo guardar estado si no es la imagen de fondo
            if (e.target !== this.productImage) {
                this.saveState();
            }
        });
        this.canvas.on('object:removed', () => this.saveState());

        // Touch events optimizados para iPad
        this.canvas.on('touch:gesture', (e) => {
            if (e.e.touches && e.e.touches.length === 2) {
                const activeObject = this.canvas.getActiveObject();
                if (activeObject && activeObject.selectable) {
                    // Permitir zoom con dos dedos
                    const scale = e.self.scale;
                    activeObject.set({
                        scaleX: activeObject.scaleX * scale,
                        scaleY: activeObject.scaleY * scale
                    });
                    this.canvas.renderAll();
                }
            }
        });

        // Doble tap para editar texto
        this.canvas.on('mouse:dblclick', (e) => {
            if (e.target && e.target.type === 'i-text') {
                e.target.enterEditing();
                e.target.selectAll();
            }
        });

        return this.canvas;
    }

    // Establecer imagen de producto como fondo
    setProductImage(imageUrl) {
        return new Promise((resolve, reject) => {
            fabric.Image.fromURL(imageUrl, (img) => {
                if (!img) {
                    reject('Error al cargar la imagen del producto');
                    return;
                }

                const canvasWidth = this.canvas.width;
                const canvasHeight = this.canvas.height;
                
                // Calcular escala para cubrir todo el canvas manteniendo proporción
                const scaleX = canvasWidth / img.width;
                const scaleY = canvasHeight / img.height;
                const scale = Math.max(scaleX, scaleY);
                
                img.set({
                    left: canvasWidth / 2,
                    top: canvasHeight / 2,
                    originX: 'center',
                    originY: 'center',
                    scaleX: scale,
                    scaleY: scale,
                    selectable: false,
                    evented: false,
                    hasControls: false,
                    hasBorders: false
                });

                this.canvas.setBackgroundImage(img, this.canvas.renderAll.bind(this.canvas));
                this.productImage = img;
                this.productImageUrl = imageUrl;
                
                // Inicializar historial DESPUÉS de cargar el producto
                this.history = [];
                this.historyIndex = -1;
                this.saveState();
                
                resolve();
            }, { crossOrigin: 'anonymous' });
        });
    }

    // Agregar texto
    addText(text = 'Tu Texto', options = {}) {
        try {
            // Verificar que el canvas esté inicializado
            if (!this.canvas) {
                throw new Error('Canvas no está inicializado');
            }

            const defaultOptions = {
                left: this.canvas.width / 2,
                top: this.canvas.height / 2,
                fontSize: 80,
                fontFamily: 'Arial, sans-serif',
                fontWeight: 'bold',
                fill: this.textColor,
                textAlign: 'center',
                originX: 'center',
                originY: 'center',
                editable: true,
                hasControls: true,
                hasBorders: true,
                cornerSize: 20,
                cornerColor: '#ec4899',
                cornerStrokeColor: '#ffffff',
                borderColor: '#ec4899',
                transparentCorners: false,
                borderScaleFactor: 2,
                padding: 10
            };

            const textOptions = { ...defaultOptions, ...options };
            
            // Crear texto sin shadow primero
            const textObj = new fabric.IText(text, textOptions);

            // Agregar shadow después si fabric.Shadow está disponible
            if (fabric.Shadow) {
                textObj.shadow = new fabric.Shadow({
                    color: 'rgba(0,0,0,0.3)',
                    blur: 8,
                    offsetX: 2,
                    offsetY: 2
                });
            }

            this.canvas.add(textObj);
            this.canvas.setActiveObject(textObj);
            this.canvas.renderAll();

            return textObj;
        } catch (error) {
            console.error('Error en addText:', error);
            throw error;
        }
    }

    // Agregar imagen/clipart
    addImage(imageUrl, options = {}) {
        return new Promise((resolve, reject) => {
            fabric.Image.fromURL(imageUrl, (img) => {
                if (!img) {
                    reject('Error al cargar la imagen');
                    return;
                }

                // Calcular escala apropiada (max 300px de ancho/alto)
                const maxSize = 300;
                const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);

                const defaultOptions = {
                    left: this.canvas.width / 2,
                    top: this.canvas.height / 2,
                    originX: 'center',
                    originY: 'center',
                    scaleX: scale,
                    scaleY: scale,
                    hasControls: true,
                    hasBorders: true,
                    cornerSize: 20,
                    cornerColor: '#ec4899',
                    cornerStrokeColor: '#ffffff',
                    borderColor: '#ec4899',
                    transparentCorners: false,
                    borderScaleFactor: 2
                };

                const imageOptions = { ...defaultOptions, ...options };
                img.set(imageOptions);

                this.canvas.add(img);
                this.canvas.setActiveObject(img);
                this.canvas.renderAll();
                resolve(img);
            }, { crossOrigin: 'anonymous' });
        });
    }

    // Eliminar objeto seleccionado
    deleteSelected() {
        const activeObject = this.canvas.getActiveObject();
        if (activeObject && activeObject.selectable) {
            this.canvas.remove(activeObject);
            this.canvas.discardActiveObject();
            this.canvas.renderAll();
            return true;
        }
        return false;
    }

    // Cambiar color del texto seleccionado
    changeTextColor(color) {
        this.textColor = color;
        const activeObject = this.canvas.getActiveObject();
        if (activeObject && (activeObject.type === 'i-text' || activeObject.type === 'text')) {
            activeObject.set('fill', color);
            this.canvas.renderAll();
        }
    }

    // Guardar estado para historial
    saveState() {
        if (!this.canvas) return;

        // Serializar canvas excluyendo la imagen de fondo
        const json = this.canvas.toJSON();
        const jsonString = JSON.stringify(json);
        
        // Limpiar historial futuro si estamos en medio
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }

        this.history.push(jsonString);
        
        // Limitar tamaño del historial
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        } else {
            this.historyIndex++;
        }
    }

    // Deshacer
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.loadState(this.history[this.historyIndex]);
            return true;
        }
        return false;
    }

    // Rehacer
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.loadState(this.history[this.historyIndex]);
            return true;
        }
        return false;
    }

    // Cargar estado
    loadState(stateString) {
        const state = JSON.parse(stateString);
        
        this.canvas.loadFromJSON(state, () => {
            // Restaurar imagen de producto como fondo
            if (this.productImageUrl) {
                fabric.Image.fromURL(this.productImageUrl, (img) => {
                    const canvasWidth = this.canvas.width;
                    const canvasHeight = this.canvas.height;
                    
                    const scaleX = canvasWidth / img.width;
                    const scaleY = canvasHeight / img.height;
                    const scale = Math.max(scaleX, scaleY);
                    
                    img.set({
                        left: canvasWidth / 2,
                        top: canvasHeight / 2,
                        originX: 'center',
                        originY: 'center',
                        scaleX: scale,
                        scaleY: scale,
                        selectable: false,
                        evented: false
                    });

                    this.canvas.setBackgroundImage(img, this.canvas.renderAll.bind(this.canvas));
                    this.productImage = img;
                }, { crossOrigin: 'anonymous' });
            }
            
            this.canvas.renderAll();
        });
    }

    // Resetear canvas
    reset() {
        // Guardar URL del producto
        const productUrl = this.productImageUrl;
        
        // Limpiar canvas
        this.canvas.clear();
     
        // Recargar producto de fondo
        if (productUrl) {
            this.setProductImage(productUrl).then(() => {
                this.canvas.renderAll();
            });
        }
    }

    // Verificar si puede deshacer
    canUndo() {
        return this.historyIndex > 0;
    }

    // Verificar si puede rehacer
    canRedo() {
        return this.historyIndex < this.history.length - 1;
    }

    // Obtener objeto activo
    getActiveObject() {
        return this.canvas.getActiveObject();
    }

    // Deseleccionar todo
    discardActiveObject() {
        this.canvas.discardActiveObject();
        this.canvas.renderAll();
    }

    // Obtener todas las fuentes disponibles
    getAvailableFonts() {
        return [
            'Arial',
            'Helvetica',
            'Times New Roman',
            'Georgia',
            'Courier New',
            'Verdana',
            'Impact',
            'Comic Sans MS',
            'Trebuchet MS',
            'Arial Black'
        ];
    }

    // Cambiar fuente del texto seleccionado
    changeFontFamily(fontFamily) {
        const activeObject = this.canvas.getActiveObject();
        if (activeObject && (activeObject.type === 'i-text' || activeObject.type === 'text')) {
            activeObject.set('fontFamily', fontFamily);
            this.canvas.renderAll();
            this.saveState();
        }
    }

    // Cambiar tamaño de fuente
    changeFontSize(size) {
        const activeObject = this.canvas.getActiveObject();
        if (activeObject && (activeObject.type === 'i-text' || activeObject.type === 'text')) {
            activeObject.set('fontSize', parseInt(size));
            this.canvas.renderAll();
            this.saveState();
        }
    }
}

// Instancia global
const canvasController = new CanvasController();