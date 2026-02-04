# Math Adventure - Google Apps Script Integration

This Google Apps Script provides cloud backup and progress tracking for the Math Adventure app, syncing data to Google Sheets for parent/teacher monitoring.

## Features

- **Cloud Progress Backup**: Automatically sync student progress to Google Sheets
- **Cross-Device Sync**: Access progress from any device
- **Parent/Teacher Dashboard**: View all progress in a spreadsheet
- **Weekly Email Reports**: Optional automated progress emails
- **Leaderboard**: Track top performers

## Setup Instructions

### Step 1: Create the Google Apps Script Project

1. Go to [Google Apps Script](https://script.google.com)
2. Click **New Project**
3. Delete the default code and paste the contents of `Code.gs`
4. Click **File > Save** and name your project "Math Adventure Backend"

### Step 2: Deploy as Web App

1. Click **Deploy > New deployment**
2. Click the gear icon next to "Select type" and choose **Web app**
3. Configure the deployment:
   - **Description**: Math Adventure Backend
   - **Execute as**: Me (your account)
   - **Who has access**: Anyone
4. Click **Deploy**
5. **Important**: Copy the Web App URL that appears (it looks like `https://script.google.com/macros/s/.../exec`)

### Step 3: Authorize the Script

1. When prompted, click **Authorize access**
2. Choose your Google account
3. Click **Advanced** > **Go to Math Adventure Backend (unsafe)**
4. Click **Allow**

### Step 4: Configure Math Adventure

1. Open Math Adventure in your browser
2. Go to **Settings**
3. Scroll to **Cloud Sync** section
4. Enable **Enable Cloud Sync**
5. Paste the Web App URL into **Google Script URL**
6. (Optional) Add a parent/teacher email for weekly reports
7. Click **Save Settings**
8. Click **Sync Now** to test the connection

## Spreadsheet Structure

The script automatically creates a Google Spreadsheet with these sheets:

### Players Sheet
| Column | Description |
|--------|-------------|
| Player ID | Unique identifier |
| Name | Student's name |
| Email | Parent/teacher email |
| Level | Current level |
| Total Points | Lifetime points |
| Total Correct | Lifetime correct answers |
| Total Attempts | Lifetime attempts |
| Best Streak | Best consecutive correct |
| Last Sync | Last sync timestamp |
| Created | Account creation date |

### Daily Progress Sheet
| Column | Description |
|--------|-------------|
| Player ID | Links to player |
| Date | Date of activity |
| Correct | Correct answers that day |
| Attempts | Total attempts |
| Points | Points earned |
| Sessions | Number of sessions |
| Accuracy % | Daily accuracy |

### Leaderboard Sheet
Auto-generated ranking of all players by total points.

### Fact Performance Sheet
Tracks performance on individual multiplication/division facts for identifying struggling areas.

## Setting Up Weekly Reports

To send automated weekly progress reports:

1. Open your Apps Script project
2. In `Code.gs`, find `CONFIG.SEND_EMAIL_REPORTS`
3. Change it to `true`
4. Run `setupWeeklyReportTrigger()` once to create the trigger
5. Reports will be sent every Sunday at 9 AM

## API Endpoints

### GET Requests

**Status Check**
```
?action=status
```

**Get Player Progress**
```
?action=getProgress&playerId=PLAYER_ID
```

**Get Leaderboard**
```
?action=getLeaderboard&limit=10
```

### POST Requests

**Sync Progress**
```json
{
  "action": "syncProgress",
  "playerId": "...",
  "playerName": "...",
  "level": 5,
  "totalPoints": 1250,
  "totalCorrect": 98,
  "totalAttempts": 110,
  "bestStreak": 15,
  "progressHistory": [...],
  "factPerformance": {...}
}
```

**Save Session**
```json
{
  "action": "saveSession",
  "playerId": "...",
  "correct": 8,
  "attempts": 10,
  "points": 95
}
```

## Troubleshooting

### "Script function not found" error
- Make sure you deployed as a **Web app**, not just saved the project

### "Access denied" error
- Re-authorize the script
- Make sure "Who has access" is set to "Anyone"

### Data not syncing
- Check your Web App URL is correct (should end with `/exec`)
- Try the "Sync Now" button in settings
- Check browser console for errors

### Spreadsheet not created
- Run `testSetup()` in the Apps Script editor to manually create it
- Check your Google Drive for "Math Adventure Progress"

## Privacy Note

All data is stored in your personal Google Drive. Student data is only accessible to:
- The Google account that deployed the script
- Anyone with the spreadsheet link (if shared)

Consider:
- Not sharing the spreadsheet publicly
- Using student initials instead of full names
- Reviewing your school's data privacy policies
