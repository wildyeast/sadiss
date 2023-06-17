import { connectDB, disconnectDB } from '../database'
import { SadissPerformance } from '../models/sadissPerformance'
import { authenticatedRequest } from './testUtils'

const { app, server, wss } = require('../server')
const supertest = require('supertest')
const request = supertest(app)

describe('performanceController test', () => {
  beforeAll(async () => {
    await connectDB()
  })

  afterAll(async () => {
    await disconnectDB()
    server.close()
    wss.close()
  })

  describe('POST /api/performances', () => {
    it('should get performances from DB', async () => {
      // create a performance in the database
      const performance = new SadissPerformance({
        name: 'Performance 1',
        isPublic: true,
        userId: '123456789012'
      })
      await performance.save()

      // save the performance id for later use
      const performanceId = performance._id

      const res = await authenticatedRequest(request, '/api/performances', 'get')
      expect(res.status).toBe(200)

      const data = JSON.parse(res.text)
      expect(Array.isArray(data.performances)).toBe(true)
      expect(data.performances.length).toBeGreaterThan(0)

      expect(data.performances[0]).toHaveProperty('_id')
      expect(data.performances[0]).toHaveProperty('name')
      expect(data.performances[0]['_id']).toBe(performanceId.toString())
    })
  })

  describe('POST /api/performance/create', () => {
    it('should return a 400 error if invalid data is provided', async () => {
      const res = await authenticatedRequest(request, '/api/performance/create', 'post').send({})

      expect(res.status).toBe(400)
      expect(res.body).toEqual({ error: 'Invalid performance data' })
    })

    it('should save a new performance to the database and return the saved data', async () => {
      const performanceData = { name: 'Test Performance', isPublic: true }

      const res = await authenticatedRequest(request, '/api/performance/create', 'post').send(performanceData)

      expect(res.status).toBe(201)

      const savedPerformance = await SadissPerformance.findOne({ name: 'Test Performance' })
      expect(savedPerformance).toBeDefined()
      expect(savedPerformance!.name).toBe('Test Performance')
      expect(savedPerformance!.isPublic).toBe(true)
      expect(savedPerformance!.userId.toString()).toEqual(global.mockUser.id.toString())
    })

    it('should save a new performance to the database and return the saved data if isPublic is not provided', async () => {
      const performanceData = { name: 'Test Performance 2' }

      const res = await authenticatedRequest(request, '/api/performance/create', 'post').send(performanceData)

      expect(res.status).toBe(201)

      const savedPerformance = await SadissPerformance.findOne({ name: 'Test Performance 2' })
      expect(savedPerformance).toBeDefined()
      expect(savedPerformance!.name).toBe('Test Performance 2')
      expect(savedPerformance!.isPublic).toBe(false)
      expect(savedPerformance!.userId.toString()).toEqual(global.mockUser.id.toString())
    })

    it('should return a 500 error if there is a server error', async () => {
      jest.spyOn(SadissPerformance.prototype, 'save').mockImplementationOnce(() => {
        throw new Error('Server error')
      })

      const res = await authenticatedRequest(request, '/api/performance/create', 'post').send({ name: 'Test Performance' })

      expect(res.status).toBe(500)
    })
  })
})

export {}
