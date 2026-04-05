const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const linesEl = document.getElementById("lines");
const gameOverEl = document.getElementById("gameOver");

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;

const EMPTY = 0;
const FILLED = 1;

let board = [];
let currentPiece = null;
let dropCounter = 0;
let dropInterval = 500;
let lastTime = 0;
let score = 0;
let lines = 0;
let isGameOver = false;

const L_SHAPES = [
  [
    [1, 0],
    [1, 0],
    [1, 1]
  ],
  [
    [1, 1, 1],
    [1, 0, 0]
  ],
  [
    [1, 1],
    [0, 1],
    [0, 1]
  ],
  [
    [0, 0, 1],
    [1, 1, 1]
  ]
];

function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(EMPTY));
}

function createPiece() {
  return {
    x: 4,
    y: 0,
    rotation: 0,
    shape: L_SHAPES[0]
  };
}

function resetGame() {
  board = createBoard();
  score = 0;
  lines = 0;
  isGameOver = false;
  dropCounter = 0;
  lastTime = 0;
  currentPiece = createPiece();
  updateUI();
  gameOverEl.classList.add("hidden");

  if (collides(currentPiece.x, currentPiece.y, currentPiece.shape)) {
    isGameOver = true;
    gameOverEl.classList.remove("hidden");
  }
}

function updateUI() {
  scoreEl.textContent = score;
  linesEl.textContent = lines;
}

function drawCell(x, y, color = "#ff9f1c") {
  ctx.fillStyle = color;
  ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
  ctx.strokeStyle = "#111";
  ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
}

function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (board[y][x] === FILLED) {
        drawCell(x, y, "#ff9f1c");
      } else {
        ctx.strokeStyle = "#1f1f1f";
        ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
      }
    }
  }
}

function drawPiece() {
  const shape = currentPiece.shape;
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x]) {
        drawCell(currentPiece.x + x, currentPiece.y + y, "#2ec4b6");
      }
    }
  }
}

function collides(offsetX, offsetY, shape) {
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (!shape[y][x]) continue;

      const newX = offsetX + x;
      const newY = offsetY + y;

      if (newX < 0 || newX >= COLS || newY >= ROWS) {
        return true;
      }

      if (newY >= 0 && board[newY][newX] === FILLED) {
        return true;
      }
    }
  }
  return false;
}

function mergePiece() {
  const shape = currentPiece.shape;
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x]) {
        const boardY = currentPiece.y + y;
        const boardX = currentPiece.x + x;

        if (boardY >= 0) {
          board[boardY][boardX] = FILLED;
        }
      }
    }
  }
}

function clearLines() {
  let cleared = 0;

  for (let y = ROWS - 1; y >= 0; y--) {
    if (board[y].every(cell => cell === FILLED)) {
      board.splice(y, 1);
      board.unshift(Array(COLS).fill(EMPTY));
      cleared++;
      y++;
    }
  }

  if (cleared > 0) {
    lines += cleared;
    score += cleared * 100;
    updateUI();
  }
}

function rotatePiece() {
  const nextRotation = (currentPiece.rotation + 1) % L_SHAPES.length;
  const nextShape = L_SHAPES[nextRotation];

  if (!collides(currentPiece.x, currentPiece.y, nextShape)) {
    currentPiece.rotation = nextRotation;
    currentPiece.shape = nextShape;
    return;
  }

  if (!collides(currentPiece.x - 1, currentPiece.y, nextShape)) {
    currentPiece.x -= 1;
    currentPiece.rotation = nextRotation;
    currentPiece.shape = nextShape;
    return;
  }

  if (!collides(currentPiece.x + 1, currentPiece.y, nextShape)) {
    currentPiece.x += 1;
    currentPiece.rotation = nextRotation;
    currentPiece.shape = nextShape;
  }
}

function spawnNewPiece() {
  currentPiece = createPiece();
  if (collides(currentPiece.x, currentPiece.y, currentPiece.shape)) {
    isGameOver = true;
    gameOverEl.classList.remove("hidden");
  }
}

function dropPiece() {
  if (!collides(currentPiece.x, currentPiece.y + 1, currentPiece.shape)) {
    currentPiece.y++;
  } else {
    mergePiece();
    clearLines();
    spawnNewPiece();
  }
}

function update(time = 0) {
  if (isGameOver) {
    drawBoard();
    if (currentPiece) drawPiece();
    return;
  }

  const deltaTime = time - lastTime;
  lastTime = time;
  dropCounter += deltaTime;

  if (dropCounter > dropInterval) {
    dropPiece();
    dropCounter = 0;
  }

  drawBoard();
  drawPiece();
  requestAnimationFrame(update);
}

document.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "r") {
    resetGame();
    requestAnimationFrame(update);
    return;
  }

  if (isGameOver) return;

  if (event.key === "ArrowLeft") {
    if (!collides(currentPiece.x - 1, currentPiece.y, currentPiece.shape)) {
      currentPiece.x--;
    }
  } else if (event.key === "ArrowRight") {
    if (!collides(currentPiece.x + 1, currentPiece.y, currentPiece.shape)) {
      currentPiece.x++;
    }
  } else if (event.key === "ArrowDown") {
    dropPiece();
  } else if (event.key === "ArrowUp") {
    rotatePiece();
  }
});

resetGame();
requestAnimationFrame(update);