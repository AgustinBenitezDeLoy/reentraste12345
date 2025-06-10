// test-oauth.js
const fetch = require('node-fetch');

async function testOAuth() {
  console.log('🧪 Testing OAuth2 flow with your credentials...');
  
  try {
    // Paso 1: Obtener access token
    console.log('1️⃣ Getting access token...');
    console.log('🔑 CLIENT_ID: Xts5QdWJRFRmhvPxJTO-lA');
    console.log('🔑 CLIENT_SECRET: 33GB... (hidden)');
    
    const tokenResponse = await fetch('https://api.didit.me/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: 'Xts5QdWJRFRmhvPxJTO-lA',
        client_secret: '33GBEjsRifAQ0qZEoM69q1X7OlF9ZKC1phH52Gy7tG8'
      })
    });

    console.log('📊 Token Response Status:', tokenResponse.status);
    console.log('📊 Token Response Headers:', tokenResponse.headers.get('content-type'));
    
    const tokenText = await tokenResponse.text();
    console.log('📨 Token Raw Response:', tokenText);
    
    if (!tokenResponse.ok) {
      console.log('❌ OAuth2 Token Failed');
      return;
    }

    let tokenData;
    try {
      tokenData = JSON.parse(tokenText);
      console.log('✅ Token obtained successfully');
      console.log('🔑 Access Token Length:', tokenData.access_token?.length || 'None');
    } catch (e) {
      console.log('❌ Token response is not JSON');
      return;
    }
    
    // Paso 2: Usar access token para crear sesión
    console.log('\n2️⃣ Creating session with access token...');
    
    const sessionResponse = await fetch('https://api.didit.me/v1/session/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json'
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

    console.log('📊 Session Response Status:', sessionResponse.status);
    const sessionText = await sessionResponse.text();
    console.log('📨 Session Response:', sessionText);
    
    if (sessionResponse.ok) {
      console.log('✅ SUCCESS: Complete OAuth2 flow working!');
      console.log('🎉 Your Didit configuration is CORRECT!');
    } else {
      console.log('❌ ERROR: Session creation failed even with valid token');
    }
    
  } catch (error) {
    console.error('💥 Network Error:', error.message);
  }
}

testOAuth();