const { app, server, wss } = require('../server')
const supertest = require('supertest')
const { connectDB, disconnectDB } = require('../database')

const request = supertest(app)

describe('API test', () => {
  afterAll(() => {
    disconnectDB()
    server.close()
    wss.close()
  })

  describe('POST /get-tracks', () => {
    it('should get tracks from DB', async () => {
      const res = await request.get('/get-tracks')
      expect(res.status).toBe(200)
    })
  })
})
