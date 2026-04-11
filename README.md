# Connect - Sports & Entertainment Smart Venue Booking Platform

Connect is a full stack premium venue booking platform designed for sports and entertainment enthusiasts. It provides a seamless experience for both venue seekers and owners to manage bookings and venues efficiently.

## Key Features

### A Seamless Booking Experience
Connect offers a straightforward and intuitive experience for anyone looking to book a venue. You can easily search for venues by name, location, or category, and filter the results by date and price. The platform provides detailed venue pages with photos, descriptions, and operating hours to help you make the right choice. Once you're ready, you can select a date and time slot to submit your booking request. You'll also have access to your booking history and the ability to cancel reservations if needed.

### Effortless Venue Management
For venue owners, Connect provides a powerful set of tools to manage properties and reservations. You can register your venues, upload photos, set pricing, and define your availability schedules. The platform gives you a clear overview of all booking requests, allowing you to approve or reject them as they come in, track earnings, and manage your property portfolio efficiently.

### Comprehensive Platform Oversight
For system administrators, Connect provides full visibility and control over the ecosystem. System managers can oversee the entire platform, manage user accounts, and monitor system operations. The administrative dashboard allows for the approval or rejection of new venue registrations and the monitoring of all booking and payment transaction records to ensure smooth and secure operations.

### Cutting-Edge Intelligence
Connect leverages advanced technology to provide a smarter booking experience. A central turning point for the platform is its **AI-Based Venue Recommendation engine**, which analyzes user preferences and search history to proactively suggest the most relevant venues. Additionally, an integrated **NLP AI Chatbot** is available to assist with any questions, navigation, or booking details in real-time.

### Premium & User-Friendly
Our platform is built with the user at the center. The secure user management system ensures that your profile and booking information are always safe. The platform also features a premium, modern design with dark mode and flexible, responsive layouts that feel alive, interactive, and seamless across all devices.

## Technology Stack

### Frontend

- **Framework**: React.js with Vite
- **Styling**: Tailwind CSS for modern, utility-first design
- **State/Routing**: React Router DOM, React Hook Form
- **Icons**: Lucide React
- **API Communication**: Axios

### Backend

- **Environment**: Node.js
- **Server Framework**: Express.js
- **Database ORM**: Sequelize
- **Database**: SQLite (Local Dev)
- **File Storage**: Multer (Local disk storage for uploaded assets)

---

## Getting Started

Follow these steps to get the environment up and running locally.

### Prerequisites

- Node.js (v16 or higher recommended)
- npm (Node Package Manager)

### 1. Backend Setup

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd connect-backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Initialize the database and seed it with demo data:
   > [!IMPORTANT]
   > This step will reset the local database and create test accounts.
   ```bash
   node seed.js
   ```
4. Start the server:
   ```bash
   node server.js
   ```
   The backend will be live at `http://localhost:5000`.

### 2. Frontend Setup

1. Open a **new terminal** and navigate to the frontend directory:
   ```bash
   cd connect-frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at the URL provided in the console (typically `http://localhost:5173`).

---

## Test Accounts

After running `node seed.js`, you can use the following credentials to test the platform:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@connect.lk` | `adminpassword123` |
| **Searcher** | `user@connect.lk` | `password123` |
| **Owner** | `owner@connect.lk` | `password123` |

---

## Project Structure

- `/connect-frontend`: The React application with all UI components and pages.
- `/connect-backend`: The Express server, API routes, and Sequelize models.
- `/connect-backend/public/uploads`: Directory where venue images are stored.

## Academic Supervision

This project was guided and supervised by Ann Roshanie Appuhamy as part of undergraduate coursework.
