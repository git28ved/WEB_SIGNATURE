# 📝 DocSign — Document Signature App

A secure, full-stack web application for digital document signing — similar to DocuSign and Adobe Sign.

## Features

- 🔐 JWT-based authentication (register/login)
- 📄 PDF upload & management dashboard
- ✍️ Drag-and-drop signature placement on PDFs
- 📊 Document status tracking (Draft → Pending → Signed/Rejected)
- 🖊️ Type or draw your signature
- 📱 Fully responsive design

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite), Tailwind CSS, react-pdf, dnd-kit |
| Backend | Node.js, Express |
| Database | MongoDB (Atlas) |
| Auth | JWT + bcrypt |
| File Upload | Multer |
| PDF Processing | pdf-lib |

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account

### Setup

1. **Clone the repo**
```bash
git clone <repo-url>
cd Project1_Intern
```

2. **Backend setup**
```bash
cd server
npm install
# Edit .env with your MongoDB URI and JWT secret
npm run dev
```

3. **Frontend setup**
```bash
cd client
npm install
npm run dev
```

4. **Open browser** at `http://localhost:5173`

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register user |
| POST | `/api/auth/login` | ❌ | Login user |
| GET | `/api/auth/me` | ✅ | Get profile |
| POST | `/api/docs/upload` | ✅ | Upload PDF |
| GET | `/api/docs/` | ✅ | List documents |
| GET | `/api/docs/:id` | ✅ | Get document |
| GET | `/api/docs/:id/file` | ✅ | Serve PDF |
| DELETE | `/api/docs/:id` | ✅ | Delete document |
| POST | `/api/signatures` | ✅ | Create signature |
| GET | `/api/signatures/:docId` | ✅ | Get signatures |
| PUT | `/api/signatures/:id` | ✅ | Update signature |

## License

ISC
