
let socket;
let notes = []; // Store note positions

const noteElem = document.getElementById("note");

noteElem.innerHTML = "Testerino"
createCanvas(windowWidth, windowHeight-100);
background(240);

// Connect to the server
socket = io();

button = [];
for (let i = 0; i < 5; i++) {
    let but = createButton(i + 1);
    but.mousePressed(function() {
        socket.emit('playerSelect', i)
    });
    but.position(windowWidth / 2, (i + 0.5) * (windowHeight / 5));
    button.push();
}

// Listen for updates from other clients
socket.on('scoreUpdate', (data) => {
    notes.push(data); // Add received note
});

socket.on('note', (data) => {
    console.log(data);
    console.log(Tonal.Note.fromMidiSharps(data));
    noteElem.innerHTML = data
});


let player = -1;