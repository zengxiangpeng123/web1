document.addEventListener('DOMContentLoaded', function() {
    // 游戏主类
    class Game2048 {
        constructor() {
            this.size = 4; // 4x4网格
            this.gameContainer = document.querySelector('.game-container');
            this.tileContainer = document.querySelector('.tile-container');
            this.scoreElement = document.getElementById('score');
            this.bestScoreElement = document.getElementById('best-score');
            this.messageElement = document.querySelector('.game-message p');
            this.messageContainer = document.querySelector('.game-message');
            
            this.score = 0;
            this.bestScore = parseInt(localStorage.getItem('bestScore')) || 0;
            this.grid = [];
            this.history = []; // 用于撤销功能
            this.isNewGame = true; // 标记是否是新游戏

            // 获取网格间距和单元格尺寸
            this.calculateTileSizeAndSpacing();
            
            this.init();
            
            // 事件监听器
            document.getElementById('new-game-button').addEventListener('click', () => this.newGame());
            document.getElementById('retry-button').addEventListener('click', () => this.newGame());
            document.getElementById('undo-button').addEventListener('click', () => this.undo());
            this.setupKeyboardListeners();
            this.setupTouchListeners();
            
            // 更新最高分显示
            this.bestScoreElement.textContent = this.bestScore;

            // 窗口大小改变时重新计算
            window.addEventListener('resize', () => {
                this.calculateTileSizeAndSpacing();
                this.updateTiles();
            });
        }

        // 计算方块尺寸和间距
        calculateTileSizeAndSpacing() {
            // 获取第一个网格单元格，用于计算实际尺寸和间距
            const gridRow = document.querySelector('.grid-row');
            const gridCell = document.querySelector('.grid-cell');
            const gridCells = document.querySelectorAll('.grid-cell');

            if (gridCell && gridRow) {
                // 计算单元格尺寸和间距
                const cellRect = gridCell.getBoundingClientRect();
                this.tileSize = cellRect.width;
                
                // 计算间距 (第二个单元格的left减去第一个单元格的right)
                if (gridCells.length >= 2) {
                    const firstRect = gridCells[0].getBoundingClientRect();
                    const secondRect = gridCells[1].getBoundingClientRect();
                    this.tileSpacing = secondRect.left - firstRect.right;
                } else {
                    // 默认间距，如果无法计算
                    this.tileSpacing = parseInt(window.getComputedStyle(gridRow).marginBottom);
                }
                
                console.log(`计算尺寸 - 方块: ${this.tileSize}px, 间距: ${this.tileSpacing}px`);
            }
        }
        
        // 初始化游戏
        init() {
            console.log("初始化游戏");
            // 初始化网格
            this.grid = [];
            for (let i = 0; i < this.size; i++) {
                this.grid[i] = [];
                for (let j = 0; j < this.size; j++) {
                    this.grid[i][j] = null;
                }
            }
            
            // 清空棋盘
            this.tileContainer.innerHTML = '';
            
            // 重置分数
            this.score = 0;
            this.updateScore();
            
            // 清除胜负消息
            this.messageContainer.classList.remove('game-over');
            this.messageContainer.classList.remove('game-won');
            
            // 标记为新游戏
            this.isNewGame = true;
            
            // 添加初始方块
            this.addRandomTile();
            this.addRandomTile();
            
            // 清空历史记录
            this.history = [];
            this.saveGameState();
        }
        
        // 开始新游戏
        newGame() {
            this.init();
        }
        
        // 保存当前游戏状态（用于撤销）
        saveGameState() {
            // 保存当前网格的深拷贝和分数
            const gridCopy = JSON.parse(JSON.stringify(this.grid));
            this.history.push({
                grid: gridCopy,
                score: this.score
            });
            
            // 最多保存10步
            if (this.history.length > 10) {
                this.history.shift();
            }
        }
        
        // 撤销上一步
        undo() {
            if (this.history.length <= 1) return; // 保留初始状态，不可撤销到空
            
            // 删除当前状态
            this.history.pop();
            
            // 恢复到上一个状态
            const previousState = this.history[this.history.length - 1];
            this.grid = JSON.parse(JSON.stringify(previousState.grid));
            this.score = previousState.score;
            
            // 更新UI
            this.updateScore();
            this.updateTiles();
        }
        
        // 更新分数显示
        updateScore() {
            this.scoreElement.textContent = this.score;
            if (this.score > this.bestScore) {
                this.bestScore = this.score;
                this.bestScoreElement.textContent = this.bestScore;
                localStorage.setItem('bestScore', this.bestScore);
            }
        }
        
        // 在随机空单元格中添加新方块
        addRandomTile() {
            const emptyCells = [];
            
            // 找出所有空单元格
            for (let i = 0; i < this.size; i++) {
                for (let j = 0; j < this.size; j++) {
                    if (this.grid[i][j] === null) {
                        emptyCells.push({ x: i, y: j });
                    }
                }
            }
            
            // 如果有空单元格，随机选择一个添加方块
            if (emptyCells.length > 0) {
                const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
                
                // 如果是新游戏，只生成2
                // 否则90%的概率是2，10%的概率是4
                let value;
                if (this.isNewGame) {
                    value = 2;
                } else {
                    value = Math.random() < 0.9 ? 2 : 4;
                }
                
                this.grid[randomCell.x][randomCell.y] = value;
                
                // 创建新方块元素
                this.createTileElement(randomCell.x, randomCell.y, value);
                
                return true;
            }
            
            return false;
        }
        
        // 创建方块DOM元素
        createTileElement(row, col, value) {
            const tile = document.createElement('div');
            tile.className = `tile tile-${value} tile-new`;
            tile.textContent = value;
            
            // 计算方块位置
            const position = this.getTilePosition(row, col);
            
            console.log(`创建方块: 行=${row}, 列=${col}, 值=${value}, X=${position.left}px, Y=${position.top}px`);
            
            tile.style.width = `${this.tileSize}px`;
            tile.style.height = `${this.tileSize}px`;
            tile.style.top = `${position.top}px`;
            tile.style.left = `${position.left}px`;
            
            // 将方块添加到容器
            this.tileContainer.appendChild(tile);
        }

        // 计算方块位置
        getTilePosition(row, col) {
            return {
                top: row * (this.tileSize + this.tileSpacing),
                left: col * (this.tileSize + this.tileSpacing)
            };
        }
        
        // 更新所有方块显示
        updateTiles() {
            // 清空方块容器
            this.tileContainer.innerHTML = '';
            this.isNewGame = false; // 更新方块时已不是新游戏
            
            // 重新创建所有方块
            for (let i = 0; i < this.size; i++) {
                for (let j = 0; j < this.size; j++) {
                    if (this.grid[i][j] !== null) {
                        this.createTileElement(i, j, this.grid[i][j]);
                    }
                }
            }
        }
        
        // 移动方块（指定方向）
        move(direction) {
            // 保存移动前的网格状态用于比较
            const previousGrid = JSON.stringify(this.grid);
            let moved = false;
            
            // 根据方向确定遍历顺序
            switch (direction) {
                case 'up':
                    moved = this.moveUp();
                    break;
                case 'right':
                    moved = this.moveRight();
                    break;
                case 'down':
                    moved = this.moveDown();
                    break;
                case 'left':
                    moved = this.moveLeft();
                    break;
            }
            
            // 检查是否有移动
            const gridChanged = previousGrid !== JSON.stringify(this.grid);
            
            if (gridChanged) {
                // 不再是新游戏
                this.isNewGame = false;
                
                // 保存当前状态
                this.saveGameState();
                
                // 添加新方块
                this.addRandomTile();
                
                // 检查游戏状态
                this.checkGameStatus();
            }
            
            return gridChanged;
        }
        
        // 向上移动
        moveUp() {
            let moved = false;
            
            for (let col = 0; col < this.size; col++) {
                for (let row = 1; row < this.size; row++) {
                    if (this.grid[row][col] !== null) {
                        let currentRow = row;
                        
                        // 尝试向上移动方块
                        while (currentRow > 0) {
                            const currValue = this.grid[currentRow][col];
                            const targetRow = currentRow - 1;
                            const targetValue = this.grid[targetRow][col];
                            
                            if (targetValue === null) {
                                // 空格移动
                                this.grid[targetRow][col] = currValue;
                                this.grid[currentRow][col] = null;
                                currentRow--;
                                moved = true;
                            } else if (targetValue === currValue) {
                                // 合并相同值
                                this.grid[targetRow][col] = targetValue * 2;
                                this.grid[currentRow][col] = null;
                                this.score += targetValue * 2;
                                moved = true;
                                break;
                            } else {
                                // 无法继续移动
                                break;
                            }
                        }
                    }
                }
            }
            
            if (moved) {
                this.updateTiles();
                this.updateScore();
            }
            
            return moved;
        }
        
        // 向右移动
        moveRight() {
            let moved = false;
            
            for (let row = 0; row < this.size; row++) {
                for (let col = this.size - 2; col >= 0; col--) {
                    if (this.grid[row][col] !== null) {
                        let currentCol = col;
                        
                        // 尝试向右移动方块
                        while (currentCol < this.size - 1) {
                            const currValue = this.grid[row][currentCol];
                            const targetCol = currentCol + 1;
                            const targetValue = this.grid[row][targetCol];
                            
                            if (targetValue === null) {
                                // 空格移动
                                this.grid[row][targetCol] = currValue;
                                this.grid[row][currentCol] = null;
                                currentCol++;
                                moved = true;
                            } else if (targetValue === currValue) {
                                // 合并相同值
                                this.grid[row][targetCol] = targetValue * 2;
                                this.grid[row][currentCol] = null;
                                this.score += targetValue * 2;
                                moved = true;
                                break;
                            } else {
                                // 无法继续移动
                                break;
                            }
                        }
                    }
                }
            }
            
            if (moved) {
                this.updateTiles();
                this.updateScore();
            }
            
            return moved;
        }
        
        // 向下移动
        moveDown() {
            let moved = false;
            
            for (let col = 0; col < this.size; col++) {
                for (let row = this.size - 2; row >= 0; row--) {
                    if (this.grid[row][col] !== null) {
                        let currentRow = row;
                        
                        // 尝试向下移动方块
                        while (currentRow < this.size - 1) {
                            const currValue = this.grid[currentRow][col];
                            const targetRow = currentRow + 1;
                            const targetValue = this.grid[targetRow][col];
                            
                            if (targetValue === null) {
                                // 空格移动
                                this.grid[targetRow][col] = currValue;
                                this.grid[currentRow][col] = null;
                                currentRow++;
                                moved = true;
                            } else if (targetValue === currValue) {
                                // 合并相同值
                                this.grid[targetRow][col] = targetValue * 2;
                                this.grid[currentRow][col] = null;
                                this.score += targetValue * 2;
                                moved = true;
                                break;
                            } else {
                                // 无法继续移动
                                break;
                            }
                        }
                    }
                }
            }
            
            if (moved) {
                this.updateTiles();
                this.updateScore();
            }
            
            return moved;
        }
        
        // 向左移动
        moveLeft() {
            let moved = false;
            
            for (let row = 0; row < this.size; row++) {
                for (let col = 1; col < this.size; col++) {
                    if (this.grid[row][col] !== null) {
                        let currentCol = col;
                        
                        // 尝试向左移动方块
                        while (currentCol > 0) {
                            const currValue = this.grid[row][currentCol];
                            const targetCol = currentCol - 1;
                            const targetValue = this.grid[row][targetCol];
                            
                            if (targetValue === null) {
                                // 空格移动
                                this.grid[row][targetCol] = currValue;
                                this.grid[row][currentCol] = null;
                                currentCol--;
                                moved = true;
                            } else if (targetValue === currValue) {
                                // 合并相同值
                                this.grid[row][targetCol] = targetValue * 2;
                                this.grid[row][currentCol] = null;
                                this.score += targetValue * 2;
                                moved = true;
                                break;
                            } else {
                                // 无法继续移动
                                break;
                            }
                        }
                    }
                }
            }
            
            if (moved) {
                this.updateTiles();
                this.updateScore();
            }
            
            return moved;
        }
        
        // 检查游戏状态（胜利/失败）
        checkGameStatus() {
            // 检查是否达成2048
            let hasWon = false;
            let hasEmpty = false;
            let canMove = false;
            
            // 检查是否有2048或空单元格
            for (let i = 0; i < this.size; i++) {
                for (let j = 0; j < this.size; j++) {
                    if (this.grid[i][j] === 2048) {
                        hasWon = true;
                    }
                    
                    if (this.grid[i][j] === null) {
                        hasEmpty = true;
                    }
                }
            }
            
            // 如果胜利且未显示胜利消息
            if (hasWon && !this.messageContainer.classList.contains('game-won')) {
                this.messageElement.textContent = '你赢了！';
                this.messageContainer.classList.add('game-won');
                return;
            }
            
            // 如果还有空位，游戏可以继续
            if (hasEmpty) {
                return;
            }
            
            // 检查是否可以移动（合并相同的方块）
            for (let i = 0; i < this.size; i++) {
                for (let j = 0; j < this.size; j++) {
                    const value = this.grid[i][j];
                    
                    // 检查右侧
                    if (j < this.size - 1 && value === this.grid[i][j + 1]) {
                        canMove = true;
                    }
                    
                    // 检查下方
                    if (i < this.size - 1 && value === this.grid[i + 1][j]) {
                        canMove = true;
                    }
                }
            }
            
            // 如果不能移动，游戏结束
            if (!canMove) {
                this.messageElement.textContent = '游戏结束!';
                this.messageContainer.classList.add('game-over');
            }
        }
        
        // 键盘事件监听
        setupKeyboardListeners() {
            document.addEventListener('keydown', event => {
                if (this.messageContainer.classList.contains('game-over') || 
                    this.messageContainer.classList.contains('game-won')) {
                    return; // 游戏结束或胜利，忽略键盘输入
                }
                
                // 防止方向键滚动页面
                if ([37, 38, 39, 40].includes(event.keyCode)) {
                    event.preventDefault();
                }
                
                switch (event.keyCode) {
                    case 38: // 上箭头
                        this.move('up');
                        break;
                    case 39: // 右箭头
                        this.move('right');
                        break;
                    case 40: // 下箭头
                        this.move('down');
                        break;
                    case 37: // 左箭头
                        this.move('left');
                        break;
                }
            });
        }
        
        // 触摸事件监听（滑动控制）
        setupTouchListeners() {
            let touchStartX = 0;
            let touchStartY = 0;
            let touchEndX = 0;
            let touchEndY = 0;
            
            const gameContainer = this.gameContainer;
            
            gameContainer.addEventListener('touchstart', event => {
                touchStartX = event.touches[0].clientX;
                touchStartY = event.touches[0].clientY;
            });
            
            gameContainer.addEventListener('touchmove', event => {
                event.preventDefault(); // 防止滑动时页面滚动
            });
            
            gameContainer.addEventListener('touchend', event => {
                if (this.messageContainer.classList.contains('game-over') || 
                    this.messageContainer.classList.contains('game-won')) {
                    return; // 游戏结束或胜利，忽略触摸输入
                }
                
                touchEndX = event.changedTouches[0].clientX;
                touchEndY = event.changedTouches[0].clientY;
                
                const diffX = touchEndX - touchStartX;
                const diffY = touchEndY - touchStartY;
                
                // 确定滑动方向
                if (Math.abs(diffX) > Math.abs(diffY)) {
                    // 水平滑动
                    if (Math.abs(diffX) > 10) { // 滑动距离要足够大
                        if (diffX > 0) {
                            this.move('right');
                        } else {
                            this.move('left');
                        }
                    }
                } else {
                    // 垂直滑动
                    if (Math.abs(diffY) > 10) { // 滑动距离要足够大
                        if (diffY > 0) {
                            this.move('down');
                        } else {
                            this.move('up');
                        }
                    }
                }
            });
        }
    }
    
    // 创建并启动游戏
    const game = new Game2048();
}); 