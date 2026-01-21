🇧🇷 Read this README in Portuguese: [README.pt-BR.md](README.pt-BR.md)

# 🛍️ SaaS Store – Multi-Tenant SaaS Platform for Clothing Stores

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js\&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express\&logoColor=white)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748?logo=prisma\&logoColor=white)](https://www.prisma.io/)
[![MySQL](https://img.shields.io/badge/MySQL-8.x-4479A1?logo=mysql\&logoColor=white)](https://www.mysql.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**SaaS Store** is a **multi-tenant SaaS platform** designed to transform physical or online clothing stores into a **real SaaS product**, allowing multiple merchants to share the same infrastructure with full data isolation.

Each merchant has:

* Their own customized storefront
* A complete administrative dashboard
* POS (point of sale)
* Orders automatically sent to WhatsApp

All of this built with a simple, performant, and easy-to-maintain stack.

---

## ✨ Key Differentials

* **Multi-tenant** architecture with tenant isolation
* Real-time store customization (colors + logo)
* Simple and fast POS for in-store sales
* **WhatsApp-based checkout** (no complex payment gateways)
* Instant blocking of delinquent merchants
* Lightweight frontend: **HTML + CSS + Vanilla JavaScript**

---

## 🧠 How the Multi-Tenant System Works

The application uses a **store-based multi-tenancy model**:

* Each merchant has a `storeId`
* All main entities (products, orders, users) are linked to this `storeId`
* Route access is protected by **JWT**, validating:

  * User authentication
  * Correct store association

Simplified flow:

```
User → Login → JWT
JWT → contains userId + storeId
Routes → filter data by storeId
```

This ensures that:

* One merchant **cannot access another merchant’s data**
* The Super Admin has a global view of the system

---

## 👥 User Roles

| Role             | Description                                                   |
| ---------------- | ------------------------------------------------------------- |
| **Super Admin**  | Manages merchants, blocks access, global metrics, and revenue |
| **Merchant**     | Manages products, orders, POS, and store customization        |
| **End Customer** | Browses the storefront and completes orders via WhatsApp      |

---

## 🚀 Highlighted Features

### 👑 Super Admin (SaaS)

* Global dashboard (active/delinquent merchants)
* Create new stores with automatic slug generation
* Block and reactivate access
* Overall system performance view

### 🏪 Merchant Dashboard

* Financial dashboard (daily/weekly sales)
* Full product CRUD with variations (size/color)
* Multiple image uploads
* Order Kanban (Pending → Paid → Shipped → Delivered)
* Touchscreen-optimized POS
* Store visual customization
* Mandatory password change on first login

### 🛒 Public Storefront

* Responsive layout
* Search by name and category filter
* Dynamic shopping cart
* Checkout that generates a formatted WhatsApp message

---

## 🗂️ Folder Structure

```
backend
    ├── prisma/             # Database schema (tables)
    ├── src/
    │   ├── config/         # Configurations (Multer, Cloudinary)
    │   ├── controllers/    # Business logic (Products, Orders, Auth)
    │   ├── middlewares/    # Route protection (JWT, permissions)
    │   ├── routes/         # API route definitions
    │   └── services/       # Auxiliary services (Email, etc.)
    └── server.js           # Main server entry point

frontend
    ├── admin/
    └── login/
```

---

## 🛠️ Technologies Used

* **Backend**: Node.js + Express
* **Database**: MySQL + Prisma ORM
* **Authentication**: JWT + bcrypt
* **Image Upload**: Multer + Cloudinary
* **Frontend**: HTML5, CSS3, Vanilla JavaScript
* **Recommended Deploy**: Railway, Render, Vercel

---

## ⚡ Local Installation

### Requirements

* Node.js ≥ 18
* MySQL
* Cloudinary account

### Setup

```bash
git clone https://github.com/YOUR-USERNAME/saas-store-roupas.git
cd saas-store-roupas
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm start
```

---

## 🔐 .env Example

```env
# Server Configuration
PORT=3000

# Database (MySQL)
DATABASE_URL="mysql://root:123456@localhost:3306/saas_roupas"

# Security
JWT_SECRET="enter_a_very_secure_secret_here"

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 🔒 Security – Current State

Implemented:

* JWT-based authentication
* Password hashing with bcrypt
* Basic route protection

Recommended before production:

* Rate limiting
* Input validation
* HTTPS enforcement
* Automatic database backups
* Stricter permission auditing

---

## 🛤️ Roadmap

* Pix and credit/debit card integration
* WhatsApp Business API notifications
* Advanced reports
* Coupons and promotions system
* Store-level SEO
* Order export (CSV/Excel)

---

## 🌐 Online Demo

🔗 **Demo – Public Storefront**
(Static frontend – GitHub Pages)
[https://michaelcdutra.github.io/vitrineTeste/](https://michaelcdutra.github.io/vitrineTeste/)

> ⚠️ **Note**: this storefront was created **exclusively for demonstration purposes**, to test and showcase the SaaS features.
> Each merchant’s final storefront can be implemented in **multiple frontend approaches**, while keeping the same API and business rules.

👉 **Demo – Admin Dashboard (SaaS)**
(Frontend – GitHub Pages | Backend running in a private environment)
[https://michaelcdutra.github.io/Site-de-Roupas/](https://michaelcdutra.github.io/Site-de-Roupas/)

> 🔐 **Demo credentials**
> Test environment with fictional data. No real customer information is used.
>
> **Super Admin**
> Email: [admin@saas.com](mailto:admin@saas.com)
> Password: 123456
>
> **Merchant**
> Email: [lojistateste@email.com](mailto:lojistateste@email.com)
> Password: 123456

---

## 🤝 Contributing

1. Fork the repository
2. Create a branch (`feat/new-feature`)
3. Commit your changes
4. Open a Pull Request

---

## 👨‍💻 Author

Developed with 💙 and lots of JavaScript by **Michael Douglas**
Betim – MG, Brazil

This project is part of my portfolio and a practical study on SaaS and multi-tenant architecture.
