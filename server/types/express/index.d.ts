// From https://blog.logrocket.com/extend-express-request-object-typescript/

import { UserDocument } from '../types'

export {}

declare global {
  namespace Express {
    export interface Request {
      wss?: any
      user?: any
    }
    interface User {
      id: string
    }
  }
  var token: string // Used in server/tests/setupTests.ts
  var mockUser: { username: string; id: string; email: string } // Used in server/tests/setupTests.ts
}
