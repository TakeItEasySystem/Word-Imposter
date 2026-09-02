# 🎭 Word Imposter - Real-Time Multiplayer Party Game

A fast-paced, real-time multiplayer social deduction and drawing party game built with **Node.js, Express, Socket.IO, React 19, Vite, Tailwind CSS, and HTML5 Canvas**.

---

## 🎮 How to Play

1. **3 Public Words on Screen**: At the start of every round, a trio of related words (e.g., `["Pizza", "Burger", "Taco"]`) is displayed publicly to all players.
2. **Secret Word Assignment (Blind Roles)**:
   - **3 Players (Civilians)** are secretly assigned the *same* word from the trio (e.g. "Pizza").
   - **1 Player (The Imposter)** is secretly assigned a *different* word from the trio (e.g. "Burger").
   - **Crucial Rule:** *Nobody knows if they are a Civilian or the Imposter!*
3. **2 Question Rounds**: Players submit text answers to 2 revealing clue questions.
4. **Drawing Round (20s Total + 7s Live Reveal)**:
   - Players sketch clues representing their secret word.
   - At the 7-second mark, all 4 canvases unlock and stream live side-by-side!
5. **Investigation & Voting**: Review all submissions, debate in the real-time chat, and vote to eliminate the Imposter.
6. **Scoring & Unmasking**: Earn points for catching the imposter or bluffing successfully!

---

## 🛠️ Tech Stack

- **Backend**: Node.js (ES Modules), Express, Socket.IO, CORS
- **Frontend**: React 19, Vite, Tailwind CSS, Lucide React, Canvas-Confetti
- **Audio**: Procedural Web Audio API sound synthesis
- **Testing**: Headless 4-client socket simulation script

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm run install:all
npm install
```

### 2. Run Both Server & Client
```bash
npm start
```

- **Frontend Client**: `http://localhost:5173`
- **Backend Server**: `http://localhost:3001`

---

## 📂 Project Structure

```
word-imposter-game/
├── server/
│   ├── src/
│   │   ├── index.js             # Express & Socket.IO server setup
│   │   ├── gameManager.js       # Game state machine, timers, scoring & bot simulation
│   │   └── wordBank.js          # Curated word trios & tailored question sets
│   ├── test-simulation.js       # Automated 4-player test script
│   └── package.json
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx               # Header with room code copy & sound toggle
│   │   │   ├── Lobby.jsx                # Room creation/joining, bot controls & settings
│   │   │   ├── CandidateWordsBanner.jsx # 3 visible words public banner
│   │   │   ├── WordReveal.jsx           # Secret role & word assignment screen
│   │   │   ├── QuestionPhase.jsx        # Q1 and Q2 prompt answering
│   │   │   ├── DrawingCanvas.jsx        # HTML5 interactive canvas (palette, sizes, undo)
│   │   │   ├── DrawingPhase.jsx         # 20s canvas with 7s live reveal
│   │   │   ├── VotingPhase.jsx          # Evidence review gallery & voting
│   │   │   ├── Scoreboard.jsx           # Imposter reveal, round points & leaderboard
│   │   │   ├── ChatBox.jsx              # In-game live chat drawer with unread badge
│   │   │   └── RulesModal.jsx           # How-to-play popup modal
│   │   ├── utils/
│   │   │   ├── audio.js                 # Procedural Web Audio API sound synthesizers
│   │   │   └── socket.js                # Socket.IO client instance
│   │   ├── App.jsx                      # Main controller & phase switcher
│   │   ├── main.jsx                     # Vite entry point
│   │   └── index.css                    # Tailwind CSS & custom styling
│   └── package.json
├── start-game.bat                       # 1-Click Windows launch script
└── package.json                         # Root orchestration package
```

---

## 📄 License
MIT License
