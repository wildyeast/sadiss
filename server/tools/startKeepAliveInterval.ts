import { Server } from 'ws'

/**
 * Every 50s we check if connected clients have received a message in the last 5s. If they have not, we send a message to keep the connection alive.
 * @param {Server} wss The current ws websocket server instance.
 */
export const startKeepAliveInterval = (wss: Server) => {
  setInterval(() => {
    if (wss.clients.size) {
      for (const client of wss.clients) {
        const now = Date.now()
        if (!client.lastSentTime || now - client.lastSentTime > 5000) {
          client.send('')
          client.lastSentTime = now
        }
      }
    }
  }, 50000)
}
