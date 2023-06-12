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
        .attach('files', 'tests/testFiles/testPartialFile.txt', 'partialfile-testPartialFile')
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
        .attach('files', 'tests/testFiles/testPartialFile.txt', 'partialfile_testPartialFile')
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
        .attach('files', 'tests/testFiles/testPartialFile.txt', 'partialfile_testPartialFile')
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
        .attach('files', 'tests/testFiles/testSrtFile.srt', 'ttsfile_0_en-US_testSrtFile')
        .field('name', testTrack.name)
        .field('mode', testTrack.mode)
        .field('waveform', testTrack.waveform)
        .expect(201)

      expect(res.body.name).toBe(testTrack.name)
      expect(res.body.mode).toBe(testTrack.mode)
      expect(res.body.waveform).toBe(testTrack.waveform)
      expect(res.body.ttsFiles[0].origName).toBe('testSrtFile.txt')
      expect(res.body.ttsFiles[0].voice).toBe('0')
      expect(res.body.ttsFiles[0].lang).toBe('en-US')
    })

    it('should create track if TTS .txt file and necessary fields provided', async () => {
      const testTrack = {
        name: 'test track',
        mode: 'choir',
        waveform: 'sine'
      }

      const res = await authenticatedRequest(request, '/api/track/create', 'post')
        .attach('files', 'tests/testFiles/testSrtFile.txt', 'ttsfile_0_en-US_testSrtFile')
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
        .attach('files', 'tests/testFiles/testPartialFile.txt', 'partialfile-testPartialFile')
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
        .attach('files', 'tests/testFiles/testPartialFile.txt', 'partialfile-testPartialFile')
        .field('name', 'test track')
        .expect(400)
      expect(res.body.error).toBe('No mode provided.')
    })

    it('should not create track if no waveform provided', async () => {
      const res = await authenticatedRequest(request, '/api/track/create', 'post')
        .attach('files', 'tests/testFiles/testPartialFile.txt', 'partialfile-testPartialFile')
        .field('name', 'test track')
        .field('mode', 'choir')
        .expect(400)
      expect(res.body.error).toBe('No waveform provided.')
    })
  })

  describe('POST /api/track/edit/:id', () => {
    let testTrackId = ''
    afterEach(async () => {
      testTrackId = ''
    })

    it('should edit partial+tts track if partialfile, srt file and necessary fields provided', async () => {
      await createTestTrack('partialsAndTts')
      const resEdit = await authenticatedRequest(request, `/api/track/edit/${testTrackId}`, 'post')
        .attach('files', 'tests/testFiles/testPartialFile2.txt', 'partialfile_testPartialFile2')
        .attach('files', 'tests/testFiles/testSrtFile.txt', 'ttsfile_1_de-DE_testSrtFile')
        .field('name', 'test track edited')
        .field('mode', 'nonChoir')
        .field('waveform', 'square')
        .expect(200)

      expect(resEdit.body.name).toBe('test track edited')
      expect(resEdit.body.mode).toBe('nonChoir')
      expect(resEdit.body.waveform).toBe('square')
      expect(resEdit.body.partialFile.origName).toBe('testPartialFile2.txt')
      expect(resEdit.body.ttsFiles[0].origName).toBe('testSrtFile.txt')

      const resGet = await authenticatedRequest(request, `/api/track/${testTrackId}`, 'get').expect(200)
      expect(resGet.body[0].name).toBe('test track edited')
      expect(resGet.body[0].mode).toBe('nonChoir')
      expect(resGet.body[0].waveform).toBe('square')
      expect(resGet.body[0].partialFile.origName).toBe('testPartialFile2.txt')
      expect(resGet.body[0].ttsFiles[0].origName).toBe('testSrtFile.txt')
      expect(resGet.body[0].ttsFiles[0].voice).toBe('1')
      expect(resGet.body[0].ttsFiles[0].lang).toBe('de-DE')
    })

    it('should edit partial track to partial+tts track if srt file and necessary fields provided', async () => {
      await createTestTrack('partials')
      const resEdit = await authenticatedRequest(request, `/api/track/edit/${testTrackId}`, 'post')
        .attach('files', 'tests/testFiles/testSrtFile.txt', 'ttsfile_0_en-US_testSrtFile')
        .field('name', 'test track edited')
        .field('mode', 'nonChoir')
        .field('waveform', 'square')
        .expect(200)

      expect(resEdit.body.name).toBe('test track edited')
      expect(resEdit.body.mode).toBe('nonChoir')
      expect(resEdit.body.waveform).toBe('square')
      expect(resEdit.body.partialFile.origName).toBe('testPartialFile.txt')
      expect(resEdit.body.ttsFiles[0].origName).toBe('testSrtFile.txt')

      const resGet = await authenticatedRequest(request, `/api/track/${testTrackId}`, 'get').expect(200)
      expect(resGet.body[0].name).toBe('test track edited')
      expect(resGet.body[0].mode).toBe('nonChoir')
      expect(resGet.body[0].waveform).toBe('square')
      expect(resEdit.body.partialFile.origName).toBe('testPartialFile.txt')
      expect(resGet.body[0].ttsFiles[0].origName).toBe('testSrtFile.txt')
    })

    it('should edit partial track to partial+tts track if partial file and necessary fields provided', async () => {
      await createTestTrack('tts')
      const resEdit = await authenticatedRequest(request, `/api/track/edit/${testTrackId}`, 'post')
        .attach('files', 'tests/testFiles/testPartialFile2.txt', 'partialfile_testPartialFile2')
        .field('name', 'test track edited')
        .field('waveform', 'square')
        .expect(200)

      expect(resEdit.body.name).toBe('test track edited')
      expect(resEdit.body.mode).toBe('choir')
      expect(resEdit.body.waveform).toBe('square')
      expect(resEdit.body.partialFile.origName).toBe('testPartialFile2.txt')
      expect(resEdit.body.ttsFiles[0].origName).toBe('testSrtFile.txt')

      const resGet = await authenticatedRequest(request, `/api/track/${testTrackId}`, 'get').expect(200)
      expect(resGet.body[0].name).toBe('test track edited')
      expect(resGet.body[0].mode).toBe('choir')
      expect(resGet.body[0].waveform).toBe('square')
      expect(resEdit.body.partialFile.origName).toBe('testPartialFile2.txt')
      expect(resGet.body[0].ttsFiles[0].origName).toBe('testSrtFile.txt')
    })

    it('should add tts file to existing tts files', async () => {
      await createTestTrack('tts')
      const resEdit = await authenticatedRequest(request, `/api/track/edit/${testTrackId}`, 'post')
        .attach('files', 'tests/testFiles/testSrtFile.txt', 'ttsfile_0_en-US_testSrtFile')
        .attach('files', 'tests/testFiles/testSrtFile.txt', 'ttsfile_1_de-DE_testSrtFile')
        .expect(200)

      const resGet = await authenticatedRequest(request, `/api/track/${testTrackId}`, 'get').expect(200)
      expect(resGet.body[0].ttsFiles[0].origName).toBe('testSrtFile.txt')
      expect(resGet.body[0].ttsFiles[0].voice).toBe('0')
      expect(resGet.body[0].ttsFiles[0].lang).toBe('en-US')
      expect(resGet.body[0].ttsFiles[1].origName).toBe('testSrtFile.txt')
      expect(resGet.body[0].ttsFiles[1].voice).toBe('1')
      expect(resGet.body[0].ttsFiles[1].lang).toBe('de-DE')
    })

    // Helpers
    const createTestTrack = async (trackType: 'partials' | 'tts' | 'partialsAndTts' = 'partialsAndTts') => {
      const testTrack = {
        name: 'test track',
        mode: 'choir',
        waveform: 'sine'
      }

      const req = authenticatedRequest(request, '/api/track/create', 'post')
        .field('name', testTrack.name)
        .field('mode', testTrack.mode)
        .field('waveform', testTrack.waveform)

      if (trackType === 'partials') {
        req.attach('files', 'tests/testFiles/testPartialFile.txt', 'partialfile_testPartialFile')
      } else if (trackType === 'tts') {
        req.attach('files', 'tests/testFiles/testSrtFile.txt', 'ttsfile_0_en-US_testSrtFile')
      } else if (trackType === 'partialsAndTts') {
        req
          .attach('files', 'tests/testFiles/testPartialFile.txt', 'partialfile_testPartialFile')
          .attach('files', 'tests/testFiles/testSrtFile.txt', 'ttsfile_0_en-US_testSrtFile')
      }

      const resCreate = await req.expect(201)

      testTrackId = resCreate.body._id
    }
  })
})

export {}
