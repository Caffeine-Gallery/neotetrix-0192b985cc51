import { backend } from 'declarations/backend';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const nextPieceCanvas = document.getElementById('nextPieceCanvas');
const nextPieceCtx = nextPieceCanvas.getContext('2d');
const scoreDisplay = document.getElementById('scoreDisplay');

const ROWS = 20;
const COLS = 10;
const BLOCK_SIZE = 30;
const COLORS = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500'];

let board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
let currentPiece;
let nextPiece;
let score = 0;

const SHAPES = [
    [[1, 1, 1, 1]],
    [[1, 1], [1, 1]],
    [[1, 1, 1], [0, 1, 0]],
    [[1, 1, 1], [1, 0, 0]],
    [[1, 1, 1], [0, 0, 1]],
    [[1, 1, 0], [0, 1, 1]],
    [[0, 1, 1], [1, 1, 0]]
];

function createPiece() {
    const shapeIndex = Math.floor(Math.random() * SHAPES.length);
    const colorIndex = Math.floor(Math.random() * COLORS.length);
    return {
        shape: SHAPES[shapeIndex],
        color: COLORS[colorIndex],
        row: 0,
        col: Math.floor(COLS / 2) - Math.floor(SHAPES[shapeIndex][0].length / 2)
    };
}

function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            if (board[row][col]) {
                ctx.fillStyle = COLORS[board[row][col] - 1];
                ctx.fillRect(col * BLOCK_SIZE, row * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                ctx.strokeStyle = '#000';
                ctx.strokeRect(col * BLOCK_SIZE, row * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        }
    }
}

function drawPiece(piece, context, offsetX = 0, offsetY = 0) {
    piece.shape.forEach((row, i) => {
        row.forEach((value, j) => {
            if (value) {
                context.fillStyle = piece.color;
                context.fillRect((piece.col + j + offsetX) * BLOCK_SIZE, (piece.row + i + offsetY) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                context.strokeStyle = '#000';
                context.strokeRect((piece.col + j + offsetX) * BLOCK_SIZE, (piece.row + i + offsetY) * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        });
    });
}

function drawNextPiece() {
    nextPieceCtx.clearRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);
    const offsetX = (nextPieceCanvas.width / BLOCK_SIZE - nextPiece.shape[0].length) / 2;
    const offsetY = (nextPieceCanvas.height / BLOCK_SIZE - nextPiece.shape.length) / 2;
    drawPiece(nextPiece, nextPieceCtx, offsetX, offsetY);
}

function collides(piece, row, col) {
    for (let i = 0; i < piece.shape.length; i++) {
        for (let j = 0; j < piece.shape[i].length; j++) {
            if (piece.shape[i][j] && (
                row + i >= ROWS ||
                col + j < 0 ||
                col + j >= COLS ||
                board[row + i][col + j]
            )) {
                return true;
            }
        }
    }
    return false;
}

function mergePiece() {
    currentPiece.shape.forEach((row, i) => {
        row.forEach((value, j) => {
            if (value) {
                board[currentPiece.row + i][currentPiece.col + j] = COLORS.indexOf(currentPiece.color) + 1;
            }
        });
    });
}

function clearLines() {
    let linesCleared = 0;
    for (let row = ROWS - 1; row >= 0; row--) {
        if (board[row].every(cell => cell !== 0)) {
            linesCleared++;
            board.splice(row, 1);
            board.unshift(Array(COLS).fill(0));
            animateClearedLine(row);
        }
    }
    if (linesCleared > 0) {
        score += linesCleared * 100;
        scoreDisplay.textContent = score;
    }
}

function animateClearedLine(row) {
    const originalColors = [...board[row]];
    let alpha = 1;
    const animationInterval = setInterval(() => {
        alpha -= 0.1;
        for (let col = 0; col < COLS; col++) {
            if (originalColors[col] !== 0) {
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.fillRect(col * BLOCK_SIZE, row * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        }
        if (alpha <= 0) {
            clearInterval(animationInterval);
        }
    }, 30);
}

function rotatePiece() {
    const rotated = currentPiece.shape[0].map((_, i) =>
        currentPiece.shape.map(row => row[i]).reverse()
    );
    if (!collides({ ...currentPiece, shape: rotated }, currentPiece.row, currentPiece.col)) {
        currentPiece.shape = rotated;
    }
}

function moveDown() {
    if (!collides(currentPiece, currentPiece.row + 1, currentPiece.col)) {
        currentPiece.row++;
    } else {
        mergePiece();
        clearLines();
        currentPiece = nextPiece;
        nextPiece = createPiece();
        drawNextPiece();
        if (collides(currentPiece, currentPiece.row, currentPiece.col)) {
            // Game over
            alert(`Game Over! Your score: ${score}`);
            const playerName = prompt("Enter your name for the high score:");
            if (playerName) {
                backend.addHighScore(playerName, score);
            }
            resetGame();
        }
    }
}

function resetGame() {
    board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
    score = 0;
    scoreDisplay.textContent = score;
    currentPiece = createPiece();
    nextPiece = createPiece();
}

function gameLoop() {
    drawBoard();
    drawPiece(currentPiece, ctx);
    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'ArrowLeft':
            if (!collides(currentPiece, currentPiece.row, currentPiece.col - 1)) {
                currentPiece.col--;
            }
            break;
        case 'ArrowRight':
            if (!collides(currentPiece, currentPiece.row, currentPiece.col + 1)) {
                currentPiece.col++;
            }
            break;
        case 'ArrowDown':
            moveDown();
            break;
        case ' ':
            rotatePiece();
            break;
    }
});

currentPiece = createPiece();
nextPiece = createPiece();
drawNextPiece();
gameLoop();

setInterval(moveDown, 1000);

// Fetch and display high scores
async function displayHighScores() {
    const highScores = await backend.getHighScores();
    console.log("High Scores:", highScores);
    // You can add code here to display high scores on the page
}

displayHighScores();
