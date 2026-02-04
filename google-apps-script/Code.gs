/**
 * Math Adventure - Google Apps Script Backend
 *
 * This script provides cloud backup and progress tracking for the Math Adventure app.
 *
 * SETUP INSTRUCTIONS:
 * 1. Go to https://script.google.com and create a new project
 * 2. Copy this code into Code.gs
 * 3. Deploy as Web App:
 *    - Click "Deploy" > "New deployment"
 *    - Select "Web app"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone" (for public use) or "Anyone with Google Account"
 *    - Click "Deploy" and copy the Web App URL
 * 4. Add the Web App URL to your Math Adventure settings
 *
 * Features:
 * - Sync progress to Google Sheets
 * - Parent/teacher dashboard
 * - Email progress reports (optional)
 * - Leaderboard support
 */

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  SPREADSHEET_NAME: 'Math Adventure Progress',
  PLAYERS_SHEET: 'Players',
  DAILY_PROGRESS_SHEET: 'Daily Progress',
  LEADERBOARD_SHEET: 'Leaderboard',
  FACTS_SHEET: 'Fact Performance',
  SEND_EMAIL_REPORTS: false, // Set to true to enable weekly email reports
  REPORT_DAY: 0, // Sunday = 0, Monday = 1, etc.
};

// ============================================================================
// Web App Entry Points
// ============================================================================

/**
 * Handle GET requests - Used for fetching data
 */
function doGet(e) {
  try {
    const action = e.parameter.action || 'status';
    const playerId = e.parameter.playerId;

    let result;

    switch (action) {
      case 'status':
        result = { status: 'ok', message: 'Math Adventure Backend is running!' };
        break;

      case 'getProgress':
        result = getPlayerProgress(playerId);
        break;

      case 'getLeaderboard':
        result = getLeaderboard(e.parameter.limit || 10);
        break;

      case 'syncCheck':
        result = checkSyncStatus(playerId);
        break;

      default:
        result = { error: 'Unknown action: ' + action };
    }

    return createJsonResponse(result);

  } catch (error) {
    return createJsonResponse({ error: error.message });
  }
}

/**
 * Handle POST requests - Used for saving data
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    let result;

    switch (action) {
      case 'syncProgress':
        result = syncPlayerProgress(data);
        break;

      case 'saveSession':
        result = saveSessionResult(data);
        break;

      case 'registerPlayer':
        result = registerPlayer(data);
        break;

      case 'subscribeEmail':
        result = subscribeToEmailReports(data);
        break;

      default:
        result = { error: 'Unknown action: ' + action };
    }

    return createJsonResponse(result);

  } catch (error) {
    return createJsonResponse({ error: error.message });
  }
}

/**
 * Create a JSON response with CORS headers
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================================
// Spreadsheet Management
// ============================================================================

/**
 * Get or create the main spreadsheet
 */
