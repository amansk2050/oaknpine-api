<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

# 🏡 OaknPine Homestay API

A comprehensive RESTful API for managing homestays, rooms, leads, bookings, and tour packages across North Bengal region. Built with NestJS, TypeORM, and PostgreSQL.

## 📋 Overview

OaknPine is a complete tourism CRM and property management system designed for homestay operators in the North Bengal region (Kalimpong, Darjeeling, Sikkim, etc.). This API powers the backend operations for:

- **Homestay Management** - Manage multiple properties with room inventory
- **Lead Management** - Track potential customers with follow-up workflows
- **Booking Management** - Handle reservations, check-ins, check-outs, and payments
- **Package Management** - Create predefined and custom tour packages

## 🚀 Features

### Homestay Management

- Create and manage multiple homestay properties
- Room inventory with view/non-view categorization
- Dynamic per-head pricing model
- Room blocking and availability management
- Property-level amenities and media management

### Lead Management

- Capture leads from multiple sources (website, phone, referrals, etc.)
- Lead scoring and prioritization (urgent, high, medium, low)
- Follow-up tracking with outcomes
- Automatic status progression
- Conversion tracking to bookings

### Booking Management

- Room availability validation
- Multi-room bookings with guest allocation
- Automatic pricing calculation
- Payment tracking (advance, partial, full)
- Check-in/Check-out workflows
- Booking statistics and reporting

### Package Management

- Predefined tour packages with itineraries
- Dynamic pricing tiers (2-8 persons)
- Custom package creation for specific customers
- Inclusions/exclusions management
- Quote generation and negotiation workflow

## 🛠️ Tech Stack

- **Framework**: NestJS v10
- **Database**: PostgreSQL with TypeORM
- **Documentation**: Swagger/OpenAPI
- **Validation**: class-validator & class-transformer
- **Language**: TypeScript

## 📦 Installation

### Prerequisites

- Node.js >= 18.x
- PostgreSQL >= 14.x
- npm or yarn

### Setup

1. **Clone the repository**

```bash
git clone https://github.com/oaknpine/oaknpine-api.git
cd oaknpine-api
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=oaknpine_db

# CORS
CORS_ORIGIN=http://localhost:3001
```

4. **Create the database**

```bash
createdb oaknpine_db
```

5. **Run the application**

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## 📚 API Documentation

Once the server is running, access the Swagger documentation at:

```
http://localhost:3000/api/docs
```

### API Endpoints Overview

| Module    | Base Path          | Description                  |
| --------- | ------------------ | ---------------------------- |
| Homestays | `/api/v1/homestay` | Property and room management |
| Leads     | `/api/v1/lead`     | Lead tracking and follow-ups |
| Bookings  | `/api/v1/booking`  | Reservations and payments    |
| Packages  | `/api/v1/packages` | Tour packages management     |

### Key Endpoints

#### Homestays

- `POST /homestay` - Create homestay
- `GET /homestay` - List all homestays
- `POST /homestay/:id/rooms` - Add room
- `PATCH /homestay/rooms/:id/block` - Block room
- `PATCH /homestay/rooms/:id/pricing` - Update pricing

#### Leads

- `POST /lead` - Create lead
- `GET /lead` - List leads with filters
- `PATCH /lead/:id/status` - Update status
- `POST /lead/:id/follow-ups` - Add follow-up
- `GET /lead/statistics` - Get conversion stats

#### Bookings

- `POST /booking` - Create booking from lead
- `PATCH /booking/:id/check-in` - Process check-in
- `PATCH /booking/:id/check-out` - Process check-out
- `POST /booking/:id/payments` - Record payment
- `GET /booking/statistics` - Revenue statistics

#### Packages

- `POST /packages` - Create package
- `POST /packages/:id/pricing` - Add pricing tier
- `POST /packages/custom` - Create custom package
- `PATCH /packages/custom/:id/send-quote` - Send quote

## 🏗️ Project Structure

```
src/
├── homestay/           # Homestay & room management
│   ├── dto/
│   ├── entities/
│   ├── homestay.controller.ts
│   ├── homestay.service.ts
│   └── homestay.module.ts
├── lead/               # Lead & follow-up management
│   ├── dto/
│   ├── entities/
│   ├── lead.controller.ts
│   ├── lead.service.ts
│   └── lead.module.ts
├── room-booking/       # Booking & payment management
│   ├── dto/
│   ├── entities/
│   ├── room-booking.controller.ts
│   ├── room-booking.service.ts
│   └── room-booking.module.ts
├── packages/           # Tour package management
│   ├── dto/
│   ├── entities/
│   ├── packages.controller.ts
│   ├── packages.service.ts
│   └── packages.module.ts
├── database/           # Database configuration
├── app.module.ts
└── main.ts
```

## 💰 Pricing Model

OaknPine uses a **per-head per-night** pricing model:

```
Total = (Price Per Head × Number of Guests × Number of Nights) - Discount + Tax
```

### Room Types

- **View Rooms** - Rooms with scenic views (typically higher priced)
- **Non-View Rooms** - Standard rooms without views

### Package Pricing Tiers

Packages support tiered pricing for different group sizes (2-8 persons) with:

- Season-based pricing (regular, peak, off-season, festive)
- Room type variations (standard, deluxe, premium, luxury)

## 🔄 Lead Workflow

```
NEW → CONTACTED → QUALIFIED → PROPOSAL_SENT → NEGOTIATION → CONVERTED
                                                              ↓
                                                          BOOKING
```

Leads can also be marked as `LOST` or `INACTIVE` at any stage.

## 📊 Database Schema

### Core Entities

- `homestays` - Property information
- `rooms` - Room inventory with pricing
- `leads` - Customer inquiries
- `lead_follow_ups` - Follow-up history
- `bookings` - Reservations
- `booking_rooms` - Room allocations per booking
- `payments` - Payment records
- `packages` - Tour packages
- `package_itineraries` - Day-wise itinerary
- `package_pricing` - Tiered pricing
- `custom_packages` - Tailored packages

## 🚀 Deployment

### Railway (Recommended)

1. Connect your GitHub repository
2. Set environment variables in Railway dashboard
3. Deploy automatically on push

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/main"]
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📝 Environment Variables

| Variable      | Description             | Default                 |
| ------------- | ----------------------- | ----------------------- |
| `PORT`        | Server port             | `3000`                  |
| `DB_HOST`     | PostgreSQL host         | `localhost`             |
| `DB_PORT`     | PostgreSQL port         | `5432`                  |
| `DB_USERNAME` | Database user           | `postgres`              |
| `DB_PASSWORD` | Database password       | -                       |
| `DB_DATABASE` | Database name           | `oaknpine_db`           |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:3001` |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software owned by OaknPine Tourism.

## 📞 Support

- **Email**: support@oaknpine.com
- **Website**: https://oaknpine.com

---

Built with ❤️ for North Bengal Tourism
