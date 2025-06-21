const https = require('https');
const http = require('http');

async function testAPI() {
  try {
    console.log('Testing _find endpoint...');
    
    const response = await fetch('http://localhost:9002/heap/_find', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authy': 'test-token'
      },
      body: JSON.stringify({
        selector: { type: 'Komposition' },
        fields: ['_id', '_rev']
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ _find endpoint working:', data);
    } else {
      console.log('❌ _find endpoint failed:', response.status, response.statusText);
    }
    
    console.log('\nTesting GET komposition endpoint...');
    
    const getResponse = await fetch('http://localhost:9002/heap/demokompo1', {
      method: 'GET'
    });
    
    if (getResponse.ok) {
      const data = await getResponse.json();
      console.log('✅ GET endpoint working:', data);
    } else {
      console.log('❌ GET endpoint failed:', getResponse.status, getResponse.statusText);
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

testAPI();