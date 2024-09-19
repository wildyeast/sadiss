import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User } from '../models/user'
import { InvalidInputError, NotFoundError } from '../errors'

export const authenticateUser = async (email: string, password: string) => {
  if (!email || !password) {
    throw new InvalidInputError('Please provide an email and password')
  }

  const user = await User.findOne({ email })
  if (!user) {
    throw new NotFoundError('Invalid email or password')
  }

  const isPasswordMatched = await bcrypt.compare(password, user.password)
  if (!isPasswordMatched) {
    throw new NotFoundError('Invalid email or password')
  }

  return user
}

export const generateToken = (userId: string) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET!, { expiresIn: '1d' })
}
