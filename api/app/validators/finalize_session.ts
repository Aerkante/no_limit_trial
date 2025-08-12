import vine from '@vinejs/vine'

export const finalizeSessionValidator = vine.compile(
  vine.object({
    sleep_input: vine.object({
      athlete_id: vine.string().uuid(),
      start_time: vine.string(),
      end_time: vine.string(),
      mean_recovery_hrs: vine.number(),
      strain: vine.number(),
      metrics: vine.array(
        vine.object({
          timestamp: vine.string(),
          speed: vine.number(),
          heart_rate: vine.number(),
          acceleration: vine.number(),
          distance: vine.number(),
        })
      ),
      notes: vine.string().optional(),
    }),
    injury_risk_input: vine.object({
      athlete_id: vine.string().uuid(),
      start_time: vine.string(),
      end_time: vine.string(),
      acwr: vine.number(),
      delta_hrv: vine.number(),
      sleep_adequacy: vine.number(),
      gsr_spikes: vine.number(),
      metrics: vine.array(
        vine.object({
          timestamp: vine.string(),
          speed: vine.number(),
          heart_rate: vine.number(),
          acceleration: vine.number(),
          distance: vine.number(),
        })
      ),
      notes: vine.string().optional(),
    }),
  })
)
