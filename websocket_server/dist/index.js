"use strict";
// Code in part taken from https://www.pubnub.com/blog/nodejs-websocket-programming-examples/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// HTTP SERVER //
const express_1 = __importDefault(require("express"));
const cors = require('cors');
const router = express_1.default.Router();
const whitelist = ['http://localhost:3000', 'http://127.0.0.1:5173' /** other domains if any */];
const corsOptions = {
    origin: (origin, callback) => {
        if (whitelist.indexOf(origin) !== -1) {
            // TODO: Find out what exactly the follwing line does. Code is copy/pasted.
            // Read this https://www.npmjs.com/package/cors#configuring-cors-asynchronously
            // and this https://stackoverflow.com/questions/72287773/do-not-understand-the-function-with-express-and-cors
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    }
};
const app = (0, express_1.default)()
    .use(express_1.default.json())
    .use(cors(corsOptions))
    .use(express_1.default.urlencoded({ extended: false }));
app.listen(3000, () => console.log(`Http server listening on port ${3000}.`));
router.post('/partialData', (req, res) => {
    console.log(req.body);
    res.status(200).send();
});
app.use(router);
app.use((req, res) => res.status(404));
// WEBSOCKETS //
const { Server } = require('ws');
let partialChunks = [];
let ttsInstructions;
let mode;
const sockserver = new Server({ port: 443 });
console.log(`Websocket server listening on port ${443}.`);
sockserver.on('connection', (ws) => {
    console.log('New client connected!');
    ws.onclose = () => console.log('Client has disconnected!');
    ws.onmessage = (event) => {
        const parsed = JSON.parse(event.data);
        console.log('Received message: ', parsed.message);
        if (parsed.message === 'start') {
            if (!parsed.startTime) {
                console.error('Received start but no startTime provided.');
                return;
            }
            mode = parsed.mode;
            sendChunksToClient(parsed.startTime);
        }
        else if (parsed.message === 'dataRequest') {
            sendChunksToClient();
        }
        else if (parsed.message === 'clientId') {
            ws.id = parsed.clientId;
        }
        else {
            partialChunks = parsed.partialChunks;
            ttsInstructions = parsed.ttsInstructions;
        }
    };
});
const sendChunksToClient = (startTime) => {
    if (!partialChunks.length) {
        console.log('No more chunks!');
        sockserver.clients.forEach((client) => {
            client.send(JSON.stringify({ partialData: [] }));
        });
    }
    let chunks = [];
    let nextTtsInstructions = [];
    for (const partial of partialChunks) {
        const nextChunk = partial.shift();
        if (nextChunk) {
            chunks.push(nextChunk);
        }
    }
    for (const ttsInstruction of ttsInstructions) {
        const nextTtsInstruction = ttsInstruction.shift();
        if (nextTtsInstruction) {
            nextTtsInstructions.push(nextTtsInstruction);
        }
    }
    if (mode === 'choir') {
        sockserver.clients.forEach((client) => {
            if (client.id) {
                const chunk = chunks.find(chunk => chunk.index === client.id);
                const data = {
                    partialData: chunk ? [chunk] : []
                };
                if (startTime) {
                    data['startTime'] = startTime;
                }
                const ttsInstruction = nextTtsInstructions.find(instruction => instruction.voice === client.id);
                if (ttsInstruction) {
                    data['ttsInstruction'] = ttsInstruction;
                }
                client.send(JSON.stringify(data));
            }
        });
        console.log('Sent data to clients');
    }
    else {
        // Convert clients Set to array
        const clients = Array.from(sockserver.clients);
        const clientCount = clients.length;
        // Make sure there are always at least as many chunks as there are clients.
        while (chunks.length && clientCount > chunks.length) {
            console.log('Multiplying partials.');
            chunks = [...chunks, ...chunks];
        }
        // TODO: This can probably be refactored for better performance.
        const groupedChunks = Array.from({ length: clientCount }, () => []);
        for (let i = 0; i < chunks.length; i++) {
            groupedChunks[i % clientCount].push(chunks[i]);
        }
        for (let i = 0; i < groupedChunks.length; i++) {
            const data = {
                partialData: groupedChunks[i]
            };
            if (startTime) {
                data['startTime'] = startTime;
            }
            clients[i].send(JSON.stringify(data));
        }
        console.log('Sent data to clients');
    }
};
// setInterval(() => {
//   sockserver.clients.forEach((client) => {
//     const data = JSON.stringify({ 'type': 'time', 'time': new Date().toTimeString() })
//     client.send(data)
//   })
// }, 1000)
// setInterval(() => {
//   sockserver.clients.forEach((client) => {
//     const messages = ['Hello', 'What do you ponder?', 'Thank you for your time', 'Be Mindful', 'Thank You']
//     const random = Math.floor(Math.random() * messages.length)
//     let position = { x: Math.floor(Math.random() * 200), y: Math.floor(Math.random() * 150) }
//     const data = JSON.stringify({ 'type': 'message', 'message': messages[random], 'position': position })
//     client.send(data)
//   })
// }, 8000)
