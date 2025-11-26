# Integration Testing Guide

## Overview

This document covers integration testing for the Context Processor MCP Server with actual IDE clients (Claude IDE, Cursor).

**IMPORTANT:** This project includes automated integration tests in `tests/integration-1-mcp-protocol.test.ts`, but full IDE integration requires manual testing with real IDE clients.

## Automated Tests

### Running Integration Tests

```bash
npm test -- integration-1-mcp-protocol.test.ts
```

These tests verify:
- MCP protocol compliance at the storage layer
- Tool request/response formats
- Concurrent access patterns
- Large content handling
- Preprocessing integration
- Storage persistence

### Test Coverage

| Area | Test | Status |
|------|------|--------|
| MCP Protocol | Tool request/response format | ✅ Automated |
| Concurrency | Concurrent saves/reads | ✅ Automated |
| Content | Large files, Unicode, metadata | ✅ Automated |
| Preprocessing | Clarify, analyze, search strategies | ✅ Automated |
| Persistence | Storage reload, integrity | ✅ Automated |
| IDE Integration | Manual with real clients | ⚠️ Manual Only |

## Manual IDE Integration Testing

### Prerequisites

1. **Context Processor MCP Server Running**
   ```bash
   npm build
   npm start
   ```

2. **Claude IDE or Cursor IDE** with MCP client support

### Claude IDE Testing

#### Setup

1. Open Claude IDE
2. Go to Settings → MCP Servers
3. Add new MCP server:
   - Name: `context-processor`
   - Command: `node /path/to/context-processor/dist/index.js`
   - Or use stdio transport if available

#### Test Cases

##### TC-001: Save Context
**Expected:** Context saves successfully with metadata

1. Open Claude IDE
2. Invoke "Save Context" tool
3. Provide:
   - Title: "Test Context from Claude"
   - Content: "This is a test from Claude IDE"
   - Tags: `["claude-ide", "test"]`
4. **Verify:** Response includes context ID

##### TC-002: Load Context
**Expected:** Saved context loads correctly

1. Execute "Load Context" tool
2. Provide: Context ID from TC-001
3. **Verify:**
   - Title matches
   - Content is identical
   - Tags are present

##### TC-003: List Contexts
**Expected:** All saved contexts appear

1. Execute "List Contexts" tool
2. **Verify:**
   - Shows contexts from TC-001 and TC-002
   - No data loss
   - Proper JSON formatting

##### TC-004: Search Contexts
**Expected:** Tag-based search works

1. Execute "Search Contexts" tool
2. Provide: tags `["claude-ide"]`
3. **Verify:** Returns context from TC-001

##### TC-005: Apply Preprocessing
**Expected:** Preprocessing strategies work

1. Execute "Apply Preprocessing" tool
2. Test with model: `clarify`
3. Provide content with vague language
4. **Verify:** Output is clearer than input

##### TC-006: Delete Context
**Expected:** Context is deleted

1. Execute "Delete Context" tool
2. Provide: Context ID from TC-001
3. Load same context ID
4. **Verify:** Returns "not found" error

### Cursor IDE Testing

#### Setup

1. Open Cursor settings (Cmd/Ctrl + ,)
2. Find MCP section
3. Add Context Processor:
   ```json
   {
     "mcpServers": {
       "context-processor": {
         "command": "node",
         "args": ["/path/to/context-processor/dist/index.js"]
       }
     }
   }
   ```

#### Test Cases

##### TC-C01: Code Context
**Expected:** Can save code file as context

1. Open a TypeScript/JavaScript file
2. Select code section
3. Use Context Processor tool: "Save as Context"
4. **Verify:**
   - Full code is saved
   - Metadata includes file info
   - Search optimization works

##### TC-C02: Multi-File Context
**Expected:** Can combine multiple files

1. Select code from multiple files
2. Save as single context
3. Load and verify
4. **Verify:** All file content is included

##### TC-C03: IDE Integration
**Expected:** Works seamlessly in IDE workflow

1. While editing code, save context
2. Jump to different file
3. Load previous context
4. **Verify:** Doesn't interrupt workflow

