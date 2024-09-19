import { authenticateUser, generateToken } from '../services/authService'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User } from '../models/user'
import { InvalidInputError, NotFoundError } from '../errors'

describe('authService', () => {
  it('should throw an error if email or password is missing', async () => {
    await expect(authenticateUser('', '')).rejects.toThrow(InvalidInputError)
  })

  it('should throw an error if the user is not found', async () => {
    await expect(authenticateUser('test@example.com', 'password')).rejects.toThrow(NotFoundError)
  })

  it('should throw an error if the password does not match', async () => {
    await expect(authenticateUser(global.mockUser.email, 'wrong-password')).rejects.toThrow('Invalid email or password')
  })

  it('should return a user if authentication is successful', async () => {
    const user = await authenticateUser(global.mockUser.email, global.mockUser.password)
    expect(user).toBeTruthy()
  })

  it('should generate a token', () => {
    const token = generateToken('123')
    const decoded = jwt.verify(token, process.env.JWT_SECRET!)
    expect(decoded).toHaveProperty('id', '123')
  })
})
