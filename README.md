# Car Genie Backend

Backend API server for Car Genie - AI-powered car recommendation chatbot.

## Features

- 🤖 **AI Chat**: Gemini-powered conversational car recommendations
- 📧 **Email Integration**: Resend API for notifications
- 🔐 **Firebase Auth**: User authentication and authorization
- 🗄️ **Firestore**: Chat history and dealer application storage
- 🚗 **Dealer Onboarding**: Secure dealer partnership applications with encrypted credentials

## Tech Stack

- **Node.js** + **Express** - Server framework
- **TypeScript** - Type safety
- **Firebase Admin SDK** - Authentication & Firestore
- **Google Gemini AI** - LLM for chat responses
- **Resend** - Email service

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Firebase project with service account key
- Gemini API key
- Resend API key (optional, for emails)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` with your credentials:
   ```env
   PORT=4000
   GEMINI_API_KEY=your_gemini_api_key
   RESEND_API_KEY=your_resend_api_key
   EMAIL_USER=onboarding@resend.dev
   FIREBASE_SERVICE_ACCOUNT={"type":"service_account"...}
   DB_ENCRYPTION_KEY=your-32-character-encryption-key
   FRONTEND_URL=http://localhost:5173
   ```

4. Add your Firebase service account key to `serviceAccountKey.json` (or use the env variable)

### Development

Run the development server with hot reload:
```bash
npm run dev
```

Server will start on `http://localhost:4000`

### Production

Build and run:
```bash
npm run build
npm start
```

## API Endpoints

### Chat
- `POST /chat` - Send chat message (requires auth)
- `GET /chat/history` - Get user's chat history (requires auth)
- `DELETE /chat/history` - Clear user's chat history (requires auth)

### Dealers
- `POST /api/dealers/onboard` - Submit dealer application (public, rate limited)
- `GET /api/dealers/applications` - List applications (admin only)
- `POST /api/dealers/applications/:id/approve` - Approve application (admin only)
- `POST /api/dealers/applications/:id/reject` - Reject application (admin only)

### Email
- `POST /send-email` - Send contact email (public)

### Health
- `GET /health` - Server health check

## Project Structure

```
src/
├── config/
│   └── env.ts              # Environment configuration
├── controllers/
│   ├── chat.controller.ts  # Chat endpoints
│   ├── dealer.controller.ts # Dealer onboarding
│   └── email.controller.ts # Email sending
├── middleware/
│   ├── auth.ts             # Firebase auth middleware
│   └── rateLimiter.ts      # Rate limiting
├── models/
│   ├── chat.types.ts       # Chat type definitions
│   └── dealer.types.ts     # Dealer type definitions
├── routes/
│   ├── chat.routes.ts      # Chat routes
│   ├── dealer.routes.ts    # Dealer routes
│   └── email.routes.ts     # Email routes
├── services/
│   ├── llm.service.ts      # Gemini AI integration
│   ├── dealers.service.ts  # Dealer data enrichment
│   └── email.service.ts    # Email service
├── firebase.ts             # Firebase admin initialization
└── index.ts                # Express app setup

```

## Security

- Database credentials are encrypted using AES-256
- Rate limiting on dealer onboarding (3 requests/hour)
- Firebase authentication for user endpoints
- CORS configured for specific frontends
- Environment variables for sensitive data

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 4000) |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `FIREBASE_SERVICE_ACCOUNT` | Yes | Firebase service account JSON |
| `DB_ENCRYPTION_KEY` | Yes | 32-char key for encrypting dealer DB credentials |
| `RESEND_API_KEY` | No | Resend API key for emails |
| `EMAIL_USER` | No | Email sender address |
| `FRONTEND_URL` | No | Frontend URL for CORS |

## Deployment

Deploy to any Node.js hosting platform:
- Render
- Railway
- Heroku
- AWS EC2/ECS
- Google Cloud Run

Make sure to:
1. Set all environment variables
2. Whitelist deployment URL in Firebase
3. Update CORS origins

## License

MIT
