
class CanvasController {
  constructor() {
    this.canvas = null;
    this.history = [];
    this.historyIndex = -1;
    this.maxHistory = 50;
    this.productImage = null;
    this.productImageUrl = null;
    this.textColor = '#000000';

    // Elemento wrapper donde debe caber el canvas (debe existir en el DOM)
    this.wrapperEl = null;
    // id del elemento canvas por defecto
    this.canvasId = 'editor-canvas';

    // bind de métodos que se usarán como listeners
    this.fitCanvasToWrapper = this.fitCanvasToWrapper.bind(this);
    this._applyPixelRatio = this._applyPixelRatio.bind(this);
  }

  // Inicializar canvas
  init(canvasElement, width = 1080, height = 1920) {
    // resolver canvasId si se pasa elemento o id
    if (typeof canvasElement === 'string') {
      this.canvasId = canvasElement;
    } else if (canvasElement && canvasElement.id) {
      this.canvasId = canvasElement.id;
    }

    // detectar wrapper preferido (asegúrate que exista .canvas-wrapper dentro de .canvas-area)
    this.wrapperEl = document.querySelector('.canvas-wrapper') || document.querySelector('.canvas-area');

    // crear fabric.Canvas
    this.canvas = new fabric.Canvas(this.canvasId, {
      preserveObjectStacking: true,
      selection: true,
      renderOnAddRemove: true,
      backgroundColor: 'transparent'
    });

    // tamaño inicial (usar wrapper si existe, sino los defaults)
    const initialW = (this.wrapperEl && Math.floor(this.wrapperEl.getBoundingClientRect().width)) || width;
    const initialH = (this.wrapperEl && Math.floor(this.wrapperEl.getBoundingClientRect().height)) || height;
    this.canvas.setWidth(initialW);
    this.canvas.setHeight(initialH);
    this.canvas.calcOffset();
    this._applyPixelRatio();
    this.canvas.requestRenderAll();

    // Eventos del canvas (mantengo tus hooks)
    this.canvas.on('object:modified', () => {
      if (typeof this.saveState === 'function') this.saveState();
    });

    this.canvas.on('object:added', (e) => {
      // Solo guardar estado si no es la imagen de fondo cargada como producto
      if (e && e.target !== this.productImage) {
        if (typeof this.saveState === 'function') this.saveState();
      }
    });

    this.canvas.on('object:removed', () => {
      if (typeof this.saveState === 'function') this.saveState();
    });

    // Touch events optimizados para iPad (mantengo tu lógica)
    this.canvas.on('touch:gesture', (e) => {
      try {
        if (e && e.e && e.e.touches && e.e.touches.length === 2) {
          const activeObject = this.canvas.getActiveObject();
          if (activeObject && activeObject.selectable) {
            const scale = (e && e.self && e.self.scale) || 1;
            activeObject.set({
              scaleX: (typeof activeObject.scaleX === 'number' ? activeObject.scaleX : 1) * scale,
              scaleY: (typeof activeObject.scaleY === 'number' ? activeObject.scaleY : 1) * scale
            });
            this.canvas.renderAll();
          }
        }
      } catch (err) {
        // evitar bloqueo por eventos inesperados
      }
    });

    // Doble tap para editar texto (soporte iText)
    this.canvas.on('mouse:dblclick', (e) => {
      if (e && e.target && (e.target.type === 'i-text' || e.target.type === 'textbox')) {
        try {
          e.target.enterEditing && e.target.enterEditing();
          e.target.selectAll && e.target.selectAll();
        } catch (err) {
          // ignore
        }
      }
    });

    // listener resize (usa el método enlazado)
    window.addEventListener('resize', this.fitCanvasToWrapper);

    // llamada inicial para ajustar tamaño al wrapper
    this.fitCanvasToWrapper();

    return this.canvas;
  }

