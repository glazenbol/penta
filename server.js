import { time } from 'console';
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
    });

    socket.on('arp', () => {
        console.log("going to arp!");
        arp = true;
    });

    socket.on('testing', () => {
        testing = !testing;
        interval = testing ? 100 : 5000;
        console.log("testing =", testing);
    });

    socket.on('upChance', () => {
        console.log('upchance')
        chanceMelody = 0.5;
    });

    socket.on('countdown', () => {
        console.log('countdown init');
        countdown (5);
    });
});

function reset() {
    state = 0;
    chordNumber = 0;
    arp = false;
}

let state = 0;
let n_playing = 2;
let mapping = [0, 1, 2, 3, 4];

let chanceMelody = 0.2;

function state1() {
    // TODO count down at the end
    // TODO arp part
    shuffle(mapping);
    console.log("next chord:", chordNumber + 1)
    console.log(chords[chordNumber]);
    console.log("upper start");
    const chord = chords[chordNumber];
    const impro =  Math.random() < chanceMelody;
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
        setTimeout(state4, 20_000); //TODO set impro time
    }
}

function state2() {
    console.log("chord start");
    const pulse = 1.8 + Math.random() * 2.5;
    const timeout = interval * 1.5 + Math.random() * Math.random() * 20000;
    for (let i = n_playing; i < 5; i++) {
        const note = chords[chordNumber].chord[i - n_playing];
        const player = players[mapping[i]];
        if (player) {
            console.log("emitting", note);
            player.emit("chord", Note.midi(note), pulse, timeout);
        } else {
            console.log("WARN player offline: ", mapping[i] + 1);
        }
    }
    console.log("chord duration:", timeout);
    setTimeout(state4, timeout);
}

function state4() {
    io.emit("mute");
    chordNumber++;
    chordNumber %= 5;

    if (arp) {
        setTimeout(endSolo, 5);
        setTimeout(arpF, 10, 0);
    } else {
        setTimeout(state1, interval * 2);
    }
}

function endSolo() {
    const chord = chords[chordNumber]
    const upperVar = randomInt(chord.upper.length);
    for (let i = 0; i < n_playing; i++) {
        const note1 = chord.upper[upperVar][1];
        const note2 = chord.upper[upperVar][0];
        if (players[3]) {
            players[3].emit("melody", Note.midi(note1));
        }
        if (players[4]) {
            players[4].emit("melody", Note.midi(note2));
        }
    }
}

// 1 2 4 3 5
const sequence = [0, 1, 3, 2, 4]
function arpF(i) {
    if (i > 4) {
        return;
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

server.listen(80, () => console.log('Server running on http://localhost'));
if (testing) timeoutID = setInterval(changeState, interval);
