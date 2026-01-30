const LIMITES = {
  // Galería de fotos
  MAX_FOTOS_POR_PROVEEDOR: 3,
  MAX_TAMANO_FOTO_MB: 5,
  MAX_TAMANO_FOTO_BYTES: 5 * 1024 * 1024,
  
  // Formatos permitidos
  FORMATOS_IMAGEN_PERMITIDOS: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  EXTENSIONES_PERMITIDAS: ['.jpg', '.jpeg', '.png', '.webp'],
  
  // Promociones
  MAX_PROMOCIONES_ACTIVAS: 5, // ← Límite de promociones activas
  
  // Otros límites
  MAX_SERVICIOS_POR_PROVEEDOR: 20,
  
  // Paginación
  ITEMS_POR_PAGINA: 20
};

const MENSAJES = {
  LIMITE_FOTOS_EXCEDIDO: `Has alcanzado el límite máximo de ${LIMITES.MAX_FOTOS_POR_PROVEEDOR} fotos en tu galería`,
  LIMITE_PROMOCIONES_EXCEDIDO: `Has alcanzado el límite máximo de ${LIMITES.MAX_PROMOCIONES_ACTIVAS} promociones activas`,
  FORMATO_INVALIDO: 'Formato de imagen no permitido. Solo se aceptan: JPG, PNG, WEBP',
  TAMANO_EXCEDIDO: `El tamaño de la imagen no debe superar ${LIMITES.MAX_TAMANO_FOTO_MB}MB`
};

module.exports = {
  LIMITES,
  MENSAJES
};