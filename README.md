# Chat Socket

A monorepo containing a chat application with separate client and server implementations.

## Structure

- **client/** - React frontend application (Vite + React)
- **server/** - Node.js backend server

## Getting Started

### Client
```bash
cd client
npm install
npm run dev
```

### Server
```bash
cd server
npm install
npm start
```

## Development

Each folder has its own `package.json` and configuration files. Install dependencies separately for each.

## Git Setup

This is a single GitHub repository containing both client and server. When pushing to GitHub:

```bash
git add .
git commit -m "Your commit message"
git push origin main
```
