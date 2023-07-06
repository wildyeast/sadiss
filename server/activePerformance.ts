import { Server } from 'ws'
import { PartialChunk, TrackMode, Frame } from './types/types'
import WebSocket from 'ws'
import { Types } from 'mongoose'

export class ActivePerformance {
  public loadedTrack: Frame[] = []
  public trackMode: TrackMode = 'choir'
  public trackWaveform: OscillatorType = 'sine'
  public trackTtsRate: string = '1'
  private sendingIntervalRunning = false

  constructor(readonly id: Types.ObjectId, readonly wss: Server) {}

  // More or less accurate timer taken from https://stackoverflow.com/a/29972322/16725862
  startSendingInterval = (startTime: number, loopTrack: boolean, trackId: Types.ObjectId) => {
    if (this.sendingIntervalRunning) {
      return false
    }

    console.log('Sending interval started.')

    this.sendingIntervalRunning = true

    for (const client of this.wss.clients) {
      if (client.performanceId !== this.id) continue
      client.send(JSON.stringify({ start: true }))
    }

    const interval = 1000 // ms
    let expected = Date.now() + interval
    let chunkIndex = 0

    // nonChoir mode: Stores partialIds and array of client ids that were given
    // the respective partial in the last iteration
    let partialMap: { [partialId: string]: string[] } = {}

    const step = () => {
      console.log('Performing', this.id)
      if (!this.sendingIntervalRunning) {
        console.log('Sending interval stopped.')
        reset()
        return
      }

      if (chunkIndex >= this.loadedTrack.length) {
        if (loopTrack) {
          console.log('No more chunks. Looping.')
          startTime += this.loadedTrack.length
          chunkIndex = 0
        } else {
          console.log('No more chunks. Stopping.')
          this.sendingIntervalRunning = false
          reset()
          return
        }
      }

      const dt = Date.now() - expected
      if (dt > interval) {
        console.log('Sending interval somehow broke. Stopping.')
        this.sendingIntervalRunning = false
        reset()
        return
      }

      if (this.wss.clients.size) {
        // Distribute partials among clients and send them to clients
        if (this.trackMode === 'choir') {
          handleChoirDistribution()
        } else {
          handleNonChoirDistribution()
        }
      } else {
        console.log('No clients to distribute to.')
      }

      const admins = Array.from(this.wss.clients).filter((client) => client.isAdmin && client.performanceId === this.id)
      for (const admin of admins) {
        admin.send(JSON.stringify({ chunkIndex: chunkIndex, totalChunks: this.loadedTrack.length, trackId, loop: loopTrack }))
      }

      chunkIndex++

      expected += interval
      setTimeout(step, Math.max(0, interval - dt))
    }

    // Start
    setTimeout(step, interval)

    // Time in seconds added to the startTime to make sure the clients have time to receive the message
    const TIME_TO_REVEIVE_MESSAGE = 2

    const handleChoirDistribution = () => {
      for (const client of this.wss.clients) {
        if (client.isAdmin || client.performanceId !== this.id) continue

        const dataToSend: {
          startTime: number
          waveform: string
          ttsRate: string
          chunk: { partials?: PartialChunk[]; ttsInstructions?: string }
        } = {
          startTime: startTime + TIME_TO_REVEIVE_MESSAGE,
          waveform: this.trackWaveform,
          ttsRate: this.trackTtsRate,
          chunk: {}
        }

        const partialById = this.loadedTrack[chunkIndex]?.partials.find((chunk: PartialChunk) => chunk.index === client.choirId)
        if (partialById) {
          dataToSend.chunk.partials = [partialById]
        }

        if (this.loadedTrack[chunkIndex]?.ttsInstructions) {
          const ttsInstructionForClientId = this.loadedTrack[chunkIndex]?.ttsInstructions[client.choirId]
          if (ttsInstructionForClientId) {
            dataToSend.chunk.ttsInstructions = ttsInstructionForClientId[client.ttsLang.iso]
          }
        }

        if (dataToSend.chunk.partials || dataToSend.chunk.ttsInstructions) {
          client.send(JSON.stringify(dataToSend))
        }
      }
    }

    const handleNonChoirDistribution = () => {
      const clientArr = Array.from(this.wss.clients)
      const clients = clientArr.filter((client) => !client.isAdmin && client.performanceId === this.id)
      const partials = this.loadedTrack[chunkIndex]?.partials

      const newPartialMap: { [partialIndex: string]: string[] } = {}

      const allocatedPartials: { [clientId: string]: PartialChunk[] } = {}

      for (let i = 0; i < clients.length; i++) {
        allocatedPartials[clients[i].id] = []
      }

      if (clients.length && partials) {
        for (const partial of partials) {
          newPartialMap[partial.index] = []

          if (partial.index in partialMap) {
            // Partial of same index was distributed last iteration
            // Distribute again to same client, if client still connected
            const clientIdsLastIteration = partialMap[partial.index]
            for (const clientId of clientIdsLastIteration) {
              const client = clients.find((c) => c.id === clientId)
              if (!client) {
                // Client has disconnected
                clientIdsLastIteration.splice(clientIdsLastIteration.indexOf(clientId, 1))

                // If all clients disconnected, give to client with least partials
                if (!clientIdsLastIteration.length) {
                  const clientIdWithMinPartials = getClientIdWithMinPartials(allocatedPartials, clients)
                  if (clientIdWithMinPartials) {
                    newPartialMap[partial.index].push(clientIdWithMinPartials)
                    allocatedPartials[clientIdWithMinPartials].push(partial)
                  }
                }
              } else {
                // Client still connected
                newPartialMap[partial.index].push(client.id)
                allocatedPartials[client.id].push(partial)
              }
            }
          } else {
            // Partial was not distributed last iteration
            const clientIdWithMinPartials = getClientIdWithMinPartials(allocatedPartials, clients)
            if (clientIdWithMinPartials) {
              newPartialMap[partial.index].push(clientIdWithMinPartials)
              allocatedPartials[clientIdWithMinPartials].push(partial)
            }
          }
        }

        // If clients with no partials, give them the partial that is least distributed
        const clientsWithoutPartials = clients.filter((client) => !allocatedPartials[client.id].length)

        for (const client of clientsWithoutPartials) {
          const partialIdLeastDistributed = Object.keys(newPartialMap).sort(
            (a, b) => newPartialMap[a].length - newPartialMap[b].length
          )[0]

          const partial = partials.find((p) => p.index === +partialIdLeastDistributed)
          if (partial) {
            newPartialMap[partialIdLeastDistributed].push(client.id)
            allocatedPartials[client.id].push(partial)
          }
        }

        // console.log('Allocation finished. Clients to distribute to: ', Object.keys(allocatedPartials))
        console.log('Allocation finished. Clients to distribute to: ', allocatedPartials)
      }

      for (const client of clients) {
        const dataToSend: { partials: PartialChunk[]; ttsInstructions?: string } = {
          partials: allocatedPartials[client.id]
        }
        if (this.loadedTrack[chunkIndex] && this.loadedTrack[chunkIndex].ttsInstructions) {
          const ttsInstructions = Object.values(this.loadedTrack[chunkIndex].ttsInstructions)[0]
          if (ttsInstructions) {
            dataToSend.ttsInstructions = ttsInstructions[client.ttsLang.iso]
          }
        }

        if (dataToSend.partials?.length || dataToSend.ttsInstructions) {
          const json = JSON.stringify({
            startTime: startTime + TIME_TO_REVEIVE_MESSAGE,
            waveform: this.trackWaveform,
            ttsRate: this.trackTtsRate,
            chunk: dataToSend
          })
          client.send(json)
          client.lastSentTime = Date.now()
        }
      }

      partialMap = newPartialMap
    }

    // WebSocket.Websocket: see https://github.com/websockets/ws/issues/1517#issuecomment-623148704
    const getClientIdWithMinPartials = (
      allocatedPartials: { [clientId: string]: PartialChunk[] },
      clients: WebSocket.WebSocket[]
    ) => {
      // If there is a client that is not allocated any partials, give it to them
      for (const client of clients) {
        if (!allocatedPartials[client.id].length) {
          return client.id
        }
      }

      const p = Object.keys(allocatedPartials)
        .map((k) => ({ clientId: k, partials: allocatedPartials[k] }))
        .sort((a, b) => a.partials.length - b.partials.length)
      if (!p) return
      if (!p[0]) return
      return p[0].clientId

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

      // Notify all clients of track end
      for (const client of this.wss.clients) {
        if (client.performanceId !== this.id) continue
        client.send(JSON.stringify({ stop: true }))
      }
    }

    return true
  }

  stopSendingInterval = () => (this.sendingIntervalRunning = false)
}
