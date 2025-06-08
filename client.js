const board = document.getElementById('board');
const status = document.getElementById('status');
let ws;
let myColor;

// 初始化棋盘
function renderBoard() {
    for (let i = 0; i < 15; i++) {
        for (let j = 0; j < 15; j++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.x = i;
            cell.dataset.y = j;
            cell.addEventListener('click', handleCellClick);
            board.appendChild(cell);
        }
    }
}

// 连接WebSocket服务器
let myPlayerId;

function connectServer() {
    ws = new WebSocket('ws://localhost:8080');
    ws.onopen = () => status.textContent = '已连接，等待匹配对手...';
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        switch (data.type) {
            case 'match':
                myColor = data.color;
                myPlayerId = data.playerId;
                // 启用对应玩家的准备按钮
                document.querySelector(`#player${myPlayerId} .ready-btn`).disabled = false;
                status.textContent = `匹配成功！你是${myColor === 'black' ? '黑方' : '白方'}`;
                break;
            case 'readyUpdate':
                // 更新玩家准备状态显示
                data.ready.forEach((isReady, index) => {
                    const btn = document.querySelector(`#player${index+1} .ready-btn`);
                    btn.textContent = isReady ? '已准备' : '准备';
                    btn.disabled = myPlayerId !== index+1 && !isReady;
                });
                break;
            case 'gameStart':
                status.textContent = `游戏开始！${myColor === 'black' ? '轮到你落子' : '等待对方落子'}`;
                break;
            case 'update':
                updateBoard(data.board);
                status.textContent = data.current === myColor ? '轮到你落子' : '等待对方落子';
                break;
            case 'win':
                status.textContent = data.winner === myColor ? '胜利！' : '失败！';
                break;
        }
    };
}

// 准备按钮点击事件
document.querySelectorAll('.ready-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ready' }));
        }
    });
})

// 处理落子点击
function handleCellClick(e) {
    if (ws.readyState !== WebSocket.OPEN) return;
    const x = parseInt(e.target.dataset.x);
    const y = parseInt(e.target.dataset.y);
    ws.send(JSON.stringify({ type: 'move', x, y }));
}

// 更新棋盘显示
function updateBoard(boardData) {
    board.innerHTML = '';
    boardData.forEach((row, x) => {
        row.forEach((cell, y) => {
            const cellElem = document.createElement('div');
            cellElem.className = 'cell';
            if (cell !== 0) {
                const stone = document.createElement('div');
                stone.className = `stone ${cell === 1 ? 'black' : 'white'}`;
                cellElem.appendChild(stone);
            }
            cellElem.dataset.x = x;
            cellElem.dataset.y = y;
            cellElem.addEventListener('click', handleCellClick);
            board.appendChild(cellElem);
        });
    });
}

// 初始化
renderBoard();
connectServer();