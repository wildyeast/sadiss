import { Types } from 'mongoose'
import { Track } from '../models'
import { createTestPerformance, createTestTrack, createTestTrackPerformance } from './testUtils'
import { generateMockId } from './testUtils'
import fs from 'fs'

describe('trackController test', () => {
  describe('GET /api/tracks', () => {
    it('should get tracks from DB', async () => {
      const trackId = await createTestTrack()
      const res = await agent.get('/api/tracks').expect(200)
      expect(res.body.tracks.length).toBe(1)
      expect(res.body.tracks[0].name).toBe('test track')
      expect(res.body.tracks[0].mode).toBe('choir')
      expect(res.body.tracks[0].waveform).toBe('sine')
      expect(res.body.tracks[0].partialFile.origName).toBe('testPartialFile.txt')
      expect(res.body.tracks[0].creator.username).toBe(mockUser.username)
      await Track.findByIdAndDelete(trackId)
    })

    it('should return an empty array if no tracks in DB', async () => {
      const res = await agent.get('/api/tracks')!.expect(200)
      expect(res.body.tracks).toEqual([])
    })

    it('should return tracks if tracks in DB', async () => {
      const testTrack = {
        name: 'test track',
        mode: 'choir',
        waveform: 'sine'
      }
      await agent
        .post('/api/track/create')!
        .attach('files', 'tests/testFiles/testPartialFile.txt', 'partialfile-testPartialFile')
        .field('name', testTrack.name)
        .field('mode', testTrack.mode)
        .field('waveform', testTrack.waveform)
        .expect(201)

      const res = await agent.get('/api/tracks')!.expect(200)
      expect(res.body.tracks.length).toBe(1)
      expect(res.body.tracks[0].name).toBe(testTrack.name)
      expect(res.body.tracks[0].mode).toBe(testTrack.mode)
      expect(res.body.tracks[0].waveform).toBe(testTrack.waveform)
    })
  })

  describe('GET /api/track/:id', () => {
    it('should return 404 if track not found', async () => {
      const nonExistantTrackId = generateMockId()
      const res = await agent.get(`/api/track/${nonExistantTrackId}`)!.expect(404)
      expect(res.body.error).toBe('Track not found')
    })

    it('should return track if track found', async () => {
      const testTrack = {
        name: 'test track',
        mode: 'choir',
        waveform: 'sine'
      }
      const resCreate = await agent
        .post('/api/track/create')!
        .attach('files', 'tests/testFiles/testPartialFile.txt', 'partialfile_testPartialFile')
        .field('name', testTrack.name)
        .field('mode', testTrack.mode)
        .field('waveform', testTrack.waveform)
        .expect(201)

      const resGet = await agent.get(`/api/track/${resCreate.body._id}`)!.expect(200)

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
      const res = await agent
        .post('/api/track/create')!
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

      const res = await agent
        .post('/api/track/create')!
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

      const res = await agent
        .post('/api/track/create')
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
      const res = await agent
        .post('/api/track/create')
        .attach('files', 'tests/testFiles/testPartialFile.txt', 'partialfile-testPartialFile')
        .expect(400)
    })

    it('should not create track if no files provided', async () => {
      const track = {
        name: 'test track'
      }

      const res = await agent.post('/api/track/create').send(track).expect(400)
    })

    it('should not create track if no mode provided', async () => {
      const res = await agent
        .post('/api/track/create')
        .attach('files', 'tests/testFiles/testPartialFile.txt', 'partialfile-testPartialFile')
        .field('name', 'test track')
        .expect(400)
    })

    it('should not create track if no waveform provided', async () => {
      const res = await agent
        .post('/api/track/create')
        .attach('files', 'tests/testFiles/testPartialFile.txt', 'partialfile-testPartialFile')
        .field('name', 'test track')
        .field('mode', 'choir')
        .expect(400)
    })
  })

  describe('POST /api/track/edit/:id', () => {
    // it('should edit partial+tts track if partialfile, srt file and necessary fields provided', async () => {
    //   const trackId = await createTestTrack('partialsAndTts')
    //   const resEdit = await agent
    //     .post(`/api/track/edit/${trackId}`)
    //     .attach('files', 'tests/testFiles/testPartialFile2.txt', 'partialfile_testPartialFile2')
    //     .attach('files', 'tests/testFiles/testSrtFile.txt', 'ttsfile_1_de-DE_testSrtFile')
    //     .field('name', 'test track edited')
    //     .field('mode', 'nonChoir')
    //     .field('waveform', 'square')
    //     .expect(200)

    //   expect(resEdit.body.name).toBe('test track edited')
    //   expect(resEdit.body.mode).toBe('nonChoir')
    //   expect(resEdit.body.waveform).toBe('square')
    //   expect(resEdit.body.partialFile.origName).toBe('testPartialFile2.txt')
    //   expect(resEdit.body.ttsFiles[0].origName).toBe('testSrtFile.txt')

    //   const resGet = await agent.get(`/api/track/${trackId}`).expect(200)
    //   expect(resGet.body[0].name).toBe('test track edited')
    //   expect(resGet.body[0].mode).toBe('nonChoir')
    //   expect(resGet.body[0].waveform).toBe('square')
    //   expect(resGet.body[0].partialFile.origName).toBe('testPartialFile2.txt')
    //   expect(resGet.body[0].ttsFiles[0].origName).toBe('testSrtFile.txt')
    //   expect(resGet.body[0].ttsFiles[0].voice).toBe('1')
    //   expect(resGet.body[0].ttsFiles[0].lang).toBe('de-DE')
    // })

    // it('should edit partial track to partial+tts track if srt file and necessary fields provided', async () => {
    //   const trackId = await createTestTrack('partials')
    //   const resEdit = await agent
    //     .post(`/api/track/edit/${trackId}`)
    //     .attach('files', 'tests/testFiles/testSrtFile.txt', 'ttsfile_0_en-US_testSrtFile')
    //     .field('name', 'test track edited')
    //     .field('mode', 'nonChoir')
    //     .field('waveform', 'square')
    //     .expect(200)

    //   expect(resEdit.body.name).toBe('test track edited')
    //   expect(resEdit.body.mode).toBe('nonChoir')
    //   expect(resEdit.body.waveform).toBe('square')
    //   expect(resEdit.body.partialFile.origName).toBe('testPartialFile.txt')
    //   expect(resEdit.body.ttsFiles[0].origName).toBe('testSrtFile.txt')

    //   const resGet = await agent.get(`/api/track/${trackId}`).expect(200)
    //   expect(resGet.body[0].name).toBe('test track edited')
    //   expect(resGet.body[0].mode).toBe('nonChoir')
    //   expect(resGet.body[0].waveform).toBe('square')
    //   expect(resEdit.body.partialFile.origName).toBe('testPartialFile.txt')
    //   expect(resGet.body[0].ttsFiles[0].origName).toBe('testSrtFile.txt')
    // })

    // it('should edit partial track to partial+tts track if partial file and necessary fields provided', async () => {
    //   const trackId = await createTestTrack('tts')
    //   const resEdit = await agent
    //     .post(`/api/track/edit/${trackId}`)!
    //     .attach('files', 'tests/testFiles/testPartialFile2.txt', 'partialfile_testPartialFile2')
    //     .field('name', 'test track edited')
    //     .field('waveform', 'square')
    //     .expect(200)

    //   expect(resEdit.body.name).toBe('test track edited')
    //   expect(resEdit.body.mode).toBe('choir')
    //   expect(resEdit.body.waveform).toBe('square')
    //   expect(resEdit.body.partialFile.origName).toBe('testPartialFile2.txt')
    //   expect(resEdit.body.ttsFiles[0].origName).toBe('testSrtFile.txt')

    //   const resGet = await agent.get(`/api/track/${trackId}`).expect(200)
    //   expect(resGet.body[0].name).toBe('test track edited')
    //   expect(resGet.body[0].mode).toBe('choir')
    //   expect(resGet.body[0].waveform).toBe('square')
    //   expect(resEdit.body.partialFile.origName).toBe('testPartialFile2.txt')
    //   expect(resGet.body[0].ttsFiles[0].origName).toBe('testSrtFile.txt')
    // })

    // it('should add tts file to existing tts files', async () => {
    //   const trackId = await createTestTrack('tts')
    //   const resEdit = await agent
    //     .post(`/api/track/edit/${trackId}`)
    //     .attach('files', 'tests/testFiles/testSrtFile.txt', 'ttsfile_0_en-US_testSrtFile')
    //     .attach('files', 'tests/testFiles/testSrtFile.txt', 'ttsfile_1_de-DE_testSrtFile')
    //     .expect(200)

    //   const resGet = await agent.get(`/api/track/${trackId}`).expect(200)
    //   expect(resGet.body[0].ttsFiles[0].origName).toBe('testSrtFile.txt')
    //   expect(resGet.body[0].ttsFiles[0].voice).toBe('0')
    //   expect(resGet.body[0].ttsFiles[0].lang).toBe('en-US')
    //   expect(resGet.body[0].ttsFiles[1].origName).toBe('testSrtFile.txt')
    //   expect(resGet.body[0].ttsFiles[1].voice).toBe('1')
    //   expect(resGet.body[0].ttsFiles[1].lang).toBe('de-DE')
    // })

    it('should return 403 if user is not owner of track', async () => {
      // Create track with different user
      const track = await new Track({
        name: 'test track',
        mode: 'choir',
        waveform: 'sine',
        creator: generateMockId(),
        isPublic: true
      }).save()

      await agent.post(`/api/track/edit/${track._id}`).field('name', 'test track edited').expect(403)
    })

    it('should return 404 if track not found', async () => {
      const nonExistantTrackId = generateMockId()
      await agent.post(`/api/track/edit/${nonExistantTrackId}`).expect(404)
    })

    it('should return 400 if invalid track id provided', async () => {
      await agent.post(`/api/track/edit/invalidId`).expect(400)
    })

    it('should edit all non-file fields if they are provided', async () => {
      const trackId = await createTestTrack('tts')
      const resEdit = await agent
        .post(`/api/track/edit/${trackId}`)!
        .field('name', 'test track edited')
        .field('mode', 'nonChoir')
        .field('waveform', 'square')
        .field('isPublic', false)
        .field('ttsRate', '0.5')
        .expect(200)

      expect(resEdit.body.name).toBe('test track edited')
      expect(resEdit.body.mode).toBe('nonChoir')
      expect(resEdit.body.waveform).toBe('square')
      expect(resEdit.body.isPublic).toBe(false)
      expect(resEdit.body.ttsRate).toBe('0.5')
    })

    // TODO: This test times out most of the time. I've also seen it pass.
    // I might be doing something wrong. Could also to do with concurrency maybe? Can't figure it out atm.
    // it('should return 500 and error message if saving the edited fails', async () => {
    //   const trackId = await createTestTrack('tts')

    //   jest.spyOn(Track.prototype, 'save').mockRejectedValueOnce(new Error('Save failed'))

    //   const res = await agent.post(`/api/track/edit/${trackId}`).expect(500)
    //   expect(res.body.error).toBe('Save failed')
    // })

    it('should return a 500 error if there is a server error', async () => {
      const trackId = await createTestTrack('tts')

      jest.spyOn(Track.prototype, 'save').mockImplementationOnce(() => {
        throw new Error()
      })

      const res = await agent.post(`/api/track/edit/${trackId}`).expect(500)
      expect(res.body.error).toBe('Server error')
    })
  })

  describe('POST /api/track/delete/:id', () => {
    it('should delete track and trackperformance (if any) if track found', async () => {
      const { performanceId, trackId, trackPerformanceId } = await createTestTrackPerformance()

      let performanceWithTracksResGet = await agent.get(`/api/performance/${performanceId}/with-tracks`).expect(200)

      expect(performanceWithTracksResGet.body.performance.tracks.length).toBe(1)

      const resDelete = await agent.post(`/api/track/delete/${trackId}`).expect(200)
      expect(resDelete.body.message).toBe('Track deleted')

      const trackResGet = await agent.get(`/api/track/${trackId}`).expect(404)
      expect(trackResGet.body.error).toBe('Track not found')

      performanceWithTracksResGet = await agent.get(`/api/performance/${performanceId}/with-tracks`).expect(200)

      expect(performanceWithTracksResGet.body.performance.tracks.length).toBe(0)
    })

    it('should return 404 if track not found', async () => {
      const nonExistantTrackId = generateMockId()
      const resDelete = await agent.post(`/api/track/delete/${nonExistantTrackId}`).expect(404)
      expect(resDelete.body.error).toBe('Track not found')
    })

    it('should return 401 if user is not owner of track', async () => {
      // Create track with different user
      const track = await new Track({
        name: 'test track',
        mode: 'choir',
        waveform: 'sine',
        creator: generateMockId(),
        isPublic: true
      }).save()

      const resDelete = await agent.post(`/api/track/delete/${track._id}`).expect(401)
      expect(resDelete.body.error).toBe('Unauthorized')
    })

    it('should return 500 if trackperformance delete fails', async () => {
      Track.findById = jest.fn().mockImplementationOnce(() => {
        throw new Error('Server error')
      })

      const resDelete = await agent.post(`/api/track/delete/${generateMockId()}`).expect(500)
      expect(resDelete.body.error).toBe('Server error')
    })
  })

  describe('POST /api/track/load', () => {
    it('should return 400 if no or invalid trackId provided', async () => {
      const res = await agent.post(`/api/track/load`).send({ performanceId: generateMockId() }).expect(400)
      expect(res.body.message).toBe('Invalid trackId provided.')
    })

    it('should return 400 if no or invalid performanceId provided', async () => {
      const res = await agent.post(`/api/track/load`).send({ trackId: generateMockId() }).expect(400)
      expect(res.body.message).toBe('Invalid performanceId provided.')
    })

    it('should return 404 if track not found', async () => {
      const res = await agent
        .post(`/api/track/load`)
        .send({ trackId: generateMockId(), performanceId: generateMockId() })
        .expect(404)
      expect(res.body.message).toBe('Track not found.')
    })

    it('should return 500 if there is an error reading the track file', async () => {
      const trackId = await createTestTrack('tts')
      jest.spyOn(fs.promises, 'readFile').mockRejectedValueOnce(new Error('Error reading track file.'))
      const res = await agent.post(`/api/track/load`).send({ trackId, performanceId: generateMockId() }).expect(500)
    })
  })
})

export {}
