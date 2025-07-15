import React, { useCallback, useEffect, useState } from "react";
import "./App.css";

// Color palette from requirements
const COLORS = {
  primary: "#1976d2",
  secondary: "#eeeeee",
  accent: "#ff9800",
};

/**
 * Returns the winner of a tic tac toe board or null if there isn't one.
 * @param {string[]} squares 
 * @returns {'X'|'O'|null}
 */
function calculateWinner(squares) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6]             // diagonals
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (
      squares[a] &&
      squares[a] === squares[b] &&
      squares[a] === squares[c]
    ) {
      return squares[a];
    }
  }
  return null;
}

/**
 * Returns indices of empty squares
 */
function getEmptyIndices(squares) {
  return squares
    .map((val, idx) => (val === null ? idx : null))
    .filter(idx => idx !== null);
}

/**
 * Naive AI: checks for win, then block, then center, corners, sides.
 */
function bestAIMove(squares, AI, player) {
  const winLines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  // Try to win
  for (const [a, b, c] of winLines) {
    const seq = [squares[a], squares[b], squares[c]];
    if (
      seq.filter(v => v === AI).length === 2 &&
      seq.filter(v => v === null).length === 1
    ) {
      const idx = [a, b, c][seq.indexOf(null)];
      return idx;
    }
  }
  // Try to block
  for (const [a, b, c] of winLines) {
    const seq = [squares[a], squares[b], squares[c]];
    if (
      seq.filter(v => v === player).length === 2 &&
      seq.filter(v => v === null).length === 1
    ) {
      const idx = [a, b, c][seq.indexOf(null)];
      return idx;
    }
  }
  // Take center
  if (squares[4] === null) return 4;
  // Take a corner
  const corners = [0, 2, 6, 8];
  for (const idx of corners) if (squares[idx] === null) return idx;
  // Take any side
  const sides = [1, 3, 5, 7];
  for (const idx of sides) if (squares[idx] === null) return idx;
  // Otherwise, random
  const empty = getEmptyIndices(squares);
  return empty[Math.floor(Math.random() * empty.length)];
}

const GAME_MODES = {
  PVP: "Player vs Player",
  AI: "Player vs AI"
};

