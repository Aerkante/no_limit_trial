import type { HttpContext } from '@adonisjs/core/http'
import { CustomSupabaseUser } from '../auth/guards/supabase_jwt_guard.js'
import { authLoginValidator } from '#validators/auth_login'
import { supabase } from '../utils/supabase_util.js'
import { errors } from '@adonisjs/auth'

export default class AuthController {
  async login({ request }: HttpContext) {
    const { email, password } = await request.validateUsing(authLoginValidator)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw new errors.E_UNAUTHORIZED_ACCESS(error.message, {
        guardDriverName: 'supabase',
      })
    }

    console.log(await supabase.from('profiles').select('*'))

    return {
      data: {
        ...data.user,
        token: data.session?.access_token,
      },
    }
  }

  async logout({ auth }: HttpContext) {
    await auth.use('supabase').authenticate()
    await auth.use('supabase').revokeTokens()
    return {
      message: 'Logged out successfully',
    }
  }

  async refreshToken({ auth }: HttpContext) {
    await auth.use('supabase').authenticate()
    const token = await auth.use('supabase').authenticate()
    return {
      token,
    }
  }

  async getUser({ auth }: HttpContext) {
    await auth.use('supabase').authenticate()

    const user = auth.use('supabase').user as CustomSupabaseUser
    const token = await auth.use('supabase').authenticate()
    return {
      token,
      user: {
        ...user,
      },
    }
  }
}
