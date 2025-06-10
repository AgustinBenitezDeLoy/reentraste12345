/**
 * IMAGE UPLOAD SERVICE - REENTRASTE
 * ==================================
 * Servicio para manejo de subida y procesamiento de imágenes
 * 
 * Archivo: /services/image-upload.service.js
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

// ==========================================================================
// CONFIGURACIÓN
// ==========================================================================

const config = {
  // Directorios de almacenamiento
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  eventsDir: 'events',
  usersDir: 'users',
  tempDir: 'temp',
  
  // Tamaños de imagen
  sizes: {
    thumbnail: { width: 150, height: 150 },
    small: { width: 300, height: 300 },
    medium: { width: 600, height: 400 },
    large: { width: 1200, height: 800 },
    original: null
  },
  
  // Configuración de calidad
  quality: {
    jpeg: 85,
    webp: 80,
    png: 90
  },
  
  // Límites
  maxFileSize: 5 * 1024 * 1024, // 5MB
  maxFiles: 10,
  allowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
  
  // CDN (si usas uno)
  cdnUrl: process.env.CDN_URL || '',
  
  // Watermark (opcional)
  watermark: {
    enabled: process.env.WATERMARK_ENABLED === 'true',
    path: './assets/watermark.png',
    opacity: 0.3,
    position: 'southeast'
  }
};

class ImageUploadService {
  
  // ==========================================================================
  // INICIALIZACIÓN
  // ==========================================================================
  
  /**
   * Inicializa el servicio creando directorios necesarios
   */
  static async initialize() {
    try {
      const dirs = [
        path.join(config.uploadDir, config.eventsDir),
        path.join(config.uploadDir, config.usersDir),
        path.join(config.uploadDir, config.tempDir)
      ];
      
      for (const dir of dirs) {
        await fs.mkdir(dir, { recursive: true });
      }
      
      console.log('✅ Servicio de imágenes inicializado');
    } catch (error) {
      console.error('❌ Error inicializando servicio de imágenes:', error);
      throw error;
    }
  }
  
  // ==========================================================================
  // UPLOAD DE EVENTOS
  // ==========================================================================
  
  /**
   * Procesa y sube imagen de evento
   * @param {Object} file - Archivo de multer
   * @param {Object} options - Opciones adicionales
   * @returns {Object} Información de la imagen procesada
   */
  static async uploadEventImage(file, options = {}) {
    try {
      // Validar archivo
      this.validateFile(file);
      
      // Generar nombre único
      const filename = this.generateFilename(file.originalname);
      const eventDir = path.join(config.uploadDir, config.eventsDir, filename.split('.')[0]);
      
      // Crear directorio del evento
      await fs.mkdir(eventDir, { recursive: true });
      
      // Procesar imagen en diferentes tamaños
      const processedImages = await this.processImageSizes(file, eventDir, filename);
      
      // Generar URLs públicas
      const urls = this.generateImageUrls(config.eventsDir, filename.split('.')[0], processedImages);
      
      // Eliminar archivo temporal
      if (file.path) {
        await fs.unlink(file.path).catch(() => {});
      }
      
      console.log(`📸 Imagen de evento procesada: ${filename}`);
      
      return {
        filename: filename.split('.')[0],
        original: urls.original,
        sizes: urls.sizes,
        metadata: {
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          uploadedAt: new Date()
        }
      };
      
    } catch (error) {
      console.error('❌ Error procesando imagen de evento:', error);
      throw error;
    }
  }
  
  /**
   * Procesa múltiples imágenes de evento
   * @param {Array} files - Array de archivos
   * @param {Object} options - Opciones adicionales
   */
  static async uploadEventImages(files, options = {}) {
    if (!Array.isArray(files) || files.length === 0) {
      throw new Error('No se proporcionaron archivos válidos');
    }
    
    if (files.length > config.maxFiles) {
      throw new Error(`Máximo ${config.maxFiles} archivos permitidos`);
    }
    
    const results = [];
    
    for (const file of files) {
      try {
        const result = await this.uploadEventImage(file, options);
        results.push(result);
      } catch (error) {
        console.error(`❌ Error procesando archivo ${file.originalname}:`, error);
        results.push({
          error: error.message,
          filename: file.originalname
        });
      }
    }
    
    return results;
  }
  
  // ==========================================================================
  // UPLOAD DE USUARIOS
  // ==========================================================================
  
  /**
   * Procesa avatar de usuario
   * @param {Object} file - Archivo de multer
   * @param {string} userId - ID del usuario
   */
  static async uploadUserAvatar(file, userId) {
    try {
      this.validateFile(file);
      
      const filename = `avatar-${userId}`;
      const userDir = path.join(config.uploadDir, config.usersDir, userId);
      
      await fs.mkdir(userDir, { recursive: true });
      
      // Solo procesar tamaños necesarios para avatares
      const avatarSizes = {
        small: { width: 50, height: 50 },
        medium: { width: 150, height: 150 },
        large: { width: 300, height: 300 }
      };
      
      const processedImages = {};
      
      for (const [sizeName, dimensions] of Object.entries(avatarSizes)) {
        const outputPath = path.join(userDir, `${filename}-${sizeName}.webp`);
        
        await sharp(file.buffer || file.path)
          .resize(dimensions.width, dimensions.height, {
            fit: 'cover',
            position: 'center'
          })
          .webp({ quality: config.quality.webp })
          .toFile(outputPath);
        
        processedImages[sizeName] = `${filename}-${sizeName}.webp`;
      }
      
      // Eliminar archivo temporal
      if (file.path) {
        await fs.unlink(file.path).catch(() => {});
      }
      
      const urls = this.generateImageUrls(config.usersDir, userId, processedImages);
      
      console.log(`👤 Avatar procesado para usuario: ${userId}`);
      
      return {
        filename,
        sizes: urls.sizes,
        metadata: {
          originalName: file.originalname,
          uploadedAt: new Date()
        }
      };
      
    } catch (error) {
      console.error('❌ Error procesando avatar:', error);
      throw error;
    }
  }
  
  // ==========================================================================
  // PROCESAMIENTO DE IMÁGENES
  // ==========================================================================
  
  /**
   * Procesa imagen en múltiples tamaños
   */
  static async processImageSizes(file, outputDir, filename) {
    const processedImages = {};
    const baseName = filename.split('.')[0];
    
    // Obtener información de la imagen original
    const imageInfo = await sharp(file.buffer || file.path).metadata();
    
    for (const [sizeName, dimensions] of Object.entries(config.sizes)) {
      try {
        let outputPath;
        let processor = sharp(file.buffer || file.path);
        
        if (dimensions) {
          // Redimensionar imagen
          processor = processor.resize(dimensions.width, dimensions.height, {
            fit: 'cover',
            position: 'center',
            withoutEnlargement: true
          });
          
          outputPath = path.join(outputDir, `${baseName}-${sizeName}.webp`);
        } else {
          // Imagen original optimizada
          outputPath = path.join(outputDir, `${baseName}-original.webp`);
        }
        
        // Aplicar optimizaciones
        processor = processor.webp({ 
          quality: config.quality.webp,
          effort: 6
        });
        
        // Aplicar watermark si está habilitado
        if (config.watermark.enabled && sizeName !== 'thumbnail') {
          processor = await this.applyWatermark(processor, dimensions);
        }
        
        await processor.toFile(outputPath);
        
        processedImages[sizeName] = path.basename(outputPath);
        
      } catch (error) {
        console.error(`❌ Error procesando tamaño ${sizeName}:`, error);
      }
    }
    
    return processedImages;
  }
  
  /**
   * Aplica watermark a la imagen
   */
  static async applyWatermark(processor, dimensions) {
    try {
      if (!await this.fileExists(config.watermark.path)) {
        return processor;
      }
      
      const watermarkSize = Math.min(dimensions?.width || 200, 200);
      
      const watermark = await sharp(config.watermark.path)
        .resize(watermarkSize, null, { withoutEnlargement: true })
        .png({ quality: 80 })
        .toBuffer();
      
      return processor.composite([{
        input: watermark,
        gravity: config.watermark.position,
        blend: 'over'
      }]);
      
    } catch (error) {
      console.error('⚠️ Error aplicando watermark:', error);
      return processor;
    }
  }
  
  // ==========================================================================
  // UTILIDADES
  // ==========================================================================
  
  /**
   * Valida archivo antes de procesar
   */
  static validateFile(file) {
    if (!file) {
      throw new Error('No se proporcionó archivo');
    }
    
    if (file.size > config.maxFileSize) {
      throw new Error(`Archivo muy grande. Máximo ${config.maxFileSize / 1024 / 1024}MB`);
    }
    
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (!config.allowedFormats.includes(ext)) {
      throw new Error(`Formato no permitido. Formatos válidos: ${config.allowedFormats.join(', ')}`);
    }
    
    // Validar que sea realmente una imagen
    if (!file.mimetype.startsWith('image/')) {
      throw new Error('El archivo debe ser una imagen');
    }
  }
  
  /**
   * Genera nombre único para archivo
   */
  static generateFilename(originalName) {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const random = crypto.randomBytes(6).toString('hex');
    return `${timestamp}-${random}${ext}`;
  }
  
  /**
   * Genera URLs públicas para las imágenes
   */
  static generateImageUrls(type, identifier, processedImages) {
    const baseUrl = config.cdnUrl || '/uploads';
    const urls = {
      sizes: {}
    };
    
    for (const [sizeName, filename] of Object.entries(processedImages)) {
      const url = `${baseUrl}/${type}/${identifier}/${filename}`;
      
      if (sizeName === 'original') {
        urls.original = url;
      } else {
        urls.sizes[sizeName] = url;
      }
    }
    
    return urls;
  }
  
  /**
   * Verifica si un archivo existe
   */
  static async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
  
  // ==========================================================================
  // GESTIÓN DE ARCHIVOS
  // ==========================================================================
  
  /**
   * Elimina imágenes de un evento
   */
  static async deleteEventImages(filename) {
    try {
      const eventDir = path.join(config.uploadDir, config.eventsDir, filename);
      
      if (await this.fileExists(eventDir)) {
        await fs.rmdir(eventDir, { recursive: true });
        console.log(`🗑️ Imágenes de evento eliminadas: ${filename}`);
      }
      
    } catch (error) {
      console.error('❌ Error eliminando imágenes de evento:', error);
    }
  }
  
  /**
   * Elimina avatar de usuario
   */
  static async deleteUserAvatar(userId) {
    try {
      const userDir = path.join(config.uploadDir, config.usersDir, userId);
      const files = await fs.readdir(userDir).catch(() => []);
      
      for (const file of files) {
        if (file.startsWith('avatar-')) {
          await fs.unlink(path.join(userDir, file)).catch(() => {});
        }
      }
      
      console.log(`🗑️ Avatar eliminado para usuario: ${userId}`);
      
    } catch (error) {
      console.error('❌ Error eliminando avatar:', error);
    }
  }
  
  /**
   * Limpia archivos temporales antiguos
   */
  static async cleanupTempFiles(olderThanHours = 24) {
    try {
      const tempDir = path.join(config.uploadDir, config.tempDir);
      const files = await fs.readdir(tempDir).catch(() => []);
      
      const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
      let deletedCount = 0;
      
      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stat = await fs.stat(filePath).catch(() => null);
        
        if (stat && stat.birthtime.getTime() < cutoffTime) {
          await fs.unlink(filePath).catch(() => {});
          deletedCount++;
        }
      }
      
      if (deletedCount > 0) {
        console.log(`🧹 ${deletedCount} archivos temporales eliminados`);
      }
      
    } catch (error) {
      console.error('❌ Error limpiando archivos temporales:', error);
    }
  }
  
  /**
   * Obtiene estadísticas de almacenamiento
   */
  static async getStorageStats() {
    try {
      const stats = {
        events: { count: 0, size: 0 },
        users: { count: 0, size: 0 },
        temp: { count: 0, size: 0 },
        total: { count: 0, size: 0 }
      };
      
      const dirs = [
        { name: 'events', path: path.join(config.uploadDir, config.eventsDir) },
        { name: 'users', path: path.join(config.uploadDir, config.usersDir) },
        { name: 'temp', path: path.join(config.uploadDir, config.tempDir) }
      ];
      
      for (const dir of dirs) {
        const { count, size } = await this.getDirStats(dir.path);
        stats[dir.name] = { count, size };
        stats.total.count += count;
        stats.total.size += size;
      }
      
      return stats;
      
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
      return null;
    }
  }
  
  /**
   * Obtiene estadísticas de un directorio
   */
  static async getDirStats(dirPath) {
    try {
      const files = await fs.readdir(dirPath, { withFileTypes: true }).catch(() => []);
      let count = 0;
      let size = 0;
      
      for (const file of files) {
        if (file.isFile()) {
          count++;
          const stat = await fs.stat(path.join(dirPath, file.name)).catch(() => ({ size: 0 }));
          size += stat.size;
        } else if (file.isDirectory()) {
          const subStats = await this.getDirStats(path.join(dirPath, file.name));
          count += subStats.count;
          size += subStats.size;
        }
      }
      
      return { count, size };
      
    } catch (error) {
      return { count: 0, size: 0 };
    }
  }
  
  // ==========================================================================
  // MÉTODOS DE OPTIMIZACIÓN
  // ==========================================================================
  
  /**
   * Optimiza imagen existente
   */
  static async optimizeExistingImage(imagePath) {
    try {
      const tempPath = `${imagePath}.temp`;
      
      await sharp(imagePath)
        .webp({ quality: config.quality.webp, effort: 6 })
        .toFile(tempPath);
      
      await fs.rename(tempPath, imagePath.replace(/\.[^.]+$/, '.webp'));
      
      if (path.extname(imagePath) !== '.webp') {
        await fs.unlink(imagePath).catch(() => {});
      }
      
      console.log(`🔧 Imagen optimizada: ${imagePath}`);
      
    } catch (error) {
      console.error('❌ Error optimizando imagen:', error);
    }
  }
  
  /**
   * Convierte imágenes a formato WebP
   */
  static async convertToWebP(inputPath, outputPath = null) {
    try {
      const output = outputPath || inputPath.replace(/\.[^.]+$/, '.webp');
      
      await sharp(inputPath)
        .webp({ quality: config.quality.webp })
        .toFile(output);
      
      return output;
      
    } catch (error) {
      console.error('❌ Error convirtiendo a WebP:', error);
      throw error;
    }
  }
}

// ==========================================================================
// INICIALIZACIÓN AUTOMÁTICA
// ==========================================================================

// Inicializar el servicio al cargar el módulo
ImageUploadService.initialize().catch(console.error);

// Cleanup automático cada 6 horas
setInterval(() => {
  ImageUploadService.cleanupTempFiles().catch(console.error);
}, 6 * 60 * 60 * 1000);

module.exports = ImageUploadService;