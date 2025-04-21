const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files (for the client)
app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    socket.on('playerSelect', (data) => {
        console.log('Player selected:', data)
    });

    // Listen for score updates from a client
    socket.on('scoreUpdate', (data) => {
        console.log('Score update:', data);
        socket.broadcast.emit('scoreUpdate', data); // Send update to all except sender
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

server.listen(3000, () => console.log('Server running on http://localhost:3000'));
