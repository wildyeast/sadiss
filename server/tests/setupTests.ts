import * as dotenv from 'dotenv'
import { generateMockId } from './testUtils'
import { connectDB, disconnectDB } from '../database'
import request from 'supertest'

dotenv.config()

const { app, server, wss } = require('../server')

const agent = request.agent(app)
global.agent = agent

beforeAll(async () => {
  // Connect to the in-memory database
  await connectDB()
  // Register a user to be used for testing
  const mockUser = {
    username: 'Test User',
    email: 'testuser@example.com',
    password: 'testpassword'
  }

  const registerRes = await agent.post('/register').send(mockUser)
  global.mockUser = {
    id: registerRes.body._id,
    username: registerRes.body.username,
    email: registerRes.body.email
  }

  // Login with created user and save JWT token
  await agent.post('/login').send({
    email: mockUser.email,
    password: mockUser.password
  })
})

afterAll(async () => {
  await disconnectDB()
  server.close()
  wss.close()
})

// Mock user with no access to most resources created by mockUser
const unauthorizedMockUser = {
  id: generateMockId(),
  username: 'Unauthorized Test User',
  email: 'testuser2@example.com'
}
