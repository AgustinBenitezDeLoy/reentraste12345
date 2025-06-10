// src/controllers/kycController.ts
import { Request, Response } from 'express';
import fetch from 'node-fetch';
import pool from '../db';
import { ResponseUtil } from '../utils/response';

interface AuthRequest extends Request {
  userId?: string;
}

export const iniciarKYC = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.userId || req.body.userId;
  if (!userId) {
    ResponseUtil.error(res, 'Falta userId', 400);
    return;
  }

  try {
    // Validar variables de entorno requeridas
    const apiKey = process.env.DIDIT_API_KEY;
    const workflowId = process.env.WORKFLOW_ID;
    const appUrl = process.env.APP_URL;

    if (!apiKey || !workflowId || !appUrl) {
      console.error('❌ Variables de entorno faltantes:', {
        apiKey: !!apiKey,
        workflowId: !!workflowId,
        appUrl: !!appUrl
      });
      ResponseUtil.error(res, 'Configuración de API incompleta', 500);
      return;
    }

    const userResult = await pool.query(
      'SELECT kyc_status, kyc_session_id FROM users WHERE id = $1',
      [userId]
    );
    const user = userResult.rows[0];

    if (user?.kyc_status === 'aprobado') {
      ResponseUtil.success(res, {
        alreadyVerified: true,
        sessionId: user.kyc_session_id,
        status: user.kyc_status,
      }, 'KYC ya aprobado');
      return;
    }

    const callbackURL = `${appUrl}/api/kyc/callback`;

    console.log('🚀 Iniciando sesión KYC:', {
      userId,
      workflowId,
      callbackURL
    });

    const sessionResponse = await fetch('https://verification.didit.me/v2/session/', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify({
        workflow_id: workflowId,
        vendor_data: userId.toString(),
        callback: callbackURL
      })
    });

    const raw = await sessionResponse.text();
    console.log('📥 Respuesta raw de didit:', raw);

    let sessionData;
    try {
      sessionData = JSON.parse(raw);
    } catch (e) {
      console.error('❌ Error parseando JSON:', e);
      ResponseUtil.error(res, 'Error al interpretar respuesta de didit', 500);
      return;
    }

    if (!sessionResponse.ok) {
      console.error('❌ Error en API de didit:', {
        status: sessionResponse.status,
        statusText: sessionResponse.statusText,
        data: sessionData
      });
      ResponseUtil.error(res, sessionData.detail || 'Error en servicio de verificación', 500);
      return;
    }

    if (!sessionData.session_id || !sessionData.url) {
      console.error('❌ Respuesta incompleta de didit:', sessionData);
      ResponseUtil.error(res, 'Respuesta incompleta del servicio de verificación', 500);
      return;
    }

    await pool.query(
      'UPDATE users SET kyc_session_id = $1, kyc_status = $2 WHERE id = $3',
      [sessionData.session_id, 'iniciado', userId]
    );

    console.log('✅ Sesión KYC creada exitosamente:', {
      userId,
      sessionId: sessionData.session_id,
      url: sessionData.url
    });

    ResponseUtil.success(res, {
      sessionId: sessionData.session_id,
      url: sessionData.url,
      status: 'iniciado'
    }, 'Sesión iniciada con éxito');
  } catch (err) {
    console.error('❌ Error al iniciar KYC:', err);
    ResponseUtil.error(res, 'Error interno al iniciar verificación', 500);
  }
};

export const estadoKYC = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    if (!userId) {
      ResponseUtil.error(res, 'Token inválido', 401);
      return;
    }

    console.log(`📊 Consultando estado KYC para usuario: ${userId}`);

    const result = await pool.query(
      'SELECT kyc_status, kyc_session_id, kyc_completed_at FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      ResponseUtil.error(res, 'Usuario no encontrado', 404);
      return;
    }

    const userData = result.rows[0];
    const estado = userData.kyc_status || 'pendiente';

    console.log(`📊 Estado KYC consultado para usuario ${userId}: ${estado}`);

    ResponseUtil.success(res, {
      status: estado,
      sessionId: userData.kyc_session_id,
      completedAt: userData.kyc_completed_at
    }, 'Estado KYC consultado exitosamente');

  } catch (err) {
    console.error('❌ Error al obtener estado KYC:', err);
    ResponseUtil.error(res, 'Error interno del servidor', 500);
  }
};