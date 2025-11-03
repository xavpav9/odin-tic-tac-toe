const gameboard = (function(size) {
  const board = [];
  const boardDOM = [];
  let boardSize = size;

  function createBoard() {
    while (board.length !== 0) {
      board.pop();
    };

    while (boardDOM.length !== 0) {
      boardDOM.pop();
    };

    document.querySelector(".gameboard-display:not(.copy)").textContent = "";
    document.querySelector(".gameboard-display:not(.copy)").style.setProperty("--board-size", boardSize);
    document.querySelector(".gameboard-display:not(.copy)").style.gridTemplateRows = `repeat(${boardSize}, var(--box-size))`;
    document.querySelector(".gameboard-display:not(.copy)").style.gridTemplateColumns = `repeat(${boardSize}, var(--box-size))`;

    for (let row = 0; row < boardSize; ++row) {
      board.push([]);
      for (let column = 0; column < boardSize; ++column) {
        board[row].push("");
      };
    };

    for (let row = 0; row < boardSize; ++row) {
      boardDOM.push([]);
      for (let column = 0; column < boardSize; ++column) {
        boardDOM[row].push(screenController.createBox(row, column));
      };
    };
  };

  function setBoardSize(newBoardSize = boardSize) {
    document.querySelectorAll(".board-size-selector button").forEach(btn => btn.classList.remove("selected"));
    document.querySelector(`.board-size-selector button.size-${newBoardSize}`).classList.add("selected");

    boardSize = +newBoardSize;
    createBoard();
    screenController.updateScreen();
  };

  function getBoardSize() { return boardSize; };

  function checkWin(symbol) {
    const wins = [];
    columns: for (let column = 0; column < boardSize; ++column) {
      for (let row = 0; row < boardSize; ++row) {
        if (board[row][column] !== symbol) { continue columns; };
      };
      wins.push({ direction: "column", number: column, });
    };

    rows: for (let row = 0; row < boardSize; ++row) {
      for (let box of board[row]) {
        if (box !== symbol) { continue rows; };
      };
      wins.push({ direction: "row", number: row, });
    };

    let diag1 = 0, diag2 = 0; // 1 = topLeftToBottomRight, 2 = topRightToBottomLeft

    for (let column = 0; column < boardSize; ++column) {
      for (let row = 0; row < boardSize; ++row) {
        if (row === column && board[row][column] === symbol) { ++diag1; };
        if (row + column === boardSize - 1 && board[row][column] === symbol) { ++diag2; };
      };
    };

    if (diag1 === boardSize) {
      wins.push({ direction: "diagonal", number: 0, });
    }; 
    if (diag2 === boardSize) {
      wins.push({ direction: "diagonal", number: 1, });
    };

    return wins;
  };

  function playMove(row, column, player) {
    const symbol = player.getSymbol();
    let symbolClass;
    switch (symbol) {
      case "+":
        symbolClass = "plus";
        break;
      case "=":
        symbolClass = "equal";
        break;
      default:
        symbolClass = symbol;
    };
    const colour = player.getColour();

    board[row][column] = symbol;
    const img = document.querySelector(`.resources .${symbolClass}`).cloneNode(true);
    img.classList.add("loaded");
    img.style.stroke = colour;

    boardDOM[row][column].textContent = "";
    boardDOM[row][column].appendChild(img);
    boardDOM[row][column].style.color = colour;

    img.addEventListener("error", evt => {
      img.classList.remove("loaded");
      img.parentNode.textContent = img.dataset.symbol;
    });
  };

  function isFull() {
    columns: for (let column = 0; column < boardSize; ++column) {
      for (let row = 0; row < boardSize; ++row) {
        if (board[row][column] === "") return false;
      };
    };
    return true;
  };

  return { board, boardDOM, checkWin, playMove, isFull, createBoard, setBoardSize, getBoardSize, };
})(3);

createPlayer = function(name, symbol, colour) {
  let playerName = name;
  let score = 0;

  function addScore() { ++score; };
  function getScore() { return score; };
  function setName(newName = playerName) { playerName = newName; };
  function getName() { return playerName; };
  function setColour(newColour = colour) { colour = newColour; };
  function getColour() { return colour; };
  function setSymbol(newSymbol = symbol) { symbol = newSymbol; };
  function getSymbol() { return symbol; };

  return { addScore, getScore, setName, getName, setSymbol, getSymbol, setColour, getColour }
};

