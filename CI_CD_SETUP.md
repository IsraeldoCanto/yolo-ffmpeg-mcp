# CI/CD Pipeline Setup for Kompost Mixer

## 🚀 GitHub Actions Workflows

### 1. **Standard CI Pipeline** (`.github/workflows/ci.yml`)
**Triggers**: Push to main/develop, PRs to main
**Features**:
- Multi-Node.js version testing (18.x, 20.x)
- TypeScript type checking
- ESLint code quality checks
- Unit test execution
- Production build verification
- Build artifact upload

### 2. **Firebase Integration Tests** (`.github/workflows/firebase-tests.yml`)
**Triggers**: 
- Push to main/develop/feature branches containing 'firebase'
- PRs to main with Firebase-related file changes
- Conditional execution based on Firebase infrastructure presence

**Features**:
- Automatic Firebase CLI installation
- Java setup for Firebase emulators
- Firebase emulator caching for performance
- Conditional testing based on infrastructure files
- Graceful degradation when Firebase infrastructure missing

**Key Components**:
- Firebase emulator download and setup
- Jest configuration detection
- Test utility verification  
- Comprehensive test reporting

### 3. **Firebase Deployment** (`.github/workflows/deploy.yml`)
**Triggers**:
- Push to main branch
- Version tags (v*)
- Manual workflow dispatch with environment selection

**Features**:
- Production and staging environment support
- Firebase hosting deployment
- Build artifact deployment
- Environment-specific configuration

## 🔧 Configuration Requirements

### Secrets Required
- `FIREBASE_TOKEN`: Firebase deployment token
  ```bash
  firebase login:ci
  # Add generated token to GitHub repository secrets
  ```

### Environment Variables
- Automatic detection of Firebase configuration files
- Conditional workflow execution based on file presence

## 📋 Workflow Decision Logic

### Firebase Tests Workflow Logic
```
1. Check if firebase.json exists → If no, skip Firebase tests
2. Check if firebaseTestUtils.ts exists → If no, skip Firebase tests  
3. Check if jest.config.firebase.js exists → If no, skip Firebase tests
4. All checks pass → Run full Firebase emulator integration tests
```

### Deployment Workflow Logic
```
1. Build application
2. Check if firebase.json exists → If no, fail deployment
3. Deploy using Firebase CLI with provided token
4. Report deployment status and URL
```

## 🎯 Branch-Specific Behavior

### Main Branch (Production)
- Full CI pipeline
- Firebase tests (if infrastructure present)
- Automatic deployment to production
- Version tag deployment

### Feature Branches
- CI pipeline without deployment
- Firebase tests for Firebase-related branches
- Build verification only

### Pull Requests
- Full CI pipeline
- Firebase tests for relevant changes
- No deployment

## 🚧 Development Workflow

### For Firebase Feature Development
1. Create feature branch with 'firebase' in name
2. Firebase tests automatically triggered
3. Conditional execution based on infrastructure files
4. Merge to main triggers production deployment

### For Regular Feature Development  
1. Standard CI pipeline execution
2. Build and test verification
3. No Firebase emulator overhead

## 📊 Monitoring and Reporting

### Test Reports
- TypeScript compilation status
- Lint check results
- Unit test coverage
- Firebase integration test results
- Build artifact status

### Deployment Reports
- Environment deployed to
- Deployment URL
- Git commit information
- Deployment timestamp

## 🔄 Future Enhancements

### Planned Additions
- Test coverage reporting
- Performance testing integration
- Security scanning
- Multi-environment deployment strategies
- Blue-green deployment patterns

### Integration Opportunities
- Slack/Discord deployment notifications
- Automated changelog generation
- Release management automation
- Performance monitoring integration