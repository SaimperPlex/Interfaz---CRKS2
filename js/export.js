/* ============================================
   EXPORT
   Exportación de diseño a PNG (con transparencia)
============================================ */

class Exporter {
    constructor(canvas) {
        this.canvas = canvas;
    }

    // Método principal - usa PNG para transparencia
    exportToPNG(clientName) {
        return new Promise((resolve, reject) => {
            if (!clientName || clientName.trim() === '') {
                reject('Nombre de cliente requerido');
                return;
            }

            try {
                // Deseleccionar objetos antes de exportar
                this.canvas.discardActiveObject();
                this.canvas.renderAll();

                // Configurar opciones de exportación CON TRANSPARENCIA
                const dataURL = this.canvas.toDataURL({
                    format: 'png',  // PNG para transparencia
                    quality: 1.0,   // Máxima calidad
                    multiplier: 1
                });

                // Crear nombre de archivo
                const sanitizedName = clientName
                    .trim()
                    .replace(/[^a-z0-9]/gi, '_')
                    .toLowerCase();
                
                const timestamp = new Date().getTime();
                const fileName = `${sanitizedName}_${timestamp}.png`; // Extensión .png

                // Descargar archivo
                this.downloadImage(dataURL, fileName);
                resolve(fileName);
            } catch (error) {
                reject('Error al exportar imagen: ' + error.message);
            }
        });
    }

    // Método alternativo - si necesitas mantener compatibilidad con código existente
    exportToJPG(clientName) {
        // Redirigir a PNG para mantener transparencia
        return this.exportToPNG(clientName);
    }

    // Descargar imagen - VERSIÓN SIMPLE
    downloadImage(dataURL, fileName) {
        const link = document.createElement('a');
        link.download = fileName;
        link.href = dataURL;
        
        // Para iPad/Safari
        if (navigator.userAgent.match(/iPad|iPhone/i)) {
            const newWindow = window.open();
            newWindow.document.write(`
                <html>
                    <head>
                        <title>Descargar ${fileName}</title>
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <style>
                            body { margin: 0; padding: 20px; font-family: -apple-system, sans-serif; text-align: center; background: #f5f5f5; }
                            img { max-width: 100%; height: auto; }
                            .instructions { margin-top: 20px; padding: 15px; background: white; border-radius: 8px; }
                        </style>
                    </head>
                    <body>
                        <h2>✓ Diseño Generado</h2>
                        <img src="${dataURL}" alt="${fileName}">
                        <div class="instructions">
                            <p><strong>Para guardar en iPad:</strong></p>
                            <p>Mantén presionada la imagen y selecciona "Guardar imagen"</p>
                        </div>
                        <a href="${dataURL}" download="${fileName}">
                            Descargar ${fileName}
                        </a>
                    </body>
                </html>
            `);
        } else {
            // Descarga normal para otros navegadores
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    // Exportar con alta calidad en PNG
    exportHighQuality(clientName, multiplier = 2) {
        return new Promise((resolve, reject) => {
            if (!clientName || clientName.trim() === '') {
                reject('Nombre de cliente requerido');
                return;
            }

            try {
                this.canvas.discardActiveObject();
                this.canvas.renderAll();

                const dataURL = this.canvas.toDataURL({
                    format: 'png',  // PNG para transparencia
                    quality: 1.0,
                    multiplier: multiplier
                });

                const sanitizedName = clientName
                    .trim()
                    .replace(/[^a-z0-9]/gi, '_')
                    .toLowerCase();
                
                const timestamp = new Date().getTime();
                const fileName = `${sanitizedName}_hq_${timestamp}.png`; // Extensión .png

                this.downloadImage(dataURL, fileName);
                resolve(fileName);
            } catch (error) {
                reject('Error al exportar imagen: ' + error.message);
            }
        });
    }

    // Previsualizar antes de exportar
    preview() {
        this.canvas.discardActiveObject();
        this.canvas.renderAll();
        
        const dataURL = this.canvas.toDataURL({
            format: 'png',  // PNG para previsualización con transparencia
            quality: 0.8
        });

        return dataURL;
    }
}