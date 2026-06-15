# HimShakti Frontend Dashboard

This directory contains the React (Vite + Tailwind CSS) frontend application for the HimShakti Batch Traceability and Dispatch Intelligence System.

## Features
- **Dashboard**: Metrics overview and batch management interface.
- **Login Portal**: Protected access to the factory manager capabilities.
- **Responsive UI**: Built with Tailwind CSS and reusable components (Navbar, Hero, Cards, Footer).
- **React Router**: Pre-configured routing for Dashboard, Login, About, and Home pages.

## Setup and Running

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the Vite development server:
   ```bash
   npm run dev
   ```

## Folder Structure
- `src/components`: Reusable UI elements (`Hero.jsx`, `Navbar.jsx`, `Footer.jsx`, `Card.jsx`).
- `src/pages`: Page components representing application routes (`Home.jsx`, `Login.jsx`, `Dashboard.jsx`, `About.jsx`).
- `src/App.jsx`: Main application component layout.
- `src/main.jsx`: React entry point.