screenController = (function() {
  const gameboardDisplay = document.querySelector(".gameboard-display:not(.copy)");
  const editPlayerDialog = document.querySelector("#change-player");

  function createBox(row, column) {
    const box = document.createElement("button");
    box.classList.add("box");
    box.dataset.column = column;
    box.dataset.row = row;
    box.addEventListener("click", evt => boxClickHandler(box));
    return box;
  };

  function updateScreen() {
    gameboardDisplay.textContent = "";
    const boxes = gameboard.boardDOM;

    for (let row of boxes) {
      for (let box of row) {
        gameboardDisplay.appendChild(box);
      };
    };
    updatePlayerInfo();
  };

  function updatePlayerInfo() {
    if (document.querySelector(".start-restart.restart") != null) document.querySelector(".panel .content").dataset.currentTurn = gameController.getCurrentPlayer("index") + 1;
    document.querySelector(".p1.score").textContent = gameController.getPlayer(0).getScore();
    document.querySelector(".p2.score").textContent = gameController.getPlayer(1).getScore();
    document.querySelector(".p1.name").textContent = gameController.getPlayer(0).getName();
    document.querySelector(".p2.name").textContent = gameController.getPlayer(1).getName();

    for (let playerIndex = 0; playerIndex < 2; ++playerIndex) {
      const player = gameController.getPlayer(playerIndex);
      const element = document.querySelector(`.p${playerIndex + 1}.symbol`);
      const symbol = player.getSymbol();
      let symbolClass;
      switch (symbol) {
        case "+":
          symbolClass = "plus";
          break;
        case "=":
          symbolClass = "equal";
          break;
        default:
          symbolClass = symbol;
      };
      const colour = player.getColour();

      const img = document.querySelector(`.resources .${symbolClass}`).cloneNode(true);
      img.classList.add("loaded");
      img.style.stroke = colour;

      element.textContent = "";
      element.appendChild(img);
      element.style.color = colour;

      img.addEventListener("error", evt => {
        img.classList.remove("loaded");
        img.parentNode.textContent = img.dataset.symbol;
      });
    };
  };

  function enableEdit(enable) {
    document.querySelectorAll(".edit-player-btn").forEach(btn => btn.disabled = !enable);
    document.querySelectorAll(".board-size-selector button").forEach(btn => btn.disabled = !enable);
  };

  function boxClickHandler(box) {
    const column = box.dataset.column;
    const row = box.dataset.row;
    if (gameboard.board[row][column] == "") {
      gameController.playRound(row, column);
      enableEdit(false);
    } else console.log("Box in use");
  };

  document.querySelector(".play-again").addEventListener("click", evt => {
    document.querySelector("#end-screen").close();
    gameController.startGame();
  });

  editPlayerDialog.querySelector(".save").addEventListener("click", evt => {
    evt.preventDefault();
    const newName = document.querySelector("#new-name").value.trim();
    const newColour = document.querySelector("#new-colour").value;
    const newSymbol = document.querySelector("#new-symbol").value;
    const errorsDisplay = editPlayerDialog.querySelector(".errors");
    const player = gameController.getPlayer(+editPlayerDialog.dataset.playerIndex);

    if (newName.length > 0 && newName !== gameController.getPlayer((+editPlayerDialog.dataset.playerIndex + 1) % 2).getName()) {
      if (newSymbol !== gameController.getPlayer((+editPlayerDialog.dataset.playerIndex + 1) % 2).getSymbol()) {
        player.setName(newName);
        player.setColour(newColour);
        player.setSymbol(newSymbol);

        editPlayerDialog.close();
        screenController.updateScreen();
      } else {
        errorsDisplay.textContent = "Invalid symbol";
        setTimeout(() => errorsDisplay.textContent = "", 1000);
      }
    } else {
      errorsDisplay.textContent = "Invalid name";
      setTimeout(() => errorsDisplay.textContent = "", 1000);
    }
  });

  editPlayerDialog.querySelector(".cancel").addEventListener("click", evt => {
    evt.preventDefault();
    editPlayerDialog.close();
    
  });

  document.querySelectorAll(".edit-player-btn").forEach(btn => {
    btn.addEventListener("click", evt => {
      const playerIndex = [...evt.target.classList].includes("p1") ? 0 : 1;
      const player = gameController.getPlayer(playerIndex);
      document.querySelector("#new-name").value = player.getName();
      document.querySelector("#new-colour").value = player.getColour();
      document.querySelector("#new-symbol").value = player.getSymbol();
      editPlayerDialog.dataset.playerIndex = playerIndex;
      editPlayerDialog.showModal();
      document.querySelector("#new-name").select();
      updateScreen();
    });
  });

  document.querySelector(".start-restart").addEventListener("click", evt => {
    if (evt.target.textContent === "start") {
      gameboardDisplay.style.display = "grid";
      evt.target.textContent = "restart";
      evt.target.classList.add("restart");
      evt.target.classList.add("default-red-btn");
      evt.target.classList.remove("default-green-btn");
      gameController.startGame();
    } else {
      gameboardDisplay.style.display = "none";
      evt.target.textContent = "start";
      evt.target.classList.remove("restart");
      evt.target.classList.remove("default-red-btn");
      evt.target.classList.add("default-green-btn");
      document.querySelector(".panel .content").dataset.currentTurn = 0;
    };

    enableEdit(true);
  });

  document.querySelectorAll(".board-size-selector button").forEach(btn => {
    btn.addEventListener("click", evt => {
      const newBoardSize = btn.dataset.size;
      gameboard.setBoardSize(newBoardSize);
    });
  });

  return { createBox, updateScreen, boxClickHandler, gameboardDisplay, enableEdit };
})();

