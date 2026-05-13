# Capgemini Dynamic Factory Layout Tool

A full-stack web application designed for interactive visualization, editing, and administration of factory layout blueprints. This application enables developers to upload factory layouts via CSV and allows administrators to review, approve, or reject these layouts through an interactive canvas interface.

## Project Structure

This project uses a monorepo-style structure, separating the frontend application from the backend API.

- `frontend/` - Next.js 14 application providing the user interface, canvas editor, and authentication flows.
- `backend/` - Node.js Express application serving as a REST API connected to a SQL Server database.

## Prerequisites

To run this application locally, you must have the following installed:
- Node.js (v18 or higher)
- npm or pnpm
- Microsoft SQL Server Management Studio (SSMS) with a running instance.

## Backend Setup (Node.js API)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure the Database:
   - Ensure your SQL Server instance is running and allows Windows Authentication (or configure SQL credentials).
   - Verify the `.env` file exists in the `backend/` directory with the appropriate SQL credentials. By default, it uses Windows Auth with:
     ```env
     DB_SERVER=localhost\SQLEXPRESS
     DB_DATABASE=FactoryLayoutDB
     ```
4. Start the backend server:
   ```bash
   npm run dev
   ```
   The backend will run on `http://localhost:4000`.

## Frontend Setup (Next.js Application)

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   # OR
   pnpm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   # OR
   pnpm dev
   ```
   The frontend will run on `http://localhost:3000`. 
   *Note: The frontend is configured with a proxy rewrite rule to route all `/api/*` requests automatically to `http://localhost:4000/api/*` to avoid CORS issues.*

## Features
- **Role-based Authentication:** Separate views for `Developer` and `Admin`.
- **Canvas Editor:** Interactive 2D visualization of Workstations, Areas, and Assembly lines using an HTML5 canvas.
- **CSV Import:** Developers can parse and instantiate an entire factory layout map via CSV structure mapping.
- **Approval Workflow:** Admins can review pending layouts, drop comments, and approve/reject them directly inside the canvas viewer.
- **Real-time Synchronization:** Layouts are mapped granularly directly back to the SQL database using specialized REST endpoints.

## Tech Stack
- **Frontend:** Next.js, React, Tailwind CSS, Lucide Icons
- **Backend:** Node.js, Express, `mssql` (SQL Server connector), Multer, Papaparse
- **Database:** Microsoft SQL Server (SSMS)
