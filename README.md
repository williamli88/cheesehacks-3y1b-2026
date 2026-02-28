# STYLR — Campus AI Clothing Swap Platform

A mobile-responsive web application for campus-based AI clothing swapping. Built with a Java Spring Boot backend and a React + Vite frontend.

---

## Architecture

```
cheesehacks-3y1b-2026/
├── backend/      # Spring Boot + SQLite REST API
└── frontend/     # React + Vite mobile-responsive web app
```

### Backend Engines
1. **Recommendation Engine** — Cosine similarity on style/color tag vectors for ranked swipe feed
2. **Double-Blind Swipe Ledger** — Match detection without exposing swipe history to clients
3. **LCA Sustainability Calculator** — CO₂ / water savings with human-readable equivalents

### Frontend Features
- 📱 Mobile-first container (max-width: 400px)
- 🔄 Swipe card UI with Hammer.js touch gestures
- 💚 Match detection and notification overlay
- 🌱 Animated impact dashboard (CO₂, water, miles)

---

## Requirements

| Tool | Version |
|------|---------|
| Java | 17+ |
| Maven | 3.8+ |
| Node.js | 18+ |
| npm | 9+ |

---

## Setup & Run

### 1. Backend

```bash
cd backend
mvn clean package -DskipTests
java -jar target/clothing-swap-0.0.1-SNAPSHOT.jar
```

The backend starts on **http://localhost:8080** and automatically seeds:
- 20 fake campus users (password: `password123`)
- 100 clothing items with randomized tags

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend starts on **http://localhost:3000**

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/login` | Login with username + password |
| `POST` | `/auth/register` | Register a new user |
| `GET`  | `/auth/users` | List all users (demo helper) |
| `GET`  | `/feed/{userId}` | Get AI-ranked clothing feed |
| `POST` | `/swipe` | Record swipe (`RIGHT`/`LEFT`), detect matches |
| `GET`  | `/matches/{userId}` | Get matched items |
| `GET`  | `/impact/{userId}` | Get sustainability impact stats |

### POST /auth/login
```json
{ "username": "alex5130", "password": "password123" }
```

### POST /swipe
```json
{ "userIdFrom": 1, "itemIdTo": 8, "action": "RIGHT" }
```

---

## Sustainability Values (Hardcoded LCA)

| Category | Water | CO₂ |
|----------|-------|-----|
| T-Shirt  | 2700L | 2kg |
| Jeans    | 7600L | 5kg |
| Jacket   | 10000L | 8kg |
| Dress    | 5000L | 4kg |
| Shoes    | 8000L | 6kg |
| Sweater  | 4000L | 3.5kg |

**Formula:** `Saved = (LCA_value × 0.5) − ShippingImpact (0.2kg CO₂ / 50L water)`

**Equivalents:**
- 🌳 Trees planted = CO₂ saved ÷ 21 kg/tree/year
- 🚿 Showers saved = water saved ÷ 65 L/shower
- 🚗 Miles not driven = CO₂ saved ÷ 0.404 kg/mile

---

## Database Schema

Three JPA-managed SQLite tables:

**users** — id, username, email, password, campus, totalWaterSaved, totalCo2Saved, totalSwapsCompleted

**clothing_items** — id, userId, category, size, condition, colorTags, styleTags, campus, imageUrl, title, description

**swipe_ledger** — id, userIdFrom, itemIdTo, action (RIGHT/LEFT), timestamp

---

## Demo

1. Start backend → auto-seeded with 20 users + 100 items
2. Open frontend → click a **Quick Demo Login** button
3. Swipe right on items to like them
4. When two users both like each other's items → Match!
5. Check the 🌱 Impact tab to see your sustainability stats
