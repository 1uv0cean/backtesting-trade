const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const LEADERBOARD_FILE = path.join(__dirname, "leaderboard.json");

// Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        "https://the100candles.com",
        "http://localhost:3000",
        "http://localhost:8080",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8080",
      ];

      if (
        allowedOrigins.indexOf(origin) !== -1 ||
        process.env.NODE_ENV !== "production"
      ) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all origins in development
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(express.static(__dirname)); // Serve static files

// Initialize leaderboard file if it doesn't exist
async function initializeLeaderboard() {
  try {
    await fs.access(LEADERBOARD_FILE);
  } catch (error) {
    await fs.writeFile(LEADERBOARD_FILE, JSON.stringify([], null, 2));
  }
}

// Generate or retrieve user ID from cookie
function getOrCreateUserId(req, res) {
  let userId = req.cookies.userId;

  if (!userId) {
    userId = uuidv4();
    res.cookie("userId", userId, {
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  }

  return userId;
}

// Read leaderboard data
async function readLeaderboard() {
  try {
    const data = await fs.readFile(LEADERBOARD_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Write leaderboard data
async function writeLeaderboard(data) {
  await fs.writeFile(LEADERBOARD_FILE, JSON.stringify(data, null, 2));
}

// API Routes

// GET /api/leaderboard - Get top leaderboard entries
app.get("/api/leaderboard", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const leaderboard = await readLeaderboard();

    // Sort by score (descending), then by date (ascending for same score)
    const sorted = leaderboard.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return new Date(a.date) - new Date(b.date);
    });

    // Add rank
    const ranked = sorted.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    res.json({
      success: true,
      leaderboard: ranked.slice(0, limit),
    });
  } catch (error) {
    console.error("Error reading leaderboard:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to read leaderboard" });
  }
});

// POST /api/leaderboard - Submit score to leaderboard
app.post("/api/leaderboard", async (req, res) => {
  try {
    const { nickname, score, equity, totalProfit, totalRoi } = req.body;
    const userId = getOrCreateUserId(req, res);

    // Validation
    if (
      !nickname ||
      typeof nickname !== "string" ||
      nickname.trim().length === 0
    ) {
      return res
        .status(400)
        .json({ success: false, error: "Nickname is required" });
    }

    if (typeof score !== "number" || isNaN(score)) {
      return res
        .status(400)
        .json({ success: false, error: "Valid score is required" });
    }

    // Sanitize nickname
    const sanitizedNickname = nickname.trim().substring(0, 20);

    // Read current leaderboard
    const leaderboard = await readLeaderboard();

    // Create new entry
    const newEntry = {
      id: uuidv4(),
      userId: userId,
      nickname: sanitizedNickname,
      score: score,
      equity: equity || 0,
      totalProfit: totalProfit || 0,
      totalRoi: totalRoi || 0,
      date: new Date().toISOString(),
    };

    // Add to leaderboard
    leaderboard.push(newEntry);

    // Save leaderboard
    await writeLeaderboard(leaderboard);

    // Get user's rank
    const sorted = leaderboard.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return new Date(a.date) - new Date(b.date);
    });

    const userRank = sorted.findIndex((entry) => entry.id === newEntry.id) + 1;

    res.json({
      success: true,
      entry: newEntry,
      rank: userRank,
    });
  } catch (error) {
    console.error("Error submitting to leaderboard:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to submit to leaderboard" });
  }
});

// GET /api/user/me - Get current user info
app.get("/api/user/me", (req, res) => {
  const userId = getOrCreateUserId(req, res);
  res.json({ success: true, userId });
});

// GET /api/user/rank - Get user's current rank
app.get("/api/user/rank", async (req, res) => {
  try {
    const userId = req.cookies.userId;
    if (!userId) {
      return res.json({ success: true, rank: null });
    }

    const leaderboard = await readLeaderboard();
    const userEntries = leaderboard.filter((entry) => entry.userId === userId);

    if (userEntries.length === 0) {
      return res.json({ success: true, rank: null, bestScore: null });
    }

    // Get best score
    const bestEntry = userEntries.reduce((best, current) =>
      current.score > best.score ? current : best
    );

    // Calculate rank
    const sorted = leaderboard.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return new Date(a.date) - new Date(b.date);
    });

    const rank = sorted.findIndex((entry) => entry.id === bestEntry.id) + 1;

    res.json({
      success: true,
      rank: rank,
      bestScore: bestEntry.score,
      bestEntry: bestEntry,
    });
  } catch (error) {
    console.error("Error getting user rank:", error);
    res.status(500).json({ success: false, error: "Failed to get user rank" });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// Serve index.html for root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Initialize and start server
async function startServer() {
  await initializeLeaderboard();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  });
}

startServer().catch(console.error);
