const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 游戏状态管理
class GameState {
  constructor() {
    this.board = Array(15).fill(null).map(() => Array(15).fill(0));
    this.currentPlayer = 1; // 1为黑子，2为白子
    this.gameOver = false;
    this.winner = null;
  }

  reset() {
    this.board = Array(15).fill(null).map(() => Array(15).fill(0));
    this.currentPlayer = 1;
    this.gameOver = false;
    this.winner = null;
  }

  makeMove(row, col, player) {
    // 添加边界检查，防止数组越界
    if (row < 0 || row >= 15 || col < 0 || col >= 15) {
      return false;
    }
    
    if (this.gameOver || this.board[row][col] !== 0 || player !== this.currentPlayer) {
      return false;
    }

    this.board[row][col] = player;
    
    if (this.checkWin(row, col, player)) {
      this.gameOver = true;
      this.winner = player;
    } else {
      this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
    }
    
    return true;
  }

  checkWin(row, col, player) {
    // 添加边界检查
    if (row < 0 || row >= 15 || col < 0 || col >= 15) {
      return false;
    }
    
    const directions = [
      [0, 1],   // 水平
      [1, 0],   // 垂直
      [1, 1],   // 对角线
      [1, -1]   // 反对角线
    ];

    for (let [dx, dy] of directions) {
      let count = 1;
      
      // 正方向
      for (let i = 1; i < 5; i++) {
        const newRow = row + dx * i;
        const newCol = col + dy * i;
        if (newRow >= 0 && newRow < 15 && newCol >= 0 && newCol < 15 && this.board[newRow][newCol] === player) {
          count++;
        } else {
          break;
        }
      }

      // 反方向
      for (let i = 1; i < 5; i++) {
        const newRow = row - dx * i;
        const newCol = col - dy * i;
        if (newRow >= 0 && newRow < 15 && newCol >= 0 && newCol < 15 && this.board[newRow][newCol] === player) {
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
}

const game = new GameState();

// Socket.io 连接处理
io.on('connection', (socket) => {
  console.log('用户已连接:', socket.id);

  // 发送当前游戏状态
  socket.emit('gameState', {
    board: game.board || Array(15).fill(null).map(() => Array(15).fill(0)),
    currentPlayer: game.currentPlayer || 1,
    gameOver: game.gameOver || false,
    winner: game.winner || null
  });

  // 处理落子
  socket.on('makeMove', (data) => {
    const { row, col, player } = data;
    
    if (game.makeMove(row, col, player)) {
      io.emit('moveMade', {
        row,
        col,
        player,
        board: game.board || Array(15).fill(null).map(() => Array(15).fill(0)),
        currentPlayer: game.currentPlayer || 1,
        gameOver: game.gameOver || false,
        winner: game.winner || null
      });
    }
  });

  // 处理重新开始
  socket.on('resetGame', () => {
    game.reset();
    io.emit('gameReset', {
      board: game.board || Array(15).fill(null).map(() => Array(15).fill(0)),
      currentPlayer: game.currentPlayer || 1,
      gameOver: game.gameOver || false,
      winner: game.winner || null
    });
  });

  socket.on('disconnect', () => {
    console.log('用户已断开连接:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`访问 http://localhost:${PORT} 开始游戏`);
});