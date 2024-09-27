import { Server } from 'ws'
import { activePerformances } from './activePerformanceService'
import { logger } from '../tools'
import { Message } from '../types/types'
import { v4 as uuidv4 } from 'uuid'

/**
 * Starts a WebSocket server on the specified port.
 * @param port The port number to listen on. If not provided, a random port will be used.
 * @returns The WebSocket server instance.
 */
export const startWebSocketServer = (port = 0) => {
  const wss = new Server({ port })

  wss.on('connection', (client) => {
    // Assign id to new connection, needed for nonChoir partial distribution
    client.id = uuidv4()
    logger.info(`New client connected! Assigned id: ${client.id} Total clients: ${wss.clients.size}`)

    client.onclose = () => logger.info(`Client ${client.id} has disconnected!`)

    client.onmessage = (event) => {
      const parsed: Message = JSON.parse(event.data.toString())
      logger.debug(`Received message from ws client: ${parsed.message}`)
      if (parsed.message === 'clientInfo') {
        client.choirId = parsed.clientId
        client.ttsLang = parsed.ttsLang
        client.performanceId = parsed.performanceId
        logger.info(
          `Performance ${client.performanceId}: Client ${client.id} registered with choir id ${client.choirId} and TTS lang ${client.ttsLang.iso}`
        )
        client.send('clientInfoReceived')
      } else if (parsed.message === 'measure') {
        client.send('measure')
      } else if (parsed.message === 'isAdmin') {
        client.isAdmin = true

        client.send(createAdminInfoMessage(wss))

        if (parsed.performanceId) {
          client.performanceId = parsed.performanceId
          logger.info(`Performance ${client.performanceId}: Client ${client.id} is admin`)
        }
      }
    }
  })

  return wss
}

export const startDashboardInformationInterval = (wss: Server) => {
  setInterval(() => {
    for (const client of wss.clients) {
      if (client.isAdmin) {
        const adminInfo = createAdminInfoMessage(wss)
        client.send(adminInfo)
      }
    }
  }, 5000)
}

const createAdminInfoMessage = (wss: Server) => {
  return JSON.stringify({
    message: 'adminInfo',
    adminInfo: {
      activePerformancesCount: activePerformances.filter((performance) => performance.isRunning()).length,
      connectedClientsCount: wss.clients.size
    }
  })
}
