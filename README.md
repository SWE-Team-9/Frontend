# 🎧 SoundCloud Clone – Frontend Modules
This document describes the frontend architecture and implementation details for the Modules of our SoundCloud-inspired music streaming platform.
---
## 🚀Frontend Tech Stack
### Framework
- **Next.js (App Router)**
- **TypeScript**
### Styling
- **Tailwind CSS**
### State Management
- **Zustand**
### API Communication
- **Axios**
- **MSW (Mock Service Worker)**
### Testing
- **Jest**
- **React Testing Library**
---
# 📦 Modules & Frontend Implementation
---
## 🔐 Module 1: Authentication & User Management
**Tools Used**
- Next.js routing (`/login`, `/register`)
- Axios interceptors (JWT handling)
- Zustand (`authStore`)
- Tailwind (form styling)
- MSW (mock login/register)

# 🔐 Authentication Flow
1. User logs in
2. Server returns JWT + Refresh Token
3. Axios interceptor attaches token automatically
4. Zustand stores user session
5. Protected routes validated via middleware
---
## 👤 Module 2: User Profile & Social Identity
**Tools Used**
- Dynamic routes: `/profile/[id]`
- Axios (fetch/update profile)
- Zustand (current user state)
- Tailwind (profile UI)
---
## 👥 Module 3: Followers & Social Graph
**Tools Used**
- Axios (follow/unfollow API)
- Zustand (update follower count)
- Next.js pages (`/followers`, `/following`)
---
## 🎵 Module 4: Audio Upload & Track Management
**Tools Used**
- Axios (`multipart/form-data`)
- Zustand (upload progress state)
- Tailwind (upload UI)
- Next.js (`/upload`)
---
## ▶️ Module 5: Playback & Streaming Engine
**Tools Used**
- Zustand (`playerStore`)
- HTML5 Audio API
- Next.js Root Layout (persistent player)
- Tailwind (responsive sticky player)
---
## ❤️ Module 6: Engagement & Social Interactions
**Tools Used**
- Axios (likes, reposts, comments)
- Zustand (optimistic updates)
- Next.js dynamic routes (`/track/[id]`)
---
## 📂 Module 7: Sets & Playlists
**Tools Used**
- Axios (playlist CRUD)
- Zustand (playlist state)
- Next.js dynamic routes
---
## 🔎 Module 8: Feed, Search & Discovery
**Tools Used**
- Axios (feed/search endpoints)
- Zustand (cache results)
- Next.js (`/feed`, `/search`)
---
## 💬 Module 9: Messaging & Track Sharing
**Tools Used**
- Axios (messages API)
- Zustand (`messageStore`)
- Next.js (`/messages`)
---
## 🔔 Module 10: Real-Time Notifications
**Tools Used**
- Zustand (`notificationStore`)
- Axios (mark as read)
---
## 🛡 Module 11: Moderation & Admin Dashboard
**Tools Used**
- Next.js Route Protection
- Axios (admin APIs)
- Zustand (admin stats state)
- Tailwind (dashboard UI)
---
## 💎 Module 12: Premium Subscription
**Tools Used**
- Axios (subscription APIs)
- Zustand (premium status state)
- Next.js middleware (upload restrictions)
---