// PUBLIC_INTERFACE
function App() {
  // Game state
  const [gameMode, setGameMode] = useState(GAME_MODES.PVP);
  const [board, setBoard] = useState(Array(9).fill(null));
  const [current, setCurrent] = useState("X");
  const [scores, setScores] = useState({
    X: 0,
    O: 0,
    draw: 0
  });
  const [winner, setWinner] = useState(null);
  const [waiting, setWaiting] = useState(false); // For AI
  const [aiGoesFirst, setAiGoesFirst] = useState(false);

  // PUBLIC_INTERFACE
  const handleModeChange = mode => {
    setGameMode(mode);
    setBoard(Array(9).fill(null));
    setScores({ X: 0, O: 0, draw: 0 });
    setWinner(null);
    setCurrent("X");
    setWaiting(false);
    setAiGoesFirst(false);
  };

  // PUBLIC_INTERFACE
  const startNewGame = useCallback(
    (aiFirst = false) => {
      setBoard(Array(9).fill(null));
      setWinner(null);
      setWaiting(false);
      setCurrent("X");
      setAiGoesFirst(aiFirst);
      if (aiFirst && gameMode === GAME_MODES.AI) {
        setWaiting(true);
      }
    },
    [gameMode]
  );

  // PUBLIC_INTERFACE
  const handleSquareClick = idx => {
    if (winner || board[idx] || (gameMode === GAME_MODES.AI && waiting)) return;
    const newBoard = board.slice();
    newBoard[idx] = current;
    const win = calculateWinner(newBoard);
    setBoard(newBoard);
    if (win) {
      setWinner(win);
      setScores(scores => ({
        ...scores,
        [win]: scores[win] + 1
      }));
      return;
    }
    if (newBoard.every(Boolean)) {
      setWinner("draw");
      setScores(scores => ({
        ...scores,
        draw: scores.draw + 1
      }));
    } else {
      setCurrent(cur => (cur === "X" ? "O" : "X"));
      if (
        gameMode === GAME_MODES.AI &&
        current === "X"
      ) {
        setWaiting(true);
      }
    }
  };

  // AI Move Effect
  useEffect(() => {
    if (
      gameMode === GAME_MODES.AI &&
      ((aiGoesFirst && board.filter(Boolean).length === 0) ||
        (current === "O" && !winner && !waiting))
    ) {
      setWaiting(true);
      const move = bestAIMove(board, "O", "X");
      setTimeout(() => {
        const newBoard = board.slice();
        newBoard[move] = "O";
        const win = calculateWinner(newBoard);
        setBoard(newBoard);
        if (win) {
          setWinner(win);
          setScores(scores => ({
            ...scores,
            [win]: scores[win] + 1
          }));
          setWaiting(false);
          return;
        }
        if (newBoard.every(Boolean)) {
          setWinner("draw");
          setScores(scores => ({
            ...scores,
            draw: scores.draw + 1
          }));
          setWaiting(false);
        } else {
          setCurrent("X");
          setWaiting(false);
        }
      }, 450);
    }
    // eslint-disable-next-line
  }, [board, current, winner, gameMode, aiGoesFirst, waiting]);

  // Auto-move for AI first
  useEffect(() => {
    if (
      gameMode === GAME_MODES.AI &&
      aiGoesFirst &&
      board.every(sq => sq === null)
    ) {
      setWaiting(true);
      setTimeout(() => {
        const newBoard = board.slice();
        const move = bestAIMove(newBoard, "O", "X");
        newBoard[move] = "O";
        setBoard(newBoard);
        setCurrent("X");
        setWaiting(false);
      }, 400);
    }
    // eslint-disable-next-line
  }, [aiGoesFirst, gameMode]);

  // PUBLIC_INTERFACE
  const boardGrid = () => (
    <div className="board-grid">
      {board.map((val, idx) => (
        <button
          key={idx}
          className="board-cell"
          aria-label={`Cell ${idx + 1}`}
          style={{
            color: val === "X" ? COLORS.primary : val === "O" ? COLORS.accent : "#333",
            cursor: winner || board[idx] || (gameMode === GAME_MODES.AI && waiting) ? "not-allowed" : "pointer",
            background: val
              ? "#fff"
              : COLORS.secondary,
          }}
          onClick={() => handleSquareClick(idx)}
          tabIndex={0}
          disabled={!!val || !!winner || (gameMode === GAME_MODES.AI && waiting)}
        >
          {val}
        </button>
      ))}
    </div>
  );

  // PUBLIC_INTERFACE
  const headerSection = () => (
    <div className="game-header">
      <h1 className="game-title" style={{ color: COLORS.primary }}>
        Tic Tac Toe
      </h1>
      <p className="game-desc" style={{ color: "#4a4a4a", letterSpacing: 1 }}>
        {gameMode === GAME_MODES.PVP
          ? "Player X vs Player O"
          : `You (${aiGoesFirst ? "O" : "X"}) vs AI (${aiGoesFirst ? "X" : "O"})`}
      </p>
      <div className="game-mode-pick">
        <button
          className="mode-btn"
          aria-label="Player vs Player"
          style={{
            background: gameMode === GAME_MODES.PVP ? COLORS.primary : "#fff",
            color: gameMode === GAME_MODES.PVP ? "#fff" : COLORS.primary,
            borderColor: COLORS.primary
          }}
          onClick={() => handleModeChange(GAME_MODES.PVP)}
          disabled={gameMode === GAME_MODES.PVP}
        >
          PvP
        </button>
        <button
          className="mode-btn"
          aria-label="Player vs AI"
          style={{
            background: gameMode === GAME_MODES.AI ? COLORS.accent : "#fff",
            color: gameMode === GAME_MODES.AI ? "#fff" : COLORS.accent,
            borderColor: COLORS.accent
          }}
          onClick={() => handleModeChange(GAME_MODES.AI)}
          disabled={gameMode === GAME_MODES.AI}
        >
          Vs AI
        </button>
      </div>
      {gameMode === GAME_MODES.AI && (
        <div style={{ marginTop: 12 }}>
          <span style={{ color: "#444" }}>AI Goes First?</span>
          <input
            id="ai-goes-first"
            type="checkbox"
            checked={aiGoesFirst}
            style={{ marginLeft: 8, accentColor: COLORS.accent }}
            onChange={e => startNewGame(e.target.checked)}
            aria-label="AI goes first"
          />
        </div>
      )}
    </div>
  );

  // PUBLIC_INTERFACE
  const scoreSection = () => (
    <div className="score-section">
      <div className="score-block">
        <span className="score-label" style={{ color: COLORS.primary }}>X</span>
        <span className="score-value">{scores.X}</span>
      </div>
      <div className="score-block">
        <span className="score-label" style={{ color: COLORS.accent }}>O</span>
        <span className="score-value">{scores.O}</span>
      </div>
      <div className="score-block">
        <span className="score-label" style={{ color: "#888" }}>Draw</span>
        <span className="score-value">{scores.draw}</span>
      </div>
    </div>
  );

  // PUBLIC_INTERFACE
  const gameStatus = () => {
    if (winner === "draw") {
      return "It's a Draw!";
    }
    if (winner) {
      return `Winner: ${winner}`;
    }
    if (gameMode === GAME_MODES.AI && waiting) {
      return "AI is thinking...";
    }
    return `Turn: ${current}`;
  };

  // PUBLIC_INTERFACE
  return (
    <div className="tic-tac-container">
      {headerSection()}
      {scoreSection()}
      <div className="game-main">
        {boardGrid()}
      </div>
      <div className="result-section">
        <span
          className={`game-status ${winner ? "status-finished" : ""}`}
          style={{
            color: winner
              ? winner === "draw"
                ? "#444"
                : winner === "X"
                ? COLORS.primary
                : COLORS.accent
              : COLORS.primary
          }}
        >
          {gameStatus()}
        </span>
      </div>
      <div style={{ marginTop: 12 }}>
        <button
          className="reset-btn"
          style={{
            background: COLORS.primary,
            color: "#fff",
            border: "none"
          }}
          aria-label="New Game"
          onClick={() => startNewGame(aiGoesFirst)}
        >
          New Game
        </button>
      </div>
      <footer style={{ marginTop: 38, fontSize: 14, color: "#999" }}>
        Made with <span style={{ color: COLORS.accent, fontWeight: "bold" }}>React</span> · Modern Minimal UI
      </footer>
    </div>
  );
}

export default App;
