# Python Backend - Google Drive Logger

This backend service logs Ripple app conversations to Google Drive in Markdown format.

## Setup

### 1. Install Dependencies

```bash
cd python_backend
pip install -r requirements.txt
```

### 2. Google Drive API Setup

#### Option A: Service Account (Recommended for server deployment)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Drive API
4. Create a Service Account
5. Download the JSON credentials file
6. Save it as `credentials.json` in this directory
7. Set environment variable:
   ```bash
   export USE_SERVICE_ACCOUNT=true
   export GOOGLE_CREDENTIALS_PATH=credentials.json
   ```

#### Option B: OAuth 2.0 (For personal use)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Download client configuration
4. Run OAuth flow to get credentials
5. Set environment variable:
   ```bash
   export USE_SERVICE_ACCOUNT=false
   export GOOGLE_CREDENTIALS_PATH=token.json
   ```

### 3. Run the Server

```bash
python logger.py
```

The server will run on `http://localhost:5000`

## API Endpoints

### POST /log

Log a conversation session to Google Drive.

**Request Body:**
```json
{
  "session_id": "unique_session_id",
  "mode": "manager",
  "date": "2024-01-15T10:30:00",
  "messages": [
    {
      "role": "user",
      "content": "Hello",
      "timestamp": "10:30:15"
    },
    {
      "role": "ai",
      "content": "Hi there!",
      "timestamp": "10:30:20"
    }
  ],
  "feedback": {
    "score": 85,
    "comments": "Good conversation flow"
  }
}
```

**Response:**
```json
{
  "success": true,
  "file_id": "1ABC...XYZ"
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "logger_ready": true
}
```

## File Format

Logs are saved in the `follow` folder on Google Drive with the filename format:
```
YYYY-MM-DD_SessionID.md
```

Example: `2024-01-15_session_abc123.md`

## Environment Variables

- `GOOGLE_CREDENTIALS_PATH`: Path to credentials JSON file (default: `credentials.json`)
- `USE_SERVICE_ACCOUNT`: Use service account auth (default: `false`)
- `PORT`: Server port (default: `5000`)

## Security Notes

- Never commit credentials files to version control
- Add `credentials.json` and `token.json` to `.gitignore`
- Use environment variables for sensitive data in production
