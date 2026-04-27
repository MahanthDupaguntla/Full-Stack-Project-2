# Deploying ArtForge to Render

Render is an excellent platform for hosting Spring Boot applications. Since I've already updated your code to remove Railway references, you can follow these steps to deploy your backend to Render.

## Step 1: Push your Code to GitHub
Ensure all recent changes, including the newly created `render.yaml`, are pushed to your GitHub repository.

## Step 2: Set Up Your Database
Render natively provides **PostgreSQL** (not MySQL). Your application is already configured to automatically switch from MySQL to PostgreSQL in production because we have the PostgreSQL driver in your `pom.xml` and we rely on Hibernate to auto-generate tables!

1. Go to the [Render Dashboard](https://dashboard.render.com).
2. Click **New** -> **PostgreSQL**.
3. Name it `artforge-db` and select the **Free** tier.
4. Click **Create Database**.
5. Once created, scroll down to the **Connections** section and copy the **Internal Database URL** (it should look like `postgres://...`). 
   > *Note: We will convert this to a JDBC URL in the next step.*

## Step 3: Deploy the Backend (Web Service)

You can deploy using the `render.yaml` file I just created, or manually via the dashboard:

**Option A: Using the Render Dashboard (Manual)**
1. Click **New** -> **Web Service**.
2. Connect your GitHub repository and select the `artforge` repo.
3. Configure the service:
   - **Name**: `artforge-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Docker` (Render will automatically detect your `Dockerfile`)
   - **Instance Type**: `Free`
4. Add the following **Environment Variables**:
   - `DATABASE_URL`: Here, you need to paste your Internal Database URL, but change `postgres://` to `jdbc:postgresql://`. For example: `jdbc:postgresql://dpg-xxxxx...`
   - `JWT_SECRET`: Create a strong random string (at least 32 characters).
   - `CORS_ORIGINS`: `http://localhost:5173,https://full-stack-project-2-lilac.vercel.app,https://*.vercel.app`
   - `MAIL_PASSWORD`: Your Gmail App Password (e.g. `odliiroprqdwpise`)
5. Click **Create Web Service**.

**Option B: Using render.yaml (Blueprint)**
1. Click **New** -> **Blueprint**.
2. Select your `artforge` repository.
3. Render will read the `render.yaml` file and set up both the database and the web service automatically.
4. *Important*: After it deploys, you must go to the `artforge-backend` Web Service -> **Environment** and manually set `MAIL_PASSWORD` to your Gmail App Password.

## Step 4: Update the Frontend
Once your Render backend is live, it will give you a URL like `https://artforge-backend.onrender.com`.

1. In your frontend (Vercel), go to your project settings -> **Environment Variables**.
2. Update `VITE_API_URL` to point to your new Render backend URL (e.g., `https://artforge-backend.onrender.com`).
3. Redeploy your frontend on Vercel so it picks up the new URL.

> [!WARNING]
> Render's free tier spins down web services after 15 minutes of inactivity. When a user first visits your app after it has spun down, the first API request might take 30-50 seconds to complete while the server wakes up.
