
// sequence 1 2 4 3 5

const playerSelectorElem = document.getElementById("player-selector");
const noteScreenElem = document.getElementById("note-screen");
const noteElem = document.getElementById("note");
const playStyleElem = document.getElementById("play-style")
const playerNumberElem = document.getElementById("player-number");

const debug = false;

// Connect to the server
let socket = io();

let transpose = 0;
let started = false;
button = [];

function selectPlayer(n) {
    socket.emit('playerSelect', n);
    if (n == 4 || n == 5) {
        transpose = 2;
    }

    playerSelectorElem.style.display = "none";
    playerNumberElem.innerHTML = "p: " + n + "<br>t:+" + transpose;
    playerNumberElem.style.color = "whitesmoke";
    if (!debug) {
        playerNumberElem.style.opacity = "0%";
    }
    // show the elem
    noteScreenElem.style.display = "flex";
    // start showing the info bar on touch
    document.addEventListener("click", () => {
        playerNumberElem.style.animation = "none";
        void playerNumberElem.offsetWidth;
        playerNumberElem.style.animation = "debug-info 3s";
    });
}

socket.on('intro', () => {
    noteElem.innerHTML = "";
    playStyleElem.innerHTML = "⬠";
    playStyleElem.style.color = "whitesmoke";
    noteScreenElem.style.transitionTimingFunction = "linear";
    noteScreenElem.style.transition = "background-color 1s";
    noteScreenElem.style.backgroundColor = "black";
});

socket.on('countdown', (n) => {
    noteElem.innerHTML = n;
    playStyleElem.innerHTML = "";
    noteScreenElem.style.transitionTimingFunction = "linear";
    noteScreenElem.style.transition = "background-color 2s";
    noteScreenElem.style.backgroundColor = "whitesmoke";
});

socket.on('arp', () => {
    noteElem.innerHTML = "";
    playStyleElem.innerHTML = ".-‘";
    noteScreenElem.style.transitionTimingFunction = "linear";
    noteScreenElem.style.transition = "background-color 2s";
    noteScreenElem.style.backgroundColor = "whitesmoke";
});

socket.on('melody', (newNote) => {
    note = Tonal.Note.fromMidiSharps(newNote + transpose);
    noteElem.innerHTML = note;
    playStyleElem.innerHTML = "~~~~~";
    noteScreenElem.style.transitionTimingFunction = "linear";
    noteScreenElem.style.transition = "background-color 2s";
    noteScreenElem.style.backgroundColor = "whitesmoke";
});

socket.on('tone', (newNote) => {
    note = Tonal.Note.fromMidiSharps(newNote + transpose);
    noteElem.innerHTML = note;
    playStyleElem.innerHTML = "-----";
    noteScreenElem.style.transitionTimingFunction = "linear";
    noteScreenElem.style.transition = "background-color 1s";
    noteScreenElem.style.backgroundColor = "whitesmoke";
});


socket.on('chord', (newNote, frequency, timeout) => {
    note = Tonal.Note.fromMidiSharps(newNote + transpose);
    noteElem.innerHTML = note;
    // start swell
    noteScreenElem.style.animation = "none";
    void noteScreenElem.offsetWidth;
    noteScreenElem.style.animation = "swell " + timeout / 1000 + "s";
    //start blinker
    noteElem.style.animation = "none";
    playStyleElem.style.animation = "none";
    void noteElem.offsetWidth;
    void playStyleElem.offsetWidth;
    const blinkDuration = 1.0 / frequency;
    noteElem.style.animation = "blinker " + blinkDuration + "s infinite";
    playStyleElem.style.animation = "blinker " + blinkDuration + "s infinite";

    playStyleElem.innerHTML = "|||||";
});

socket.on('mute', () => {
    noteElem.style.animation = "none";
    playStyleElem.style.animation = "none";
    noteScreenElem.style.backgroundColor = "black";
    noteElem.style.color = "black";
    playStyleElem.style.color = "black";
});

let player = -1;