# The 100 Candles - Backtesting Trade Game

A trading backtesting game with leaderboard functionality.

## Features

- Trading simulation game
- Leaderboard system (nickname-based)
- Browser-based user identification (cookie-based)
- Real-time ranking display

## Installation and Setup

### Development Environment

```bash
# Install dependencies
npm install

# Run development server (port 3000)
npm run dev
```

### Production Environment

```bash
# Install dependencies
npm install

# Start server
npm start
```

Environment Variables:
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment setting (production/development)

## API Endpoints

### GET /api/leaderboard
Get leaderboard entries
- Query Parameters:
  - `limit`: Number of entries to return (default: 100)

### POST /api/leaderboard
Submit score to leaderboard
- Body:
  ```json
  {
    "nickname": "User nickname",
    "score": 10000,
    "equity": 10000,
    "totalProfit": 0,
    "totalRoi": 0
  }
  ```

### GET /api/user/me
Get current user information

### GET /api/user/rank
Get current user's rank

### GET /api/health
Server health check

## Deployment

The project is deployed at `https://the100candles.com/`.

The server uses Express and serves static files (HTML, CSS, JS) while handling API endpoints.

## Data Storage

Leaderboard data is stored in the `leaderboard.json` file. This file is included in `.gitignore` and will not be committed to Git.
