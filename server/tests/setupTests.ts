import jwt from 'jsonwebtoken'
import * as dotenv from 'dotenv'

dotenv.config()

const mockUser = {
  id: '123',
  username: 'Test User',
  email: 'testuser@example.com'
}

// Generate JWT token for mock user and set it on the global object
global.mockUser = mockUser
global.token = jwt.sign(mockUser, process.env.JWT_SECRET!)
