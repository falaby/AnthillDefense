class ChessGame {
    constructor() {
        this.board = this.initializeBoard();
        this.currentPlayer = 'white';
        this.selectedSquare = null;
        this.gameHistory = [];
        this.capturedPieces = { white: [], black: [] };
        
        this.pieceSymbols = {
            white: {
                king: '♔',
                queen: '♕',
                rook: '♖',
                bishop: '♗',
                knight: '♘',
                pawn: '♙'
            },
            black: {
                king: '♚',
                queen: '♛',
                rook: '♜',
                bishop: '♝',
                knight: '♞',
                pawn: '♟'
            }
        };
        
        this.initializeGame();
    }
    
    initializeBoard() {
        const board = Array(8).fill(null).map(() => Array(8).fill(null));
        
        // Set up black pieces
        board[0] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'].map(piece => ({
            type: piece,
            color: 'black'
        }));
        board[1] = Array(8).fill({ type: 'pawn', color: 'black' });
        
        // Set up white pieces
        board[6] = Array(8).fill({ type: 'pawn', color: 'white' });
        board[7] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'].map(piece => ({
            type: piece,
            color: 'white'
        }));
        
        return board;
    }
    
    initializeGame() {
        this.createBoard();
        this.setupEventListeners();
        this.updateStatus();
    }
    
    createBoard() {
        const boardElement = document.getElementById('chessboard');
        boardElement.innerHTML = '';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = `square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
                square.dataset.row = row;
                square.dataset.col = col;
                
                const piece = this.board[row][col];
                if (piece) {
                    const pieceElement = document.createElement('div');
                    pieceElement.className = `piece ${piece.color}`;
                    pieceElement.textContent = this.pieceSymbols[piece.color][piece.type];
                    square.appendChild(pieceElement);
                }
                
                square.addEventListener('click', (e) => this.handleSquareClick(row, col));
                boardElement.appendChild(square);
            }
        }
    }
    
    setupEventListeners() {
        document.getElementById('new-game').addEventListener('click', () => this.newGame());
        document.getElementById('undo-move').addEventListener('click', () => this.undoMove());
    }
    
    handleSquareClick(row, col) {
        const clickedSquare = { row, col };
        
        if (this.selectedSquare) {
            if (this.selectedSquare.row === row && this.selectedSquare.col === col) {
                // Deselect current square
                this.clearSelection();
                return;
            }
            
            if (this.isValidMove(this.selectedSquare, clickedSquare)) {
                this.makeMove(this.selectedSquare, clickedSquare);
                this.clearSelection();
                this.switchPlayer();
                this.updateStatus();
            } else {
                this.clearSelection();
                this.selectSquare(row, col);
            }
        } else {
            this.selectSquare(row, col);
        }
    }
    
    selectSquare(row, col) {
        const piece = this.board[row][col];
        if (piece && piece.color === this.currentPlayer) {
            this.selectedSquare = { row, col };
            this.highlightSquare(row, col);
            this.showValidMoves(row, col);
        }
    }
    
    clearSelection() {
        this.selectedSquare = null;
        this.clearHighlights();
    }
    
    highlightSquare(row, col) {
        const square = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        square.classList.add('selected');
    }
    
    clearHighlights() {
        document.querySelectorAll('.square').forEach(square => {
            square.classList.remove('selected', 'valid-move', 'capture');
        });
    }
    
    showValidMoves(row, col) {
        const piece = this.board[row][col];
        const validMoves = this.getValidMoves(row, col, piece);
        
        validMoves.forEach(move => {
            const square = document.querySelector(`[data-row="${move.row}"][data-col="${move.col}"]`);
            const targetPiece = this.board[move.row][move.col];
            
            if (targetPiece && targetPiece.color !== piece.color) {
                square.classList.add('capture');
            } else {
                square.classList.add('valid-move');
            }
        });
    }
    
    getValidMoves(row, col, piece) {
        const moves = [];
        
        switch (piece.type) {
            case 'pawn':
                moves.push(...this.getPawnMoves(row, col, piece.color));
                break;
            case 'rook':
                moves.push(...this.getRookMoves(row, col, piece.color));
                break;
            case 'bishop':
                moves.push(...this.getBishopMoves(row, col, piece.color));
                break;
            case 'knight':
                moves.push(...this.getKnightMoves(row, col, piece.color));
                break;
            case 'queen':
                moves.push(...this.getQueenMoves(row, col, piece.color));
                break;
            case 'king':
                moves.push(...this.getKingMoves(row, col, piece.color));
                break;
        }
        
        return moves.filter(move => this.isInBounds(move.row, move.col));
    }
    
    getPawnMoves(row, col, color) {
        const moves = [];
        const direction = color === 'white' ? -1 : 1;
        const startRow = color === 'white' ? 6 : 1;
        
        // Forward move
        if (!this.board[row + direction][col]) {
            moves.push({ row: row + direction, col });
            
            // Double move from starting position
            if (row === startRow && !this.board[row + 2 * direction][col]) {
                moves.push({ row: row + 2 * direction, col });
            }
        }
        
        // Diagonal captures
        [-1, 1].forEach(colOffset => {
            const newCol = col + colOffset;
            if (this.isInBounds(row + direction, newCol)) {
                const targetPiece = this.board[row + direction][newCol];
                if (targetPiece && targetPiece.color !== color) {
                    moves.push({ row: row + direction, col: newCol });
                }
            }
        });
        
        return moves;
    }
    
    getRookMoves(row, col, color) {
        const moves = [];
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        
        directions.forEach(([rowDir, colDir]) => {
            for (let i = 1; i < 8; i++) {
                const newRow = row + i * rowDir;
                const newCol = col + i * colDir;
                
                if (!this.isInBounds(newRow, newCol)) break;
                
                const targetPiece = this.board[newRow][newCol];
                if (!targetPiece) {
                    moves.push({ row: newRow, col: newCol });
                } else {
                    if (targetPiece.color !== color) {
                        moves.push({ row: newRow, col: newCol });
                    }
                    break;
                }
            }
        });
        
        return moves;
    }
    
    getBishopMoves(row, col, color) {
        const moves = [];
        const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
        
        directions.forEach(([rowDir, colDir]) => {
            for (let i = 1; i < 8; i++) {
                const newRow = row + i * rowDir;
                const newCol = col + i * colDir;
                
                if (!this.isInBounds(newRow, newCol)) break;
                
                const targetPiece = this.board[newRow][newCol];
                if (!targetPiece) {
                    moves.push({ row: newRow, col: newCol });
                } else {
                    if (targetPiece.color !== color) {
                        moves.push({ row: newRow, col: newCol });
                    }
                    break;
                }
            }
        });
        
        return moves;
    }
    
    getKnightMoves(row, col, color) {
        const moves = [];
        const knightMoves = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        
        knightMoves.forEach(([rowOffset, colOffset]) => {
            const newRow = row + rowOffset;
            const newCol = col + colOffset;
            
            if (this.isInBounds(newRow, newCol)) {
                const targetPiece = this.board[newRow][newCol];
                if (!targetPiece || targetPiece.color !== color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        });
        
        return moves;
    }
    
    getQueenMoves(row, col, color) {
        return [
            ...this.getRookMoves(row, col, color),
            ...this.getBishopMoves(row, col, color)
        ];
    }
    
    getKingMoves(row, col, color) {
        const moves = [];
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
        
        directions.forEach(([rowOffset, colOffset]) => {
            const newRow = row + rowOffset;
            const newCol = col + colOffset;
            
            if (this.isInBounds(newRow, newCol)) {
                const targetPiece = this.board[newRow][newCol];
                if (!targetPiece || targetPiece.color !== color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        });
        
        return moves;
    }
    
    isInBounds(row, col) {
        return row >= 0 && row < 8 && col >= 0 && col < 8;
    }
    
    isValidMove(from, to) {
        const piece = this.board[from.row][from.col];
        if (!piece || piece.color !== this.currentPlayer) return false;
        
        const validMoves = this.getValidMoves(from.row, from.col, piece);
        return validMoves.some(move => move.row === to.row && move.col === to.col);
    }
    
    makeMove(from, to) {
        const piece = this.board[from.row][from.col];
        const capturedPiece = this.board[to.row][to.col];
        
        // Save move to history
        this.gameHistory.push({
            from: { ...from },
            to: { ...to },
            piece: { ...piece },
            capturedPiece: capturedPiece ? { ...capturedPiece } : null,
            player: this.currentPlayer
        });
        
        // Handle captured piece
        if (capturedPiece) {
            this.capturedPieces[capturedPiece.color].push(capturedPiece);
            this.updateCapturedPieces();
            this.animateCapture(to.row, to.col);
        }
        
        // Move piece
        this.board[to.row][to.col] = piece;
        this.board[from.row][from.col] = null;
        
        // Animate move
        this.animateMove(from, to);
        
        // Update display
        setTimeout(() => {
            this.createBoard();
        }, 300);
    }
    
    animateMove(from, to) {
        const fromSquare = document.querySelector(`[data-row="${from.row}"][data-col="${from.col}"]`);
        const toSquare = document.querySelector(`[data-row="${to.row}"][data-col="${to.col}"]`);
        
        fromSquare.style.transform = 'scale(1.2)';
        toSquare.style.background = 'radial-gradient(circle, #ffd700 0%, #ffa500 100%)';
        
        setTimeout(() => {
            fromSquare.style.transform = '';
            toSquare.style.background = '';
        }, 300);
    }
    
    animateCapture(row, col) {
        const square = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        square.style.animation = 'capture 0.5s ease-in-out';
        
        setTimeout(() => {
            square.style.animation = '';
        }, 500);
    }
    
    updateCapturedPieces() {
        ['white', 'black'].forEach(color => {
            const container = document.getElementById(`captured-${color}`);
            container.innerHTML = '';
            
            this.capturedPieces[color].forEach(piece => {
                const pieceElement = document.createElement('div');
                pieceElement.className = `piece ${piece.color}`;
                pieceElement.textContent = this.pieceSymbols[piece.color][piece.type];
                container.appendChild(pieceElement);
            });
        });
    }
    
    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';
        
        // Update player indicators
        document.querySelectorAll('.player-indicator').forEach(indicator => {
            indicator.classList.remove('active');
        });
        
        document.querySelector(`.player-indicator.${this.currentPlayer}`).classList.add('active');
    }
    
    updateStatus() {
        const statusElement = document.getElementById('status');
        const playerName = this.currentPlayer === 'white' ? "White" : "Black";
        statusElement.textContent = `${playerName}'s Turn`;
        
        // Check for checkmate/stalemate (simplified)
        if (this.isGameOver()) {
            const winner = this.currentPlayer === 'white' ? 'Black' : 'White';
            statusElement.textContent = `${winner} Wins!`;
            statusElement.style.color = '#ffd700';
            statusElement.style.animation = 'glow 1s ease-in-out infinite alternate';
        }
    }
    
    isGameOver() {
        // Simplified game over detection - check if king is captured
        const currentKingExists = this.board.some(row => 
            row.some(piece => piece && piece.type === 'king' && piece.color === this.currentPlayer)
        );
        
        return !currentKingExists;
    }
    
    newGame() {
        this.board = this.initializeBoard();
        this.currentPlayer = 'white';
        this.selectedSquare = null;
        this.gameHistory = [];
        this.capturedPieces = { white: [], black: [] };
        
        this.createBoard();
        this.updateCapturedPieces();
        this.updateStatus();
        
        // Reset status styling
        const statusElement = document.getElementById('status');
        statusElement.style.color = '';
        statusElement.style.animation = '';
        
        // Reset player indicators
        document.querySelectorAll('.player-indicator').forEach(indicator => {
            indicator.classList.remove('active');
        });
        document.querySelector('.player-indicator.white').classList.add('active');
    }
    
    undoMove() {
        if (this.gameHistory.length === 0) return;
        
        const lastMove = this.gameHistory.pop();
        
        // Restore piece positions
        this.board[lastMove.from.row][lastMove.from.col] = lastMove.piece;
        this.board[lastMove.to.row][lastMove.to.col] = lastMove.capturedPiece;
        
        // Restore captured pieces
        if (lastMove.capturedPiece) {
            const capturedArray = this.capturedPieces[lastMove.capturedPiece.color];
            const index = capturedArray.findIndex(piece => 
                piece.type === lastMove.capturedPiece.type
            );
            if (index !== -1) {
                capturedArray.splice(index, 1);
            }
        }
        
        // Switch back to previous player
        this.currentPlayer = lastMove.player;
        
        // Update display
        this.createBoard();
        this.updateCapturedPieces();
        this.updateStatus();
        this.clearSelection();
        
        // Update player indicators
        document.querySelectorAll('.player-indicator').forEach(indicator => {
            indicator.classList.remove('active');
        });
        document.querySelector(`.player-indicator.${this.currentPlayer}`).classList.add('active');
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new ChessGame();
});

