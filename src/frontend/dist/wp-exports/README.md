# WordPress Integration Files

These files help you connect your portfolio to a WordPress backend.

## Files Included

| File | Purpose |
|------|---------|
| `acf-blog-fields.json` | ACF field group for blog post custom fields. Import via **ACF > Tools > Import Field Groups** |
| `acf-options-page.json` | ACF field group for site-wide settings (name, bio, social links, stats). Import the same way |
| `wp-rest-api-endpoints.json` | All REST API endpoints the frontend uses, with documentation |

## Setup Steps

### 1. Install Required WordPress Plugins
- [Advanced Custom Fields (free)](https://wordpress.org/plugins/advanced-custom-fields/) or ACF PRO
- [ACF to REST API](https://wordpress.org/plugins/acf-to-rest-api/) — exposes ACF fields via REST
- [Contact Form 7](https://wordpress.org/plugins/contact-form-7/) — for the contact form endpoint

### 2. Import ACF Field Groups
1. Go to **ACF > Tools > Import Field Groups**
2. Import `acf-blog-fields.json`
3. Import `acf-options-page.json`

### 3. Register ACF Options Page
Add to your `functions.php`:
```php
if (function_exists('acf_add_options_page')) {
    acf_add_options_page([
        'page_title' => 'Site Settings',
        'menu_title' => 'Site Settings',
        'menu_slug'  => 'site-settings',
        'capability' => 'edit_posts',
        'redirect'   => false,
    ]);
}
```

### 4. Configure CORS
Add to `functions.php`:
```php
add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function($value) {
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Credentials: true');
        return $value;
    });
}, 15);
```

### 5. Set WP Base URL in Frontend
In `App.tsx`, find and update:
```ts
const WP_BASE_URL = 'https://iamprafulpatel.com';
```

### 6. Fill in Site Settings
Go to **WordPress Admin > Site Settings** and fill in your name, bio, social links, and stats.

## Plain HTML/CSS Note
Caffeine apps are built with React + TypeScript. There is no direct export to plain HTML/CSS.
However, once you export the project to GitHub, you can:
1. Run `npm run build` to produce a static build in `dist/`
2. The `dist/` folder contains a plain `index.html` + CSS/JS bundle that can be uploaded to any host
3. For a true WordPress theme, you would copy the built JS/CSS into a WP theme and use the REST API endpoints above to make it fully dynamic
