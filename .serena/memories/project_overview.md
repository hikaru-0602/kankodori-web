# kankodori-web Project Overview

## Purpose

観光地検索システムのWebフロントエンド。テキストと画像を組み合わせた観光地検索機能を提供。

## Tech Stack

- **Framework**: Next.js 15.5.2 (with Turbopack)
- **Language**: TypeScript
- **UI Library**: React 19.1.0
- **Styling**: Tailwind CSS v4
- **Package Manager**: pnpm (lock file exists)
- **Linting**: ESLint v9
- **API**: OpenAPI 3.0.3 specification available

## Project Structure

- `/src/app/` - Next.js App Router
- `/public/` - Static assets
- `/openapi.yaml` - API specification for backend integration

## Backend API

- Endpoint: http://localhost:8000
- Main endpoints:
  - POST /search - テキスト/画像による観光地検索
  - GET /suggest-images - 画像提案機能
