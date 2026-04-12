import SellerBankAccountModel from '../models/sellerBankAccountModel.js';

class SellerBankAccountController {
  // Crear nueva cuenta bancaria
  static async createBankAccount(req, res) {
    try {
      const userId = req.user.id;
      const { banco, tipo_cuenta, numero_cuenta, titular, cedula_ruc, email_titular } = req.body;

      // Validar campos obligatorios
      if (!banco || !tipo_cuenta || !numero_cuenta || !titular || !cedula_ruc || !email_titular) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
      }

      // Validar formato de cédula/RUC ecuatoriano (básico)
      const cedulaRegex = /^\d{10,13}$/;
      if (!cedulaRegex.test(cedula_ruc)) {
        return res.status(400).json({ error: 'Cédula/RUC debe ser numérico (10-13 dígitos)' });
      }

      // Validar número de cuenta (solo números)
      const cuentaRegex = /^\d+$/;
      if (!cuentaRegex.test(numero_cuenta)) {
        return res.status(400).json({ error: 'Número de cuenta debe contener solo números' });
      }

      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email_titular)) {
        return res.status(400).json({ error: 'Email inválido' });
      }

      const account = await SellerBankAccountModel.create(userId, {
        banco,
        tipo_cuenta,
        numero_cuenta,
        titular,
        cedula_ruc,
        email_titular
      });

      res.status(201).json({
        message: 'Cuenta bancaria registrada exitosamente',
        data: account
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Obtener todas las cuentas del vendedor
  static async getBankAccounts(req, res) {
    try {
      const userId = req.user.id;
      const accounts = await SellerBankAccountModel.findByUserId(userId);
      
      res.status(200).json({
        message: 'Cuentas bancarias obtenidas',
        data: accounts
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Actualizar cuenta bancaria
  static async updateBankAccount(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { banco, tipo_cuenta, numero_cuenta, titular, cedula_ruc, email_titular } = req.body;

      // Validar que la cuenta pertenece al usuario
      const account = await SellerBankAccountModel.findById(id, userId);
      if (!account) {
        return res.status(404).json({ error: 'Cuenta bancaria no encontrada' });
      }

      // Validaciones básicas
      if (cedula_ruc && !/^\d{10,13}$/.test(cedula_ruc)) {
        return res.status(400).json({ error: 'Cédula/RUC inválido' });
      }

      if (numero_cuenta && !/^\d+$/.test(numero_cuenta)) {
        return res.status(400).json({ error: 'Número de cuenta debe contener solo números' });
      }

      if (email_titular && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email_titular)) {
        return res.status(400).json({ error: 'Email inválido' });
      }

      const updatedAccount = await SellerBankAccountModel.update(id, userId, {
        banco: banco || account.banco,
        tipo_cuenta: tipo_cuenta || account.tipo_cuenta,
        numero_cuenta: numero_cuenta || account.numero_cuenta,
        titular: titular || account.titular,
        cedula_ruc: cedula_ruc || account.cedula_ruc,
        email_titular: email_titular || account.email_titular
      });

      res.status(200).json({
        message: 'Cuenta bancaria actualizada',
        data: updatedAccount
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Marcar cuenta como predeterminada
  static async setDefaultBankAccount(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Validar que la cuenta pertenece al usuario
      const account = await SellerBankAccountModel.findById(id, userId);
      if (!account) {
        return res.status(404).json({ error: 'Cuenta bancaria no encontrada' });
      }

      const updatedAccount = await SellerBankAccountModel.setDefault(id, userId);

      res.status(200).json({
        message: 'Cuenta bancaria marcada como predeterminada',
        data: updatedAccount
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Eliminar cuenta bancaria
  static async deleteBankAccount(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Validar que la cuenta pertenece al usuario
      const account = await SellerBankAccountModel.findById(id, userId);
      if (!account) {
        return res.status(404).json({ error: 'Cuenta bancaria no encontrada' });
      }

      // Verificar que no hay retiros pendientes
      const hasPending = await SellerBankAccountModel.hasPendingWithdrawals(id);
      if (hasPending) {
        return res.status(400).json({ error: 'No se puede eliminar cuenta con retiros pendientes' });
      }

      await SellerBankAccountModel.delete(id, userId);

      res.status(200).json({
        message: 'Cuenta bancaria eliminada'
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default SellerBankAccountController;