// Add particle effects
function createParticles() {
    const particleContainer = document.querySelector('.particle-background');
    
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.width = Math.random() * 3 + 1 + 'px';
        particle.style.height = particle.style.width;
        particle.style.background = '#fff';
        particle.style.borderRadius = '50%';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.opacity = Math.random() * 0.8 + 0.2;
        particle.style.animation = `sparkle ${Math.random() * 20 + 10}s linear infinite`;
        particle.style.animationDelay = Math.random() * 20 + 's';
        
        particleContainer.appendChild(particle);
    }
}

// Create particles when page loads
document.addEventListener('DOMContentLoaded', createParticles);

// Tetris Game Implementation
class TetrisGame {
    constructor() {
        this.canvas = document.getElementById('tetris-board');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('next-piece');
        this.nextCtx = this.nextCanvas.getContext('2d');

        this.rows = 20;
        this.cols = 10;
        this.blockSize = 30;

        this.board = [];
        this.currentPiece = null;
        this.nextPiece = null;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameRunning = false;
        this.gamePaused = false;
        this.dropCounter = 0;
        this.dropInterval = 1000;
        this.lastTime = 0;

        this.pieces = {
            I: [
                [[1,1,1,1]],
                [[1],[1],[1],[1]]
            ],
            O: [
                [[1,1],[1,1]]
            ],
            T: [
                [[0,1,0],[1,1,1]],
                [[1,0],[1,1],[1,0]],
                [[1,1,1],[0,1,0]],
                [[0,1],[1,1],[0,1]]
            ],
            S: [
                [[0,1,1],[1,1,0]],
                [[1,0],[1,1],[0,1]]
            ],
            Z: [
                [[1,1,0],[0,1,1]],
                [[0,1],[1,1],[1,0]]
            ],
            J: [
                [[1,0,0],[1,1,1]],
                [[1,1],[1,0],[1,0]],
                [[1,1,1],[0,0,1]],
                [[0,1],[0,1],[1,1]]
            ],
            L: [
                [[0,0,1],[1,1,1]],
                [[1,0],[1,0],[1,1]],
                [[1,1,1],[1,0,0]],
                [[1,1],[0,1],[0,1]]
            ]
        };

        this.colors = {
            I: '#00ffff',
            O: '#ffff00',
            T: '#800080',
            S: '#00ff00',
            Z: '#ff0000',
            J: '#0000ff',
            L: '#ffa500'
        };

        this.initializeBoard();
        this.setupEventListeners();
        this.setupKeyboardControls();
    }

