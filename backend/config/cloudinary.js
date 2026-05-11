const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configurar Cloudinary con tus credenciales
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configurar almacenamiento para galería
const storageGaleria = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'eventosmx/galeria', // Carpeta en Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 1280, height: 720, crop: 'limit' }, // Redimensionar
      { quality: 'auto:good' } // Optimizar calidad
    ]
  }
});

// Configurar almacenamiento para logos
const storageLogo = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'eventosmx/logos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 400, height: 400, crop: 'limit' },
      { quality: 'auto:good' }
    ]
  }
});

// Middleware para subir galería (máximo 1 imagen por request)
const uploadGaleria = multer({
  storage: storageGaleria,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB máximo
  },
  fileFilter: (req, file, cb) => {
    // Validar tipo de archivo
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'), false);
    }
  }
}).single('foto'); // 'foto' es el nombre del campo en el FormData

// Middleware para subir logo
const uploadLogo = multer({
  storage: storageLogo,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB máximo
  }
}).single('logo');

// Función para eliminar imagen de Cloudinary
const eliminarImagen = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error al eliminar imagen de Cloudinary:', error);
    throw error;
  }
};

// Función para extraer public_id de una URL de Cloudinary
const extraerPublicId = (url) => {
  try {
    // URL ejemplo: https://res.cloudinary.com/demo/image/upload/v1234567890/eventosmx/galeria/foto123.jpg
    const matches = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
    return matches ? matches[1] : null;
  } catch (error) {
    console.error('Error al extraer public_id:', error);
    return null;
  }
};

module.exports = {
  cloudinary,
  uploadGaleria,
  uploadLogo,
  eliminarImagen,
  extraerPublicId
};