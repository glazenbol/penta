
// sequence 1 2 4 3 5

const playerSelectorElem = document.getElementById("player-selector");
const noteScreenElem = document.getElementById("note-screen");
const noteElem = document.getElementById("note");
const playerNumberElem = document.getElementById("player-number");

const debug = true;

// Connect to the server
let socket = io();

let transpose = 0;
button = [];
const selectPlayer = function(n) {
    console.log(typeof(n))
    socket.emit('playerSelect', n);
    if (n == 4 || n == 5) {
        transpose = 2;
    }

    playerSelectorElem.style.display = "none";
    if (debug) {
        playerNumberElem.innerHTML = "p: " + n + "<br>t:+" + transpose;
    }
    noteScreenElem.style.display = "flex";
}

// Listen for updates from other clients
socket.on('scoreUpdate', (data) => {
    notes.push(data); // Add received note
});

socket.on('note', (data) => {
    console.log(data);
    console.log(Tonal.Note.fromMidiSharps(data));
    note = Tonal.Note.fromMidiSharps(data + transpose);
    noteElem.innerHTML = note
});


let player = -1;