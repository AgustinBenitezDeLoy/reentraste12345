import express from 'express';
import pool from '../db';
import { ResponseUtil } from '../utils/response';

const router = express.Router();

// ✅ CORREGIDO - Estructura consistente con frontend
router.get('/todos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM events ORDER BY date ASC');
    
    // ✅ Frontend espera: data.data.events
    ResponseUtil.success(res, { events: result.rows });
  } catch (error) {
    console.error('Error al obtener eventos:', error);
    ResponseUtil.error(res, 'No se pudieron cargar los eventos', 500);
  }
});

export default router;