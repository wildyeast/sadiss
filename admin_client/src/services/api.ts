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
  const token = localStorage.getItem('jwt')
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers
  })

  const data = await response.json()

  if (!response.ok) {
    return { error: data.message || response.statusText }
  }

  return { data }
}

export async function login(username: string, password: string): Promise<string> {
  const response = await request<{ token: string }>('/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  })

  if (response.error) {
    throw new Error(response.error)
  }

  const { token } = response.data!

  localStorage.setItem('jwt', token)

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

  console.log(response.data!.message)
}

export async function getPerformances() {
  const response = await request<{ performances: Performance[] }>('/api/performances')

  if (response.error) {
    throw new Error(response.error)
  }

  return response.data!.performances
}

export async function createPerformance(performance: { name: string }) {
  const response = await request<{ performance: Performance }>('/api/performance/create', {
    method: 'POST',
    body: JSON.stringify(performance)
  })
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
