const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const { Chess } = require('chess.js');
const path = require('path');

const app = express();
const server = http.createServer(app);

const io = socketio(server);
const chess = new Chess();

const players = {};
let currentPlayer = 'white';

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('index', { title: 'Chess Game | GAMEPLAYERS' });
});

io.on('connection', (uniqueSocket) => {
    console.log('A user connected');

    if (!players.white) {
        players.white = uniqueSocket.id;
        uniqueSocket.emit("playerRole", "w");
    } else if (!players.black) {
        players.black = uniqueSocket.id;
        uniqueSocket.emit("playerRole", "b");
    } else {
        uniqueSocket.emit("spectator");
    }

    uniqueSocket.on("disconnect", () => {
        if (uniqueSocket.id === players.white) {
            delete players.white;
        } else if (uniqueSocket.id === players.black) {
            delete players.black;
        }
    });

    uniqueSocket.on("move", (move) => {
        try {
            if (chess.turn() === "w" && uniqueSocket.id !== players.white);
            if (chess.turn() === "b" && uniqueSocket.id !== players.black);

            const result = chess.move(move);
            if (result) {
               currentPlayer = chess.turn();
               io.emit("move", move);
               io.emit("boardState", chess.fen());
            } else {
                console.log("Invalid move: ", move);
                uniqueSocket.emit("invalidMove", move);
            }
        }
        catch (err) {
            console.log(err);
            uniqueSocket.emit("Invalid Move: ", move);
        }
    });
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
