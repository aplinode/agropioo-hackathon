# Agropioo – Final Tech Stack

## Project Architecture

Agropioo will use a **full-stack Next.js architecture**. We will **not use a separate Node.js + Express.js backend**.

Next.js will handle both:

- Frontend/UI
- Backend/server-side logic
- API endpoints
- Authentication logic
- Email operations
- Database communication

Neon Lakebase Postgres will be used as the PostgreSQL database.

---

## 1. Core Framework

### Next.js

**Purpose:**

- Frontend development
- Server-side backend logic
- Route Handlers / API endpoints
- Server-side operations
- Integration with external services

**Architecture:**

```text
Next.js Application
│
├── Frontend
│   ├── Pages
│   ├── Components
│   ├── Forms
│   └── Dashboard
│
└── Backend
    ├── Route Handlers
    ├── Authentication
    ├── Business Logic
    ├── Email Operations
    └── Database Operations
```

---

## 2. Frontend

### Next.js + React

Next.js will be used to build the complete user interface.

It will handle:

- Landing pages
- Authentication pages
- User dashboards
- Forms
- Farm management interfaces
- Crop-related interfaces
- Notifications
- Responsive UI

### Tailwind CSS

**Purpose:**

- Styling
- Responsive design
- Rapid UI development
- Consistent design system

---

## 3. Backend

### Next.js Route Handlers

Next.js Route Handlers will act as the backend API layer.

Example structure:

```text
app/
└── api/
    ├── auth/
    │   ├── signup/
    │   ├── login/
    │   ├── forgot-password/
    │   └── reset-password/
    │
    ├── users/
    ├── farms/
    ├── crops/
    ├── notifications/
    └── emails/
```

The backend will handle:

- Authentication
- Authorization
- Business logic
- Database operations
- Password hashing
- JWT verification
- Email sending
- External API integrations

**No separate Express.js backend will be created.**

---

## 4. Database

### Neon Lakebase Postgres

Neon Lakebase Postgres will be used as the PostgreSQL database provider.

The application will use Postgres for:

- PostgreSQL database
- Tables
- Relationships
- Foreign keys
- SQL queries
- Data persistence

### Important Architecture Rule

The frontend should **not directly access sensitive database operations**.

Database operations should primarily follow this flow:

```text
Next.js Client
      ↓
Next.js Server-side Logic / Route Handler
      ↓
Neon Lakebase Postgres
```

---

## 5. Authentication

### Custom Authentication

Authentication will be implemented using Next.js server-side logic.

### Password Hashing

**Package:** `bcryptjs`

Responsibilities:

- Hash passwords during signup
- Compare passwords during login
- Never store plain-text passwords

Example flow:

```text
User Password
      ↓
Next.js Server
      ↓
bcryptjs Hashing
      ↓
Neon Lakebase Postgres
```

### JWT Authentication

**Package:** `jose`

Responsibilities:

- Generate JWT tokens
- Verify JWT tokens
- Protect authenticated routes
- Manage user sessions

---

## 6. Email System

### Nodemailer

**Package:** `nodemailer`

Nodemailer will be used from the Next.js server-side environment.

Architecture:

```text
Next.js Route Handler
        ↓
Nodemailer
        ↓
SMTP Provider
        ↓
User Email
```

Possible use cases:

- Welcome emails
- Verification emails
- Password reset emails
- Notification emails
- System alerts

### Important

Nodemailer is an email-sending library, not an email provider.

An SMTP/email provider will still be required.

Examples:

- Gmail SMTP
- Brevo SMTP
- Other compatible SMTP providers

The SMTP credentials must be stored in environment variables.

---

## 7. Validation

### Zod

**Package:** `zod`

Zod will be used for:

- Request validation
- Form data validation
- API input validation
- Preventing invalid data from reaching the database

### React Hook Form

**Package:** `react-hook-form`

Used for:

- Form management
- Client-side form handling
- Integration with Zod validation

### Hookform Resolvers

**Package:** `@hookform/resolvers`

Used to connect React Hook Form with Zod.

---

## 8. Environment Variables

Sensitive credentials must never be hardcoded.

Example `.env.local` structure:

```env
DATABASE_URL=
DATABASE_URL_UNPOOLED=

JWT_SECRET=

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=
```

Sensitive environment variables must only be accessed from server-side code.

---

## 9. Required npm Packages

Install the core packages:

```bash
npm install pg @types/pg bcryptjs jose nodemailer zod react-hook-form @hookform/resolvers
```

---

## 10. Final Architecture

```text
                         USER
                           │
                           ▼
                    Next.js Frontend
                           │
                           ▼
                Next.js Server-side Layer
                 ┌─────────┼──────────┐
                 │         │          │
                 ▼         ▼          ▼
          Authentication  APIs    Email Service
                 │         │          │
            bcryptjs      Zod     Nodemailer
                 │         │          │
                 └─────────┼──────────┘
                           │
                           ▼
                 Neon Lakebase Postgres
```

---

# Final Tech Stack Summary

| Category | Technology |
|---|---|
| Full-Stack Framework | Next.js |
| Frontend | React + Next.js |
| Styling | Tailwind CSS |
| Backend/API | Next.js Route Handlers |
| Database | Neon Lakebase Postgres |
| Database Client | `pg` |
| Password Hashing | `bcryptjs` |
| JWT Authentication | `jose` |
| Email Library | Nodemailer |
| Email Delivery | SMTP Provider |
| Validation | Zod |
| Form Handling | React Hook Form |
| Form Validation Integration | `@hookform/resolvers` |

---

## Final Decision

**Agropioo will use:**

```text
Next.js
+ Tailwind CSS
+ Next.js Route Handlers
+ Neon Lakebase Postgres (Database Only)
+ bcryptjs
+ jose
+ Nodemailer
+ Zod
+ React Hook Form
```

### Key Architecture Decision

**No separate Node.js + Express.js backend will be used.**

Next.js will function as the complete full-stack application, while Neon Lakebase Postgres provides the PostgreSQL database.