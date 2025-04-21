socket = io();

function start() {
    socket.emit("start");
}
function stop() {
    socket.emit("stop");
}





function arp() {
    socket.emit("arp");
}