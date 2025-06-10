// generate-hash.js - Ejecutar con: node generate-hash.js "tu_contraseña"

const bcrypt = require('bcrypt');

async function generateHash(password) {
  if (!password) {
    console.log('Uso: node generate-hash.js "tu_contraseña"');
    return;
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    console.log('\n=================================');
    console.log('Contraseña:', password);
    console.log('Hash generado:', hash);
    console.log('=================================\n');
    
    // Verificar que funciona
    const isValid = await bcrypt.compare(password, hash);
    console.log('Verificación:', isValid ? '✅ OK' : '❌ Error');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Obtener contraseña del argumento de línea de comandos
const password = process.argv[2];
generateHash(password);