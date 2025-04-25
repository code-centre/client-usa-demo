// lib/google.js
import { google } from 'googleapis';
import path from 'path';
import { readFileSync } from 'fs';

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(process.cwd(), 'credenciales.json'),
  scopes: ['https://www.googleapis.com/auth/documents'], 
});

const credentialsPath = path.join(process.cwd(), 'credenciales.json');
console.log('Path to credentials:', credentialsPath);

export async function getGoogleDocsClient() {
  const authClient = await auth.getClient();
  return google.docs({ version: 'v1', auth: authClient });
}