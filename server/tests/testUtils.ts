export const authenticatedRequest = (request: any, route: string, method: 'get' | 'post') => {
  if (method === 'get') {
    return request.get(route).set('Authorization', `Bearer ${global.token}`)
  } else if (method === 'post') {
    return request.post(route).set('Authorization', `Bearer ${global.token}`)
  }
}
/**
 * This is a mock id that is used in tests.
 * It is 12 characters long, which is the length of a MongoDB ObjectId.
 *
 * @constant {string} */
export const mockId = '012345678901'
