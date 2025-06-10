import express from 'express';
import multer from 'multer';
import { verificarToken } from '../middlewares/authMiddleware';
import pool from '../db';
import { ResponseUtil } from '../utils/response';
import { CreateTicketDto, Ticket } from '../types/ticket.types';

const router = express.Router();

// Configuración de subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

// ✅ Publicar entrada - CORREGIDO
router.post('/nuevo', verificarToken, upload.single('archivo'), async (req, res) => {
  try {
    const { event_id, precio }: CreateTicketDto = req.body;
    const archivo = req.file?.filename;
    const userId = (req as any).userId;

    const query = `
      INSERT INTO tickets (user_id, event_id, precio, archivo)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const values = [userId, event_id, precio, archivo];
    const result = await pool.query(query, values);

    // ✅ Estructura consistente
    ResponseUtil.success(res, { ticket: result.rows[0] }, 'Entrada publicada exitosamente', 201);
  } catch (error) {
    console.error('Error al guardar ticket:', error);
    ResponseUtil.error(res, 'No se pudo guardar la entrada', 500);
  }
});

// ✅ Obtener entradas por evento - CORREGIDO
router.get('/por-evento/:id', async (req, res) => {
  try {
    const eventId = req.params.id;
    const result = await pool.query(`
      SELECT 
        t.id, t.precio, u.nombre AS vendedor
      FROM tickets t
      JOIN users u ON t.user_id = u.id
      WHERE t.event_id = $1
      ORDER BY t.creado_en DESC;
    `, [eventId]);

    // ✅ Estructura consistente
    ResponseUtil.success(res, { tickets: result.rows });
  } catch (error) {
    console.error('Error al obtener reventas por evento:', error);
    ResponseUtil.error(res, 'No se pudieron obtener las entradas', 500);
  }
});

// ✅ Entradas del usuario logueado - CORREGIDO
router.get('/mias', verificarToken, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const result = await pool.query(`
      SELECT 
        t.id, t.precio, t.archivo,
        e.name AS evento, e.date, e.location
      FROM tickets t
      JOIN events e ON t.event_id = e.id
      WHERE t.user_id = $1
      ORDER BY t.creado_en DESC;
    `, [userId]);

    // ✅ Estructura consistente
    ResponseUtil.success(res, { tickets: result.rows });
  } catch (error) {
    console.error('Error al obtener tickets del usuario:', error);
    ResponseUtil.error(res, 'No se pudieron obtener tus entradas', 500);
  }
});

// ✅ Eliminar entrada - CORREGIDO
router.delete('/eliminar/:id', verificarToken, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const ticketId = req.params.id;

    const check = await pool.query(`SELECT * FROM tickets WHERE id = $1 AND user_id = $2`, [ticketId, userId]);
    if (check.rowCount === 0) {
      ResponseUtil.error(res, 'No autorizado para eliminar esta entrada', 403);
      return;
    }

    await pool.query(`DELETE FROM tickets WHERE id = $1`, [ticketId]);
    
    // ✅ Estructura consistente
    ResponseUtil.success(res, null, 'Entrada eliminada');
  } catch (error) {
    console.error('Error al eliminar entrada:', error);
    ResponseUtil.error(res, 'No se pudo eliminar la entrada', 500);
  }
});

export default router;