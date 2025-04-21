import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { Note } from "tonal";

let testing = false;
let interval = testing ? 100 : 5000;

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const players = [];
const clientToPlayerMap = {};
let chordNumber = 0;
let arp = false;

let timeoutID;
const chords = [
    { chord: ['C#3', 'D#3', 'G#3'], upper: [['D5', 'E5']] },
    { chord: ['C#3', 'E3', 'B3'], upper: [['G#4', 'A4']] },
    { chord: ['C3', 'E3', 'D4'], upper: [['G4', 'B4'], ['A4', 'B4']] },
    { chord: ['A2', 'C#3', 'G#3'], upper: [['A#4', 'D#5'], ['D#5', 'E5']] },
    { chord: ['D#3', 'E3', 'G#3'], upper: [['F#4', 'D#5'], ['E4', 'C#5'], ['F#4', 'B4']] },
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
        if (!timeoutID) {
            console.log("Started by Penta Control");
            io.emit("mute");
            printOnline();
            timeoutID = setTimeout(state1, interval);
        } else {
            console.log("Penta already running");
        }
    });
    socket.on('stop', () => {
        reset();
        if (timeoutID) {
            clearTimeout(timeoutID);
            timeoutID = 0;
            console.log("Stopped by Penta Control");
        } else {
            console.log("Penta was already stopped");
        }
    })

    socket.on('arp', () => {
        console.log("going to arp!");
        arp = true;
    });

    socket.on('testing', () => {
        testing = !testing;
        interval = testing ? 100 : 5000;
        console.log("testing =", testing);
    })
});

function reset() {
    state = 0;
    chordNumber = 0;
    arp = false;
}

let state = 0;
let n_playing = 2;
let mapping = [0, 1, 2, 3, 4];



function state1() {
    // TODO count down at the end
    // TODO arp part
    shuffle(mapping);
    console.log("next chord:", chordNumber + 1)
    console.log(chords[chordNumber]);
    console.log("upper start");
    const chord = chords[chordNumber];
    const impro = Math.random > 0.8;
    if (impro) {
        console.log("impro");
    }
    
    const upperVar = randomInt(chord.upper.length);
    for (let i = 0; i < n_playing; i++) {
        const note = chord.upper[upperVar][i];
        const player = players[mapping[i]];
        if (player) {
            console.log("emitting", note);
            player.emit(impro ? "melody" : "tone", Note.midi(note));
        } else {
            console.log("WARN player offline: ", mapping[i] + 1);
        }
    }
    if (!impro) {
        setTimeout(state2, interval);
    }
    else {
        setTimeout(state4, interval * 4); //TODO set impro time
    }
}

function state2() {
    console.log("chord start");
    for (let i = n_playing; i < 5; i++) {
        const note = chords[chordNumber].chord[i - n_playing];
        const player = players[mapping[i]];
        if (player) {
            console.log("emitting", note);
            player.emit("chord", Note.midi(note), 3 + Math.random() * 3);
        } else {
            console.log("WARN player offline: ", mapping[i] + 1);
        }
    }
    setTimeout(state4, interval * 2);
}

function state4() {
    io.emit("mute");
    chordNumber++;
    chordNumber %= 5;

    if (arp) {
        setTimeout(arpF, interval, 0); //TODO maybe different time here
    } else {
        setTimeout(state1, interval * 2);
    }
}

// 1 2 4 3 5
const sequence = [0, 1, 3, 2, 4]
function arpF(i) {
    if (i > 4) {
        countdown (5);
    } else {
        console.log("starting arp player", sequence[i] + 1);
        condSendArp(players[sequence[i]]);
        // TODO maybe different time here?
        setTimeout(arpF, 7000, i + 1);
    }
}

function countdown(i) {
    if (i == 0) {
        io.emit("intro");
        return;
    }
    io.emit("countdown", i);
    setTimeout(countdown, 1000, (i-1));
}

function condSendArp(player) {
    if (player) player.emit("arp");
}

// shuffles the array passed in, doesn't duplicate anything so beware!
function shuffle(shuffled) {
    for (let i = shuffled.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Swap
    }
}

function printOnline() {
    for (let i = 0; i < 5; i++) {
        console.log("player", i + 1, "is", players[i] ? "\b" : "not", "online");
    }
}

function randomInt(n) {
    return Math.floor(Math.random() * n);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

server.listen(80, () => console.log('Server running on http://localhost'));
if (testing) timeoutID = setInterval(changeState, interval);
