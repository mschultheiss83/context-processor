# Claude Supervision Workflow

This project uses a **supervisor-developer model** where you (the supervisor) delegate tasks to Claude (the developer) through GitHub Actions automation.

## Quick Start

### Delegating a Task

1. **Find an issue** with the `claude-task` label
2. **Comment** with `@claude` mention:
   ```
   @claude implement integration tests for this task
   ```
3. **GitHub Actions detects** the mention
4. **Creates a task branch** with the work
5. **Opens a PR** for your review
6. **You review and merge** when ready

## How It Works

### 1. GitHub Actions Listener

When you mention `@claude` in an issue comment, the `claude-dispatch` workflow:

```
Issue Comment with @claude
         ↓
GitHub Actions Triggered
         ↓
Task Parsed (extract text after @claude)
         ↓
'claude-task' Label Added
         ↓
Task Branch Created
         ↓
Status Comment Posted
         ↓
PR Created (ready for implementation)
```

### 2. Task Execution

**Current Workflow (v1):**
- GitHub Actions creates the task branch
- Posts a status comment
- **You then manually run**: `claude code` locally to implement
- Claude Code reads the issue context
- Implements the solution
- Commits to the branch
- You review the PR

**Future Workflow (v2 - auto-execute):**
- GitHub Actions could auto-execute Claude Code via API
- Completely hands-off implementation

## Task Structure

### Issue #10 - Main Epic

The parent epic for quality improvements:
- 10 linked subtasks (Issues #14-#23)
- Each task addresses a specific concern
- All labeled with `claude-task`

### Available Tasks

| Issue | Task | Priority | Status |
|-------|------|----------|--------|
| #14 | Integration Testing | High | Pending |
| #15 | Load Testing & Scaling | High | Pending |
| #16 | Search Improvement | High | Pending |
| #17 | Error Handling | High | Pending |
| #18 | Logging & Monitoring | Medium | Pending |
| #19 | Concurrency Control | High | Pending |
| #20 | Database Alternative | Medium | Pending |
| #21 | Security Review | Low | Pending |
| #22 | Performance Profiling | Medium | Pending |
| #23 | Documentation Testing | Medium | Pending |

## Supervision Model

### Your Role (Supervisor)
1. ✅ Define requirements in issues
2. ✅ Delegate tasks via `@claude` comments
3. ✅ Review pull requests for quality
4. ✅ Merge when satisfied
5. ✅ Handle strategic decisions
6. ✅ Validate results

### Claude's Role (Developer)
1. 🤖 Implement solutions
2. 🤖 Write tests
3. 🤖 Follow code patterns
4. 🤖 Update documentation
5. 🤖 Create comprehensive PRs
6. 🤖 Propose improvements

## Example Workflow

### Step 1: Open an Issue to Delegate

```
Issue #14: Integration Testing
├─ Labels: claude-task, p-high, testing
├─ Assigned to: You (auto-assigned)
└─ Status: Pending implementation
```

### Step 2: Comment with @claude

```
You comment:
"@claude implement integration tests that verify this works with real Claude IDE"
```

### Step 3: GitHub Actions Responds

The `claude-dispatch` workflow:
1. Detects your comment
2. Adds `claude-task` label (already there)
3. Creates branch: `claude-task-14-1234567890`
4. Posts a status comment:
   ```
   🤖 Claude Task Dispatched

   Task: implement integration tests that verify this works with real Claude IDE
   Status: Queued for implementation
   ```

### Step 4: You Run Claude Code

```bash
claude code --issue 14
```

This tells Claude Code to:
- Fetch issue #14 details
- Understand the requirements
- Implement the solution
- Commit to the task branch

### Step 5: Review & Merge

- Claude commits the implementation
- GitHub Actions creates a PR
- You review the changes
- Merge when satisfied
- Task status updates

## Setting Up Your Environment

### Required

1. **GitHub CLI** (`gh`) - Already installed
2. **Claude Code** - Already installed locally
3. **GitHub API access** - Your existing auth

### Optional

- Set `GITHUB_TOKEN` for CI automation
- Configure git commit signing (recommended)

## Best Practices

### For Effective Delegation

1. **Be specific in requirements**
   - Good: "Create integration tests that verify context save/load works with Claude IDE"
   - Bad: "Make tests better"

2. **Use clear task descriptions**
   - Include acceptance criteria
   - List what "done" looks like
   - Mention any constraints

3. **Review carefully**
   - Check code quality
   - Verify tests pass
   - Validate documentation
   - Ensure it solves the problem

4. **Give feedback**
   - Request changes if needed
   - Approve when ready
   - Document why if you reject

### For Better Results

- Break large tasks into smaller subtasks
- Label tasks by priority (p-high, p-medium, p-low)
- Use specific issue links in comments
- Reference acceptance criteria
- Include test requirements explicitly

## Troubleshooting

### "GitHub Actions didn't detect my @claude comment"

Check:
- [ ] Used `@claude` (exact spelling, case-insensitive)
- [ ] Comment is on a GitHub issue (not PR)
- [ ] Workflow file exists: `.github/workflows/claude-dispatch.yml`
- [ ] Workflow is enabled in Settings → Actions

### "No PR was created"

Check:
- [ ] The task branch was created: `git branch -a | grep claude-task`
- [ ] GitHub Actions logs for errors
- [ ] Repository settings don't prevent branch creation

### "Claude Code didn't implement the task"

Check:
- [ ] Issue description is clear
- [ ] Acceptance criteria are listed
- [ ] No conflicting requirements
- [ ] Claude Code has proper authentication

## Advanced Usage

### Batch Task Delegation

Comment with multiple @claude mentions:

```
@claude implement logging system
@claude add monitoring hooks
@claude create health check endpoint
```

Each creates a separate task.

### Conditional Tasks

Reference specific conditions:

```
@claude implement this only if Issue #15 shows scaling is a real problem
```

### Feedback Loop

Request improvements:

```
@claude revise the implementation to use SQLite instead of file-based storage
```

## Monitoring Progress

### Check Task Status

```bash
# List all claude-task issues
gh issue list --label claude-task

# View specific task
gh issue view 14

# Check PR status
gh pr list --search "claude-task-14"
```

### Dashboard View

The main epic (Issue #10) has a table showing all task status.

## Future Enhancements

Planned improvements to this workflow:

- [ ] Auto-execute Claude Code in GitHub Actions
- [ ] Automatic PR creation with templated descriptions
- [ ] Task dependency tracking
- [ ] Performance metrics for delegated work
- [ ] Automatic merging for simple tasks
- [ ] Slack/Discord notifications for task completion
- [ ] Periodic reports on task progress

## Questions?

For issues with the workflow:
1. Check this documentation
2. Review GitHub Actions logs
3. Check `.claude/settings.local.json` for permission issues
4. Open an issue with `bug` label

---

**Status:** Active Supervision Model
**Version:** 1.0
**Last Updated:** 2025-11-26
