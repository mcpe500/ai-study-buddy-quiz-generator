import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import * as TanstackQuery from './integrations/tanstack-query/root-provider'
import { initDatabase } from './db/repositories'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

// Initialize database only on server side (fs module not available in browser)
if (typeof window === 'undefined') {
  console.log('[DB] Server-side detected, initializing database...')
  initDatabase().catch(err => console.error('[DB] Initialization error:', err))
} else {
  console.log('[DB] Client-side detected, skipping database initialization')
}

// Create a new router instance
export const getRouter = () => {
  const rqContext = TanstackQuery.getContext()

  const router = createRouter({
    routeTree,
    context: { ...rqContext },
    defaultPreload: 'intent',
    Wrap: (props: { children: React.ReactNode }) => {
      return (
        <TanstackQuery.Provider {...rqContext}>
          {props.children}
        </TanstackQuery.Provider>
      )
    },
  })

  setupRouterSsrQueryIntegration({ router, queryClient: rqContext.queryClient })

  return router
}
