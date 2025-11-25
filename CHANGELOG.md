# Changelog

All notable changes to Context Processor are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-11-25

### Added

- **GitHub Actions Workflows** - Automated Claude Code integration for issue/PR assistance and PR reviews
- **Comprehensive Documentation** - Full GitHub Wiki with 8 pages covering usage scenarios, API reference, and troubleshooting
- **Examples Directory** - 5 complete, runnable TypeScript examples demonstrating core features
  - Basic usage (save, load, list, search, delete)
  - Comprehensive processing with all strategies
  - Search optimization workflows
  - Batch operations and pagination
  - Knowledge base construction
- **Official Registry Listing** - Context Processor now listed in the [Model Context Protocol Servers Registry](https://github.com/modelcontextprotocol/servers) under Community Servers

### Fixed

- **Windows Compatibility** - Resolved ENOTEMPTY errors on concurrent file system operations by configuring Jest for sequential test execution (`maxWorkers: 1`)
- **MCP SDK Integration** - Updated to work with latest SDK version (1.0.0+) API patterns

### Changed

- **Documentation Structure** - Moved from markdown files to comprehensive GitHub Wiki for better navigation and discoverability
- **Community Focus** - Listed as Community Server in official registry (appropriate for community-driven development)

### Performance

- No performance regressions reported
- All 81 tests pass on Windows, macOS, and Linux
- Batch operations maintain consistent performance across platforms

## [1.0.0] - 2025-11-22

### Added

- **Core Context Processor** - Intelligent context management system with file-based storage
- **6 MCP Tools** - Complete Model Context Protocol integration:
  - `save_context` - Create/update contexts with optional preprocessing
  - `load_context` - Retrieve contexts by ID
  - `list_contexts` - List and filter contexts
  - `list_models` - Discover available preprocessing models
  - `get_model_info` - Get detailed model information
  - `delete_context` - Remove contexts from storage

- **5 Built-in Models** - Pre-configured preprocessing strategies:
  - `clarify` - Improve content clarity with detailed suggestions
  - `analyze` - Extract content metrics and statistics
  - `search_optimized` - Enhance discoverability through keyword extraction
  - `web_enhanced` - Detect and extract URLs and external references
  - `comprehensive` - Apply all strategies for maximum enhancement

- **Flexible Storage** - File-based JSON storage with automatic directory creation
- **Tag-Based Search** - Built-in tag system for organizing and discovering contexts
- **Metadata Support** - Flexible metadata objects for custom classification
- **Type Safety** - Full TypeScript support with comprehensive type definitions
- **Testing** - 81 comprehensive tests covering:
  - Scenario 1: Lifecycle management (save, load, list, delete, search)
  - Scenario 2: All 5 preprocessing strategies and their output
  - Scenario 3: Advanced workflows and edge cases

### Technical Details

- **Language**: TypeScript 5.0+
- **Runtime**: Node.js 16.0.0+
- **Module System**: ES Modules (ESM)
- **Testing**: Jest with ts-jest
- **Package Manager**: npm/yarn compatible

### Repository

- Published on npm: [@mschultheiss83/context-processor](https://www.npmjs.com/package/context-processor)
- Source on GitHub: [mschultheiss83/context-processor](https://github.com/mschultheiss83/context-processor)
- License: MIT

### Documentation

- QUICKSTART.md - Quick start guide
- CONTRIBUTING.md - Contribution guidelines
- ARCHITECTURE.md - System architecture details
- TESTING.md - Testing guide
- CLAUDE_CODE_INTEGRATION.md - Claude Code integration guide

---

## Version History

| Version | Release Date | Status | Changes |
|---------|-------------|--------|---------|
| 1.0.1   | 2025-11-25  | Latest | Windows fix, wiki, examples, GitHub Actions |
| 1.0.0   | 2025-11-22  | Stable | Initial release, core features, 81 tests |

---

## Migration Guide

### From Community Testing (Pre-Release) to 1.0.1

If you were using the pre-release version, version 1.0.1 is a drop-in replacement:

1. Update package.json:
   ```bash
   npm install context-processor@latest
   ```

2. Your existing code will continue to work without changes
3. New features (examples, enhanced docs) are available but optional

### Breaking Changes

**None in 1.0.1**

All changes are backward compatible.

---

## Roadmap

### Planned for Future Releases

- **v1.1.0**
  - [ ] Custom strategy API
  - [ ] Database adapter support (PostgreSQL, MongoDB)
  - [ ] More built-in models
  - [ ] Performance optimizations

- **v1.2.0**
  - [ ] Plugin system
  - [ ] Advanced filtering API
  - [ ] Context relationships/linking

- **v1.3.0**
  - [ ] Community strategy marketplace
  - [ ] Browser support (experimental)
  - [ ] Real-time synchronization

---

## Support

- **Issues**: [GitHub Issues](https://github.com/mschultheiss83/context-processor/issues)
- **Discussions**: [GitHub Discussions](https://github.com/mschultheiss83/context-processor/discussions)
- **Wiki**: [Documentation Wiki](https://github.com/mschultheiss83/context-processor/wiki)
- **Examples**: See [examples/](./examples/) directory

---

## Credits

Developed by [Martin Schultheiss](https://github.com/mschultheiss83)

Special thanks to:
- [Anthropic](https://www.anthropic.com/) for Claude Code integration
- [Model Context Protocol](https://modelcontextprotocol.io/) for the protocol specification
- Community testers and contributors

---

## License

MIT © 2025 Martin Schultheiss
