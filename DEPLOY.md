# Tascorr Deployment & Installation Guide (Plesk + MariaDB)

This guide walks you through deploying the Tascorr application to your Plesk-hosted server and configuring the database on **https://tascorr.thinksafe.mv**.

---

## Prerequisites

Before starting, ensure your Plesk hosting account meets the following minimum requirements:
* **PHP:** v7.4 or newer (with `pdo_mysql`, `mbstring`, `json`, and `fileinfo` extensions enabled) for running the installer.
* **Node.js:** v18 or newer for running the application backend.
* **Database:** MySQL v5.7+ or MariaDB v10.3+.

---

## Step 1: Create a MySQL/MariaDB Database in Plesk

1. Log in to your **Plesk Control Panel**.
2. Navigate to **Databases** (under your subscription for `tascorr.thinksafe.mv`) and click **Add Database**.
3. Configure the database details:
   * **Database name:** (e.g., `tascorr_db`)
   * **Database server:** Local MySQL server (default)
   * **Database user:** (e.g., `tascorr_user`)
   * **Password:** Generate a strong, secure password.
4. Note down the **Database Name**, **Username**, and **Password**. The database host is typically `localhost` or `127.0.0.1`.

---

## Step 2: Build & Upload Application Files

To prepare the application files for upload:
1. In your local workspace, run the production build:
   ```bash
   npm install
   npm run build
   ```
2. Compress the application files into a ZIP archive (`tascorr.zip`). Make sure to **exclude** local development files:
   * `node_modules/`
   * `.git/`
   * `.env` (the installer will generate this)
   * `prisma/dev.db` (old SQLite file)
3. Log in to Plesk and open **File Manager** for `tascorr.thinksafe.mv`.
4. Upload `tascorr.zip` to the webroot directory (usually `httpdocs/` or a custom directory configured in Plesk).
5. Extract the ZIP file in the directory. Ensure the `install.php` and `install.sql` files are located at the root of your application webroot.

---

## Step 3: Run the Web Installation Wizard

1. Open your web browser and navigate to the web installer:
   ```
   https://tascorr.thinksafe.mv/install.php
   ```
2. The browser-based wizard will run in sequence:
   * **Step 1 — Pre-flight Checks:** Checks PHP version, write permissions, and required extensions.
   * **Step 2 — Database Connection:** Input your Plesk MySQL/MariaDB credentials (hostname, port, database name, username, password) and click **Test Connection**.
   * **Step 3 — Schema Installation:** The wizard imports `install.sql` to build the database architecture.
   * **Step 4 — Write Environment:** Creates a production `.env` configuration file containing the database connection string and a randomly generated secure `JWT_SECRET`. An `.htaccess` rule will block direct public access to `.env` for security.
   * **Step 5 — Create Superadmin:** Enter your desired email and a strong password (minimum 12 characters, including uppercase, lowercase, numbers, and symbols).
   * **Step 6 — Seeding:** Keep the **Load Evaluation Demo Workspace** checkbox checked if you want sample data (Acme Maldives Corp, test users, ranks, and sample tasks).
   * **Step 7 — Finish:** The installer writes a backup summary to `/tascorr-install-credentials.txt` (stored safely one directory above the webroot) and self-deletes `install.php` for security.

---

## Step 4: Configure Node.js Application in Plesk

1. Go back to the Plesk Control Panel for `tascorr.thinksafe.mv`.
2. Click on the **Node.js** icon.
3. Configure the Node.js settings:
   * **Node.js Version:** Select v18 or newer.
   * **Application Mode:** Set to `production`.
   * **Application Root:** Select the directory where you extracted the files (e.g. `/httpdocs`).
   * **Document Root:** Select the public webroot (e.g. `/httpdocs/public`).
   * **Application Startup File:** Set to **`dist/server/server/index.js`** (this is the compiled backend entry point).
4. Click **NPM Install** in the Node.js settings screen to install the production dependencies on the server.
5. Click **Enable Node.js**. Plesk Phusion Passenger will automatically spin up the Node.js application process and reverse-proxy incoming web traffic.

---

## Step 5: Verification & Security Checks

1. Navigate to **https://tascorr.thinksafe.mv**. The landing page should render correctly.
2. Click **Login** and authenticate with the **Global Superadmin** email and password you created during the installation wizard.
3. If you enabled seed data, verify that you can switch to the *Acme Maldives Corp* workspace and access the dashboard.
4. Verify that `install.php` and `install-cli.php` are deleted from your root folder. If they are still present, delete them manually via the Plesk File Manager.
