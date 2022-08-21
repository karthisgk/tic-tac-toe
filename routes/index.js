var express = require('express');
const { io, render, getTurn, updateTurn, restartGame } = require('../controllers/game.controller');
var app = express.Router();

/* GET home page. */
app.get('/', (req, res) => {
	let roomId = (Math.random() + 1).toString(36).substring(7);
	res.redirect("/room/" + roomId)
});

app.route('/room/:roomId').get(render).post(updateTurn);

app.get("/room/:roomId/get-turn", getTurn)
app.get("/room/:roomId/restart", restartGame)

module.exports = app;
