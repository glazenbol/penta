import express from 'express';
import http from 'http';
import  { Server } from 'socket.io';
import { Note } from "tonal";

const testing = false;
const interval = testing ? 100 : 5000;

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const players = [];
const clientToPlayerMap = {};
let chordNumber = 0;
let intervalID;
const chords = [
    {chord: ['C#3', 'D#3', 'G#3'], upper: [['D5','E5']]},
    {chord: ['C#3', 'E3', 'B3'], upper: [['G#4', 'A4']]},
    {chord: ['C3', 'E3', 'D4'], upper: [['G4', 'B4'], ['A4', 'B4']]},
    {chord: ['A2', 'C#3', 'G#3'], upper: [['A#4', 'D#5'], ['D#5', 'E5']]},
    {chord: ['D#3', 'E3', 'G#3'], upper: [['F#4', 'D#5'], ['E4', 'C#5'], ['F#4', 'B4']]},
]

// Serve static files (for the client)
app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('playerSelect', (data) => {
        console.log('Player selected:', data);
        if (players[data - 1]) {
            console.log("WARN player selected player that was already selected");
        }
        players[data - 1] = socket;
        clientToPlayerMap[socket.id] = data - 1;
    });

    // Listen for score updates from a client
    socket.on('scoreUpdate', (data) => {
        console.log('Score update:', data);
        socket.broadcast.emit('scoreUpdate', data); // Send update to all except sender
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        players[clientToPlayerMap[socket.id]] = null;
    });

    socket.on('start', () => {
        if (!intervalID) {
            console.log("Started by Penta Control");
            printOnline();
            intervalID = setInterval(changeState, interval);  // set to 5000 TODO
        } else {
            console.log("Penta already running");
        }
    });
    socket.on('stop', () => {
        if (intervalID) {
            clearInterval(intervalID);
            intervalID = 0;
            console.log("Stopped by Penta Control");
        } else {
            console.log("Penta was already stopped");
        }
    })

    socket.on('arp', () => {
        console.log("going to arp!");
    });
});

let state = 0;
let n_playing = 2;
let mapping = [0, 1, 2, 3, 4];

function changeState() {
    switch (state) {
        case 0:
            shuffle(mapping);
            console.log("next chord:", chordNumber)
            console.log (chords[chordNumber]);
            io.emit("mute");
            break;
        case 1:
            console.log("upper start");
            for (let i = 0; i < n_playing; i ++) {
                let note = chords[chordNumber].upper[0][i];
                const player = players[mapping[i]];
                sendNote(note, "-----", player, mapping[i]);
            }
            break;
        case 2:
            console.log("chord start");
            for (let i = n_playing; i < 5; i ++) {
                let note = chords[chordNumber].chord[i - n_playing];
                const player = players[mapping[i]];
                sendNote(note, "|||||", player, mapping[i]);
            }
            break;
        case 3:
            break;
        case 4:
            io.emit("mute");
            chordNumber ++;
            chordNumber %= 5;
            break;
        default:
            break;
    }
    state ++;
    state %= 5;
}

function sendNote(note, playStyle, player, i) {
    if (player) {
        console.log("emitting",note);
        player.emit("note", Note.midi(note), playStyle);
    } else {
        console.warn("WARN player offline: ", i + 1);
    }
}
// shuffles the array passed in, doesn't duplicate anything so beware!
function shuffle(shuffled) {
    for (let i = shuffled.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Swap
    }
}

function printOnline() {
    for (let i = 0; i < 5; i ++) {
        console.log("player", i + 1, "is", players[i] ? "\b" : "not", "online");
    }
}

server.listen(3000, () => console.log('Server running on http://localhost:3000'));
if (testing) intervalID = setInterval(changeState, interval);
