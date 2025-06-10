// test-kyc.ts - Script para probar la integración con Didit
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

async function testKYC() {
  console.log('🧪 Probando integración KYC con Didit\n');

  // 1. Verificar variables de entorno
  console.log('1️⃣ Verificando variables de entorno:');
  const apiKey = process.env.DIDIT_API_KEY;
  const webhookSecret = process.env.DIDIT_WEBHOOK_SECRET;
  const appUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 3002}`;

  if (!apiKey) {
    console.error('❌ DIDIT_API_KEY no configurada');
    return;
  }
  console.log('✅ DIDIT_API_KEY configurada');

  if (!webhookSecret) {
    console.error('❌ DIDIT_WEBHOOK_SECRET no configurada');
    return;
  }
  console.log('✅ DIDIT_WEBHOOK_SECRET configurada');
  console.log(`📍 APP_URL: ${appUrl}\n`);

  // 2. Probar conexión con Didit
  console.log('2️⃣ Probando conexión con API de Didit:');
  try {
    const testUserId = 'test_user_' + Date.now();
    const webhookUrl = `${appUrl}/api/kyc/callback`;

    console.log(`   Usuario de prueba: ${testUserId}`);
    console.log(`   Webhook URL: ${webhookUrl}`);

    const response = await fetch('https://api.didit.me/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey
      },
      body: JSON.stringify({
        external_id: testUserId,
        metadata: { test: true, from: 'reentraste' },
        webhook_url: webhookUrl,
        redirect_url: `${appUrl}/kyc-status.html`
      })
    });

    const responseText = await response.text();
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('✅ Conexión exitosa con Didit');
      console.log('   Session ID:', data.session_id);
      console.log('   URL de verificación:', data.url);
      console.log('\n🎉 ¡La integración KYC está funcionando correctamente!');
      console.log('\n📝 Próximos pasos:');
      console.log('   1. Ejecuta las migraciones SQL del archivo kyc-migration.sql');
      console.log('   2. Asegúrate de que tu webhook URL sea accesible desde internet');
      console.log('   3. Para pruebas locales, usa ngrok: ngrok http 3002');
      console.log('   4. Actualiza APP_URL en .env con la URL de ngrok');
    } else {
      console.error('❌ Error en respuesta de Didit:', response.status);
      console.error('   Respuesta:', responseText);
      
      try {
        const error = JSON.parse(responseText);
        if (error.message) {
          console.error('   Mensaje:', error.message);
        }
      } catch (e) {
        // No es JSON
      }
    }
  } catch (error) {
    console.error('❌ Error al conectar con Didit:', error);
  }
}

// Ejecutar prueba
testKYC().catch(console.error);