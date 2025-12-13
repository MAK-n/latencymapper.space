// ============================================
// EXPRESS SERVER PROXY FOR HEATMAP API
// Proxies requests to the actual heatmap server
// ============================================

const express = require("express");
const cors = require("cors");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 1234;

// Heatmap server URL (configure this to point to your actual server)
const HEATMAP_SERVER_URL =
  process.env.HEATMAP_SERVER_URL ||
  "https://knox-swainish-wonderingly.ngrok-free.dev";

// Middleware
app.use(cors());
app.use(express.json());

// API routes must come BEFORE static file serving
// This ensures API endpoints are matched first

// Store running processes
const runningProcesses = new Map();

// Helper to stop a process
function stopProcess(pid) {
  console.log("[Server] [stopProcess] Attempting to stop process:", pid);

  const processInfo = runningProcesses.get(pid);
  if (!processInfo) {
    console.log(
      "[Server] [stopProcess] Process not found in runningProcesses map",
    );
    return false;
  }

  console.log("[Server] [stopProcess] Process found, killing...");
  console.log("[Server] [stopProcess] Platform:", process.platform);
  console.log(
    "[Server] [stopProcess] Process start time:",
    new Date(processInfo.startTime).toISOString(),
  );

  try {
    if (process.platform === "win32") {
      console.log("[Server] [stopProcess] Using taskkill for Windows");
      const { spawn } = require("child_process");
      const killProcess = spawn("taskkill", [
        "/pid",
        pid.toString(),
        "/T",
        "/F",
      ]);

      killProcess.on("exit", (code) => {
        console.log(
          `[Server] [stopProcess] taskkill exited with code: ${code}`,
        );
      });

      killProcess.on("error", (error) => {
        console.error(`[Server] [stopProcess] taskkill error:`, error);
      });
    } else {
      console.log("[Server] [stopProcess] Using SIGTERM for Unix");
      processInfo.process.kill("SIGTERM");
    }

    runningProcesses.delete(pid);
    console.log("[Server] [stopProcess] ✓ Process removed from map");
    return true;
  } catch (error) {
    console.error(
      `[Server] [stopProcess] ERROR: Failed to stop process ${pid}`,
    );
    console.error("[Server] [stopProcess] Error type:", error.constructor.name);
    console.error("[Server] [stopProcess] Error message:", error.message);
    console.error("[Server] [stopProcess] Error stack:", error.stack);
    return false;
  }
}

// ============================================
// HEATMAP API ENDPOINTS (Proxy to actual server)
// ============================================

/**
 * Execute heatmap_client.py locally
 * POST /api/run-heatmap-client
 * Spawns Python process: python heatmap_client.py --satellite-file <file> --duration <duration> --step <step>
 */
