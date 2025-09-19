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