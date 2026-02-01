# Error Handling and Recovery

This document describes the error handling and recovery mechanisms implemented in the Context Processor MCP server.

## Overview

The Context Processor implements comprehensive error handling for common failure scenarios:

1. **Disk Full (ENOSPC)** - When the storage device runs out of space
2. **Corrupted JSON** - When context files become corrupted or invalid
3. **Permission Changes (EACCES)** - When file/directory permissions prevent access
4. **Transient Errors** - Temporary failures that may succeed on retry

## Error Scenarios

### 1. Disk Full (ENOSPC)

**Scenario**: The system attempts to save a context but the disk is full.

**Detection**: Caught during `fs.writeFileSync()` operations with error code `ENOSPC`.

**Recovery**:
- Error is immediately reported to the user with a clear message
- User is advised to free up disk space
- No data corruption occurs - the operation simply fails safely
- Previous backups remain intact

**Example Error Message**:
```
Error [ENOSPC]: Disk full: Cannot save context. Free up disk space and try again.

Recovery: Free up disk space and try again.
```

### 2. Corrupted JSON

**Scenario**: A context file becomes corrupted (invalid JSON syntax or missing required fields).

**Detection**:
- Caught during `JSON.parse()` operations (SyntaxError)
- Caught during validation of required fields (id, title, content)

**Recovery**:
1. System automatically searches for backup files in `.backups/` directory
2. Uses the most recent valid backup (sorted by timestamp in filename)
3. Restores the backup to the main location
4. Returns the recovered context to the user

**Backup File Naming**:
```
.backups/<context-id>.<timestamp>.backup.json
```

**Example**:
```
.backups/a1b2c3d4-e5f6-7g8h-9i0j-1k2l3m4n5o6p.1706745123456.backup.json
```

**Behavior**:
- `load()`: Attempts recovery, throws error if no valid backup exists
- `list()`: Skips corrupted files or recovers if backup exists, continues processing other files
- `save()`: Creates backup before overwriting (if file exists)

**Example Error Message** (when no backup available):
```
Error [CORRUPTED_JSON]: Context file is corrupted and no valid backup found for 'context-id'

Recovery: The system attempted automatic recovery from backup.
```

### 3. Permission Changes (EACCES)

**Scenario**: File or directory permissions prevent read/write/delete operations.

**Detection**: Caught during file operations with error code `EACCES`.

**Recovery**:
- Error is reported with specific file/directory path
- User is advised to check permissions
- No automatic recovery (requires manual intervention)

**Affected Operations**:
- Storage directory creation/access
- Reading context files
- Writing context files
- Deleting context files
- Listing directory contents

**Example Error Messages**:
```
Error [EACCES]: Permission denied: Cannot access storage directory './contexts'

Recovery: Check file/directory permissions.
```

```
Error [EACCES]: Permission denied: Cannot write to './contexts/context-id.json'

Recovery: Check file/directory permissions.
```

### 4. Transient Errors

**Scenario**: Temporary failures (e.g., file locks, network file systems, etc.)

**Detection**: Errors that don't match known non-recoverable error codes.

**Recovery**:
- Automatic retry with exponential backoff
- Up to 3 attempts with delays of 100ms, 200ms, 300ms
- If all retries fail, error is reported to user

**Example Error Message** (after exhausting retries):
```
Error [RETRY_EXHAUSTED]: save failed after 3 attempts: <original error message>
```

## Backup System

### Automatic Backups

Backups are automatically created in the following scenarios:

1. **Before Modification**: When `save()` is called on an existing context
2. **Before Deletion**: When `delete()` is called on a context

### Backup Storage

- Location: `.backups/` subdirectory within the storage directory
- Format: `<context-id>.<timestamp>.backup.json`
- Retention: Backups are not automatically deleted (manual cleanup may be needed)

### Backup Directory Structure

```
contexts/
├── context-1.json
├── context-2.json
└── .backups/
    ├── context-1.1706745100000.backup.json
    ├── context-1.1706745200000.backup.json
    └── context-2.1706745150000.backup.json
```

### Recovery Process

When a corrupted file is detected:

1. List all backup files for the context ID
2. Sort by timestamp (most recent first)
3. Attempt to parse and validate each backup
4. Use the first valid backup found
5. Restore backup to main location
6. Return the recovered context

