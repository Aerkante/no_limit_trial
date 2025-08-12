import { defineConfig } from '@adonisjs/auth'
import { sessionUserProvider } from '@adonisjs/auth/session'
import env from '../start/env.js'
import { JwtGuard } from '../app/auth/guards/jwt.js'
import { SupabaseJwtGuard } from '../app/auth/guards/supabase_jwt_guard.js'
import { tokensGuard, tokensUserProvider } from '@adonisjs/auth/access_tokens'
import type { InferAuthenticators, InferAuthEvents, Authenticators } from '@adonisjs/auth/types'

const jwtConfig = {
  secret: env.get('APP_KEY'),
}
const userProvider = sessionUserProvider({
  model: () => import('#models/user'),
})

const authConfig = defineConfig({
  default: 'api',
  guards: {
    api: tokensGuard({
      provider: tokensUserProvider({
        tokens: 'accessTokens',
        model: () => import('#models/user'),
      }),
    }),
    jwt: (ctx) => {
      return new JwtGuard(ctx, userProvider, jwtConfig)
    },
    supabase: (ctx) => new SupabaseJwtGuard(ctx),
  },
})

export default authConfig

/**
 * Inferring types from the configured auth
 * guards.
 */
declare module '@adonisjs/auth/types' {
  export interface Authenticators extends InferAuthenticators<typeof authConfig> {}
}
declare module '@adonisjs/core/types' {
  interface EventsList extends InferAuthEvents<Authenticators> {}
}
