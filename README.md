# Training and Placement Portal

A comprehensive web application designed to streamline and optimize the campus placement process, facilitating seamless interactions between students, companies, and training & placement coordinators.

## Project Overview

The Training and Placement Portal is a sophisticated system that manages the entire campus recruitment lifecycle - from company registrations to student applications and final placements. Built with modern web technologies and a robust database architecture, the portal provides real-time analytics, secure authentication, and efficient data management to ensure a smooth placement season.

This project serves as a centralized platform where:
- Students can create profiles, upload resumes, apply to eligible drives, and track their application status
- Training & Placement coordinators can manage companies, create placement drives, and monitor placement statistics
- Companies can efficiently connect with qualified students based on customizable eligibility criteria

## Key Features

- **User Authentication**: Secure login system for students and administrators
- **Student Profile Management**: Complete student information with academic records and resume storage
- **Drive Management**: Create and manage placement drives with customized eligibility criteria
- **Branch-wise Eligibility**: Configure company criteria for specific departments
- **Interactive Dashboard**: Comprehensive analytics with placement statistics, average package trends, and branch-wise performance
- **Application Tracking**: Real-time status updates for student applications
- **Responsive Design**: Modern UI that works across devices

## Technology Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS 4
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Cloud Storage**: Cloudinary (for resume storage)
- **UI Components**: Radix UI primitives with custom styling
- **State Management**: React Query for server state

## Getting Started

First, install the dependencies:

```bash
npm install
# or
yarn install
```

Next, set up your environment variables by copying the example file:

```bash
cp .env.example .env
```

Update the `.env` file with your database credentials and other required variables.

Run the Prisma migrations:

```bash
npx prisma migrate dev
```

Finally, start the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Deployment

This application can be easily deployed on platforms like Vercel or any other hosting service that supports Next.js applications.

```bash
npm run build
npm run start
```

## Project Structure

- `/prisma`: Database schema and migrations
- `/src/app`: Application routes and pages
- `/src/components`: Reusable UI components
- `/src/services`: API service functions
- `/src/lib`: Utility functions and shared code
- `/src/types`: TypeScript type definitions

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
