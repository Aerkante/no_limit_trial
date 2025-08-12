import { Exception } from '@adonisjs/core/exceptions'

export default class NotFoundModelException extends Exception {
  static status = 404

  constructor(message: string = 'Resource not found') {
    super(message)
  }
}
