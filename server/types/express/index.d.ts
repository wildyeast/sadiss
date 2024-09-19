// From https://blog.logrocket.com/extend-express-request-object-typescript/

import { Types } from 'mongoose'
import { SuperAgentTest } from 'supertest'
import { Server } from 'ws'

export {}

declare global {
  namespace Express {
    export interface Request {
      wss?: any
      user?: User | undefined
    }
    interface User {
      id: Types.ObjectId
      password: string
    }
  }
  var mockUser: { username: string; id: Types.ObjectId; email: string; password: string }
  var agent: SuperAgentTest
  var testWss: Server // Websocket server for testing
}
