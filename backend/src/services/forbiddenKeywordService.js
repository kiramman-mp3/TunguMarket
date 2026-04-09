/**
 * Servicio de detección de palabras clave prohibidas
 * Detecta y marca productos peligrosos o prohibidos automáticamente
 */

class ForbiddenKeywordService {
  // Lista de palabras clave prohibidas (puedes expandir esto)
  static FORBIDDEN_KEYWORDS = [
    // Armas
    'arma', 'pistola', 'revolver', 'fusil', 'carabina', 'escopeta', 'explosivo', 'bomba', 'munición',
    'cuchillo', 'navaja', 'puñal', 'machete', 'hacha',
    // Drogas y sustancias controladas
    'droga', 'cocaína', 'heroína', 'marihuana', 'cannabis', 'mescalina', 'lsd', 'anfetamina',
    'metanfetamina', 'éxtasis', 'fentanilo', 'opioides', 'tramadol', 'morfina',
    // Productos falsificados y robados
    'falsificado', 'réplica', 'copia', 'piratería', 'robado', 'hurto', 'contrabando',
    // Explotación y abuso
    'explotación', 'abuso', 'esclavitud', 'trata', 'tráfico',
    // Contenido para adultos explícito
    'pornografía', 'contenido sexual', 'videoporno', 'material sexual',
    // Animales protegidos
    'marfil', 'pluma de águila', 'piel de felino', 'animal en peligro', 'especie protegida',
    // Veneno
    'veneno', 'cianuro', 'arsénico', 'estricnina', 'pesticida tóxico'
  ];

  /**
   * Detecta si un producto contiene palabras clave prohibidas
   * @param {string} title - Título del producto
   * @param {string} description - Descripción del producto
   * @returns {object} {isProhibited: boolean, flaggedKeywords: array}
   */
  static detectProhibitedContent(title, description) {
    const combinedText = `${title} ${description}`.toLowerCase();
    const flaggedKeywords = [];

    for (const keyword of this.FORBIDDEN_KEYWORDS) {
      // Búsqueda con límites de palabra para no capturar palabras parciales
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      if (regex.test(combinedText)) {
        flaggedKeywords.push(keyword);
      }
    }

    return {
      isProhibited: flaggedKeywords.length > 0,
      flaggedKeywords: [...new Set(flaggedKeywords)] // Remover duplicados
    };
  }

  /**
   * Genera motivo de bloqueo basado en palabras prohibidas detectadas
   * @param {array} flaggedKeywords - Array de palabras prohibidas
   * @returns {string} Motivo del bloqueo
   */
  static generateBlockReason(flaggedKeywords) {
    if (flaggedKeywords.length === 0) {
      return 'Producto contiene contenido prohibido';
    }

    const keywordsList = flaggedKeywords.slice(0, 3).join(', ');
    return `Producto contiene contenido prohibido: ${keywordsList}${flaggedKeywords.length > 3 ? ' e otros' : ''}`;
  }

  /**
   * Agrega nuevas palabras clave a la lista prohibida
   * SOLO ADMIN
   * @param {array} newKeywords - Array de nuevas palabras
   */
  static addForbiddenKeywords(newKeywords) {
    for (const keyword of newKeywords) {
      if (!this.FORBIDDEN_KEYWORDS.includes(keyword.toLowerCase())) {
        this.FORBIDDEN_KEYWORDS.push(keyword.toLowerCase());
      }
    }
  }

  /**
   * Removes forbidden keywords from the list
   * SOLO ADMIN
   * @param {array} keywordsToRemove - Array de palabras a remover
   */
  static removeForbiddenKeywords(keywordsToRemove) {
    for (const keyword of keywordsToRemove) {
      const index = this.FORBIDDEN_KEYWORDS.indexOf(keyword.toLowerCase());
      if (index > -1) {
        this.FORBIDDEN_KEYWORDS.splice(index, 1);
      }
    }
  }

  /**
   * Obtiene la lista actual de palabras prohibidas
   * @returns {array} Lista de palabras
   */
  static getForbiddenKeywords() {
    return [...this.FORBIDDEN_KEYWORDS];
  }
}

export default ForbiddenKeywordService;
