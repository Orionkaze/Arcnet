# ArcNet

**The India-First AVGC Ecosystem.** Built by Arcavon.

ArcNet is an integrated community platform designed exclusively for Game Developers, Artists, Animators, and Game Testers. It centralizes social networking, team formation, game jams, mentorship, and career growth into a single, high-performance web application.

---

## 🔮 Core Modules & Features

Based on the official ArcNet design architecture, the platform is divided into the following core navigation pillars:

* **Public Hubs**: Dedicated community feeds categorized into Game Developers, 2D/3D Artists, Animators, Storywriters, and Game Testers.
* **Social Feed & Connectivity**: Users can create posts to showcase 2D/3D assets and share knowledge. The platform features a real-time notification system for new followers and direct messages.
* **Game Jams**: A centralized portal for featured and upcoming competitions. It hosts major events like the "Arcavon Monthly Jam" as well as other GameJams.
* **Team Formation**: 
  * **Join Teams**: Browse established squads and submit a "Request to Join".
  * **Find Mates**: A talent directory highlighting users' primary skills, with options to "View Profile" or "Invite" to a project.
* **Mentorship**: The "FIND MENTORS" section allows users to browse verified professionals, such as Game Designers, Animators, VFX Artists, and immediately "Book a session".
* **India-First Job Board**: A tailored hiring hub detailing roles from Internships to Full-Time positions. Listings feature transparent CTC (e.g., ₹15-20 LPA or ₹15,000/month) alongside straightforward "View Description" and "Apply Now" actions.
* **Private Hubs**: Exclusive, code-gated collaboration spaces for Companies and Game Development Studios to collaborate with their team members.

*(Note: The AI Match feature is planned for a future release phase and is currently disabled in the navigation.)*

---

## 🏗️ Technical Architecture

This project uses a decoupled **MERN Stack** (MongoDB, Express.js, React/Next.js, Node.js) configured with TypeScript. It relies on a straightforward two-folder structure to maximize development velocity.

### **Frontend (`/frontend`)**
* **Framework:** Next.js v16.2.4 (App Router)
* **Language:** TypeScript
* **Styling:** Tailwind CSS
* **State Management:** Zustand
* **Real-time:** Socket.io-client

### **Backend (`/backend`)**
* **Runtime/Framework:** Node.js v25.9.0 + Express.js v5.2.1
* **Language:** TypeScript v6.0.3
* **Database:** MongoDB v8.2.7
* **Caching:** Redis v8.6.2
* **Real-time:** Socket.io v4.8.3
* **Authentication & Authorization:** Google OAuth, JWT

---

## 📁 Project Structure

```text
arcnet/
├── frontend/                   # Next.js Application
│   ├── package.json
│   ├── next.config.mjs
│   ├── tailwind.config.ts
│   ├── .env.local              
│   └── src/
│       ├── app/                # Next.js Routes (Hubs, Jams, Jobs, etc.)
│       ├── components/         # Reusable React UI (Tailwind)
│       ├── lib/                # Axios, Socket.io, Utilities
│       ├── store/              # Zustand State Stores
│       └── types/              # Frontend TS Interfaces
│
└── backend/                    # Node.js + Express API
    ├── package.json
    ├── tsconfig.json
    ├── .env                    
    └── src/
        ├── server.ts           # Entry point & Socket initialization
        ├── db.ts               # MongoDB config
        ├── routes/             # API Endpoints
        ├── controllers/        # Business Logic
        ├── models/             # Mongoose Schemas
        ├── middlewares/        # Auth & Validation
        ├── services/           # Redis & External Integrations
        └── types/              # Backend TS Interfaces
