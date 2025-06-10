import express from 'express';
import pool from '../db';
import { verificarToken } from '../middlewares/authMiddleware';
import { verificarAdmin } from '../middlewares/verificarAdmin';
import { ResponseUtil } from '../utils/response';

const router = express.Router();

// Helper para convertir strings tipo boolean a boolean real
function parseBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return false;
}

// ✅ Verificar si el usuario es admin - CORREGIDO
router.get('/es-admin', verificarToken, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const result = await pool.query('SELECT es_admin FROM users WHERE id = $1', [userId]);

    const esAdmin = parseBoolean(result.rows[0]?.es_admin);

    console.log('DEBUG es-admin:', {
      userId,
      rawValue: result.rows[0]?.es_admin,
      parsedValue: esAdmin,
      type: typeof result.rows[0]?.es_admin
    });

    // ✅ Estructura consistente con frontend
    ResponseUtil.success(res, { es_admin: esAdmin });
  } catch (error) {
    console.error('Error al verificar admin:', error);
    ResponseUtil.error(res, 'Error interno', 500);
  }
});

// ✅ Obtener todos los usuarios - CORREGIDO
router.get('/usuarios', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nombre as full_name, email, cedula_number, phone, bloqueado, created_at 
       FROM users`
    );

    const usuarios = result.rows.map(user => ({
      ...user,
      bloqueado: parseBoolean(user.bloqueado)
    }));

    // ✅ Estructura consistente
    ResponseUtil.success(res, { usuarios });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    ResponseUtil.error(res, 'No se pudieron obtener los usuarios', 500);
  }
});

// Bloquear usuario
router.patch('/usuarios/:id/bloquear', verificarToken, verificarAdmin, async (req, res) => {
  try {
    await pool.query("UPDATE users SET bloqueado = 'True' WHERE id = $1", [req.params.id]);
    ResponseUtil.success(res, null, 'Usuario bloqueado');
  } catch (error) {
    console.error('Error al bloquear usuario:', error);
    ResponseUtil.error(res, 'No se pudo bloquear el usuario', 500);
  }
});

// Desbloquear usuario
router.patch('/usuarios/:id/desbloquear', verificarToken, verificarAdmin, async (req, res) => {
  try {
    await pool.query("UPDATE users SET bloqueado = 'False' WHERE id = $1", [req.params.id]);
    ResponseUtil.success(res, null, 'Usuario desbloqueado');
  } catch (error) {
    console.error('Error al desbloquear usuario:', error);
    ResponseUtil.error(res, 'No se pudo desbloquear el usuario', 500);
  }
});

// ✅ Obtener entradas publicadas - CORREGIDO
router.get('/entradas', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.id, t.precio, t.archivo, u.nombre as vendedor, e.name as evento
       FROM tickets t
       JOIN users u ON t.user_id = u.id
       JOIN events e ON t.event_id = e.id`
    );
    
    // ✅ Estructura consistente
    ResponseUtil.success(res, { entradas: result.rows });
  } catch (error) {
    console.error('Error al obtener entradas:', error);
    ResponseUtil.error(res, 'No se pudieron obtener las entradas', 500);
  }
});

// Eliminar entrada
router.delete('/entradas/:id', verificarToken, verificarAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM tickets WHERE id = $1', [req.params.id]);
    ResponseUtil.success(res, null, 'Entrada eliminada');
  } catch (error) {
    console.error('Error al eliminar entrada:', error);
    ResponseUtil.error(res, 'No se pudo eliminar la entrada', 500);
  }
});

// ✅ Agregar evento - NUEVO
router.post('/eventos', verificarToken, verificarAdmin, async (req, res) => {
  try {
    const { name, date, location } = req.body;
    const result = await pool.query(
      'INSERT INTO events (name, date, location) VALUES ($1, $2, $3) RETURNING *',
      [name, date, location]
    );
    ResponseUtil.success(res, { evento: result.rows[0] }, 'Evento creado');
  } catch (error) {
    console.error('Error al crear evento:', error);
    ResponseUtil.error(res, 'No se pudo crear el evento', 500);
  }
});

export default router;