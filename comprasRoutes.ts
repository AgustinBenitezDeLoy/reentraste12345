import express from 'express';
import { verificarToken } from '../middlewares/authMiddleware';
import pool from '../db';
import { ResponseUtil } from '../utils/response';

const router = express.Router();

// Ruta para comprar entrada
router.post('/comprar/:id', verificarToken, async (req, res) => {
  try {
    const ticketId = req.params.id;
    const compradorId = (req as any).userId;

    const result = await pool.query('SELECT * FROM tickets WHERE id = $1', [ticketId]);
    if (result.rowCount === 0) {
      ResponseUtil.error(res, 'La entrada ya no está disponible', 404);
      return;
    }

    const ticket = result.rows[0];

    await pool.query(`
      INSERT INTO compras (ticket_id, comprador_id, precio, archivo, event_id)
      VALUES ($1, $2, $3, $4, $5)
    `, [ticketId, compradorId, ticket.precio, ticket.archivo, ticket.event_id]);

    await pool.query('DELETE FROM tickets WHERE id = $1', [ticketId]);

    ResponseUtil.success(res, null, 'Compra realizada con éxito');
  } catch (error) {
    console.error('Error al procesar la compra:', error);
    ResponseUtil.error(res, 'No se pudo procesar la compra', 500);
  }
});

// Ruta para ver entradas compradas por el usuario
router.get('/mias', verificarToken, async (req, res) => {
  try {
    const userId = (req as any).userId;

    const result = await pool.query(`
      SELECT 
        c.id AS compra_id,
        e.name AS evento,
        e.date,
        e.location,
        c.precio,
        c.archivo
      FROM compras c
      JOIN events e ON c.event_id = e.id
      WHERE c.comprador_id = $1
      ORDER BY c.fecha DESC;
    `, [userId]);

    ResponseUtil.success(res, { tickets: result.rows });
  } catch (error) {
    console.error('Error al obtener compras del usuario:', error);
    ResponseUtil.error(res, 'No se pudieron obtener tus compras', 500);
  }
});

export default router;