import jwt from 'jsonwebtoken'
import * as dotenv from 'dotenv'
import { generateMockId } from './testUtils'
import { User } from '../models'

dotenv.config()

const mockUser = {
  id: generateMockId(),
  username: 'Test User',
  email: 'testuser@example.com'
}

// beforeAll(async () => {
//   await connect(); // Connect to the in-memory database
//   // Create a user in the in-memory database
//   const user = new User({ username: 'Test User', email: 'testuser@example.com', password: 'testpassword' });
//   await user.save();
// });

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
