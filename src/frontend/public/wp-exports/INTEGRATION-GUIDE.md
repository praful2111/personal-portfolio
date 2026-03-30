# WordPress API Integration Guide

Complete step-by-step guide to connect your React portfolio to a WordPress backend and deploy everything to production.

---

## Table of Contents
1. [WordPress Setup](#1-wordpress-setup)
2. [Required Plugins](#2-required-plugins)
3. [ACF Field Groups Setup](#3-acf-field-groups-setup)
4. [CORS Configuration](#4-cors-configuration)
5. [REST API Endpoints Reference](#5-rest-api-endpoints-reference)
6. [Frontend Configuration](#6-frontend-configuration)
7. [Deploying the React App to a New Server](#7-deploying-the-react-app-to-a-new-server)
8. [Moving WordPress to a Subdomain](#8-moving-wordpress-to-a-subdomain)
9. [Making React App the Main Domain](#9-making-react-app-the-main-domain)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. WordPress Setup

Your WordPress site is at: `http://iamprafulpatel.com/`  
Target architecture after migration:
- `wp.iamprafulpatel.com` → WordPress backend (admin + API)
- `iamprafulpatel.com` → React portfolio (main domain)

---

## 2. Required Plugins

Install all of these from your WordPress admin → Plugins → Add New:

| Plugin | Purpose | Free? |
|--------|---------|-------|
| **Advanced Custom Fields PRO** | Custom fields for all sections | Paid (ACF Pro) or free ACF |
| **ACF to REST API** | Exposes ACF fields in `/wp-json` | Free |
| **WP CORS** or manual `functions.php` | Allow React app to call WP API | Free |
| **Yoast SEO** or **Rank Math** | Sitemap + SEO meta | Free |

> **Note:** The free version of ACF works fine. ACF Pro adds repeater fields (used for services list, quick facts, timeline). Without Pro, you can use a simpler text-based approach.

---

## 3. ACF Field Groups Setup

### 3a. Import Field Groups

1. In WordPress admin, go to **ACF → Tools → Import Field Groups**
2. Import each of these files from this folder:
   - `acf-options-page.json` → Site-wide settings (hero, about, contact)
   - `acf-blog-fields.json` → Per-post blog fields
   - `acf-services-fields.json` → Services/skills section

### 3b. Register ACF Options Page

Add this to your theme's `functions.php`:

```php
// Register ACF Options Page (requires ACF Pro)
if ( function_exists('acf_add_options_page') ) {
    acf_add_options_page([
        'page_title' => 'Portfolio Settings',
        'menu_title' => 'Portfolio',
        'menu_slug'  => 'portfolio-settings',
        'capability' => 'edit_posts',
        'redirect'   => false,
    ]);

    // Sub-pages for each section
    acf_add_options_sub_page([
        'page_title'  => 'Hero Section',
        'menu_title'  => 'Hero',
        'parent_slug' => 'portfolio-settings',
    ]);
    acf_add_options_sub_page([
        'page_title'  => 'About Section',
        'menu_title'  => 'About',
        'parent_slug' => 'portfolio-settings',
    ]);
    acf_add_options_sub_page([
        'page_title'  => 'Services Section',
        'menu_title'  => 'Services',
        'parent_slug' => 'portfolio-settings',
    ]);
}
```

### 3c. ACF Field Names Reference

#### Hero Section (Options Page)
| Field Name | Type | Description |
|---|---|---|
| `hero_greeting` | Text | e.g. "👋 Hello, I'm Praful" |
| `hero_name` | Text | Full name |
| `hero_title` | Text | e.g. "Full-Stack" |
| `hero_title_italic` | Text | e.g. "Web Developer" |
| `hero_description` | Textarea | Hero paragraph text |
| `hero_years_experience` | Text | e.g. "8+" |
| `hero_cta_primary` | Text | Primary button label |
| `hero_cta_secondary` | Text | Secondary button label |

#### About Section (Page or Options)
| Field Name | Type | Description |
|---|---|---|
| `about_bio_para1` | Textarea | First bio paragraph |
| `about_bio_para2` | Textarea | Second bio paragraph |
| `about_quick_facts` | Repeater | Rows: `icon` (text emoji), `label` (text) |
| `about_highlights` | Repeater | Rows: `title`, `description`, `icon`, `accentColor` |
| `about_tags` | Textarea | Comma-separated skill tags |

#### Services Section (Page or Options)
| Field Name | Type | Description |
|---|---|---|
| `services` | Repeater | Rows: `name`, `description`, `icon_slug`, `color` |

**icon_slug values for services:**
- `wordpress` → WordPress Development
- `woocommerce` → WooCommerce
- `shopify` → Shopify
- `tailwindcss` → HTML/CSS Frameworks
- `react` → React.js & Next.js
- `n8n` → AI & Automation
- `contentful` → Headless CMS
- `cpanel` → DevOps & Hosting

#### Achievements Section
| Field Name | Type | Description |
|---|---|---|
| `achievements_description` | Textarea | Intro paragraph |
| `achievements_stats` | Repeater | Rows: `value` (text), `label` (text) |
| `achievements_timeline` | Repeater | Rows: `year`, `title`, `description` |

#### Contact Section
| Field Name | Type | Description |
|---|---|---|
| `contact_heading` | Text | Section title |
| `contact_email` | Email | Contact email |
| `contact_phone` | Text | Phone number |

---

## 4. CORS Configuration

The React app runs on a different domain than WordPress, so you must allow cross-origin requests.

Add this to your theme's `functions.php`:

```php
// Allow CORS for REST API
function portfolio_add_cors_headers() {
    // Replace with your actual React app domain
    $allowed_origins = [
        'https://iamprafulpatel.com',
        'https://www.iamprafulpatel.com',
        'http://localhost:5173',   // local dev
        'http://localhost:3000',   // local dev alternate
    ];

    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    if ( in_array( $origin, $allowed_origins ) ) {
        header( 'Access-Control-Allow-Origin: ' . $origin );
        header( 'Access-Control-Allow-Methods: GET, POST, OPTIONS' );
        header( 'Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With' );
        header( 'Access-Control-Allow-Credentials: true' );
    }

    if ( $_SERVER['REQUEST_METHOD'] === 'OPTIONS' ) {
        status_header( 200 );
        exit();
    }
}
add_action( 'init', 'portfolio_add_cors_headers' );

// Also expose headers in REST API
add_filter( 'rest_pre_serve_request', function( $value ) {
    $allowed_origins = [
        'https://iamprafulpatel.com',
        'http://localhost:5173',
    ];
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ( in_array( $origin, $allowed_origins ) ) {
        header( 'Access-Control-Allow-Origin: ' . $origin );
    }
    return $value;
});
```

---

## 5. REST API Endpoints Reference

Base URL: `https://wp.iamprafulpatel.com/wp-json`

### Blog Posts
```
GET /wp/v2/posts?_embed&per_page=10&page=1
GET /wp/v2/posts?slug=your-post-slug&_embed
```

### Pages (for dynamic sections)
```
GET /wp/v2/pages/{PAGE_ID}?acf_format=standard
```

### Options Page (ACF)
```
GET /acf/v3/options/options
```

### Categories
```
GET /wp/v2/categories
```

### Test Your API
Open this URL in your browser (replace with your WP domain):
```
https://wp.iamprafulpatel.com/wp-json/wp/v2/posts?per_page=1
```
You should see a JSON array of posts.

---

## 6. Frontend Configuration

### 6a. Update API base URL

Open `src/frontend/src/wp-config.ts` and update:

```ts
export const WP_API_BASE = 'https://wp.iamprafulpatel.com/wp-json';
```

### 6b. Set Page IDs

In the same file, update `WP_PAGE_IDS` with the actual WordPress page IDs:

```ts
export const WP_PAGE_IDS = {
  hero:         0,   // Set to your Hero page ID, e.g. 42
  about:        0,   // Set to your About page ID, e.g. 56
  achievements: 0,   // Set to your Achievements page ID
  services:     0,   // Set to your Services page ID
  contact:      0,   // Set to your Contact page ID
};
```

To find a page ID: In WordPress admin, hover over the page in **Pages → All Pages** and look at the URL in your browser status bar — it will contain `post=123`.

### 6c. Build for production

```bash
cd src/frontend
npm install
npm run build
```

The output is in `src/frontend/dist/` — this is what you deploy.

---

## 7. Deploying the React App to a New Server

The React app builds to a plain `index.html` + static JS/CSS files. You can host it almost anywhere.

### Option A: cPanel Shared Hosting (Recommended for your setup)

1. **Build the app:**
   ```bash
   cd src/frontend
   npm install
   npm run build
   # Output is in: src/frontend/dist/
   ```

2. **Upload via File Manager or FTP:**
   - Log in to cPanel
   - Open **File Manager**
   - Navigate to `public_html/` (for main domain) or `public_html/subfolder/`
   - Delete existing files (keep `.htaccess` if you have one)
   - Upload ALL files from `src/frontend/dist/` to `public_html/`

3. **Add `.htaccess` for React Router:**
   Create a file called `.htaccess` in `public_html/` with this content:
   ```apache
   Options -MultiViews
   RewriteEngine On
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteRule ^ index.html [QSA,L]
   ```
   This ensures `/blog` and `/blog/post-slug` routes work correctly instead of showing a 404.

4. **Test:** Visit `https://iamprafulpatel.com/blog` — it should load the blog listing.

### Option B: VPS / Ubuntu Server (Nginx)

1. **Build the app** (same as above)

2. **Upload files to server:**
   ```bash
   scp -r src/frontend/dist/* user@your-server-ip:/var/www/html/
   ```

3. **Configure Nginx:**
   ```nginx
   server {
       listen 80;
       server_name iamprafulpatel.com www.iamprafulpatel.com;
       root /var/www/html;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;  # Required for React Router
       }

       # Cache static assets
       location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
   }
   ```

4. **Enable SSL with Certbot:**
   ```bash
   sudo certbot --nginx -d iamprafulpatel.com -d www.iamprafulpatel.com
   ```

### Option C: Netlify (Easiest)

1. Push your project to GitHub
2. Go to [netlify.com](https://netlify.com) → New site from Git
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add a `_redirects` file in `src/frontend/public/` (already present):
   ```
   /*  /index.html  200
   ```
6. Set custom domain to `iamprafulpatel.com` in Netlify settings

### Option D: Vercel

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → Import project
3. Framework preset: **Vite**
4. Set custom domain in Vercel project settings

---

## 8. Moving WordPress to a Subdomain

Move WordPress from `iamprafulpatel.com` to `wp.iamprafulpatel.com`.

### Step 1: Create the subdomain

1. Log in to cPanel
2. Go to **Domains → Subdomains** (or **Addon Domains**)
3. Create subdomain: `wp` on `iamprafulpatel.com`
4. Set document root to `public_html/wp` or a custom path

### Step 2: Backup WordPress

1. Export database: cPanel → **phpMyAdmin** → select your DB → **Export → Quick → Go**
   - Save as `backup.sql`
2. Download all WP files via FTP: the entire `public_html/` folder

### Step 3: Move files

1. Create directory `public_html/wp/` (or wherever the subdomain points)
2. Copy all WordPress files there
3. Create a new MySQL database for the subdomain (cPanel → MySQL Databases)
4. Import `backup.sql` into the new database

### Step 4: Update wp-config.php

Edit `wp-config.php` in the new location:
```php
define('DB_NAME', 'your_new_db_name');
define('DB_USER', 'your_new_db_user');
define('DB_PASSWORD', 'your_new_db_password');
define('DB_HOST', 'localhost');
```

### Step 5: Update WordPress URLs in database

In phpMyAdmin, run these SQL queries (replace with your actual domains):
```sql
UPDATE wp_options 
  SET option_value = 'https://wp.iamprafulpatel.com' 
  WHERE option_name = 'siteurl';

UPDATE wp_options 
  SET option_value = 'https://wp.iamprafulpatel.com' 
  WHERE option_name = 'home';
```

For content links, use **Better Search Replace** plugin or run:
```sql
UPDATE wp_posts 
  SET post_content = REPLACE(
    post_content, 
    'https://iamprafulpatel.com', 
    'https://wp.iamprafulpatel.com'
  );

UPDATE wp_postmeta 
  SET meta_value = REPLACE(
    meta_value, 
    'https://iamprafulpatel.com', 
    'https://wp.iamprafulpatel.com'
  );
```

### Step 6: Add SSL for subdomain

In cPanel → **SSL/TLS → Let's Encrypt** (or AutoSSL), issue a certificate for `wp.iamprafulpatel.com`.

### Step 7: Test WordPress on subdomain

Visit `https://wp.iamprafulpatel.com/wp-admin` — you should see your WordPress admin.

Test the API: `https://wp.iamprafulpatel.com/wp-json/wp/v2/posts`

---

## 9. Making React App the Main Domain

After WordPress is on `wp.iamprafulpatel.com`, deploy the React app to `iamprafulpatel.com`.

### Step 1: Update React API URL

In `src/frontend/src/wp-config.ts`:
```ts
export const WP_API_BASE = 'https://wp.iamprafulpatel.com/wp-json';
```

Also update the CORS allowed origins in WordPress `functions.php`:
```php
$allowed_origins = [
    'https://iamprafulpatel.com',
    'https://www.iamprafulpatel.com',
];
```

### Step 2: Build React app
```bash
cd src/frontend
npm install
npm run build
```

### Step 3: Deploy to main domain

1. In cPanel File Manager, go to `public_html/`
2. Delete the old WordPress files (you have already moved them to `public_html/wp/`)
3. Upload all files from `src/frontend/dist/` to `public_html/`
4. Create `.htaccess` file:
   ```apache
   Options -MultiViews
   RewriteEngine On
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteRule ^ index.html [QSA,L]
   ```

### Step 4: Verify

- `https://iamprafulpatel.com` → React portfolio ✓
- `https://iamprafulpatel.com/blog` → Blog listing ✓  
- `https://iamprafulpatel.com/blog/your-slug` → Blog post ✓
- `https://wp.iamprafulpatel.com/wp-admin` → WordPress admin ✓
- `https://wp.iamprafulpatel.com/wp-json/wp/v2/posts` → REST API ✓

---

## 10. Troubleshooting

### Blog posts not loading
- **CORS error in browser console** → Add the CORS snippet from Section 4 to `functions.php`
- **404 on REST API** → Go to WP Admin → Settings → Permalinks → Save Changes (this flushes rewrite rules)
- **Empty array returned** → Make sure posts are published (not draft)

### React routes returning 404 (e.g. /blog gives 404)
- You are missing the `.htaccess` redirect rule. Add the one from Section 7A.
- On Nginx, make sure `try_files $uri $uri/ /index.html;` is in your config.

### ACF fields not showing in API response
- Make sure **ACF to REST API** plugin is installed and activated
- In ACF → Settings → enable "Show in REST API"
- Check the endpoint: `https://wp.iamprafulpatel.com/wp-json/acf/v3/pages/{ID}`

### WordPress admin broken after moving to subdomain
- Run the SQL `UPDATE wp_options` queries from Step 5 of Section 8
- If locked out, edit `wp-config.php` directly and add:
  ```php
  define('WP_HOME', 'https://wp.iamprafulpatel.com');
  define('WP_SITEURL', 'https://wp.iamprafulpatel.com');
  ```

### Images not showing after move
- Run the URL replacement SQL from Step 5 of Section 8
- Or install the **Better Search Replace** plugin and replace the old domain with the new one

---

## Quick Checklist

- [ ] WordPress running at `wp.iamprafulpatel.com`
- [ ] ACF Pro installed + ACF to REST API plugin active
- [ ] Field groups imported from `acf-options-page.json` and `acf-services-fields.json`
- [ ] CORS snippet added to `functions.php`
- [ ] `WP_API_BASE` in `wp-config.ts` points to `https://wp.iamprafulpatel.com/wp-json`
- [ ] `WP_PAGE_IDS` updated with real page IDs
- [ ] React app built with `npm run build`
- [ ] `dist/` contents uploaded to `public_html/`
- [ ] `.htaccess` file in place for React Router
- [ ] SSL active on both domains
