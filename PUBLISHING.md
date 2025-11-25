# Publishing Guide - Context Processor

This guide covers publishing the Context Processor to npm and GitHub.

## Quick Start

### 1. Before Publishing

```bash
# Verify everything is working
npm install
npm run build
npm test

# Check coverage
npm run test:coverage
```

### 2. Update Version (if releasing new version)

```bash
npm version patch   # 1.0.0 → 1.0.1 (bug fixes)
npm version minor   # 1.0.0 → 1.1.0 (new features)
npm version major   # 1.0.0 → 2.0.0 (breaking changes)
```

### 3. Create npm Account

```bash
npm adduser
# Enter username, password, and email
```

### 4. Publish to npm

```bash
npm publish
```

### 5. Create GitHub Release

```bash
git tag v1.0.0
git push origin v1.0.0
```

---

## Detailed Publishing Steps

### Step 1: Prepare the Repository

#### Check Git Status
```bash
git status
```

#### Stage All Files
```bash
git add .
```

#### Create Initial Commit
```bash
git commit -m "Initial release: Context Processor v1.0.0

- Complete MCP server implementation
- 211 comprehensive test cases
- 5 pre-processing strategies
- Full documentation
- Ready for production use"
```

### Step 2: Set Up GitHub (Optional but Recommended)

```bash
# Create a new repository on GitHub (https://github.com/new)
# Then connect it:

git remote add origin https://github.com/YOUR_USERNAME/context-mcp-server.git
git branch -M main
git push -u origin main
```

### Step 3: Prepare for npm Publishing

#### Verify package.json

Your package.json should have:

```json
{
  "name": "context-mcp-server",
  "version": "1.0.0",
  "description": "MCP server for intelligent context management with pre-processing tasks",
  "main": "dist/index.js",
  "type": "module",
  "repository": {
    "type": "git",
    "url": "https://github.com/YOUR_USERNAME/context-mcp-server.git"
  },
  "keywords": [
    "mcp",
    "model-context-protocol",
    "context-management",
    "preprocessing",
    "nlp",
    "claude"
  ],
  "author": "Your Name",
  "license": "MIT",
  "bugs": {
    "url": "https://github.com/YOUR_USERNAME/context-mcp-server/issues"
  },
  "homepage": "https://github.com/YOUR_USERNAME/context-mcp-server#readme"
}
```

### Step 4: Build and Test

```bash
# Clean build
rm -rf dist node_modules
npm install
npm run build

# Run all tests
npm test

# Check code coverage
npm run test:coverage

# Verify package contents
npm pack
```

### Step 5: Create .npmignore

```bash
echo "tests/
.github/
.vscode/
coverage/
*.log
.gitignore
.env
.env.local" > .npmignore
```

### Step 6: npm Publishing

#### Create npm Account (if needed)
```bash
npm adduser
```

#### Publish to npm
```bash
npm publish
```

#### Verify Publishing
```bash
npm info context-mcp-server
npm view context-mcp-server
```

### Step 7: Git Release (for GitHub)

```bash
# Tag the release
git tag v1.0.0 -m "Release version 1.0.0"

# Push to GitHub
git push origin main
git push origin v1.0.0

# Create GitHub release from web interface
# or with gh CLI:
gh release create v1.0.0 --title "v1.0.0" --notes "Initial release"
```

---

## Publishing Checklist

### Before Publishing
- [ ] All tests passing (211/211)
- [ ] Coverage report reviewed (85%+)
- [ ] Code built successfully
- [ ] Documentation complete
- [ ] Version number updated
- [ ] CHANGELOG updated
- [ ] LICENSE file present
- [ ] package.json complete and valid

### Publishing Steps
- [ ] npm account created
- [ ] Repository initialized
- [ ] All files committed to git
- [ ] Version tagged in git
- [ ] Published to npm
- [ ] npm package verified
- [ ] GitHub release created (optional)

### After Publishing
- [ ] Verify on npm registry
- [ ] Install from npm and test
- [ ] Create documentation for users
- [ ] Share on relevant communities
- [ ] Monitor for issues