### Edge Case Testing

#### EC-001: Large Content (100MB+)
**Expected:** Handles without crashing

1. Create a large file (100KB+ of content)
2. Save as context
3. Load it back
4. **Verify:**
   - No timeouts
   - Memory usage is reasonable
   - Content integrity maintained

#### EC-002: Special Characters & Unicode
**Expected:** Preserves all characters

1. Create context with:
   - Emojis: 🚀 ✨
   - Chinese: 你好
   - Arabic: مرحبا
   - Special: `<>&"'`
2. Save and load
3. **Verify:** All characters preserved exactly

#### EC-003: Rapid Concurrent Saves
**Expected:** No data loss with concurrent access

1. From two IDE windows simultaneously:
   - Save context A
   - Save context B
2. List contexts
3. **Verify:** Both are present, not overwritten

#### EC-004: Network Interruption
**Expected:** Graceful handling

1. Start saving context
2. Interrupt network/connection
3. **Verify:**
   - Clear error message
   - No partial/corrupted state
   - Can retry

#### EC-005: Very Long Operation
**Expected:** Timeout handling

1. Save very large content
2. Monitor for timeouts
3. **Verify:** Completes or times out gracefully

### Performance Testing

#### PT-001: Save Performance
**Expected:** Save under 100ms for typical content

```
Content Size | Expected Time | Actual Time
10 KB        | < 10ms        | _____ ms
100 KB       | < 50ms        | _____ ms
1 MB         | < 100ms       | _____ ms
```

Measure:
```bash
time context_processor.save_context(content)
```

#### PT-002: Search Performance
**Expected:** Search under 50ms for 1000 contexts

1. Save 1000 contexts with tags
2. Execute search with specific tag
3. Measure response time

#### PT-003: Memory Usage
**Expected:** Linear growth, no leaks

Tools needed:
- IDE performance profiler
- Memory monitor

Steps:
1. Monitor memory before operations
2. Perform 100 save/load cycles
3. Check memory after
4. Verify: No exponential growth

### Regression Testing

Run these tests after any code changes:

```bash
# Unit tests (automated)
npm test

# Integration tests (automated)
npm test -- integration

# Manual IDE tests (selective)
- TC-001 (Save)
- TC-002 (Load)
- TC-003 (List)
- TC-C01 (Code context in Cursor)
```

## Known Limitations

### Current (v1.0.2)

1. **No real database** - File-based storage
2. **Tag search only** - No full-text search
3. **No concurrent locking** - Potential race conditions
4. **No encryption** - Data stored in plain text
5. **Windows tested in CI** - macOS/Linux may have issues

### Impact on Integration

- ✅ Small projects (< 1000 contexts)
- ✅ Single IDE instance
- ⚠️ Multiple concurrent IDEs (may have race conditions)
- ❌ Large datasets (100K+ contexts)
- ❌ Sensitive data (needs encryption)

## Reporting Issues

If you find integration issues:

1. **Collect information:**
   - IDE (Claude IDE / Cursor)
   - OS (Windows / macOS / Linux)
   - Test case number
   - Exact error message
   - Content size (if applicable)

2. **Report to:**
   - Create GitHub issue with label: `integration-testing`
   - Reference test case (TC-001, TC-C02, etc.)
   - Include reproduction steps

## Future Improvements

See Issue #14 and related tasks:
- [ ] Real database backend (Issue #20)
- [ ] Full-text search (Issue #16)
- [ ] Concurrency locking (Issue #19)
- [ ] Load testing (Issue #15)
- [ ] Security audit (Issue #21)

## Continuous Integration

Currently:
- ✅ Unit tests run on every commit
- ✅ Integration tests run on every commit
- ⚠️ IDE integration tested manually

Future:
- [ ] Automated IDE integration via containers
- [ ] Performance benchmarks in CI
- [ ] Cross-platform testing (Windows/Mac/Linux)

---

**Status:** Active
**Last Updated:** 2025-11-26
**Maintainer:** Martin Schultheiss
