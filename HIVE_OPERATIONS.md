# Hive Community Management Operations Reference

**Quick Reference Guide for TaxiHub Development**

This document contains all the Hive blockchain operations needed to build and manage taxi driver communities on Hive.

---

## Table of Contents

1. [Client Setup](#client-setup)
2. [Authentication](#authentication)
3. [Community Information](#community-information)
4. [Member Management](#member-management)
5. [Role Management](#role-management)
6. [Moderation Operations](#moderation-operations)
7. [Content Management](#content-management)
8. [Subscription Management](#subscription-management)
9. [Statistics & Analytics](#statistics--analytics)
10. [Broadcasting Operations](#broadcasting-operations)

---

## Client Setup

### Initialize dhive Client

```js
const dhive = require('@hiveio/dhive');

const client = new dhive.Client([
  'https://api.hive.blog',
  'https://anyx.io',
  'https://rpc.ausbit.dev'
]);
```

**Best Practice**: Use multiple RPC endpoints for reliability and load balancing.

---

## Authentication

### Posting Authority

All community operations require the admin/mod's posting key:

```js
const privateKey = dhive.PrivateKey.fromString(process.env.HIVE_POSTING_KEY);
```

**Security Note**: Never expose private keys. Always use environment variables.

---

## Community Information

### Get Community Details

```js
const community = await client.call('bridge', 'get_community', {
  name: 'hive-123456'
});
```

**Returns**:
- `name`: Community identifier
- `title`: Display name
- `about`: Description
- `description`: Long-form description
- `admins`: List of admin accounts
- `mods`: List of moderator accounts
- `num_pending`: Posts awaiting approval
- `num_authors`: Total unique posters
- `subscribers`: Total subscriber count
- `created_at`: Creation timestamp
- `lang`: Primary language
- `is_nsfw`: Content rating flag

---

## Member Management

### List All Subscribers

```js
const members = await client.call('bridge', 'list_subscribers', {
  community: 'hive-123456',
  limit: 100,         // Max 100 per request (default: 100)
  last: ''            // Optional: last account from previous call for pagination
});
```

**Returns Array of Arrays**:
Each element is `[account, role, title, created_at]`:
- `account`: Username (string)
- `role`: 'admin', 'mod', 'member', 'muted', or '' for guest/subscriber (string)
- `title`: Custom title or null (string|null)
- `created_at`: Subscription date ISO format (string)

**Notes**:
- Results are sorted alphabetically by account name
- `sort` parameter is NOT supported by this API
- **Pagination**: Use the last `account` value as `last` parameter for next page

### List Community Roles

```js
const roles = await client.call('bridge', 'list_community_roles', {
  community: 'hive-123456',
  last: ''            // For pagination
});
```

**Returns**:
- `owner`: Community owner account
- `admins`: Array of admin accounts
- `mods`: Array of mod accounts
- `members`: Array of member accounts
- `muted`: Array of muted accounts

---

## Role Management

### Set User Role (Promote/Demote)

```js
const json = [
  'setRole',
  {
    community: 'hive-123456',
    account: 'driverjohn',
    role: 'mod'              // Options: 'member', 'mod', 'admin'
  }
];

const operation = ['custom_json', {
  required_auths: [],
  required_posting_auths: ['youradmin'],
  id: 'community',
  json: JSON.stringify(json)
}];

await client.broadcast.sendOperations([operation], privateKey);
```

**Valid Roles**:
- `member`: Basic community member
- `mod`: Moderator (can mute, approve posts)
- `admin`: Administrator (can set roles, manage mods)
- **Note**: `owner` cannot be set via operations

**Use Cases**:
- Promote verified drivers to `member`
- Promote senior drivers to `mod`
- Grant taxi company managers `admin` access

---

## Moderation Operations

### Mute User

```js
const json = [
  'mutePost',
  {
    community: 'hive-123456',
    account: 'spammer',
    notes: 'Reason for muting: spamming, policy violation, etc.'
  }
];

// Broadcast same as role operations
```

**Effect**: User can no longer post in the community. Existing posts remain visible.

### Unmute User

```js
const json = [
  'unmutePost',
  {
    community: 'hive-123456',
    account: 'spammer'
  }
];
```

**Use Cases**:
- Suspend drivers temporarily for violations
- Ban bad actors from community
- Restore access after appeal

---

## Content Management

### Flag/Pin Post

```js
const json = [
  'flagPost',
  {
    community: 'hive-123456',
    account: 'author',
    permlink: 'post-slug',
    notes: 'Featured driver of the month'
  }
];
```

### Unpin Post

```js
const json = [
  'unflagPost',
  {
    community: 'hive-123456',
    account: 'author',
    permlink: 'post-slug'
  }
];
```

### Mute Specific Post

```js
const json = [
  'mutePost',
  {
    community: 'hive-123456',
    account: 'author',
    permlink: 'post-slug',
    notes: 'Inappropriate content'
  }
];
```

### Unmute Specific Post

```js
const json = [
  'unmutePost',
  {
    community: 'hive-123456',
    account: 'author',
    permlink: 'post-slug'
  }
];
```

---

## Subscription Management

### Subscribe to Community

```js
const json = [
  'subscribe',
  {
    community: 'hive-123456'
  }
];

// Must be broadcast by the user themselves
// Backend cannot subscribe on behalf of users without their signature
```

### Unsubscribe from Community

```js
const json = [
  'unsubscribe',
  {
    community: 'hive-123456'
  }
];
```

**Important**: Users must sign their own subscription operations. Use Hive Keychain for frontend auth.

---

## Statistics & Analytics

### Get Subscriber Count

```js
const meta = await client.call('bridge', 'get_community', {
  name: 'hive-123456'
});

console.log('Total Drivers:', meta.num_subscribers);
console.log('Pending Posts:', meta.num_pending);
console.log('Unique Authors:', meta.num_authors);
```

### Get Recent Posts

```js
const posts = await client.call('bridge', 'get_ranked_posts', {
  sort: 'created',           // Options: 'trending', 'hot', 'created', 'promoted', 'payout'
  tag: 'hive-123456',        // Note: uses 'tag' not 'community'
  limit: 20,                 // Max 20 (valid range: 1-20)
  observer: 'youradmin'      // Optional: personalized results
});
```

### Get Community Activity

```js
const posts = await client.call('bridge', 'get_discussion', {
  author: 'driverjohn',
  permlink: 'my-taxi-story',
  observer: 'youradmin'
});
```

### List Posts by Account in Community

```js
const accountPosts = await client.call('bridge', 'get_account_posts', {
  sort: 'posts',
  account: 'driverjohn',
  limit: 20,
  observer: 'youradmin'
});
```

---

## Broadcasting Operations

### Standard Broadcast Pattern

```js
async function broadcastCommunityOperation(operationType, payload) {
  const json = [operationType, payload];
  
  const operation = ['custom_json', {
    required_auths: [],
    required_posting_auths: [process.env.HIVE_ADMIN_ACCOUNT],
    id: 'community',
    json: JSON.stringify(json)
  }];

  try {
    const result = await client.broadcast.sendOperations([operation], privateKey);
    return { success: true, result };
  } catch (error) {
    console.error('Broadcast failed:', error);
    throw error;
  }
}
```

### Usage Example

```js
// Promote driver to moderator
await broadcastCommunityOperation('setRole', {
  community: 'hive-123456',
  account: 'seniordriverjane',
  role: 'mod'
});

// Mute problematic user
await broadcastCommunityOperation('mutePost', {
  community: 'hive-123456',
  account: 'rulebreaker',
  notes: 'Multiple policy violations'
});
```

---

## Operation Types Reference

| Operation | Purpose | Auth Required |
|-----------|---------|---------------|
| `setRole` | Set user role | Admin |
| `mutePost` | Mute user or post | Mod/Admin |
| `unmutePost` | Unmute user or post | Mod/Admin |
| `flagPost` | Pin/feature post | Mod/Admin |
| `unflagPost` | Unpin post | Mod/Admin |
| `subscribe` | Join community | Self |
| `unsubscribe` | Leave community | Self |
| `updateProps` | Update community settings | Owner/Admin |

---

## Error Handling

### Common Errors

1. **Insufficient Authority**: User doesn't have permission
2. **Invalid Account**: Target account doesn't exist
3. **Invalid Permlink**: Post doesn't exist
4. **Rate Limiting**: Too many operations too quickly
5. **Network Errors**: RPC node unavailable

### Recommended Error Handler

```js
try {
  await broadcastOperation();
} catch (error) {
  if (error.message.includes('missing required posting authority')) {
    return { error: 'Insufficient permissions' };
  }
  if (error.message.includes('Account not found')) {
    return { error: 'User does not exist' };
  }
  // Log and return generic error
  console.error('Hive operation failed:', error);
  return { error: 'Operation failed. Please try again.' };
}
```

---

## Best Practices for TaxiHub

1. **Cache Community Data**: Fetch community info once and cache for 5-10 minutes
2. **Batch Operations**: When possible, queue multiple role changes
3. **Validate Before Broadcasting**: Check if user exists before attempting role change
4. **Use Optimistic UI Updates**: Update UI immediately, confirm with blockchain
5. **Log All Operations**: Keep audit trail of role changes and moderation actions
6. **Rate Limit Frontend**: Prevent accidental spam of operations
7. **Backup Keys Securely**: Use HSM or secure vault for posting keys in production
8. **Monitor RPC Health**: Switch endpoints if one becomes slow/unavailable

---

## Typical Workflows

### Onboard New Driver

1. Driver signs up via Hive Keychain
2. Admin verifies credentials off-chain
3. Admin promotes driver to `member` role
4. Driver can now post trip reports, photos, etc.

### Handle Policy Violation

1. Mod receives report about inappropriate content
2. Mod reviews post/user activity
3. Mod mutes specific post OR mutes entire user
4. Mod adds notes explaining action
5. User can appeal via off-chain channel

### Feature Star Driver

1. Admin identifies exceptional driver
2. Admin uses `flagPost` on driver's recent story
3. Post appears pinned in community feed
4. Promotes community engagement

---

## Integration with Hive Keychain

### Frontend Login Flow

```js
// Request signature from user
window.hive_keychain.requestSignBuffer(
  username,
  message,
  'Posting',
  (response) => {
    if (response.success) {
      // Send signature to backend for JWT creation
    }
  }
);
```

### Verify Signature Backend

```js
const dhive = require('@hiveio/dhive');

function verifyKeychainSignature(username, message, signature) {
  const publicKey = dhive.PublicKey.fromString(signature.publicKey);
  const buffer = Buffer.from(message, 'utf8');
  return publicKey.verify(buffer, signature);
}
```

---

## Additional Resources

- **dhive Documentation**: https://github.com/openhive-network/dhive
- **Hive Developer Portal**: https://developers.hive.io
- **Bridge API Docs**: https://gitlab.syncad.com/hive/hivemind
- **Hive Keychain**: https://hive-keychain.com

---

## Notes for AI Assistant (Copilot)

When working with this codebase:

1. Always use `client.call('bridge', ...)` for read operations
2. Always use `client.broadcast.sendOperations()` for write operations
3. Community operations use `custom_json` with `id: 'community'`
4. Posting authority is required for all admin operations
5. Pagination is required for lists over 100 items
6. Cache aggressively to reduce RPC load
7. Error handling is critical - blockchain ops can fail

---

**Last Updated**: November 2025
**For**: TaxiHub Community Management Portal
