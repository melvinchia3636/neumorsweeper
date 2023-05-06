import "./MingCute.css";
import "./style.css";

class Tile {
  constructor(board, x, y) {
    this.x = x;
    this.y = y;
    this.isMine = false;
    this.isRevealed = false;
    this.isFlagged = false;
    this.neighbourMineCount = 0;
    this.element = null;
    this.board = board;
  }

  getNeighbourMineCount() {
    let count = 0;
    for (let y = -1; y <= 1; y++) {
      const neighbourY = this.y + y;
      if (neighbourY >= 0 && neighbourY < this.board.boardSize) {
        for (let x = -1; x <= 1; x++) {
          const neighbourX = this.x + x;
          if (
            neighbourX >= 0 &&
            neighbourX < this.board.boardSize &&
            this.board.gameBoard[neighbourY][neighbourX].isMine
          ) {
            count++;
          }
        }
      }
    }

    this.neighbourMineCount = count;
  }

  revealSquare(isInternalCall = false) {
    if (this.board.timerStart === false) {
      this.board.timerStart = true;
      this.board.startTimer();
    }

    if (this.isRevealed || this.isFlagged) {
      return;
    }
    this.isRevealed = true;
    this.element.classList.add("revealed");
    if (!isInternalCall && this.isMine) {
      this.element.classList.add("mine");
      this.board.gameOver();
      return;
    }

    if (this.neighbourMineCount === 0) {
      for (let y = -1; y <= 1; y++) {
        for (let x = -1; x <= 1; x++) {
          const neighbourX = this.x + x;
          const neighbourY = this.y + y;
          if (
            neighbourX >= 0 &&
            neighbourX < this.board.boardSize &&
            neighbourY >= 0 &&
            neighbourY < this.board.boardSize
          ) {
            this.board.gameBoard[neighbourY][neighbourX].revealSquare(true);
          }
        }
      }
    } else {
      this.element.classList.add(`adjacent-mine-${this.neighbourMineCount}`);
      this.element.textContent = this.neighbourMineCount;
    }
  }

  toggleFlag() {
    if (this.board.timerStart === false) {
      this.board.timerStart = true;
      this.board.startTimer();
    }

    if (this.isRevealed) {
      return;
    }

    this.isFlagged = !this.isFlagged;

    if (this.isFlagged) {
      this.element.classList.add("mgc_flag_3_fill", "flag");
    } else {
      this.element.classList.remove("mgc_flag_3_fill", "flag");
    }

    const mines = this.board.gameBoard.reduce((count, row) => {
      return count + row.filter((square) => square.isMine).length;
    }, 0);

    const flaggedSquares = this.board.gameBoard.reduce((count, row) => {
      return (
        count + row.filter((square) => square.isFlagged && square.isMine).length
      );
    }, 0);

    const allFlaggedSquares = this.board.gameBoard.reduce((count, row) => {
      return count + row.filter((square) => square.isFlagged).length;
    }, 0);

    this.board.UNFLAGGED_MINES_COUNTER.textContent = (
      Math.max(this.board.numMines - allFlaggedSquares, 0) + ""
    ).padStart(2, "0");

    if (flaggedSquares === mines) {
      const squares = document.querySelectorAll(".square");
      const unflaggedMines = Array.from(squares).some((square) => {
        const x = parseInt(square.dataset.x);
        const y = parseInt(square.dataset.y);
        return (
          this.board.gameBoard[y][x].isMine &&
          !this.board.gameBoard[y][x].isFlagged
        );
      });

      if (!unflaggedMines) {
        this.board.gameOver(true);
      }
    }
  }
}

class Settings {
  constructor(board) {
    this.theme = localStorage.getItem("theme") || "light";
    this.boardSize = 10;
    this.numMines = 10;
    this.board = board;

    this.initializeDOM();
  }

  updateDOMTheme() {
    if (this.theme === "light") {
      document.querySelector("html").classList.remove("dark");
    } else {
      document.querySelector("html").classList.add("dark");
    }
  }

  toggleTheme(theme) {
    this.theme = theme;
    localStorage.setItem("theme", theme);
    this.updateDOMTheme();
  }

  initializeDOM() {
    this.updateDOMTheme();

    const DARK_THEME_TOGGLE = document.getElementById("dark_theme_toggle");

    DARK_THEME_TOGGLE.addEventListener("click", () => {
      this.toggleTheme(this.theme === "light" ? "dark" : "light");
    });
  }
}

class Minesweeper {
  constructor(boardSize, numMines) {
    this.boardSize = boardSize;
    this.numMines = numMines;
    this.gameBoard = [];
    this.timerStart = false;
    this.timerInstance = null;
    this.minesRemaining = numMines;
    this.GAME_BOARD = document.querySelector(".board");
    this.TIMER = document.getElementById("timer");
    this.UNFLAGGED_MINES_COUNTER = document.getElementById(
      "unflagged_mines_counter"
    );
    this.SETTINGS_BTN = document.getElementById("settings_button");
    this.SETTINGS_CLOSE_BTN = document.getElementById("settings_close_button");
    this.MESSAGE_CLOSE_BTN = document.getElementById("message_close_button");
    this.MESSAGE = document.querySelector(".message");
    this.RESTART_BTN = document.getElementById("restart_button");
    this.GAME_OVER_CONTAINER = document.getElementById("game_over_container");

    this.settings = new Settings(this);

    this.initializeGame();
  }

  initializeGame(isFirstGame = true) {
    this.createGameBoard();
    this.addMinesToGameBoard();
    this.calculateNeighbourMineCounts();
    this.addEventListenersToSquares();
    if (isFirstGame) this.addEventListenersToMisc();
  }