gameController = (function() {
  const players = [createPlayer("Player 1", "x", "#ff0000"), createPlayer("Player 2", "o", "#0000ff")];
  let currentPlayer;
  let oldCurrentPlayer = 0;

  function startGame() {
    gameboard.createBoard();
    currentPlayer = (oldCurrentPlayer + 1) % 2;
    oldCurrentPlayer = currentPlayer;
    screenController.updateScreen();
    screenController.enableEdit(true);
  };

  function playRound(row, column) {
    gameboard.playMove(row, column, getCurrentPlayer());
    screenController.updateScreen();
    const wins = gameboard.checkWin(getCurrentPlayer().getSymbol());
    console.log(wins);
    if (wins.length === 0) {
      if (gameboard.isFull()) {
        endGame("draw");
      } else {
        changePlayer();
      };
    } else {
      endGame("win", wins);
    };
    screenController.updateScreen();
  };

  function changePlayer() { currentPlayer = (currentPlayer + 1) % 2; };

  function endGame(type, wins = {}) { // win or draw
    const endScreenContent = document.querySelector("#end-screen > div");
    const boardCopy = screenController.gameboardDisplay.cloneNode(true);

    if (type === "win") {
      const winner = getCurrentPlayer();
      endScreenContent.querySelector("h1").textContent = `${winner.getName()} has won!`;
      winner.addScore();

      const boxes = [...boardCopy.children];
      for (let win of wins) {
        switch (win.direction) {
          case "column":
            for (let i = 0; i < gameboard.getBoardSize(); ++i) {
              boxes[i * gameboard.getBoardSize() + win.number].classList.add("winning");
            };
            break;
          case "row":
            for (let i = 0; i < gameboard.getBoardSize(); ++i) {
              boxes[gameboard.getBoardSize() * win.number + i].classList.add("winning");
            };
            break;
          case "diagonal":
            if (win.number === 0) {
              for (let i = 0; i < gameboard.getBoardSize(); ++i) {
                boxes[i * gameboard.getBoardSize() + i].classList.add("winning");
              };
            } else {
              for (let i = 0; i < gameboard.getBoardSize(); ++i) {
                boxes[gameboard.getBoardSize() * (i + 1) - 1 - i].classList.add("winning");
              };
            }
            break;
        };
      };
      
    } else {
      endScreenContent.querySelector("h1").textContent = `${players[0].getName()} and ${players[1].getName()} have drawn.`;
    };

    boardCopy.classList.add("copy");

    endScreenContent.querySelector("div").textContent = "";
    endScreenContent.querySelector("div").appendChild(boardCopy);

    document.querySelector("#end-screen").showModal();
  };

  function getCurrentPlayer(type="object") { 
    if (type === "object") {
      return players[currentPlayer]; 
    } else if (type === "index") {
      return currentPlayer;
    };
  };

  function getPlayer(index) {
    const newIndex = parseInt(index);
    if (newIndex < players.length && newIndex >= 0) {
      return players[newIndex];
    } else {
      return false;
    }
  };

  return { startGame, playRound, changePlayer, getCurrentPlayer, getPlayer };
})();

gameController.startGame();
