import { Server } from 'ws'
import { PartialChunk, TrackMode, Frame } from './types/types'
import WebSocket from 'ws'

const MAX_PARTIALS_PER_CLIENT = 16

export class ActivePerformance {
  public loadedTrack: (Frame | null)[] = []
  public trackMode: TrackMode = 'choir'
  public trackWaveform: OscillatorType = 'sine'
  public trackTtsRate: string = '1'
  private sendingIntervalRunning = false

  constructor(readonly id: string) {}

  // More or less accurate timer taken from https://stackoverflow.com/a/29972322/16725862
  startSendingInterval = (startTime: number, wss: Server, loopTrack: boolean, trackId: string, startAtChunk: number) => {
    if (this.sendingIntervalRunning) {
      return false
    }

    console.log('Sending interval started.')

    this.sendingIntervalRunning = true

    for (const client of wss.clients) {
      if (client.performanceId !== this.id) continue
      client.send(JSON.stringify({ start: true }))
    }

    const interval = 1000 // ms
    let expected = Date.now() + interval
    let chunkIndex = startAtChunk

    // This makes it so that we start at the chosen chunk position immediately after starting the track
    // This works because chunks are 1s long.
    let actualStartTime = startTime - startAtChunk

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
          actualStartTime += this.loadedTrack.length
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

      if (wss.clients.size) {
        // Distribute partials among clients and send them to clients
        if (this.trackMode === 'choir') {
          handleChoirDistribution()
        } else {
          handleNonChoirDistribution()
        }
      } else {
        console.log('No clients to distribute to.')
      }

      const admins = Array.from(wss.clients).filter((client) => client.isAdmin && client.performanceId === this.id)
      for (const admin of admins) {
        admin.send(JSON.stringify({ chunkIndex: chunkIndex, totalChunks: this.loadedTrack.length, trackId, loop: loopTrack }))
      }

      chunkIndex++

      expected += interval
      setTimeout(step, Math.max(0, interval - dt))
    }

    // Start
    setTimeout(step, interval)

    const handleChoirDistribution = () => {
      for (const client of wss.clients) {
        if (client.isAdmin || client.performanceId !== this.id) continue

        const dataToSend: {
          actualStartTime: number
          waveform: string
          ttsRate: string
          chunk: { partials?: PartialChunk[]; ttsInstructions?: { time: number; phrase: string } }
        } = {
          actualStartTime: actualStartTime + 2,
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
            dataToSend.chunk.ttsInstructions = {
              time: ttsInstructionForClientId.time,
              phrase: ttsInstructionForClientId.langs[client.ttsLang.iso]
            }
          }
        }

        if (dataToSend.chunk.partials || dataToSend.chunk.ttsInstructions) {
          client.send(JSON.stringify(dataToSend))
        }
      }
    }

    const handleNonChoirDistribution = () => {
      const clientArr = Array.from(wss.clients)
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

          /**
           * Returns true if partial was distributed to a client. Returns false if all clients have reached max partials.
           */
          const distributePartialToNewClient = () => {
            const clientIdWithMinPartials = getClientIdWithMinPartials(allocatedPartials, clients)
            if (!clientIdWithMinPartials) return false
            newPartialMap[partial.index].push(clientIdWithMinPartials)
            allocatedPartials[clientIdWithMinPartials].push(partial)
            return true
          }

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
                  const partialDistributed = distributePartialToNewClient()
                  if (!partialDistributed) break
                }
              } else {
                // Client still connected
                newPartialMap[partial.index].push(client.id)
                allocatedPartials[client.id].push(partial)
              }
            }
          } else {
            // Partial was not distributed last iteration
            const partialDistributed = distributePartialToNewClient()
            if (!partialDistributed) break
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
      }

      for (const client of clients) {
        const dataToSend: { partials: PartialChunk[]; ttsInstructions?: { time: number; phrase: string } } = {
          partials: allocatedPartials[client.id]
        }

        if (this.loadedTrack[chunkIndex]?.ttsInstructions) {
          const ttsInstructions = this.loadedTrack[chunkIndex]?.ttsInstructions
          if (!ttsInstructions) continue

          const firstTtsInstruction = Object.values(ttsInstructions)[0]
          if (firstTtsInstruction) {
            dataToSend.ttsInstructions = { time: firstTtsInstruction.time, phrase: firstTtsInstruction.langs[client.ttsLang.iso] }
          }
        }

        if (dataToSend.partials?.length || dataToSend.ttsInstructions) {
          const json = JSON.stringify({
            actualStartTime: actualStartTime + 2,
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

      // Create array of objects with clientId and partials and sort by number of allocated partials
      const p = Object.keys(allocatedPartials)
        .map((k) => ({ clientId: k, partials: allocatedPartials[k] }))
        .sort((a, b) => a.partials.length - b.partials.length)
      if (!p) return
      if (!p[0]) return

      // If client with least amount of partials has reached max partials, return null
      // leading to the partial not being distributed
      if (p[0].partials.length >= MAX_PARTIALS_PER_CLIENT) {
        return null
      }

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
      for (const client of wss.clients) {
        if (client.performanceId !== this.id) continue
        client.send(JSON.stringify({ stop: true }))
      }
    }

    return true
  }

  stopSendingInterval = () => (this.sendingIntervalRunning = false)
}