---

## Package.json Configuration for Publishing

```json
{
  "name": "context-mcp-server",
  "version": "1.0.0",
  "description": "Intelligent context management MCP server with pre-processing strategies",
  "main": "dist/index.js",
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": [
    "dist",
    "src",
    "context-models.json",
    "README.md",
    "LICENSE"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/YOUR_USERNAME/context-mcp-server.git"
  },
  "keywords": [
    "mcp",
    "model-context-protocol",
    "context",
    "preprocessing",
    "nlp",
    "claude",
    "ai",
    "language-model"
  ],
  "author": "Your Name <your.email@example.com>",
  "license": "MIT",
  "bugs": {
    "url": "https://github.com/YOUR_USERNAME/context-mcp-server/issues"
  },
  "homepage": "https://github.com/YOUR_USERNAME/context-mcp-server#readme",
  "engines": {
    "node": ">=16.0.0"
  },
  "scripts": {
    "build": "tsc",
    "dev": "ts-node src/index.ts",
    "start": "node dist/index.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:verbose": "jest --verbose",
    "prepublishOnly": "npm run build && npm test"
  }
}
```

---

## Publishing to Different Registries

### npm Registry (Default)
```bash
npm publish
```

### GitHub Packages
```bash
# Configure ~/.npmrc
echo "@YOUR_USERNAME:registry=https://npm.pkg.github.com" >> ~/.npmrc
echo "//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN" >> ~/.npmrc

# Publish to GitHub
npm publish --registry=https://npm.pkg.github.com
```

### Private Registry
```bash
npm publish --registry=https://your-registry.com
```

---

## Semantic Versioning

Follow Semantic Versioning (semver):

### Version Format: MAJOR.MINOR.PATCH

- **MAJOR** (1.0.0): Breaking changes
- **MINOR** (1.1.0): New features (backward compatible)
- **PATCH** (1.0.1): Bug fixes (backward compatible)

### Examples
```bash
# Bug fix: 1.0.0 → 1.0.1
npm version patch

# New feature: 1.0.0 → 1.1.0
npm version minor

# Breaking change: 1.0.0 → 2.0.0
npm version major

# Pre-release: 1.0.0-beta.1
npm version prerelease
```

---

## Changelog Format

Create `CHANGELOG.md`:

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-11-25

### Added
- Initial release of Context Processor
- 6 MCP tools for context management
- 5 pre-processing strategies
- 211 comprehensive test cases (85%+ coverage)
- Complete documentation (60+ pages)
- Support for Claude Code integration

### Features
- Save and retrieve contexts with metadata
- Tag-based organization and discovery
- Pre-processing strategies:
  - Clarify: Language improvement
  - Analyze: Content metrics
  - Search: Keyword extraction
  - Fetch: URL detection
  - Custom: Extensible logic
- 5 pre-configured models
- File-based storage
- Full TypeScript support
- Production-ready

## [Unreleased]

### Planned
- Database backend support
- Vector embeddings
- Multi-user support
- Real-time collaboration
```

---

## GitHub Repository Setup

### Create Repository on GitHub

1. Go to https://github.com/new
2. Repository name: `context-mcp-server`
3. Description: "Intelligent context management MCP server with pre-processing strategies"
4. Choose: Public (for open source)
5. Create repository

### Add Remote and Push

```bash
git remote add origin https://github.com/YOUR_USERNAME/context-mcp-server.git
git branch -M main
git push -u origin main
```

### Create Branch Protection (Optional)

1. Go to Settings → Branches
2. Add rule for `main`
3. Require status checks to pass
4. Require code reviews

### Enable GitHub Pages (Optional)

For documentation hosting:

1. Settings → Pages
2. Source: main branch
3. Folder: /docs (if you move documentation)

---

## CI/CD Setup for GitHub Actions

Create `.github/workflows/publish.yml`:

```yaml
name: Publish

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - uses: actions/setup-node@v2
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'

      - run: npm install
      - run: npm run build
      - run: npm test
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## Distributing the Package

