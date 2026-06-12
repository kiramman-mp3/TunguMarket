import crypto from 'crypto';
import pool from '../config/db.js';

class PaymentValidator {
  /**
   * Valida el monto de la transferencia
   * @param {number} amount - Monto a validar
   * @param {number} expectedAmount - Monto esperado de la orden
   * @returns {object} { isValid: boolean, error?: string }
   */
  validateAmount(amount, expectedAmount) {
    if (!amount || amount <= 0) {
      return {
        isValid: false,
        error: 'El monto debe ser mayor a 0'
      };
    }

    // Permitir pequeñas diferencias por comisiones (hasta 2%)
    const tolerance = expectedAmount * 0.02;
    if (amount < expectedAmount - tolerance || amount > expectedAmount + tolerance) {
      return {
        isValid: false,
        error: `El monto no coincide. Esperado: ${expectedAmount}, Recibido: ${amount}`
      };
    }

    return { isValid: true };
  }

  /**
   * Valida el formato del comprobante
   * @param {string} receiptUrl - URL del comprobante
   * @returns {object} { isValid: boolean, error?: string }
   */
  validateReceiptFormat(receiptUrl) {
    if (!receiptUrl || typeof receiptUrl !== 'string') {
      return {
        isValid: false,
        error: 'URL del comprobante requerida'
      };
    }

    // Validar que sea una URL válida
    try {
      new URL(receiptUrl);
    } catch (e) {
      return {
        isValid: false,
        error: 'URL del comprobante inválida'
      };
    }

    // Validar que sea una imagen
    const validExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
    const hasValidExt = validExtensions.some(ext => receiptUrl.toLowerCase().includes(ext));
    
    if (!hasValidExt) {
      return {
        isValid: false,
        error: 'El comprobante debe ser imagen (JPG, PNG) o PDF'
      };
    }

    return { isValid: true };
  }

  /**
   * Valida que el comprobante sea reciente (últimas 24 horas)
   * @param {Date} receiptDate - Fecha del comprobante
   * @returns {object} { isValid: boolean, error?: string }
   */
  validateReceiptAge(receiptDate) {
    if (!receiptDate) {
      return {
        isValid: false,
        error: 'Fecha del comprobante requerida'
      };
    }

    const receipt = new Date(receiptDate);
    const now = new Date();
    const hoursOld = (now - receipt) / (1000 * 60 * 60);

    // Comprobante no puede ser más viejo de 24 horas
    if (hoursOld > 24) {
      return {
        isValid: false,
        error: 'El comprobante es muy antiguo. Máximo 24 horas.'
      };
    }

    // Comprobante no puede ser del futuro
    if (hoursOld < 0) {
      return {
        isValid: false,
        error: 'La fecha del comprobante no puede ser en el futuro'
      };
    }

    return { isValid: true };
  }

  /**
   * Valida los detalles del comprobante según el método de pago
   * @param {object} receiptData - Datos del comprobante
   * @param {string} paymentMethod - Método de pago ('transferencia', 'deposito', 'tarjeta')
   * @returns {object} { isValid: boolean, error?: string }
   */
  validateReceiptContent(receiptData, paymentMethod) {
    if (!receiptData) {
      return {
        isValid: false,
        error: 'Datos del comprobante requeridos'
      };
    }

    switch (paymentMethod.toLowerCase()) {
      case 'transferencia':
        if (!receiptData.transferenceNumber || !receiptData.bankName || !receiptData.accountNumber) {
          return {
            isValid: false,
            error: 'Transferencia: Número de transferencia, banco y cuenta requeridos'
          };
        }
        break;

      case 'deposito':
        if (!receiptData.depositNumber || !receiptData.bankName || !receiptData.depositDate) {
          return {
            isValid: false,
            error: 'Depósito: Número de comprobante, banco y fecha requeridos'
          };
        }
        break;

      case 'tarjeta':
        if (!receiptData.last4Digits || !receiptData.authCode) {
          return {
            isValid: false,
            error: 'Tarjeta: Últimos 4 dígitos y código de autorización requeridos'
          };
        }
        break;

      default:
        return {
          isValid: false,
          error: 'Método de pago no válido'
        };
    }

    return { isValid: true };
  }

  /**
   * Genera un hash del comprobante para detectar duplicados
   * @param {object} receiptData - Datos del comprobante
   * @returns {string} Hash SHA256 del comprobante
   */
  generateReceiptHash(receiptData) {
    const receiptString = JSON.stringify(receiptData);
    return crypto
      .createHash('sha256')
      .update(receiptString)
      .digest('hex');
  }

  /**
   * Verifica si el comprobante ya fue registrado
   * @param {string} receiptHash - Hash del comprobante
   * @param {string} userId - ID del usuario
   * @returns {Promise<object>} { isDuplicate: boolean, existingPayment?: object }
   */
  async checkDuplicateReceipt(receiptHash) {
    try {
      const result = await pool.query(
        `SELECT id, order_id, status, created_at 
         FROM payments 
         WHERE receipt_hash = $1`,
        [receiptHash]
      );

      if (result.rows.length > 0) {
        return {
          isDuplicate: true,
          existingPayment: result.rows[0]
        };
      }

      return { isDuplicate: false };
    } catch (err) {
      console.error('Error checking duplicate receipt:', err);
      throw err;
    }
  }

  /**
   * Valida un pago completo (método principal)
   * @param {object} paymentData - Datos del pago
   *   - orderId: ID de la orden
   *   - userId: ID del usuario
   *   - amount: Monto pagado
   *   - paymentMethod: Método de pago
   *   - receiptUrl: URL del comprobante
   *   - receiptData: Detalles del comprobante
   *   - receiptDate: Fecha del comprobante
   *   - expectedAmount: Monto esperado de la orden
   * @returns {Promise<object>} { isValid: boolean, errors: [], data?: { receiptHash, amount, paymentMethod } }
   */
  async validatePayment(paymentData) {
    const errors = [];

    // 1. Validar monto
    const amountValidation = this.validateAmount(
      paymentData.amount,
      paymentData.expectedAmount
    );
    if (!amountValidation.isValid) {
      errors.push(amountValidation.error);
    }

    // 2. Validar formato del comprobante
    const formatValidation = this.validateReceiptFormat(paymentData.receiptUrl);
    if (!formatValidation.isValid) {
      errors.push(formatValidation.error);
    }

    // 3. Validar antigüedad del comprobante
    const ageValidation = this.validateReceiptAge(paymentData.receiptDate);
    if (!ageValidation.isValid) {
      errors.push(ageValidation.error);
    }

    // 4. Validar contenido según método de pago
    const contentValidation = this.validateReceiptContent(
      paymentData.receiptData,
      paymentData.paymentMethod
    );
    if (!contentValidation.isValid) {
      errors.push(contentValidation.error);
    }

    if (errors.length > 0) {
      return {
        isValid: false,
        errors
      };
    }

    // 5. Generar hash y verificar duplicados
    const receiptHash = this.generateReceiptHash(paymentData.receiptData);
    const duplicateCheck = await this.checkDuplicateReceipt(receiptHash);

    if (duplicateCheck.isDuplicate) {
      const existingPayment = duplicateCheck.existingPayment;
      errors.push(
        `Comprobante duplicado. Ya existe un pago con este comprobante (${existingPayment.status}) en la orden ${existingPayment.order_id}`
      );
      return {
        isValid: false,
        errors
      };
    }

    return {
      isValid: true,
      errors: [],
      data: {
        receiptHash,
        amount: paymentData.amount,
        paymentMethod: paymentData.paymentMethod
      }
    };
  }
}

export default new PaymentValidator();