  restartGame() {
    this.gameBoard = [];
    this.timerStart = false;
    this.timerInstance = null;
    this.minesRemaining = this.numMines;
    this.TIMER.textContent = "00:00:00";
    this.UNFLAGGED_MINES_COUNTER.textContent = (
      Math.max(this.numMines - 0, 0) + ""
    ).padStart(2, "0");
    this.GAME_BOARD.querySelectorAll(".square").forEach((square) =>
      square.remove()
    );
    this.GAME_OVER_CONTAINER.classList.remove("opacity-100");
    this.GAME_OVER_CONTAINER.classList.add("opacity-0");

    this.MESSAGE.classList.remove("visible");

    setTimeout(() => {
      this.GAME_OVER_CONTAINER.classList.remove("flex");
      this.GAME_OVER_CONTAINER.classList.add("hidden");
    }, 500);

    this.initializeGame(false);
  }

  startTimer() {
    let time = 0;
    this.timerInstance = setInterval(() => {
      time++;
      const hours = Math.floor(time / 3600);
      const minutes = Math.floor((time - hours * 3600) / 60);
      const seconds = time - hours * 3600 - minutes * 60;
      const formattedTime = `${(hours + "").padStart(2, "0")}:${(
        minutes + ""
      ).padStart(2, "0")}:${(seconds + "").padStart(2, "0")}`;
      this.TIMER.textContent = formattedTime;
    }, 1000);
  }

  gameOver(hasWin) {
    const squares = document.querySelectorAll(".square");
    squares.forEach((square) => {
      const x = parseInt(square.dataset.x);
      const y = parseInt(square.dataset.y);
      if (this.gameBoard[y][x].isMine) {
        square.classList.add("mine");
      }
      square.removeEventListener("click", this.handleLeftClick);
      square.removeEventListener("contextmenu", this.handleRightClick);
    });
    this.disableBoard();
    clearInterval(this.timerInstance);

    setTimeout(() => {
      this.MESSAGE.querySelector(".emoji").textContent = hasWin ? "=)" : ";-;";
      this.MESSAGE.querySelector(".content").textContent = hasWin
        ? "Yay, you win the game!"
        : "Sad, you lose the game.";

      this.MESSAGE.classList.add("visible");

      this.GAME_OVER_CONTAINER.querySelector("#msg").textContent = hasWin
        ? "Yay! =)"
        : "Sad. ;-;";
      this.GAME_OVER_CONTAINER.classList.remove("hidden");
      this.GAME_OVER_CONTAINER.classList.add("flex");

      setTimeout(() => {
        this.GAME_OVER_CONTAINER.classList.remove("opacity-0");
        this.GAME_OVER_CONTAINER.classList.add("opacity-100");
      }, 100);
    }, 500);
  }

  createGameBoard() {
    for (let y = 0; y < this.boardSize; y++) {
      const row = [];
      for (let x = 0; x < this.boardSize; x++) {
        row.push(new Tile(this, x, y));
      }
      this.gameBoard.push(row);
    }
    for (let y = 0; y < this.boardSize; y++) {
      for (let x = 0; x < this.boardSize; x++) {
        const squareElement = document.createElement("div");
        squareElement.classList.add("square");
        squareElement.dataset.x = x;
        squareElement.dataset.y = y;
        this.GAME_BOARD.appendChild(squareElement);
        this.gameBoard[y][x].element = squareElement;
      }
    }
  }

  disableBoard() {
    const squares = document.querySelectorAll(".square");
    squares.forEach((square) => {
      square.removeEventListener("click", this.handleLeftClick);
      square.removeEventListener("contextmenu", this.handleRightClick);
      square.style.pointerEvents = "none";
    });
  }

  addMinesToGameBoard() {
    while (this.minesRemaining > 0) {
      const x = this.getRandomInt(0, this.boardSize - 1);
      const y = this.getRandomInt(0, this.boardSize - 1);
      if (!this.gameBoard[y][x].isMine) {
        this.gameBoard[y][x].isMine = true;
        this.minesRemaining--;
      }
    }
  }

  getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  calculateNeighbourMineCounts() {
    for (let y = 0; y < this.boardSize; y++) {
      for (let x = 0; x < this.boardSize; x++) {
        const square = this.gameBoard[y][x];
        square.getNeighbourMineCount();
      }
    }
  }

  addEventListenersToSquares() {
    const squares = document.querySelectorAll(".square");
    squares.forEach((square) => {
      square.addEventListener("click", this.handleLeftClick.bind(this));
    });

    squares.forEach((square) => {
      square.addEventListener("contextmenu", this.handleRightClick.bind(this));
    });
  }

  addEventListenersToMisc() {
    this.SETTINGS_BTN.addEventListener("click", () => {
      const settings = document.getElementById("settings_modal");
      settings.classList.toggle("visible");
    });

    this.SETTINGS_CLOSE_BTN.addEventListener("click", () => {
      const settings = document.getElementById("settings_modal");
      settings.classList.toggle("visible");
    });

    this.MESSAGE_CLOSE_BTN.addEventListener("click", () => {
      const message = document.querySelector(".message");
      message.classList.remove("visible");
    });

    this.RESTART_BTN.addEventListener("click", this.restartGame.bind(this));
  }

  handleLeftClick(event) {
    const x = parseInt(event.target.dataset.x);
    const y = parseInt(event.target.dataset.y);
    this.gameBoard[y][x].revealSquare();
  }

  handleRightClick(event) {
    event.preventDefault();
    const x = parseInt(event.target.dataset.x);
    const y = parseInt(event.target.dataset.y);
    this.gameBoard[y][x].toggleFlag();
  }
}

window.game = new Minesweeper(10, 10);
