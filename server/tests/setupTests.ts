import * as dotenv from 'dotenv'
import { generateMockId } from './testUtils'
import { connectDB, disconnectDB } from '../database'
import request from 'supertest'
import fs from 'fs'
import mongoose from 'mongoose'
import { trackSchema } from '../models/track'
import path from 'path'

dotenv.config({ path: '.env.test' })

const { app, server, wss } = require('../server')

const agent = request.agent(app)
global.agent = agent

beforeAll(async () => {
  // Connect to the in-memory database
  await connectDB()

  // Make wss available globally
  global.testWss = wss

  // Mock middlewares
  jest.mock('../middlewares/validateTrackAccess', () => ({
    validateTrackAccess: jest.fn((req, res, next) => next())
  }))

  jest.mock('../middlewares/validatePerformanceAccess', () => ({
    validatePerformanceAccess: jest.fn((req, res, next) => next())
  }))

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

beforeEach(async () => {
  // About 'advanceTimers: true' see https://github.com/nock/nock/issues/2200#issuecomment-1699838032
  jest.useFakeTimers({ advanceTimers: true })
})

afterEach(async () => {
  await deleteTracksAndFilesCreatedDuringTest()
  jest.restoreAllMocks()
  jest.clearAllTimers()
})

afterAll(async () => {
  await disconnectDB()
  server.close()
  wss.close()
})

const deleteTracksAndFilesCreatedDuringTest = async () => {
  const uploadsDir = path.join(__dirname, `../${process.env.UPLOADS_DIR}`)
  const chunksDir = path.join(__dirname, `../${process.env.CHUNKS_DIR}`)

  const Track = mongoose.model('Track', trackSchema)
  const tracks = await Track.find()

  // Go through all tracks and delete files
  for (const track of tracks) {
    if (track.partialFile) {
      const fullPath = `${uploadsDir}/${track.partialFile.fileName}`
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(`${uploadsDir}/${track.partialFile.fileName}`)
      }
    }

    track.ttsFiles.forEach((ttsFileObject) => {
      const fullPath = `${uploadsDir}/${ttsFileObject.fileName}`
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath)
      }
    })

    if (track.chunkFileName) {
      const fullPath = `${chunksDir}/${track.chunkFileName}`
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath)
      }
    }

    await Track.deleteOne({ _id: track._id })
  }
}

// Mock user with no access to most resources created by mockUser
const unauthorizedMockUser = {
  id: generateMockId(),
  username: 'Unauthorized Test User',
  email: 'testuser2@example.com'
}
