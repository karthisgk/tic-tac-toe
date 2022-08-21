const { v4: uuid } = require("uuid")

var data = new Map()
const objects = ["x", "o"], [objectX, objectO] = objects;
let gameController = {
    io: null,
    render: (req, res) => {
        let roomId = req.params.roomId, pid = uuid();
        res.render('index', { title: process.env.TITLE, roomId, pid });
    },
    restartGame: (req, res) => {
        let roomId = req.params.roomId;
        if (!roomId) return res.status(400).send("")
        let game = data.get(roomId)
        if (!game) return res.status(400).send("")
        game.set("turn", req.query.winner ? req.query.winner : objects[Math.floor((Math.random() * 2))])
        gameController.io.to(roomId).emit('restart-game', {})
        res.send(game.get("turn"))
    },
    getTurn: (req, res) => {
        let roomId = req.params.roomId;
        if (!roomId) return res.status(400).send("")
        let game = data.get(roomId)
        if (!game) return res.status(400).send("")
        if (!game.get("turn")) {
            game.set("turn", objects[Math.floor((Math.random() * 2))])
        }
        res.send(game.get("turn"))
    },
    connect: io => socket => {
        socket.on("disconnect", gameController.disConnect)
        socket.on("join-room", gameController.joinRoom(io, socket))
    },
    updateTurn:  (req, res) => {
        let roomId = req.params.roomId, cellIndex = req.body.cellIndex;
        if (!roomId || !cellIndex) return res.status(400).send("")
        let game = data.get(roomId)
        if (!game || !game.get("turn")) return res.status(400).send("")
        let turn = game.get("turn") == objectX ? objectO : objectX
        game.set("turn", turn)
        gameController.io.to(roomId).emit('update-turn', {turn, cellIndex})
        res.send(turn)
    },
    joinRoom: (io, socket) => ({ roomId, playerName, pid }) => {
        const rootSocket = io.of("/"), rooms = rootSocket.adapter.rooms
        if (!roomId || !playerName || !pid) return
        if (rooms.get(roomId) && rooms.get(roomId).size == 2) {
            io.to(socket.id).emit("room-full")
            return
        }
        socket.join(roomId)
        let game = data.get(roomId)
        if (!game) game = new Map()
        if (!game.get(objectX)) {
            game.set(objectX, { id: socket.id, playerName, pid })
        }
        else {
            if (!game.get(objectO)) {
                game.set(objectO, { id: socket.id, playerName, pid })
            }
        }
        data.set(roomId, game)
        console.log(game, game.size, playerName)
        if (game.size == 2) {
            io.to(roomId).emit('start-game', {
                [objectX]: game.get(objectX),
                [objectO]: game.get(objectO)
            })
        }
    },
    disConnect: (e) => {}
}

module.exports = gameController