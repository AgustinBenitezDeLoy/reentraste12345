import { Request, Response } from 'express';
import pool from '../db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { CreateUserDto, LoginDto, User } from '../types/auth.types';
import { ResponseUtil } from '../utils/response';

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, nombre, cedula_number, phone }: CreateUserDto = req.body;
    
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const cedulaFrente = files?.cedulaFrente?.[0]?.filename;
    const cedulaDorso = files?.cedulaDorso?.[0]?.filename;
    
    const hash = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO users (email, password_hash, nombre, cedula_number, phone, cedula_frente, cedula_dorso)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, email, nombre;
    `;
    const values = [email, hash, nombre, cedula_number, phone, cedulaFrente, cedulaDorso];
    const result = await pool.query(query, values);

    ResponseUtil.success(res, { user: result.rows[0] }, 'Usuario registrado exitosamente', 201);
  } catch (error) {
    console.error('Registro error:', error);
    ResponseUtil.error(res, 'Error al registrar usuario', 500);
  }
};

export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: LoginDto = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (!result.rows.length) {
      ResponseUtil.error(res, 'Credenciales inválidas', 401);
      return;
    }

    const user: User = result.rows[0];

    if (user.bloqueado) {
      ResponseUtil.error(res, 'Tu cuenta ha sido bloqueada', 403);
      return;
    }

    const match = await bcrypt.compare(password, user.password_hash!);
    if (!match) {
      ResponseUtil.error(res, 'Credenciales inválidas', 401);
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      ResponseUtil.error(res, 'Error de configuración del servidor', 500);
      return;
    }

    const token = jwt.sign(
      { userId: user.id }, 
      jwtSecret, 
      { expiresIn: '12h' }
    );

    ResponseUtil.success(res, { token }, 'Login exitoso');

  } catch (error) {
    console.error('Login error:', error);
    ResponseUtil.error(res, 'Error al iniciar sesión', 500);
  }
};