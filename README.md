# ArcNet

**The India-First AVGC Ecosystem.** Built by Arcavon.

ArcNet is an integrated community platform designed exclusively for Game Developers, Artists, Animators, and Game Testers. It centralizes social networking, team formation, game jams, mentorship, and career growth into a single, high-performance web application.

---

## 🔮 Core Modules & Features

[cite_start]Based on the official ArcNet design architecture, the platform is divided into the following core navigation pillars [cite: 18-24]:

* [cite_start]**Public Hubs**: Dedicated community feeds categorized into Game Developers [cite: 6][cite_start], 2D/3D Artists [cite: 7][cite_start], Animators [cite: 8][cite_start], Storywriters [cite: 9][cite_start], and Game Testers[cite: 10].
* [cite_start]**Social Feed & Connectivity**: Users can create posts to showcase 2D/3D assets and share knowledge[cite: 49, 57]. [cite_start]The ecosystem features a real-time notification system tracking new followers and direct messages [cite: 117-119]. 
* [cite_start]**Game Jams**: A centralized portal for featured and upcoming competitions [cite: 78-79]. [cite_start]It hosts flagship events like the "Arcavon Monthly Jam" featuring a ₹50000 prize pool [cite: 82-83][cite_start], as well as community events like the "Retro Revival Jam" [cite: 87-88].
* **Team Formation**: 
  * [cite_start]**Join Teams**: Browse established squads (e.g., NOVA, FLASH) and submit a "Request to Join" [cite: 297-308].
  * [cite_start]**Find Mates**: A talent directory highlighting users' primary skills, such as Blender and 3D Environment Design, with options to "View Profile" or "Invite" to a project [cite: 313-328].
* [cite_start]**Mentorship**: The "FIND MENTORS" hub allows users to browse verified professionals, such as VFX Artists, and immediately "Book a session" [cite: 565-580].
* [cite_start]**India-First Job Board**: A tailored hiring hub detailing roles from Internships to Full-Time positions[cite: 853, 865]. [cite_start]Listings feature transparent INR compensation (e.g., ₹15-20 LPA or ₹15000/month) alongside straightforward "View Description" and "Apply Now" actions [cite: 850-866].
* [cite_start]**Private Hubs**: Exclusive, code-gated collaboration spaces where users must "Enter Hub Code" to submit a request for entry [cite: 239-242].

[cite_start]*(Note: The AI Match feature is planned for a future release phase and is currently disabled in the navigation[cite: 23, 45].)*

---

## 🏗️ Technical Architecture

This project uses a decoupled **MERN Stack** (MongoDB, Express.js, React/Next.js, Node.js) configured with TypeScript. It relies on a straightforward two-folder structure to maximize development velocity.

### **Frontend (`/frontend`)**
* **Framework:** Next.js 14+ (App Router)
* **Language:** TypeScript
* **Styling:** Tailwind CSS
* **State Management:** Zustand
* **Real-time:** Socket.io-client

### **Backend (`/backend`)**
* **Runtime/Framework:** Node.js + Express.js
* **Language:** TypeScript
* **Database:** MongoDB (Mongoose)
* **Caching:** Redis
* **Real-time:** Socket.io

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