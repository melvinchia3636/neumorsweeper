/* eslint-disable class-methods-use-this */
/* eslint-disable no-param-reassign */
/* eslint-disable function-paren-newline */
/* eslint-disable no-plusplus */
/* eslint-disable implicit-arrow-linebreak */
/* eslint-disable operator-linebreak */
/* eslint-disable max-classes-per-file */
import '../public/MingCute.css';
import './style.css';

const DIFFICULTY = {
  EASY: {
    difficulty: 'easy',
    width: 10,
    height: 10,
    numMines: 10,
    square: {
      size: 40,
      gap: 10,
    },
  },
  MEDIUM: {
    difficulty: 'medium',
    width: 16,
    height: 16,
    numMines: 40,
    square: {
      size: 30,
      gap: 6,
    },
  },
  HARD: {
    difficulty: 'hard',
    width: 30,
    height: 16,
    numMines: 99,
    square: {
      size: 26,
      gap: 6,
    },
  },
};

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
      if (neighbourY >= 0 && neighbourY < this.board.settings.height) {
        for (let x = -1; x <= 1; x++) {
          const neighbourX = this.x + x;
          if (
            neighbourX >= 0 &&
            neighbourX < this.board.settings.width &&
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

      this.board.addMinesToGameBoard(this.x, this.y);
      this.board.calculateNeighbourMineCounts();
    }

    if (this.isRevealed || this.isFlagged) {
      return;
    }
    this.isRevealed = true;
    this.element.classList.add('revealed');
    if (!isInternalCall && this.isMine) {
      this.element.classList.add('mine');
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
            neighbourX < this.board.settings.width &&
            neighbourY >= 0 &&
            neighbourY < this.board.settings.height
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
      this.element.classList.add('mgc_flag_3_fill', 'flag');
    } else {
      this.element.classList.remove('mgc_flag_3_fill', 'flag');
    }

    const mines = this.board.gameBoard.reduce(
      (count, row) => count + row.filter((square) => square.isMine).length,
      0,
    );

    const flaggedSquares = this.board.gameBoard.reduce(
      (count, row) =>
        count +
        row.filter((square) => square.isFlagged && square.isMine).length,
      0,
    );

    const allFlaggedSquares = this.board.gameBoard.reduce(
      (count, row) => count + row.filter((square) => square.isFlagged).length,
      0,
    );

    this.board.UNFLAGGED_MINES_COUNTER.textContent = `${Math.max(
      this.board.settings.numMines - allFlaggedSquares,
      0,
    )}`.padStart(2, '0');

    if (flaggedSquares === mines) {
      const squares = document.querySelectorAll('.square');
      const unflaggedMines = Array.from(squares).some((square) => {
        const x = parseInt(square.dataset.x, 10);
        const y = parseInt(square.dataset.y, 10);
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
    this.theme = localStorage.getItem('theme') || 'light';
    this.difficulty =
      window.innerWidth >= 530
        ? localStorage.getItem('difficulty')
        : 'easy' || 'easy';
    this.board = board;

    Object.assign(this, DIFFICULTY[this.difficulty.toUpperCase()]);
    this.initializeDOM();
  }

  updateDOMTheme() {
    if (this.theme === 'light') {
      document.querySelector('html').classList.remove('dark');
    } else {
      document.querySelector('html').classList.add('dark');
    }
  }

  toggleTheme(theme) {
    this.theme = theme;
    localStorage.setItem('theme', theme);
    this.updateDOMTheme();
  }

  changeDifficulty(difficulty) {
    this.difficulty = difficulty;
    Object.assign(this, DIFFICULTY[this.difficulty.toUpperCase()]);
    this.board.minesRemaining = this.numMines;
    this.board.restartGame();
    localStorage.setItem('difficulty', difficulty);
  }

  initializeDOM() {
    this.updateDOMTheme();

    const DARK_THEME_TOGGLE = document.getElementById('dark_theme_toggle');
    const DIFFICULTY_SELECT = document.getElementById('difficulty_select');

    DARK_THEME_TOGGLE.checked = this.theme === 'dark';

    DARK_THEME_TOGGLE.addEventListener('click', () => {
      this.toggleTheme(this.theme === 'light' ? 'dark' : 'light');
    });

    DIFFICULTY_SELECT.value = this.difficulty;

    DIFFICULTY_SELECT.addEventListener('change', (e) => {
      this.changeDifficulty(e.target.value);
    });

    if (window.innerWidth < 530) {
      DIFFICULTY_SELECT.querySelector('option[value="medium"]').remove();
      DIFFICULTY_SELECT.querySelector('option[value="hard"]').remove();
    }
  }
}

class Minesweeper {
  constructor() {
    this.settings = new Settings(this);
    this.settings.board = this;
    this.gameBoard = [];
    this.timerStart = false;
    this.timerInstance = null;
    this.minesRemaining = this.settings.numMines;
    this.GAME_BOARD = document.querySelector('.board');
    this.TIMER = document.getElementById('timer');
    this.UNFLAGGED_MINES_COUNTER = document.getElementById(
      'unflagged_mines_counter',
    );
    this.SETTINGS_BTN = document.getElementById('settings_button');
    this.SETTINGS_CLOSE_BTN = document.getElementById('settings_close_button');
    this.CHAT_GPT_BTN = document.getElementById('chat_gpt_button');
    this.CHAT_GPT_CLOSE_BTN = document.getElementById('chat_gpt_close_button');
    this.MESSAGE_CLOSE_BTN = document.getElementById('message_close_button');
    this.MESSAGE = document.querySelector('.message');
    this.RESTART_BTN = document.getElementById('restart_button');
    this.GAME_OVER_CONTAINER = document.getElementById('game_over_container');

    this.initializeGame();
  }

  initializeGame(isFirstGame = true) {
    this.createGameBoard();
    this.addEventListenersToSquares();
    if (isFirstGame) this.addEventListenersToMisc();
  }

  restartGame() {
    clearInterval(this.timerInstance);

    this.gameBoard = [];
    this.timerStart = false;
    this.timerInstance = null;
    this.minesRemaining = this.settings.numMines;
    this.TIMER.textContent = '00:00:00';
    this.UNFLAGGED_MINES_COUNTER.textContent = `${Math.max(
      this.settings.numMines - 0,
      0,
    )}`.padStart(2, '0');
    this.GAME_BOARD.querySelectorAll('.square').forEach((square) =>
      square.remove(),
    );
    this.GAME_OVER_CONTAINER.classList.remove('opacity-100');
    this.GAME_OVER_CONTAINER.classList.add('opacity-0');

    this.MESSAGE.classList.remove('visible');

    setTimeout(() => {
      this.GAME_OVER_CONTAINER.classList.remove('flex');
      this.GAME_OVER_CONTAINER.classList.add('hidden');
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
      const formattedTime = `${`${hours}`.padStart(
        2,
        '0',
      )}:${`${minutes}`.padStart(2, '0')}:${`${seconds}`.padStart(2, '0')}`;
      this.TIMER.textContent = formattedTime;
    }, 1000);
  }

  gameOver(hasWin) {
    const squares = document.querySelectorAll('.square');
    squares.forEach((square) => {
      const x = parseInt(square.dataset.x, 10);
      const y = parseInt(square.dataset.y, 10);
      if (this.gameBoard[y][x].isMine) {
        square.classList.add('mine');
      }
      square.removeEventListener('click', this.handleLeftClick);
      square.removeEventListener('contextmenu', this.handleRightClick);
    });
    this.disableBoard();
    clearInterval(this.timerInstance);

    setTimeout(() => {
      this.MESSAGE.querySelector('.emoji').textContent = hasWin ? '=)' : ';-;';
      this.MESSAGE.querySelector('.content').textContent = hasWin
        ? 'Yay, you win the game!'
        : 'Sad, you lose the game.';

      this.MESSAGE.classList.add('visible');

      this.GAME_OVER_CONTAINER.querySelector('#msg').textContent = hasWin
        ? 'Yay! =)'
        : 'Sad. ;-;';
      this.GAME_OVER_CONTAINER.classList.remove('hidden');
      this.GAME_OVER_CONTAINER.classList.add('flex');

      setTimeout(() => {
        this.GAME_OVER_CONTAINER.classList.remove('opacity-0');
        this.GAME_OVER_CONTAINER.classList.add('opacity-100');
      }, 100);
    }, 500);
  }

  createGameBoard() {
    for (let y = 0; y < this.settings.height; y++) {
      const row = [];
      for (let x = 0; x < this.settings.width; x++) {
        row.push(new Tile(this, x, y));
      }
      this.gameBoard.push(row);
    }
    for (let y = 0; y < this.settings.height; y++) {
      for (let x = 0; x < this.settings.width; x++) {
        const squareElement = document.createElement('div');
        squareElement.classList.add('square');
        squareElement.dataset.x = x;
        squareElement.dataset.y = y;
        this.GAME_BOARD.appendChild(squareElement);
        this.gameBoard[y][x].element = squareElement;
      }
    }

    this.GAME_BOARD.style[
      'grid-template-columns'
    ] = `repeat(${this.settings.width}, ${this.settings.square.size}px)`;
    this.GAME_BOARD.style[
      'grid-template-rows'
    ] = `repeat(${this.settings.height}, ${this.settings.square.size}px)`;
    this.GAME_BOARD.style.gap = `${this.settings.square.gap}px`;
    this.GAME_BOARD.querySelectorAll('.square').forEach((e) => {
      e.style['font-size'] = `${this.settings.square.size * 0.5}px`;
    });

    this.UNFLAGGED_MINES_COUNTER.textContent =
      `${this.settings.numMines}`.padStart(2, '0');
  }

  disableBoard() {
    const squares = document.querySelectorAll('.square');
    squares.forEach((square) => {
      square.removeEventListener('click', this.handleLeftClick);
      square.removeEventListener('contextmenu', this.handleRightClick);
      square.style.pointerEvents = 'none';
    });
  }

  addMinesToGameBoard(firstX, firstY) {
    while (this.minesRemaining > 0) {
      const x = this.getRandomInt(0, this.settings.width - 1);
      const y = this.getRandomInt(0, this.settings.height - 1);
      if (
        !this.gameBoard[y][x].isMine &&
        !(
          x >= firstX - 1 &&
          x <= firstX + 1 &&
          y >= firstY - 1 &&
          y <= firstY + 1
        )
      ) {
        this.gameBoard[y][x].isMine = true;
        this.minesRemaining--;
      }
    }
  }

  getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  calculateNeighbourMineCounts() {
    for (let y = 0; y < this.settings.height; y++) {
      for (let x = 0; x < this.settings.width; x++) {
        const square = this.gameBoard[y][x];
        square.getNeighbourMineCount();
      }
    }
  }

  addEventListenersToSquares() {
    const squares = document.querySelectorAll('.square');
    squares.forEach((square) => {
      square.addEventListener('click', this.handleLeftClick.bind(this));
    });

    squares.forEach((square) => {
      square.addEventListener('contextmenu', this.handleRightClick.bind(this));
    });
  }

  addEventListenersToMisc() {
    this.SETTINGS_BTN.addEventListener('click', () => {
      document.getElementById('chatgpt_modal').classList.remove('visible');

      const settings = document.getElementById('settings_modal');
      settings.classList.toggle('visible');
    });

    this.SETTINGS_CLOSE_BTN.addEventListener('click', () => {
      const settings = document.getElementById('settings_modal');
      settings.classList.toggle('visible');
    });

    this.CHAT_GPT_BTN.addEventListener('click', () => {
      document.getElementById('settings_modal').classList.remove('visible');

      const chatGPT = document.getElementById('chatgpt_modal');
      chatGPT.classList.toggle('visible');
    });

    this.CHAT_GPT_CLOSE_BTN.addEventListener('click', () => {
      const chatGPT = document.getElementById('chatgpt_modal');
      chatGPT.classList.toggle('visible');
    });

    this.MESSAGE_CLOSE_BTN.addEventListener('click', () => {
      const message = document.querySelector('.message');
      message.classList.remove('visible');
    });

    this.RESTART_BTN.addEventListener('click', this.restartGame.bind(this));
  }

  handleLeftClick(event) {
    const x = parseInt(event.target.dataset.x, 10);
    const y = parseInt(event.target.dataset.y, 10);
    this.gameBoard[y][x].revealSquare();
  }

  handleRightClick(event) {
    event.preventDefault();
    const x = parseInt(event.target.dataset.x, 10);
    const y = parseInt(event.target.dataset.y, 10);
    this.gameBoard[y][x].toggleFlag();
  }

  revealAll() {
    const squares = document.querySelectorAll('.square');
    squares.forEach((square) => {
      const x = parseInt(square.dataset.x, 10);
      const y = parseInt(square.dataset.y, 10);
      if (this.gameBoard[y][x].isMine) {
        square.classList.add('mgc_flag_3_fill', 'flag');
      } else {
        this.gameBoard[y][x].revealSquare();
      }
      square.removeEventListener('click', this.handleLeftClick);
      square.removeEventListener('contextmenu', this.handleRightClick);
    });
  }
}

window.game = new Minesweeper();
