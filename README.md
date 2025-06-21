# 🎵 Kompost Mixer

**A Next.js application for creating and managing musical kompositions with Firebase backend and ELM integration.**

## 🚀 Features

- **Firebase Integration**: Real-time database, authentication, and file storage
- **ELM Compatibility**: CouchDB-style API endpoints for ELM application integration  
- **Beat-Synchronized Editing**: 120 BPM timing system for music video creation
- **Modern Stack**: Next.js 15, TypeScript, Tailwind CSS, Firebase v11
- **Comprehensive Testing**: Jest with Firebase emulator integration
- **CI/CD Pipeline**: GitHub Actions with multi-environment testing

## 🛠 Quick Start

### Prerequisites
- Node.js 18.x or 20.x
- npm or yarn
- Firebase CLI (optional, for emulator)

### Installation

```bash
# Clone the repository
git clone https://github.com/StigLau/kompost-mixer.git
cd kompost-mixer

# Install dependencies
npm install

# Set up environment variables
cp env.example .env.local
# Edit .env.local with your Firebase configuration

# Start development server
npm run dev
```

Visit [http://localhost:9002](http://localhost:9002) to see the application.

## 🔧 Available Scripts

### Development
```bash
npm run dev          # Start development server (port 9002)
npm run build        # Build for production
npm start           # Start production server
```

### Testing
```bash
npm test            # Run Jest test suite
npm run test:watch  # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
npm run test:ci     # Full CI test suite (typecheck + lint + test + build)
```

### Firebase Testing
```bash
npm run test:firebase      # Run tests with Firebase emulator
npm run emulators:start    # Start Firebase emulators
npm run emulators:kill     # Stop Firebase emulators
```

### Code Quality
```bash
npm run typecheck   # TypeScript type checking
npm run lint        # ESLint code quality check
```

### API Testing
```bash
node test-server.js # Test API endpoints (YOLO mode)
```

## 🏗 Architecture

### Core Components

- **Next.js App Router**: Modern React framework with file-based routing
- **Firebase Backend**: Firestore database, Authentication, Storage
- **ELM Integration**: Port handlers and CouchDB-compatible API endpoints
- **TypeScript**: Full type safety across the application
- **Tailwind CSS**: Utility-first styling framework

### API Endpoints

#### CouchDB-Compatible Endpoints (for ELM)
- `POST /heap/_find` - Search kompositions and audio sources
- `GET /heap/[id]` - Load specific komposition
- `PUT /heap/[id]` - Save komposition with data transformation
- `DELETE /heap/[id]` - Delete komposition

#### Standard API Endpoints
- `GET /api/heap/[id]` - Alternative komposition API
- `POST /api/genkit/[...path]` - AI integration (disabled in production)

### Data Structure

```typescript
interface Komposition {
  id?: string
  userId: string
  name: string
  revision: string
  dvlType: string  // 'video' | 'audio'
  bpm: number     // 120 BPM = 8 seconds per 16 beats
  segments: Segment[]
  sources: Source[]
  config: VideoConfig
  beatpattern?: BeatPattern
  tags?: string[]
  description?: string
}
```

## 🔥 ELM Integration

The application provides full compatibility with ELM applications through:

1. **CouchDB-Style API**: Maintains compatibility with existing ELM code
2. **Data Transformation**: Automatic conversion between ELM and Firebase formats
3. **Authentication**: Token-based auth with graceful fallbacks
4. **Real-time Updates**: Firebase real-time subscriptions

### ELM Usage Example

```elm
-- ELM code can use the API directly
saveKomposition : Komposition -> Cmd Msg
saveKomposition kompo =
    Http.request
        { method = "PUT"
        , headers = [ Http.header "authy" token ]
        , url = "/heap/" ++ kompo.id ++ ".json"
        , body = Http.jsonBody (encodeKomposition kompo)
        , expect = Http.expectJson SaveResult decodeResponse
        , timeout = Nothing
        , tracker = Nothing
        }
```

## 🧪 Testing

### Test Structure

```
src/__tests__/
├── api-compatibility.test.ts      # API endpoint tests
├── api-endpoints-e2e.test.ts      # End-to-end API tests
├── api-logic.test.ts              # Data transformation tests
├── firebaseKompostService.*.test.ts # Firebase service tests
├── integration/                   # Integration tests
└── kompostCreationDemo.test.ts    # Demo workflow tests
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test files
npm test -- --testPathPattern="api-compatibility"
npm test -- --testPathPattern="firebaseKompostService"

# Run tests with coverage
npm run test:coverage

# Test API endpoints against running server
node test-server.js
```

## 🔒 Security

### Firebase Security Rules

- **User-scoped access**: Users can only access their own kompositions
- **Data validation**: Server-side validation of all komposition data
- **File upload restrictions**: Size and type limitations on media uploads

### API Security

- **Authentication required**: All API endpoints require valid auth token
- **Input sanitization**: All user inputs are validated and sanitized
- **Error handling**: Secure error responses without sensitive data exposure

## 🚀 Deployment

### Firebase Hosting

```bash
# Build the application
npm run build

# Deploy to Firebase (requires Firebase CLI)
firebase deploy
```

### Environment Variables

Required environment variables in `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 🎵 Music Video Features

### Beat-Synchronized Editing

- **120 BPM Standard**: 16 beats = 8 seconds timing system
- **Segment Management**: Precise timing control for video segments
- **Multi-source Support**: Combine multiple video/audio sources
- **Export Options**: Multiple format support (MP4, etc.)

### Komposition Structure

```typescript
interface BeatPattern {
  fromBeat: number    // Starting beat (0-based)
  toBeat: number      // Ending beat
  masterBPM: number   // Beats per minute (typically 120)
}

interface Segment {
  id: string
  sourceId: string    // Reference to source media
  start: number       // Start time in seconds
  duration: number    // Duration in seconds
  end: number         // End time in seconds
}
```

## 📚 Documentation

Additional documentation files:

- `CI_CD_SETUP.md` - GitHub Actions configuration
- `FIREBASE_IMPLEMENTATION_COMPLETE.md` - Firebase integration details
- `ELM_INTEGRATION_SUCCESS_NOTES.md` - ELM compatibility implementation
- `ARCHITECTURE_DIAGRAM.md` - System architecture overview

## 🛠 Development

### Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── heap/              # CouchDB-compatible endpoints
│   └── [pages]/           # Application pages
├── components/            # React components
├── services/              # Business logic
│   ├── firebaseKompostService.ts
│   └── elmPortHandler.ts
├── lib/                   # Utilities and configuration
├── types/                 # TypeScript type definitions
└── __tests__/            # Test files
```

### Code Style

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code quality and consistency
- **Prettier**: Automatic code formatting
- **Conventional Commits**: Structured commit messages

## 🐛 Troubleshooting

### Common Issues

1. **Port 9002 in use**: Kill existing processes with `lsof -ti:9002 | xargs kill -9`
2. **Firebase connection**: Check `.env.local` configuration
3. **Test failures**: Run `npm run test:ci` for comprehensive checking
4. **ELM integration**: Verify API endpoints with `node test-server.js`

### Debug Mode

```bash
# Enable debug logging
NEXT_PUBLIC_DEBUG=true npm run dev

# Test API endpoints
curl -X POST http://localhost:9002/heap/_find \
  -H "Content-Type: application/json" \
  -H "authy: test-token" \
  -d '{"selector":{"type":"Komposition"}}'
```

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Make changes and add tests
3. Run the test suite: `npm run test:ci`
4. Commit with conventional commits: `git commit -m "feat: add amazing feature"`
5. Push and create a Pull Request

## 📄 License

This project is part of the Kompost ecosystem for music composition and video editing.

---

**🚀 Ready to compose? Start the development server and create your first komposition!**