import { Request, Response, NextFunction } from 'express';
import pool from '../db';
import { ResponseUtil } from '../utils/response';

interface AuthRequest extends Request {
  userId?: string;
}

export const verificarKYC = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userId = req.userId;

  if (!userId) {
    ResponseUtil.error(res, 'No autorizado', 401);
    return;
  }

  try {
    const result = await pool.query('SELECT kyc_status FROM users WHERE id = $1', [userId]);
    const estado = result.rows?.[0]?.kyc_status || 'pendiente';

    if (estado !== 'aprobado') {
      ResponseUtil.error(res, 'Tu identidad aún no fue verificada', 403);
      return;
    }

    next();
  } catch (err) {
    console.error('❌ Error en verificarKYC:', err);
    ResponseUtil.error(res, 'Error interno del servidor', 500);
  }
};
