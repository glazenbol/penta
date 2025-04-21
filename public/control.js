socket = io();

function start() {
    socket.emit("start");
}