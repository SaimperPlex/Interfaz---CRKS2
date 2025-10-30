/* ============================================
   FILE MANAGER
   Manejo de carga de archivos locales
============================================ */

class FileManager {
    constructor() {
        this.productImage = null;
        this.logoImage = null;
        this.cliparts = [];
    }

    // Cargar imagen de producto
    loadProduct(file) {
        return new Promise((resolve, reject) => {
            if (!file || !file.type.startsWith('image/')) {
                reject('Archivo no válido');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                this.productImage = e.target.result;
                resolve(e.target.result);
            };
            reader.onerror = () => reject('Error al cargar imagen');
            reader.readAsDataURL(file);
        });
    }

    // Cargar logo
    loadLogo(file) {
        return new Promise((resolve, reject) => {
            if (!file || !file.type.startsWith('image/')) {
                reject('Archivo no válido');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                this.logoImage = e.target.result;
                resolve(e.target.result);
            };
            reader.onerror = () => reject('Error al cargar logo');
            reader.readAsDataURL(file);
        });
    }

    // Cargar múltiples cliparts
    loadCliparts(files) {
        return new Promise((resolve, reject) => {
            if (!files || files.length === 0) {
                reject('No se seleccionaron archivos');
                return;
            }

            const validFiles = Array.from(files).filter(file => 
                file.type.startsWith('image/')
            );

            if (validFiles.length === 0) {
                reject('No hay imágenes válidas');
                return;
            }

            const loadedCliparts = [];
            let loadedCount = 0;

            validFiles.forEach((file, index) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    loadedCliparts.push({
                        id: Date.now() + index,
                        src: e.target.result,
                        name: file.name
                    });
                    loadedCount++;

                    if (loadedCount === validFiles.length) {
                        this.cliparts = [...this.cliparts, ...loadedCliparts];
                        resolve(loadedCliparts);
                    }
                };
                reader.onerror = () => {
                    loadedCount++;
                    if (loadedCount === validFiles.length) {
                        resolve(loadedCliparts);
                    }
                };
                reader.readAsDataURL(file);
            });
        });
    }

    // Obtener todos los recursos cargados
    getResources() {
        return {
            product: this.productImage,
            logo: this.logoImage,
            cliparts: this.cliparts
        };
    }

    // Resetear recursos
    reset() {
        this.productImage = null;
        this.logoImage = null;
        this.cliparts = [];
    }
}

// Instancia global
const fileManager = new FileManager();