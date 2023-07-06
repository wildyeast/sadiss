import { Types } from 'mongoose'
import { SadissPerformance } from '../models/sadissPerformance'
import { createMockWsClient, createTestPerformance, generateMockId, testPerformanceId } from './testUtils'

describe('performanceController test', () => {
  describe('POST /api/performances', () => {
    it('should get performances from DB', async () => {
      // create a performance in the database
      const performance = new SadissPerformance({
        name: 'Performance 1',
        isPublic: true,
        creator: '123456789012'
      })
      await performance.save()

      // save the performance id for later use
      const performanceId = performance._id

      const res = await agent.get('/api/performances').expect(200)

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
      const res = await agent.post('/api/performance/create').send({})

      expect(res.status).toBe(400)
      expect(res.body).toEqual({ error: 'Invalid performance data' })
    })

    it('should save a new performance to the database and return the saved data', async () => {
      const performanceData = { name: 'Test Performance', isPublic: true }

      const res = await agent.post('/api/performance/create').send(performanceData)

      expect(res.status).toBe(201)

      const savedPerformance = await SadissPerformance.findOne({ name: 'Test Performance' })
      expect(savedPerformance).toBeDefined()
      expect(savedPerformance!.name).toBe('Test Performance')
      expect(savedPerformance!.isPublic).toBe(true)
      expect(savedPerformance!.creator.toString()).toEqual(global.mockUser.id.toString())
    })

    it('should save a new performance to the database and return the saved data if isPublic is not provided', async () => {
      const performanceData = { name: 'Test Performance 2' }

      const res = await agent.post('/api/performance/create').send(performanceData)

      expect(res.status).toBe(201)

      const savedPerformance = await SadissPerformance.findOne({ name: 'Test Performance 2' })
      expect(savedPerformance).toBeDefined()
      expect(savedPerformance!.name).toBe('Test Performance 2')
      expect(savedPerformance!.isPublic).toBe(false)
      expect(savedPerformance!.creator.toString()).toEqual(global.mockUser.id.toString())
    })

    it('should return a 500 error if there is a server error', async () => {
      jest.spyOn(SadissPerformance.prototype, 'save').mockImplementationOnce(() => {
        throw new Error('Server error')
      })

      const res = await agent.post('/api/performance/create').send({ name: 'Test Performance' })

      expect(res.status).toBe(500)
    })
  })

  describe('POST /api/performance/delete/:id', () => {
    it('should return a 400 error if invalid id is provided', async () => {
      const res = await agent.post('/api/performance/delete/123').send()

      expect(res.status).toBe(400)
      expect(res.body).toEqual({ error: 'Invalid performance ID' })
    })

    it('should return a 404 error if performance is not found', async () => {
      const res = await agent.post('/api/performance/delete/123456789012').send()

      expect(res.status).toBe(404)
      expect(res.body).toEqual({ error: 'Performance not found' })
    })

    it('should return a 500 error if there is a server error', async () => {
      jest.spyOn(SadissPerformance, 'findById').mockImplementationOnce(() => {
        throw new Error('Server error')
      })

      const res = await agent.post('/api/performance/delete/123456789012').send()

      expect(res.status).toBe(500)
    })

    it('should delete a performance from the database', async () => {
      await createTestPerformance()

      const res = await agent.post(`/api/performance/delete/${testPerformanceId}`).send()

      expect(res.status).toBe(200)

      const deletedPerformance = await SadissPerformance.findById(testPerformanceId)
      expect(deletedPerformance).toBeNull()
    })
  })

  describe('GET /api/get-client-count-per-choir-id', () => {
    it('should return an object with choirIds and respective counts', async () => {
      const performanceId = await createTestPerformance()
      createMockWsClient(performanceId, 0)
      createMockWsClient(performanceId, 0)
      createMockWsClient(performanceId, 1)

      const res = await agent.get(`/api/client-count-per-choir-id/${performanceId}`).expect(200)
      expect(res.body.clientCountPerChoirId).toEqual({
        0: 2,
        1: 1
      })
    })

    it('should return an empty object if no clients connected', async () => {
      const performanceId = await createTestPerformance()
      const res = await agent.get(`/api/client-count-per-choir-id/${performanceId}`).expect(200)
      expect(res.body.clientCountPerChoirId).toEqual({})
    })

    it('should return 400 if performanceId is not a valid ObjectId', async () => {
      await agent.get('/api/client-count-per-choir-id/invalidId').expect(400)
    })
  })

  describe('POST /api/performance/edit/:id', () => {
    it('should return a 400 error if invalid id is provided', async () => {
      const res = await agent.post('/api/performance/edit/123').send()

      expect(res.status).toBe(400)
      expect(res.body).toEqual({ error: 'Invalid performance ID' })
    })

    it('should return a 404 error if performance is not found', async () => {
      const res = await agent.post('/api/performance/edit/123456789012').send()

      expect(res.status).toBe(404)
      expect(res.body).toEqual({ error: 'Performance not found' })
    })

    it('should return a 500 error if there is a server error', async () => {
      jest.spyOn(SadissPerformance, 'findById').mockImplementationOnce(() => {
        throw new Error('Server error')
      })

      const res = await agent.post('/api/performance/edit/123456789012').send()

      expect(res.status).toBe(500)
    })

    it('should update a performance in the database', async () => {
      await createTestPerformance()

      const res = await agent.post(`/api/performance/edit/${testPerformanceId}`).send({ name: 'Updated Performance' })

      expect(res.status).toBe(200)

      const updatedPerformance = await SadissPerformance.findById(testPerformanceId)
      expect(updatedPerformance).toBeDefined()
      expect(updatedPerformance!.name).toBe('Updated Performance')
    })
  })
})

export {}
