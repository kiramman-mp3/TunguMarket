import WithdrawalModel from '../models/withdrawalModel.js';
import UserModel from '../models/userModel.js';
import SellerBankAccountModel from '../models/sellerBankAccountModel.js';
import pool from '../config/db.js';
import SSEService from '../services/sseService.js';
import EmailService from '../services/emailService.js';
import WalletModel from '../models/walletModel.js';

class WithdrawalController {
  // Método antiguo - mantener para compatibilidad
  static async requestWithdrawal(req, res) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const userId = req.user.id;
      const { amount, bankInfo } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Monto inválido' });
      }

      // Intentar descontar saldo de forma atómica
      const updateResult = await client.query(
        'UPDATE users SET balance = balance - $1 WHERE id = $2 AND balance >= $1 RETURNING balance',
        [amount, userId]
      );

      if (updateResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Saldo insuficiente para procesar el retiro' });
      }

      // Crear solicitud de retiro
      const withdrawal = await WithdrawalModel.create(userId, amount, bankInfo);

      await client.query('COMMIT');

      res.status(201).json({
        message: 'Solicitud de retiro enviada',
        data: withdrawal
      });
    } catch (error) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: error.message });
    } finally {
      client.release();
    }
  }

  // Nuevo método: Crear retiro con cuenta bancaria guardada
  static async createWithdrawal(req, res) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const userId = req.user.id;
      const { amount, bank_account_id } = req.body;

      // Validar monto
      if (!amount || amount <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Monto inválido' });
      }

      // Validar cuenta bancaria existe y pertenece al usuario
      const bankAccount = await SellerBankAccountModel.findById(bank_account_id, userId);
      if (!bankAccount) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Cuenta bancaria no encontrada' });
      }

      // Obtener saldo actual del usuario
      const userResult = await client.query(
        'SELECT balance FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const currentBalance = parseFloat(userResult.rows[0].balance);

      // Validar saldo suficiente
      if (currentBalance < amount) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          error: 'Saldo insuficiente',
          saldo_disponible: currentBalance,
          monto_solicitado: amount
        });
      }

      // Crear retiro en estado pendiente
      const withdrawalResult = await client.query(
        `INSERT INTO withdrawals (user_id, amount, bank_account_id, status, created_at, updated_at)
         VALUES ($1, $2, $3, 'pendiente', NOW(), NOW())
         RETURNING *`,
        [userId, amount, bank_account_id]
      );

      const withdrawal = withdrawalResult.rows[0];

      await client.query('COMMIT');

      // Notificar a admin (fuera de transacción)
      try {
        const adminNotification = {
          type: 'new_withdrawal',
          user_id: userId,
          withdrawal_id: withdrawal.id,
          amount: amount,
          banco: bankAccount.banco,
          message: `Nuevo retiro solicitado: ${bankAccount.banco} - $${amount}`
        };
        
        await SSEService.notifyAdmins(adminNotification);
        
        // Enviar email a admins
        // await EmailService.sendNewWithdrawalEmail(withdrawal, bankAccount, userEmail);
      } catch (notifError) {
        // Log pero no romper el flujo
        console.error('Error al notificar:', notifError.message);
      }

      res.status(201).json({
        message: 'Solicitud de retiro enviada exitosamente',
        data: {
          id: withdrawal.id,
          amount: withdrawal.amount,
          status: withdrawal.status,
          created_at: withdrawal.created_at,
          banco: bankAccount.banco
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: error.message });
    } finally {
      client.release();
    }
  }

  // Obtener retiros del vendedor
  static async getWithdrawals(req, res) {
    try {
      const userId = req.user.id;
      const withdrawals = await WithdrawalModel.getByUser(userId);
      res.status(200).json({ data: withdrawals });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Admin: Obtener retiros pendientes
  static async getPendingWithdrawals(req, res) {
    try {
      const withdrawals = await WithdrawalModel.findPending();
      res.status(200).json({
        message: 'Retiros pendientes',
        data: withdrawals,
        count: withdrawals.length
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Admin: Obtener todos los retiros con filtros
  static async getAllWithdrawals(req, res) {
    try {
      const { status, user_id, from_date, to_date } = req.query;

      const filters = {};
      if (status) filters.status = status;
      if (user_id) filters.userId = user_id;
      if (from_date) filters.fromDate = from_date;
      if (to_date) filters.toDate = to_date;

      const withdrawals = await WithdrawalModel.findWithFilters(filters);
      res.status(200).json({
        message: 'Retiros obtenidos',
        data: withdrawals,
        count: withdrawals.length
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Admin: Aprobar retiro CON DB TRANSACTION
  static async approveWithdrawal(req, res) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { id } = req.params;
      const adminId = req.user.id;

      // Obtener details del retiro
      const withdrawalResult = await client.query(
        'SELECT * FROM withdrawals WHERE id = $1',
        [id]
      );

      if (withdrawalResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Retiro no encontrado' });
      }

      const withdrawal = withdrawalResult.rows[0];

      // Validar que está en estado pendiente
      if (withdrawal.status !== 'pendiente') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Retiro ya ha sido ${withdrawal.status}` });
      }

      const userId = withdrawal.user_id;

      // Verificar saldo en la wallet del usuario (seguridad)
      const userResult = await client.query(
        'SELECT balance FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const currentBalance = parseFloat(userResult.rows[0].balance);

      // Validar que hay suficiente saldo para descontar
      // (en teoría ya se descontó al crear la solicitud, pero validamos de nuevo)
      if (currentBalance < withdrawal.amount) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          error: 'Saldo insuficiente para procesar este retiro (posible cambio de balance)',
          saldo_actual: currentBalance,
          monto_retiro: withdrawal.amount
        });
      }

      // ===== OPERACIONES ATÓMICAS =====

      // 1. Descontar del balance del usuario
      const updateUserResult = await client.query(
        'UPDATE users SET balance = balance - $1 WHERE id = $2 RETURNING balance',
        [withdrawal.amount, userId]
      );

      if (updateUserResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(500).json({ error: 'Error al actualizar balance' });
      }

      // 2. Crear transacción en wallet_transactions (historial)
      const walletTransactionResult = await client.query(
        `INSERT INTO wallet_transactions (user_id, withdrawal_id, type, amount, status, description, created_at)
         VALUES ($1, $2, 'withdrawal', $3, 'completed', $4, NOW())
         RETURNING *`,
        [userId, id, withdrawal.amount, `Retiro a ${withdrawal.banco || 'cuenta asociada'} aprobado`]
      );

      // 3. Actualizar withdrawal con validación
      const updateWithdrawalResult = await client.query(
        `UPDATE withdrawals
         SET status = 'aprobado', validated_by = $1, validated_at = NOW(), updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [adminId, id]
      );

      const approvedWithdrawal = updateWithdrawalResult.rows[0];

      // ===== FIN OPERACIONES ATÓMICAS =====

      await client.query('COMMIT');

      // Notificaciones (fuera de transacción)
      try {
        // Notificar al vendedor
        const vendorNotification = {
          type: 'withdrawal_approved',
          user_id: userId,
          withdrawal_id: id,
          amount: withdrawal.amount,
          message: `Tu retiro de $${withdrawal.amount} ha sido aprobado`
        };

        await SSEService.sendToUser(userId, vendorNotification);

        // Email al vendedor
        // const vendorData = await UserModel.findById(userId);
        // await EmailService.sendWithdrawalApprovedEmail(vendorData, withdrawal);
      } catch (notifError) {
        console.error('Error al notificar al vendedor:', notifError.message);
      }

      res.status(200).json({
        message: 'Retiro aprobado exitosamente',
        data: {
          id: approvedWithdrawal.id,
          status: approvedWithdrawal.status,
          amount: approvedWithdrawal.amount,
          validated_at: approvedWithdrawal.validated_at,
          new_balance: updateUserResult.rows[0].balance
        }
      });

    } catch (error) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: error.message });
    } finally {
      client.release();
    }
  }

  // Admin: Rechazar retiro
  static async rejectWithdrawal(req, res) {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      const adminId = req.user.id;
      const { reason } = req.body;

      if (!reason || reason.trim() === '') {
        return res.status(400).json({ error: 'Motivo del rechazo es obligatorio' });
      }

      // Obtener details del retiro
      const withdrawalResult = await client.query(
        'SELECT * FROM withdrawals WHERE id = $1',
        [id]
      );

      if (withdrawalResult.rows.length === 0) {
        return res.status(404).json({ error: 'Retiro no encontrado' });
      }

      const withdrawal = withdrawalResult.rows[0];
      const userId = withdrawal.user_id;

      // Validar que está en estado pendiente
      if (withdrawal.status !== 'pendiente') {
        return res.status(400).json({ error: `Retiro ya ha sido ${withdrawal.status}` });
      }

      // Actualizar withdrawal
      const updateResult = await client.query(
        `UPDATE withdrawals
         SET status = 'rechazado', validated_by = $1, validation_notes = $2, validated_at = NOW(), updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [adminId, reason, id]
      );

      const rejectedWithdrawal = updateResult.rows[0];

      res.status(200).json({
        message: 'Retiro rechazado',
        data: {
          id: rejectedWithdrawal.id,
          status: rejectedWithdrawal.status,
          validation_notes: rejectedWithdrawal.validation_notes,
          validated_at: rejectedWithdrawal.validated_at
        }
      });

      // Notificación al vendedor (fuera de transacción)
      try {
        const vendorNotification = {
          type: 'withdrawal_rejected',
          user_id: userId,
          withdrawal_id: id,
          amount: withdrawal.amount,
          reason: reason,
          message: `Tu solicitud de retiro de $${withdrawal.amount} ha sido rechazada`
        };

        await SSEService.sendToUser(userId, vendorNotification);

        // Email al vendedor con motivo
        // const vendorData = await UserModel.findById(userId);
        // await EmailService.sendWithdrawalRejectedEmail(vendorData, withdrawal, reason);
      } catch (notifError) {
        console.error('Error al notificar al vendedor:', notifError.message);
      }

    } catch (error) {
      res.status(500).json({ error: error.message });
    } finally {
      client.release();
    }
  }
}

export default WithdrawalController;
