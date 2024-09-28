import { StoreTrack, Track } from "../types"
import apiClient from "./axiosInstance"

export async function getTracks() {
  const response = await apiClient.get<{ tracks: Track[] }>("/api/tracks")

  return response.data.tracks
}

export async function storeTrack(trackData: StoreTrack) {
  const createTrackData = (trackDataToStore: StoreTrack) => {
    const data = new FormData()
    data.append("name", trackDataToStore.name)
    data.append("notes", trackDataToStore.notes)
    data.append("mode", trackDataToStore.isChoir ? "choir" : "nonChoir")
    data.append("waveform", trackDataToStore.waveform)
    data.append("ttsRate", trackDataToStore.ttsRate.toString())
    data.append("isPublic", trackDataToStore.isPublic.toString())

    if (trackDataToStore.partialFile) {
      const fileNameWithoutExtension = trackDataToStore.partialFile.name.slice(
        0,
        trackDataToStore.partialFile.name.lastIndexOf(".")
      )
      data.append(
        "files",
        trackDataToStore.partialFile,
        `partialfile_${fileNameWithoutExtension}`
      )
    }

    for (const voice in trackDataToStore.ttsFiles) {
      for (const lang in trackDataToStore.ttsFiles[voice]) {
        const ttsFile = trackDataToStore.ttsFiles[voice][lang]
        const fileNameWithoutExtension = ttsFile.name.slice(
          0,
          ttsFile.name.lastIndexOf(".")
        )
        data.append(
          "files",
          ttsFile,
          `ttsfile_${voice}_${lang}_${fileNameWithoutExtension}`
        )
      }
    }

    return data
  }

  const track = createTrackData(trackData)

  const response = await apiClient.post<{ track: Track }>(
    "/api/track/create",
    track
  )

  return response.data!.track
}

export async function deleteTrack(trackId: string) {
  const response = await apiClient.post<{ message: string }>(
    `/api/track/delete/${trackId}`
  )

  return response.data.message
}

export async function downloadTrack(trackId: string, trackName: string) {
  const response = await apiClient.get("/api/track/download/" + trackId, {
    responseType: "blob",
  })

  const blob = await response.data
  const downloadUrl = window.URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.href = downloadUrl
  link.download = `${trackName.replace(" ", "_")}.zip`
  document.body.appendChild(link)
  link.click()

  document.body.removeChild(link)
  window.URL.revokeObjectURL(downloadUrl)
}

export async function uploadTrackZip(trackZip: FormData) {
  const response = await apiClient.post<{ track: Track }>(
    "/api/track/upload-zip",
    trackZip
  )
  return response.data!.track
}
