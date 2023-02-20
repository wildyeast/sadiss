// From https://blog.logrocket.com/extend-express-request-object-typescript/

export { }

declare global {
  namespace Express {
    export interface Request {
      wss: any
    }
  }
}
