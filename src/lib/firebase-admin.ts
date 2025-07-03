
import * as admin from 'firebase-admin';

function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    console.log("Firebase Admin SDK already initialized.");
    return;
  }

  // This is a bit of a hack. The initialization will fail in a deployed environment
  // if service account is provided, and fail in a local environment if it's not.
  // This structure tries the deployed-first approach, then falls back to local.
  try {
    // This will work in App Hosting environments with default credentials
    admin.initializeApp();
    console.log("Firebase Admin SDK initialized successfully with default credentials.");
  } catch (error) {
    // This is the fallback for local development
    console.log("Default credential initialization failed, trying hardcoded service account for local dev.");
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

      // The private_key must have newlines correctly formatted to be parsed.
      serviceAccount.private_key = (serviceAccount.private_key || '').replace(/\\n/g, '\n');

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        projectId: serviceAccount.project_id,
      });
      console.log("Firebase Admin SDK initialized successfully with hardcoded service account.");
    } catch (error) {
      console.error("CRITICAL: Service account initialization failed for local development.", error);
    }
  }
}

// Initialize the app
initializeFirebaseAdmin();

// Export the initialized services, ensuring they are not null.
export const db = admin.apps.length > 0 ? admin.firestore() : null;
export const auth = admin.apps.length > 0 ? admin.auth() : null;

// Add a check to log if services are null for easier debugging
if (!db) {
  console.error("Firestore (db) instance is null. Check initialization logs.");
}
if (!auth) {
  console.error("Auth instance is null. Check initialization logs.");
}
