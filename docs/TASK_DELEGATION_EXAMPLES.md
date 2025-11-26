# Task Delegation Examples

This document shows how to use the `@claude` supervision model with detailed prompts.

## Overview

We've set up Issues #15 and #16 with comprehensive delegation prompts. These serve as examples of how to effectively delegate work to Claude Code.

## Issue #15: Load Testing & Scaling

**Status:** Ready to delegate
**Prompt Length:** ~500 lines
**Complexity:** Medium

### What the Prompt Covers

1. **Goal Clarity**
   - Test with 100, 1K, and 10K contexts
   - Identify performance degradation points
   - Document scaling limits

2. **Implementation Steps**
   - Create `tests/integration-2-load-testing.test.ts`
   - Specific test cases to implement (7+ tests)
   - Metrics to measure (save time, memory, search speed)
   - Report format (`LOAD_TEST_RESULTS.md`)

3. **Code Patterns**
   - References to existing test utilities
   - Example code for measuring performance
   - Cleanup and memory tracking

4. **Acceptance Criteria**
   - Explicit checklist of what "done" means
   - Test suite with specific test count
   - Documentation requirements
   - Results must identify breaking points

### Expected Deliverables

✅ New test file: `tests/integration-2-load-testing.test.ts` (200+ lines)
✅ New report: `LOAD_TEST_RESULTS.md` (100+ lines)
✅ All tests passing

**Time to implement:** ~1-2 hours for Claude Code

### How to Delegate

**Option 1: Manual Comment (Current Setup)**
The @claude mention is already in the issue comment. When Claude reads it, the entire prompt is available.

**Option 2: GitHub Actions Auto-Trigger**
When we implement GitHub Actions auto-execution, this prompt will automatically trigger implementation.

---

## Issue #16: Full-Text Search Implementation

**Status:** Ready to delegate
**Prompt Length:** ~400 lines
**Complexity:** Medium

### What the Prompt Covers

1. **Design Decisions**
   - Why full-text search (not semantic/ML-based)
   - Algorithm choice (scoring and ranking)
   - Backward compatibility (keep tag search)

2. **Implementation Steps**
   - Add `searchFullText()` method to `ContextStorage`
   - Implement scoring algorithm with code example
   - Register new MCP tool `search_contexts_fulltext`
   - Create test suite

3. **Code Examples**
   - Full implementation of search algorithm
   - MCP tool registration pattern
   - Test structure with 8+ test cases

4. **Acceptance Criteria**
   - Method implementation
   - MCP tool registration
   - Test coverage
   - Backward compatibility
   - Documentation

### Expected Deliverables

✅ Updated file: `src/storage.ts` (+50 lines)
✅ Updated file: `src/index.ts` (+40 lines)
✅ New test file: `tests/integration-3-search-quality.test.ts` (200+ lines)
✅ All tests passing

**Time to implement:** ~1-2 hours for Claude Code

---

## Prompt Quality Analysis

### What Makes These Prompts Good

✅ **Specific Goals**
```
❌ Bad: "Improve search"
✅ Good: "Implement full-text search with title weighting 10x higher than content"
```

✅ **Implementation Details**
```
❌ Bad: "Add tests"
✅ Good: "Create tests/integration-3-search-quality.test.ts with 8 test cases covering:
  - Multi-word queries
  - Case insensitivity
  - Result limiting
  - Backward compatibility"
```

✅ **Code Patterns**
```
✅ Reference existing code in src/storage.ts, src/index.ts
✅ Show example implementation
✅ Link to test patterns from previous tests
```

✅ **Clear Acceptance Criteria**
```
- [x] Specific method name and signature
- [x] Specific test count
- [x] Specific files to create/update
- [x] Documentation requirements
```

✅ **Context on Related Issues**
```
Issue #15 depends on this for performance testing
Issue #20 might use database for scaling
Issue #22 might optimize this further
```

### What to Avoid

❌ **Vague goals:** "Make search better"
❌ **No examples:** No code samples shown
❌ **Missing acceptance criteria:** No clear "done" definition
❌ **Disconnected from codebase:** No reference to existing patterns
❌ **Incomplete specs:** Missing edge cases or test scenarios

