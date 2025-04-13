-- CreateEnum
CREATE TYPE "PlacementStatus" AS ENUM ('Applied', 'Shortlisted', 'Interview_Scheduled', 'Offered', 'Offer_Accepted', 'Offer_Rejected', 'Not_Placed');

-- CreateTable
CREATE TABLE "branches" (
    "branch_id" SERIAL NOT NULL,
    "branch_name" VARCHAR(100) NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("branch_id")
);

-- CreateTable
CREATE TABLE "coordinators" (
    "coordinator_id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "contact_no" VARCHAR(20),
    "email" VARCHAR(255) NOT NULL,
    "address" TEXT,
    "password_hash" VARCHAR(255) NOT NULL,

    CONSTRAINT "coordinators_pkey" PRIMARY KEY ("coordinator_id")
);

-- CreateTable
CREATE TABLE "students" (
    "student_id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "department_branch_id" INTEGER NOT NULL,
    "grade" VARCHAR(5),
    "percentage" DECIMAL(5,2),
    "address" TEXT,
    "contact_no" VARCHAR(20),
    "email" VARCHAR(255) NOT NULL,
    "resume_url" VARCHAR(512),
    "password_hash" VARCHAR(255) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("student_id")
);

-- CreateTable
CREATE TABLE "companies" (
    "company_id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "contact_no" VARCHAR(20),
    "website" VARCHAR(255),
    "address" TEXT,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("company_id")
);

-- CreateTable
CREATE TABLE "criteria" (
    "criteria_id" SERIAL NOT NULL,
    "min_percentage" DECIMAL(5,2),
    "description" VARCHAR(255),
    "active_status" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "criteria_pkey" PRIMARY KEY ("criteria_id")
);

-- CreateTable
CREATE TABLE "criteria_branches" (
    "criteria_id" INTEGER NOT NULL,
    "branch_id" INTEGER NOT NULL,

    CONSTRAINT "criteria_branches_pkey" PRIMARY KEY ("criteria_id","branch_id")
);

-- CreateTable
CREATE TABLE "drives" (
    "drive_id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "criteria_id" INTEGER NOT NULL,
    "job_title" VARCHAR(255) NOT NULL,
    "package_lpa" DECIMAL(10,2),
    "grade_offered" VARCHAR(50),
    "drive_date" DATE,
    "application_deadline" TIMESTAMP(3),
    "description" TEXT,

    CONSTRAINT "drives_pkey" PRIMARY KEY ("drive_id")
);

-- CreateTable
CREATE TABLE "placements" (
    "placement_id" SERIAL NOT NULL,
    "student_id" VARCHAR(50) NOT NULL,
    "drive_id" INTEGER NOT NULL,
    "application_date" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "PlacementStatus" NOT NULL DEFAULT 'Applied',
    "placement_date" DATE,
    "package_lpa_confirmed" DECIMAL(10,2),

    CONSTRAINT "placements_pkey" PRIMARY KEY ("placement_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "branches_branch_name_key" ON "branches"("branch_name");

-- CreateIndex
CREATE UNIQUE INDEX "coordinators_contact_no_key" ON "coordinators"("contact_no");

-- CreateIndex
CREATE UNIQUE INDEX "coordinators_email_key" ON "coordinators"("email");

-- CreateIndex
CREATE UNIQUE INDEX "students_contact_no_key" ON "students"("contact_no");

-- CreateIndex
CREATE UNIQUE INDEX "students_email_key" ON "students"("email");

-- CreateIndex
CREATE UNIQUE INDEX "companies_name_key" ON "companies"("name");
