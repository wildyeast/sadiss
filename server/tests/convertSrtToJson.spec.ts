import { convertSrtToJson } from '../tools/convertSrtToJson'
import fs from 'fs'

describe('convertSrtToJson test', () => {
  it('correctly converts .srt file to JSON', () => {
    const srtFiles = [{ path: './tests/testFiles/testSrtFile.srt', originalname: 'voice_0_en-US' }]

    const { ttsLangs, ttsJson } = convertSrtToJson(srtFiles)

    expect(ttsLangs).toEqual(new Set(['en-US']))
    expect(ttsJson).toEqual({
      0: {
        0: {
          'en-US': 'This is the first line.'
        }
      },
      3: {
        0: {
          'en-US': 'This is the second line.'
        }
      },
      5: {
        0: {
          'en-US': 'This is the third line.'
        }
      }
    })
  })
})
