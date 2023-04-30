import { connectDB, disconnectDB } from '../database'
import { SadissPerformance } from '../models/sadissPerformance'
import jwt from 'jsonwebtoken'
import { UserDocument } from '../types/types'

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

  describe('POST /get-performances', () => {
    it('should get performances from DB', async () => {
      const res = await request.get('/get-performances')
      expect(res.status).toBe(200)

      const performances = JSON.parse(res.text)
      expect(Array.isArray(performances)).toBe(true)
      expect(performances.length).toBeGreaterThan(0)

      for (const performance of performances) {
        expect(performance).toHaveProperty('name')
        expect(performance).toHaveProperty('location')
      }
    })
  })

  describe('POST /create-performance', () => {
    let mockUser: { id: string; username: string; email: string }
    let token: string
    beforeAll(() => {
      // Mock user data
      mockUser = {
        id: '123',
        username: 'Test User',
        email: 'testuser@example.com'
      }

      // Generate JWT token for mock user
      token = jwt.sign(mockUser, process.env.JWT_SECRET!)
    })

    it('should return a 400 error if invalid data is provided', async () => {
      const res = await request.post('/create-performance').set('Authorization', `Bearer ${token}`).send({})

      expect(res.status).toBe(400)
      expect(res.body).toEqual({ error: 'Invalid performance data' })
    })

    it('should save a new performance to the database and return the saved data', async () => {
      const performanceData = { name: 'Test Performance', isPublic: true }

      const res = await request.post('/create-performance').set('Authorization', `Bearer ${token}`).send(performanceData)

      expect(res.status).toBe(201)

      const savedPerformance = await SadissPerformance.findOne({ name: 'Test Performance' })
      expect(savedPerformance).toBeDefined()
      expect(savedPerformance!.name).toBe('Test Performance')
      expect(savedPerformance!.isPublic).toBe(true)
      expect(savedPerformance!.userId).toBe(mockUser.id)
    })

    it('should return a 500 error if there is a server error', async () => {
      jest.spyOn(SadissPerformance.prototype, 'save').mockImplementationOnce(() => {
        throw new Error('Server error')
      })

      const res = await request
        .post('/create-performance')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test Performance' })

      expect(res.status).toBe(500)
    })
  })
})

export {}
