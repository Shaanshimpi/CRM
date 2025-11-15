# Payload CMS Custom Views and Data Fetching Guide

This guide explains how to create custom views and fetch data from collections in Payload CMS 3.0.

## 1. Creating Custom Views

### Method 1: Custom Page Route (Current Implementation - No Collection Config Needed)

**This is what we're currently using** - a standalone Next.js page route:

```typescript
// src/app/(payload)/admin/collections/opportunities/kanban/page.tsx
'use client'

import { KanbanView } from '@/components/kanban/KanbanView'

export default function KanbanPage() {
  return <KanbanView />
}
```

**Benefits:**
- ✅ No collection config changes needed
- ✅ Full control over page layout
- ✅ Standalone route - easier to maintain
- ✅ Can add custom navigation and buttons

**Note:** The Opportunities collection is already configured. This custom page just fetches data via the API endpoint.

### Method 2: Custom View in Collection Config (Alternative - Requires Collection Config)

Add custom views directly to a collection's configuration:

```typescript
import type { CollectionConfig } from 'payload'

export const Opportunities: CollectionConfig = {
  slug: 'opportunities',
  admin: {
    components: {
      views: {
        edit: {
          // Add a new custom view tab
          kanban: {
            Component: '@/components/kanban/KanbanView',
            path: '/kanban',
            tab: {
              label: 'Kanban View',
              href: '/kanban',
              order: 100,
            },
          },
        },
        // Or add a custom list view
        list: {
          Component: '@/components/kanban/ListWithKanbanButton',
        },
      },
    },
  },
  // ... rest of config
}
```

**Benefits:**
- Integrated into Payload's admin UI
- Proper navigation and routing
- Access to Payload context hooks

### Method 2: Custom Page Route (Current Implementation)

Create a custom Next.js route page:

```typescript
// src/app/(payload)/admin/collections/opportunities/kanban/page.tsx
'use client'

import { KanbanView } from '@/components/kanban/KanbanView'

export default function KanbanPage() {
  return <KanbanView />
}
```

**Benefits:**
- More control over the page layout
- Can be a standalone page
- Easier to add custom navigation

## 2. Fetching Data from Collections

### Client-Side: REST API (Current Implementation)

Use the standard REST API with `fetch()`:

```typescript
// In a React component or hook
const fetchData = async () => {
  const response = await fetch('/api/opportunities?where[pipeline][equals]=xxx')
  const data = await response.json()
  return data.docs
}
```

**Our Implementation:**
```typescript
// src/components/kanban/hooks/useKanbanData.ts
export function useKanbanData(pipelineId: string | null, apiUrl: string = '/api') {
  const [data, setData] = useState<KanbanData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!pipelineId) return

    const fetchData = async () => {
      setLoading(true)
      try {
        const response = await fetch(`${apiUrl}/opportunities/kanban?pipeline=${pipelineId}`)
        if (!response.ok) throw new Error('Failed to fetch Kanban data')
        const result: KanbanData = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [pipelineId, apiUrl])

  return { data, loading, error, refetch }
}
```

### Server-Side: Local API

Use Payload's Local API for server-side operations (faster, direct DB access):

```typescript
import { getPayload } from 'payload'
import configPromise from '@/payload.config'

// In a server component or API route
async function fetchOpportunities(pipelineId: string) {
  const payload = await getPayload({ config: configPromise })
  
  const opportunities = await payload.find({
    collection: 'opportunities',
    where: {
      pipeline: {
        equals: pipelineId,
      },
    },
    depth: 2, // Populate relationships
  })

  return opportunities.docs
}
```

### Custom Endpoints (Recommended for Complex Queries)

Create custom endpoints for complex data operations:

```typescript
// src/endpoints/opportunities/kanban.ts
import type { PayloadRequest } from 'payload'
import type { Endpoint } from 'payload'

export const kanbanEndpoint: Endpoint = {
  path: '/opportunities/kanban',
  method: 'get',
  handler: async (req: PayloadRequest) => {
    const { payload, user, query } = req

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      // Get pipeline ID from query params
      const pipelineId = query?.pipeline as string | undefined

      if (!pipelineId) {
        return Response.json({ error: 'Pipeline ID is required' }, { status: 400 })
      }

      // Fetch data using Local API
      const pipeline = await payload.findByID({
        collection: 'pipelines',
        id: pipelineId,
        req,
      })

      const stages = await payload.find({
        collection: 'stages',
        where: {
          pipeline: { equals: pipelineId },
        },
        sort: 'order',
        req,
      })

      const opportunities = await payload.find({
        collection: 'opportunities',
        where: {
          pipeline: { equals: pipelineId },
        },
        depth: 2,
        req,
      })

      // Transform and return data
      // ... grouping logic ...

      return Response.json({ /* formatted data */ })
    } catch (error) {
      return Response.json(
        { error: 'Failed to fetch Kanban data' },
        { status: 500 }
      )
    }
  },
}
```

Register in `payload.config.ts`:
```typescript
import { kanbanEndpoint } from './endpoints/opportunities/kanban'

export default buildConfig({
  endpoints: [kanbanEndpoint],
  // ... rest of config
})
```

## 3. Accessing Query Parameters in Endpoints

Payload's `req.query` should contain parsed query parameters:

```typescript
handler: async (req: PayloadRequest) => {
  const { query } = req
  
  // Query params are automatically parsed
  const pipelineId = query?.pipeline // string | string[] | undefined
  
  // Handle different formats
  let pipeline: string | undefined
  if (typeof pipelineId === 'string') {
    pipeline = pipelineId
  } else if (Array.isArray(pipelineId) && pipelineId.length > 0) {
    pipeline = pipelineId[0]
  }
}
```

## 4. Best Practices

### For Custom Views:
1. **Use Collection Config Views** for simple customizations that fit into the admin UI
2. **Use Custom Routes** for completely custom pages with full control
3. **Keep components reusable** and testable

### For Data Fetching:
1. **Use REST API** for client-side components (current approach)
2. **Use Local API** for server-side operations (faster, more secure)
3. **Create Custom Endpoints** for complex queries that need aggregation or transformation
4. **Handle loading and error states** properly
5. **Use proper TypeScript types** for API responses

### Error Handling:
```typescript
try {
  const response = await fetch('/api/endpoint')
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Request failed')
  }
  
  const data = await response.json()
  return data
} catch (error) {
  console.error('Fetch error:', error)
  throw error
}
```

## 5. Current Implementation Notes

Our Kanban view uses:
- **Custom Page Route**: `/admin/collections/opportunities/kanban`
- **Custom Endpoint**: `/api/opportunities/kanban`
- **Client-Side Fetching**: REST API calls from React hooks
- **Proper Error Handling**: Loading states and error messages

This approach provides:
- Full control over the page layout
- Separation of concerns (UI vs API)
- Easy to test and maintain
- Follows Payload CMS patterns

## References

- [Payload CMS Custom Components](https://payloadcms.com/docs/custom-components)
- [Payload CMS Document Views](https://payloadcms.com/docs/custom-components/document-views)
- [Payload CMS Collections](https://payloadcms.com/docs/configuration/collections)
- [Payload CMS Local API](https://payloadcms.com/docs/local-api)
- [Payload CMS REST API](https://payloadcms.com/docs/rest-api)