### 1. npm Installation
```bash
npm install context-mcp-server
```

### 2. GitHub Release
Create release on GitHub with:
- Release notes
- Precompiled binaries (if applicable)
- Changelog
- Installation instructions

### 3. Documentation Site
Host on GitHub Pages:
```bash
# Copy docs to docs/ folder
# Enable GitHub Pages in settings
```

### 4. Social Media & Communities
- Share on Twitter/X
- Post on dev.to
- Share on Product Hunt
- Post on Reddit (r/node, r/typescript, r/github)
- Announce in relevant Slack/Discord communities

---

## Security Considerations

### Before Publishing

1. **No Secrets**: Remove any API keys, tokens, credentials
   ```bash
   grep -r "secret\|token\|password" src/ tests/
   ```

2. **Audit Dependencies**: Check for vulnerabilities
   ```bash
   npm audit
   npm audit fix
   ```

3. **License Check**: Ensure all dependencies have compatible licenses
   ```bash
   npm ls --depth=0
   ```

### npm Security

1. Enable 2FA on npm account:
   ```bash
   npm profile enable-2fa auth-only
   ```

2. Use automation tokens for CI/CD:
   ```bash
   npm token create --read-only
   ```

---

## Versioning Strategy

### Current Release Plan

```
1.0.0 - Initial release
  └─ Core functionality
  └─ 5 strategies
  └─ Full testing
  └─ Complete documentation

1.1.0 - Feature additions
  └─ Database support
  └─ Vector embeddings
  └─ Additional strategies

2.0.0 - Major improvements
  └─ Breaking changes
  └─ Architecture improvements
  └─ Multi-user support
```

---

## Post-Publication

### Monitor & Support

1. **Watch Issues**: Check GitHub issues regularly
2. **Track Usage**: Monitor npm downloads
3. **Gather Feedback**: Accept bug reports and feature requests
4. **Respond Promptly**: Address security issues first

### Metrics to Track

```bash
# Check download stats
npm stat context-mcp-server

# View package info
npm view context-mcp-server

# Check dependencies
npm audit context-mcp-server
```

### Update Releases

```bash
# Make changes
# Update version
npm version patch

# Publish update
npm publish

# Create git tag
git tag v1.0.1
git push origin v1.0.1
```

---

## Quick Publishing Commands

```bash
# Full checklist
npm install                    # Install deps
npm run build                  # Build code
npm test                       # Run tests
npm run test:coverage         # Check coverage
npm audit                      # Check security

# Prepare release
git add .
git commit -m "Release v1.0.0"

# Publish
npm version patch              # Update version
npm publish                    # Publish to npm
git push origin main          # Push to GitHub
git push origin v1.0.1        # Push tag

# Verify
npm info context-mcp-server   # Check npm
npm view context-mcp-server   # View details
```

---

## Troubleshooting

### npm Publish Errors

**Error: "npm ERR! 404 Not Found"**
- Solution: Ensure package name is unique on npm

**Error: "npm ERR! You need to be logged in"**
- Solution: Run `npm login` first

**Error: "npm ERR! version already exists"**
- Solution: Update version with `npm version patch`

### GitHub Push Errors

**Error: "fatal: remote origin already exists"**
- Solution: `git remote remove origin` then add again

**Error: "Permission denied (publickey)"**
- Solution: Configure SSH keys or use HTTPS with token

---

## Resources

- [npm Official Guide](https://docs.npmjs.com/cli/publish)
- [GitHub Publishing](https://docs.github.com/en/repositories/releasing-projects-on-github)
- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [npx](https://docs.npmjs.com/cli/v8/commands/npx)

---

## Support

For issues or questions:

1. Check GitHub Issues
2. Review documentation
3. Create issue with:
   - Description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment (Node version, OS)
   - Error logs

---

**Ready to Publish!**

Follow the steps above to publish the Context Processor to npm and GitHub.