function getOrCreateSpreadsheet() {
  const files = DriveApp.getFilesByName(CONFIG.SPREADSHEET_NAME);

  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next());
  }

  // Create new spreadsheet with all required sheets
  const ss = SpreadsheetApp.create(CONFIG.SPREADSHEET_NAME);

  // Setup Players sheet
  const playersSheet = ss.getActiveSheet();
  playersSheet.setName(CONFIG.PLAYERS_SHEET);
  playersSheet.getRange('A1:J1').setValues([[
    'Player ID', 'Name', 'Email', 'Level', 'Total Points',
    'Total Correct', 'Total Attempts', 'Best Streak', 'Last Sync', 'Created'
  ]]);
  playersSheet.setFrozenRows(1);
  playersSheet.getRange('A1:J1').setFontWeight('bold').setBackground('#4285f4').setFontColor('white');

  // Setup Daily Progress sheet
  const dailySheet = ss.insertSheet(CONFIG.DAILY_PROGRESS_SHEET);
  dailySheet.getRange('A1:G1').setValues([[
    'Player ID', 'Date', 'Correct', 'Attempts', 'Points', 'Sessions', 'Accuracy %'
  ]]);
  dailySheet.setFrozenRows(1);
  dailySheet.getRange('A1:G1').setFontWeight('bold').setBackground('#34a853').setFontColor('white');

  // Setup Leaderboard sheet
  const leaderSheet = ss.insertSheet(CONFIG.LEADERBOARD_SHEET);
  leaderSheet.getRange('A1:E1').setValues([[
    'Rank', 'Name', 'Level', 'Total Points', 'Accuracy %'
  ]]);
  leaderSheet.setFrozenRows(1);
  leaderSheet.getRange('A1:E1').setFontWeight('bold').setBackground('#fbbc05').setFontColor('white');

  // Setup Fact Performance sheet
  const factsSheet = ss.insertSheet(CONFIG.FACTS_SHEET);
  factsSheet.getRange('A1:F1').setValues([[
    'Player ID', 'Fact', 'Correct', 'Incorrect', 'Accuracy %', 'Last Seen'
  ]]);
  factsSheet.setFrozenRows(1);
  factsSheet.getRange('A1:F1').setFontWeight('bold').setBackground('#ea4335').setFontColor('white');

  return ss;
}

/**
 * Get a specific sheet by name
 */
function getSheet(sheetName) {
  const ss = getOrCreateSpreadsheet();
  return ss.getSheetByName(sheetName);
}

// ============================================================================
// Player Management
// ============================================================================

/**
 * Register a new player or update existing one
 */
function registerPlayer(data) {
  const sheet = getSheet(CONFIG.PLAYERS_SHEET);
  const playerId = data.playerId || Utilities.getUuid();
  const now = new Date();

  // Check if player exists
  const existingRow = findPlayerRow(sheet, playerId);

  if (existingRow > 0) {
    // Update existing player
    sheet.getRange(existingRow, 2).setValue(data.name);
    if (data.email) sheet.getRange(existingRow, 3).setValue(data.email);

    return {
      success: true,
      playerId: playerId,
      message: 'Player updated'
    };
  }

  // Create new player
  sheet.appendRow([
    playerId,
    data.name,
    data.email || '',
    1, // Starting level
    0, // Total points
    0, // Total correct
    0, // Total attempts
    0, // Best streak
    now,
    now
  ]);

  return {
    success: true,
    playerId: playerId,
    message: 'Player registered'
  };
}

/**
 * Find a player's row by ID
 */
function findPlayerRow(sheet, playerId) {
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === playerId) {
      return i + 1; // Convert to 1-indexed row number
    }
  }

  return -1;
}

// ============================================================================
// Progress Syncing
// ============================================================================

/**
 * Sync player progress from the web app
 */
function syncPlayerProgress(data) {
  const playersSheet = getSheet(CONFIG.PLAYERS_SHEET);
  const now = new Date();

  // Ensure player exists
  let playerRow = findPlayerRow(playersSheet, data.playerId);

  if (playerRow < 0) {
    // Auto-register player
    registerPlayer({
      playerId: data.playerId,
      name: data.playerName
    });
    playerRow = findPlayerRow(playersSheet, data.playerId);
  }

  // Update player stats
  playersSheet.getRange(playerRow, 2).setValue(data.playerName);
  playersSheet.getRange(playerRow, 4).setValue(data.level);
  playersSheet.getRange(playerRow, 5).setValue(data.totalPoints);
  playersSheet.getRange(playerRow, 6).setValue(data.totalCorrect);
  playersSheet.getRange(playerRow, 7).setValue(data.totalAttempts);
  playersSheet.getRange(playerRow, 8).setValue(data.bestStreak);
  playersSheet.getRange(playerRow, 9).setValue(now);

  // Sync daily progress
  if (data.progressHistory && data.progressHistory.length > 0) {
    syncDailyProgress(data.playerId, data.progressHistory);
  }

  // Sync fact performance
  if (data.factPerformance) {
    syncFactPerformance(data.playerId, data.factPerformance);
  }

  // Update leaderboard
  updateLeaderboard();

  return {
    success: true,
    message: 'Progress synced successfully',
    lastSync: now.toISOString()
  };
}

