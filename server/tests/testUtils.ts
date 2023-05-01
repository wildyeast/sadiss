export const authenticatedRequest = (request: any, route: string, method: 'get' | 'post') => {
  if (method === 'get') {
    return request.get(route).set('Authorization', `Bearer ${global.token}`)
  } else if (method === 'post') {
    return request.post(route).set('Authorization', `Bearer ${global.token}`)
  }
}
