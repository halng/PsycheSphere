<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/64c7defe-0840-4e6a-bd85-7aadf566bd07

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Configure environment variables in [.env.local](.env.local):
   - `GEMINI_API_KEY` for Gemini copy-editing.
   - `VITE_OPENAI_API_KEY` for ChatGPT/OpenAI social kit generation.
   - Optional `VITE_OPENAI_MODEL` to override the default OpenAI model.
   - `VITE_FIREBASE_PROJECT_ID` and `VITE_FIREBASE_API_KEY` to enable Firestore-backed CRUD for posts, users, and writer requests.
   - Optional `VITE_FIREBASE_DATABASE_ID` if you are not using Firestore's `(default)` database.
3. Run the app:
   `npm run dev`