/**
 * Sync daily progress history
 */
function syncDailyProgress(playerId, progressHistory) {
  const sheet = getSheet(CONFIG.DAILY_PROGRESS_SHEET);
  const existingData = sheet.getDataRange().getValues();

  // Build a map of existing entries
  const existingEntries = new Set();
  for (let i = 1; i < existingData.length; i++) {
    existingEntries.add(`${existingData[i][0]}_${existingData[i][1]}`);
  }

  // Add new entries
  for (const day of progressHistory) {
    const key = `${playerId}_${day.date}`;

    if (!existingEntries.has(key)) {
      const accuracy = day.attempts > 0 ? Math.round((day.correct / day.attempts) * 100) : 0;

      sheet.appendRow([
        playerId,
        day.date,
        day.correct,
        day.attempts,
        day.points,
        day.sessions,
        accuracy
      ]);
    }
  }
}

/**
 * Sync fact performance data
 */
function syncFactPerformance(playerId, factPerformance) {
  const sheet = getSheet(CONFIG.FACTS_SHEET);
  const existingData = sheet.getDataRange().getValues();

  // Build map of existing fact rows
  const factRows = {};
  for (let i = 1; i < existingData.length; i++) {
    if (existingData[i][0] === playerId) {
      factRows[existingData[i][1]] = i + 1;
    }
  }

  // Update or add facts
  for (const [fact, data] of Object.entries(factPerformance)) {
    const total = data.correct + data.incorrect;
    const accuracy = total > 0 ? Math.round((data.correct / total) * 100) : 0;
    const lastSeen = new Date(data.lastSeen);

    if (factRows[fact]) {
      // Update existing
      const row = factRows[fact];
      sheet.getRange(row, 3, 1, 4).setValues([[data.correct, data.incorrect, accuracy, lastSeen]]);
    } else {
      // Add new
      sheet.appendRow([playerId, fact, data.correct, data.incorrect, accuracy, lastSeen]);
    }
  }
}

/**
 * Save a single session result
 */
function saveSessionResult(data) {
  const dailySheet = getSheet(CONFIG.DAILY_PROGRESS_SHEET);
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

  const accuracy = data.attempts > 0 ? Math.round((data.correct / data.attempts) * 100) : 0;

  // Check if today's entry exists
  const existingData = dailySheet.getDataRange().getValues();
  let todayRow = -1;

  for (let i = 1; i < existingData.length; i++) {
    if (existingData[i][0] === data.playerId && existingData[i][1] === today) {
      todayRow = i + 1;
      break;
    }
  }

  if (todayRow > 0) {
    // Update existing entry
    const currentRow = dailySheet.getRange(todayRow, 1, 1, 7).getValues()[0];
    dailySheet.getRange(todayRow, 3, 1, 5).setValues([[
      currentRow[2] + data.correct,
      currentRow[3] + data.attempts,
      currentRow[4] + data.points,
      currentRow[5] + 1,
      Math.round(((currentRow[2] + data.correct) / (currentRow[3] + data.attempts)) * 100)
    ]]);
  } else {
    // Create new entry
    dailySheet.appendRow([
      data.playerId,
      today,
      data.correct,
      data.attempts,
      data.points,
      1,
      accuracy
    ]);
  }

  // Update leaderboard
  updateLeaderboard();

  return { success: true, message: 'Session saved' };
}

// ============================================================================
// Leaderboard
// ============================================================================

/**
 * Update the leaderboard
 */
