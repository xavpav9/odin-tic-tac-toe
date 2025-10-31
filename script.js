const gameboard = (function(size) {
  const board = [];
  const boardSize = size;
  for (let row = 0; row < boardSize; ++row) {
    board.push([]);
    for (let column = 0; column < boardSize; ++column) {
      board[row].push("");
    };
  };

  function checkWin(symbol) {
    const wins = [];
    columns: for (let column = 0; column < 3; ++column) {
      for (let row = 0; row < 3; ++row) {
        if (board[row][column] !== symbol) { continue columns; };
      };
      wins.push({ direction: "column", number: column, });
    };

    rows: for (let row = 0; row < 3; ++row) {
      for (let box of board[row]) {
        if (box !== symbol) { break rows; };
      };
      wins.push({ direction: "row", number: row, });
    };

    let diag1 = 0, diag2 = 0; // 1 = topLeftToBottomRight, 2 = topRightToBottomLeft

    for (let column = 0; column < 3; ++column) {
      for (let row = 0; row < 3; ++row) {
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

  function resetBoard() {
    for (let row = 0; row < boardSize; ++row) {
      for (let column = 0; column < boardSize; ++column) {
        board[row][column] = "";
      };
    };
  };

  function playMove(row, column, symbol) {
    if (board[row][column] !== "") {
      return false;
    } else {
      board[row][column] = symbol;
      // then update DOM
    };
  };

  return { board, checkWin, playMove, resetBoard };
})(3);
