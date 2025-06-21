# 🔥 Firebase Setup Guide for Kompost Mixer

Complete setup guide for Firebase Database, Authentication, and local testing with emulators.

## 🚀 Quick Setup Checklist

- [ ] Install Firebase CLI
- [ ] Create/configure Firebase project  
- [ ] Set up environment variables
- [ ] Deploy security rules and indexes
- [ ] Test with Firebase emulators
- [ ] Verify API endpoints from localhost

## 📋 Prerequisites

### 1. Install Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```

### 2. Verify Project Configuration
```bash
firebase projects:list
firebase use kompost-mixer  # or kompostedit for ELM testing
```

## 🔧 Environment Configuration

### 1. Create `.env.local` file
Copy from the example and configure for your project:

```bash
cp env.example .env.local
```

### 2. For Kompost Mixer Project
```env
NEXT_PUBLIC_FIREBASE_API_KEY=***REMOVED***
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=kompost-mixer.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=kompost-mixer
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=kompost-mixer.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=671979740635
NEXT_PUBLIC_FIREBASE_APP_ID=1:671979740635:web:eab937f900c6d07de35bfe

# Development settings
NODE_ENV=development
NEXT_PUBLIC_DEBUG=true
```

### 3. For KompostEdit Testing (ELM Integration)
```env
NEXT_PUBLIC_FIREBASE_API_KEY=***REMOVED***
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=kompostedit.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=kompostedit
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=kompostedit.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=596863212270
NEXT_PUBLIC_FIREBASE_APP_ID=1:596863212270:web:89a8ebe76bf33cc89eb1ff
NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL=https://us-central1-kompostedit.cloudfunctions.net/api
```

## 🗄️ Database Setup

### 1. Deploy Security Rules
```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules  
firebase deploy --only storage:rules
```

### 2. Deploy Database Indexes
```bash
# Deploy Firestore indexes
firebase deploy --only firestore:indexes
```

The indexes are configured for:
- **multimedia_items**: userId + createdAt (DESC), userId + title (ASC), userId + genre (ASC)
- **kompositions**: userId + name, userId + createdAt
- **sources**: userId + mediaType, userId + format

### 3. Verify Database Structure
Your Firestore database will have these collections:
```
/multimedia_items/{itemId}
/tracks/{trackId}  
/kompositions/{kompositionId}
/sources/{sourceId}
/users/{userId}
```

## 🧪 Local Testing with Emulators

### 1. Start Firebase Emulators
```bash
# Start all emulators (Auth, Firestore, Storage)
npm run emulators:start

# Or manually
firebase emulators:start --only auth,firestore,storage
```

**Emulator Ports:**
- **Firestore**: http://localhost:8081
- **Auth**: http://localhost:9099  
- **Storage**: http://localhost:9199
- **UI Dashboard**: http://localhost:4000

### 2. Run Tests with Emulators
```bash
# Run Firebase integration tests
npm run test:firebase

# Run all tests with emulator
npm run test:integration
```

### 3. Test API Endpoints
```bash
# Test API endpoints against running server
node test-server.js
```

## 🌐 Testing from Localhost

### 1. Start Development Server
```bash
npm run dev
# Server runs on http://localhost:9002
```

### 2. Test Authentication Flow
1. Go to http://localhost:9002
2. Click "Sign in with Google"
3. Create test user in emulator
4. Verify auth token in requests

### 3. Test KompostEdit Integration

#### POST /heap/_find (List Kompositions)
```bash
curl -X POST http://localhost:9002/heap/_find \
  -H "Content-Type: application/json" \
  -H "authy: YOUR_AUTH_TOKEN" \
  -d '{
    "selector": {"type": "Komposition"},
    "fields": ["_id", "_rev", "name"]
  }'
```

#### GET /heap/{id} (Load Komposition)  
```bash
curl -X GET http://localhost:9002/heap/your-komposition-id \
  -H "authy: YOUR_AUTH_TOKEN"
```

#### PUT /heap/{id} (Save Komposition)
```bash
curl -X PUT http://localhost:9002/heap/test-kompo.json \
  -H "Content-Type: application/json" \
  -H "authy: YOUR_AUTH_TOKEN" \
  -d '{
    "_id": "test-kompo",
    "name": "Test Komposition", 
    "type": "Video",
    "bpm": 120,
    "segments": [],
    "sources": [],
    "beatpattern": {
      "frombeat": 0,
      "tobeat": 64, 
      "masterbpm": 120
    }
  }'
```

### 4. Debug Authentication Issues

#### Get Auth Token from Browser
```javascript
// In browser console (after login)
firebase.auth().currentUser.getIdToken().then(console.log)
```

#### Test with Firebase UI
Visit http://localhost:4000 to:
- View database contents
- Test authentication
- Monitor real-time data changes
- Debug security rules

## 🔍 Troubleshooting

### Common Issues

#### 1. "No authorization header" Error
```bash
# Ensure auth header format
-H "authy: YOUR_FIREBASE_ID_TOKEN"
```

#### 2. CORS Issues
Add to `next.config.ts`:
```typescript
async headers() {
  return [
    {
      source: '/heap/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: '*' },
        { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE' },
        { key: 'Access-Control-Allow-Headers', value: 'Content-Type, authy' },
      ],
    },
  ]
}
```

#### 3. Firestore Permission Denied
Check security rules in `firestore.rules`:
```javascript
// Debug rule - REMOVE in production
allow read, write: if true;
```

#### 4. Emulator Connection Issues
```bash
# Reset emulators
firebase emulators:kill
rm -rf .firebase/
firebase emulators:start
```

### Verification Commands

#### Test Full Workflow
```bash
# 1. Start emulators
npm run emulators:start

# 2. Start dev server  
npm run dev

# 3. Run API tests
node test-server.js

# 4. Run integration tests
npm run test:firebase
```

#### Database Health Check
```bash
# Check project status
firebase projects:list
firebase use --project kompost-mixer

# Verify deployment
firebase deploy --only firestore:rules --dry-run
firebase deploy --only firestore:indexes --dry-run
```

## 📊 Production Deployment

### 1. Deploy to Production
```bash
# Deploy all Firebase resources
firebase deploy

# Deploy specific components
firebase deploy --only firestore:rules,firestore:indexes,storage:rules
```

### 2. Production Environment Variables
Update `.env.production.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-production-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
```

## 🎯 Next Steps

After successful setup:
1. ✅ **Authentication**: Login with Google works
2. ✅ **Database**: Can create/read/update kompositions  
3. ✅ **API**: All `/heap/*` endpoints respond correctly
4. ✅ **ELM Integration**: CouchDB-compatible responses
5. ✅ **Security**: Rules enforce user-scoped access

## 💡 Tips

- **Use emulators for development** - faster iteration, no production impact
- **Test security rules** with different user scenarios
- **Monitor Firebase console** for production issues
- **Use `node test-server.js`** for quick API verification
- **Check build timestamp** in footer to ensure latest version

---

🔥 **Ready to test!** Start with emulators, verify API endpoints, then test ELM integration.