function updateLeaderboard() {
  const playersSheet = getSheet(CONFIG.PLAYERS_SHEET);
  const leaderSheet = getSheet(CONFIG.LEADERBOARD_SHEET);

  const playersData = playersSheet.getDataRange().getValues();

  // Build leaderboard data
  const leaderboard = [];
  for (let i = 1; i < playersData.length; i++) {
    const totalAttempts = playersData[i][6];
    const totalCorrect = playersData[i][5];
    const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

    leaderboard.push({
      name: playersData[i][1],
      level: playersData[i][3],
      points: playersData[i][4],
      accuracy: accuracy
    });
  }

  // Sort by points (descending)
  leaderboard.sort((a, b) => b.points - a.points);

  // Clear and update leaderboard sheet
  const lastRow = leaderSheet.getLastRow();
  if (lastRow > 1) {
    leaderSheet.deleteRows(2, lastRow - 1);
  }

  // Add ranked entries
  for (let i = 0; i < leaderboard.length; i++) {
    const entry = leaderboard[i];
    leaderSheet.appendRow([
      i + 1,
      entry.name,
      entry.level,
      entry.points,
      entry.accuracy + '%'
    ]);
  }
}

/**
 * Get leaderboard data
 */
function getLeaderboard(limit) {
  const sheet = getSheet(CONFIG.LEADERBOARD_SHEET);
  const data = sheet.getDataRange().getValues();

  const leaderboard = [];
  for (let i = 1; i < Math.min(data.length, parseInt(limit) + 1); i++) {
    leaderboard.push({
      rank: data[i][0],
      name: data[i][1],
      level: data[i][2],
      points: data[i][3],
      accuracy: data[i][4]
    });
  }

  return { success: true, leaderboard: leaderboard };
}

// ============================================================================
// Data Retrieval
// ============================================================================

/**
 * Get player progress
 */
function getPlayerProgress(playerId) {
  if (!playerId) {
    return { error: 'Player ID required' };
  }

  const playersSheet = getSheet(CONFIG.PLAYERS_SHEET);
  const playerRow = findPlayerRow(playersSheet, playerId);

  if (playerRow < 0) {
    return { error: 'Player not found' };
  }

  const playerData = playersSheet.getRange(playerRow, 1, 1, 10).getValues()[0];

  // Get daily progress
  const dailySheet = getSheet(CONFIG.DAILY_PROGRESS_SHEET);
  const dailyData = dailySheet.getDataRange().getValues();
  const progressHistory = [];

  for (let i = 1; i < dailyData.length; i++) {
    if (dailyData[i][0] === playerId) {
      progressHistory.push({
        date: dailyData[i][1],
        correct: dailyData[i][2],
        attempts: dailyData[i][3],
        points: dailyData[i][4],
        sessions: dailyData[i][5]
      });
    }
  }

  // Get fact performance
  const factsSheet = getSheet(CONFIG.FACTS_SHEET);
  const factsData = factsSheet.getDataRange().getValues();
  const factPerformance = {};

  for (let i = 1; i < factsData.length; i++) {
    if (factsData[i][0] === playerId) {
      factPerformance[factsData[i][1]] = {
        correct: factsData[i][2],
        incorrect: factsData[i][3],
        lastSeen: factsData[i][5]
      };
    }
  }

  return {
    success: true,
    player: {
      id: playerData[0],
      name: playerData[1],
      email: playerData[2],
      level: playerData[3],
      totalPoints: playerData[4],
      totalCorrect: playerData[5],
      totalAttempts: playerData[6],
      bestStreak: playerData[7],
      lastSync: playerData[8],
      created: playerData[9]
    },
    progressHistory: progressHistory,
    factPerformance: factPerformance
  };
}

/**
 * Check sync status for a player
 */
function checkSyncStatus(playerId) {
  if (!playerId) {
    return { synced: false, reason: 'No player ID' };
  }

  const playersSheet = getSheet(CONFIG.PLAYERS_SHEET);
  const playerRow = findPlayerRow(playersSheet, playerId);

  if (playerRow < 0) {
    return { synced: false, reason: 'Player not found' };
  }

  const lastSync = playersSheet.getRange(playerRow, 9).getValue();

  return {
    synced: true,
    lastSync: lastSync ? lastSync.toISOString() : null
  };
}

// ============================================================================
// Email Reports
// ============================================================================

/**
 * Subscribe to email progress reports
 */
