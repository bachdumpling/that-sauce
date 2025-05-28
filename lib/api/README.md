# Optimized Next.js API Structure

This document outlines the improved API architecture that separates server-side actions from client-side API calls for better performance and maintainability.

## Architecture Overview

```
┌─────────────────┬─────────────────┐
│   Server Side   │   Client Side   │
├─────────────────┼─────────────────┤
│ Server Actions  │ Client API      │
│ (Direct DB)     │ (HTTP Requests) │
│                 │                 │
│ - SSR/SSG       │ - Client Comp.  │
│ - Form Actions  │ - Interactive   │
│ - Backgrounds   │ - Real-time     │
└─────────────────┴─────────────────┘
```

## Directory Structure

```
lib/api/
├── client/           # Client-side API utilities
│   ├── creators.ts   # Creator client functions
│   └── projects.ts   # Project client functions
├── server/           # Server-side utilities (deprecated)
│   └── ...          # Legacy server functions
├── endpoints/        # API endpoint definitions
│   └── endpoints.ts  # Centralized endpoint URLs
└── README.md        # This documentation
```

## Usage Patterns

### Server Components & Server Actions

**Use for**: SSR, SSG, form submissions, background tasks

```typescript
// In server components or server actions
import { getCreatorAction } from "@/actions/creator-actions";

export default async function CreatorPage({ params }: { params: { username: string } }) {
  const result = await getCreatorAction(params.username);
  
  if (!result.success) {
    notFound();
  }
  
  return <CreatorProfile creator={result.data} />;
}
```

### Client Components

**Use for**: Interactive features, real-time updates, client-side state

```typescript
// In client components
"use client";
import { getCreatorByUsernameClient } from "@/lib/api/client/creators";

export function InteractiveCreatorCard() {
  const [creator, setCreator] = useState(null);
  
  useEffect(() => {
    async function fetchCreator() {
      const result = await getCreatorByUsernameClient("username");
      if (result.success) {
        setCreator(result.data);
      }
    }
    fetchCreator();
  }, []);
  
  // ... rest of component
}
```

## Key Improvements

### 1. **Performance Optimization**
- **Before**: Server actions made HTTP requests to own API routes
- **After**: Server actions directly use Supabase, eliminating HTTP overhead

### 2. **Clear Separation of Concerns**
- **Server Actions**: Direct database access for server-side rendering
- **Client API**: HTTP requests for client-side interactivity
- **API Routes**: Available for both internal use and external consumers

### 3. **Reduced Latency**
```
Before: Server Action → HTTP Request → API Route → Supabase
After:  Server Action → Supabase (Direct)
```

### 4. **Better Error Handling**
- Consistent error responses across server and client
- Proper authentication handling in both contexts
- Graceful fallbacks for failed operations

## Server Actions (`actions/creator-actions.ts`)

### Features:
- ✅ Direct Supabase access (no HTTP overhead)
- ✅ Authentication via Supabase cookies
- ✅ Automatic revalidation with `revalidatePath()`
- ✅ Comprehensive error handling
- ✅ Ownership verification
- ✅ File upload to Supabase Storage

### Available Actions:
- `getCreatorAction(username)` - Get creator with full project data
- `getCreatorProjectsAction(username, page, limit)` - Paginated projects
- `updateCreatorProfileAction(username, data)` - Update profile
- `uploadCreatorAvatarAction(username, file)` - Upload avatar
- `uploadCreatorBannerAction(username, file)` - Upload banner
- `checkCreatorExistsAction(username)` - Check existence (throws notFound)
- `getRandomCreatorsWithLatestWork(limit)` - Cached random creators

## Client API (`lib/api/client/creators.ts`)

### Features:
- ✅ HTTP requests to API routes
- ✅ Consistent error handling
- ✅ TypeScript type safety
- ✅ Automatic Content-Type headers
- ✅ FormData support for file uploads

### Available Functions:
- `getCreatorByUsernameClient(username)` - Get creator data
- `updateCreatorProfileClient(username, data)` - Update profile
- `uploadCreatorAvatarClient(username, file)` - Upload avatar
- `uploadCreatorBannerClient(username, file)` - Upload banner
- `checkUsernameAvailabilityClient(username)` - Check availability
- `getCreatorProjectsClient(username, page, limit)` - Get projects
- `getCreatorPortfolioClient(username)` - Get portfolio

## API Routes (`app/api/creators/[username]/route.ts`)

### Features:
- ✅ Enhanced data fetching (matches old Express route)
- ✅ Organization/client mapping
- ✅ Nested images and videos
- ✅ Proper authentication handling
- ✅ Comprehensive error responses

### Response Format:
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

## Migration Guide

### From Old Server Functions

**Before**:
```typescript
import { getCreatorByUsernameServer } from "@/lib/api/server/creators";

const result = await getCreatorByUsernameServer(username);
```

**After**:
```typescript
import { getCreatorAction } from "@/actions/creator-actions";

const result = await getCreatorAction(username);
```

### From Client Components

**Before**:
```typescript
// Client component making server action calls (inefficient)
import { getCreatorAction } from "@/actions/creator-actions";

const result = await getCreatorAction(username);
```

**After**:
```typescript
// Client component using proper client API
import { getCreatorByUsernameClient } from "@/lib/api/client/creators";

const result = await getCreatorByUsernameClient(username);
```

## Best Practices

### 1. **Choose the Right Tool**
- Use **Server Actions** for server components, form submissions, and background tasks
- Use **Client API** for client components and interactive features
- Use **API Routes** for external integrations or when you need REST endpoints

### 2. **Error Handling**
```typescript
// Server Actions
const result = await getCreatorAction(username);
if (!result.success) {
  // Handle error appropriately
  return notFound(); // or redirect, or show error
}

// Client API
const result = await getCreatorByUsernameClient(username);
if (!result.success) {
  setError(result.error);
  return;
}
```

### 3. **Authentication**
- Server actions automatically handle auth via Supabase cookies
- Client API relies on browser cookies for authentication
- API routes use the improved `getOptionalAuth`/`requireAuth` utilities

### 4. **Caching & Revalidation**
```typescript
// Server actions automatically revalidate paths
await updateCreatorProfileAction(username, data);
// Automatically revalidates /${username}, /${username}/work, etc.

// For client components, you may need manual cache invalidation
```

## Future Improvements

1. **Real-time Subscriptions**: Add Supabase real-time subscriptions for live updates
2. **Enhanced Caching**: Implement Redis or similar for server-side caching
3. **Background Jobs**: Integration with Trigger.dev for heavy operations
4. **API Rate Limiting**: Add rate limiting to API routes
5. **Metrics & Monitoring**: Add performance monitoring and analytics

## Breaking Changes

1. Old server functions in `lib/api/server/creators.ts` are deprecated
2. Direct HTTP calls from server actions have been eliminated
3. Response format is now consistent across all API functions
4. File uploads now go directly to Supabase Storage instead of temporary storage

This architecture provides better performance, clearer separation of concerns, and improved maintainability while following Next.js App Router best practices. 