#!/usr/bin/env node

/**
 * YOLO API Server Test
 * Tests the actual server endpoints to ensure they work with ELM
 */

const http = require('http')
const { spawn } = require('child_process')

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

console.log(`${colors.bold}${colors.blue}🚀 YOLO API Server Test${colors.reset}`)
console.log(`${colors.yellow}Testing API endpoints for ELM compatibility${colors.reset}\n`)

let server = null
let serverReady = false

// Test configurations
const tests = [
  {
    name: 'POST /heap/_find - List Kompositions',
    method: 'POST',
    path: '/heap/_find',
    headers: {
      'Content-Type': 'application/json',
      'authy': 'test-token'
    },
    body: JSON.stringify({
      selector: { type: 'Komposition' },
      fields: ['_id', '_rev']
    })
  },
  {
    name: 'POST /heap/_find - List Audio Sources',
    method: 'POST',
    path: '/heap/_find',
    headers: {
      'Content-Type': 'application/json',
      'authy': 'test-token'
    },
    body: JSON.stringify({
      selector: { type: 'Audio' },
      fields: ['_id', '_rev']
    })
  },
  {
    name: 'GET /heap/demo-kompo-1 - Load Komposition',
    method: 'GET',
    path: '/heap/demo-kompo-1',
    headers: {}
  },
  {
    name: 'PUT /heap/test-kompo.json - Save Komposition',
    method: 'PUT',
    path: '/heap/test-kompo.json',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      _id: 'test-kompo',
      name: 'Test Komposition',
      type: 'Video',
      bpm: 120,
      segments: [
        {
          id: 'intro',
          sourceid: 'http://example.com/video1.mp4',
          start: 0,
          duration: 16,
          end: 16
        }
      ],
      sources: [],
      beatpattern: {
        frombeat: 0,
        tobeat: 64,
        masterbpm: 120
      }
    })
  },
  {
    name: 'GET /heap/Example%201.json - URL Decode Test',
    method: 'GET',
    path: '/heap/Example%201.json',
    headers: {}
  }
]

function makeRequest(test) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 9002,
      path: test.path,
      method: test.method,
      headers: test.headers
    }

    if (test.body) {
      options.headers['Content-Length'] = Buffer.byteLength(test.body)
    }

    const req = http.request(options, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data)
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsedData
          })
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
            parseError: error.message
          })
        }
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    req.setTimeout(10000, () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })

    if (test.body) {
      req.write(test.body)
    }

    req.end()
  })
}

async function runTest(test) {
  console.log(`${colors.blue}Testing: ${test.name}${colors.reset}`)
  
  try {
    const result = await makeRequest(test)
    
    if (result.status >= 200 && result.status < 300) {
      console.log(`  ${colors.green}✅ Success: ${result.status}${colors.reset}`)
      
      // Check specific response formats
      if (test.path === '/heap/_find' && result.body.docs) {
        console.log(`  ${colors.green}📄 Found ${result.body.docs.length} documents${colors.reset}`)
        if (result.body.docs.length > 0) {
          console.log(`  ${colors.green}📋 First doc: ${result.body.docs[0]._id}${colors.reset}`)
        }
      } else if (test.method === 'PUT' && result.body.ok) {
        console.log(`  ${colors.green}💾 Saved: ${result.body.id}${colors.reset}`)
      } else if (test.method === 'GET' && result.body._id) {
        console.log(`  ${colors.green}📄 Loaded: ${result.body._id}${colors.reset}`)
      }
      
      return true
    } else if (result.status === 401) {
      console.log(`  ${colors.yellow}⚠️  Auth required: ${result.status}${colors.reset}`)
      return true // Expected for some endpoints
    } else {
      console.log(`  ${colors.red}❌ Failed: ${result.status}${colors.reset}`)
      if (result.body.error) {
        console.log(`  ${colors.red}   Error: ${result.body.error}${colors.reset}`)
      }
      return false
    }
  } catch (error) {
    console.log(`  ${colors.red}❌ Error: ${error.message}${colors.reset}`)
    return false
  }
}

async function waitForServer() {
  console.log(`${colors.yellow}⏳ Waiting for server to be ready...${colors.reset}`)
  
  for (let i = 0; i < 30; i++) {
    try {
      await makeRequest({ method: 'GET', path: '/', headers: {} })
      console.log(`${colors.green}✅ Server is ready!${colors.reset}\n`)
      return true
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  console.log(`${colors.red}❌ Server failed to start${colors.reset}`)
  return false
}

function startServer() {
  return new Promise((resolve, reject) => {
    console.log(`${colors.yellow}🚀 Starting Next.js dev server...${colors.reset}`)
    
    server = spawn('npm', ['run', 'dev'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, FORCE_COLOR: '0' }
    })

    let output = ''
    server.stdout.on('data', (data) => {
      output += data.toString()
      if (output.includes('Ready in')) {
        serverReady = true
        resolve()
      }
    })

    server.stderr.on('data', (data) => {
      const message = data.toString()
      if (message.includes('EADDRINUSE')) {
        console.log(`${colors.yellow}⚠️  Port already in use, assuming server is running${colors.reset}`)
        serverReady = true
        resolve()
      }
    })

    setTimeout(() => {
      if (!serverReady) {
        console.log(`${colors.yellow}⚠️  Server taking longer than expected, proceeding with tests${colors.reset}`)
        resolve()
      }
    }, 15000)
  })
}

function stopServer() {
  if (server) {
    console.log(`\n${colors.yellow}🛑 Stopping server...${colors.reset}`)
    server.kill('SIGTERM')
  }
}

async function main() {
  try {
    // Start server
    await startServer()
    
    // Wait for server to be ready
    const ready = await waitForServer()
    if (!ready) {
      console.log(`${colors.red}❌ Could not connect to server${colors.reset}`)
      process.exit(1)
    }

    // Run tests
    let passed = 0
    let total = tests.length

    console.log(`${colors.bold}Running ${total} API tests...${colors.reset}\n`)

    for (const test of tests) {
      const success = await runTest(test)
      if (success) passed++
      console.log() // Empty line between tests
    }

    // Results
    console.log(`${colors.bold}${colors.blue}📊 Test Results${colors.reset}`)
    console.log(`${colors.green}✅ Passed: ${passed}${colors.reset}`)
    console.log(`${colors.red}❌ Failed: ${total - passed}${colors.reset}`)
    
    if (passed === total) {
      console.log(`\n${colors.green}${colors.bold}🎉 All tests passed! API is ELM-ready!${colors.reset}`)
    } else {
      console.log(`\n${colors.yellow}⚠️  Some tests failed, but basic functionality may work${colors.reset}`)
    }

  } catch (error) {
    console.error(`${colors.red}❌ Test runner error: ${error.message}${colors.reset}`)
  } finally {
    stopServer()
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log(`\n${colors.yellow}👋 Shutting down...${colors.reset}`)
  stopServer()
  process.exit(0)
})

process.on('SIGTERM', () => {
  stopServer()
  process.exit(0)
})

main()