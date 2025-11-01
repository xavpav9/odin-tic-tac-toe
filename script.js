const gameboard = (function(size) {
  const board = [];
  const boardDOM = [];
  const boardSize = size;

  function createBoard() {
    while (board.length !== 0) {
      board.pop();
    };

    while (boardDOM.length !== 0) {
      boardDOM.pop();
    };

    document.querySelector(".gameboard-display").style.gridTemplateRows = `repeat(${boardSize}, var(--box-size))`;
    document.querySelector(".gameboard-display").style.gridTemplateColumns = `repeat(${boardSize}, var(--box-size))`;

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
  }

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
        if (row + column === 2 && board[row][column] === symbol) { ++diag2; };
      };
    };

    if (diag1 === boardSize) {
      wins.push({ direction: "diagonal", number: 1, });
    } else if (diag2 === boardSize) {
      wins.push({ direction: "diagonal", number: 2, });
    };

    return wins;
  };

  function playMove(row, column, symbol) {
    board[row][column] = symbol;
    boardDOM[row][column].textContent = symbol;
  };

  function isFull() {
    columns: for (let column = 0; column < boardSize; ++column) {
      for (let row = 0; row < boardSize; ++row) {
        if (board[row][column] === "") return false;
      };
    };
    return true;
  };

  return { board, boardDOM, checkWin, playMove, isFull, createBoard };
})(3);

createPlayer = function(name, symbol) {
  let playerName = name;
  let score = 0;

  function addScore() { ++score; };
  function getScore() { return score; };
  function setName(newName = playerName) { playerName = newName; };
  function getName() { return playerName; };
  function getSymbol() { return symbol; };

  return { addScore, getScore, getName, setName, getSymbol, }
};

screenController = (function() {
  const gameboardDisplay = document.querySelector(".gameboard-display:not(.copy)");
  const changeNameDialog = document.querySelector("#change-name");

  function createBox(row, column) {
    const box = document.createElement("button");
    box.classList.add("box");
    box.dataset.column = column;
    box.dataset.row = row;
    box.addEventListener("click", evt => boxClickHandler(evt.target));
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
    document.querySelector("#current-turn").textContent = `${gameController.getCurrentPlayer().getName()} ${gameController.getCurrentPlayer().getSymbol()}`;
    document.querySelector(".p1.score").textContent = gameController.getPlayer(0).getScore();
    document.querySelector(".p2.score").textContent = gameController.getPlayer(1).getScore();
    document.querySelector(".p1.name").textContent = gameController.getPlayer(0).getName();
    document.querySelector(".p2.name").textContent = gameController.getPlayer(1).getName();
  };


  function boxClickHandler(box) {
    const column = box.dataset.column;
    const row = box.dataset.row;
    if (gameboard.board[row][column] == "") gameController.playRound(row, column);
    else console.log("Box in use");
  };

  document.querySelector(".play-again").addEventListener("click", evt => {
    document.querySelector("#end-screen").close();
    gameController.startGame();
  });

  changeNameDialog.querySelector(".submit").addEventListener("click", evt => {
    evt.preventDefault();
    const newName = document.querySelector("#new-name").value;
    const player = gameController.getPlayer(+changeNameDialog.dataset.playerIndex);
    if (newName.length > 0 && newName !== gameController.getPlayer((+changeNameDialog.dataset.playerIndex + 1) % 2).getName()) {
      player.setName(newName);
      changeNameDialog.close();
      screenController.updateScreen();
    };
  });

  changeNameDialog.querySelector(".cancel").addEventListener("click", evt => {
    evt.preventDefault();
    changeNameDialog.close();
    
  });

  document.querySelectorAll(".edit-name-btn").forEach(btn => {
    btn.addEventListener("click", evt => {
      const playerIndex = [...evt.target.classList].includes("p1") ? 0 : 1;
      const player = gameController.getPlayer(playerIndex);
      document.querySelector("#new-name").value = player.getName();
      changeNameDialog.dataset.playerIndex = playerIndex;
      changeNameDialog.showModal();
      document.querySelector("#new-name").select();
      updateScreen();
    });
  });

  document.querySelector(".start-restart").addEventListener("click", evt => {
    gameboardDisplay.style.display = "grid";
    evt.target.textContent = "restart";
    gameController.startGame();
  });
  return { createBox, updateScreen, boxClickHandler, gameboardDisplay, };
})();

gameController = (function() {
  const players = [createPlayer("Player 1", "x"), createPlayer("Player 2", "o")];
  let currentPlayer;

  function startGame() {
    gameboard.createBoard();
    currentPlayer = Math.floor(Math.random() * 2);
    screenController.updateScreen();
  };

  function playRound(row, column) {
    gameboard.playMove(row, column, getCurrentPlayer().getSymbol());
    screenController.updateScreen();
    const wins = gameboard.checkWin(getCurrentPlayer().getSymbol());
    if (wins.length === 0) {
      if (gameboard.isFull()) {
        endGame("draw");
      } else {
        changePlayer();
      };
    } else {
      endGame("win");
    };
    screenController.updateScreen();
  };

  function changePlayer() { currentPlayer = (currentPlayer + 1) % 2; };

  function endGame(type) { // win or draw
    const endScreen = document.querySelector("#end-screen");
    if (type === "win") {
      const winner = getCurrentPlayer();
      endScreen.querySelector("h1").textContent = `${winner.getName()} has won!`;
      winner.addScore();
      
    } else {
      endScreen.querySelector("h1").textContent = `${players[0].getName()} and ${players[1].getName()} have drawn.`;
    };

    const boardCopy = screenController.gameboardDisplay.cloneNode(true);
    boardCopy.classList.add("copy");

    endScreen.querySelector("div").textContent = "";
    endScreen.querySelector("div").appendChild(boardCopy);

    endScreen.showModal();
  };

  function getCurrentPlayer() { return players[currentPlayer]; };

  function getPlayer(index) {
    const newIndex = parseInt(index);
    if (newIndex < players.length && newIndex >= 0) {
      return players[newIndex];
    } else {
      return false;
    }
  };

  return { startGame, playRound, changePlayer, getCurrentPlayer, getPlayer, };
})();

gameController.startGame();
