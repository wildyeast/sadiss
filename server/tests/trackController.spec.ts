import { connectDB, disconnectDB } from '../database'
import { authenticatedRequest } from './testUtils'

const { app, server, wss } = require('../server')
const supertest = require('supertest')

const request = supertest(app)

describe('trackController test', () => {
  beforeAll(async () => {
    await connectDB()
  })

  afterAll(async () => {
    await disconnectDB()
    server.close()
    wss.close()
  })

  describe('POST /tracks', () => {
    it('should get tracks from DB', async () => {
      const res = await authenticatedRequest(request, '/tracks', 'get')
      expect(res.status).toBe(200)
    })
  })
})

export {}
