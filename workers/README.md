# The Airlock: Deployment Guide

This directory contains the Cloudflare Worker that secures your Gemini API Key.

## Prerequisites
1.  **Cloudflare Account**: [Sign up here](https://dash.cloudflare.com/sign-up).
2.  **Wrangler CLI**: `npm install -g wrangler` (or use local project version).

## Setup
1.  Navigate to directory:
    ```bash
    cd workers
    npm install
    ```

2.  **Login to Cloudflare**:
    ```bash
    npx wrangler login
    ```

## Secrets Management
**CRITICAL**: Never save your key in code. Use the secret vault.
```bash
npx wrangler secret put GEMINI_API_KEY
```
*Paste your Google Gemini API Key when prompted.*

## Deployment
```bash
npx wrangler deploy
```
You will get a URL like `https://thay-airlock.your-name.workers.dev`.

## Connecting the App
1.  Copy the Worker URL.
2.  Go to `src/services/geminiService.ts` (or `.env`).
3.  Update the connection logic to point to this websocket URL.