    initializeBoard() {
        this.board = Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
    }

    setupEventListeners() {
        document.getElementById('tetris-start').addEventListener('click', () => this.startGame());
        document.getElementById('tetris-pause').addEventListener('click', () => this.togglePause());
        document.getElementById('tetris-reset').addEventListener('click', () => this.resetGame());
    }

    setupKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning || this.gamePaused) return;

            switch(e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    this.movePiece(-1, 0);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.movePiece(1, 0);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.movePiece(0, 1);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.rotatePiece();
                    break;
                case ' ':
                    e.preventDefault();
                    this.hardDrop();
                    break;
            }
        });
    }

    createPiece() {
        const types = Object.keys(this.pieces);
        const type = types[Math.floor(Math.random() * types.length)];
        return {
            type: type,
            shape: this.pieces[type][0],
            rotation: 0,
            x: Math.floor(this.cols / 2) - 1,
            y: 0,
            color: this.colors[type]
        };
    }

    startGame() {
        if (this.gameRunning) return;

        this.gameRunning = true;
        this.gamePaused = false;
        this.currentPiece = this.createPiece();
        this.nextPiece = this.createPiece();
        this.hideGameOver();
        this.updateNextPiece();
        this.gameLoop();

        document.getElementById('tetris-start').textContent = 'Playing...';
        document.getElementById('tetris-start').disabled = true;
    }

    togglePause() {
        if (!this.gameRunning) return;

        this.gamePaused = !this.gamePaused;
        document.getElementById('tetris-pause').textContent = this.gamePaused ? 'Resume' : 'Pause';

        if (!this.gamePaused) {
            this.gameLoop();
        }
    }

    resetGame() {
        this.gameRunning = false;
        this.gamePaused = false;
        this.initializeBoard();
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.dropCounter = 0;
        this.dropInterval = 1000;
        this.currentPiece = null;
        this.nextPiece = null;

        this.updateStats();
        this.draw();
        this.clearNextPiece();
        this.hideGameOver();

        document.getElementById('tetris-start').textContent = 'Start';
        document.getElementById('tetris-start').disabled = false;
        document.getElementById('tetris-pause').textContent = 'Pause';
    }

    gameLoop(time = 0) {
        if (!this.gameRunning || this.gamePaused) return;

        const deltaTime = time - this.lastTime;
        this.lastTime = time;
        this.dropCounter += deltaTime;

        if (this.dropCounter > this.dropInterval) {
            this.movePiece(0, 1);
            this.dropCounter = 0;
        }

        this.draw();
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    movePiece(dx, dy) {
        if (!this.currentPiece) return;

        const newX = this.currentPiece.x + dx;
        const newY = this.currentPiece.y + dy;

        if (this.isValidMove(this.currentPiece.shape, newX, newY)) {
            this.currentPiece.x = newX;
            this.currentPiece.y = newY;
        } else if (dy > 0) {
            this.placePiece();
        }
    }

    rotatePiece() {
        if (!this.currentPiece) return;

        const rotations = this.pieces[this.currentPiece.type];
        const nextRotation = (this.currentPiece.rotation + 1) % rotations.length;
        const rotatedShape = rotations[nextRotation];

        if (this.isValidMove(rotatedShape, this.currentPiece.x, this.currentPiece.y)) {
            this.currentPiece.shape = rotatedShape;
            this.currentPiece.rotation = nextRotation;
        }
    }

    hardDrop() {
        if (!this.currentPiece) return;

        while (this.isValidMove(this.currentPiece.shape, this.currentPiece.x, this.currentPiece.y + 1)) {
            this.currentPiece.y++;
        }
        this.placePiece();
    }

    isValidMove(shape, x, y) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const newX = x + col;
                    const newY = y + row;

                    if (newX < 0 || newX >= this.cols || newY >= this.rows) {
                        return false;
                    }

                    if (newY >= 0 && this.board[newY][newX]) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    placePiece() {
        if (!this.currentPiece) return;

        const shape = this.currentPiece.shape;
        const x = this.currentPiece.x;
        const y = this.currentPiece.y;

        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const boardY = y + row;
                    const boardX = x + col;

                    if (boardY >= 0) {
                        this.board[boardY][boardX] = this.currentPiece.color;
                    }
                }
            }
        }

        this.clearLines();
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.createPiece();
        this.updateNextPiece();

        if (!this.isValidMove(this.currentPiece.shape, this.currentPiece.x, this.currentPiece.y)) {
            this.gameOver();
        }
    }

    clearLines() {
        let linesCleared = 0;

        for (let row = this.rows - 1; row >= 0; row--) {
            if (this.board[row].every(cell => cell !== 0)) {
                this.board.splice(row, 1);
                this.board.unshift(Array(this.cols).fill(0));
                linesCleared++;
                row++; // Check the same row again
            }
        }

        if (linesCleared > 0) {
            this.lines += linesCleared;
            this.score += this.calculateScore(linesCleared);
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
            this.updateStats();
        }
    }

    calculateScore(linesCleared) {
        const baseScore = [0, 40, 100, 300, 1200];
        return baseScore[linesCleared] * this.level;
    }

    gameOver() {
        this.gameRunning = false;
        this.showGameOver();
        document.getElementById('tetris-start').textContent = 'Start';
        document.getElementById('tetris-start').disabled = false;
        document.getElementById('tetris-pause').textContent = 'Pause';
    }

    showGameOver() {
        document.getElementById('tetris-game-over').style.display = 'flex';
    }

    hideGameOver() {
        document.getElementById('tetris-game-over').style.display = 'none';
    }

    updateStats() {
        document.getElementById('tetris-score').textContent = this.score;
        document.getElementById('tetris-level').textContent = this.level;
        document.getElementById('tetris-lines').textContent = this.lines;
    }

    updateNextPiece() {
        this.clearNextPiece();
        if (!this.nextPiece) return;

        const shape = this.nextPiece.shape;
        const blockSize = 20;
        const offsetX = (this.nextCanvas.width - shape[0].length * blockSize) / 2;
        const offsetY = (this.nextCanvas.height - shape.length * blockSize) / 2;

        this.nextCtx.fillStyle = this.nextPiece.color;
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    this.nextCtx.fillRect(
                        offsetX + col * blockSize,
                        offsetY + row * blockSize,
                        blockSize - 1,
                        blockSize - 1
                    );
                }
            }
        }
    }

    clearNextPiece() {
        this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw board
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.board[row][col]) {
                    this.ctx.fillStyle = this.board[row][col];
                    this.ctx.fillRect(
                        col * this.blockSize,
                        row * this.blockSize,
                        this.blockSize - 1,
                        this.blockSize - 1
                    );
                }
            }
        }

        // Draw current piece
        if (this.currentPiece) {
            this.ctx.fillStyle = this.currentPiece.color;
            const shape = this.currentPiece.shape;
            for (let row = 0; row < shape.length; row++) {
                for (let col = 0; col < shape[row].length; col++) {
                    if (shape[row][col]) {
                        this.ctx.fillRect(
                            (this.currentPiece.x + col) * this.blockSize,
                            (this.currentPiece.y + row) * this.blockSize,
                            this.blockSize - 1,
                            this.blockSize - 1
                        );
                    }
                }
            }
        }

        // Draw grid
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        for (let row = 0; row <= this.rows; row++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, row * this.blockSize);
            this.ctx.lineTo(this.canvas.width, row * this.blockSize);
            this.ctx.stroke();
        }
        for (let col = 0; col <= this.cols; col++) {
            this.ctx.beginPath();
            this.ctx.moveTo(col * this.blockSize, 0);
            this.ctx.lineTo(col * this.blockSize, this.canvas.height);
            this.ctx.stroke();
        }
    }
}

