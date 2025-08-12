import vine from '@vinejs/vine'

export const createUserValidator = vine.compile(
  vine.object({
    email: vine
      .string()
      .email()
      .trim()
      .unique(async (query, value) => {
        const exists = await query.from('users').where('email', value).first()
        return !exists
      }),
    password: vine.string().minLength(6),
    fullName: vine.string().trim(),
    roleId: vine.number().positive().exists({ table: 'roles', column: 'id' }),
  })
)

export const updateUserValidator = vine.compile(
  vine.object({
    email: vine
      .string()
      .email()
      .trim()
      .unique(async (query, value, field) => {
        const id = field.data.params.id as number
        const exists = await query.from('users').whereNot('id', id).where('email', value).first()
        return !exists
      })
      .optional(),
    password: vine.string().minLength(6).optional(),
    fullName: vine.string().trim(),
    roleId: vine.number().positive().exists({ table: 'roles', column: 'id' }),
  })
)

export const deleteUserValidator = vine.compile(
  vine.object({
    id: vine.number().positive().exists({ table: 'users', column: 'id' }),
  })
)

export const getUserValidator = vine.compile(
  vine.object({
    id: vine.number().positive().exists({ table: 'users', column: 'id' }),
  })
)

export const getUsersValidator = vine.compile(
  vine.object({
    page: vine.number().positive().optional(),
    limit: vine.number().positive().optional(),
    search: vine.string().trim().optional(),
  })
)
