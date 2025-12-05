const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const LEADERBOARD_FILE = path.join(__dirname, "leaderboard.json");
const USERS_FILE = path.join(__dirname, "users.json");

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

// Initialize users file if it doesn't exist
async function initializeUsers() {
  try {
    await fs.access(USERS_FILE);
  } catch (error) {
    await fs.writeFile(USERS_FILE, JSON.stringify({}, null, 2));
  }
}

// Read users data
async function readUsers() {
  try {
    const data = await fs.readFile(USERS_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

// Write users data
async function writeUsers(data) {
  await fs.writeFile(USERS_FILE, JSON.stringify(data, null, 2));
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

    // Group by userId and keep only the best entry per user
    const userBestEntries = {};
    leaderboard.forEach((entry) => {
      if (
        !userBestEntries[entry.userId] ||
        entry.score > userBestEntries[entry.userId].score
      ) {
        userBestEntries[entry.userId] = entry;
      }
    });

    // Convert back to array
    const uniqueEntries = Object.values(userBestEntries);

    // Sort by score (descending), then by date (ascending for same score)
    const sorted = uniqueEntries.sort((a, b) => {
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

    // Remove all existing entries for this user (to ensure only one entry per user)
    const filteredLeaderboard = leaderboard.filter(
      (entry) => entry.userId !== userId
    );

    // Find the best existing entry for this user (if any)
    const existingEntries = leaderboard.filter(
      (entry) => entry.userId === userId
    );
    const bestExistingEntry =
      existingEntries.length > 0
        ? existingEntries.reduce((best, current) =>
            current.score > best.score ? current : best
          )
        : null;

    let entry;
    let isNewEntry = false;
    let updated = false;

    if (bestExistingEntry && score > bestExistingEntry.score) {
      // Update with new higher score
      entry = {
        ...bestExistingEntry,
        nickname: sanitizedNickname,
        score: score,
        equity: equity || 0,
        totalProfit: totalProfit || 0,
        totalRoi: totalRoi || 0,
        date: new Date().toISOString(),
      };
      updated = true;
    } else if (bestExistingEntry) {
      // Score is not higher, keep existing entry
      entry = bestExistingEntry;
    } else {
      // New user entry
      isNewEntry = true;
      entry = {
        id: uuidv4(),
        userId: userId,
        nickname: sanitizedNickname,
        score: score,
        equity: equity || 0,
        totalProfit: totalProfit || 0,
        totalRoi: totalRoi || 0,
        date: new Date().toISOString(),
      };
    }

    // Add the entry back to the leaderboard
    filteredLeaderboard.push(entry);
    const updatedLeaderboard = filteredLeaderboard;

    // Save leaderboard
    await writeLeaderboard(updatedLeaderboard);

    // Get user's rank
    const sorted = updatedLeaderboard.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return new Date(a.date) - new Date(b.date);
    });

    const userRank = sorted.findIndex((e) => e.id === entry.id) + 1;

    res.json({
      success: true,
      entry: entry,
      rank: userRank,
      updated: updated,
      isNewEntry: isNewEntry,
    });
  } catch (error) {
    console.error("Error submitting to leaderboard:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to submit to leaderboard" });
  }
});

// GET /api/user/me - Get current user info
app.get("/api/user/me", async (req, res) => {
  try {
    const userId = getOrCreateUserId(req, res);
    const users = await readUsers();
    const nickname = users[userId] || null;
    res.json({ success: true, userId, nickname });
  } catch (error) {
    console.error("Error getting user info:", error);
    res.status(500).json({ success: false, error: "Failed to get user info" });
  }
});

// POST /api/user/nickname - Set user nickname
app.post("/api/user/nickname", async (req, res) => {
  try {
    const { nickname } = req.body;
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

    // Sanitize nickname
    const sanitizedNickname = nickname.trim().substring(0, 20);

    // Read users
    const users = await readUsers();
    users[userId] = sanitizedNickname;
    await writeUsers(users);

    res.json({
      success: true,
      nickname: sanitizedNickname,
    });
  } catch (error) {
    console.error("Error setting nickname:", error);
    res.status(500).json({ success: false, error: "Failed to set nickname" });
  }
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

    // Group by userId and keep only the best entry per user (same as GET /api/leaderboard)
    const userBestEntries = {};
    leaderboard.forEach((entry) => {
      if (
        !userBestEntries[entry.userId] ||
        entry.score > userBestEntries[entry.userId].score
      ) {
        userBestEntries[entry.userId] = entry;
      }
    });

    // Convert to array and sort
    const uniqueEntries = Object.values(userBestEntries);
    const sorted = uniqueEntries.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return new Date(a.date) - new Date(b.date);
    });

    const rank = sorted.findIndex((entry) => entry.id === bestEntry.id) + 1;

    res.json({
      success: true,
      rank: rank > 0 ? rank : null,
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
  await initializeUsers();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  });
}

startServer().catch(console.error);
