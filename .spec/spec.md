# DAOx Technical Specification

## 1. Project Overview

**DAOx** is a modular hub for SSV Network DAO members, providing governance tools and insights through extensible modules.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                   Frontend (SPA)                │
└─────────────────────────────────────────────────┘
```

### Key Principles

- **Modular:** Each feature is an isolated module
- **Extensible:** Plugin architecture for future modules

---

## 3. Data Schema

### 3.1 Core Entities

#### Module

| Field       | Type     | Description                  |
|-------------|----------|------------------------------|
| id          | UUID     | Primary key                  |
| slug        | String   | URL identifier               |
| name        | String   | Display name                 |
| status      | Enum     | `active`, `coming_soon`      |
| sortOrder   | Integer  | Display order                |

---

## 4. Core Features

### 4.1 Landing Page

- Display grid of available modules
- Visual distinction for `active` vs `coming_soon` status
- Route to module on click (active only)

### 4.2 DAO Delegates Module

DAO Delegates — a leaderboard displaying active delegates and rotation metrics.

**Filters:**
1. **Rotation Filter** — Visualization of delegation changes over time