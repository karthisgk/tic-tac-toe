const objects = ["x", "o"], [objectX, objectO] = objects,
    cellIndexes = Array.from({ length: 9 }, (_, i) => i),
    winningCellCombination = [
        cellIndexes.slice(0, 3),
        cellIndexes.slice(3, 6),
        cellIndexes.slice(6, 9),
        Array.from({ length: 3 }, (_, i) => i).map(i => i * 3),
        Array.from({ length: 3 }, (_, i) => i).map(i => i * 3 + 1),
        Array.from({ length: 3 }, (_, i) => i).map(i => i * 3 + 2),
        Array.from({ length: 3 }, (_, i) => i).map(i => i * 4),
        Array.from({ length: 4 }, (_, i) => i).map(i => i * 2).slice(1, 4)
    ],
    board = document.getElementById("board"),
    cells = document.querySelectorAll(".cell"),
    msgEle = document.getElementById("message"),
    errEle = document.getElementById("error"),
    playerEle = document.getElementById("player"),
    roomId = document.getElementById("room-id").value,
    pid = document.getElementById("pid").value;
var turn = "", playerName, socket = io();

if (!playerName) playerName = prompt("Enter your name")
if (!playerName) {
    showError("Please enter your name! or start...")
} else {
    playerEle.querySelector("h3").innerHTML = `Share the link to join opponent<br/>`
    playerEle.querySelector("h3").innerHTML += `<input id="link" value="${location.href}" /><button id="copy-btn"> Copy Link</button>`
    let copy = document.getElementById("copy-btn")
    copy.addEventListener("click", () => {
        var copyText = document.getElementById("link");
        copyText.select();
        copyText.setSelectionRange(0, 99999);
        navigator.clipboard.writeText(copyText.value);
        alert("Link copied")
    })
    socket.emit("join-room", { pid, roomId, playerName })
}

socket.on("room-full", () => {
    showError("Room engaged")
})

socket.on("start-game", (playersList) => {
    players = playersList
    startGame()
})

socket.on("restart-game", () => {
    cells.forEach(cell => {
        cell.className = "cell"
    })
    clearMessage()
    board.classList.remove(turn)
    startGame()
})

socket.on("update-turn", d => {
    if (!d.turn || !d.cellIndex) return
    let cell = document.querySelector(`.board .cell:not(.x):not(.o)[data-cell="${d.cellIndex}"]`)
    if (!cell) return
    cell.classList.add(turn)
    board.classList.remove(turn)
    turn = d.turn
    board.classList.add(turn)
    changePlayer()
    checkWinner()
})

var players = {
    [objectX]: null,
    [objectO]: null
}

async function getTurn() {
    let t = await fetch(location.pathname + "/get-turn")
    return await t.text()
}

async function updateTurn(cellIndex) {
    let t = await fetch(location.pathname, {
        method: "POST",
        body: JSON.stringify({ cellIndex }),
        headers: {
            ["Content-Type"]: "application/json"
        }
    })
    return await t.text()
}

function showError(msg) {
    errEle.classList.add("show")
    errEle.querySelector(".message-text").textContent = msg
    var reloadButton = document.getElementById("reload-button")
    reloadButton.addEventListener("click", e => {
        location.href = "/"
    }, { once: !0 })
}

function showMessage(msg) {
    msgEle.classList.add("show")
    msgEle.querySelector(".message-text").textContent = msg
}

function clearMessage() {
    msgEle.classList.remove("show")
    msgEle.querySelector(".message-text").textContent = ""
}

function showEndResult(winner) {
    showMessage(!winner ? "No one wins" : `Player ${players[winner].playerName}(${winner.toUpperCase()}) wins!`)
    var restartButton = document.getElementById("restart-button")
    restartButton.addEventListener("click", e => restartGame(winner), { once: !0 })
}

function changePlayer() {
    let cp = players[objectX].pid == pid ? `${players[objectX].playerName}(${objectX})` : `${players[objectO].playerName}(${objectO})`
    playerEle.querySelector("h3").innerHTML = `You: ${cp}<br />Player ${players[turn].playerName}(${turn.toUpperCase()}) Turns`
}

async function startGame() {
    turn = await getTurn()
    board.classList.add(turn)
    changePlayer()
    cells.forEach((cell, index) => {
        cell.setAttribute("data-cell", index)
        cell.addEventListener("click", handleCellClick)
    })
}

async function handleCellClick(e) {
    if (players[turn].pid != pid) {
        alert(`Player ${turn} turn`)
        return
    }
    await updateTurn(e.target.getAttribute("data-cell"))
    e.target.removeEventListener("click", handleCellClick)
}

function restartGame(winner) {
    fetch(location.pathname + "/restart" + (winner ? ("?winner=" + winner) : ""))
    .then(resp => {})
}

function checkWinner() {
    var data = []
    cells.forEach((cell, index) => {
        const hasX = cell.classList.contains(objectX),
            hasO = cell.classList.contains(objectO)
        if (hasX || hasO) data.push({ pos: index, foundObject: hasX ? objectX : objectO })
    })
    const objectXPositions = data.filter(inp => inp.foundObject == objectX).map(inp => inp.pos),
        objectOPositions = data.filter(inp => inp.foundObject == objectO).map(inp => inp.pos),
        hasXWin = winningCellCombination.find(w => w.filter(i => objectXPositions.includes(i)).length == w.length),
        hasOWin = winningCellCombination.find(w => w.filter(i => objectOPositions.includes(i)).length == w.length)
    if (hasXWin != undefined && hasOWin == undefined) {
        showEndResult(objectX)
    }
    else if (hasXWin == undefined && hasOWin != undefined) {
        showEndResult(objectO)
    }
    else {
        if (document.querySelectorAll(".cell:not(.x):not(.o)").length == 0) {
            showEndResult(false)
        }
    }
}