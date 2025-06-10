import express from 'express';
import pool from '../db';
import { verificarToken } from '../middlewares/authMiddleware';
import { ResponseUtil } from '../utils/response';

const router = express.Router();

// ✅ CORREGIDO - Estructura de respuesta consistente
router.get('/ingresos', verificarToken, async (req, res) => {
  try {
    const vendedorId = (req as any).userId;
    const dias = parseInt(req.query.dias as string || '7', 10);

    const result = await pool.query(`
      SELECT 
        DATE(fecha) as fecha,
        SUM(precio) as total
      FROM compras
      WHERE vendedor_id = $1 AND fecha >= NOW() - INTERVAL '${dias} days'
      GROUP BY DATE(fecha)
      ORDER BY DATE(fecha)
    `, [vendedorId]);

    const labels = result.rows.map(r => r.fecha.toISOString().slice(0, 10));
    const valores = result.rows.map(r => parseFloat(r.total));

    // ✅ Estructura consistente con frontend
    ResponseUtil.success(res, { labels, valores });
  } catch (error) {
    console.error('Error al cargar ingresos:', error);
    ResponseUtil.error(res, 'No se pudieron cargar los ingresos', 500);
  }
});

export default router;