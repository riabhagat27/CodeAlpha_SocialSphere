# SocialSphere — Mini Social Media Platform

> **CodeAlpha Full Stack Development Internship — Task 2: Social Media Platform**  
> Repository Name: `CodeAlpha_SocialSphere`

---

## 🚀 Live Demo

[Visit SocialSphere](https://codealpha-socialsphere-r4z8.onrender.com)

---

## 📌 Project Overview

**SocialSphere** is a complete, full-stack mini social media web application developed for **Task 2 of the CodeAlpha Full Stack Development Internship**. 

Unlike a static frontend template or UI mockup, SocialSphere features a real Node.js & Express RESTful API backend, a persistent SQLite database, bcrypt password hashing, JWT session authentication, real-time post liking, commenting, user searching, and follow/unfollow capabilities.

---

## ✨ Features

- **🔐 Real User Authentication**: Secure registration and login with bcrypt password hashing and JWT authorization.
- **👤 User Profiles**: Dynamic profile pages displaying user details, bio, posts count, follower count, and following count.
- **✏️ Profile Customization**: Edit full name, bio, and custom profile avatar image URL.
- **📝 Post Creation**: Publish text posts with optional image URLs that populate in real time to the global feed.
- **❤️ Like / Unlike System**: Real-time post liking and unliking with UNIQUE database constraints preventing duplicate likes.
- **💬 Comments System**: View, add, and delete comments on any post with live comment counters.
- **🤝 Follow / Unfollow System**: Follow or unfollow other creators with real-time follower/following count calculations and self-follow prevention.
- **🔍 User Discovery / Live Search**: Search for registered users by username or full name with dropdown quick links.
- **🎨 Premium UI Design**: Responsive, modern light design system using vanilla CSS, smooth micro-interactions, custom toast notifications, and rounded cards.

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, Vanilla CSS3, JavaScript (ES6+), Fetch API
- **Backend**: Node.js, Express.js
- **Database**: SQLite3 (`database.sqlite`)
- **Authentication**: JSON Web Tokens (`jsonwebtoken`) & `bcryptjs`
- **Utility Tools**: `cors`, `dotenv`

---

## 📁 Project Structure

```
CodeAlpha_SocialSphere/
├── server/
│   ├── server.js              # Express server entry point & static middleware
│   ├── database.js            # SQLite database setup & Promise helpers
│   ├── seed.js                # Database seeding script with realistic demo data
│   ├── middleware/
│   │   └── authMiddleware.js  # JWT authentication verification
│   └── routes/
│       ├── authRoutes.js      # Register, Login, Logout, /me
│       ├── userRoutes.js      # Profile details, update profile, search
│       ├── postRoutes.js      # Feed loading, post creation, single post, delete
│       ├── likeRoutes.js      # Like & unlike post endpoints
│       ├── commentRoutes.js   # Fetch comments, add comment, delete comment
│       └── followRoutes.js    # Follow, unfollow, followers & following lists
├── public/
│   ├── index.html             # Main Feed & User Search
│   ├── login.html             # Login Page
│   ├── register.html          # Registration Page
│   ├── profile.html           # User Profile View
│   ├── edit-profile.html      # Edit Profile Form
│   ├── css/
│   │   └── style.css          # Design system & responsive layout styles
│   └── js/
│       ├── common.js          # Shared state, auth fetch wrapper, navbar, search UI
│       ├── auth.js            # Login & registration handlers
│       ├── feed.js            # Feed loader, post creation, likes, comments
│       └── profile.js         # Profile header rendering, edit form, follow toggle
├── package.json
├── .gitignore
├── .env.example
└── README.md
```

---

## 🗄️ Database Design

The application utilizes an SQLite relational database (`database.sqlite`) with 5 core tables connected via foreign key constraints and unique indexes:

1. **`users`**: `id`, `full_name`, `username` (UNIQUE), `email` (UNIQUE), `password` (hashed), `bio`, `profile_image`, `created_at`
2. **`posts`**: `id`, `user_id` (FK -> `users.id`), `content`, `image_url`, `created_at`
3. **`comments`**: `id`, `post_id` (FK -> `posts.id`), `user_id` (FK -> `users.id`), `content`, `created_at`
4. **`likes`**: `id`, `post_id` (FK -> `posts.id`), `user_id` (FK -> `users.id`), `created_at`, `UNIQUE(post_id, user_id)`
5. **`follows`**: `id`, `follower_id` (FK -> `users.id`), `following_id` (FK -> `users.id`), `created_at`, `UNIQUE(follower_id, following_id)`

---

## 🚀 Installation & Setup Guide

### 1. Clone & Install Dependencies
```bash
# Navigate to the project directory
cd CodeAlpha_SocialSphere

# Install required Node.js packages
npm install
```

### 2. Seed the Database (Optional but Recommended)
Populate the SQLite database with sample users, posts, comments, likes, and follows:
```bash
npm run seed
```

### 3. Start the Application
```bash
npm start
```
The server will start at: **`http://localhost:5000`**

---

## 🌐 Deployment on Render

SocialSphere is configured for seamless deployment as a **Render Web Service**.

### Render Configuration Settings

- **Environment / Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Health Check Path**: `/health`

### Environment Variables

Configure the following environment variables in your Render Web Service dashboard:

| Variable Name | Required | Description | Default / Example |
|---|---|---|---|
| `PORT` | Optional | Port allocated by Render | `10000` (auto-assigned by Render) |
| `JWT_SECRET` | Recommended | Secret key used to sign & verify JWT tokens | `your_secure_random_production_secret` |

### ⚠️ SQLite Persistence Limitation Note

- **Ephemeral Filesystem**: Render's free tier web service filesystem is ephemeral. Data stored in `database.sqlite` will reset whenever the application restarts or redeploys.
- **Production Data Persistence**: For persistent storage in production, a Render Persistent Disk can be mounted to store `database.sqlite`, or a managed PostgreSQL database can be connected if long-term storage is required. For demonstration and evaluation purposes, SQLite initializes dynamically on first launch.

---

## 🔐 Demo Credentials

SocialSphere automatically seeds demo data (users, posts, comments, likes, and follow relationships) whenever the application starts with an empty database (such as on a clean Render deployment).

The pre-seeded demo accounts are:

| Name | Username | Email | Password |
|---|---|---|---|
| **Alex Johnson** | `alex` | `alex@example.com` | `Demo@123` |
| **Sarah Williams** | `sarah` | `sarah@example.com` | `Demo@123` |
| **Rahul Sharma** | `rahul` | `rahul@example.com` | `Demo@123` |

*(You can also register brand new accounts directly from the Registration page).*

---

## 📡 REST API Documentation

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new account
- `POST /api/auth/login` — Authenticate user and receive JWT token
- `POST /api/auth/logout` — Terminate session
- `GET /api/auth/me` — Get current logged-in user profile

### Users (`/api/users`)
- `GET /api/users/search?q=query` — Search users by name/username
- `GET /api/users/:id` — Fetch user profile & statistics (posts, followers, following)
- `PUT /api/users/:id` — Update profile details (full name, bio, image)

### Posts (`/api/posts`)
- `GET /api/posts` — Fetch global social feed (newest first)
- `GET /api/posts?user_id=:id` — Fetch posts written by a specific user
- `POST /api/posts` — Create a new post
- `GET /api/posts/:id` — Fetch single post details
- `DELETE /api/posts/:id` — Delete own post

### Likes & Comments (`/api/posts` & `/api/comments`)
- `POST /api/posts/:id/like` — Like a post
- `DELETE /api/posts/:id/like` — Unlike a post
- `GET /api/posts/:id/comments` — Fetch comments for a post
- `POST /api/posts/:id/comments` — Add a comment to a post
- `DELETE /api/comments/:id` — Delete own comment

### Follows (`/api/users`)
- `POST /api/users/:id/follow` — Follow a user
- `DELETE /api/users/:id/follow` — Unfollow a user
- `GET /api/users/:id/followers` — List user's followers
- `GET /api/users/:id/following` — List users followed by user

---

## ✅ CodeAlpha Task 2 Requirements Checklist

- [x] User registration with validation & bcrypt password hashing
- [x] Secure user login & authentication system
- [x] User profiles with customizable bio, avatar, and dynamically calculated stat counters
- [x] Post creation and public feed rendering
- [x] Real post like & unlike system with count updating
- [x] Commenting system with view, add, and delete functions
- [x] Follow / unfollow system with self-follow prevention
- [x] SQLite database storing users, posts, comments, likes, and follows
- [x] Express.js backend with RESTful API endpoints
- [x] Responsive CSS UI suitable for mobile and desktop screens
