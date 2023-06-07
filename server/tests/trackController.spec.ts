import exp from 'constants'
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

  describe('GET /tracks', () => {
    it('should get tracks from DB', async () => {
      const res = await authenticatedRequest(request, '/api/tracks', 'get')
      expect(res.status).toBe(200)
    })
  })

  describe('POST /api/track/create', () => {
    it('should not create track if no files provided', async () => {
      const track = {
        name: 'test track'
      }

      const res = await authenticatedRequest(request, '/api/track/create', 'post').send(track).expect(400)
      expect(res.body.error).toBe('No files were uploaded.')
    })

    it('should create track if files and necessary fields provided', async () => {
      const testTrack = {
        name: 'test track',
        mode: 'choir',
        waveform: 'sine'
      }
      const res = await authenticatedRequest(request, '/api/track/create', 'post')
        .attach('files', 'tests/testFiles/testPartialFile.txt')
        .field('name', testTrack.name)
        .field('mode', testTrack.mode)
        .field('waveform', testTrack.waveform)
        .expect(201)

      expect(res.body.name).toBe(testTrack.name)
      expect(res.body.mode).toBe(testTrack.mode)
      expect(res.body.waveform).toBe(testTrack.waveform)
    })

    it('should not create track if no name provided', async () => {
      const res = await authenticatedRequest(request, '/api/track/create', 'post')
        .attach('files', 'tests/testFiles/testPartialFile.txt')
        .expect(400)
      expect(res.body.error).toBe('No name provided.')
    })

    it('should not create track if no mode provided', async () => {
      const res = await authenticatedRequest(request, '/api/track/create', 'post')
        .attach('files', 'tests/testFiles/testPartialFile.txt')
        .field('name', 'test track')
        .expect(400)
      expect(res.body.error).toBe('No mode provided.')
    })

    it('should not create track if no waveform provided', async () => {
      const res = await authenticatedRequest(request, '/api/track/create', 'post')
        .attach('files', 'tests/testFiles/testPartialFile.txt')
        .field('name', 'test track')
        .field('mode', 'choir')
        .expect(400)
      expect(res.body.error).toBe('No waveform provided.')
    })
  })
})

export {}
