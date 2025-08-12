import vine from '@vinejs/vine'

export const authLoginValidator = vine.compile(
  vine.object({
    email: vine.string().email().trim(),
    password: vine.string().minLength(6),
  })
)
