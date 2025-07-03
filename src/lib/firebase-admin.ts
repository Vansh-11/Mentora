
import * as admin from 'firebase-admin';

// Prevent re-initialization of the app
if (!admin.apps.length) {
  // When deployed to a Google Cloud environment (like App Hosting),
  // GCLOUD_PROJECT is automatically set.
  if (process.env.GCLOUD_PROJECT) {
    admin.initializeApp();
    console.log("Firebase Admin SDK initialized using Application Default Credentials (production).");
  } else {
    // When running locally, use the hardcoded service account.
    console.log("No GCLOUD_PROJECT env var found, initializing with hardcoded service account (local).");
    try {
      const serviceAccount = {
            "type": "service_account",
            "project_id": "mentora-462812",
            "private_key_id": "72620b46bdaa82b47272945a6ab492735fb13ed5",
            "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQC2sq4N2ObpFvbB\nGc8KhLFln7IB6ncuM/Bt5NNuRNb5Sm2KZk96J8+OFqY+fZtu3LE5HCqdOnXWyVGI\niZ9gPQyRIGF7ytdDnfY9NCxKRFN8llU2RgBl3r/E3A8p4TP9atWnCKGPsUlD3gfU\nOqgIoo42birF+o1tXPdmiNHnowoDJfrwBTEwcFc9hFnaXCojaOweMJLy213Wn5NA\nd4r5Ev/xLLiF1Lajz/6yeGkvsW33KT0gdb+YrSGEiGHcJed2a5aty9MFRHxUL8Gr\nfpTfbcIvPCxZiZpv2Ne/WCbpq3GKTzuAQUfSmQEwgucnsesqSj5tFZYbzXdR6Lrf\nuYvNHPQLAgMBAAECggEATzHQCheaLLL0Hotp+JTBcxxQ5My2gdQo5fIZhoSXrTNK\nnYIw9HI6YczGnnMDRACtX+SqQkJ7nzHgQm/poqWEA4rGRwuL2XcpLKmngz/v8qMV\n5/NbK81tUk/T0OMajsDXQVMX+XovmJgvy5rriOax/70slGpCEQSKB6vKVX8SkX8T\nJKJTN/o8HRsVkNBNfZJu26hbSMKfBvmCDcU9rSFNeqkdHCb3d/sdxJX0bDbhxJxZ\nim/dmV2eegu239EDQQSShL2fNmn9sLUbMupa1dgCzUllvRKXNXBwNxSYvKO+Y+sf\nRcFUXVCGc2Z/7R6UFt7JpWrUDuejOI5FDltz9hbLyQKBgQDdyupksTziwuFnZXBX\nhZb5GLRv4ARLC2bT4BGj4z/4YKGsyn94t2UPoH70dy8ADDR/lAD0yWNOr0/KXncH\n4q0rqQeTFKtFybHS2+tLqBER+Gps5iT/95teK/w9c0qO01Y0khCRL2nOhPzCRmeA\nUL6y41lpZto3hX1kWoZIgn14iQKBgQDS4C5uc4lCtxCp6C65m0QdfcRYhOJ06wAA\nqoJyXKZHK/0eWM5obRqj4cLyK9bH1oaxJqIFIkNlNl8A5sCck8JHcqZzFEJcQHlm\npglvwZSCEGuFvyF3TW9J2L1JQX7Mc11d/ZSwbop0MB9cmvqzZXvqJ98icNX6pdwR\nxXOMFvC68wKBgQC7KWjy374JfXrIzgknUkw8mGRrpBb7XPvA/+zi5/orlx/XuGop\nbFmT/lQj6A95ctM6daL47pkm5TnoBB9eQCLyHQmPTHnbwoCU95Bvn7wH9iGZE/V\nI5Wwul15XbklHaI5aqkgW2pmJENHjjH5Tioeu0vQbkLnZ3aRIPMAbV2EQQKBgQC7\nDVqCZP/LawFgBXF0+HIqSsYg0vbhSRb+gEEn2mEwXqevBI1K+gSYfAjlsddZ+kQN\n3bv4G9V2cQ1Cim0uNq8tm1hkWgMnO5W0ZPGX7TmjSZdm0wyHe+uMsLHuyicEigy2\n89mxyswLligrh9l7yjhpkyaNsVNNe1RDe0csa6jr2wKBgQDWJ2n8zI+FG6nJRjoY\nwdOzWA2oxVG3+hXZN+DXinJrmpzBL6OwGygxGMid15AZhdTvGfnHjXsmHFaUoZFc\nWqCU/jcbiqQBW5ieCvCR2x3V0zlV/rZY7ifQp7k6SN0OPyn2qmuic1gjZ6tBA2Tv\nk+Eu4bEiFSzpheBHzj1LDfFuYg==\n-----END PRIVATE KEY-----\n",
            "client_email": "firebase-adminsdk-fbsvc@mentora-462812.iam.gserviceaccount.com",
            "client_id": "109250536052686350321",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40mentora-462812.iam.gserviceaccount.com",
            "universe_domain": "googleapis.com"
      };
      
      // The private_key must have newlines correctly formatted to be parsed from a string.
      serviceAccount.private_key = (serviceAccount.private_key || '').replace(/\\n/g, '\n');

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        projectId: serviceAccount.project_id,
      });
      console.log("Firebase Admin SDK initialized successfully using hardcoded service account.");
    } catch (e) {
      console.error("CRITICAL: Failed to initialize Firebase Admin SDK for local development.", e);
    }
  }
}

// Export the initialized services. Using a null check for safety.
export const db = admin.apps.length > 0 ? admin.firestore() : null;
export const auth = admin.apps.length > 0 ? admin.auth() : null;

// Log an error if services are still not available after initialization.
if (!db) {
  console.error("Firestore (db) instance is null after initialization attempt. Check server logs for errors.");
}
if (!auth) {
  console.error("Auth instance is null after initialization attempt. Check server logs for errors.");
}
