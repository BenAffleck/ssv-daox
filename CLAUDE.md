# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**DAOx** is a modular hub for SSV Network DAO members, providing governance tools and insights through extensible modules. The first module is DAO Delegates - a leaderboard displaying active delegates and rotation metrics.

## Technology Stack

- **Tech Stack:** Detailed Tech Stack informations are located in `.spec/techstack.md`
- **Testing:** Vitest (unit), Testing Library (component), Playwright (E2E)

## Architecture Principles

### Modular Design
Each feature is an isolated module with a plugin architecture:
- Active modules are clickable and route to their dedicated pages
- The detailed architecture informations are located in `.spec/architecture.md`

### Core Features
1. **Landing Page:** Grid of modules filtered by status with routing to active modules
2. **DAO Delegates Module:**
   - Leaderboard view: ranked table by voting power and active state

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run Vitest unit tests
- `npm run test:e2e` - Run Playwright E2E tests
- `npm run lint` - Run ESLint

## Key Files

- `.spec/spec.md` - Complete technical specification
- `.spec/techstack.md` - Technology stack rationale and architecture fit
- `.spec/architecture.md` - Detailed architecture of the project

## General Rules (IMPORTANT!)

- Always read `.spec/spec.md`, `.spec/architecture.md` and `.spec/techstack.md` before writing any code.
- Always implement and run unit tests for major features or completed milestones.
- After adding a major feature or completing a milestone, ALWAYS update `.spec/architecture.md`. If new technology has been introduced, update `.spec/techstack.md`.

