import type { SadissPerformance, Track } from '@/types/types'

const BASE_URL = 'http://localhost:3005'

interface RequestOptions {
  method: string
  body?: BodyInit
  headers?: HeadersInit
}

interface ApiResponse<T> {
  data?: T
  error?: string
}

async function request<T>(path: string, options?: RequestOptions): Promise<ApiResponse<T>> {
  const headers: HeadersInit = {}

  if (options && options.body instanceof FormData) {
    // Use 'multipart/form-data' headers for FormData
    headers.Accept = 'application/json'
  } else {
    // Use 'application/json' headers for other payloads
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include'
  })

  const data = await response.json()

  if (!response.ok) {
    return { error: data.message || response.statusText }
  }

  return { data }
}

/* AUTH */
export async function login(username: string, password: string): Promise<string> {
  const response = await request<{ token: string }>('/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  })

  if (response.error) {
    throw new Error(response.error)
  }

  const { token } = response.data!

  return token
}

export async function register(username: string, email: string, password: string): Promise<void> {
  const response = await request<{ message: string }>('/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password })
  })

  if (response.error) {
    throw new Error(response.error)
  }
}

// isLoggedIn
export async function isUserLoggedIn() {
  const response = await request<{ message: string }>('/is-logged-in')

  if (response.error) {
    throw new Error(response.error)
  }

  return response.data!.message === 'Logged in'
}

export async function logout() {
  const response = await request<{ message: string }>('/logout')

  if (response.error) {
    throw new Error(response.error)
  }

  return response.data!.message === 'Logged out'
}

/* PERFORMANCES */
export async function getPerformances() {
  const response = await request<{ performances: SadissPerformance[] }>('/api/performances')

  if (response.error) {
    throw new Error(response.error)
  }

  return response.data!.performances
}

export async function getPerformance(id: string) {
  const response = await request<{ performance: SadissPerformance }>(`/api/performance/${id}`)

  if (response.error) {
    throw new Error(response.error)
  }

  return response.data!.performance
}

export async function createPerformance(name: string, isPublic: boolean) {
  const response = await request<{ performance: SadissPerformance }>('/api/performance/create', {
    method: 'POST',
    body: JSON.stringify({
      name,
      isPublic
    })
  })
}

export async function deletePerformance(id: string) {
  const response = await request<{ performance: SadissPerformance }>(`/api/performance/delete/${id}`, {
    method: 'DELETE'
  })
}

/* TRACKS */
export async function getTracks() {
  const response = await request<{ tracks: Track[] }>('/api/tracks')

  if (response.error) {
    throw new Error(response.error)
  }

  return response.data!.tracks
}

export async function getTrack(id: string) {
  const response = await request<{ track: SadissPerformance }>(`/api/track/${id}`)

  if (response.error) {
    throw new Error(response.error)
  }

  return response.data!.track
}

export async function createTrack(trackData: FormData) {
  const response = await request<{ track: Track }>('/api/track/create', {
    method: 'POST',
    body: trackData
  })

  if (response.error) {
    throw new Error(response.error)
  }

  return response.data!.track
}

export async function editTrack(trackId: string, trackData: FormData) {
  const response = await request<{ track: Track }>(`/api/track/edit/${trackId}`, {
    method: 'POST',
    body: trackData
  })

  if (response.error) {
    throw new Error(response.error)
  }

  return response.data!.track
}

export async function deleteTrack(id: string) {
  const response = await request<{ track: Track }>(`/api/track/delete/${id}`, {
    method: 'DELETE'
  })
}

export async function startTrack(trackId: string, performanceId: string, startTime: number, loop = false) {
  const response = await request<{ track: Track }>(`/api/track/start`, {
    method: 'POST',
    body: JSON.stringify({ trackId, performanceId, startTime, loop })
  })

  if (response.error) {
    throw new Error(response.error)
  }

  return response.data!
}

export async function stopTrack(performanceId: string) {
  const response = await request<{ track: Track }>(`/api/track/stop`, {
    method: 'POST',
    body: JSON.stringify({ performanceId })
  })

  if (response.error) {
    throw new Error(response.error)
  }

  return response.data!
}

/* TRACK PERFORMANCE */
export async function addTrackToPerformance(trackId: string, performanceId: string) {
  const response = await request<{ trackPerformance: { performanceId: string; trackId: string } }>(
    `/api/add-track-to-performance`,
    {
      method: 'POST',
      body: JSON.stringify({
        trackId,
        performanceId
      })
    }
  )

  if (response.error) {
    throw new Error(response.error)
  }

  return response.data!.trackPerformance
}

export async function getPerformanceWithTracks(id: string) {
  const response = await request<{ performance: SadissPerformance }>(`/api/performance/${id}/with-tracks`)

  if (response.error) {
    throw new Error(response.error)
  }

  return response.data!.performance
}

// export async function getTracks() {
//   const response = await request<{ tracks: Track[] }>('/tracks')

//   if (response.error) {
//     throw new Error(response.error)
//   }

//   return response.data!.tracks
// }

// export async function createTrack(track: Track) {
//   const response = await request<{ track: Track }>('/track/create', {
//     method: 'POST',
//     body: JSON.stringify(track)
//   })

//   if (response.error) {
//     throw new Error(response.error)
//   }

//   return response.data!.track
// }

// export async function updateTrack(track: Track) {
//   const response = await request<{ track: Track }>(`/track/edit/${track._id}`, {
//     method: 'PUT',
//     body: JSON.stringify(track)
//   })

//   if (response.error) {
//     throw new Error(response.error)
//   }

//   return response.data!.track
// }

// export async function deleteTrack(trackId: string) {
//   const response = await request<void>(`/track/delete/${trackId}`, {
//     method: 'DELETE'
//   })

//   if (response.error) {
//     throw new Error(response.error)
//   }
// }
