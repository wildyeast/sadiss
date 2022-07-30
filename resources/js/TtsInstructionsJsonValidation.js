import { VirtualTimeScheduler } from "rxjs";

export const validateTtsInstructions = (file) => {
    const reader = new FileReader();
    reader.onload = function (e) {
        let fileContent = reader.result;
        validateFileContent(fileContent)
    }
    reader.readAsText(file);
}

const validateFileContent = fileContent => {
    const ttsInstructionsObject = convertJsonToObject(fileContent)
}

const convertJsonToObject = json => {
    let parsedJson
    try {
        parsedJson = JSON.parse(json)
    } catch (ex) {
        alert(`Not a valid JSON file: ${ex.message}`)
        return
    }
    return parsedJson
}
