import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db';
import { ResponseUtil } from '../utils/response';

interface AuthRequest extends Request {
  userId?: string;
}

function parseBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return false;
}

export const verificarToken = async (
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    ResponseUtil.error(res, 'Token requerido', 401);
    return;
  }

  if (!authHeader.startsWith('Bearer ')) {
    ResponseUtil.error(res, 'Formato de token inválido', 401);
    return;
  }

  const token = authHeader.substring(7).trim();
  
  if (!token || token === 'null' || token === 'undefined') {
    ResponseUtil.error(res, 'Token inválido', 401);
    return;
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      ResponseUtil.error(res, 'Error de configuración del servidor', 500);
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as { userId: string };
    req.userId = decoded.userId;

    const result = await pool.query('SELECT bloqueado FROM users WHERE id = $1', [req.userId]);
    if (result.rows.length === 0) {
      ResponseUtil.error(res, 'Usuario no encontrado', 404);
      return;
    }

    const bloqueado = parseBoolean(result.rows[0]?.bloqueado);

    if (bloqueado) {
      ResponseUtil.error(res, 'Tu cuenta está bloqueada', 403);
      return;
    }

    next();
  } catch (err: any) {
    if (err.name === 'JsonWebTokenError') {
      ResponseUtil.error(res, 'Token inválido', 403);
    } else if (err.name === 'TokenExpiredError') {
      ResponseUtil.error(res, 'Token expirado', 401);
    } else {
      ResponseUtil.error(res, 'Error al verificar token', 500);
    }
  }
};