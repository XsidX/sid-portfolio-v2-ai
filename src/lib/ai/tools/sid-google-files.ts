import { tool } from 'ai';
import { z } from 'zod';
import { google, drive_v3 } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';

// Initialize Google Drive client and knowledge base folder ID
let driveClient: drive_v3.Drive | null = null;
let knowledgeBaseFolderId: string | null = null;

async function initializeGoogleDrive() {
    if (driveClient && knowledgeBaseFolderId) {
        return;
    }

    let auth: GoogleAuth | undefined;

    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        try {
            const credential = JSON.parse(
                Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS, "base64").toString()
            );

            auth = new google.auth.GoogleAuth({
                credentials: {
                    client_email: credential.client_email,
                    private_key: credential.private_key,
                },
                scopes: ['https://www.googleapis.com/auth/drive.readonly'],
            });
            console.log('Google Drive client authenticated using GOOGLE_APPLICATION_CREDENTIALS (base64).');
        } catch (error) {
            console.error('Failed to parse or use GOOGLE_APPLICATION_CREDENTIALS:', error);
            throw new Error('Invalid GOOGLE_APPLICATION_CREDENTIALS format. Ensure it is a valid base64 encoded JSON string.');
        }
    } else {
        throw new Error('Neither GOOGLE_APPLICATION_CREDENTIALS nor GOOGLE_APPLICATION_CREDENTIALS environment variable is set. Please configure Google Drive authentication.');
    }

    // Initialize the Drive client with the chosen authentication method
    driveClient = google.drive({ version: 'v3', auth });

    if (process.env.GOOGLE_DRIVE_KNOWLEDGE_BASE_FOLDER_ID) {
        knowledgeBaseFolderId = process.env.GOOGLE_DRIVE_KNOWLEDGE_BASE_FOLDER_ID;
    } else {
        console.warn('GOOGLE_DRIVE_KNOWLEDGE_BASE_FOLDER_ID not set. Attempting to find "sidAssistantKnowledgeBase" folder by name. For production, hardcode the ID or set the env var.');
        try {
            const res = await driveClient.files.list({
                q: "name='sidAssistantKnowledgeBase' and mimeType='application/vnd.google-apps.folder'",
                fields: 'files(id, name)',
                spaces: 'drive',
            });
            const folder = res.data.files?.[0];
            if (folder && folder.id) {
                knowledgeBaseFolderId = folder.id;
                console.log(`Found "sidAssistantKnowledgeBase" folder with ID: ${knowledgeBaseFolderId}`);
            } else {
                throw new Error('Google Drive folder "sidAssistantKnowledgeBase" not found. Please create it and/or set GOOGLE_DRIVE_KNOWLEDGE_BASE_FOLDER_ID.');
            }
        } catch (error) {
            console.error('Error finding Google Drive folder by name:', error);
            throw new Error(`Failed to find Google Drive knowledge base folder: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    if (!knowledgeBaseFolderId) {
        throw new Error('Google Drive knowledge base folder ID could not be determined.');
    }
}

export function wrapContentInPrompt(content: string): string {
    const wrappedContent = `Here is the content for this topic: <TopicContent>${content}</TopicContent>`;
    return wrappedContent;
}

export async function readAboutSid(topicName: string): Promise<string> {
    await initializeGoogleDrive();

    if (!driveClient || !knowledgeBaseFolderId) {
        throw new Error('Google Drive client not initialized.');
    }

    try {
        const res = await driveClient.files.list({
            q: `'${knowledgeBaseFolderId}' in parents and name='${topicName}' and mimeType='application/vnd.google-apps.document'`,
            fields: 'files(id, name)',
            pageSize: 1,
        });

        const files = res.data.files || [];
        const topicDoc = files[0];

        if (!topicDoc || !topicDoc.id) {
            throw new Error(`Google Doc for topic "${topicName}" not found in Google Drive.`);
        }

        const contentRes = await driveClient.files.export({
            fileId: topicDoc.id,
            mimeType: 'text/plain',
        }, { responseType: 'stream' });

        let content = '';
        await new Promise<void>((resolve, reject) => {
            contentRes.data
                .on('data', (chunk: Buffer) => (content += chunk.toString()))
                .on('end', resolve)
                .on('error', reject);
        });

        return wrapContentInPrompt(content);
    } catch (error) {
        console.error(`Failed to read Google Doc for topic "${topicName}" from Google Drive:`, error);
        throw new Error(`Failed to read Google Doc for topic "${topicName}" from Google Drive: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export const getTopicNames = async (): Promise<string[]> => {
    await initializeGoogleDrive();

    if (!driveClient || !knowledgeBaseFolderId) {
        throw new Error('Google Drive client not initialized.');
    }

    try {
        const res = await driveClient.files.list({
            q: `'${knowledgeBaseFolderId}' in parents and mimeType='application/vnd.google-apps.document'`,
            fields: 'files(name)',
            pageSize: 100,
        });

        const files = res.data.files || [];
        return files
            .filter((f) => f.name !== null && f.name !== undefined)
            .map((f) => f.name as string);
    } catch (error) {
        console.error('Failed to get topic names from Google Drive (Google Docs):', error);
        throw new Error(`Failed to get topic names from Google Drive (Google Docs): ${error instanceof Error ? error.message : String(error)}`);
    }
};

export const getTopicNamesTool = tool({
    description: 'Get the list of available topics',
    parameters: z.object({}),
    execute: async () => {
        return await getTopicNames();
    },
});

export const readAboutSidTool = tool({
    description: 'Read about a specific topic',
    parameters: z.object({
        topicName: z.string(),
    }),
    execute: async ({ topicName }) => {
        return await readAboutSid(topicName);
    },
});


// Go to Google Cloud Console: https://console.cloud.google.com/
// Create a New Project (or select an existing one).
// Enable the Google Drive API:
// In the search bar at the top, type "Google Drive API" and select it.
// Click "Enable".
// Create a Service Account:
// Navigate to IAM & Admin > Service Accounts.
// Click "+ CREATE SERVICE ACCOUNT".
// Give it a name (e.g., sid-assistant-drive-reader).
// Click "Done".
// Generate a JSON Key for the Service Account:
// On the Service Accounts page, click the three dots (...) next to your newly created service account.
// Select "Manage keys".
// Click "ADD KEY" > "Create new key".
// Choose "JSON" and click "CREATE".
// A JSON file will be downloaded to your computer. This file contains your service account's credentials. Keep this file secure and do not commit it to your public repository!
// Share your Google Drive Folder with the Service Account:
// Go to your Google Drive (drive.google.com).
// Locate your sidAssistantKnowledgeBase folder.
// Right-click on the folder and select "Share".
// In the "Share with people and groups" box, paste the email address of your service account (you can find this email address on the Service Accounts page in the Google Cloud Console, it looks something like your-service-account-name@your-project-id.iam.gserviceaccount.com).
// Set the permission to "Viewer" (since your application only needs to read files).
// Click "Share" or "Send".
// Get the Google Drive Folder ID:
// Open your sidAssistantKnowledgeBase folder in Google Drive in your web browser.
// Look at the URL. It will be something like: https://drive.google.com/drive/folders/YOUR_FOLDER_ID_HERE
// Copy YOUR_FOLDER_ID_HERE. You'll need this ID to tell your application where to look for files.


// How to Base64 Encode your service-account-key.json:
// Linux/macOS:
// Generated bash
// base64 -w 0 < /path/to/your/service-account-key.json
// # The -w 0 flag prevents line wrapping, ensuring it's a single line.
// Use code with caution.
// Bash
// Windows (PowerShell):
// Generated powershell
// [Convert]::ToBase64String([System.IO.File]::ReadAllBytes("C:\path\to\your\service-account-key.json"))