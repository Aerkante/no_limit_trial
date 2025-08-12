import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Auth middleware is used authenticate HTTP requests and deny
 * access to unauthenticated users.
 */
export default class AuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    /**
     * Authenticate using Supabase guard
     */
    await ctx.auth.use('supabase').authenticate()
    return next()
  }
}
