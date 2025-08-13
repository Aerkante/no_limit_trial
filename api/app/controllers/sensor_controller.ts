import type { HttpContext } from '@adonisjs/core/http'
import Ws from '#services/Ws'

export default class SensorController {
  public async receiveBatch({ request, response }: HttpContext) {
    const batch = request.body()
    console.log('[Adonis] Received batch:', batch)

    Ws.io?.emit('sensor_update', batch)

    return response.json({ status: 'ok', batch })
  }
}
