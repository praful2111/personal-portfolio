// ─── WordPress Configuration ──────────────────────────────────────────────────
// Update WP_BASE_URL to your WordPress site URL.
// Update the page IDs below to match the pages you create in WordPress.
// Set any ID to 0 to disable dynamic loading for that section (uses fallback static content).
//
// ─── ACF Field Reference ──────────────────────────────────────────────────────
// Install: Advanced Custom Fields (ACF) Pro plugin + enable REST API in ACF settings.
//
// HERO PAGE (WP_PAGE_IDS.hero):
//   hero_greeting        — string  e.g. "👋 Hello, I'm Praful"
//   hero_name            — string  e.g. "Praful Patel"
//   hero_title           — string  e.g. "Full-Stack"
//   hero_title_italic    — string  e.g. "Web Developer"
//   hero_description     — textarea  Short bio for hero
//   hero_years_experience— string  e.g. "8+"
//   hero_status_text     — string  e.g. "Open to work"
//   hero_cta_primary     — string  e.g. "Explore My Skills"
//   hero_cta_secondary   — string  e.g. "Get in Touch"
//   hero_resume_url      — url    Link to resume PDF
//
// ABOUT PAGE (WP_PAGE_IDS.about):
//   about_bio_para1      — textarea  First bio paragraph
//   about_bio_para2      — textarea  Second bio paragraph
//   about_quick_facts    — repeater  (icon: string, label: string)
//   about_highlights     — repeater  (title, description, icon, accentColor)
//   about_tags           — textarea  Comma-separated skill tags
//
// ACHIEVEMENTS PAGE (WP_PAGE_IDS.achievements):
//   section_description  — textarea
//   stats                — repeater  (value: number, suffix: string, label: string)
//   timeline             — repeater  (role: "Organiser"|"Attendee", event: string, description: string)
//   wp_profile_url       — url
//   wp_profile_label     — string
//   wp_profile_desc      — textarea
//
// SERVICES PAGE (WP_PAGE_IDS.services):
//   services             — repeater  (name, description, color, icon_slug)
//                          icon_slug maps to: wordpress, woocommerce, shopify, tailwindcss,
//                          react, n8n, contentful, cpanel
//
// CONTACT PAGE (WP_PAGE_IDS.contact):
//   contact_heading      — string  e.g. "Let's Connect"
//   contact_email        — email
//   contact_phone        — string
//   contact_location     — string
//   contact_availability — string  e.g. "Available for freelance"

export const WP_BASE_URL = "https://iamprafulpatel.com";

export const WP_PAGE_IDS = {
  hero: 0, // Set to your Hero/Home page ID in WordPress
  about: 0, // Set to your About page ID
  achievements: 0, // Set to your Achievements page ID
  services: 0, // Set to your Services page ID
  contact: 0, // Set to your Contact page ID
} as const;