---

## Workflow: From Issue to Implementation

### Step 1: Create Issue with Initial Description
```
Issue #16: Search Improvement
- Tag search is basic
- Need full-text or semantic search
- Acceptance criteria: [basic list]
```

### Step 2: Add Detailed @claude Comment
The comment includes:
- Implementation strategy
- Code patterns and examples
- Test specifications
- Documentation requirements
- Related issues

### Step 3: Claude Reads and Implements
Claude Code reads the issue + detailed comment and:
1. Creates implementation branch
2. Implements all specified methods
3. Writes comprehensive tests (8+ cases)
4. Updates documentation
5. Creates PR with detailed commit message

### Step 4: Review and Merge
```
Supervisor (You):
1. Review PR
2. Check test results
3. Verify acceptance criteria
4. Merge when satisfied
```

### Step 5: Mark Complete
Update original issue with results and link to PR.

---

## How to Write Effective Delegation Prompts

### Template

```markdown
@claude implement [feature name]

## Detailed Implementation Guide

### What This Task Does
[1-2 sentences explaining the goal]

### Implementation Steps

#### 1. [First major step]
Code examples, file names, specific requirements

#### 2. [Second major step]
More detailed specifications

### Code Patterns to Follow
[Links to existing code to use as reference]

### Acceptance Criteria
- [x] Specific deliverable
- [x] Test requirement
- [x] Documentation requirement
- [x] Integration requirement

### Success Definition
[How to verify it works correctly]
```

### Key Elements

1. **Clarity**
   - Specific file names
   - Specific method signatures
   - Specific test cases
   - Specific documentation

2. **Examples**
   - Code snippets (full or pseudocode)
   - Test patterns
   - Expected output

3. **References**
   - Link to similar existing code
   - Point to test patterns to follow
   - Reference related issues

4. **Scope**
   - ~500 lines per prompt is manageable
   - Breaking very large tasks into subtasks helps
   - Clear definition of what's in-scope

---

## Current Task Status

### Completed
✅ Issue #14 - Integration Testing (PR #26)
- 20 automated tests
- Comprehensive testing guide
- All tests passing

### Ready to Delegate (Detailed Prompts)
🔷 Issue #15 - Load Testing & Scaling
- Detailed prompt ready in issue comment
- 7+ test cases specified
- Report format defined

🔷 Issue #16 - Full-Text Search
- Detailed prompt ready in issue comment
- Algorithm and examples provided
- Test structure defined

### Prompt Quality Checklist

For both #15 and #16:
- ✅ Implementation steps clearly outlined
- ✅ Code examples provided
- ✅ Test cases specified with counts
- ✅ Files to create/modify named
- ✅ Acceptance criteria explicit
- ✅ Related issues referenced
- ✅ Code patterns from existing codebase shown
- ✅ Expected deliverables clear

---

## Next Steps

### Option 1: Manual Delegation
```bash
# Read the issue in your editor
gh issue view 15 # See detailed prompt
gh issue view 16 # See detailed prompt

# Manually implement using prompts as guide
```

### Option 2: Try GitHub Actions Automation
```bash
# Add comment to trigger automation
gh issue comment 15 -b "@claude implement this task"
gh issue comment 16 -b "@claude implement this task"

# GitHub Actions will detect and potentially trigger implementation
```

### Option 3: Share with Another Claude Instance
Copy the prompt content and share with another Claude Code instance for parallel work.

---

## Lessons Learned

### What Works Well
- Specific file names and locations
- Code examples (helps avoid assumptions)
- Test case counts (defines scope)
- Referencing existing patterns (consistency)
- Clear acceptance criteria (avoids rework)

### What to Improve
- Some prompts are long (could break into subtasks)
- Could include timeline estimates (though we avoid timelines)
- Could add "gotchas" (common mistakes to avoid)
- Could link to more examples

---

**Status:** Both Issue #15 and #16 have detailed delegation-ready prompts
**Next:** Waiting for implementation (manual or automated)
**Quality:** Comprehensive prompts following best practices
