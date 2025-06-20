# Kompost Mixer / KompostEdit Development Makefile
# Usage: make <target>

.PHONY: help dev build deploy test clean status logs backup branch commit

# Default target
help:
	@echo "🎵 Kompost Mixer Development Commands"
	@echo ""
	@echo "Development:"
	@echo "  make dev          - Start local development server"
	@echo "  make dev-clean    - Clean restart dev server (kill existing)"
	@echo "  make build        - Build for production"
	@echo "  make test         - Run tests"
	@echo ""
	@echo "Deployment:"
	@echo "  make deploy       - Deploy to Firebase (requires auth)"
	@echo "  make deploy-force - Re-authenticate and deploy"
	@echo "  make emulators    - Start Firebase emulators"
	@echo ""
	@echo "Git Operations:"
	@echo "  make status       - Show git status and branch info"
	@echo "  make commit MSG='your message' - Quick commit with message"
	@echo "  make push         - Push current branch"
	@echo "  make backup NAME='backup-name' - Create backup branch"
	@echo "  make branch NAME='feature-name' - Create and switch to new branch"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean        - Clean node_modules and rebuild"
	@echo "  make logs         - Show Firebase logs"
	@echo "  make elm-build    - Build ELM if available"
	@echo "  make version      - Bump version number"

# Development commands
dev:
	@echo "🚀 Starting development server..."
	npm run dev

dev-clean:
	@echo "🧹 Cleaning and restarting dev server..."
	@-lsof -ti:9002 | xargs kill -9 2>/dev/null || true
	@sleep 2
	npm run dev

build:
	@echo "🏗️ Building for production..."
	npm run build

test:
	@echo "🧪 Running tests..."
	npm test

# Deployment commands
deploy:
	@echo "🚀 Deploying to Firebase..."
	@echo "Current branch: $$(git branch --show-current)"
	@echo "Last commit: $$(git log -1 --oneline)"
	firebase deploy

deploy-force:
	@echo "🔐 Re-authenticating with Firebase..."
	firebase login --reauth
	@echo "🚀 Deploying to Firebase..."
	firebase deploy

emulators:
	@echo "🔧 Starting Firebase emulators..."
	firebase emulators:start

# Git operations
status:
	@echo "📊 Git Status:"
	@echo "Branch: $$(git branch --show-current)"
	@echo "Commits ahead: $$(git rev-list --count origin/main..HEAD 2>/dev/null || echo '0')"
	@echo "Last commit: $$(git log -1 --oneline)"
	@echo ""
	git status --short

commit:
	@if [ -z "$(MSG)" ]; then \
		echo "❌ Error: Please provide a commit message"; \
		echo "Usage: make commit MSG='Your commit message'"; \
		exit 1; \
	fi
	@echo "💾 Committing with message: $(MSG)"
	git add .
	git commit -m "$(MSG)"

push:
	@echo "📤 Pushing current branch to origin..."
	@echo "Branch: $$(git branch --show-current)"
	git push origin $$(git branch --show-current)

backup:
	@if [ -z "$(NAME)" ]; then \
		NAME="backup-$$(date +%Y%m%d-%H%M%S)"; \
	fi; \
	echo "💾 Creating backup branch: $$NAME"; \
	git checkout -b $$NAME; \
	git push origin $$NAME; \
	git checkout -

branch:
	@if [ -z "$(NAME)" ]; then \
		echo "❌ Error: Please provide a branch name"; \
		echo "Usage: make branch NAME='feature-name'"; \
		exit 1; \
	fi
	@echo "🌿 Creating and switching to branch: $(NAME)"
	git checkout -b $(NAME)

# Utility commands
clean:
	@echo "🧹 Cleaning node_modules and rebuilding..."
	rm -rf node_modules
	rm -f package-lock.json
	npm install

logs:
	@echo "📋 Firebase logs (last 50):"
	firebase functions:log --limit 50

elm-build:
	@if [ -d "elm-kompostedit" ]; then \
		echo "🔨 Building ELM application..."; \
		cd elm-kompostedit && elm make src/Main.elm --output=../public/elm/kompost.js; \
	else \
		echo "⚠️ ELM directory not found (elm-kompostedit)"; \
	fi

version:
	@echo "📈 Current version: $$(node -p "require('./package.json').version")"
	@echo "Bumping patch version..."
	npm version patch --no-git-tag-version
	@echo "New version: $$(node -p "require('./package.json').version")"

# Quick deploy workflow
quick-deploy: status commit push deploy
	@echo "✅ Quick deploy complete!"

# Development workflow  
dev-workflow: status
	@echo "🔄 Starting development workflow..."
	@echo "1. Checking git status..."
	@make --no-print-directory status
	@echo ""
	@echo "2. Starting dev server..."
	@make --no-print-directory dev-clean

# Common patterns
rebuild: clean build
restart: dev-clean