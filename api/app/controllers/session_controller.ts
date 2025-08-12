import env from '#start/env'
import { HttpContext } from '@adonisjs/core/http'

export default class SessionController {
  async finalize({ params, request, response }: HttpContext) {
    try {
      const { id } = params
      const payload = request.body()

      const apiResponse = await fetch(`${env.get('PYTHON_API_URL')}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...payload, user_id: id }),
      })

      const data = await apiResponse.json()

      return { data }
    } catch (error) {
      console.error(error)
      return response.status(500).json({ error: 'Erro ao finalizar sessão' })
    }
  }
}
