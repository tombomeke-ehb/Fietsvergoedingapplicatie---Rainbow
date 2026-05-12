# Fietsvergoedingapplicatie - Rainbow

Een volledig web-applicatie voor het beheer van fietsvergoeding voor werknemers. De applicatie stelt werknemers in staat om hun fietsreizen bij te houden, berekent automatisch hun fietsvergoeding en genereert uitvoerbestanden voor de salarisverwerking. Admins kunnen instellingen beheren en alle gegevens controleren. Perfect voor bedrijven die hun fietsvergoedingsbeleid willen digitaliseren en stroomlijnen.

**English:** A full-stack web application for managing bike allowance (fietsvergoeding) for employees. Built with Vue 3, Express, and Prisma ORM.

## Tech Stack

- **Frontend**: Vue 3, Vite, Pinia (state management), Vue Router
- **Backend**: Node.js, Express.js
- **Database**: SQLite with Prisma ORM
- **Package Manager**: npm (monorepo with workspaces)

## Prerequisites

- **Node.js** (v16 or higher)
- **npm** (v8 or higher)

## Project Structure

```
├── backend/              # Express API server
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Auth and other middleware
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic
│   ├── prisma/          # Database schema and migrations
│   └── index.js         # Server entry point
├── frontend/             # Vue 3 application
│   ├── src/
│   │   ├── components/  # Reusable Vue components
│   │   ├── views/       # Page components
│   │   ├── router/      # Route configuration
│   │   ├── store/       # Pinia state management
│   │   └── main.js      # App entry point
│   └── vite.config.js   # Vite configuration
└── package.json         # Root workspace configuration
```

## Installation

### 1. Install Dependencies

From the root directory:

```bash
npm install
```

This will install dependencies for both backend and frontend due to the workspace configuration.

### 2. Set Up Database

Initialize the database and seed it with sample data:

```bash
npm run db:seed
```

For a fresh database reset (removes all data and re-seeds):

```bash
npm run db:reset
```

## Running the Application

### Development Mode (Recommended)

Run both backend and frontend concurrently:

```bash
npm run dev
```

This starts:
- **Backend** on `http://localhost:3000` (or configured port)
- **Frontend** on `http://localhost:5173` (Vite default)

### Run Individual Services

**Backend only:**
```bash
npm run dev:backend
```

**Frontend only:**
```bash
npm run dev:frontend
```

### Production Mode

**Build frontend:**
```bash
npm run build
```

**Start backend server:**
```bash
npm run start
```

## Database Commands

### Run Migrations

```bash
npm run db:migrate
```

This applies any pending Prisma migrations to your database.

### Seed Database

```bash
npm run db:seed
```

Populates the database with initial sample data.

### Reset Database

```bash
npm run db:reset
```

Resets the entire database to a clean state and re-seeds with sample data.

## Project Features

Based on the schema, this application includes:

- **User Management**: Employees, Admins, and Payroll staff roles
- **Trip Tracking**: Record bike trips (full or partial)
- **Multi-country Support**: Belgium and Netherlands
- **Bike Types**: Personal or company-owned bikes
- **Tax Handling**: Taxed and tax-free allowance classifications
- **Expense Caps**: Monthly, yearly, or combined caps
- **Export Management**: Generate and send payroll exports
- **Admin Dashboard**: Manage employees and system settings

## Debugging

- **Backend logs**: Check terminal output where `npm run dev:backend` is running
- **Frontend**: Open browser DevTools (F12) to inspect console and network requests
- **Database**: SQLite database file is at `backend/prisma/dev.db`

## Common Issues

### Port Already in Use

If port 3000 or 5173 is already in use:
- Backend: Modify the port in `backend/index.js`
- Frontend: Vite will automatically try the next available port

### Database Issues

If you encounter database errors:
```bash
npm run db:reset
```

This clears the database and re-seeds it with fresh data.

## Environment Variables

Check if an `.env` file is needed in the backend directory. Create one with:

```
DATABASE_URL="file:./dev.db"
PORT=3000
```

(Adjust values as needed for your setup)

## Next Steps

1. Start the development server: `npm run dev`
2. Open `http://localhost:5173` in your browser
3. Check the Vue components in `frontend/src/` to understand the UI
4. Review the API controllers in `backend/controllers/` to understand the business logic
5. Examine `backend/prisma/schema.prisma` to understand the data model

## Support

For questions or issues, refer to the individual documentation in the backend and frontend directories.
