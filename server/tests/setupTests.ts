import jwt from 'jsonwebtoken'
import * as dotenv from 'dotenv'
import { generateMockId } from './testUtils'

dotenv.config()

const mockUser = {
  id: generateMockId(),
  username: 'Test User',
  email: 'testuser@example.com'
}

// Mock user with no access to most resources created by mockUser
const unauthorizedMockUser = {
  id: generateMockId(),
  username: 'Unauthorized Test User',
  email: 'testuser2@example.com'
}

// Generate JWT token for mock user and set it on the global object
global.mockUser = mockUser
global.token = jwt.sign(mockUser, process.env.JWT_SECRET!)
global.unauthorizedToken = jwt.sign(unauthorizedMockUser, process.env.JWT_SECRET!)
