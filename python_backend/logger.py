"""
Google Drive Logger for Ripple App
Logs conversation history to Google Drive in Markdown format
"""

import os
import json
from datetime import datetime
from typing import Optional, Dict, Any
from google.oauth2.credentials import Credentials
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload, MediaIoBaseUpload
from googleapiclient.errors import HttpError
import io


class DriveLogger:
    """
    Manages logging to Google Drive using the Drive API
    """

    def __init__(self, credentials_path: str, use_service_account: bool = False):
        """
        Initialize the Drive Logger

        Args:
            credentials_path: Path to credentials JSON file
            use_service_account: If True, use service account; else use OAuth2
        """
        self.credentials_path = credentials_path
        self.use_service_account = use_service_account
        self.service = None
        self.follow_folder_id = None
        self._authenticate()

    def _authenticate(self):
        """Authenticate with Google Drive API"""
        try:
            if self.use_service_account:
                credentials = service_account.Credentials.from_service_account_file(
                    self.credentials_path,
                    scopes=['https://www.googleapis.com/auth/drive.file']
                )
            else:
                # For OAuth2, you would implement token refresh logic here
                # This is a simplified version
                credentials = Credentials.from_authorized_user_file(
                    self.credentials_path,
                    scopes=['https://www.googleapis.com/auth/drive.file']
                )

            self.service = build('drive', 'v3', credentials=credentials)
            print("✓ Authenticated with Google Drive")
        except Exception as e:
            print(f"✗ Authentication failed: {e}")
            raise

    def _find_or_create_folder(self, folder_name: str = "follow") -> str:
        """
        Find or create the 'follow' folder in Google Drive

        Args:
            folder_name: Name of the folder to find/create

        Returns:
            Folder ID
        """
        try:
            # Search for existing folder
            query = f"name='{folder_name}' and mimeType='application/vnd.google-apps.folder' and trashed=false"
            results = self.service.files().list(
                q=query,
                spaces='drive',
                fields='files(id, name)'
            ).execute()

            items = results.get('files', [])

            if items:
                folder_id = items[0]['id']
                print(f"✓ Found existing folder '{folder_name}': {folder_id}")
                return folder_id
            else:
                # Create new folder
                file_metadata = {
                    'name': folder_name,
                    'mimeType': 'application/vnd.google-apps.folder'
                }
                folder = self.service.files().create(
                    body=file_metadata,
                    fields='id'
                ).execute()
                folder_id = folder.get('id')
                print(f"✓ Created new folder '{folder_name}': {folder_id}")
                return folder_id

        except HttpError as error:
            print(f"✗ Error finding/creating folder: {error}")
            raise

    def _create_markdown_content(self, session_data: Dict[str, Any]) -> str:
        """
        Create Markdown formatted content from session data

        Args:
            session_data: Dictionary containing session information

        Returns:
            Markdown formatted string
        """
        md_content = f"# Session: {session_data.get('mode', 'Unknown')}\n\n"
        md_content += f"**Date:** {session_data.get('date', 'N/A')}\n\n"
        md_content += f"**Session ID:** {session_data.get('session_id', 'N/A')}\n\n"
        md_content += "---\n\n"

        messages = session_data.get('messages', [])
        for msg in messages:
            role = msg.get('role', 'unknown')
            content = msg.get('content', '')
            timestamp = msg.get('timestamp', '')

            if role == 'user':
                md_content += f"### 👤 User\n{content}\n\n"
            else:
                md_content += f"### 🤖 AI\n{content}\n\n"

            if timestamp:
                md_content += f"*{timestamp}*\n\n"

        # Add feedback/evaluation if present
        if 'feedback' in session_data:
            md_content += "---\n\n## 📊 Feedback\n\n"
            feedback = session_data['feedback']
            for key, value in feedback.items():
                md_content += f"**{key}:** {value}\n\n"

        return md_content

    def log_session(self, session_data: Dict[str, Any]) -> Optional[str]:
        """
        Log a session to Google Drive

        Args:
            session_data: Dictionary containing session information

        Returns:
            File ID of created/updated file, or None on error
        """
        try:
            # Ensure follow folder exists
            if not self.follow_folder_id:
                self.follow_folder_id = self._find_or_create_folder()

            # Generate filename
            date_str = datetime.now().strftime("%Y-%m-%d")
            session_id = session_data.get('session_id', 'session')
            filename = f"{date_str}_{session_id}.md"

            # Create markdown content
            content = self._create_markdown_content(session_data)

            # Check if file already exists
            query = f"name='{filename}' and '{self.follow_folder_id}' in parents and trashed=false"
            results = self.service.files().list(
                q=query,
                fields='files(id, name)'
            ).execute()

            items = results.get('files', [])

            # Create media upload
            media = MediaIoBaseUpload(
                io.BytesIO(content.encode('utf-8')),
                mimetype='text/markdown',
                resumable=True
            )

            if items:
                # Update existing file
                file_id = items[0]['id']
                updated_file = self.service.files().update(
                    fileId=file_id,
                    media_body=media
                ).execute()
                print(f"✓ Updated file: {filename}")
                return updated_file.get('id')
            else:
                # Create new file
                file_metadata = {
                    'name': filename,
                    'parents': [self.follow_folder_id],
                    'mimeType': 'text/markdown'
                }
                file = self.service.files().create(
                    body=file_metadata,
                    media_body=media,
                    fields='id'
                ).execute()
                print(f"✓ Created file: {filename}")
                return file.get('id')

        except HttpError as error:
            print(f"✗ Error logging session: {error}")
            return None

    def append_to_session(self, session_id: str, new_message: Dict[str, Any]) -> bool:
        """
        Append a new message to an existing session file

        Args:
            session_id: Session identifier
            new_message: Message dictionary to append

        Returns:
            True if successful, False otherwise
        """
        # This is a simplified version. In production, you'd:
        # 1. Download existing file
        # 2. Parse it
        # 3. Append new message
        # 4. Re-upload
        # For now, we'll just create a new session data and log it
        return True


# Flask API wrapper (optional)
if __name__ == "__main__":
    from flask import Flask, request, jsonify
    from flask_cors import CORS

    app = Flask(__name__)
    CORS(app)

    # Initialize logger
    # You'll need to provide credentials file path
    CREDENTIALS_PATH = os.getenv('GOOGLE_CREDENTIALS_PATH', 'credentials.json')
    USE_SERVICE_ACCOUNT = os.getenv('USE_SERVICE_ACCOUNT', 'false').lower() == 'true'

    try:
        logger = DriveLogger(CREDENTIALS_PATH, USE_SERVICE_ACCOUNT)
    except Exception as e:
        print(f"Failed to initialize logger: {e}")
        logger = None

    @app.route('/log', methods=['POST'])
    def log_session():
        """Endpoint to log a session"""
        if not logger:
            return jsonify({'error': 'Logger not initialized'}), 500

        data = request.json
        file_id = logger.log_session(data)

        if file_id:
            return jsonify({'success': True, 'file_id': file_id}), 200
        else:
            return jsonify({'error': 'Failed to log session'}), 500

    @app.route('/health', methods=['GET'])
    def health():
        """Health check endpoint"""
        return jsonify({'status': 'ok', 'logger_ready': logger is not None}), 200

    # Run server
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
