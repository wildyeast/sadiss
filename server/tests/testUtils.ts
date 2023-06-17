import mongoose from 'mongoose'

export const authenticatedRequest = (request: any, route: string, method: 'get' | 'post', unauthorized = false) => {
  const token = unauthorized ? global.unauthorizedToken : global.token

  if (method === 'get') {
    return request.get(route).set('Cookie', `jwt=${token}`)
  } else if (method === 'post') {
    return request.post(route).set('Cookie', `jwt=${token}`)
  }
}

/**
 * Returns a MongoDB ObjectId. This is used to mock MongoDB ids in tests.
 */
export const generateMockId = () => new mongoose.Types.ObjectId()