app.post("/api/run-heatmap-client", async (req, res) => {
  console.log("[Server] ========================================");
  console.log("[Server] Received request to execute heatmap_client.py");
  console.log("[Server] ========================================");
  console.log("[Server] Request body:", JSON.stringify(req.body, null, 2));

  try {
    const { satelliteData, duration, step } = req.body;

    console.log("[Server] Parsed request parameters:");
    console.log(
      "[Server]   - satelliteData:",
      satelliteData ? "present" : "missing",
    );
    console.log("[Server]   - duration:", duration);
    console.log("[Server]   - step:", step);

    if (!satelliteData) {
      console.error("[Server] ERROR: satelliteData is required but missing");
      return res.status(400).json({ error: "satelliteData is required" });
    }

    const { spawn } = require("child_process");
    const path = require("path");
    const fs = require("fs");

    console.log("[Server] Loading Node.js modules...");
    console.log("[Server]   - spawn:", typeof spawn);
    console.log("[Server]   - path:", typeof path);
    console.log("[Server]   - fs:", typeof fs);

    // Create satellite data file
    const satelliteFilePath = path.join(
      __dirname,
      "heatmapReciever",
      "test_satellite.json",
    );
    const satelliteDir = path.dirname(satelliteFilePath);

    console.log("[Server] Satellite file path:", satelliteFilePath);
    console.log("[Server] Satellite directory:", satelliteDir);

    // Ensure directory exists
    if (!fs.existsSync(satelliteDir)) {
      console.log("[Server] Creating satellite directory:", satelliteDir);
      fs.mkdirSync(satelliteDir, { recursive: true });
      console.log("[Server] ✓ Directory created");
    } else {
      console.log("[Server] ✓ Directory already exists");
    }

    // Write satellite data to file
    console.log("[Server] Writing satellite data to file...");
    console.log(
      "[Server] Satellite data content:",
      JSON.stringify(satelliteData, null, 2),
    );
    fs.writeFileSync(satelliteFilePath, JSON.stringify(satelliteData, null, 2));
    console.log(`[Server] ✓ Satellite data written to: ${satelliteFilePath}`);

    // Verify file was created
    if (fs.existsSync(satelliteFilePath)) {
      const fileStats = fs.statSync(satelliteFilePath);
      console.log("[Server] ✓ File verified, size:", fileStats.size, "bytes");
    } else {
      throw new Error("Failed to create satellite file");
    }

    // Determine Python command
    const pythonCmd = process.platform === "win32" ? "python" : "python3";
    const pythonScript = path.join(
      __dirname,
      "heatmapReciever",
      "heatmap_client.py",
    );

    console.log("[Server] Python configuration:");
    console.log("[Server]   - Platform:", process.platform);
    console.log("[Server]   - Python command:", pythonCmd);
    console.log("[Server]   - Script path:", pythonScript);

    // Verify script exists
    if (!fs.existsSync(pythonScript)) {
      console.error(
        "[Server] ERROR: heatmap_client.py not found at:",
        pythonScript,
      );
      return res
        .status(404)
        .json({ error: `heatmap_client.py not found at ${pythonScript}` });
    }

    const scriptStats = fs.statSync(pythonScript);
    console.log("[Server] ✓ Script verified, size:", scriptStats.size, "bytes");

    // Prepare command arguments
    // Format: python heatmap_client.py --satellite-file <file> --duration <duration> --step <step>
    const args = [
      pythonScript,
      "--satellite-file",
      satelliteFilePath,
      "--duration",
      (duration || 600).toString(),
      "--step",
      (step || 10).toString(),
    ];

    console.log("[Server] ========================================");
    console.log("[Server] Executing Python script:");
    console.log("[Server]   Command:", pythonCmd);
    console.log("[Server]   Arguments:", args.join(" "));
    console.log("[Server]   Full command:", `${pythonCmd} ${args.join(" ")}`);
    console.log("[Server] ========================================");

    // Spawn Python process with UTF-8 encoding for Windows compatibility
    const pythonProcess = spawn(pythonCmd, args, {
      cwd: __dirname,
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        PYTHONIOENCODING: "utf-8",
      },
    });

    const pid = pythonProcess.pid;
    console.log("[Server] ✓ Python process spawned");
    console.log("[Server]   Process PID:", pid);
    console.log("[Server]   Working directory:", __dirname);

    runningProcesses.set(pid, {
      process: pythonProcess,
      startTime: Date.now(),
    });

    console.log("[Server] Process registered in runningProcesses map");
    console.log("[Server] Total running processes:", runningProcesses.size);

    // Handle process output
    pythonProcess.stdout.on("data", (data) => {
      const output = data.toString();
      console.log(`[Server] [HeatmapClient ${pid}] STDOUT:`, output);
    });

    pythonProcess.stderr.on("data", (data) => {
      const error = data.toString();
      console.error(`[Server] [HeatmapClient ${pid}] STDERR:`, error);
    });

    pythonProcess.on("error", (error) => {
      console.error(`[Server] [HeatmapClient ${pid}] Process error:`, error);
    });

    pythonProcess.on("exit", (code, signal) => {
      console.log(`[Server] [HeatmapClient ${pid}] Process exited`);
      console.log(`[Server]   Exit code:`, code);
      console.log(`[Server]   Signal:`, signal);
      runningProcesses.delete(pid);
      console.log(`[Server] Process removed from runningProcesses map`);
      console.log(`[Server] Remaining processes:`, runningProcesses.size);
    });

    console.log("[Server] ========================================");
    console.log("[Server] ✓ heatmap_client.py execution initiated");
    console.log("[Server] Returning response to client...");
    console.log("[Server] ========================================");

    res.json({
      success: true,
      pid: pid,
      message: "heatmap_client.py started",
    });
  } catch (error) {
    console.error("[Server] ========================================");
    console.error("[Server] ERROR: Failed to execute heatmap_client.py");
    console.error("[Server] Error type:", error.constructor.name);
    console.error("[Server] Error message:", error.message);
    console.error("[Server] Error stack:", error.stack);
    console.error("[Server] ========================================");
    res.status(500).json({ error: error.message });
  }
});

/**
 * Initialize backend with satellite data
 * POST /api/initialize
 * Proxies to actual heatmap server
 */
