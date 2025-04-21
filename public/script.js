
// sequence 1 2 4 3 5

const playerSelectorElem = document.getElementById("player-selector");
const noteScreenElem = document.getElementById("note-screen");
const noteElem = document.getElementById("note");
const playStyleElem = document.getElementById("play-style")
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

socket.on('note', (newNote, playStyle) => {
    note = Tonal.Note.fromMidiSharps(newNote + transpose);
    noteElem.innerHTML = note;
    playStyleElem.innerHTML = playStyle;
});

socket.on('mute', () => {
    
})


let player = -1;