import exp from 'constants'
import { connectDB, disconnectDB } from '../database'
import { authenticatedRequest } from './testUtils'
import { generateMockId } from './testUtils'

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

  describe('GET /api/tracks', () => {
    it('should get tracks from DB', async () => {
      const res = await authenticatedRequest(request, '/api/tracks', 'get').expect(200)
    })

    it('should return an empty array if no tracks in DB', async () => {
      const res = await authenticatedRequest(request, '/api/tracks', 'get').expect(200)
      expect(res.body.tracks).toEqual([])
    })

    it('should return tracks if tracks in DB', async () => {
      const testTrack = {
        name: 'test track',
        mode: 'choir',
        waveform: 'sine'
      }
      await authenticatedRequest(request, '/api/track/create', 'post')
        .attach('files', 'tests/testFiles/testPartialFile.txt', 'partialfile-testPartialFile.txt')
        .field('name', testTrack.name)
        .field('mode', testTrack.mode)
        .field('waveform', testTrack.waveform)
        .expect(201)

      const res = await authenticatedRequest(request, '/api/tracks', 'get').expect(200)
      expect(res.body.tracks.length).toBe(1)
      expect(res.body.tracks[0].name).toBe(testTrack.name)
      expect(res.body.tracks[0].mode).toBe(testTrack.mode)
      expect(res.body.tracks[0].waveform).toBe(testTrack.waveform)
    })
  })

  describe('GET /api/track/:id', () => {
    it('should return 404 if track not found', async () => {
      const nonExistantTrackId = generateMockId()
      const res = await authenticatedRequest(request, `/api/track/${nonExistantTrackId}`, 'get').expect(404)
      expect(res.body.error).toBe('Track not found')
    })

    it('should return track if track found', async () => {
      const testTrack = {
        name: 'test track',
        mode: 'choir',
        waveform: 'sine'
      }
      const resCreate = await authenticatedRequest(request, '/api/track/create', 'post')
        .attach('files', 'tests/testFiles/testPartialFile.txt', 'partialfile_testPartialFile.txt')
        .field('name', testTrack.name)
        .field('mode', testTrack.mode)
        .field('waveform', testTrack.waveform)
        .expect(201)

      const resGet = await authenticatedRequest(request, `/api/track/${resCreate.body._id}`, 'get').expect(200)

      expect(resGet.body[0].name).toBe(testTrack.name)
      expect(resGet.body[0].mode).toBe(testTrack.mode)
      expect(resGet.body[0].waveform).toBe(testTrack.waveform)
      expect(resGet.body[0].partialFile.origName).toBe('testPartialFile.txt')
      expect(resGet.body[0].partialFile.fileName).toBeTruthy()
    })
  })

  describe('POST /api/track/create', () => {
    it('should create track if partialfile and necessary fields provided', async () => {
      const testTrack = {
        name: 'test track',
        mode: 'choir',
        waveform: 'sine'
      }
      const res = await authenticatedRequest(request, '/api/track/create', 'post')
        .attach('files', 'tests/testFiles/testPartialFile.txt', 'partialfile_testPartialFile.txt')
        .field('name', testTrack.name)
        .field('mode', testTrack.mode)
        .field('waveform', testTrack.waveform)
        .expect(201)

      expect(res.body.name).toBe(testTrack.name)
      expect(res.body.mode).toBe(testTrack.mode)
      expect(res.body.waveform).toBe(testTrack.waveform)
      expect(res.body.partialFile.origName).toBe('testPartialFile.txt')
    })

    it('should create track if TTS .srt file and necessary fields provided', async () => {
      const testTrack = {
        name: 'test track',
        mode: 'choir',
        waveform: 'sine'
      }

      const res = await authenticatedRequest(request, '/api/track/create', 'post')
        .attach('files', 'tests/testFiles/testSrtFile.srt', 'ttsfile_0_en-US_testSrtFile.srt')
        .field('name', testTrack.name)
        .field('mode', testTrack.mode)
        .field('waveform', testTrack.waveform)
        .expect(201)

      expect(res.body.name).toBe(testTrack.name)
      expect(res.body.mode).toBe(testTrack.mode)
      expect(res.body.waveform).toBe(testTrack.waveform)
      expect(res.body.ttsFiles[0].origName).toBe('testSrtFile.srt')
    })

    it('should create track if TTS .txt file and necessary fields provided', async () => {
      const testTrack = {
        name: 'test track',
        mode: 'choir',
        waveform: 'sine'
      }

      const res = await authenticatedRequest(request, '/api/track/create', 'post')
        .attach('files', 'tests/testFiles/testSrtFile.txt', 'ttsfile_0_en-US_testSrtFile.txt')
        .field('name', testTrack.name)
        .field('mode', testTrack.mode)
        .field('waveform', testTrack.waveform)
        .expect(201)

      expect(res.body.name).toBe(testTrack.name)
      expect(res.body.mode).toBe(testTrack.mode)
      expect(res.body.waveform).toBe(testTrack.waveform)
      expect(res.body.ttsFiles[0].origName).toBe('testSrtFile.txt')
    })

    it('should not create track if no name provided', async () => {
      const res = await authenticatedRequest(request, '/api/track/create', 'post')
        .attach('files', 'tests/testFiles/testPartialFile.txt', 'partialfile-testPartialFile.txt')
        .expect(400)
      expect(res.body.error).toBe('No name provided.')
    })

    it('should not create track if no files provided', async () => {
      const track = {
        name: 'test track'
      }

      const res = await authenticatedRequest(request, '/api/track/create', 'post').send(track).expect(400)
      expect(res.body.error).toBe('No files were uploaded.')
    })

    it('should not create track if no mode provided', async () => {
      const res = await authenticatedRequest(request, '/api/track/create', 'post')
        .attach('files', 'tests/testFiles/testPartialFile.txt', 'partialfile-testPartialFile.txt')
        .field('name', 'test track')
        .expect(400)
      expect(res.body.error).toBe('No mode provided.')
    })

    it('should not create track if no waveform provided', async () => {
      const res = await authenticatedRequest(request, '/api/track/create', 'post')
        .attach('files', 'tests/testFiles/testPartialFile.txt', 'partialfile-testPartialFile.txt')
        .field('name', 'test track')
        .field('mode', 'choir')
        .expect(400)
      expect(res.body.error).toBe('No waveform provided.')
    })
  })
})

export {}
