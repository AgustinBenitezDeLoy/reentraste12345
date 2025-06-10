// src/controllers/kycWebhookController.ts
import { Request, Response } from 'express';
import crypto from 'crypto';
import pool from '../db';

// Extender la interfaz Request para incluir rawBody
interface RawBodyRequest extends Request {
  rawBody?: string;
}

// Mapeo de estados de didit a nuestros estados internos
const mapDiditStatus = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    // Estados de éxito
    'Approved': 'aprobado',
    'approved': 'aprobado',
    'APPROVED': 'aprobado',
    
    // Estados de rechazo/fallo
    'Declined': 'rechazado',
    'declined': 'rechazado',
    'DECLINED': 'rechazado',
    'Failed': 'rechazado',
    'failed': 'rechazado',
    'FAILED': 'rechazado',
    
    // Estados en proceso
    'In Progress': 'en_proceso',
    'in_progress': 'en_proceso',
    'IN_PROGRESS': 'en_proceso',
    'In Review': 'en_proceso',
    'in_review': 'en_proceso',
    'IN_REVIEW': 'en_proceso',
    'Processing': 'en_proceso',
    'processing': 'en_proceso',
    'PROCESSING': 'en_proceso',
    
    // Estados iniciales
    'Not Started': 'iniciado',
    'not_started': 'iniciado',
    'NOT_STARTED': 'iniciado',
    'Started': 'iniciado',
    'started': 'iniciado',
    'STARTED': 'iniciado',
    
    // Estados finales negativos
    'Abandoned': 'expirado',
    'abandoned': 'expirado',
    'ABANDONED': 'expirado',
    'Expired': 'expirado',
    'expired': 'expirado',
    'EXPIRED': 'expirado',
    'Cancelled': 'expirado',
    'cancelled': 'expirado',
    'CANCELLED': 'expirado'
  };

  return statusMap[status] || 'en_proceso';
};

export const kycWebhookHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  console.log('🔔 Webhook KYC recibido');
  console.log('📅 Timestamp:', new Date().toISOString());
  console.log('🌐 Headers recibidos:', {
    'x-signature': req.get('X-Signature') ? 'PRESENTE' : 'AUSENTE',
    'x-timestamp': req.get('X-Timestamp') ? 'PRESENTE' : 'AUSENTE',
    'content-type': req.get('Content-Type'),
    'user-agent': req.get('User-Agent')
  });

  try {
    const signature = req.get('X-Signature');
    const timestamp = req.get('X-Timestamp');
    const webhookSecret = process.env.WEBHOOK_SECRET_KEY;
    const rawBody = (req as RawBodyRequest).rawBody;

    // Validar que tengamos todos los datos requeridos
    if (!signature || !timestamp || !rawBody || !webhookSecret) {
      console.error('❌ Faltan datos requeridos para validar webhook:', {
        signature: !!signature,
        timestamp: !!timestamp,
        rawBody: !!rawBody,
        webhookSecret: !!webhookSecret
      });
      res.status(401).json({ message: "Unauthorized - Missing required data" });
      return;
    }

    // Validar timestamp (no más de 5 minutos de diferencia)
    const currentTime = Math.floor(Date.now() / 1000);
    const incomingTime = parseInt(timestamp, 10);
    const timeDifference = Math.abs(currentTime - incomingTime);
    
    if (timeDifference > 300) { // 5 minutos
      console.error('❌ Timestamp demasiado antiguo:', {
        currentTime,
        incomingTime,
        difference: timeDifference
      });
      res.status(401).json({ message: "Request timestamp is stale" });
      return;
    }

    // Validar firma HMAC
    const hmac = crypto.createHmac("sha256", webhookSecret);
    const expectedSignature = hmac.update(rawBody).digest("hex");

    const expectedSignatureBuffer = Buffer.from(expectedSignature, "utf8");
    const providedSignatureBuffer = Buffer.from(signature, "utf8");

    if (
      expectedSignatureBuffer.length !== providedSignatureBuffer.length ||
      !crypto.timingSafeEqual(expectedSignatureBuffer, providedSignatureBuffer)
    ) {
      console.error('❌ Firma inválida:', {
        expected: expectedSignature,
        provided: signature
      });
      res.status(401).json({ message: "Invalid signature" });
      return;
    }

    console.log('✅ Webhook autenticado correctamente');

    // Parsear el cuerpo del webhook
    let jsonBody;
    try {
      jsonBody = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('❌ Error parseando JSON del webhook:', parseError);
      res.status(400).json({ message: "Invalid JSON body" });
      return;
    }

    console.log('📝 Datos del webhook:', JSON.stringify(jsonBody, null, 2));

    const { session_id, status, vendor_data } = jsonBody;

    // Validar campos requeridos
    if (!session_id || !status || !vendor_data) {
      console.error('❌ Faltan campos requeridos en el webhook:', {
        session_id: !!session_id,
        status: !!status,
        vendor_data: !!vendor_data
      });
      res.status(400).json({ message: "Missing required webhook fields" });
      return;
    }

    // Mapear estado de didit a nuestro sistema
    const kycStatus = mapDiditStatus(status);
    const userId = vendor_data;

    console.log('🔄 Procesando actualización:', {
      userId,
      originalStatus: status,
      mappedStatus: kycStatus,
      sessionId: session_id
    });

    // Actualizar en base de datos
    const updateResult = await pool.query(
      `UPDATE users 
       SET kyc_status = $1, 
           kyc_session_id = $2,
           kyc_completed_at = CASE 
             WHEN $1 IN ('aprobado', 'rechazado', 'expirado') 
             THEN NOW() 
             ELSE kyc_completed_at 
           END
       WHERE id = $3
       RETURNING id, kyc_status, kyc_completed_at`,
      [kycStatus, session_id, userId]
    );

    if (updateResult.rows.length === 0) {
      console.error('❌ Usuario no encontrado para actualizar:', { userId });
      res.status(404).json({ message: "User not found" });
      return;
    }

    const updatedUser = updateResult.rows[0];
    
    console.log(`✅ KYC actualizado exitosamente:`, {
      userId,
      previousStatus: 'unknown',
      newStatus: kycStatus,
      sessionId: session_id,
      completedAt: updatedUser.kyc_completed_at
    });

    // Respuesta exitosa
    res.status(200).json({
      message: "Webhook processed successfully",
      processed: {
        userId,
        status: kycStatus,
        sessionId: session_id,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error procesando webhook KYC:', error);
    res.status(500).json({ 
      message: "Internal server error",
      timestamp: new Date().toISOString()
    });
  }
};