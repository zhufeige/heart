const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

// 创建HTTP服务器用于提供静态文件
const server = http.createServer((req, res) => {
    const filePath = req.url === '/' ? 'index.html' : req.url.slice(1);
    const absPath = path.join(__dirname, filePath);
    fs.readFile(absPath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('File not found');
        } else {
            res.writeHead(200, { 'Content-Type': getContentType(filePath) });
            res.end(data);
        }
    });
});

// 辅助函数：获取文件MIME类型
function getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    switch(ext) {
        case '.html': return 'text/html';
        case '.js': return 'text/javascript';
        case '.css': return 'text/css';
        default: return 'application/octet-stream';
    }
}

// 将WebSocket服务器附加到HTTP服务器
const wss = new WebSocket.Server({ server });

let waitingPlayer = null;
let games = new Map(); // 游戏实例存储：gameId -> { players, board, current }

wss.on('connection', (ws) => {
    if (!waitingPlayer) {
        waitingPlayer = ws;
        ws.send(JSON.stringify({ type: 'info', msg: '等待对手连接...' }));
    } else {
        const gameId = Date.now().toString();
        const game = {
            players: [waitingPlayer, ws],
            board: Array(15).fill().map(() => Array(15).fill(0)), // 0空 1黑 2白
            current: 1, // 初始黑方先手
            ready: [false, false] // 玩家准备状态数组（索引0为玩家1，索引1为玩家2）
        };
        games.set(gameId, game);

        waitingPlayer.send(JSON.stringify({ type: 'match', color: 'black', playerId: 1 }));
        ws.send(JSON.stringify({ type: 'match', color: 'white', playerId: 2 }));
        waitingPlayer = null;
    }

    ws.on('message', (data) => {
        const msg = JSON.parse(data);
        const game = Array.from(games.values()).find(g => g.players.includes(ws));
        if (!game) return;

        if (msg.type === 'ready') {
            const playerIndex = game.players.indexOf(ws);
            game.ready[playerIndex] = !game.ready[playerIndex];
            // 广播准备状态更新
            game.players.forEach(p => {
                p.send(JSON.stringify({ type: 'readyUpdate', ready: game.ready }));
            });
            // 检查双方是否都准备
            if (game.ready.every(r => r)) {
                game.players.forEach(p => {
                    p.send(JSON.stringify({ type: 'gameStart' }));
                });
            }
            return;
        }

        if (msg.type === 'move') {
            const { x, y } = msg;
            // 验证是否合法落子
            if (game.board[x][y] !== 0 || game.current !== (game.players[0] === ws ? 1 : 2)) {
                return ws.send(JSON.stringify({ type: 'error', msg: '非法落子' }));
            }

            // 更新棋盘
            game.board[x][y] = game.current;

            // 检测胜利
            if (checkWin(game.board, x, y, game.current)) {
                // 先广播最新棋盘状态
                game.players.forEach(p => {
                    p.send(JSON.stringify({ type: 'update', board: game.board, current: game.current }));
                });
                // 明确获胜方颜色（当前落子方）
                const winnerColor = game.current === 1 ? 'black' : 'white';
                game.players.forEach(p => {
                    p.send(JSON.stringify({ type: 'win', winner: winnerColor }));
                });
                games.delete(Array.from(games.keys()).find(k => games.get(k) === game));
            } else {
                // 切换当前玩家并广播更新
                game.current = game.current === 1 ? 2 : 1;
                game.players.forEach(p => {
                    p.send(JSON.stringify({ type: 'update', board: game.board, current: game.current }));
                });
            }
        }
    });
});

// 检测五子连珠
function checkWin(board, x, y, color) {
    const directions = [[1,0], [0,1], [1,1], [1,-1]];
    for (const [dx, dy] of directions) {
        let count = 1;
        // 正方向
        for (let i=1; i<5; i++) {
            const nx = x + dx*i;
            const ny = y + dy*i;
            if (nx <0 || nx>=15 || ny<0 || ny>=15 || board[nx][ny] !== color) break;
            count++;
        }
        // 反方向
        for (let i=1; i<5; i++) {
            const nx = x - dx*i;
            const ny = y - dy*i;
            if (nx <0 || nx>=15 || ny<0 || ny>=15 || board[nx][ny] !== color) break;
            count++;
        }
        if (count >=5) return true;
    }
    return false;
}

server.listen(8080, '0.0.0.0', () => {
    console.log('服务器启动，端口8080');
});
