/* ============================================
   EXPORT DOM - Sistema de exportación para editor sin Fabric.js
   Usa html2canvas para capturar el canvas DOM
============================================ */

class DOMExporter {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.loadHtml2Canvas();
    }

    // Cargar librería html2canvas dinámicamente
    loadHtml2Canvas() {
        if (window.html2canvas) {
            console.log('✅ html2canvas ya está cargado');
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            script.onload = () => {
                console.log('✅ html2canvas cargado');
                resolve();
            };
            script.onerror = () => reject('Error al cargar html2canvas');
            document.head.appendChild(script);
        });
    }

    // Método principal - exportar a PNG
    async exportToPNG(clientName) {
        if (!clientName || clientName.trim() === '') {
            throw new Error('Nombre de cliente requerido');
        }

        try {
            // Asegurarse de que html2canvas esté cargado
            await this.loadHtml2Canvas();

            // Mostrar indicador de carga
            this.showLoadingIndicator();

            // Remover selección visual de elementos
            const selectedElements = this.canvas.querySelectorAll('.selected');
            selectedElements.forEach(el => el.classList.remove('selected'));

            // Capturar canvas con html2canvas
            const canvas = await html2canvas(this.canvas, {
                backgroundColor: null, // Transparencia
                scale: 2, // Alta calidad
                logging: false,
                useCORS: true,
                allowTaint: true,
                imageTimeout: 0
            });

            // Convertir a PNG
            const dataURL = canvas.toDataURL('image/png', 1.0);

            // Crear nombre de archivo
            const sanitizedName = clientName
                .trim()
                .replace(/[^a-z0-9]/gi, '_')
                .toLowerCase();
            
            const timestamp = new Date().getTime();
            const fileName = `${sanitizedName}_${timestamp}.png`;

            // Descargar
            this.downloadImage(dataURL, fileName);

            // Ocultar indicador
            this.hideLoadingIndicator();

            // Restaurar selecciones
            selectedElements.forEach(el => el.classList.add('selected'));

            console.log('✅ Imagen exportada:', fileName);
            return fileName;

        } catch (error) {
            this.hideLoadingIndicator();
            console.error('❌ Error al exportar:', error);
            throw new Error('Error al exportar imagen: ' + error.message);
        }
    }

    // Exportar alta calidad
    async exportHighQuality(clientName) {
        if (!clientName || clientName.trim() === '') {
            throw new Error('Nombre de cliente requerido');
        }

        try {
            await this.loadHtml2Canvas();
            this.showLoadingIndicator('Generando imagen de alta calidad...');

            const selectedElements = this.canvas.querySelectorAll('.selected');
            selectedElements.forEach(el => el.classList.remove('selected'));

            const canvas = await html2canvas(this.canvas, {
                backgroundColor: null,
                scale: 3, // 3x para ultra calidad
                logging: false,
                useCORS: true,
                allowTaint: true
            });

            const dataURL = canvas.toDataURL('image/png', 1.0);

            const sanitizedName = clientName
                .trim()
                .replace(/[^a-z0-9]/gi, '_')
                .toLowerCase();
            
            const timestamp = new Date().getTime();
            const fileName = `${sanitizedName}_hq_${timestamp}.png`;

            this.downloadImage(dataURL, fileName);
            this.hideLoadingIndicator();

            selectedElements.forEach(el => el.classList.add('selected'));

            console.log('✅ Imagen HQ exportada:', fileName);
            return fileName;

        } catch (error) {
            this.hideLoadingIndicator();
            throw new Error('Error al exportar imagen HQ: ' + error.message);
        }
    }

    // Previsualizar
    async preview() {
        try {
            await this.loadHtml2Canvas();

            const selectedElements = this.canvas.querySelectorAll('.selected');
            selectedElements.forEach(el => el.classList.remove('selected'));

            const canvas = await html2canvas(this.canvas, {
                backgroundColor: null,
                scale: 1,
                logging: false,
                useCORS: true,
                allowTaint: true
            });

            const dataURL = canvas.toDataURL('image/png', 0.8);

            selectedElements.forEach(el => el.classList.add('selected'));

            return dataURL;

        } catch (error) {
            console.error('Error en preview:', error);
            return null;
        }
    }

// Descargar imagen - SIN abrir nueva pestaña
downloadImage(dataURL, fileName) {
    // Intentar descarga directa en todos los dispositivos
    const link = document.createElement('a');
    link.download = fileName;
    link.href = dataURL;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    
    // Pequeño delay antes de remover
    setTimeout(() => {
        document.body.removeChild(link);
    }, 100);
    
    console.log('📥 Descarga iniciada:', fileName);
}

    // Indicador de carga
    showLoadingIndicator(message = 'Generando imagen...') {
        // Remover indicador existente
        this.hideLoadingIndicator();

        const indicator = document.createElement('div');
        indicator.id = 'export-loading-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        `;

        indicator.innerHTML = `
            <div style="
                background: white;
                padding: 30px;
                border-radius: 12px;
                text-align: center;
                color: #333;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            ">
                <div style="
                    width: 50px;
                    height: 50px;
                    border: 4px solid #f3f3f3;
                    border-top: 4px solid #007AFF;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 20px;
                "></div>
                <p style="margin: 0; font-size: 16px; font-weight: 600;">${message}</p>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;

        document.body.appendChild(indicator);
    }

    hideLoadingIndicator() {
        const indicator = document.getElementById('export-loading-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
}

// Exportar para uso global
window.DOMExporter = DOMExporter;