app.post("/api/initialize", async (req, res) => {
  try {
    const fetch = (await import("node-fetch")).default;
    const response = await fetch(`${HEATMAP_SERVER_URL}/api/initialize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("[API] Error initializing backend:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Start heatmap generation (first frame only)
 * POST /api/generate
 * Proxies to actual heatmap server
 *
 * Note: This endpoint only starts generating the first frame of the frameset.
 * Subsequent frames are streamed via WebSocket (/ws/frames).
 */
app.post("/api/generate", async (req, res) => {
  try {
    const fetch = (await import("node-fetch")).default;
    const response = await fetch(`${HEATMAP_SERVER_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("[API] Error starting generation:", error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// WEBSOCKET PROXY FOR FRAME STREAMING
// ============================================

// WebSocket server for proxying frames
const wss = new WebSocket.Server({
  server,
  path: "/ws/frames",
});

wss.on("connection", (clientWs) => {
  console.log("[WebSocket] Client connected");

  // Connect to actual heatmap server WebSocket
  const serverWsUrl =
    HEATMAP_SERVER_URL.replace("https://", "wss://").replace(
      "http://",
      "ws://",
    ) + "/ws/frames";
  console.log("[WebSocket] Attempting to connect to server:", serverWsUrl);

  let serverWs = null;
  let clientClosed = false;
  let serverConnected = false;

  // Buffer messages from client while server is connecting
  const clientMessageBuffer = [];

  try {
    serverWs = new WebSocket(serverWsUrl);

    // Wait for server connection to open before forwarding messages
    serverWs.on("open", () => {
      console.log("[WebSocket] Server connection established");
      serverConnected = true;

      // Send any buffered client messages
      while (
        clientMessageBuffer.length > 0 &&
        serverWs.readyState === WebSocket.OPEN
      ) {
        const bufferedMsg = clientMessageBuffer.shift();
        serverWs.send(bufferedMsg);
      }
    });

    // Forward messages from server to client
    serverWs.on("message", (data) => {
      if (clientWs.readyState === WebSocket.OPEN && !clientClosed) {
        try {
          clientWs.send(data);
        } catch (error) {
          console.error(
            "[WebSocket] Error forwarding server message to client:",
            error,
          );
        }
      }
    });

    // Forward messages from client to server
    clientWs.on("message", (data) => {
      if (
        serverConnected &&
        serverWs &&
        serverWs.readyState === WebSocket.OPEN
      ) {
        try {
          serverWs.send(data);
        } catch (error) {
          console.error(
            "[WebSocket] Error forwarding client message to server:",
            error,
          );
        }
      } else {
        // Buffer messages if server not ready yet
        clientMessageBuffer.push(data);
      }
    });

    // Handle server errors - don't close client immediately
    serverWs.on("error", (error) => {
      console.error(
        "[WebSocket] Server connection error:",
        error.message || error,
      );
      // Don't close client on server error - let it stay connected in case server recovers
    });

    // Handle client errors
    clientWs.on("error", (error) => {
      console.error(
        "[WebSocket] Client connection error:",
        error.message || error,
      );
    });

    // Handle client close
    clientWs.on("close", (code, reason) => {
      console.log("[WebSocket] Client disconnected:", code, reason?.toString());
      clientClosed = true;
      if (serverWs && serverWs.readyState === WebSocket.OPEN) {
        serverWs.close();
      }
    });

    // Handle server close - don't immediately close client, just log
    serverWs.on("close", (code, reason) => {
      console.log(
        "[WebSocket] Server connection closed:",
        code,
        reason?.toString(),
      );
      serverConnected = false;
      // Only close client if it's still open and we have a clean close reason
      if (
        !clientClosed &&
        clientWs.readyState === WebSocket.OPEN &&
        code !== 1006
      ) {
        // Don't close on abnormal closure (1006) - might reconnect
        console.log(
          "[WebSocket] Keeping client connection open despite server closure",
        );
      }
    });

    // Add ping/pong to keep connection alive
    const keepAliveInterval = setInterval(() => {
      if (clientWs.readyState === WebSocket.OPEN && !clientClosed) {
        try {
          clientWs.ping();
        } catch (error) {
          console.error("[WebSocket] Keep-alive ping error:", error);
          clearInterval(keepAliveInterval);
        }
      } else {
        clearInterval(keepAliveInterval);
      }
    }, 30000); // Ping every 30 seconds

    // Clean up interval on close
    clientWs.on("close", () => {
      clearInterval(keepAliveInterval);
    });
  } catch (error) {
    console.error("[WebSocket] Error creating server connection:", error);
    // Don't close client on initial connection error - it might be temporary
  }
});

// ============================================
// START SERVER
// ============================================

/**
 * Clear output directory
 * DELETE /api/clear-output
 * Deletes all files from the output/received_frames directory
 */
app.delete("/api/clear-output", (req, res) => {
  console.log("[Server] ========================================");
  console.log("[Server] Received request to clear output directory");
  console.log("[Server] ========================================");

  try {
    const fs = require("fs");
    const path = require("path");

    const outputDir = path.join(__dirname, "output", "received_frames");

    console.log("[Server] Output directory:", outputDir);

    // Check if directory exists
    if (!fs.existsSync(outputDir)) {
      console.log("[Server] Output directory does not exist, nothing to clear");
      return res.json({ success: true, message: "Output directory does not exist", deletedCount: 0 });
    }

    // Read all files in the directory
    const files = fs.readdirSync(outputDir);
    console.log(`[Server] Found ${files.length} files to delete`);

    let deletedCount = 0;
    let errors = [];

    // Delete each file
    files.forEach((file) => {
      try {
        const filePath = path.join(outputDir, file);
        fs.unlinkSync(filePath);
        deletedCount++;
        console.log(`[Server] ✓ Deleted: ${file}`);
      } catch (error) {
        console.error(`[Server] Error deleting ${file}:`, error.message);
        errors.push({ file, error: error.message });
      }
    });

    console.log(`[Server] ========================================`);
    console.log(`[Server] ✓ Cleared output directory`);
    console.log(`[Server]   Deleted: ${deletedCount} files`);
    if (errors.length > 0) {
      console.log(`[Server]   Errors: ${errors.length}`);
    }
    console.log(`[Server] ========================================`);

    if (errors.length > 0) {
      res.status(207).json({
        success: true,
        message: `Deleted ${deletedCount} files with ${errors.length} errors`,
        deletedCount,
        errors,
      });
    } else {
      res.json({
        success: true,
        message: `Successfully deleted ${deletedCount} files`,
        deletedCount,
      });
    }
  } catch (error) {
    console.error("[Server] ========================================");
    console.error("[Server] ERROR: Failed to clear output directory");
    console.error("[Server] Error type:", error.constructor.name);
    console.error("[Server] Error message:", error.message);
    console.error("[Server] Error stack:", error.stack);
    console.error("[Server] ========================================");
    res.status(500).json({ error: error.message });
  }
});

/**
 * Stop heatmap client process
 * POST /api/stop-client
 */
app.post("/api/stop-client", (req, res) => {
  console.log("[Server] ========================================");
  console.log("[Server] Received request to stop heatmap client");
  console.log("[Server] Request body:", JSON.stringify(req.body, null, 2));

  try {
    const { pid } = req.body;

    console.log("[Server] PID to stop:", pid);

    if (!pid) {
      console.error("[Server] ERROR: PID is required but missing");
      return res.status(400).json({ error: "PID required" });
    }

    console.log(
      "[Server] Current running processes:",
      Array.from(runningProcesses.keys()),
    );

    if (stopProcess(pid)) {
      console.log("[Server] ✓ Process stopped successfully");
      console.log("[Server] Remaining processes:", runningProcesses.size);
      res.json({ success: true, message: "Process stopped" });
    } else {
      console.error(
        "[Server] ERROR: Process not found in runningProcesses map",
      );
      res.status(404).json({ error: "Process not found" });
    }
  } catch (error) {
    console.error("[Server] ERROR: Failed to stop process");
    console.error("[Server] Error type:", error.constructor.name);
    console.error("[Server] Error message:", error.message);
    console.error("[Server] Error stack:", error.stack);
    res.status(500).json({ error: error.message });
  }
});

// Serve static files AFTER all API routes
// This ensures API endpoints are matched before static files
app.use(express.static("."));

server.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Heatmap API endpoints:`);
  console.log(`  - POST /api/run-heatmap-client (spawns heatmap_client.py)`);
  console.log(`  - POST /api/stop-client (stops process)`);
  console.log(`  - DELETE /api/clear-output (clears output directory)`);
  console.log(`  - POST /api/initialize (proxies to heatmap server)`);
  console.log(`  - POST /api/generate (proxies to heatmap server)`);
  console.log(`  - WebSocket /ws/frames (proxies to heatmap server)`);
  console.log(`✓ Proxying to heatmap server: ${HEATMAP_SERVER_URL}`);
  console.log(`✓ Static files served from current directory`);
});
