document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-board');
    const ctx = canvas.getContext('2d');
    const currentPlayerDisplay = document.getElementById('current-player');
    const gameStatusDisplay = document.getElementById('game-status');
    const restartBtn = document.getElementById('restart-btn');
    
    const BOARD_SIZE = 15;
    let CELL_SIZE = canvas.width / BOARD_SIZE;
    
    // 更新CELL_SIZE函数
    function updateCellSize() {
        CELL_SIZE = canvas.width / BOARD_SIZE;
    }
    let board = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(0));
    let currentPlayer = 1; // 1 为黑棋，2 为白棋
    let gameOver = false;
    
    // 初始化游戏
    function initGame() {
        board = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(0));
        currentPlayer = 1;
        gameOver = false;
        currentPlayerDisplay.textContent = '黑棋';
        gameStatusDisplay.textContent = '游戏中';
        gameStatusDisplay.style.color = '#4CAF50';
        drawBoard();
    }
    
    // 绘制棋盘
    function drawBoard() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 绘制网格
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < BOARD_SIZE; i++) {
            // 横线
            ctx.beginPath();
            ctx.moveTo(CELL_SIZE / 2, i * CELL_SIZE + CELL_SIZE / 2);
            ctx.lineTo(canvas.width - CELL_SIZE / 2, i * CELL_SIZE + CELL_SIZE / 2);
            ctx.stroke();
            
            // 竖线
            ctx.beginPath();
            ctx.moveTo(i * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE / 2);
            ctx.lineTo(i * CELL_SIZE + CELL_SIZE / 2, canvas.height - CELL_SIZE / 2);
            ctx.stroke();
        }
        
        // 绘制棋子
        for (let i = 0; i < BOARD_SIZE; i++) {
            for (let j = 0; j < BOARD_SIZE; j++) {
                if (board[i][j] === 1) {
                    drawPiece(j, i, 'black');
                } else if (board[i][j] === 2) {
                    drawPiece(j, i, 'white');
                }
            }
        }
    }
    
    // 绘制棋子
    function drawPiece(x, y, color) {
        ctx.beginPath();
        ctx.arc(
            x * CELL_SIZE + CELL_SIZE / 2,
            y * CELL_SIZE + CELL_SIZE / 2,
            CELL_SIZE / 2 - 2,
            0,
            Math.PI * 2
        );
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.stroke();
    }
    
    // 检查是否获胜
    function checkWin(x, y) {
        const directions = [
            [1, 0],   // 水平
            [0, 1],   // 垂直
            [1, 1],   // 对角线
            [1, -1]   // 反对角线
        ];
        
        for (const [dx, dy] of directions) {
            let count = 1;
            
            // 正向检查
            for (let i = 1; i < 5; i++) {
                const nx = x + i * dx;
                const ny = y + i * dy;
                if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === currentPlayer) {
                    count++;
                } else {
                    break;
                }
            }
            
            // 反向检查
            for (let i = 1; i < 5; i++) {
                const nx = x - i * dx;
                const ny = y - i * dy;
                if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny][nx] === currentPlayer) {
                    count++;
                } else {
                    break;
                }
            }
            
            if (count >= 5) {
                return true;
            }
        }
        
        return false;
    }
    
    // 处理点击事件
    function handleClick(event) {
        if (gameOver) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((event.clientX - rect.left) / CELL_SIZE);
        const y = Math.floor((event.clientY - rect.top) / CELL_SIZE);
        
        if (x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE && board[y][x] === 0) {
            // 发送落子信息到服务器
            const moveData = {
                type: 'move',
                x: x,
                y: y,
                player: currentPlayer
            };
            sendMessage(JSON.stringify(moveData));
        }
    }
    
    // 处理服务器消息
    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'move') {
            board[data.y][data.x] = data.player;
            drawBoard();
            
            if (checkWin(data.x, data.y)) {
                gameOver = true;
                const winner = data.player === 1 ? '黑棋' : '白棋';
                gameStatusDisplay.textContent = `${winner}获胜!`;
                gameStatusDisplay.style.color = '#f44336';
                return;
            }
            
            // 切换玩家
            currentPlayer = data.player === 1 ? 2 : 1;
            currentPlayerDisplay.textContent = currentPlayer === 1 ? '黑棋' : '白棋';
        } else if (data.type === 'init') {
            // 初始化游戏状态
            currentPlayer = data.player;
            currentPlayerDisplay.textContent = currentPlayer === 1 ? '黑棋' : '白棋';
        }
    };
    
    // 事件监听
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('click', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        handleClick(mouseEvent);
    }, { passive: false });
    restartBtn.addEventListener('click', initGame);
    
    // 开始游戏
    initGame();
    updateCellSize();
    
    // 监听画布大小变化
    window.addEventListener('resize', () => {
        updateCellSize();
        drawBoard();
    });
});