function subscribeToEmailReports(data) {
  if (!data.playerId || !data.email) {
    return { error: 'Player ID and email required' };
  }

  const playersSheet = getSheet(CONFIG.PLAYERS_SHEET);
  const playerRow = findPlayerRow(playersSheet, data.playerId);

  if (playerRow < 0) {
    return { error: 'Player not found' };
  }

  playersSheet.getRange(playerRow, 3).setValue(data.email);

  return { success: true, message: 'Email subscription updated' };
}

/**
 * Send weekly progress reports (set up as a time-based trigger)
 */
function sendWeeklyReports() {
  if (!CONFIG.SEND_EMAIL_REPORTS) return;

  const today = new Date();
  if (today.getDay() !== CONFIG.REPORT_DAY) return;

  const playersSheet = getSheet(CONFIG.PLAYERS_SHEET);
  const playersData = playersSheet.getDataRange().getValues();

  for (let i = 1; i < playersData.length; i++) {
    const email = playersData[i][2];
    if (!email) continue;

    const playerName = playersData[i][1];
    const playerId = playersData[i][0];

    // Get this week's progress
    const weekProgress = getWeeklyProgress(playerId);

    if (weekProgress.totalAttempts === 0) continue;

    const subject = `Math Adventure Weekly Report for ${playerName}`;
    const body = generateReportEmail(playerName, playersData[i], weekProgress);

    try {
      MailApp.sendEmail(email, subject, body);
    } catch (error) {
      console.log('Failed to send email to ' + email + ': ' + error.message);
    }
  }
}

/**
 * Get progress for the last 7 days
 */
function getWeeklyProgress(playerId) {
  const dailySheet = getSheet(CONFIG.DAILY_PROGRESS_SHEET);
  const dailyData = dailySheet.getDataRange().getValues();

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  let totalCorrect = 0;
  let totalAttempts = 0;
  let totalPoints = 0;
  let totalSessions = 0;

  for (let i = 1; i < dailyData.length; i++) {
    if (dailyData[i][0] !== playerId) continue;

    const entryDate = new Date(dailyData[i][1]);
    if (entryDate < oneWeekAgo) continue;

    totalCorrect += dailyData[i][2];
    totalAttempts += dailyData[i][3];
    totalPoints += dailyData[i][4];
    totalSessions += dailyData[i][5];
  }

  return { totalCorrect, totalAttempts, totalPoints, totalSessions };
}

/**
 * Generate email report body
 */
function generateReportEmail(playerName, playerData, weekProgress) {
  const accuracy = weekProgress.totalAttempts > 0
    ? Math.round((weekProgress.totalCorrect / weekProgress.totalAttempts) * 100)
    : 0;

  return `
Hi!

Here's ${playerName}'s Math Adventure progress report for the past week:

This Week's Progress:
- Problems Solved: ${weekProgress.totalCorrect} / ${weekProgress.totalAttempts}
- Accuracy: ${accuracy}%
- Points Earned: ${weekProgress.totalPoints}
- Practice Sessions: ${weekProgress.totalSessions}

All-Time Stats:
- Level: ${playerData[3]}
- Total Points: ${playerData[4]}
- Best Streak: ${playerData[7]}

Keep up the great work, ${playerName}!

- Math Adventure
  `;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Test function - Initialize spreadsheet
 */
function testSetup() {
  const ss = getOrCreateSpreadsheet();
  console.log('Spreadsheet created/found: ' + ss.getName());
  console.log('URL: ' + ss.getUrl());
}

/**
 * Set up time-based trigger for weekly reports
 */
function setupWeeklyReportTrigger() {
  // Delete existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === 'sendWeeklyReports') {
      ScriptApp.deleteTrigger(trigger);
    }
  }

  // Create new weekly trigger (every Sunday at 9 AM)
  ScriptApp.newTrigger('sendWeeklyReports')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.SUNDAY)
    .atHour(9)
    .create();

  console.log('Weekly report trigger created');
}