  // Ajusta dimensiones del canvas al contenedor real (robusto)
  fitCanvasToWrapper() {
    if (!this.wrapperEl || !this.canvas) return;

    // obtener rect exacto del wrapper visual
    const rect = this.wrapperEl.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width));
    const h = Math.max(1, Math.floor(rect.height));

    // nodos DOM que fabrica Fabric
    const upper = this.canvas.upperCanvasEl;
    const lower = this.canvas.lowerCanvasEl;
    const container = this.canvas.wrapperEl || document.getElementById(this.canvasId)?.parentElement;

    // Asegurar que el wrapper interno de Fabric esté posicionado y sin márgenes
    if (container) {
      container.style.position = 'absolute';
      container.style.top = '0px';
      container.style.left = '0px';
      container.style.width = w + 'px';
      container.style.height = h + 'px';
      container.style.overflow = 'hidden';
    }

    // Establecer tamaño VISUAL del canvas (CSS)
    if (upper) {
      upper.style.width = w + 'px';
      upper.style.height = h + 'px';
      upper.style.position = 'absolute';
      upper.style.top = '0px';
      upper.style.left = '0px';
    }
    if (lower) {
      lower.style.width = w + 'px';
      lower.style.height = h + 'px';
      lower.style.position = 'absolute';
      lower.style.top = '0px';
      lower.style.left = '0px';
    }

    // Actualizar tamaño lógico de fabric
    this.canvas.setWidth(w);
    this.canvas.setHeight(h);

    // Resetear viewportTransform para evitar offsets extraños (si no quieres resetear zoom, comentar)
    try {
      this.canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    } catch (e) {}

    // Ajustar backing store (HiDPI)
    this._applyPixelRatio();

    // recalcular offsets y volver a renderizar
    this.canvas.calcOffset();
    this.canvas.requestRenderAll();
  }

  // Ajusta el backing store del canvas para pantallas HiDPI (mejor nitidez)
  _applyPixelRatio() {
    if (!this.canvas) return;
    const ratio = window.devicePixelRatio || 1;

    const upper = this.canvas.upperCanvasEl;
    const lower = this.canvas.lowerCanvasEl;

    // CSS sizes (visual)
    const cssWidth = (upper && parseInt(upper.style.width, 10)) || this.canvas.getWidth();
    const cssHeight = (upper && parseInt(upper.style.height, 10)) || this.canvas.getHeight();

    // Actual backing store (pixeles reales)
    if (upper) {
      upper.width = Math.floor(cssWidth * ratio);
      upper.height = Math.floor(cssHeight * ratio);
      upper.style.width = cssWidth + 'px';
      upper.style.height = cssHeight + 'px';
    }
    if (lower) {
      lower.width = Math.floor(cssWidth * ratio);
      lower.height = Math.floor(cssHeight * ratio);
      lower.style.width = cssWidth + 'px';
      lower.style.height = cssHeight + 'px';
    }

    // Ajustar contextos si existen
    if (this.canvas.contextTop) {
      try { this.canvas.contextTop.setTransform(ratio, 0, 0, ratio, 0, 0); } catch (e) {}
    }
    if (this.canvas.contextContainer) {
      try { this.canvas.contextContainer.setTransform(ratio, 0, 0, ratio, 0, 0); } catch (e) {}
    }
  }

  // ========================================================
// Cargar producto dentro del Canvas y mantenerlo centrado
// ========================================================
setProductImage(imageUrl) {
  return new Promise((resolve, reject) => {
    if (!this.canvas) return reject('Canvas no inicializado');

    fabric.Image.fromURL(imageUrl, (img) => {
      if (!img) return reject('Error al cargar la imagen del producto');

      const canvas = this.canvas;
      const canvasWidth = canvas.getWidth();
      const canvasHeight = canvas.getHeight();

      // Escala la imagen para que ocupe el 90% del canvas (sin deformar)
      const maxWidth = canvasWidth * 1.3;
      const maxHeight = canvasHeight * 1.5;
      const scale = Math.min(maxWidth / img.width, maxHeight / img.height);

      img.set({
        originX: 'center',
        originY: 'center',
        left: canvasWidth / 2,
        top: canvasHeight / 2,
        scaleX: scale,
        scaleY: scale,
        selectable: false,
        evented: false,
        hasControls: false,
        hasBorders: false,
      });

      // Si ya existía una imagen anterior, eliminarla
      if (this.productImage) {
        try { canvas.remove(this.productImage); } catch (e) {}
      }

      // Añadir al canvas y enviar al fondo
      canvas.add(img);
      canvas.sendToBack(img);
      canvas.centerObject(img);
      img.setCoords();

      // Guardar referencia
      this.productImage = img;
      this.productImageUrl = imageUrl;

      // Ajuste visual
      canvas.viewportTransform = [1, 0, 0, 1, 0, 0];
      canvas.calcOffset();
      canvas.requestRenderAll();

      resolve(img);
    }, { crossOrigin: 'anonymous' });
  });
}

