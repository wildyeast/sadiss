import passport from 'passport'
import { Strategy as LocalStrategy } from 'passport-local'
import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'
import { User } from './models/user'

passport.use(
  new LocalStrategy(async function (username, password, done) {
    try {
      const user = await User.findOne({ username: username })
      if (!user) {
        return done(null, false)
      }
      if (user.password !== password) {
        return done(null, false)
      }
      return done(null, user)
    } catch (err) {
      return done(err)
    }
  })
)

const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  if (token == null) return res.sendStatus(401)

  jwt.verify(token, 'secret-key', (err: any, user: any) => {
    if (err) return res.sendStatus(403)
    req.user = user
    next()
  })
}

export { passport, authenticateToken }
