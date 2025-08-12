import env from '#start/env'
import { supabase } from '#start/supabase'
import { errors } from '@adonisjs/auth'
import { HttpContext } from '@adonisjs/core/http'

export default class AthleteController {
  async summary({ auth, params }: HttpContext) {
    try {
      await auth.use('supabase').authenticate()
      const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', params.id)
      const mockedResponse = await fetch(`${env.get('PYTHON_API_URL')}/process/mock`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const summary = await mockedResponse.json()

      return { data: { profile, summary } }
    } catch (error) {
      console.error(error)
      throw new errors.E_UNAUTHORIZED_ACCESS('Unauthorized access', {
        guardDriverName: 'supabase',
      })
    }
  }
}
