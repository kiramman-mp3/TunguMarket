import cron from 'node-cron';
import pool from '../config/db.js';

// Ejecutar cada primero de mes a las 00:00 (0 0 1 * *)
// Para propósitos de testing se podría usar `* * * * *` para cada minuto
const initCronJobs = () => {
  cron.schedule('0 0 1 * *', async () => {
    console.log('[CRON] Iniciando revisión de saldos negativos de fin de mes...');
    try {
      const result = await pool.query(
        `UPDATE users 
         SET blocked_for_debt = true 
         WHERE balance < 0 AND blocked_for_debt = false
         RETURNING id`
      );

      console.log(`[CRON] ${result.rowCount} usuarios han sido bloqueados por deudas (saldo negativo).`);
    } catch (error) {
      console.error('[CRON] Error ejecutando la revisión de saldos:', error);
    }
  });

  console.log('[CRON] Sistema de tareas programadas inicializado.');
};

export default initCronJobs;
