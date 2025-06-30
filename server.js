const express = require('express');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const PORT = 3000;

// 设置静态文件目录
app.use(express.static(path.join(__dirname)));

// 创建HTTP服务器
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// 创建WebSocket服务器
const wss = new WebSocket.Server({ server });

let gameState = {
  board: Array(15).fill().map(() => Array(15).fill(0)),
  currentPlayer: 1,
  players: []
};

wss.on('connection', (ws) => {
  console.log('New client connected');
  
  // 初始化游戏状态
  if (gameState.players.length < 2) {
    const playerId = gameState.players.length + 1;
    gameState.players.push({ ws, playerId });
    
    ws.send(JSON.stringify({
      type: 'init',
      player: playerId
    }));
    
    if (gameState.players.length === 2) {
      // 通知双方游戏开始
      gameState.players.forEach(player => {
        player.ws.send(JSON.stringify({
          type: 'game_start',
          currentPlayer: gameState.currentPlayer
        }));
      });
    }
  } else {
    ws.send(JSON.stringify({
      type: 'error',
      message: '游戏已满员'
    }));
    ws.close();
    return;
  }
  
  // 接收消息
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'move') {
        // 验证落子
        const player = gameState.players.find(p => p.ws === ws);
        if (!player || player.playerId !== gameState.currentPlayer) return;
        
        // 更新游戏状态
        gameState.board[data.y][data.x] = data.player;
        
        // 广播落子信息
        gameState.players.forEach(player => {
          player.ws.send(JSON.stringify({
            type: 'move',
            x: data.x,
            y: data.y,
            player: data.player
          }));
        });
        
        // 切换玩家
        gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
      }
    } catch (err) {
      console.error('Error processing message:', err);
    }
  });
  
  // 断开连接
  ws.on('close', () => {
    console.log('Client disconnected');
    gameState.players = gameState.players.filter(player => player.ws !== ws);
    
    // 通知剩余玩家
    if (gameState.players.length > 0) {
      gameState.players[0].ws.send(JSON.stringify({
        type: 'opponent_disconnected'
      }));
    }
    
    // 重置游戏状态
    if (gameState.players.length === 0) {
      gameState = {
        board: Array(15).fill().map(() => Array(15).fill(0)),
        currentPlayer: 1,
        players: []
      };
    }
  });
});