## Error Types

### StorageError Class

Custom error class extending `Error` with additional properties:

```typescript
class StorageError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = false
  )
}
```

**Properties**:
- `message`: Human-readable error description
- `code`: Error code (ENOSPC, EACCES, CORRUPTED_JSON, etc.)
- `recoverable`: Whether the error may be transient/retryable

**Common Error Codes**:
- `ENOSPC`: Disk full
- `EACCES`: Permission denied
- `CORRUPTED_JSON`: Invalid or corrupted JSON data
- `RETRY_EXHAUSTED`: All retry attempts failed
- `INIT_ERROR`: Failed to initialize storage directory
- `LIST_ERROR`: Failed to list contexts
- `DELETE_ERROR`: Failed to delete context

## Best Practices

### For Users

1. **Monitor Disk Space**: Ensure adequate free space before saving large contexts
2. **Set Proper Permissions**: Ensure the application has read/write access to the storage directory
3. **Regular Backups**: While automatic backups exist, consider periodic external backups
4. **Backup Cleanup**: Periodically review and clean up old backup files if storage is limited

### For Developers

1. **Error Handling**: Always wrap storage operations in try-catch blocks
2. **User Feedback**: Use the `formatError()` method to provide helpful error messages
3. **Testing**: Test error scenarios with the provided test suite
4. **Monitoring**: Log errors to console.error for debugging

## Configuration

### Retry Settings

The retry mechanism can be configured by modifying `ContextStorage` class properties:

```typescript
private maxRetries: number = 3;          // Number of retry attempts
private retryDelay: number = 100;        // Base delay in milliseconds
```

Delay increases exponentially: `retryDelay * (attempt + 1)`

### Storage Locations

Default storage locations can be configured during initialization:

```typescript
const storage = new ContextStorage("./custom-contexts");
// Backup directory will be: ./custom-contexts/.backups
```

## Error Handling Flow

```
User Action (save/load/delete/list)
    ↓
Try Operation
    ↓
Error Detected? ──No──→ Success
    ↓ Yes
    ↓
Identify Error Type
    ↓
┌───────────┬──────────────┬───────────────┬──────────────┐
│  ENOSPC   │   EACCES     │  CORRUPTED    │  TRANSIENT   │
│  (Disk)   │ (Permission) │    (JSON)     │   (Other)    │
└─────┬─────┴──────┬───────┴───────┬───────┴──────┬───────┘
      │            │               │              │
      │            │               │              │
   Report       Report        Restore          Retry
   to User      to User       Backup        (3 attempts)
      │            │               │              │
      ↓            ↓               ↓              ↓
   Failed       Failed       Success or      Success or
                             Failed          Failed
```

## Testing

Run the error handling test suite:

```bash
npm test -- error-handling.test.ts
```

Tests cover:
- Corrupted JSON recovery
- Backup creation and restoration
- Permission error handling
- Data validation
- Error message formatting
- Backup directory management

## Troubleshooting

### "Disk full" errors

1. Check available disk space: `df -h`
2. Remove unnecessary files or contexts
3. Consider moving storage to a larger volume

### "Permission denied" errors

1. Check file permissions: `ls -la contexts/`
2. Ensure the application user has read/write access
3. Fix permissions: `chmod -R 755 contexts/`

### Corrupted contexts without backups

If a context is corrupted and no backup exists:
1. The context cannot be recovered automatically
2. Check if you have external backups
3. Consider the context lost and recreate if possible

### Multiple backup files accumulating

Backups are not auto-deleted. To clean up old backups:

```bash
# List backups older than 30 days
find contexts/.backups -name "*.backup.json" -mtime +30

# Delete backups older than 30 days (careful!)
find contexts/.backups -name "*.backup.json" -mtime +30 -delete
```

## Future Enhancements

Potential improvements to error handling:

1. **Backup Retention Policy**: Automatic cleanup of old backups
2. **Compression**: Compress backup files to save space
3. **Health Checks**: Periodic validation of all context files
4. **Repair Tools**: CLI tool to scan and repair corrupted contexts
5. **Monitoring**: Metrics on error rates and recovery success
6. **Alternative Storage**: Support for databases with built-in redundancy
