// test-formats.js
const fetch = require('node-fetch');

const apiKey = '33GBEjsRifAQ0qZEoM69q1X7OlF9ZKC1phH52Gy7tG8';
const clientId = 'Xts5QdWJRFRmhvPxJTO-lA';

async function testDifferentFormats() {
  console.log('🧪 Testing different authentication formats...\n');
  
  const formats = [
    {
      name: 'Bearer Token (current)',
      headers: { 'Authorization': `Bearer ${apiKey}` }
    },
    {
      name: 'API Key Header',
      headers: { 'X-API-Key': apiKey }
    },
    {
      name: 'Authorization Direct',
      headers: { 'Authorization': apiKey }
    },
    {
      name: 'Client ID + Secret',
      headers: { 
        'X-Client-ID': clientId,
        'X-Client-Secret': apiKey 
      }
    }
  ];

  const endpoints = [
    'https://api.didit.me/verify',
    'https://api.didit.me/v1/session/',
    'https://api.didit.me/v1/verify',
    'https://api.didit.me/session'
  ];

  for (const endpoint of endpoints) {
    console.log(`🔗 Testing endpoint: ${endpoint}`);
    
    for (const format of formats) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...format.headers
          },
          body: JSON.stringify({
            webhook: {
              url: 'http://localhost:3002/api/kyc/callback',
              version: '1'
            },
            metadata: {
              userId: 'test123'
            }
          })
        });

        const responseText = await response.text();
        
        if (response.ok) {
          console.log(`✅ SUCCESS with ${format.name}:`);
          console.log(`   Status: ${response.status}`);
          console.log(`   Response: ${responseText.substring(0, 100)}...`);
        } else {
          console.log(`❌ ${format.name}: ${response.status} - ${responseText.substring(0, 50)}...`);
        }
        
      } catch (error) {
        console.log(`💥 ${format.name}: ${error.message}`);
      }
    }
    console.log(''); // Línea en blanco entre endpoints
  }
}

testDifferentFormats();