// Initialize Tetris when page loads
document.addEventListener('DOMContentLoaded', () => {
    new TetrisGame();
});

// Snake Game Implementation
class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('snake-board');
        this.ctx = this.canvas.getContext('2d');

        this.gridSize = 20;
        this.tileCount = this.canvas.width / this.gridSize;

        this.snake = [
            {x: 10, y: 10}
        ];
        this.food = {x: 15, y: 15};
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
        this.speed = 1;
        this.gameRunning = false;
        this.gamePaused = false;
        this.gameLoop = null;
        this.baseSpeed = 200;

        this.setupEventListeners();
        this.setupKeyboardControls();
        this.updateStats();
        this.draw();
    }

    setupEventListeners() {
        document.getElementById('snake-start').addEventListener('click', () => this.startGame());
        document.getElementById('snake-pause').addEventListener('click', () => this.togglePause());
        document.getElementById('snake-reset').addEventListener('click', () => this.resetGame());
    }

    setupKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            if (!this.gameRunning || this.gamePaused) return;

            const key = e.key.toLowerCase();

            // Prevent reverse direction
            switch(key) {
                case 'arrowleft':
                case 'a':
                    if (this.dx !== 1) {
                        this.dx = -1;
                        this.dy = 0;
                    }
                    e.preventDefault();
                    break;
                case 'arrowright':
                case 'd':
                    if (this.dx !== -1) {
                        this.dx = 1;
                        this.dy = 0;
                    }
                    e.preventDefault();
                    break;
                case 'arrowup':
                case 'w':
                    if (this.dy !== 1) {
                        this.dx = 0;
                        this.dy = -1;
                    }
                    e.preventDefault();
                    break;
                case 'arrowdown':
                case 's':
                    if (this.dy !== -1) {
                        this.dx = 0;
                        this.dy = 1;
                    }
                    e.preventDefault();
                    break;
            }
        });
    }

    startGame() {
        if (this.gameRunning) return;

        this.gameRunning = true;
        this.gamePaused = false;
        this.dx = 1;
        this.dy = 0;
        this.hideGameOver();
        this.gameLoop = setInterval(() => this.update(), this.baseSpeed);

        document.getElementById('snake-start').textContent = 'Playing...';
        document.getElementById('snake-start').disabled = true;
    }

    togglePause() {
        if (!this.gameRunning) return;

        this.gamePaused = !this.gamePaused;
        document.getElementById('snake-pause').textContent = this.gamePaused ? 'Resume' : 'Pause';

        if (this.gamePaused) {
            clearInterval(this.gameLoop);
        } else {
            this.gameLoop = setInterval(() => this.update(), this.baseSpeed - (this.speed - 1) * 20);
        }
    }

    resetGame() {
        this.gameRunning = false;
        this.gamePaused = false;
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
        }

        this.snake = [{x: 10, y: 10}];
        this.food = this.generateFood();
        this.dx = 0;
        this.dy = 0;
        this.score = 0;
        this.speed = 1;

        this.updateStats();
        this.draw();
        this.hideGameOver();

        document.getElementById('snake-start').textContent = 'Start';
        document.getElementById('snake-start').disabled = false;
        document.getElementById('snake-pause').textContent = 'Pause';
    }

    update() {
        if (!this.gameRunning || this.gamePaused) return;

        this.moveSnake();

        if (this.checkCollision()) {
            this.gameOver();
            return;
        }

        if (this.checkFoodCollision()) {
            this.eatFood();
        }

        this.draw();
    }

    moveSnake() {
        const head = {x: this.snake[0].x + this.dx, y: this.snake[0].y + this.dy};
        this.snake.unshift(head);

        if (!this.checkFoodCollision()) {
            this.snake.pop();
        }
    }

    checkCollision() {
        const head = this.snake[0];

        // Wall collision
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            return true;
        }

        // Self collision
        for (let i = 1; i < this.snake.length; i++) {
            if (head.x === this.snake[i].x && head.y === this.snake[i].y) {
                return true;
            }
        }

        return false;
    }

    checkFoodCollision() {
        const head = this.snake[0];
        return head.x === this.food.x && head.y === this.food.y;
    }

    eatFood() {
        this.score += 10;
        this.speed = Math.floor(this.score / 50) + 1;

        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('snakeHighScore', this.highScore.toString());
        }

        this.updateStats();
        this.food = this.generateFood();

        // Increase game speed
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = setInterval(() => this.update(), Math.max(80, this.baseSpeed - (this.speed - 1) * 20));
        }
    }

    generateFood() {
        let newFood;
        do {
            newFood = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
        } while (this.snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));

        return newFood;
    }

    gameOver() {
        this.gameRunning = false;
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
        }

        this.showGameOver();
        document.getElementById('snake-start').textContent = 'Start';
        document.getElementById('snake-start').disabled = false;
        document.getElementById('snake-pause').textContent = 'Pause';
    }

    showGameOver() {
        document.getElementById('snake-game-over').style.display = 'flex';
    }

    hideGameOver() {
        document.getElementById('snake-game-over').style.display = 'none';
    }

    updateStats() {
        document.getElementById('snake-score').textContent = this.score;
        document.getElementById('snake-high-score').textContent = this.highScore;
        document.getElementById('snake-speed').textContent = this.speed;
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#000511';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.ctx.strokeStyle = '#002244';
        this.ctx.lineWidth = 1;
        for (let i = 0; i <= this.tileCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }

        // Draw snake
        this.snake.forEach((segment, index) => {
            if (index === 0) {
                // Snake head
                this.ctx.fillStyle = '#00ff88';
                this.ctx.shadowColor = '#00ff88';
                this.ctx.shadowBlur = 10;
            } else {
                // Snake body
                this.ctx.fillStyle = '#00aa44';
                this.ctx.shadowColor = '#00aa44';
                this.ctx.shadowBlur = 5;
            }

            this.ctx.fillRect(
                segment.x * this.gridSize + 1,
                segment.y * this.gridSize + 1,
                this.gridSize - 2,
                this.gridSize - 2
            );
        });

        // Draw food
        this.ctx.fillStyle = '#ff0066';
        this.ctx.shadowColor = '#ff0066';
        this.ctx.shadowBlur = 15;
        this.ctx.fillRect(
            this.food.x * this.gridSize + 2,
            this.food.y * this.gridSize + 2,
            this.gridSize - 4,
            this.gridSize - 4
        );

        // Reset shadow
        this.ctx.shadowBlur = 0;
    }
}

// Initialize Snake when page loads
document.addEventListener('DOMContentLoaded', () => {
    new SnakeGame();
});