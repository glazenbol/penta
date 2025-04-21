import express from 'express';
import http from 'http';
import  { Server } from 'socket.io';
import { Note } from "tonal";

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const players = [];
let chordNumber = 0;
const chords = [
    {'chord': ['C#3', 'D#3', 'G#3'], upper: [['D5','E5']]},
    {'chord': ['C#3', 'E3', 'B3'], upper: [['G#4', 'A4']]},
    {'chord': ['C3', 'E3', 'D4'], upper: [['G4', 'B4'], ['A4', 'B4']]},
    {'chord': ['A2', 'C#3', 'G#3'], upper: [['A#4', 'D#5'], ['D#5', 'E5']]},
    {'chord': ['D#3', 'E3', 'G#3'], upper: [['F#4', 'D#5'], ['E4', 'C#5'], ['F#4', 'B4']]},
]

// Serve static files (for the client)
app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    socket.on('playerSelect', (data) => {
        console.log('Player selected:', data);
        players[data] = socket;
        playersRandomized = shuffled(players);
    });

    // Listen for score updates from a client
    socket.on('scoreUpdate', (data) => {
        console.log('Score update:', data);
        socket.broadcast.emit('scoreUpdate', data); // Send update to all except sender
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });

    socket.on('start', () => {
        console.log("Started by Penta Control!")
        setInterval(changeState, 100);  // set to 5000 TODO
    })
});

let state = 0;
let n_playing = 2;
let mapping = [0, 1, 2, 3, 4];

const changeState = function() {
    switch (state) {
        case 0:
            shuffle(mapping);
            io.emit("state", "mute");
            break;
        case 1:
            for (let i = 0; i < n_playing; i ++) {
                let note = chords[chordNumber].upper[0][i];
                // protection for when not all players have connected yet TODO make start function
                if (playersRandomized.length > i) {
                    let player = playersRandomized[i];
                    console.log("note emit");
                    io.emit("note", Note.midi(note));
                    // player.emit("note", Note.midi(note));
                }
                console.log("note:", note);
            }
            break;
        case 2:
            for (let i = n_playing; i < 5; i ++) {
                let note = chords[chordNumber].chord[i];
                // protection for when not all players have connected yet TODO make start function
                const player = players[mapping[i]];
                if (player) {
                    console.log("note emit");
                    io.emit("note", Note.midi(note));
                    // player.emit("note", Note.midi(note));
                } else {
                    console.warn("WARN player offline: ", i);
                }
                console.log("note", note);
            }
            break;
        case 3:
            break;
        case 4:
            io.emit("state", "mute");
            chordNumber ++;
            chordNumber %= 5;
            console.log("next chord:", chordNumber)
            break;
        default:
            break;
    }
    state ++;
    state %= 5;
}

function sendNote(note, state, player) {

}
// shuffles the array passed in, doesn't duplicate anything so beware!
function shuffle(shuffled) {
    for (let i = shuffled.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Swap
    }
}

server.listen(3000, () => console.log('Server running on http://localhost:3000'));
