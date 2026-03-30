import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useActor } from "@/hooks/useActor";
import { AnimatePresence, motion, useInView } from "motion/react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
// ─── Mini Router ─────────────────────────────────────────────────────────────
function useNavigate() {
  return (path: string) => {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };
}
function useLocation() {
  const [pathname, setPathname] = useState(window.location.pathname);
  useEffect(() => {
    const handler = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);
  return { pathname };
}
function useParams<T extends Record<string, string>>(): Partial<T> {
  const { pathname } = useLocation();
  const match = pathname.match(/^\/blog\/([^/]+)/);
  return (match ? { slug: match[1] } : {}) as Partial<T>;
}
function Link({
  to,
  href,
  children,
  className,
  onClick,
}: {
  to?: string;
  href?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const navigate = useNavigate();
  const target = to ?? href ?? "#";
  return (
    <a
      href={target}
      className={className}
      onClick={(e) => {
        if (target.startsWith("#") || target.startsWith("http")) return;
        e.preventDefault();
        navigate(target);
        onClick?.();
      }}
    >
      {children}
    </a>
  );
}
function Routes({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
function Route({ path, element }: { path: string; element: React.ReactNode }) {
  const { pathname } = useLocation();
  if (path === "/" && pathname === "/") return <>{element}</>;
  if (path === "/blog" && pathname === "/blog") return <>{element}</>;
  if (
    path === "/blog/:slug" &&
    pathname.startsWith("/blog/") &&
    pathname !== "/blog/"
  )
    return <>{element}</>;
  return null;
}
import { acf, acfArray, useWPPage } from "./hooks/useWordPress";
import { WP_PAGE_IDS } from "./wp-config";

// ─── WordPress Integration ────────────────────────────────────────────────────

const WP_BASE_URL = "https://iamprafulpatel.com";

interface WPPost {
  id: number;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  date: string;
  slug: string;
  _embedded?: {
    "wp:featuredmedia"?: Array<{ source_url: string; alt_text: string }>;
    "wp:term"?: Array<Array<{ id: number; name: string; slug: string }>>;
  };
}

function usePosts() {
  const [posts, setPosts] = useState<WPPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${WP_BASE_URL}/wp-json/wp/v2/posts?_embed&per_page=9&status=publish`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch posts");
        return r.json();
      })
      .then((data) => {
        setPosts(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  return { posts, loading, error };
}

function usePostBySlug(slug: string | undefined) {
  const [post, setPost] = useState<WPPost | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setPost(null);
    fetch(
      `${WP_BASE_URL}/wp-json/wp/v2/posts?slug=${encodeURIComponent(slug)}&_embed`,
    )
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch post");
        return r.json();
      })
      .then((data: WPPost[]) => {
        setPost(data[0] ?? null);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [slug]);

  return { post, loading, error };
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function readingTime(content: string): number {
  const words = stripHtml(content).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

// ─── Blog Components ──────────────────────────────────────────────────────────

function BlogCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-border bg-card animate-pulse">
      <div className="h-48 bg-muted" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-muted rounded w-1/4" />
        <div className="h-5 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-2/3" />
        <div className="h-4 bg-muted rounded w-1/3 mt-4" />
      </div>
    </div>
  );
}

function BlogSection({ limit }: { limit?: number }) {
  const navigate = useNavigate();
  const { posts, loading, error } = usePosts();
  const displayedPosts = limit ? posts.slice(0, limit) : posts;
  const skeletonCount = limit ?? 6;

  return (
    <section id="blog" className="py-20 md:py-28 bg-background">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <p className="text-xs font-semibold tracking-widest text-primary uppercase mb-2">
            Thoughts & Tutorials
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Blog &amp; Insights
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            Tips, tutorials, and experiences from years of working across
            WordPress, React, DevOps, and beyond.
          </p>
        </motion.div>

        {error && (
          <div
            className="flex flex-col items-center gap-4 py-16 text-muted-foreground"
            data-ocid="blog.error_state"
          >
            <WordPressIcon className="w-12 h-12 opacity-40" />
            <p className="text-lg">
              Could not load posts. Please check back later.
            </p>
          </div>
        )}

        {loading && !error && (
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            data-ocid="blog.loading_state"
          >
            {Array.from({ length: skeletonCount }, (_, i) => `s${i}`).map(
              (k) => (
                <BlogCardSkeleton key={k} />
              ),
            )}
          </div>
        )}

        {!loading && !error && posts.length === 0 && (
          <div
            className="text-center py-16 text-muted-foreground"
            data-ocid="blog.empty_state"
          >
            No posts published yet.
          </div>
        )}

        {!loading && !error && displayedPosts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayedPosts.map((post, i) => {
              const featuredImg =
                post._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
              const altText =
                post._embedded?.["wp:featuredmedia"]?.[0]?.alt_text ??
                post.title.rendered;
              const category = post._embedded?.["wp:term"]?.[0]?.[0]?.name;
              const excerpt = stripHtml(post.excerpt.rendered);
              const truncated =
                excerpt.length > 120 ? `${excerpt.slice(0, 120)}…` : excerpt;

              return (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  className="group rounded-2xl overflow-hidden border border-border bg-card hover:border-primary hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col"
                  onClick={() => navigate(`/blog/${post.slug}`)}
                  data-ocid={`blog.item.${i + 1}`}
                >
                  <div className="h-48 overflow-hidden flex-shrink-0">
                    {featuredImg ? (
                      <img
                        src={featuredImg}
                        alt={altText}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/80 to-primary/40 flex items-center justify-center">
                        <WordPressIcon className="w-12 h-12 opacity-40" />
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    {category && (
                      <span className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-2">
                        {category}
                      </span>
                    )}
                    <h3 className="text-base font-bold text-foreground mb-2 leading-snug group-hover:text-primary transition-colors">
                      {stripHtml(post.title.rendered)}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                      {truncated}
                    </p>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(post.date)}
                      </span>
                      <span
                        className="text-sm font-semibold text-primary group-hover:underline"
                        data-ocid={`blog.button.${i + 1}`}
                      >
                        Read More →
                      </span>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
        {!loading && !error && limit && posts.length > limit && (
          <div className="flex justify-center mt-10">
            <button
              type="button"
              onClick={() => navigate("/blog")}
              className="px-8 py-3 rounded-full font-semibold text-base text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "oklch(0.35 0.12 148)" }}
              data-ocid="blog.view_all_button"
            >
              View All Posts →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function BlogDetailSkeleton() {
  return (
    <div
      className="max-w-3xl mx-auto px-6 py-16 space-y-6 animate-pulse"
      data-ocid="blog.loading_state"
    >
      <div className="h-64 bg-muted rounded-2xl" />
      <div className="h-8 bg-muted rounded w-2/3" />
      <div className="h-4 bg-muted rounded w-1/4" />
      <div className="space-y-3 mt-6">
        {["90%", "75%", "85%", "70%", "95%", "80%", "65%", "88%"].map((w) => (
          <div key={w} className="h-4 bg-muted rounded" style={{ width: w }} />
        ))}
      </div>
    </div>
  );
}

function BlogDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const onBack = () => navigate("/blog");
  const { post, loading, error } = usePostBySlug(slug);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (post?.title?.rendered) {
      document.title = `${stripHtml(post.title.rendered)} | Praful Patel`;
    } else {
      document.title = "Blog | Praful Patel";
    }
    return () => {
      document.title = "Praful Patel | WordPress & Full-Stack Developer";
    };
  }, [post?.title?.rendered]);

  useEffect(() => {
    if (contentRef.current && post?.content?.rendered) {
      contentRef.current.innerHTML = post.content.rendered;
    }
  }, [post?.content?.rendered]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 pt-8 pb-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline mb-6"
          data-ocid="blog.secondary_button"
        >
          ← Back to Blog
        </button>
      </div>

      {loading && <BlogDetailSkeleton />}

      {error && (
        <div
          className="flex flex-col items-center gap-4 py-24 text-muted-foreground"
          data-ocid="blog.error_state"
        >
          <WordPressIcon className="w-12 h-12 opacity-40" />
          <p className="text-lg">
            Could not load this post. Please try again later.
          </p>
          <button
            type="button"
            onClick={onBack}
            className="text-primary font-semibold hover:underline"
            data-ocid="blog.secondary_button"
          >
            ← Back to Blog
          </button>
        </div>
      )}

      {!loading && !error && post && (
        <motion.article
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-3xl mx-auto px-6 pb-20"
        >
          {post._embedded?.["wp:featuredmedia"]?.[0]?.source_url && (
            <div className="rounded-2xl overflow-hidden mb-8 aspect-video">
              <img
                src={post._embedded["wp:featuredmedia"][0].source_url}
                alt={
                  post._embedded["wp:featuredmedia"][0].alt_text ??
                  stripHtml(post.title.rendered)
                }
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex flex-wrap gap-2 mb-4">
            {post._embedded?.["wp:term"]?.[0]?.map((term) => (
              <span
                key={term.id}
                className="text-xs font-bold uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full"
              >
                {term.name}
              </span>
            ))}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 leading-tight">
            {stripHtml(post.title.rendered)}
          </h1>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-10 pb-6 border-b border-border">
            <span>{formatDate(post.date)}</span>
            <span>·</span>
            <span>{readingTime(post.content.rendered)} min read</span>
          </div>

          <div className="wp-content" ref={contentRef} />
        </motion.article>
      )}
    </div>
  );
}

// ─── Brand Icons (SimpleIcons CDN) ─────────────────────────────────────────

function WordPressIcon({ className = "w-10 h-10" }: { className?: string }) {
  const isWhite = className?.includes("text-white");
  const color = isWhite ? "ffffff" : "21759B";
  return (
    <img
      src={`https://cdn.simpleicons.org/wordpress/${color}`}
      alt="WordPress"
      className={className?.replace("text-white", "")}
    />
  );
}

function WooCommerceIcon({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <img
      src="https://cdn.jsdelivr.net/gh/devicons/devicon@v2.16.0/icons/woocommerce/woocommerce-original.svg"
      alt="WooCommerce"
      className={className}
    />
  );
}

function ShopifyIcon({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <img
      src="https://cdn.jsdelivr.net/gh/devicons/devicon@v2.16.0/icons/shopify/shopify-original.svg"
      alt="Shopify"
      className={className}
    />
  );
}

function TailwindIcon({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <img
      src="https://cdn.simpleicons.org/tailwindcss/06B6D4"
      alt="Tailwind CSS"
      className={className}
    />
  );
}

function ReactIcon({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <img
      src="https://cdn.jsdelivr.net/gh/devicons/devicon@v2.16.0/icons/react/react-original.svg"
      alt="React.js"
      className={className}
    />
  );
}

function AutomationIcon({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <img
      src="https://cdn.simpleicons.org/n8n/EA4B71"
      alt="N8N Automation"
      className={className}
    />
  );
}

function CmsIcon({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <img
      src="https://cdn.simpleicons.org/contentstack/5B5FC7"
      alt="ContentStack CMS"
      className={className}
    />
  );
}

function DevOpsIcon({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <img
      src="https://cdn.simpleicons.org/cpanel/FF6C2C"
      alt="DevOps & Hosting"
      className={className}
    />
  );
}

function GitHubIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5"
    >
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5"
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5"
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162S8.597 18.163 12 18.163s6.162-2.759 6.162-6.162S15.403 5.838 12 5.838zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-6 h-6"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-6 h-6"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface SkillCard {
  icon: React.ReactNode;
  name: string;
  description: string;
  color: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const skills: SkillCard[] = [
  {
    icon: <WordPressIcon />,
    name: "WordPress Development",
    description:
      "Expert in theme and plugin development, custom post types, and WooCommerce. Builds performant, scalable WordPress solutions tailored to client requirements using PHP, JavaScript, and WordPress APIs.",
    color: "#2d6a4f",
  },
  {
    icon: <WooCommerceIcon />,
    name: "WooCommerce & eCommerce",
    description:
      "Specializes in WooCommerce store setup, product catalog exports, payment gateway integrations, and store performance optimization. Delivers full-featured online shopping experiences.",
    color: "#b5860d",
  },
  {
    icon: <ShopifyIcon />,
    name: "Shopify & Wix",
    description:
      "Builds and customizes Shopify stores with theme development and app integrations. Also creates polished Wix websites for businesses seeking drag-and-drop simplicity with professional results.",
    color: "#40916c",
  },
  {
    icon: <TailwindIcon />,
    name: "HTML / CSS Frameworks",
    description:
      "Proficient in Tailwind CSS, Bootstrap, and custom CSS architectures. Crafts pixel-perfect, fully responsive layouts with clean, maintainable markup and modern design systems.",
    color: "#52b788",
  },
  {
    icon: <ReactIcon />,
    name: "React.js & Next.js",
    description:
      "Develops dynamic UIs with React and server-rendered apps using Next.js SSR/SSG. Brings modern JavaScript best practices, component architecture, and performance optimization to every project.",
    color: "#c9a227",
  },
  {
    icon: <AutomationIcon />,
    name: "AI & Automation",
    description:
      "Builds intelligent automation workflows using GoHighLevel CRM, N8N, Make (Integromat), and custom webhooks. Integrates Monday.com for project management and streamlines repetitive business processes.",
    color: "#b5860d",
  },
  {
    icon: <CmsIcon />,
    name: "Headless CMS",
    description:
      "Architects headless solutions with ContentStack paired with React.js and Next.js frontends. Delivers API-first content management with blazing fast delivery and flexible presentation layers.",
    color: "#2d6a4f",
  },
  {
    icon: <DevOpsIcon />,
    name: "DevOps & Hosting",
    description:
      "Manages cPanel, cloud servers, and Manage WP environments. Handles email hosting, website monitoring, DNS management, and deployment pipelines to keep sites fast, secure, and always online.",
    color: "#40916c",
  },
];

// ─── Components ───────────────────────────────────────────────────────────────

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Home", href: "#home" },
    { label: "About", href: "#about" },
    { label: "Achievements", href: "#achievements" },
    { label: "Skills", href: "#skills" },
    { label: "Tech Stack", href: "#tech-stack" },
    { label: "Blog", href: "#blog", isBlog: true },
    { label: "Contact", href: "#contact" },
  ];

  const handleNavClick = (href: string) => {
    setMenuOpen(false);
    setTimeout(() => {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 300);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-primary transition-all duration-300 ${
        scrolled ? "shadow-lg" : ""
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Brand */}
        {isHomePage ? (
          <button
            type="button"
            onClick={() => handleNavClick("#home")}
            className="flex flex-col leading-none"
            data-ocid="nav.link"
          >
            <span className="text-xs font-semibold tracking-[0.2em] text-white/60 uppercase">
              Praful
            </span>
            <span className="text-lg font-bold tracking-[0.15em] text-white uppercase">
              Patel
            </span>
          </button>
        ) : (
          <Link
            to="/"
            className="flex flex-col leading-none"
            data-ocid="nav.link"
          >
            <span className="text-xs font-semibold tracking-[0.2em] text-white/60 uppercase">
              Praful
            </span>
            <span className="text-lg font-bold tracking-[0.15em] text-white uppercase">
              Patel
            </span>
          </Link>
        )}

        {/* Desktop nav */}
        <nav
          className="hidden md:flex items-center gap-8"
          aria-label="Main navigation"
        >
          {navLinks.map((link) =>
            link.isBlog ? (
              isHomePage ? (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(link.href);
                  }}
                  className="text-sm font-medium text-white/80 hover:text-white transition-colors"
                  data-ocid="nav.link"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  to="/blog"
                  className="text-sm font-medium text-white/80 hover:text-white transition-colors"
                  data-ocid="nav.link"
                >
                  {link.label}
                </Link>
              )
            ) : (
              <a
                key={link.label}
                href={isHomePage ? link.href : `/${link.href}`}
                onClick={(e) => {
                  if (isHomePage) {
                    e.preventDefault();
                    handleNavClick(link.href);
                  }
                }}
                className="text-sm font-medium text-white/80 hover:text-white transition-colors"
                data-ocid="nav.link"
              >
                {link.label}
              </a>
            ),
          )}
          <a
            href="/resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-white border border-white/40 hover:border-white hover:bg-white/10 px-5 py-2 rounded-full transition-all"
            data-ocid="nav.primary_button"
          >
            View Resume
          </a>
        </nav>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="md:hidden text-white p-1"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
          data-ocid="nav.toggle"
        >
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden overflow-hidden"
            style={{ backgroundColor: "oklch(0.28 0.10 148)" }}
          >
            <nav className="flex flex-col px-6 py-4 gap-4">
              {navLinks.map((link) =>
                link.isBlog ? (
                  isHomePage ? (
                    <a
                      key={link.label}
                      href={link.href}
                      onClick={(e) => {
                        e.preventDefault();
                        handleNavClick(link.href);
                      }}
                      className="text-sm font-medium text-white/80 hover:text-white py-2 transition-colors"
                      data-ocid="nav.link"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      key={link.label}
                      to="/blog"
                      onClick={() => setMenuOpen(false)}
                      className="text-sm font-medium text-white/80 hover:text-white py-2 transition-colors"
                      data-ocid="nav.link"
                    >
                      {link.label}
                    </Link>
                  )
                ) : (
                  <a
                    key={link.label}
                    href={isHomePage ? link.href : `/${link.href}`}
                    onClick={(e) => {
                      if (isHomePage) {
                        e.preventDefault();
                        handleNavClick(link.href);
                      } else {
                        setMenuOpen(false);
                      }
                    }}
                    className="text-sm font-medium text-white/80 hover:text-white py-2 transition-colors"
                    data-ocid="nav.link"
                  >
                    {link.label}
                  </a>
                ),
              )}
              <a
                href="/resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-white border border-white/40 px-5 py-2 rounded-full text-center mt-1"
                data-ocid="nav.primary_button"
              >
                View Resume
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function HeroSection() {
  const { data: heroData } = useWPPage(WP_PAGE_IDS.hero);
  const cyclingTitles = [
    "WordPress Expert",
    "React Developer",
    "Full-Stack Developer",
    "AI Automation Builder",
  ];
  const [cyclingTitleIndex, setCyclingTitleIndex] = useState(0);
  const cyclingTitle = cyclingTitles[cyclingTitleIndex];
  useEffect(() => {
    const interval = setInterval(() => {
      setCyclingTitleIndex((prev) => (prev + 1) % cyclingTitles.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);
  return (
    <section id="home" className="pt-28 pb-20 md:pt-36 md:pb-28 bg-background">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Avatar card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex justify-center md:justify-start"
          >
            <div
              className="relative rounded-2xl overflow-hidden shadow-card"
              style={{
                width: 360,
                height: 420,
                background:
                  "linear-gradient(135deg, oklch(0.25 0.10 148) 0%, oklch(0.38 0.13 148) 50%, oklch(0.28 0.08 140) 100%)",
              }}
            >
              <div className="absolute top-8 right-8 w-24 h-24 rounded-full bg-white/10" />
              <div className="absolute bottom-12 left-6 w-16 h-16 rounded-full bg-white/[0.08]" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
                <div
                  className="rounded-full border-4 border-white/30"
                  style={{
                    width: 120,
                    height: 120,
                    background:
                      "linear-gradient(180deg, oklch(0.55 0.12 148) 0%, oklch(0.38 0.13 148) 100%)",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
                  }}
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 120 120"
                    fill="none"
                    className="w-full h-full"
                  >
                    <circle
                      cx="60"
                      cy="45"
                      r="28"
                      fill="rgba(255,255,255,0.18)"
                    />
                    <ellipse
                      cx="60"
                      cy="100"
                      rx="40"
                      ry="28"
                      fill="rgba(255,255,255,0.12)"
                    />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-white font-bold text-xl tracking-wide">
                    {acf(heroData, "hero_name", "Praful Patel")}
                  </p>
                  <p className="text-white/60 text-sm mt-1">
                    {acf(heroData, "hero_title", "Full-Stack")}{" "}
                    {acf(heroData, "hero_title_italic", "Web Developer")}
                  </p>
                </div>
              </div>
              <div className="absolute bottom-6 right-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2">
                <p className="text-white text-xs font-semibold">
                  {acf(heroData, "hero_years_experience", "8+")} Years
                  Experience
                </p>
              </div>
            </div>
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
            className="flex flex-col gap-5"
          >
            <p className="text-sm font-semibold tracking-widest text-muted-foreground uppercase">
              {acf(heroData, "hero_greeting", "👋 Hello, I'm Praful")}
            </p>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
              Hi, I'm a{" "}
              <span
                className="relative inline-block"
                style={{ minWidth: "14ch" }}
              >
                <AnimatePresence mode="wait">
                  <motion.span
                    key={cyclingTitle}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -14 }}
                    transition={{ duration: 0.38, ease: "easeInOut" }}
                    className="font-display italic"
                    style={{
                      color: "oklch(0.35 0.12 148)",
                      display: "inline-block",
                    }}
                  >
                    {cyclingTitle}
                  </motion.span>
                </AnimatePresence>
              </span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              {acf(
                heroData,
                "hero_description",
                "Building powerful digital experiences with WordPress, React, Next.js, and AI automation. From custom eCommerce stores to headless CMS architectures — I deliver end-to-end web solutions that scale.",
              )}
            </p>
            <div className="flex flex-wrap gap-4 mt-2">
              <Button
                onClick={() => {
                  document
                    .querySelector("#skills")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-8 py-3 rounded-full font-semibold text-base"
                style={{
                  backgroundColor: "oklch(0.35 0.12 148)",
                  color: "#fff",
                }}
                data-ocid="hero.primary_button"
              >
                Explore My Skills
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  document
                    .querySelector("#contact")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-8 py-3 rounded-full font-semibold text-base"
                data-ocid="hero.secondary_button"
              >
                Get in Touch
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function HighlightCard({
  icon,
  title,
  description,
  accentColor,
  delay,
}: {
  icon: string;
  title: string;
  description: string;
  accentColor: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, ease: "easeOut", delay }}
      className="rounded-2xl p-7 border-0 border-l-4 shadow-sm"
      style={{
        backgroundColor: "oklch(0.96 0.02 130)",
        borderLeftColor: accentColor,
        borderLeftWidth: "4px",
        borderStyle: "solid",
      }}
    >
      <span className="text-3xl mb-4 block">{icon}</span>
      <h3 className="text-base font-bold text-foreground mb-3">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}

function AboutSection() {
  const { data: aboutData } = useWPPage(WP_PAGE_IDS.about);
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.1 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const defaultHighlights = [
    {
      title: "Creative Digital Experiences",
      description:
        "Leads projects that integrate advanced technologies, ensuring exceptional quality while fostering a collaborative environment prioritizing user-centric design and impactful digital experiences tailored to client needs.",
      icon: "✨",
      accentColor: "oklch(0.35 0.12 148)",
    },
    {
      title: "Empowering Team Leadership",
      description:
        "With over 8 years of experience, promoting innovation and continuous learning to achieve excellence in WordPress, React, and modern web development.",
      icon: "🚀",
      accentColor: "oklch(0.45 0.10 148)",
    },
    {
      title: "User-Centric Design",
      description:
        "Advocates for user-centric design principles, enhancing UX/UI to create engaging digital experiences that resonate with users and meet the diverse needs of clients.",
      icon: "🎯",
      accentColor: "oklch(0.55 0.10 148)",
    },
    {
      title: "Cutting-Edge Technologies",
      description:
        "Integrates the latest technologies — from AI automation with N8N and Make, to headless CMS with ContentStack — delivering high-quality web solutions that stand out.",
      icon: "⚡",
      accentColor: "oklch(0.65 0.10 148)",
    },
  ];

  const defaultQuickFacts = [
    { icon: "📍", label: "Based in India" },
    { icon: "💼", label: "8+ Years Experience" },
    { icon: "🌐", label: "WordPress Community Organiser" },
    { icon: "🎤", label: "WordCamp Speaker & Organiser" },
    { icon: "🤝", label: "Available for Freelance" },
    { icon: "🌍", label: "Remote-Friendly & Global Clients" },
    { icon: "⚡", label: "Open Source Contributor" },
  ];

  const highlights = acfArray(aboutData, "about_highlights", defaultHighlights);
  const quickFacts = acfArray(
    aboutData,
    "about_quick_facts",
    defaultQuickFacts,
  );
  const aboutTagsRaw = aboutData?.acf?.about_tags;
  const dynamicTags =
    typeof aboutTagsRaw === "string" && aboutTagsRaw.trim()
      ? aboutTagsRaw
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : null;

  return (
    <section id="about" ref={ref} className="py-20 md:py-28 bg-background">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col gap-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={visible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-2">
              Who I Am
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              About Me
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-14 items-start">
            {/* Left sticky bio column */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={visible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
              className="flex flex-col gap-6 md:sticky md:top-24 md:self-start"
            >
              <p className="text-base text-muted-foreground leading-relaxed">
                {acf(
                  aboutData,
                  "about_bio_para1",
                  "Praful Patel is a seasoned Full-Stack Web Developer with over 8 years of experience, with a focus on user-centric design, fostering creativity and collaboration to deliver exceptional digital experiences across WordPress, React, Next.js, and AI automation.",
                )}
              </p>
              <p className="text-base text-muted-foreground leading-relaxed">
                {acf(
                  aboutData,
                  "about_bio_para2",
                  "Based in India, Praful has collaborated with clients across the globe — from startups to established enterprises — delivering tailored digital solutions. He is an active contributor to the WordPress community, having organised and participated in multiple WordCamp events, and is passionate about open-source development.",
                )}
              </p>

              {/* Quick Facts */}
              <div
                className="rounded-2xl p-5 border"
                style={{
                  borderColor: "oklch(0.88 0.04 130)",
                  backgroundColor: "oklch(0.96 0.02 130)",
                }}
              >
                <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-4">
                  Quick Facts
                </p>
                <ul className="flex flex-col gap-3">
                  {quickFacts.map((fact) => (
                    <li
                      key={fact.label}
                      className="flex items-center gap-3 text-sm font-medium text-foreground"
                    >
                      <span className="text-lg">{fact.icon}</span>
                      {fact.label}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-wrap gap-3 mt-1">
                {(
                  dynamicTags ?? [
                    "WordPress",
                    "PHP",
                    "WooCommerce",
                    "Shopify",
                    "Wix",
                    "React.js",
                    "Next.js",
                    "Tailwind",
                    "N8N",
                    "ContentStack",
                    "REST APIs",
                    "cPanel",
                  ]
                ).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full border"
                    style={{
                      color: "oklch(0.35 0.12 148)",
                      borderColor: "oklch(0.75 0.14 82)",
                      backgroundColor: "oklch(0.96 0.02 130)",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Right scrollable cards column */}
            <div className="flex flex-col gap-6">
              {highlights.map((h, i) => (
                <HighlightCard
                  key={h.title}
                  icon={h.icon}
                  title={h.title}
                  description={h.description}
                  accentColor={h.accentColor}
                  delay={i * 0.1}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Count-Up Hook ────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1500, enabled = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let start: number | null = null;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
      else setCount(target);
    };
    requestAnimationFrame(step);
  }, [target, duration, enabled]);

  return count;
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  value,
  suffix,
  label,
  enabled,
  delay,
}: {
  value: number;
  suffix: string;
  label: string;
  enabled: boolean;
  delay: number;
}) {
  const count = useCountUp(value, 1200, enabled);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="flex flex-col items-center gap-1 px-8 py-6 rounded-2xl"
      style={{ backgroundColor: "oklch(0.35 0.12 148)" }}
    >
      <span className="text-4xl font-bold text-white tabular-nums">
        {count}
        {suffix}
      </span>
      <span className="text-sm text-white/60 text-center font-medium">
        {label}
      </span>
    </motion.div>
  );
}

// ─── Timeline Event ───────────────────────────────────────────────────────────

interface TimelineEvent {
  role: "Organiser" | "Attendee";
  event: string;
  description: string;
}

function TimelineNode({
  item,
  index,
}: {
  item: TimelineEvent;
  index: number;
}) {
  const isOrganiser = item.role === "Organiser";
  const isLeft = index % 2 === 0;

  const cardVariants = {
    hidden: { opacity: 0, x: isLeft ? -40 : 40 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <div
      className="relative grid md:grid-cols-[1fr_auto_1fr] items-center gap-4 md:gap-0"
      data-ocid={`achievements.item.${index + 1}`}
    >
      {/* Left content (desktop: even items; mobile: always full width) */}
      <div
        className={`md:pr-10 ${
          isLeft ? "md:block" : "md:invisible"
        } hidden md:block`}
      >
        {isLeft && (
          <motion.div
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55, ease: "easeOut", delay: index * 0.1 }}
            className="ml-auto max-w-sm"
          >
            <TimelineCard item={item} isOrganiser={isOrganiser} />
          </motion.div>
        )}
      </div>

      {/* Centre dot */}
      <div className="relative flex flex-col items-center z-10">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg border-4 border-white"
          style={{
            backgroundColor: isOrganiser
              ? "oklch(0.35 0.12 148)"
              : "oklch(0.55 0.12 148)",
          }}
        >
          {isOrganiser ? (
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6 text-white"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          ) : (
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6 text-white"
            >
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          )}
        </div>
      </div>

      {/* Right content (desktop: odd items; mobile: always full width) */}
      <div className={`md:pl-10 ${!isLeft ? "md:block" : ""}`}>
        {/* Mobile: always show */}
        <div className="md:hidden">
          <motion.div
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55, ease: "easeOut", delay: index * 0.1 }}
          >
            <TimelineCard item={item} isOrganiser={isOrganiser} />
          </motion.div>
        </div>
        {/* Desktop: only odd items */}
        {!isLeft && (
          <motion.div
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55, ease: "easeOut", delay: index * 0.1 }}
            className="max-w-sm hidden md:block"
          >
            <TimelineCard item={item} isOrganiser={isOrganiser} />
          </motion.div>
        )}
      </div>
    </div>
  );
}

function TimelineCard({
  item,
  isOrganiser,
}: {
  item: TimelineEvent;
  isOrganiser: boolean;
}) {
  return (
    <div
      className="rounded-2xl p-6 border shadow-sm hover:shadow-md transition-shadow duration-300 bg-card"
      style={{
        borderColor: isOrganiser
          ? "oklch(0.75 0.14 82)"
          : "oklch(0.65 0.12 148)",
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-bold text-base text-foreground">{item.event}</h3>
        <span
          className="text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap flex-shrink-0"
          style={{
            backgroundColor: isOrganiser
              ? "oklch(0.35 0.12 148)"
              : "oklch(0.55 0.12 148)",
            color: "#fff",
          }}
        >
          {item.role}
        </span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {item.description}
      </p>
    </div>
  );
}

function AchievementsSection() {
  const { data: achievementsData } = useWPPage(WP_PAGE_IDS.achievements);
  const statsRef = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef, { once: true, amount: 0.4 });

  const defaultStats = [
    { value: 3, suffix: "+", label: "Events Organised" },
    { value: 5, suffix: "+", label: "Community Events" },
    { value: 8, suffix: "+", label: "Years in WordPress Community" },
  ];
  const stats = acfArray(achievementsData, "stats", defaultStats).map(
    (s: any) => ({
      ...s,
      value: Number(s.value),
    }),
  );

  const defaultTimeline: TimelineEvent[] = [
    {
      role: "Organiser",
      event: "WordCamp Ahmedabad 2025",
      description:
        "Led WordPress community event for 200+ developers and designers in Ahmedabad.",
    },
    {
      role: "Organiser",
      event: "Do Action Ahmedabad 2024",
      description:
        "Co-organised a full-day WordPress charity hackathon for non-profits.",
    },
    {
      role: "Organiser",
      event: "WordCamp Ahmedabad 2023",
      description:
        "Core team member for Ahmedabad's flagship annual WordPress conference.",
    },
    {
      role: "Attendee",
      event: "WordCamp Surat 2025",
      description:
        "Attended sessions on modern WordPress patterns and community networking.",
    },
    {
      role: "Attendee",
      event: "WordCamp Udaipur 2023",
      description:
        "Connected with the WordPress community at Rajasthan's first WordCamp.",
    },
  ];

  const timeline = acfArray(
    achievementsData,
    "timeline",
    defaultTimeline,
  ) as TimelineEvent[];
  const wpProfileLabel = acf(
    achievementsData,
    "wp_profile_label",
    "View WordPress.org Profile",
  );
  const sectionDesc = acf(
    achievementsData,
    "section_description",
    "Active contributor to the WordPress community — organising events, sharing knowledge, and building connections across India.",
  );

  return (
    <section
      id="achievements"
      className="py-20 md:py-28"
      style={{ backgroundColor: "oklch(0.96 0.02 130)" }}
    >
      <div className="max-w-6xl mx-auto px-6">
        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-2">
            Community &amp; Events
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Achievements &amp; Community
          </h2>
          <p className="mt-4 text-muted-foreground text-base max-w-xl mx-auto">
            {sectionDesc}
          </p>
        </motion.div>

        {/* Stats bar */}
        <div
          ref={statsRef}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16"
        >
          {stats.map((stat, i) => (
            <StatCard
              key={stat.label}
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
              enabled={statsInView}
              delay={i * 0.12}
            />
          ))}
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line (desktop only) */}
          <div
            className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2"
            style={{ backgroundColor: "oklch(0.75 0.14 82)" }}
          />

          <div className="flex flex-col gap-10">
            {timeline.map((item, i) => (
              <TimelineNode key={item.event} item={item} index={i} />
            ))}
          </div>
        </div>

        {/* WordPress.org CTA */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.55, delay: 0.2 }}
          className="mt-16"
        >
          <a
            href="https://profiles.wordpress.org/praful2111"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col sm:flex-row items-center gap-5 rounded-2xl px-8 py-7 shadow-sm hover:shadow-md transition-all duration-300 group"
            style={{ backgroundColor: "oklch(0.35 0.12 148)" }}
            data-ocid="achievements.link"
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 bg-white/10 group-hover:bg-white/20 transition-colors">
              <WordPressIcon className="w-9 h-9 text-white" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <p className="text-white font-bold text-lg">{wpProfileLabel}</p>
              <p className="text-white/60 text-sm mt-1">
                See contributions, plugins, and community activity on
                wordpress.org/prafulpatel16
              </p>
            </div>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6 text-white/40 group-hover:text-white/80 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  );
}

function SkillCardItem({ skill, index }: { skill: SkillCard; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: (index % 4) * 0.1 }}
      className="bg-card rounded-2xl p-7 shadow-card hover:shadow-card-hover transition-shadow duration-300 flex flex-col gap-4 border border-border"
      data-ocid={`skills.card.${index + 1}`}
    >
      <div
        className="w-16 h-16 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: `${skill.color}18`, color: skill.color }}
      >
        {skill.icon}
      </div>
      <h3 className="text-lg font-bold text-foreground">{skill.name}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed flex-1">
        {skill.description}
      </p>
      <button
        type="button"
        onClick={() =>
          document
            .querySelector("#contact")
            ?.scrollIntoView({ behavior: "smooth" })
        }
        className="mt-2 text-sm font-semibold transition-opacity hover:opacity-80 self-start"
        style={{ color: skill.color }}
        data-ocid={`skills.card.contact_link.${index + 1}`}
      >
        Get in Touch →
      </button>
    </motion.div>
  );
}

function SkillsSection() {
  const { data: servicesData } = useWPPage(WP_PAGE_IDS.services);

  const iconMap: Record<string, React.ReactNode> = {
    wordpress: <WordPressIcon />,
    woocommerce: <WooCommerceIcon />,
    shopify: <ShopifyIcon />,
    tailwindcss: <TailwindIcon />,
    react: <ReactIcon />,
    n8n: <AutomationIcon />,
    contentful: <CmsIcon />,
    cpanel: <DevOpsIcon />,
  };

  const dynamicServices = acfArray(servicesData, "services", skills).map(
    (s: any) => ({
      icon:
        iconMap[s.icon_slug] ??
        (s.icon_slug ? (
          <img
            src={`https://cdn.simpleicons.org/${s.icon_slug}`}
            alt={s.name}
            className="w-7 h-7"
          />
        ) : (
          <DevOpsIcon />
        )),
      name: s.name ?? "",
      description: s.description ?? "",
      color: s.color ?? "#2d6a4f",
    }),
  );

  return (
    <section id="skills" className="py-20 md:py-28 bg-background">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-2">
            What I Do
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            My Services
          </h2>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {dynamicServices.map((skill, i) => (
            <SkillCardItem key={skill.name} skill={skill} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Tech Stack Section ───────────────────────────────────────────────────────

const techCategories = [
  {
    label: "CMS & E-commerce",
    tools: [
      { name: "WordPress", slug: "wordpress", color: "21759B" },
      { name: "WooCommerce", slug: "woocommerce", color: "96588A" },
      { name: "Shopify", slug: "shopify", color: "96BF48" },
      { name: "Wix", slug: "wix", color: "FAAD4D" },
      { name: "Squarespace", slug: "squarespace", color: "000000" },
      { name: "BigCommerce", slug: "bigcommerce", color: "121118" },
      { name: "Webflow", slug: "webflow", color: "4353FF" },
      { name: "HubSpot CMS", slug: "hubspot", color: "FF7A59" },
      { name: "Strapi", slug: "strapi", color: "4945FF" },
    ],
  },
  {
    label: "Frontend",
    tools: [
      { name: "HTML5", slug: "html5", color: "E34F26" },
      {
        name: "CSS3",
        slug: null,
        color: null,
        iconUrl:
          "https://cdn.jsdelivr.net/gh/devicons/devicon@v2.16.0/icons/css3/css3-original.svg",
      },
      { name: "JavaScript", slug: "javascript", color: "F7DF1E" },
      { name: "Tailwind CSS", slug: "tailwindcss", color: "06B6D4" },
      { name: "Bootstrap", slug: "bootstrap", color: "7952B3" },
      { name: "React", slug: "react", color: "61DAFB" },
      { name: "Vue.js", slug: "vuedotjs", color: "4FC08D" },
      { name: "Next.js", slug: "nextdotjs", color: "000000" },
      { name: "TypeScript", slug: "typescript", color: "3178C6" },
    ],
  },
  {
    label: "Backend & CMS",
    tools: [
      { name: "PHP", slug: "php", color: "777BB4" },
      { name: "Node.js", slug: "nodedotjs", color: "339933" },
      { name: "ContentStack", slug: null, emoji: "🗂️", color: null },
    ],
  },
  {
    label: "AI & Automation",
    tools: [
      { name: "N8N", slug: "n8n", color: "EA4B71" },
      { name: "GoHighLevel", slug: null, emoji: "⚙️", color: null },
      { name: "Make", slug: "make", color: "6D00CC" },
      { name: "Monday.com", slug: null, color: null, emoji: "📋" },
    ],
  },
  {
    label: "Cloud",
    tools: [
      {
        name: "AWS",
        slug: null,
        color: null,
        iconUrl:
          "https://cdn.jsdelivr.net/gh/devicons/devicon@v2.16.0/icons/amazonwebservices/amazonwebservices-original-wordmark.svg",
      },
      { name: "Google Cloud", slug: "googlecloud", color: "4285F4" },
      { name: "DigitalOcean", slug: "digitalocean", color: "0080FF" },
      {
        name: "Azure",
        slug: null,
        color: null,
        iconUrl:
          "https://cdn.jsdelivr.net/gh/devicons/devicon@v2.16.0/icons/azure/azure-original.svg",
      },
    ],
  },
  {
    label: "Third-Party Integrations",
    tools: [
      {
        name: "Salesforce",
        slug: null,
        color: null,
        iconUrl:
          "https://cdn.jsdelivr.net/gh/devicons/devicon@v2.16.0/icons/salesforce/salesforce-original.svg",
      },
      { name: "HubSpot", slug: "hubspot", color: "FF7A59" },
      { name: "Zoho", slug: "zoho", color: "E42527" },
      { name: "GA4", slug: "googleanalytics", color: "E37400" },
    ],
  },
  {
    label: "DevOps & Hosting",
    tools: [
      { name: "cPanel", slug: "cpanel", color: "FF6C2C" },
      { name: "Git", slug: "git", color: "F05032" },
      { name: "Docker", slug: "docker", color: "2496ED" },
      { name: "Linux", slug: "linux", color: "FCC624" },
      { name: "Cloudflare", slug: "cloudflare", color: "F48120" },
      { name: "Kinsta", slug: "kinsta", color: "1D0C3E" },
      { name: "WP Engine", slug: "wpengine", color: "40BF7A" },
      { name: "WP VIP", slug: null, emoji: "🏢", color: null },
      { name: "ManageWP", slug: null, emoji: "🔧", color: null },
    ],
  },
];

type Tool = {
  name: string;
  slug: string | null;
  color: string | null;
  emoji?: string;
  iconUrl?: string;
};

function ToolPill({ tool }: { tool: Tool }) {
  return (
    <div className="bg-card border border-border rounded-full px-4 py-2 flex items-center gap-2 text-sm font-medium text-foreground hover:border-primary/50 hover:shadow-sm transition-all">
      {tool.iconUrl ? (
        <img
          src={tool.iconUrl}
          alt={tool.name}
          className="w-5 h-5 flex-shrink-0 object-contain"
          loading="lazy"
        />
      ) : tool.slug ? (
        <img
          src={`https://cdn.simpleicons.org/${tool.slug}/${tool.color ?? "888888"}`}
          alt={tool.name}
          className="w-5 h-5 flex-shrink-0"
          loading="lazy"
        />
      ) : (
        <span className="text-base leading-none">{tool.emoji ?? "🔧"}</span>
      )}
      <span>{tool.name}</span>
    </div>
  );
}

function TechStackSection() {
  return (
    <section id="tech-stack" className="py-20 md:py-28 bg-muted/30">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <p className="text-xs font-semibold tracking-widest text-primary uppercase mb-2">
            My Toolkit
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Tech Stack &amp; Tools I Use
          </h2>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
            A curated collection of platforms, frameworks, and tools I rely on
            to build and ship great products.
          </p>
        </motion.div>

        <div className="space-y-10">
          {techCategories.map((category, catIndex) => (
            <motion.div
              key={category.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: catIndex * 0.08 }}
            >
              <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-4">
                {category.label}
              </h3>
              <div className="flex flex-wrap gap-3">
                {category.tools.map((tool) => (
                  <ToolPill key={tool.name} tool={tool} />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactSection() {
  const { data: contactData } = useWPPage(WP_PAGE_IDS.contact);
  const { actor } = useActor();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await actor.submitContactForm(form.name, form.email, form.message);
      setSubmitted(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="contact"
      className="py-20 md:py-28"
      style={{ backgroundColor: "oklch(0.35 0.12 148)" }}
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-5 gap-14 items-start">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="md:col-span-3 flex flex-col gap-7"
          >
            <div>
              <p
                className="text-xs font-semibold tracking-widest uppercase mb-2"
                style={{ color: "oklch(0.85 0.12 82)" }}
              >
                Get in Touch
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                {acf(contactData, "contact_heading", "Let's Connect")}
              </h2>
            </div>

            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/10 border border-white/20 rounded-2xl p-8 text-center"
                data-ocid="contact.success_state"
              >
                <div className="text-4xl mb-3">✅</div>
                <h3 className="text-white font-bold text-xl mb-2">
                  Message Sent!
                </h3>
                <p className="text-white/70 text-sm">
                  Thanks for reaching out. I'll get back to you soon.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setForm({ name: "", email: "", message: "" });
                  }}
                  className="mt-5 text-sm text-white/60 hover:text-white underline transition-colors"
                >
                  Send another message
                </button>
              </motion.div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-5"
                data-ocid="contact.modal"
              >
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2">
                    <Label
                      htmlFor="contact-name"
                      className="text-sm font-medium text-white/80"
                    >
                      Name
                    </Label>
                    <Input
                      id="contact-name"
                      placeholder="Your name"
                      value={form.name}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, name: e.target.value }))
                      }
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-xl focus-visible:ring-white/40"
                      data-ocid="contact.input"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label
                      htmlFor="contact-email"
                      className="text-sm font-medium text-white/80"
                    >
                      Email
                    </Label>
                    <Input
                      id="contact-email"
                      type="email"
                      placeholder="your@email.com"
                      value={form.email}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, email: e.target.value }))
                      }
                      required
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-xl focus-visible:ring-white/40"
                      data-ocid="contact.input"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="contact-message"
                    className="text-sm font-medium text-white/80"
                  >
                    Message
                  </Label>
                  <Textarea
                    id="contact-message"
                    placeholder="Tell me about your project or just say hi..."
                    value={form.message}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, message: e.target.value }))
                    }
                    required
                    rows={5}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-xl resize-none focus-visible:ring-white/40"
                    data-ocid="contact.textarea"
                  />
                </div>

                {submitError && (
                  <motion.p
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-300 bg-red-500/10 border border-red-400/20 rounded-xl px-4 py-3"
                    data-ocid="contact.error_state"
                  >
                    ⚠️ {submitError}
                  </motion.p>
                )}

                <Button
                  type="submit"
                  disabled={submitting || !actor}
                  className="self-start px-8 py-3 rounded-full font-semibold text-base bg-white hover:bg-white/90"
                  style={{ color: "oklch(0.35 0.12 148)" }}
                  data-ocid="contact.submit_button"
                >
                  {submitting ? "Sending…" : "Send Message"}
                </Button>
              </form>
            )}
          </motion.div>

          {/* Contact details */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="md:col-span-2 flex flex-col gap-6 pt-2"
          >
            <p className="text-white/70 text-sm leading-relaxed">
              Have a project in mind or want to collaborate? I'd love to hear
              from you. Drop me a message and I'll respond within 24 hours.
            </p>

            <div className="flex flex-col gap-4 mt-2">
              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="w-5 h-5 text-white/70"
                  >
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <div>
                  <p className="text-white/50 text-xs font-medium uppercase tracking-widest mb-1">
                    Email
                  </p>
                  <a
                    href={`mailto:${acf(contactData, "contact_email", "praful2111@gmail.com")}`}
                    className="text-white font-medium text-sm hover:text-white/80 transition-colors"
                  >
                    {acf(contactData, "contact_email", "praful2111@gmail.com")}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="w-5 h-5 text-white/70"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.76a16 16 0 0 0 6.29 6.29l.95-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.73 2.02z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white/50 text-xs font-medium uppercase tracking-widest mb-1">
                    Phone
                  </p>
                  <a
                    href={`tel:${acf(contactData, "contact_phone", "+919898699824")}`}
                    className="text-white font-medium text-sm hover:text-white/80 transition-colors"
                  >
                    {acf(contactData, "contact_phone", "+91 9898699824")}
                  </a>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <a
                href="https://github.com/praful2111"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all"
                aria-label="GitHub"
                data-ocid="contact.link"
              >
                <GitHubIcon />
              </a>
              <a
                href="https://www.facebook.com/praful2111/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all"
                aria-label="Facebook"
                data-ocid="contact.link"
              >
                <FacebookIcon />
              </a>
              <a
                href="https://www.instagram.com/praful2111/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all"
                aria-label="Instagram"
                data-ocid="contact.link"
              >
                <InstagramIcon />
              </a>
              <a
                href="https://x.com/praful2111"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all"
                aria-label="X (Twitter)"
                data-ocid="contact.link"
              >
                <XIcon />
              </a>
              <a
                href="https://profiles.wordpress.org/praful2111"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all"
                aria-label="WordPress.org"
                data-ocid="contact.link"
              >
                <WordPressIcon className="w-5 h-5 text-white" />
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const year = new Date().getFullYear();
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";
  const caffeineUrl = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(hostname)}`;

  return (
    <footer
      className="py-6 border-t"
      style={{
        backgroundColor: "oklch(0.28 0.10 148)",
        borderColor: "rgba(255,255,255,0.1)",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-white/50 text-sm">
          &copy; {year} Praful Patel. Built with ❤️ using{" "}
          <a
            href={caffeineUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/70 hover:text-white transition-colors underline"
          >
            caffeine.ai
          </a>
        </p>
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/praful2111"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/50 hover:text-white transition-colors"
            aria-label="GitHub"
          >
            <GitHubIcon />
          </a>
          <a
            href="https://www.facebook.com/praful2111/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/50 hover:text-white transition-colors"
            aria-label="Facebook"
          >
            <FacebookIcon />
          </a>
          <a
            href="https://www.instagram.com/praful2111/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/50 hover:text-white transition-colors"
            aria-label="Instagram"
          >
            <InstagramIcon />
          </a>
          <a
            href="https://x.com/praful2111"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/50 hover:text-white transition-colors"
            aria-label="X (Twitter)"
          >
            <XIcon />
          </a>
          <a
            href="https://profiles.wordpress.org/praful2111"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/50 hover:text-white transition-colors"
            aria-label="WordPress.org"
          >
            <WordPressIcon className="w-5 h-5 text-white" />
          </a>
        </div>
      </div>
    </footer>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

function HomePage() {
  useEffect(() => {
    document.title = "Praful Patel | WordPress & Full-Stack Developer";
  }, []);
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <AboutSection />
        <AchievementsSection />
        <SkillsSection />
        <TechStackSection />
        <BlogSection limit={3} />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}

function BlogListingPage() {
  useEffect(() => {
    document.title = "Blog & Insights | Praful Patel";
  }, []);
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-20">
        <BlogSection />
      </main>
      <Footer />
    </div>
  );
}

function BlogDetailPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-20">
        <BlogDetail />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/blog" element={<BlogListingPage />} />
      <Route path="/blog/:slug" element={<BlogDetailPage />} />
    </Routes>
  );
}
