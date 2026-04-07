# ArtForge Backend — Spring Boot + MySQL

## Quick Start

### Prerequisites
- Java 17+
- Maven 3.8+
- MySQL Workbench (running on port 3306)

---

## Step 1: Setup MySQL Database

1. Open **MySQL Workbench**
2. Connect to your local server
3. Open `database/schema.sql`
4. Run the entire script (Ctrl+Shift+Enter)
5. You should see `artforge_db` created with all tables

---

## Step 2: Run the Spring Boot Server

Open a terminal in this `backend/` folder and run:

```bash
mvn spring-boot:run
```

The server starts at: **http://localhost:8080**

---

## API Endpoints

### Auth (No token required)
| Method | URL | Body |
|--------|-----|------|
| POST | `/api/auth/register` | `{name, email, password, role}` |
| POST | `/api/auth/login` | `{email, password}` |

### Artworks (token required for write)
| Method | URL | Notes |
|--------|-----|-------|
| GET | `/api/artworks` | All listed artworks |
| GET | `/api/artworks/{id}` | Single artwork |
| GET | `/api/artworks/search?q=abc` | Search |
| POST | `/api/artworks` | Create (Artist only) |
| POST | `/api/artworks/{id}/purchase` | Buy artwork |
| POST | `/api/artworks/{id}/bid` | Place bid |

### Users (token required)
| Method | URL | Notes |
|--------|-----|-------|
| GET | `/api/users/me` | My profile |
| PUT | `/api/users/me` | Update profile |
| GET | `/api/users` | All users (Admin) |
| PUT | `/api/users/{id}/role` | Change role (Admin) |

### Exhibitions
| Method | URL |
|--------|-----|
| GET | `/api/exhibitions` |
| POST | `/api/exhibitions` |

---

## Default Admin Login
- Email: `admin@artforge.com`
- Password: `admin123`

---

## Test with curl

```bash
# Register
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@art.com","password":"test123","role":"VISITOR"}'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@art.com","password":"test123"}'

# Get artworks (public)
curl http://localhost:8080/api/artworks
```
