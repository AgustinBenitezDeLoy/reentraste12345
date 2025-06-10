import { Request, Response, NextFunction } from 'express';
import pool from '../db';
import { ResponseUtil } from '../utils/response';

interface AdminRequest extends Request {
  userId?: string;
}

function parseBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return false;
}

export const verificarAdmin = async (
  req: AdminRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      ResponseUtil.error(res, 'Usuario no autenticado', 401);
      return;
    }

    const result = await pool.query('SELECT es_admin FROM users WHERE id = $1', [userId]);

    const esAdmin = parseBoolean(result.rows[0]?.es_admin);

    if (result.rows.length === 0 || !esAdmin) {
      ResponseUtil.error(res, 'Acceso denegado: solo administradores', 403);
      return;
    }

    next();
  } catch (error) {
    console.error('Error verificando admin:', error);
    ResponseUtil.error(res, 'Error interno al verificar rol', 500);
  }
};