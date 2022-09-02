export const validateTtsInstructions = file => {
    let validationResult
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function (e) {
            let fileContent = reader.result;
            validationResult = validateFileContent(fileContent)
            resolve(validationResult)
        }
        reader.onerror = () => {
            console.log('onerror reject.')
            reject(validationResult)
        }
        reader.readAsText(file);
    })
}

const validateFileContent = fileContent => {
    let ttsInstructionsObject
    try {
        ttsInstructionsObject = JSON.parse(fileContent)
    } catch (ex) {
        return `Not a valid JSON file: ${ex.message}`
    }

    const timestamps = Object.keys(ttsInstructionsObject)
    const partialIds = []
    const languages = []
    const spokenStrings = []

    const langKeyRegex = /^[a-z]{2}-[A-Z]{2}$/
    // const spokenStringRegex = /^[\dA-Za-z\u00F0-\u02AF !?.,:]+$/
    const spokenStringRegex = /^.+$/

    let isChoir

    const objectDepth = getObjectDepth(ttsInstructionsObject)

    if (objectDepth === 2) {
        isChoir = false
        for (const timestamp of timestamps) {
            if (timestamp === '_config') continue
            if (timestamp != Number(timestamp)) {
                return `"${timestamp}" is not a valid timestamp.`
            }

            const langs = Object.keys(ttsInstructionsObject[timestamp])
            languages.push(...langs)
            for (const lang of langs) {
                if (!lang.match(langKeyRegex)) return `Language "${lang}" is invalid.`

                const spokenString = ttsInstructionsObject[timestamp][lang]

                if (!spokenString.match(spokenStringRegex)) return `String "${spokenString}" is invalid.`

                spokenStrings.push(ttsInstructionsObject[timestamp][lang])
            }
        }
    } else if (objectDepth === 3) {
        isChoir = true
        for (const timestamp of timestamps) {
            if (timestamp === '_config') continue
            const ids = Object.keys(ttsInstructionsObject[timestamp])
            partialIds.push(...ids)
            for (const partialId of ids) {
                if (!partialId.match(/^\d+$/)) return `Partial ID "${partialId}" is invalid.`

                const langs = Object.keys(ttsInstructionsObject[timestamp][partialId])
                languages.push(...langs)
                for (const lang of langs) {
                    if (!lang.match(langKeyRegex)) return `Language "${lang}" is invalid.`

                    const spokenString = ttsInstructionsObject[timestamp][partialId][lang]

                    if (!spokenString.match(spokenStringRegex)) return `String "${spokenString}" is invalid.`

                    spokenStrings.push(ttsInstructionsObject[timestamp][partialId][lang])
                }
            }
        }
    }

    const languageCount = countLanguages(languages)

    if (new Set(Object.values(languageCount)).size !== 1) {
        const langCountString = Object.keys(languageCount).map(key => `${key}: ${languageCount[key]}`).join(', ')
        return `Languages aren't set equally often: ${langCountString}`
    }

    return {
        isChoir,
        detectedLanguages: Object.keys(languageCount)
    }

}

// From https://stackoverflow.com/a/66065316/16725862
const getObjectDepth = (o) =>
    Object(o) === o ? 1 + Math.max(-1, ...Object.values(o).map(getObjectDepth)) : 0

const countLanguages = array => {
    const counts = {}
    for (const el of array) {
        if (counts[el]) {
            counts[el] += 1
        } else {
            counts[el] = 1
        }
    }

    return counts
}
