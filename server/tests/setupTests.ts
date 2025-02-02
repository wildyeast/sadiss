import * as dotenv from 'dotenv'
import { generateMockId } from './testUtils'
import { connectDB, disconnectDB } from '../database'
import request from 'supertest'
import fs from 'fs'
import mongoose from 'mongoose'
import { trackSchema } from '../models/track'
import path from 'path'
import { app, server, wss } from '../server'
import { beforeAll, beforeEach, afterEach, afterAll, vi } from 'vitest'

dotenv.config({ path: '.env.test' })

dotenv.config({ path: '.env.test' })

export const agent = request.agent(app)

export let mockUser: any

beforeAll(async () => {
  // Connect to the in-memory database
  await connectDB()

  // Make wss available globally
  global.testWss = wss

  // // Mock middlewares
  // // FIXME: This doesn't seem to work correctly
  // // Maybe we shouldn't mock the middlewares at all?
  // jest.mock('../middlewares/validateTrackAccess', () => ({
  //   validateTrackAccess: jest.fn((req, res, next) => next())
  // }))

  // jest.mock('../middlewares/validatePerformanceAccess', () => ({
  //   validatePerformanceAccess: jest.fn((req, res, next) => next())
  // }))

  // Register a user to be used for testing
  const mockUserDetails = {
    username: 'Test User',
    email: 'testuser@example.com',
    password: 'testpassword'
  }

  const registerRes = await agent.post('/register').send(mockUserDetails)
  mockUser = {
    id: registerRes.body._id,
    username: registerRes.body.username,
    email: registerRes.body.email,
    password: mockUserDetails.password
  }

  // Login with created user and save JWT token
  await agent.post('/login').send({
    email: mockUserDetails.email,
    password: mockUserDetails.password
  })
})

beforeEach(async () => {
  // About 'advanceTimers: true' see https://github.com/nock/nock/issues/2200#issuecomment-1699838032
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(async () => {
  if (process.env.NODE_ENV === 'test' && process.env.UPLOADS_DIR && process.env.CHUNKS_DIR) {
    await deleteTracksAndFilesCreatedDuringTest()
  }
  vi.restoreAllMocks()
  vi.clearAllTimers()
})

afterAll(async () => {
  await disconnectDB()
  server.close()
  wss.close()
})

const deleteTracksAndFilesCreatedDuringTest = async () => {
  // Ensure this operation is only performed in a test environment
  if (process.env.NODE_ENV !== 'test') {
    console.error('Attempted to run test cleanup outside of a test environment. Aborting.')
    return
  }

  if (!process.env.UPLOADS_DIR || !process.env.CHUNKS_DIR) {
    console.error('UPLOADS_DIR or CHUNKS_DIR not defined. Aborting.')
    return
  }

  const Track = mongoose.model('Track', trackSchema)
  const tracks = await Track.find()

  // Go through all tracks and delete files
  for (const track of tracks) {
    safelyDeleteFile(process.env.UPLOADS_DIR, track.partialFile?.fileName)
    track.ttsFiles.forEach((ttsFileObject) => {
      safelyDeleteFile(process.env.UPLOADS_DIR!, ttsFileObject.fileName)
    })
    safelyDeleteFile(process.env.CHUNKS_DIR, track.chunkFileName)

    await Track.deleteOne({ _id: track._id })
  }
}

const safelyDeleteFile = (directory: string, fileName: string) => {
  if (!directory.includes('test') || !fileName) {
    // console.warn(`Attempted to delete a non-test file or file is undefined: ${fileName}. Operation aborted.`)
    return
  }

  const fullPath = path.join(__dirname, `../${directory}`, fileName)
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath)
  }
}

// Mock user with no access to most resources created by mockUser
const unauthorizedMockUser = {
  id: generateMockId(),
  username: 'Unauthorized Test User',
  email: 'testuser2@example.com'
}
