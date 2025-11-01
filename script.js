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
  const playerName = name;
  let score = 0;

  function addScore() { ++score; };
  function getScore() { return score; };
  function getName() { return playerName; };
  function getSymbol() { return symbol; };

  return { addScore, getScore, getName, getSymbol }
};

screenController = (function() {
  const gameboardDisplay = document.querySelector("#gameboard-display");
  const currentTurnDisplay = document.querySelector("#current-turn");

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

    currentTurnDisplay.textContent = gameController.getCurrentPlayer().getName();
  };


  function boxClickHandler(box) {
    const column = box.dataset.column;
    const row = box.dataset.row;
    if (gameboard.board[row][column] == "") gameController.playRound(row, column);
    else console.log("Box in use");
  };

  return { createBox, updateScreen, boxClickHandler};
})();

gameController = (function() {
  const players = [createPlayer("Tom", "x"), createPlayer("John", "o")];
  let currentPlayer = 0;

  function startGame() {
    gameboard.createBoard();
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
    if (type === "win") {
      console.log("win");
      getCurrentPlayer().addScore();
      // show win dialog
    } else {
      console.log("draw");
      // show draw dialog
    };
    currentPlayer = 0;
    startGame();
  };

  function getCurrentPlayer() { return players[currentPlayer]; };

  return { startGame, playRound, changePlayer, getCurrentPlayer, };
})();

gameController.startGame();
