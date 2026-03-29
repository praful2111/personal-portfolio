# Personal Portfolio

## Current State
A single-page React portfolio app (App.tsx) with sections: Hero, About, Services, Tech Stack, Achievements, Skills, Contact. No blog or routing. All content is hardcoded.

## Requested Changes (Diff)

### Add
- Blog listing section/page: grid of post cards (title, featured image, excerpt, date, category, Read More link)
- Blog detail view: full post with title, featured image, date, category, content rendered as HTML
- WordPress REST API integration: fetch posts from `https://iamprafulpatel.com/wp-json/wp/v2/posts?_embed&per_page=9`
- Single post fetch: `https://iamprafulpatel.com/wp-json/wp/v2/posts/{id}?_embed`
- WP_BASE_URL constant at top of App.tsx for easy reconfiguration
- "Blog" nav link added to the navbar
- Loading skeleton states for blog listing and detail
- Error state handling (shows friendly message if WP API is unreachable)
- Back button on detail view to return to blog listing
- Blog section added between Tech Stack and Contact in the single-page layout
- ACF JSON configuration files provided as downloadable reference files in `/public/wp-exports/`

### Modify
- Navbar: add "Blog" anchor link
- App routing: use simple state-based view switching (no react-router, keep single-page approach) — `view: 'home' | 'blog-detail'` with selected post ID

### Remove
- Nothing removed

## Implementation Plan
1. Add `WP_BASE_URL = 'https://iamprafulpatel.com'` constant
2. Create `usePosts()` hook: fetches `GET /wp-json/wp/v2/posts?_embed&per_page=9` on mount
3. Create `usePost(id)` hook: fetches single post by ID
4. Add `BlogSection` component: responsive grid of PostCards, skeleton loaders, error fallback
5. Add `BlogDetail` component: full post view with featured image, title, date, HTML content rendered via dangerouslySetInnerHTML, Back button
6. Add view state to App: default `'home'`, switch to `'blog-detail'` with postId when card clicked
7. Add Blog nav link; on click scrolls to blog section (home view) or navigates back
8. Match existing site color scheme: ivory background, emerald green accents, gold highlights
9. Write ACF JSON export files to `/public/wp-exports/`
