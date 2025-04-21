let socket;
let notes = []; // Store note positions

function setup() {
    createCanvas(windowWidth, windowHeight);
    background(240);

    // Connect to the server
    socket = io();

    button = [];
    for (let i = 0; i < 5; i++) {
        let but = createButton(i + 1);
        but.mousePressed(function() {
            player = i + 1
            socket.emit('playerSelect', i)
        });
        but.position(windowWidth / 2, (i + 0.5) * (windowHeight / 5));
        button.push();
    }

    // Listen for updates from other clients
    socket.on('scoreUpdate', (data) => {
        notes.push(data); // Add received note
    });
}


let player = -1;

function draw() {
    if (player < 0) {
        return;
    }

    background(240);

    // Draw all notes
    for (let note of notes) {
        fill(0);
        ellipse(note.x, note.y, 20, 20);
    }
}

// Keep canvas same resolution as screen
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function mousePressed() {
    let newNote = { x: mouseX, y: mouseY };
    notes.push(newNote); // Add locally

    socket.emit('scoreUpdate', newNote); // Send to others

    enableWakeLock(); // Activate wake lock
}

let wakeLock = null;

async function enableWakeLock() {
    if ('wakeLock' in navigator) {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
            console.log("Wake Lock enabled");

            // Auto-reacquire if it gets released
            wakeLock.addEventListener('release', () => {
                console.log('Wake Lock released, trying again...');
                enableWakeLock();
            });
        } catch (err) {
            console.error('Wake Lock error:', err);
        }
    }
}