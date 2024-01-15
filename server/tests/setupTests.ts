import * as dotenv from 'dotenv'
import { generateMockId } from './testUtils'
import { connectDB, disconnectDB } from '../database'
import request from 'supertest'
import fs from 'fs'
import mongoose from 'mongoose'
import { trackSchema } from '../models/track'
import path from 'path'

dotenv.config()

const { app, server, wss } = require('../server')

const agent = request.agent(app)
global.agent = agent

beforeAll(async () => {
  // Connect to the in-memory database
  await connectDB()

  // Make wss available globally
  global.testWss = wss

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

afterEach(async () => {
  await deleteTracksAndFilesCreatedDuringTest()
})

afterAll(async () => {
  await disconnectDB()
  server.close()
  wss.close()
})

const deleteTracksAndFilesCreatedDuringTest = async () => {
  const uploadsDir = path.join(__dirname, '../uploads')
  const chunksDir = path.join(__dirname, '../chunks')

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
