const language = require('@google-cloud/language');

// Inicializar cliente con API Key
const client = new language.LanguageServiceClient({
  apiKey: process.env.GOOGLE_API_KEY
});

/**
 * Analiza el sentimiento de un texto usando Google Cloud Natural Language API
 * @param {string} texto - El texto a analizar
 * @returns {Promise<Object>} - Objeto con score, sentimiento y calificación
 */
async function analizarSentimiento(texto) {
  try {
    // Preparar el documento para análisis
    const document = {
      content: texto,
      type: 'PLAIN_TEXT',
      language: 'es' // Español
    };

    // Realizar análisis de sentimiento
    const [result] = await client.analyzeSentiment({ document });
    const sentiment = result.documentSentiment;

    // Score: -1.0 (muy negativo) a 1.0 (muy positivo)
    const score = sentiment.score;

    // Determinar categoría de sentimiento
    let categoria;
    if (score >= 0.25) {
      categoria = 'positivo';
    } else if (score <= -0.25) {
      categoria = 'negativo';
    } else {
      categoria = 'neutro';
    }

    // Convertir score a calificación de 0 a 1
    // Score va de -1 a 1, lo convertimos a 0 a 1
    const calificacion = (score + 1) / 2;

    return {
      score: score,
      sentimiento: categoria,
      calificacion: parseFloat(calificacion.toFixed(2)),
      magnitude: sentiment.magnitude // Indica qué tan emocional es el texto
    };

  } catch (error) {
    console.error('Error al analizar sentimiento:', error);
    
    // Si falla la API, hacer un análisis básico por palabras clave
    return analizarSentimientoBasico(texto);
  }
}

/**
 * Análisis de sentimiento básico (fallback si falla Google API)
 * @param {string} texto
 * @returns {Object}
 */
function analizarSentimientoBasico(texto) {
  const textoLower = texto.toLowerCase();
  
  // Palabras positivas en español
  const palabrasPositivas = [
    'excelente', 'bueno', 'genial', 'increíble', 'maravilloso',
    'perfecto', 'recomiendo', 'profesional', 'calidad', 'satisfecho',
    'feliz', 'contento', 'gustó', 'encantó', 'super', 'espectacular'
  ];
  
  // Palabras negativas en español
  const palabrasNegativas = [
    'malo', 'pésimo', 'horrible', 'terrible', 'desastre',
    'decepción', 'nunca', 'peor', 'lento', 'caro', 'sucio',
    'grosero', 'mala', 'no recomiendo', 'insatisfecho', 'molesto'
  ];
  
  let scorePositivo = 0;
  let scoreNegativo = 0;
  
  palabrasPositivas.forEach(palabra => {
    if (textoLower.includes(palabra)) scorePositivo++;
  });
  
  palabrasNegativas.forEach(palabra => {
    if (textoLower.includes(palabra)) scoreNegativo++;
  });
  
  const scoreTotal = scorePositivo - scoreNegativo;
  let sentimiento;
  let calificacion;
  
  if (scoreTotal > 0) {
    sentimiento = 'positivo';
    calificacion = 0.75;
  } else if (scoreTotal < 0) {
    sentimiento = 'negativo';
    calificacion = 0.25;
  } else {
    sentimiento = 'neutro';
    calificacion = 0.5;
  }
  
  return {
    score: scoreTotal,
    sentimiento,
    calificacion,
    magnitude: 1,
    metodo: 'basico' // Indica que se usó el método básico
  };
}

module.exports = {
  analizarSentimiento
};