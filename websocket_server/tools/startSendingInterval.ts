import { Server } from "ws"
import { PartialChunk, TtsInstruction, Mode } from "../types/types"

let sendingIntervalRunning = false
// More or less accurate timer taken from https://stackoverflow.com/a/29972322/16725862
export const startSendingInterval = (track: { partials: PartialChunk[], ttsInstructions: TtsInstruction[] }[],
  mode: Mode, startTime: number, wss: Server) => {

  clearInterval(keepAliveIntervalId)
  console.log('Keep alive interval stopped.')

  sendingIntervalRunning = true

  const interval = 1000 // ms
  let expected = Date.now() + interval
  let chunkIndex = 0

  // nonChoir mode: Stores partialIds and array of client ids that were given
  // the respective partial in the last iteration
  let partialMap: { [partialId: string]: string[] } = {}

  // Start
  setTimeout(step, interval)

  function step () {
    if (!sendingIntervalRunning) {
      console.log('Sending interval stopped.')
      reset()
      return
    }

    if (chunkIndex >= track.length) {
      console.log('No more chunks. Stopping.')
      sendingIntervalRunning = false
      reset()
      return
    }

    const dt = Date.now() - expected
    if (dt > interval) {
      console.log('Sending interval somehow broke. Stopping.')
      sendingIntervalRunning = false
      reset()
      return
    }

    // Distribute partials among clients and send them to clients

    if (mode === 'choir') {
      // Choir mode
      wss.clients.forEach((client) => {
        if (!client.isAdmin) {
          const partialById = track[chunkIndex].partials.find((chunk: PartialChunk) => chunk.index === client.choirId)
          if (partialById) {
            client.send(JSON.stringify({ startTime: startTime + 2, chunk: { partials: [partialById] } }))
          }
        }
      })
    } else {
      // nonChoir mode

      const clientArr = Array.from(wss.clients)
      const clients = clientArr.filter(client => !client.isAdmin)
      const partials = track[chunkIndex].partials

      const newPartialMap: { [partialIndex: string]: string[] } = {}

      const allocatedPartials: { [clientId: string]: PartialChunk[] } = {}

      for (let i = 0; i < clients.length; i++) {
        allocatedPartials[clients[i].id] = []
      }

      for (const partial of partials) {
        newPartialMap[partial.index] = []

        if (partial.index in partialMap) {
          // Partial of same index was distributed last iteration
          // Distribute again to same client, if client still connected
          const clientIdsLastIteration = partialMap[partial.index]
          for (const clientId of clientIdsLastIteration) {
            const client = clients.find(c => c.id === clientId)
            if (!client) {
              // Client has disconnected
              clientIdsLastIteration.splice(clientIdsLastIteration.indexOf(clientId, 1))

              // If all clients disconnected, give to client with least partials
              if (!clientIdsLastIteration.length) {
                const clientIdWithMinPartials = getClientIdWithMinPartials(allocatedPartials)
                newPartialMap[partial.index].push(clientIdWithMinPartials)
                allocatedPartials[clientIdWithMinPartials].push(partial)
              }
            } else {
              // Client still connected
              newPartialMap[partial.index].push(client.id)
              allocatedPartials[client.id].push(partial)
            }
          }
        } else {
          // Partial was not distributed last iteration
          const clientIdWithMinPartials = getClientIdWithMinPartials(allocatedPartials)
          newPartialMap[partial.index].push(clientIdWithMinPartials)
          allocatedPartials[clientIdWithMinPartials].push(partial)
        }
      }

      // If clients with no partials, give them the partial that is least distributed
      const clientsWithoutPartials = clients.filter(client => !allocatedPartials[client.id].length)

      for (const client of clientsWithoutPartials) {
        const partialIdLeastDistributed = Object.keys(partialMap).sort((a, b) => partialMap[a].length - partialMap[b].length)[0]
        const partial = partials.find(p => p.index === +partialIdLeastDistributed)
        if (partial) {
          newPartialMap[partialIdLeastDistributed].push(client.id)
          allocatedPartials[client.id].push(partial)
        }
      }

      console.log('Allocation finished. Clients to distribute to: ', Object.keys(allocatedPartials))

      for (const client of wss.clients) {
        const dataToSend: { partials: PartialChunk[], ttsInstructions?: {} } = { partials: allocatedPartials[client.id] }
        client.send(JSON.stringify({ startTime: startTime + 2, chunk: dataToSend }))
      }

      partialMap = newPartialMap
    }

    chunkIndex++

    expected += interval
    setTimeout(step, Math.max(0, interval - dt))
  }

  const getClientIdWithMinPartials = (allocatedPartials: { [clientId: string]: PartialChunk[] }) => {
    return Object.keys(allocatedPartials)
      .map(k => ({ clientId: k, partials: allocatedPartials[k] }))
      .sort((a, b) => a.partials.length - b.partials.length)[0].clientId

    // Probably faster
    // return Object.keys(allocatedPartials).reduce((acc, clientId) => {
    //   if (allocatedPartials[clientId].length < allocatedPartials[acc].length) {
    //     return clientId
    //   }
    //   return acc
    // })

    // Randomize between clients with least amount
    // const minPartialCount = Math.min(...Object.values(allocatedPartials).map((partials) => partials.length))
    // const minPartialCountClientIds = Object.keys(allocatedPartials)
    //  .filter((clientId) => allocatedPartials[clientId].length === minPartialCount)
    // return minPartialCountClientIds[Math.floor(Math.random() * minPartialCountClientIds.length)]
  }

  const reset = () => {
    partialMap = {}
    chunkIndex = 0
    startKeepAliveInterval(wss)
  }
}


let keepAliveIntervalId: NodeJS.Timer
/** 
* Sends a message to all clients connnected to the websocket server every 50 seconds to keep the connection alive.
* @param {Server} wss The current ws websocket server instance.
*/
export const startKeepAliveInterval = (wss: Server) => {
  keepAliveIntervalId = setInterval(() => {
    if (wss.clients.size) {
      for (const client of wss.clients) {
        client.send('')
      }
    }
  }, 50000)
  console.log('Keep Alive Interval started.')
}
