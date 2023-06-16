export const authenticatedRequest = (request: any, route: string, method: 'get' | 'post', unauthorized = false) => {
  const token = unauthorized ? global.unauthorizedToken : global.token

  if (method === 'get') {
    return request.get(route).set('Cookie', `jwt=${token}`)
  } else if (method === 'post') {
    return request.post(route).set('Cookie', `jwt=${token}`)
  }
}

/**
 * This is a mock id that is used in tests.
 * It is 12 characters long, which is the length of a MongoDB ObjectId.
 *
 * @constant {string} */
export const mockId = '012345678901'

/**
 * Returns a string of length 12, which is the length of a MongoDB ObjectId.
 */
export const generateMockId = () => {
  const desiredLength = 12
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''

  for (let i = 0; i < desiredLength; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length)
    result += characters.charAt(randomIndex)
  }

  return result
}
