import { connectDB, disconnectDB } from '../database'
import { SadissPerformance, User, TrackPerformance, Track } from '../models'
import { authenticatedRequest, mockId } from './testUtils'

const { app, server, wss } = require('../server')
const supertest = require('supertest')
const request = supertest(app)

describe('getPerformanceWithTracks', () => {
  beforeAll(async () => {
    await connectDB()
  })

  afterAll(async () => {
    await disconnectDB()
    server.close()
    wss.close()
  })

  it('should return performance data with associated tracks', async () => {
    //   // Mock the data and queries
    //   const mockPerformanceId = 'mock-performance-id'
    //   const mockUserId = 'mock-user-id'
    //   const mockUsername = 'mock-username'
    //   const mockTrackId1 = 'mock-track-id-1'
    //   const mockTrackId2 = 'mock-track-id-2'
    //   const mockPerformance = {
    //     _id: mockPerformanceId,
    //     name: 'Performance 1',
    //     userId: mockUserId
    //   }
    //   const mockUser = {
    //     _id: mockUserId,
    //     username: mockUsername
    //   }
    //   const mockTrackPerformances = [{ trackId: mockTrackId1 }, { trackId: mockTrackId2 }]
    //   const mockTracks = [
    //     {
    //       _id: mockTrackId1,
    //       name: 'Track 1',
    //       notes: 'Notes 1',
    //       mode: 'Mode 1',
    //       waveform: 'Waveform 1',
    //       ttsRate: 1.5,
    //       userId: mockUserId,
    //       isPublic: true
    //     },
    //     {
    //       _id: mockTrackId2,
    //       name: 'Track 2',
    //       notes: 'Notes 2',
    //       mode: 'Mode 2',
    //       waveform: 'Waveform 2',
    //       ttsRate: 2.0,
    //       userId: mockUserId,
    //       isPublic: false
    //     }
    //   ]
    //   // Mock the database queries
    //   SadissPerformance.findById = jest.fn().mockResolvedValue(mockPerformance)
    //   User.findById = jest.fn().mockResolvedValue(mockUser)
    //   TrackPerformance.find = jest.fn().mockResolvedValue(mockTrackPerformances)
    //   Track.findById.mockImplementation((trackId: string) => {
    //     const foundTrack = mockTracks.find((track) => track._id === trackId)
    //     return Promise.resolve(foundTrack)
    //   })
    //   // Make the request to the route handler
    //   const response = await request(app).get(`/performance/${mockPerformanceId}`).expect(200)
    //   // Verify the response
    //   expect(response.body.performance).toEqual({
    //     _id: mockPerformanceId,
    //     name: 'Performance 1',
    //     username: mockUsername,
    //     tracks: [
    //       {
    //         _id: mockTrackId1,
    //         name: 'Track 1',
    //         notes: 'Notes 1',
    //         mode: 'Mode 1',
    //         waveform: 'Waveform 1',
    //         ttsRate: 1.5,
    //         userId: mockUserId,
    //         isPublic: true
    //       },
    //       {
    //         _id: mockTrackId2,
    //         name: 'Track 2',
    //         notes: 'Notes 2',
    //         mode: 'Mode 2',
    //         waveform: 'Waveform 2',
    //         ttsRate: 2.0,
    //         userId: mockUserId,
    //         isPublic: false
    //       }
    //     ]
    //   })
    //   // Verify that the database queries were called correctly
    //   expect(SadissPerformance.findById).toHaveBeenCalledWith(mockPerformanceId)
    //   expect(User.findById).toHaveBeenCalledWith(mockUserId, 'username')
    //   expect(TrackPerformance.find).toHaveBeenCalledWith({ performanceId: mockPerformanceId }, 'trackId')
    //   expect(Track.findById).toHaveBeenCalledWith(mockTrackId1, '_id name notes mode waveform ttsRate userId isPublic')
    //   expect(Track.findById).toHaveBeenCalledWith(mockTrackId2, '_id name notes mode waveform ttsRate userId isPublic')
  })

  it('should return error response if fetching performance fails', async () => {
    SadissPerformance.findById = jest.fn().mockImplementationOnce(() => {
      throw new Error('Server error')
    })
    const res = await authenticatedRequest(request, `/api/performance/${mockId}`, 'get').expect(500)
    expect(res.body).toEqual({ Error: 'Failed fetching performance.' })
    expect(SadissPerformance.findById).toHaveBeenCalledWith(mockId)
  })
})
