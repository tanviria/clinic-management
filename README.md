# ClinicPro - Complete Clinic & Diagnostic Center Management SaaS

**ClinicPro** is an enterprise-grade, production-ready, database-driven **Clinic Management Software & Multi-Tenant Healthcare SaaS** specifically architected for small to medium-sized clinics, diagnostic centers, doctor chambers, and multi-doctor specialized practices in Bangladesh.

---

## 🌟 Key Highlights & Bangladesh Healthcare Context

* **End-to-End Patient Journey**:
  `Registration → Appointment Booking → Live Queue Token → Chamber Consultation → Digital BMDC Prescription → Diagnostic LIS → Pharmacy POS Dispensing → Unified Billing → Payment Reconciliation → Longitudinal Medical History`
* **Real-time Queue & TV Waiting Room Display**:
  Live token tracking (`A001`, `A002`, etc.) by doctor chamber room with audio chime and a dedicated full-screen TV view (`/queue/tv`).
* **Official BMDC-Compliant Digital Prescriptions**:
  Digital prescription pad with clinic letterhead, doctor qualifications, BMDC registration number, Rx symbol, dosage notation (`1+0+1`, `1+1+1`), meal timings, advice, and one-click printable format.
* **Integrated AI Clinical Assistant Layer**:
  Doctor-in-the-loop AI assistance for:
  * Structuring unstructured clinical notes and speech into Chief Complaint & HPI
  * Suggesting differential diagnoses & lab investigations
  * Prescription dosage and duration recommendations with clinical precaution alerts
  * Patient-friendly lab report explanations
  *(AI never diagnoses autonomously; doctor reviews and approves all outputs).*
* **Laboratory Information System (LIS)**:
  Test catalog, sample collection status tracking, parameter-wise result entry, normal reference ranges, critical/panic value alerts, pathologist verification, and official printable diagnostic reports.
* **Pharmacy Dispensary & Batch Inventory**:
  Bangladeshi pharmaceutical brands (Square, Beximco, Incepta, Acme, etc.), batch-wise stock, expiry tracking, reorder warnings, and rapid POS checkout terminal.
* **Unified Billing & Payment Channels**:
  Itemized billing for consultations, lab tests, pharmacy, and procedures. Supports **Cash, bKash, Nagad, Rocket, Card, and Bank Transfer** with partial payment tracking, due collection, and printable money receipts.
* **Multi-Tenant SaaS Architecture**:
  SaaS Super Admin dashboard for multi-clinic management, subscription plans, MRR analytics, branch isolation, and tenant data partitioning.

---

## 🚀 Quick Start (Zero-Configuration Out-of-the-Box)

ClinicPro comes pre-configured with a self-contained relational database (**SQLite**) with complete schema compatibility for **PostgreSQL**. No external database servers or services need to be installed to run and test immediately on Windows, macOS, or Linux!

### 1. Install Dependencies
```bash
npm install
```

### 2. Synchronize & Seed Database
```bash
npx prisma db push
node prisma/seed.js
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 👥 Default Demo Credentials & 1-Click Role Switcher

You can log in directly using the following accounts (or use the **"1-Click Role Switcher"** in the top navigation bar):

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@clinicpro.com` | `admin123` | Platform-wide SaaS & MRR dashboard |
| **Clinic Admin** | `admin@carepoint.com` | `admin123` | Full clinic management & finance |
| **Doctor (OPD)** | `doctor.rahman@carepoint.com` | `doctor123` | Dr. M. A. Rahman (Internal Medicine) |
| **Receptionist** | `reception@carepoint.com` | `staff123` | Registration, appointments & queue |
| **Pharmacist** | `pharma@carepoint.com` | `staff123` | Inventory, dispensing & POS sales |
| **Lab Tech** | `lab@carepoint.com` | `staff123` | Sample collection, results & LIS |
| **Accountant** | `accounts@carepoint.com` | `staff123` | Invoices, expenses & cash clearing |
| **Patient** | `patient@carepoint.com` | `patient123` | Tanvir Ahmed (Self-service portal) |

---

## 🏗️ Technology Stack

* **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts
* **Backend**: Next.js API Routes (RESTful endpoints with RBAC & tenant isolation)
* **Database & ORM**: PostgreSQL / SQLite Dual Architecture via Prisma ORM
* **Authentication**: JWT token cookies, bcryptjs password hashing, role-based permission gates
* **Containerization**: Multi-stage Dockerfile and `docker-compose.yml`

---

## 📺 Dedicated Waiting Room TV Screen

Launch the full-screen queue display for the waiting room on any smart TV or browser:
```
http://localhost:3000/queue/tv
```
Features high-contrast tokens, doctor chamber rooms, audio chime, and 5-second automatic polling.

---

## 📄 Production PostgreSQL Deployment

To deploy in production using Docker with PostgreSQL:

```bash
docker-compose up --build -d
```