// Agregar texto al canvas (movible, escalable y seleccionable)
addText(text = 'Tu Texto', options = {}) {
  try {
    if (!this.canvas) throw new Error('Canvas no está inicializado');

    // Asegurar selección activa del canvas
    this.canvas.selection = true;

    const defaultOptions = {
      left: this.canvas.getWidth() / 2,
      top: this.canvas.getHeight() / 2,
      fontSize: 80,
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      fill: this.textColor || '#000000',
      textAlign: 'center',
      originX: 'center',
      originY: 'center',
      selectable: true,
      editable: false,          // 🔹 Desactivar edición inmediata
      hasControls: true,
      hasBorders: true,
      lockScalingFlip: true,
      borderColor: '#ec4899',
      cornerColor: '#ec4899',
      transparentCorners: false,
      cornerStyle: 'circle',
      borderScaleFactor: 2,
      padding: 10
    };

    const textOptions = Object.assign({}, defaultOptions, options);
    const textObj = new fabric.IText(text, textOptions);

    // Añadir sombra para visibilidad
    textObj.set('shadow', new fabric.Shadow({
      color: 'rgba(0,0,0,0.25)',
      blur: 8,
      offsetX: 2,
      offsetY: 2
    }));

    // Añadir al canvas
    this.canvas.add(textObj);
    this.canvas.setActiveObject(textObj);
    this.canvas.centerObject(textObj);  // 🔹 Centra el texto real en el área visible
    this.canvas.requestRenderAll();

    // Asegurar interacción
    textObj.selectable = true;
    textObj.evented = true;
    textObj.lockMovementX = false;
    textObj.lockMovementY = false;

    return textObj;

  } catch (error) {
    console.error('Error en addText:', error);
    throw error;
  }
}


  // Agregar imagen/clipart (escala relativa al canvas)
  addImage(imageUrl, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.canvas) return reject('Canvas no inicializado');

      fabric.Image.fromURL(imageUrl, (img) => {
        if (!img) {
          reject('Error al cargar la imagen');
          return;
        }

        // Calcular escala apropiada relativa al canvas (ej. ocupar hasta 60% del canvas)
        const maxFactor = 0.6;
        const maxWidth = this.canvas.getWidth() * maxFactor;
        const maxHeight = this.canvas.getHeight() * maxFactor;
        const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);

        const defaultOptions = {
          left: this.canvas.getWidth() / 2,
          top: this.canvas.getHeight() / 2,
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

        const imageOptions = Object.assign({}, defaultOptions, options);
        img.set(imageOptions);

        this.canvas.add(img);
        this.canvas.setActiveObject(img);
        this.canvas.requestRenderAll();
        resolve(img);
      }, { crossOrigin: 'anonymous' });
    });
  }

  // Eliminar objeto seleccionado
  deleteSelected() {
    if (!this.canvas) return false;
    const activeObject = this.canvas.getActiveObject();
    if (activeObject && activeObject.selectable) {
      this.canvas.remove(activeObject);
      this.canvas.discardActiveObject();
      this.canvas.requestRenderAll();
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
      this.canvas.requestRenderAll();
      this.saveState();
    }
  }

  // Guardar estado para historial
  saveState() {
    if (!this.canvas) return;

    // Serializar canvas completo (incluye objetos, pero productImage está como objeto también)
    try {
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
    } catch (err) {
      // ignore serialization errors
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

  // Cargar estado (desde JSON guardado)
  loadState(stateString) {
    if (!this.canvas || !stateString) return;
    const state = JSON.parse(stateString);

    this.canvas.loadFromJSON(state, () => {
      // Después de cargar los objetos, recalcular tamaño y reañadir productImage si es necesario
      this.canvas.renderAll();
      this.fitCanvasToWrapper();

      // Si había una productImageUrl y productImage no está presente, volver a cargarla
      if (this.productImageUrl && !this.productImage) {
        // volver a añadir la imagen como objeto para mantener consistencia
        this.setProductImage(this.productImageUrl).catch(() => {});
      }
    });
  }

  // Resetear canvas
  reset() {
    const productUrl = this.productImageUrl;

    // Limpiar canvas
    if (this.canvas) this.canvas.clear();

    // Recargar producto de fondo
    if (productUrl) {
      this.setProductImage(productUrl).then(() => {
        this.canvas.requestRenderAll();
      }).catch(() => {
        // ignore load errors
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
    return this.canvas ? this.canvas.getActiveObject() : null;
  }

  // Deseleccionar todo
  discardActiveObject() {
    if (!this.canvas) return;
    this.canvas.discardActiveObject();
    this.canvas.requestRenderAll();
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
      this.canvas.requestRenderAll();
      this.saveState();
    }
  }

  // Cambiar tamaño de fuente
  changeFontSize(size) {
    const activeObject = this.canvas.getActiveObject();
    if (activeObject && (activeObject.type === 'i-text' || activeObject.type === 'text')) {
      activeObject.set('fontSize', parseInt(size, 10));
      this.canvas.requestRenderAll();
      this.saveState();
    }
  }

  // Desbloquear todos los objetos
  unlockAllObjects() {
    if (!this.canvas) return;
    this.canvas.getObjects().forEach((obj) => {
      try {
        obj.set({
          selectable: true,
          evented: true,
          hasControls: true,
          hasBorders: true,
          lockMovementX: false,
          lockMovementY: false,
          lockRotation: false,
          lockScalingX: false,
          lockScalingY: false,
          visible: true,
          opacity: 1
        });
        if (typeof obj.setControlsVisibility === 'function') {
          obj.setControlsVisibility({
            mt: true, mb: true, ml: true, mr: true, bl: true, br: true, tl: true, tr: true, mtr: true
          });
        }
      } catch (err) {
        // ignorar objetos que no soporten algunas props
      }
    });
    this.canvas.requestRenderAll();
  }

  // Limpiar y destruir (remueve listeners)
  destroy() {
    try {
      window.removeEventListener('resize', this.fitCanvasToWrapper);
    } catch (e) {}
    if (this.canvas) {
      try {
        this.canvas.dispose();
      } catch (e) {}
      this.canvas = null;
    }
  }
}

// Instancia global
const canvasController = new CanvasController();