// From https://blog.logrocket.com/extend-express-request-object-typescript/

import { TypeExpressionOperatorReturningObjectId } from 'mongoose'
import { ObjectId, Types } from 'mongoose'
import { SuperAgentTest } from 'supertest'

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
  var mockUser: { username: string; id: Types.ObjectId; email: string }
  var agent: SuperAgentTest
}
