/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/
import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'

const AuthController = () => import('#controllers/auth_controller')
const AthleteController = () => import('#controllers/athlete_controller')
const SessionController = () => import('#controllers/session_controller')
const prefix = '/v1'

const AuthRoutes = router
  .group(() => {
    router.post('/login', [AuthController, 'login'])
    router.get('/me', [AuthController, 'getUser'])
  })
  .prefix('/auth')

const AthleteRoutes = router
  .group(() => {
    router.get('/:id/ai/summary', [AthleteController, 'summary'])
  })
  .prefix(`${prefix}/athlete`)
  .use(middleware.auth())

const SessionRoutes = router
  .group(() => {
    router.post('/:id/finalize', [SessionController, 'finalize'])
  })
  .prefix(`${prefix}/session`)
  .use(middleware.auth())

const SystemRoutes = router.group(() => {
  router.get('/health', async () => {
    return 'OK'
  })
})

export { AuthRoutes, SystemRoutes, AthleteRoutes, SessionRoutes }
