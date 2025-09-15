const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let score = 0;
let speed = 7;
let snake = [{x: 10, y: 10}];
let food = {x: 5, y: 5};
let xVelocity = 0;
let yVelocity = 0;
let gameRunning = true;

function gameLoop() {
    if (!gameRunning) return;
    
    setTimeout(() => {
        if (clearCanvas() && moveSnake() && checkCollision()) {
            drawFood();
            drawSnake();
            gameLoop();
        }
    }, 1000 / speed);
}

function clearCanvas() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return true;
}

function drawSnake() {
    ctx.fillStyle = 'lime';
    snake.forEach(segment => {
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize-2, gridSize-2);
    });
}

function drawFood() {
    ctx.fillStyle = 'red';
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
}

function moveSnake() {
    const head = {x: snake[0].x + xVelocity, y: snake[0].y + yVelocity};
    snake.unshift(head);
    
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        generateFood();
    } else {
        snake.pop();
    }
    return true;
}

function generateFood() {
    food = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount)
    };
    
    // 确保食物不会生成在蛇身上
    snake.forEach(segment => {
        if (segment.x === food.x && segment.y === food.y) {
            generateFood();
        }
    });
}

function checkCollision() {
    const head = snake[0];
    
    // 撞墙检测
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
        return false;
    }
    
    // 撞自己检测
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameOver();
            return false;
        }
    }
    
    return true;
}

function gameOver() {
    gameRunning = false;
    ctx.fillStyle = 'white';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('游戏结束!', canvas.width/2, canvas.height/2);
}

// 键盘控制
document.addEventListener('keydown', (e) => {
    // 防止反向移动
    switch(e.key) {
        case 'ArrowUp':
            if (yVelocity !== 1) {
                xVelocity = 0;
                yVelocity = -1;
            }
            break;
        case 'ArrowDown':
            if (yVelocity !== -1) {
                xVelocity = 0;
                yVelocity = 1;
            }
            break;
        case 'ArrowLeft':
            if (xVelocity !== 1) {
                xVelocity = -1;
                yVelocity = 0;
            }
            break;
        case 'ArrowRight':
            if (xVelocity !== -1) {
                xVelocity = 1;
                yVelocity = 0;
            }
            break;
    }
});

// 触摸控制
document.querySelector('.up').addEventListener('touchstart', () => {
    if (yVelocity !== 1) {
        xVelocity = 0;
        yVelocity = -1;
    }
});

document.querySelector('.down').addEventListener('touchstart', () => {
    if (yVelocity !== -1) {
        xVelocity = 0;
        yVelocity = 1;
    }
});

document.querySelector('.left').addEventListener('touchstart', () => {
    if (xVelocity !== 1) {
        xVelocity = -1;
        yVelocity = 0;
    }
});

document.querySelector('.right').addEventListener('touchstart', () => {
    if (xVelocity !== -1) {
        xVelocity = 1;
        yVelocity = 0;
    }
});

generateFood();
gameLoop();