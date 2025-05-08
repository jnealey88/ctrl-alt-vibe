--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8
-- Dumped by pg_dump version 16.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: blog_categories; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.blog_categories (
    id integer NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.blog_categories OWNER TO neondb_owner;

--
-- Name: blog_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.blog_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.blog_categories_id_seq OWNER TO neondb_owner;

--
-- Name: blog_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.blog_categories_id_seq OWNED BY public.blog_categories.id;


--
-- Name: blog_post_tags; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.blog_post_tags (
    id integer NOT NULL,
    post_id integer,
    tag_id integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.blog_post_tags OWNER TO neondb_owner;

--
-- Name: blog_post_tags_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.blog_post_tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.blog_post_tags_id_seq OWNER TO neondb_owner;

--
-- Name: blog_post_tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.blog_post_tags_id_seq OWNED BY public.blog_post_tags.id;


--
-- Name: blog_posts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.blog_posts (
    id integer NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    content text NOT NULL,
    excerpt text,
    author_id integer,
    category_id integer,
    featured_image text,
    view_count integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    summary text,
    published boolean DEFAULT false NOT NULL,
    published_at timestamp without time zone,
    tldr text
);


ALTER TABLE public.blog_posts OWNER TO neondb_owner;

--
-- Name: blog_posts_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.blog_posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.blog_posts_id_seq OWNER TO neondb_owner;

--
-- Name: blog_posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.blog_posts_id_seq OWNED BY public.blog_posts.id;


--
-- Name: blog_tags; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.blog_tags (
    id integer NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.blog_tags OWNER TO neondb_owner;

--
-- Name: blog_tags_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.blog_tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.blog_tags_id_seq OWNER TO neondb_owner;

--
-- Name: blog_tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.blog_tags_id_seq OWNED BY public.blog_tags.id;


--
-- Name: bookmarks; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.bookmarks (
    id integer NOT NULL,
    project_id integer NOT NULL,
    user_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.bookmarks OWNER TO neondb_owner;

--
-- Name: bookmarks_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.bookmarks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bookmarks_id_seq OWNER TO neondb_owner;

--
-- Name: bookmarks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.bookmarks_id_seq OWNED BY public.bookmarks.id;


--
-- Name: coding_tools; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.coding_tools (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    category character varying(50) DEFAULT 'Other'::character varying,
    is_popular boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.coding_tools OWNER TO neondb_owner;

--
-- Name: coding_tools_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.coding_tools_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.coding_tools_id_seq OWNER TO neondb_owner;

--
-- Name: coding_tools_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.coding_tools_id_seq OWNED BY public.coding_tools.id;


--
-- Name: comment_replies; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.comment_replies (
    id integer NOT NULL,
    comment_id integer NOT NULL,
    author_id integer NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.comment_replies OWNER TO neondb_owner;

--
-- Name: comment_replies_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.comment_replies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comment_replies_id_seq OWNER TO neondb_owner;

--
-- Name: comment_replies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.comment_replies_id_seq OWNED BY public.comment_replies.id;


--
-- Name: comments; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.comments (
    id integer NOT NULL,
    project_id integer NOT NULL,
    author_id integer NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.comments OWNER TO neondb_owner;

--
-- Name: comments_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.comments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.comments_id_seq OWNER TO neondb_owner;

--
-- Name: comments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.comments_id_seq OWNED BY public.comments.id;


--
-- Name: likes; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.likes (
    id integer NOT NULL,
    project_id integer,
    comment_id integer,
    reply_id integer,
    user_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.likes OWNER TO neondb_owner;

--
-- Name: likes_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.likes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.likes_id_seq OWNER TO neondb_owner;

--
-- Name: likes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.likes_id_seq OWNED BY public.likes.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    type text NOT NULL,
    read boolean DEFAULT false NOT NULL,
    "actorId" integer,
    "projectId" integer,
    "commentId" integer,
    "replyId" integer,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notifications OWNER TO neondb_owner;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO neondb_owner;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: project_evaluations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.project_evaluations (
    id integer NOT NULL,
    project_id integer NOT NULL,
    market_fit_analysis jsonb,
    target_audience jsonb,
    fit_score integer,
    fit_score_explanation text,
    business_plan jsonb,
    value_proposition text,
    risk_assessment jsonb,
    technical_feasibility text,
    regulatory_considerations text,
    partnership_opportunities jsonb,
    competitive_landscape jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    implementation_roadmap jsonb
);


ALTER TABLE public.project_evaluations OWNER TO neondb_owner;

--
-- Name: project_evaluations_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.project_evaluations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.project_evaluations_id_seq OWNER TO neondb_owner;

--
-- Name: project_evaluations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.project_evaluations_id_seq OWNED BY public.project_evaluations.id;


--
-- Name: project_gallery; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.project_gallery (
    id integer NOT NULL,
    project_id integer NOT NULL,
    image_url text NOT NULL,
    caption text,
    display_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.project_gallery OWNER TO neondb_owner;

--
-- Name: project_gallery_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.project_gallery_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.project_gallery_id_seq OWNER TO neondb_owner;

--
-- Name: project_gallery_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.project_gallery_id_seq OWNED BY public.project_gallery.id;


--
-- Name: project_tags; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.project_tags (
    id integer NOT NULL,
    project_id integer NOT NULL,
    tag_id integer NOT NULL
);


ALTER TABLE public.project_tags OWNER TO neondb_owner;

--
-- Name: project_tags_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.project_tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.project_tags_id_seq OWNER TO neondb_owner;

--
-- Name: project_tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.project_tags_id_seq OWNED BY public.project_tags.id;


--
-- Name: project_views; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.project_views (
    id integer NOT NULL,
    project_id integer NOT NULL,
    views_count integer DEFAULT 0 NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.project_views OWNER TO neondb_owner;

--
-- Name: project_views_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.project_views_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.project_views_id_seq OWNER TO neondb_owner;

--
-- Name: project_views_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.project_views_id_seq OWNED BY public.project_views.id;


--
-- Name: projects; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.projects (
    id integer NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    long_description text,
    project_url text NOT NULL,
    image_url text NOT NULL,
    author_id integer NOT NULL,
    views_count integer DEFAULT 0 NOT NULL,
    featured boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    vibe_coding_tool text,
    shares_count integer DEFAULT 0 NOT NULL,
    is_private boolean DEFAULT false NOT NULL
);


ALTER TABLE public.projects OWNER TO neondb_owner;

--
-- Name: projects_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.projects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.projects_id_seq OWNER TO neondb_owner;

--
-- Name: projects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.projects_id_seq OWNED BY public.projects.id;


--
-- Name: session; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.session OWNER TO neondb_owner;

--
-- Name: shares; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.shares (
    id integer NOT NULL,
    project_id integer NOT NULL,
    user_id integer,
    platform text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.shares OWNER TO neondb_owner;

--
-- Name: shares_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.shares_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.shares_id_seq OWNER TO neondb_owner;

--
-- Name: shares_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.shares_id_seq OWNED BY public.shares.id;


--
-- Name: tags; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.tags (
    id integer NOT NULL,
    name character varying(50) NOT NULL
);


ALTER TABLE public.tags OWNER TO neondb_owner;

--
-- Name: tags_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tags_id_seq OWNER TO neondb_owner;

--
-- Name: tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.tags_id_seq OWNED BY public.tags.id;


--
-- Name: user_activity; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_activity (
    id integer NOT NULL,
    user_id integer NOT NULL,
    type text NOT NULL,
    target_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_activity OWNER TO neondb_owner;

--
-- Name: user_activity_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.user_activity_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_activity_id_seq OWNER TO neondb_owner;

--
-- Name: user_activity_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.user_activity_id_seq OWNED BY public.user_activity.id;


--
-- Name: user_skills; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_skills (
    id integer NOT NULL,
    user_id integer NOT NULL,
    category text NOT NULL,
    skill text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_skills OWNER TO neondb_owner;

--
-- Name: user_skills_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.user_skills_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_skills_id_seq OWNER TO neondb_owner;

--
-- Name: user_skills_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.user_skills_id_seq OWNED BY public.user_skills.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    email text NOT NULL,
    bio text,
    avatar_url text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    role text DEFAULT 'user'::text NOT NULL,
    twitter_url text,
    github_url text,
    linkedin_url text,
    website_url text
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO neondb_owner;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: blog_categories id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.blog_categories ALTER COLUMN id SET DEFAULT nextval('public.blog_categories_id_seq'::regclass);


--
-- Name: blog_post_tags id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.blog_post_tags ALTER COLUMN id SET DEFAULT nextval('public.blog_post_tags_id_seq'::regclass);


--
-- Name: blog_posts id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.blog_posts ALTER COLUMN id SET DEFAULT nextval('public.blog_posts_id_seq'::regclass);


--
-- Name: blog_tags id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.blog_tags ALTER COLUMN id SET DEFAULT nextval('public.blog_tags_id_seq'::regclass);


--
-- Name: bookmarks id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.bookmarks ALTER COLUMN id SET DEFAULT nextval('public.bookmarks_id_seq'::regclass);


--
-- Name: coding_tools id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.coding_tools ALTER COLUMN id SET DEFAULT nextval('public.coding_tools_id_seq'::regclass);


--
-- Name: comment_replies id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.comment_replies ALTER COLUMN id SET DEFAULT nextval('public.comment_replies_id_seq'::regclass);


--
-- Name: comments id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.comments ALTER COLUMN id SET DEFAULT nextval('public.comments_id_seq'::regclass);


--
-- Name: likes id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.likes ALTER COLUMN id SET DEFAULT nextval('public.likes_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: project_evaluations id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.project_evaluations ALTER COLUMN id SET DEFAULT nextval('public.project_evaluations_id_seq'::regclass);


--
-- Name: project_gallery id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.project_gallery ALTER COLUMN id SET DEFAULT nextval('public.project_gallery_id_seq'::regclass);


--
-- Name: project_tags id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.project_tags ALTER COLUMN id SET DEFAULT nextval('public.project_tags_id_seq'::regclass);


--
-- Name: project_views id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.project_views ALTER COLUMN id SET DEFAULT nextval('public.project_views_id_seq'::regclass);


--
-- Name: projects id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.projects ALTER COLUMN id SET DEFAULT nextval('public.projects_id_seq'::regclass);


--
-- Name: shares id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shares ALTER COLUMN id SET DEFAULT nextval('public.shares_id_seq'::regclass);


--
-- Name: tags id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tags ALTER COLUMN id SET DEFAULT nextval('public.tags_id_seq'::regclass);


--
-- Name: user_activity id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_activity ALTER COLUMN id SET DEFAULT nextval('public.user_activity_id_seq'::regclass);


--
-- Name: user_skills id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_skills ALTER COLUMN id SET DEFAULT nextval('public.user_skills_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: blog_categories; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.blog_categories (id, name, slug, description, created_at, updated_at) FROM stdin;
1	Community	community	\N	2025-05-03 04:21:10.76	2025-05-03 04:21:10.76
2	Vibe Coding	vibe-coding	\N	2025-05-03 16:04:12.594	2025-05-03 16:04:12.594
3	Guides	guides	\N	2025-05-04 17:44:21.462	2025-05-04 17:44:21.462
4	Ideas	ideas	\N	2025-05-04 18:42:48.572	2025-05-04 18:42:48.572
\.


--
-- Data for Name: blog_post_tags; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.blog_post_tags (id, post_id, tag_id, created_at) FROM stdin;
\.


--
-- Data for Name: blog_posts; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.blog_posts (id, title, slug, content, excerpt, author_id, category_id, featured_image, view_count, created_at, updated_at, summary, published, published_at, tldr) FROM stdin;
3	Vibe Coding Explained: A Beginner’s Guide to AI-Driven App Development	vibe-coding-explained-a-beginners-guide-to-ai-driven-app-development	<h3>What Is Vibe Coding?</h3><p>Vibe coding is a <strong>prompt-first approach</strong> to building apps.</p><p>Instead of hand-typing every loop, you:</p><ol><li>Describe the <em>vibe</em>—the mood, purpose, and constraints you want.</li><li>Let an AI coding assistant generate the first version.</li><li>Refine the output conversationally until it feels right.</li></ol><p>Think of yourself as a film director or music producer. You sketch the vision (“lo-fi pomodoro timer with pixel art and chill-hop”) and the model handles boilerplate, refactors, unit tests, and docs while you steer the creative choices.</p><h3>Why Now? The Data Behind the Trend</h3><ul><li><strong>15 million + devs already use GitHub Copilot</strong>, a 4× year-over-year jump.</li><li>Market analysts project <strong>AI coding assistants to hit $97.9 billion by 2030</strong> with a 24.8 % CAGR.</li><li>Controlled studies find tasks finish <strong>40–55 % faster</strong> with AI pairing. (GitHub and Microsoft internal benchmarks.)</li></ul><p>Speed, fresh capital, and mainstream adoption have converged, making 2025 the year vibe coding turned from hackathon gimmick to everyday craft.</p><h3>The Core Mindset Shift</h3><ol><li><strong>Intent over syntax</strong></li><li>You start with desired outcomes, not file structures.</li><li><strong>Conversation over compilation</strong></li><li>The REPL becomes chat: <em>“Add keyboard shortcuts… lighten the header… handle empty states.”</em></li><li><strong>Iteration over perfection</strong></li><li>Vibe coders ship fast rough drafts, polish in public, and rely on community feedback to level up.</li></ol><p>For beginners, this shift removes the pressure of “knowing everything before starting.” Your role is to ask good questions and recognize when the response <em>feels off</em>.</p><h3>4. A Step-by-Step Beginner Workflow</h3><h4><strong>Step 1 Draft the Vibe Statement</strong></h4><p>Spend five minutes answering three prompts:</p><ul><li><strong>Core job:</strong> What problem does the app solve?</li><li><strong>Emotional tone:</strong> How should it feel? (cozy, cyberpunk, minimal, playful)</li><li><strong>Hard constraints:</strong> Tech stack, device targets, privacy rules.</li></ul><p>Example:</p><blockquote><em>“Build a distraction-free pomodoro timer web app that feels like an 8-bit Game Boy cartridge. Pure vanilla JS, mobile-responsive, no user accounts.”</em></blockquote><h4><strong>Step 2 Kick-Start the Model</strong></h4><p>Open your AI assistant of choice (Copilot, Cursor, Replit AI, Claude Sonnet in Xcode) and paste the vibe statement.</p><p>Add a line explaining <em>why</em> you want each element; LLMs excel when they know context.</p><h4><strong>Step 3 Rapid Chat Iterations</strong></h4><p>Loop through a short cycle:</p><ol><li><strong>Preview</strong> – Run the generated code or view the diff.</li><li><strong>React</strong> – Praise what works (“love the pixel font!”) and pinpoint gaps (“timer doesn’t pause on tab switch”).</li><li><strong>Refine</strong> – Ask for a specific fix.</li><li><strong>Commit</strong> – Save small, meaningful checkpoints so rollbacks are painless.</li></ol><p>Pro tip: keep each request under three sentences. It reduces hallucinations and keeps the mental model aligned.</p><h4><strong>Step 4 Self-Review &amp; Testing</strong></h4><p>Ask the AI to:</p><ul><li>Generate unit tests for critical logic.</li><li>Perform an accessibility pass (ARIA labels, color contrast).</li><li>Explain any unfamiliar code in plain English.</li></ul><p>Then manually poke around. If you can’t break it in five minutes, merge.</p><h4><strong>Step 5 Polish &amp; Document</strong></h4><p>Request:</p><ul><li>Inline comments, a succinct README, and build/run commands.</li><li>A short “release notes” changelog.</li><li>A license (MIT or GPL) plus an attribution block for any assets.</li></ul><h4><strong>Step 6 Share on Ctrl Alt Vibe</strong></h4><p>Post screenshots, the vibe statement, a highlight reel of prompts, and a one-liner on what you learned. Community reflection is half the magic.</p><h3>Practical Prompts Every Beginner Should Try</h3><ol><li><strong>“Refactor this file for readability and add comments.”</strong></li><li><strong>“Suggest three UI color palettes that match a retro arcade aesthetic.”</strong></li><li><strong>“Write Jest tests for the timer countdown function, including an edge case when duration is 0.”</strong></li><li><strong>“Explain in two sentences why you chose setInterval over requestAnimationFrame.”</strong></li><li><strong>“Optimize the bundle for mobile performance without external build tools.”</strong></li></ol><p>Copy-paste one at a time, tweak the nouns, and watch your confidence grow.</p><h3>Choosing the Right Tools</h3><ul><li><strong>Copilot (VS Code, JetBrains, Neovim)</strong> – Great for autocompleting within traditional IDEs.</li><li><strong>Cursor AI</strong> – Chat-centric, inline diffs, solid at explaining code.</li><li><strong>Replit Ghostwriter</strong> – Cloud IDE plus instant deployment; perfect for Chromebooks.</li><li><strong>Claude Sonnet in Xcode</strong> – Early but impressive Swift refactors.</li></ul><p>If you prefer no-code surfaces, pair vibe prompts with Retool AI or Make.com to wire data sources without fiddling with auth tokens.</p><h3>Real-World Starter Projects</h3><ol><li><strong>Mood-Based Playlist Generator</strong> – Calls Spotify API, selects tracks that fit user-typed emotions.</li><li><strong>Instant Quote Card Maker</strong> – Generates social-share images from text prompts; exports PNG.</li><li><strong>Markdown to Slide Deck Converter</strong> – Takes notes, returns an HTML slide deck with CSS themes.</li><li><strong>Habit Tracker PWA</strong> – Offline-first, localStorage backend, emoji progress view.</li><li><strong>Tiny Roguelike Game</strong> – ASCII dungeon crawler rendered in canvas.</li></ol><p>Each can be completed in an evening thanks to AI scaffolding. Pick one, apply your vibe, and iterate.</p><h3>Common Pitfalls—and How to Avoid Them</h3><p><strong>Hallucinated APIs</strong></p><p>LLMs sometimes invent method names. Mitigation: ask the assistant to cite docs, then click the link yourself.</p><p><strong>“Silent” Bugs</strong></p><p>A perfectly compiling app can still misbehave at runtime. Mitigation: request test suites and run them.</p><p><strong>Cost Creep</strong></p><p>ChatGPT Plus, GPU credits, and hosting bills accumulate. Mitigation: throttle usage, cache outputs, and lean on free tiers until you validate demand.</p><p><strong>Overpromising Features</strong></p><p>Because AI makes everything <em>feel</em> easy, you might commit to shipping more than you can maintain. Mitigation: scope brutally; deliver one delightful core loop first.</p><h3>Building the Right Skill Stack</h3><p>While vibe coding lowers the barrier, two human skills still matter:</p><ol><li><strong>Prompt Craft</strong></li></ol><ul><li class="ql-indent-1">Be specific about outcomes.</li><li class="ql-indent-1">Provide examples: “Use warm oranges and browns similar to Pokémon Red start menu.”</li><li class="ql-indent-1">Narrow changes to one concept per message.</li></ul><ol><li><strong>Taste &amp; Judgment</strong></li></ol><ul><li class="ql-indent-1">Learn basic UX heuristics (contrast, hierarchy, Fitts’s Law).</li><li class="ql-indent-1">Skim language docs so you can smell bad patterns.</li><li class="ql-indent-1">Review performance budgets; AI will happily ship bloated bundles if you don’t ask otherwise.</li></ul><p>Master these and you’ll guide the model instead of following it blindly.</p><h3>Level-Up Challenges</h3><p>Ready to push beyond toy apps? Try:</p><ul><li><strong>AI-Enhanced CRUD Dashboard</strong> – Let the model scaffold CRUD endpoints, then layer AI that summarizes table trends.</li><li><strong>Voice-Driven Journal</strong> – Leverage browser speech-to-text; prompt GPT to tag sentiment automatically.</li><li><strong>“Smart” Static Site Generator</strong> – Use prompts to design themes, fill lorem ipsum with AI mad-libs, and export to Netlify in one click.</li></ul><p>Each adds a new dimension—audio, data, or content—teaching you how AI and traditional code cohabitate.</p><h3>Community Is Your Secret Weapon</h3><p>Why post your rough drafts on Ctrl Alt Vibe (or any community)?</p><ul><li><strong>Fresh eyes catch blind spots</strong>: Someone will notice your off-by-one timer bug.</li><li><strong>Prompt swaps accelerate learning</strong>: One creative nugget can shave hours off your next build.</li><li><strong>Momentum compounds</strong>: Weekly posting builds a public portfolio, attracts collab offers, and keeps you shipping.</li></ul><p>So after reading this guide, promise yourself: <em>first project lives in public.</em></p><h3>SEO Quick Wins for Your Own Vibe Projects</h3><p>Because you’re here to learn <em>and</em> get discovered:</p><ol><li><strong>Clear slug</strong> – /cozy-pomodoro-timer-ai not /v1-1234.</li><li><strong>Keyword-rich H1</strong> – Include “AI-generated,” “web app,” or “tutorial.”</li><li><strong>Alt text</strong> – Describe screenshots: “Pixel-art pomodoro timer home screen.”</li><li><strong>Readme FAQ</strong> – Answer questions you Googled while building; others will search too.</li><li><strong>Internal links</strong> – Reference related vibes you (or the community) released.</li></ol><p>Follow these basics and your projects will rank for niche queries faster than you expect.</p><h3>The Future of Vibe Coding</h3><ul><li><strong>IDE-native prompt boards</strong> where teams curate reusable vibe snippets.</li><li><strong>Multiplayer sessions</strong> letting designers and devs co-prompt in real time.</li><li><strong>Model transparency tools</strong> to show <em>why</em> the AI chose a particular pattern.</li><li><strong>Regulated attribution</strong> so you can trace a snippet back to its licensed source.</li></ul><p>Today we’re at the Atari-era of AI-powered dev. By 2030, vibe coding will feel as normal as importing a library.</p><h3>Your First 24-Hour Action Plan</h3><ol><li><strong>Tonight:</strong> Draft a vibe statement and let the AI scaffold the basics.</li><li><strong>Tomorrow morning:</strong> Polish, test, and deploy to a free host.</li><li><strong>Tomorrow afternoon:</strong> Publish on Ctrl Alt Vibe with screenshots, prompt history, and a reflection paragraph.</li><li><strong>Tomorrow evening:</strong> Leave constructive feedback on two other projects.</li><li><strong>Day two:</strong> Write a short blog or LinkedIn post summarizing what you learned.</li></ol><p>Complete that loop once and you’ll have both a shipped product and a story—powerful currency for résumés, client pitches, or simply leveling up.</p><h2>Final Thoughts</h2><p>Vibe coding isn’t about replacing programmers; it’s about <strong>re-imagining programming as dialogue.</strong></p><p>When you talk with code instead of <em>at</em> code, creativity blossoms, barriers drop, and shipping becomes a daily habit rather than a quarterly milestone.</p><p>Grab your favorite AI assistant, set a playful mood, and start vibing. Then share the journey so we can all learn along with you.</p><p>See you in the gallery,</p>	\N	8	2	/uploads/1746303754245-539227421.png	9	2025-05-03 20:23:07.719	2025-05-04 00:49:19.139	What if writing software felt more like jamming with a band than filling in a spreadsheet?”\nThat, in a sentence, is vibe coding.	t	2025-05-04 00:50:00.440312	Vibe coding is a prompt-first approach to app development that involves describing the desired mood and purpose to an AI assistant, which then generates code that is refined through conversational iterations. This method emphasizes creativity over syntax, allowing developers to rapidly prototype and iterate with AI assistance, making it accessible even for beginners. The trend is gaining traction due to the widespread adoption of AI coding tools, with projections indicating substantial growth in the market by 2030.
5	Accessibility Wins: Making Your AI-Built (Vibe Coded) Apps Inclusive from Day One	accessibility-wins-making-your-ai-built-vibe-coded-apps-inclusive-from-day-one	<p>Building apps through vibe coding—the practice of prompting an AI assistant to write the code—is exhilarating. But there's a critical piece of the puzzle that’s too often overlooked: accessibility. If your apps aren’t accessible, you're unintentionally shutting the door on a massive portion of your potential user base.</p><p>Whether your users have visual impairments, motor difficulties, cognitive differences, or rely on assistive technology, you want your apps to serve everyone equally. The good news? Accessibility isn’t a chore—it’s an opportunity. It doesn’t need to slow you down or make your codebase more complex. With smart prompting, you can build inclusivity right into your vibe-coded apps from the very first line.</p><p>In this comprehensive guide, you’ll learn exactly how to do that—transforming accessibility from an afterthought into one of your biggest competitive advantages.</p><h2>Why Accessibility Matters (And Why Now)</h2><p>Let's talk openly: accessibility can feel like one more "nice-to-have" item. But that’s a costly misconception. According to the World Health Organization, around 16% of the global population—more than 1 billion people—live with some form of disability. Ignoring accessibility cuts out millions of potential users from your apps and reduces their overall quality for everyone.</p><p>Moreover, inclusive design makes apps inherently better for all users, not just those with disabilities. Think captions on videos: originally intended for users with hearing impairments, they're now widely used by everyone in noisy environments or simply because it's easier. Accessibility is fundamentally about great user experience—universal and thoughtful design that works seamlessly for everyone.</p><p>In the AI-coding world specifically, neglecting accessibility early means multiplying your technical debt. Fixing inaccessible apps later is always more expensive than coding inclusively from day one.</p><h2>Inclusive Coding Starts with Smart Prompts</h2><p>Accessibility starts long before code hits the editor—it starts with your first AI prompt. Remember, an AI assistant will give you exactly what you ask for. If you prompt thoughtfully, inclusive design becomes effortless.</p><p>When you start a project, clarify your accessibility goals upfront. Your vibe coding prompt might look like this:</p><blockquote>“Create a sleek, responsive portfolio website using semantic HTML5 and CSS, optimized for screen readers and keyboard navigation. Use high-contrast, colorblind-friendly colors and clearly labeled interactive elements.”</blockquote><p>This single prompt now tells the AI precisely what you expect—an accessible, inclusive design from the first line of code.</p><h2>The Fundamentals: Easy Wins for Accessibility in AI App Design</h2><p>Here are foundational areas you can effortlessly tackle:</p><h3>Semantic HTML Matters</h3><p>Semantic elements are your first step toward accessible AI app design. Instead of div-spaghetti, use meaningful HTML tags like &lt;header&gt;, &lt;main&gt;, &lt;footer&gt;, and &lt;nav&gt;.</p><p><strong>Prompt Example:</strong></p><blockquote>"Generate semantic HTML markup using &lt;header&gt;, &lt;nav&gt;, &lt;main&gt;, and &lt;footer&gt; for clarity and improved screen-reader compatibility."</blockquote><p>This gives your users clear navigational cues right out of the gate.</p><h3>ARIA Labels—Simple, Yet Powerful</h3><p>ARIA (Accessible Rich Internet Applications) labels ensure that assistive technologies correctly understand your content.</p><p><strong>Prompt Example:</strong></p><blockquote>"Add appropriate ARIA labels to all interactive elements like buttons, form inputs, and links."</blockquote><p>With one prompt, your buttons are instantly clearer to all users, especially those navigating by screen readers.</p><h3>Keyboard Navigation—No Mouse Needed</h3><p>Many users rely solely on keyboard navigation. Ensuring your app functions entirely from the keyboard makes a huge difference.</p><p><strong>Prompt Example:</strong></p><blockquote>"Ensure all interactive elements—buttons, links, forms—can be accessed and operated by keyboard alone."</blockquote><p>Instantly, your AI generates a more navigable app, catering to users with motor impairments and power users alike.</p><h2>Inclusive Design Strategies for Color and Visuals</h2><p>Color choice impacts usability significantly. Roughly 8% of men and 0.5% of women globally are colorblind. High contrast and thoughtful color selection ensure readability for everyone.</p><p><strong>Prompt Example:</strong></p><blockquote>"Use a color palette optimized for contrast (minimum contrast ratio of 4.5:1), ensuring readability for users with visual impairments or colorblindness."</blockquote><p>Providing this detail from the outset keeps the UI accessible by default.</p><h2>AI Prompts for Improved User Flow and Cognitive Accessibility</h2><p>Cognitive accessibility means users understand clearly what to do, what will happen, and how to accomplish tasks.</p><h3>Simplify Language, Clarify Instructions</h3><p>Prompts should include directives to simplify language and navigation labels.</p><p><strong>Prompt Example:</strong></p><blockquote>"Generate concise, simple labels for navigation and actions. Avoid jargon and keep instructions easy to follow."</blockquote><p>This simple instruction makes your app intuitive for all cognitive levels, supporting users with learning differences or language barriers.</p><h3>Consistent Navigation Patterns</h3><p>Consistent design reduces cognitive load. Users quickly grasp your app’s structure, reducing confusion.</p><p><strong>Prompt Example:</strong></p><blockquote>"Use consistent navigation patterns and UI components. Clearly indicate current location or progress."</blockquote><p>Consistency makes every user’s experience seamless and stress-free.</p><h2>Accessibility Testing—AI Can Help Too!</h2><p>Accessibility testing ensures inclusive design actually works as intended. Your AI assistant can play a significant role here.</p><h3>Ask AI to Audit Its Own Output</h3><p>After your initial design, prompt your AI to evaluate its accessibility.</p><p><strong>Prompt Example:</strong></p><blockquote>"Review this generated markup and identify potential accessibility issues related to ARIA labels, semantics, or keyboard navigation. Provide suggestions for improvement."</blockquote><p>AI-driven accessibility audits give you immediate feedback—fixing issues before deployment.</p><h3>AI-Generated Unit Tests for Accessibility</h3><p>You can use AI to generate automated accessibility tests.</p><p><strong>Prompt Example:</strong></p><blockquote>"Write accessibility unit tests using Jest and React Testing Library to verify keyboard navigation, contrast ratios, and ARIA labeling."</blockquote><p>Now you have automated tests validating accessibility continuously, catching issues before they reach production.</p><h2>Real-World Case: Accessibility Makes Good Business Sense</h2><p>Let’s consider an example: an AI-generated app for booking appointments. Early vibe-coding prompts explicitly demanded inclusive design:</p><ul><li>High-contrast UI</li><li>Keyboard-only functionality</li><li>Semantic forms with ARIA labels</li></ul><p>Post-launch, user feedback praised the app’s ease-of-use—not just from users with disabilities but everyone. Conversion rates improved by 20%. Why? Because inclusivity universally boosts usability. By making the app easier to navigate and understand, it became appealing to more users, directly translating into increased revenue.</p><h2>Common Accessibility Pitfalls (and How to Avoid Them)</h2><p>Even with AI’s assistance, certain accessibility mistakes appear frequently. Here’s your quick troubleshooting guide:</p><ul><li><strong>Interactive elements without ARIA labels:</strong></li><li>Prompt solution: explicitly instruct ARIA labels for every interactive component.</li><li><strong>Poor color contrast:</strong></li><li>Prompt solution: request contrast ratios and colorblind-friendly palettes upfront.</li><li><strong>Navigation traps (unable to navigate by keyboard):</strong></li><li>Prompt solution: specifically mention keyboard accessibility early on.</li><li><strong>Complex or ambiguous instructions:</strong></li><li>Prompt solution: require simple, direct language.</li></ul><p>By knowing these common pitfalls, you can craft prompts to prevent them entirely.</p><h2>Inclusive Coding Practices—Going Beyond Prompts</h2><p>Vibe coding through AI certainly simplifies the process, but inclusive coding practices should extend beyond prompts.</p><ul><li><strong>Continuously educate yourself and your team</strong> about evolving accessibility standards (like WCAG).</li><li><strong>Regularly invite feedback</strong> from diverse users to understand unique challenges.</li><li><strong>Use automated accessibility scanners</strong> (like Lighthouse or Axe) frequently to maintain high standards.</li></ul><p>Accessibility isn’t a one-time checkbox; it’s a commitment to continuous improvement.</p><h2>Accessibility as a Competitive Advantage</h2><p>The internet and app markets are crowded spaces. Accessibility can distinguish your AI-built apps in significant ways:</p><ul><li><strong>Wider user base:</strong> Reach millions more users simply by accommodating diverse abilities.</li><li><strong>Enhanced brand reputation:</strong> Users notice and appreciate thoughtful, inclusive design.</li><li><strong>Better SEO and discoverability:</strong> Accessible sites often correlate with improved SEO performance, driving more traffic organically.</li></ul><p>Accessibility isn’t only the right thing to do—it’s smart business.</p><h2>Your Accessibility-First Action Plan</h2><p>Starting today, commit to these simple actions:</p><ul><li>Always include clear, detailed accessibility prompts in your vibe coding sessions.</li><li>Run automated accessibility audits regularly.</li><li>Make user feedback—especially around accessibility—integral to your process.</li></ul><p>By following this action plan, you’ll build inclusive, high-quality, AI-generated apps that delight all users, not just some.</p><h2>Wrapping Up—The Inclusive Future of AI App Design</h2><p>Accessibility isn’t just a technical or legal requirement—it’s a core part of building empathetic, user-centered software. In the era of AI-driven development, integrating accessibility into your apps from day one is easier than ever. By using thoughtful, clear, and intentional prompting, you can transform AI-built applications into inclusive, accessible experiences that resonate with everyone.</p><p>Commit to inclusive coding practice. Make accessibility your default—not your afterthought—and watch your apps thrive.</p><p>Together, we can build a more inclusive digital world—one accessible vibe-coded app at a time.</p>	\N	8	3	/uploads/1746384929277-399021656-optimized.png	11	2025-05-04 18:24:49.446	2025-05-04 18:55:33.006	Discover how to effortlessly integrate accessibility into your AI-built apps. Boost user satisfaction and inclusivity with actionable strategies for accessible AI app design and inclusive coding practices.	f	\N	The article emphasizes the importance of incorporating accessibility into AI-built apps from the start to avoid excluding a significant portion of potential users. By using smart prompts during vibe coding, developers can ensure inclusivity, which enhances user experience, improves business outcomes, and provides a competitive edge. It highlights that accessibility should be a continuous priority and not an afterthought, benefiting all users and contributing to a more inclusive digital world.
2	Vibe Coding 101: The New Way Makers Build Software with AI	vibe-coding-101-the-new-way-makers-build-software-with-ai	<h2><strong>What is it?</strong></h2><p>Vibe coding is “prompt-first” programming. Instead of hand-crafting every loop, you describe the <em>feeling</em> or outcome you want—“make a cozy pomodoro timer with pixel-art graphics”—then guide an AI assistant as it writes, refactors, and tests the code. You play creative director; the model handles the boilerplate.</p><h2>Why now?</h2><ul><li>GitHub Copilot just crossed <strong>15 million users</strong> after 4-times year-over-year growth.</li><li>Controlled studies show devs using Copilot finish tasks <strong>55 % faster</strong> than those coding solo.</li><li>Analysts expect the generative-AI-in-coding market to grow at roughly <strong>25 % CAGR through 2030</strong>.</li><li>Speed, adoption, and money are lining up—making vibe coding hard to ignore.</li></ul><h2>What makes vibe coding so addictive?</h2><ul><li><strong>Flow over syntax</strong> – You stay in a conversational groove, nudging the AI with plain-language tweaks.</li><li><strong>Lower barrier to entry</strong> – Designers and product folks can ship functional prototypes without mastering full-stack frameworks.</li><li><strong>Rapid experimentation</strong> – Test three UI styles in minutes, merge the best bits, and move on.</li><li><strong>Joy of discovery</strong> – Watching code materialize from a sentence never gets old.</li></ul><h2>A typical vibe-coding loop</h2><ol><li><strong>Intent sketch</strong> – State the vibe, core job, and any constraints (“mobile first, no external libs”).</li><li><strong>Rapid iteration</strong> – Ask for changes: <em>“Fade the header in,”</em> <em>“Add keyboard shortcuts.”</em></li><li><strong>Sanity checks</strong> – Request unit tests or have the AI identify edge cases.</li><li><strong>Polish &amp; docs</strong> – Get inline comments, a README, and accessibility fixes.</li><li><strong>Share the story</strong> – Post screenshots and the prompt trail on Ctrl Alt Vibe so others learn from (and cheer on) your journey.</li></ol><h2>Real-world things people build</h2><ul><li>One-night utilities: QR generators, bulk-file renamers, tiny Shopify helpers.</li><li>Interactive content: small web games, generative-art showcases, educational widgets.</li><li>Internal tools: data-cleanup scripts or dashboards spun up during a sprint retro.</li></ul><h2>Tools you’ll bump into</h2><p><strong>Chat-style coders</strong>: GitHub Copilot, Cursor, Replit AI, Claude Sonnet in Xcode.</p><p><strong>No/low-code wrappers</strong>: Make.com, Retool AI, Bubble plugins.</p><p><strong>Prompt libraries</strong>: PromptBase, Awesome-Prompts GitHub list.</p><p><strong>Hosting sandboxes</strong>: Vercel hobby tier, Glitch, and Ctrl Alt Vibe’s built-in previews (coming soon).</p><h2>Watch-outs as you level up</h2><ul><li><strong>Code quality drift</strong> – LLMs can hallucinate APIs; always review diffs.</li><li><strong>IP questions</strong> – Keep prompt trails and pick permissive licenses for transparency.</li><li><strong>Cost creep</strong> – GPU minutes add up; throttle usage or bring your own model key for heavy runs.</li></ul><h2>What’s next?</h2><p>Expect IDEs to treat prompts as first-class citizens, “prompt boards” where entire teams curate reusable vibe snippets, and real-time pair-prompting features that feel like multiplayer coding.</p><h2>Ready to try?</h2><ol><li>Draft a micro-idea you can finish tonight.</li><li>Open your favorite AI coder and keep iterations short.</li><li>Post it on Ctrl Alt Vibe and leave a friendly comment on someone else’s build—community is the secret fuel.</li></ol><p>Vibe coding turns programming into a conversation, and conversations get better when more voices join in. Can’t wait to see what you vibe into existence.</p>	\N	8	2	/uploads/1746290483182-486083078.png	34	2025-05-03 16:04:20.813	2025-05-03 17:15:37.011	Instead of hand-writing every loop, vibe coding means describing the feeling or outcome you want, then guiding an AI assistant as it generates the app. It’s conversational, iterative, and (when shared openly) seriously contagious.	t	2025-05-04 00:50:00.440312	Vibe coding is a new approach to software development where users describe desired outcomes, and AI assists by generating, refining, and testing the code, making it accessible to non-experts and enabling rapid experimentation. With tools like GitHub Copilot, vibe coding is gaining popularity due to its efficiency, ease of use, and the ability to quickly create prototypes and utilities. The method is set to grow as more developers and teams adopt this conversational style of coding, integrating prompts as a key component of the development process.
6	15 Fresh Inspiration Ideas for Your Next Vibe-Coded App	15-fresh-inspiration-ideas-for-your-next-vibe-coded-app	<p>Feeling stuck staring at an empty prompt? It's a common challenge in the exciting, fast-paced world of vibe coding. At Ctrl Alt Vibe, we believe creativity thrives when sparked by inspiration, community sharing, and playful experimentation. To help break your creative block and get you vibing again, here are fifteen compelling, practical, and just plain fun app ideas you can start vibe coding right now.</p><h2>Instant Gratitude Journal</h2><p>Mental wellness is an ever-growing priority, yet many people struggle to maintain gratitude practices consistently. Why not build a minimalist, AI-driven gratitude journaling app? Your vibe-coding prompts might include:</p><ul><li>Generate daily gratitude prompts.</li><li>Compile user responses into beautifully formatted digital journals.</li><li>Automate weekly reflection summaries using natural language processing.</li></ul><p>This kind of vibe-coded app could quickly become a soothing daily companion, effortlessly supporting mental health.</p><h2>Mood-Based Music Recommender</h2><p>Music is deeply personal, and finding the right soundtrack for your current mood can transform your day. A vibe-coded app could leverage APIs from streaming platforms like Spotify or Apple Music to instantly generate perfect playlists. Prompts could focus on capturing user mood via quick input and mapping those moods to curated playlists. Imagine typing, "Feeling nostalgic and calm," and instantly getting a playlist that fits your mood exactly.</p><h2>Budget-Friendly Recipe Generator</h2><p>Many of us face the daily question, "What’s for dinner?" Vibe coding can simplify this common dilemma by creating an app where users enter available ingredients, and the AI generates meal plans or recipes that minimize waste and maximize creativity. Make prompts to ensure the app generates accessible, healthy recipes with easy instructions and nutritional information.</p><h2>Personalized Workout Buddy</h2><p>Fitness tracking is a crowded app space, but an AI-powered, highly personalized workout buddy remains compelling. Vibe code an app that dynamically generates daily workouts, adapting to the user's progress and preferences. Prompts can include mobile-first design principles, intuitive user feedback systems, and AI-generated motivational messages.</p><h2>Calming Breathing Exercises App</h2><p>Anxiety relief is crucial in today’s stressful world. Imagine vibe coding a calming, minimalist app offering guided breathing exercises. Prompt your AI to include simple, easy-to-follow visualizations and audio guides that users can customize according to their preferred session length and style.</p><h2>Smart Reading List</h2><p>Readers love discovering new books but often get overwhelmed managing their reading lists. A vibe-coded app could help by intelligently organizing books, offering concise AI-generated summaries, and sending reading reminders. The prompts would emphasize UX clarity, integration with book databases like Goodreads, and personalized recommendations.</p><h2>Weekly Habit Tracker</h2><p>Building positive habits is tough, but gamification and thoughtful design can significantly boost user commitment. Vibe code a visually appealing habit tracker app, enhanced with AI-generated motivational messages. This interactive design will gently nudge users toward habit formation, rewarding consistency and celebrating milestones.</p><h2>Event Countdown Creator</h2><p>Everyone loves counting down to special events—birthdays, vacations, and milestones. With vibe coding, you can easily build a stylish app that generates customizable countdown pages. Prompt your AI to allow easy sharing on social media, personalization with themes, and intuitive date-entry interfaces.</p><h2>Random Act of Kindness Generator</h2><p>This app idea brings social good directly into daily life. Vibe code an AI-driven app that suggests small, achievable acts of kindness every day. Prompts can ensure the recommendations are context-aware, culturally sensitive, and simple enough to implement without major preparation. Users will love the daily positive inspiration.</p><h2>AI-Powered Gift Finder</h2><p>Gift shopping can be stressful—your app can transform it into a delightful experience. Vibe code an AI-powered tool that collects basic information about the recipient, including age, interests, and relationship type, and generates thoughtful gift suggestions. Prompts would ensure product recommendations are available online, budget-conscious, and culturally appropriate.</p><h2>Virtual Plant Care Assistant</h2><p>Houseplants have surged in popularity, but keeping them healthy can be a challenge. A vibe-coded app could solve this problem by generating AI-powered plant-care tips, reminders for watering, and personalized advice based on plant species and environmental factors. Prompt the AI to integrate with common plant databases for accurate advice and include fun, engaging visuals.</p><h2>Travel Packing Assistant</h2><p>Travelers often stress about packing efficiently. Create a vibe-coded app that automatically generates detailed packing lists based on destination, trip duration, weather forecasts, and planned activities. Your prompts might focus on simplicity, intuitive UI, and seamless integration with weather APIs to provide dynamic, real-time information.</p><h2>Prompt Library Organizer</h2><p>As a vibe coder, your own library of successful prompts is gold. Build a dedicated app for organizing, categorizing, and retrieving your most effective AI prompts. Prompts for this app should emphasize tagging, intuitive search, and seamless editing capabilities, making it easy to continuously refine your prompting practice.</p><h2>Quick Meditation Sessions</h2><p>Meditation apps abound, but an AI-generated meditation app offers endless customization. Vibe code an app that creates tailored guided meditations. Prompt your AI to vary session length, include soothing narration scripts, ambient soundscapes, and focus areas like relaxation, stress relief, or focus enhancement.</p><h2>Smart Reminder App</h2><p>Reminders should work with you, not just beep at you randomly. Vibe coding can deliver a reminder app that intelligently adjusts timing based on user behavior, daily routines, and even location data. AI prompts for this app would ensure privacy-focused design, intuitive UI, and subtle yet effective notifications.</p><h2>Getting Started: Making Your Vibe Coding Dreams a Reality</h2><p>Now that you have fifteen actionable, exciting ideas, the next step is choosing one and starting your vibe coding journey. Here’s a quick action plan:</p><ol><li><strong>Pick Your Idea:</strong></li><li>Go with your gut—choose something that genuinely excites you or solves a problem you experience daily.</li><li><strong>Define Your Prompt Clearly:</strong></li><li>Invest some initial time crafting a detailed prompt, clearly stating your vibe (style, mood, tone), your technical constraints (platform, framework, technology stack), and specific features.</li><li><strong>Iterate &amp; Experiment:</strong></li><li>The beauty of vibe coding is rapid experimentation. Refine prompts in short, quick cycles, continually improving outcomes.</li><li><strong>Test &amp; Improve:</strong></li><li>Ask the AI to generate tests, validate accessibility, and optimize for performance. This step ensures the app isn't just innovative but reliable and user-friendly too.</li><li><strong>Share Your Creation:</strong></li><li>Post your completed or work-in-progress apps on Ctrl Alt Vibe. The community feedback loop is essential for growth and further inspiration.</li></ol><h2>Why Community Matters in Vibe Coding</h2><p>One of the most powerful aspects of vibe coding is community. Ctrl Alt Vibe was built precisely to share, showcase, and inspire. By posting your creations, you:</p><ul><li>Get constructive, valuable feedback to improve your apps.</li><li>Inspire fellow vibe coders and receive inspiration in return.</li><li>Contribute to a knowledge base of successful prompts, helping the entire community refine their skills.</li></ul><h2>Final Thoughts: Vibe Coding as a Pathway to Creativity and Utility</h2><p>Vibe coding isn't just about productivity—it’s about expanding your creative potential, reducing friction between idea and execution, and building useful tools that genuinely improve people's daily lives. With AI assistance and clear, thoughtful prompting, you have an unprecedented capacity to bring innovative apps to life quickly and effectively.</p><p>Each of these fifteen ideas provides a strong foundation for you to dive right in. Take the leap, trust your creativity, and lean on the community at Ctrl Alt Vibe as you transform your next great idea into reality. Happy vibe coding!</p>	\N	8	4	/uploads/1746384958786-918076241-optimized.png	7	2025-05-04 18:42:51.131	2025-05-04 18:56:04.062	15 ideas to get you started on your vibe coding journey.	f	\N	The article offers 15 innovative app ideas to inspire "vibe coding," highlighting concepts such as an AI-driven gratitude journal, mood-based music recommender, and virtual plant care assistant. It emphasizes the importance of community, creativity, and rapid experimentation in developing these apps, while providing a step-by-step plan to bring ideas to life. The Ctrl Alt Vibe community is encouraged as a resource for feedback and inspiration.
1	Ctrl Alt Vibe is Live—Come Build the Community With Us ✨	ctrl-alt-vibe-is-livecome-build-the-community-with-us	<p>Have an AI-built app you’re proud of? A quirky prompt that somehow produced magic? Ctrl Alt Vibe is your new home base for <em>showing</em> rather than just telling.</p><h3>What <em>Vibe Coding</em> Means</h3><p>Vibe coding is the art of steering an AI with prompts and intuition—no hand-crafting every loop. It’s fast, playful, and wildly creative. Now it finally has a proper stage.</p><h3>Why We Built This Place</h3><ul><li><strong>Keep the magic alive</strong> – Slack threads vanish, tweets get buried, but a shared gallery lets projects inspire long after launch day.</li><li><strong>Learn in public</strong> – Seeing <em>how</em> someone coaxed an AI is as valuable as the finished app.</li><li><strong>Find your crew</strong> – Chat with makers who get the “I can’t believe that worked!” thrill.</li></ul><h3>What You Can Do <em>Right Now</em></h3><ol><li><strong>Publish a project</strong> – One-click upload with screenshots, prompt notes, and a short backstory.</li><li><strong>Explore the gallery</strong> – Browse by vibe.</li><li><strong>Give feedback &amp; kudos</strong> – Comments and emoji reactions help builders refine their next prompt.</li></ol><p><em>(Private projects, remix tools, and other goodies are on the roadmap, but today is all about sharing and conversation.)</em></p><h3>How to Get Involved This Week</h3><ul><li>Post your first vibe-coded project—no pressure, drafts welcome.</li><li>Drop a friendly comment on somebody else’s build.</li><li>Tell us what features would make sharing even easier.</li></ul><p>Let’s turn these flashes of AI creativity into an ongoing, collaborative craft. Can’t wait to see what you vibe into existence.</p><p>See you inside!</p>	\N	8	1	/uploads/1746282674375-653591747.png	14	2025-05-03 05:00:43.507	2025-05-03 17:14:57.176	Welcome Post	t	2025-05-04 00:50:00.440312	Ctrl Alt Vibe is a new platform for showcasing AI-built apps and creative prompts, focusing on "vibe coding," which relies on intuition and playful experimentation with AI. The community encourages sharing projects, providing feedback, and learning from others' experiences, aiming to create a lasting and inspiring gallery of AI creativity. Users can upload projects, explore the gallery, and engage with fellow creators to foster ongoing collaboration.
4	5 Common Mistakes When Building AI-Generated Apps—and How to Fix Them Fast	5-common-mistakes-when-building-ai-generated-appsand-how-to-fix-them-fast	<p>AI-generated apps can feel like magic—until they suddenly crash, hallucinate data, or cost five times your server budget. If you’ve ever watched your AI assistant pump out code that <em>almost</em> works, you know the thrill and the pain. The good news: most issues fall into predictable patterns you can spot early and repair quickly. Below you’ll find the five mistakes we see most often, along with practical fixes you can apply in minutes.</p><h2>Over-relying on default prompts</h2><p>When you paste a one-line request like “build a chat app,” the model fills in gaps based on its training data, not your exact needs. That leads to bloated dependencies, outdated libraries, and inconsistent style.</p><p><strong>Fast fix</strong></p><p>Write a two-sentence brief that locks in the stack, vibe, and non-negotiables before you ask for code. For example:</p><blockquote>“Create a lightweight chat widget in vanilla JavaScript, no frameworks, must stay under 60 kB compressed, and include ARIA labels for accessibility.”</blockquote><p>You’ll cut fluff, gain performance, and save refactor time later.</p><h2>Ignoring model hallucinations</h2><p>Large language models happily invent APIs, method names, or even entire NPM packages. If you copy-paste without checking, you’ll spend hours chasing “undefined” errors.</p><p><strong>Fast fix</strong></p><p>Before running the code, ask the AI to list every external call and library it referenced. Cross-check those against official docs or run npm info &lt;package&gt; to confirm they exist. Catching hallucinations at this step is far cheaper than debugging runtime crashes.</p><h2>Skipping automated tests</h2><p>Because AI can spew out hundreds of lines in seconds, it’s tempting to “trust but skim.” That’s how silent bugs make it to production.</p><p><strong>Fast fix</strong></p><p>Immediately follow a code-generation request with:</p><blockquote>“Write unit tests that cover edge cases and expected failures.”</blockquote><p>Even a basic Jest or PyTest suite will flag the most common logic errors, letting you tighten things before users ever see them.</p><h2>Forgetting performance budgets</h2><p>AI models tend to include convenience libraries—for animation, date handling, even trivial string helpers. The result: a hefty bundle that tanks load times and spikes hosting fees.</p><p><strong>Fast fix</strong></p><p>Set a hard performance budget early (e.g., 100 kB gzip or sub-100 ms server response). After each generation cycle, run Lighthouse, WebPageTest, or simple bundle-size checks. Then tell the assistant to prune unused dependencies or rewrite code in vanilla JS when you breach the limit.</p><h2>Neglecting real-world context and privacy</h2><p>AI-generated code often stores data insecurely, hard-codes tokens, or overlooks compliance rules (GDPR, CCPA). Ship that, and you risk user trust—and legal trouble.</p><p><strong>Fast fix</strong></p><p>Ask the AI explicitly:</p><blockquote>“Review the code for security, privacy, and compliance issues. Suggest safer patterns.”</blockquote><p>Then verify each recommendation. Encrypt sensitive fields, use environment variables, and add concise privacy notices up front.</p><h2>Conclusion</h2><p>Building AI-generated apps doesn’t have to be a bug hunt. By tightening your prompts, validating external calls, auto-testing, enforcing performance limits, and baking in privacy from day one, you’ll turn coding mistakes into quick wins. Keep this troubleshooting guide handy, and your next AI-assisted project will launch faster, run leaner, and keep users smiling.</p><p>Ready to put these fixes into practice? Fire up your AI assistant, apply the tips above, and share your polished results with the community. Happy coding!</p>	\N	8	3	/uploads/1746381217308-506986806.png	10	2025-05-04 17:47:26.407	2025-05-04 17:53:42.595	Building AI-generated apps is exciting but error-prone. Discover five common coding mistakes and get a quick troubleshooting guide to fix them fast. Keywords: AI-generated apps, coding mistakes, troubleshooting guide.	f	\N	AI-generated apps often face issues like crashing, data hallucination, and high costs. Common mistakes include over-relying on default prompts, ignoring model hallucinations, skipping automated tests, forgetting performance budgets, and neglecting real-world context and privacy. By tightening prompts, validating calls, setting performance limits, and ensuring security and privacy, developers can quickly fix these problems and create efficient and reliable AI applications.
8	Streamlining Your Vibe Coding Workflow: A Comprehensive Guide for AI-Driven Developers	streamlining-your-vibe-coding-workflow-a-comprehensive-guide-for-ai-driven-developers	<p>Vibe coding—driving AI to build apps with natural-language prompts—is still fresh enough that every day brings new discoveries. But behind the fun of instant scaffolds and refactors lies a workflow you can optimize. When you treat vibe coding as a craft rather than a gimmick, you’ll ship faster, learn deeper, and stay in flow longer.</p><p>This post walks you through a full vibe-coding workflow so you can:</p><ul><li>Craft prompts that yield reliable, production-ready code</li><li>Iterate confidently without losing your original vision</li><li>Integrate testing, accessibility, and performance checks</li><li>Deploy with minimal friction and maximum flexibility</li><li>Leverage community tools and patterns to accelerate every step</li></ul><p>Whether you’re a solo tinkerer or a team lead at Ctrl Alt Vibe, these practices will help you consistently turn ideas into shipped apps.</p><h2>Defining Your Project Scope Up Front</h2><p>Every great vibe-coded app starts with a clear vision. Vague prompts lead to vague code, wasted cycles, and mounting frustration. Instead of “Build me a todo app,” distill your idea into three core elements:</p><ul><li><strong>Problem Statement</strong>: What user need are you solving?</li><li><strong>Desired Vibe</strong>: Minimalist, retro-pixel, corporate, playful?</li><li><strong>Technical Constraints</strong>: Framework preferences, performance budgets, deployment targets.</li></ul><p><strong>Prompt Example:</strong></p><blockquote>“Create a mobile-first todo list web app using React. It should have a clean, minimal UI with pastel accents, localStorage persistence, keyboard shortcuts (add, complete, delete), and a 50 KB bundle size budget.”</blockquote><p>By nailing these up front, your AI assistant will scaffold precisely the structure you need, so you spend less time trimming excess and more time focusing on polish and features.</p><h2>Crafting Effective Prompts That Get It Right</h2><p>Prompt engineering is an art and a habit. Follow these principles to keep your vibe-coding sessions productive:</p><h3>Be Specific, Yet Concise</h3><ul><li><strong>✔ Good</strong>: “Generate a dark-mode toggle using CSS variables for primary and secondary colors, ensuring a 4.5:1 contrast ratio.”</li><li><strong>❌ Vague</strong>: “Make it dark mode.”</li></ul><h3>Provide Contextual Snippets</h3><p>When building on existing code, paste the relevant portion in your prompt.</p><blockquote>“Here’s my theme.css with variable definitions. Add a toggle button that switches --bg-color and --text-color.”</blockquote><p>This prevents the AI from guessing and makes responses far more accurate.</p><h3>Use Role-Based Guidance</h3><p>Priming the AI with a “persona” yields better idiomatic code.</p><blockquote>“You’re a senior front-end engineer who writes clean React hooks. Create a custom useLocalTodo hook with add, delete, and toggleComplete methods.”</blockquote><h3>Anchor with Examples</h3><p>Show a tiny code example to demonstrate style or structure.</p><pre class="ql-syntax" spellcheck="false">js\n\nCopy\n\nEdit\n// Example style for buttons\nbutton {\n  padding: 0.5rem 1rem;\n  border-radius: 0.25rem;\n}\n</pre><blockquote>“Generate a primary button with the above style and an icon slot.”</blockquote><h3>Chain Prompts for Complex Tasks</h3><p>Break big asks into sequenced steps:</p><ol><li>Scaffold project structure</li><li>Implement core feature</li><li>Write unit tests</li><li>Optimize bundle size</li></ol><p>This “step-by-step” approach keeps the AI focused and avoids timeouts or half-baked outputs.</p><h2>Iterative Refinement: The Vibe-Coding Loop</h2><p>Once you have an initial scaffold, embrace rapid iteration. Here’s a proven loop:</p><ol><li><strong>Review &amp; Run</strong></li><li> Paste or pull the AI-generated code into your editor and run it. Does it compile? Are features superficially present?</li><li><strong>Pinpoint Gaps</strong></li><li> Note missing behaviors (e.g., “toggle doesn’t persist on reload”) or style issues (“button padding is too small on mobile”).</li><li><strong>Prompt for Fixes</strong></li><li> Ask for targeted tweaks: “Modify the toggle component to save state in localStorage and rehydrate on load.”</li><li><strong>Commit Early &amp; Often</strong></li><li> Make small git commits after each successful tweak. This protects you from regressions.</li><li><strong>Automated Sanity Checks</strong></li><li> Immediately prompt for unit tests:</li></ol><blockquote>“Write Jest tests for addTodo and toggleComplete, including the edge case of empty titles.”</blockquote><ol><li>Run your test suite and address failures before proceeding.</li><li><strong>Accessibility &amp; Performance Pass</strong></li><li> Once core features work, ask:</li></ol><blockquote>“Audit this app for keyboard navigation and add ARIA labels to interactive elements.”</blockquote><blockquote> Then measure bundle size with a tool like Webpack Bundle Analyzer and optimize imports or polyfills.</blockquote><p>This loop—build, test, refine—keeps quality high while preserving vibe coding’s signature speed.</p><h2>Deployment Shortcuts</h2><p>Shipping your vibe-coded app should be as easy as writing it. Here are top deployment patterns:</p><ul><li><strong>Static Site Hosting</strong>: For pure front-end apps, platforms like Vercel and Netlify auto-deploy from GitHub. Include a simple CI configuration:</li></ul><pre class="ql-syntax" spellcheck="false">yaml\n\nCopy\n\nEdit\nname: Deploy\non: [push]\njobs:\n  deploy:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v2\n      - uses: pnpm/action-setup@v2\n        with:\n          version: 7\n      - run: pnpm install\n      - run: pnpm run build\n      - uses: netlify/actions@v1\n        with:\n          publish-dir: build\n          production-branch: main\n</pre><ul><li><strong>Serverless Functions</strong>: For dynamic features (e.g., authentication, databases), hook into AWS Lambda, Azure Functions, or Netlify Functions. Prompt your AI to scaffold the function endpoints and serverless.yml config.</li><li><strong>Containerization</strong>: If you need custom runtime or heavy dependencies, use Docker. Ask the AI:</li></ul><blockquote>“Generate a Dockerfile that installs Node 18, copies my build folder, and exposes port 3000.”</blockquote><ul><li><strong>Mobile Prototyping</strong>: Turn your PWA into an installable mobile preview with tools like PWABuilder. A quick prompt can scaffold the manifest and service worker.</li></ul><p>Above all, automate as much as possible: commit to Git, push, and watch your app go live.</p><h2>Leveraging Community Resources</h2><p>No need to reinvent the wheel every time. Tap into Ctrl Alt Vibe’s community for:</p><ul><li><strong>Prompt Repositories</strong>: Browse categorized prompt collections for common features—authentication, data fetching, charting, and more.</li><li><strong>Code Snippet Libraries</strong>: Pull UI components, hook templates, and CSS utilities contributed by fellow vibe coders.</li><li><strong>Peer Reviews</strong>: Submit your pull requests for feedback in dedicated “code review” channels.</li><li><strong>Collaboration Pods</strong>: Join small groups tackling shared mini-projects to learn by pairing prompts and merging styles.</li></ul><p>Sharing your own prompts and snippets accelerates the entire community’s progress—and often sparks serendipitous improvements to your personal workflow.</p><h2>Advanced Techniques for Seasoned Vibe Coders</h2><p>Once you’ve mastered the basic loop, level up with these practices:</p><h3>Prompt Templates and Variables</h3><p>Create plain-text templates with placeholders for variables:</p><pre class="ql-syntax" spellcheck="false">makefile\n\nCopy\n\nEdit\n# Scaffold React page\nProject: {{projectName}}\nFeatures: {{featureList}}\nStyle: {{styleVibe}}\n</pre><p>Use simple JS or an AI-prompter script to inject your variables and run the prompt. This reduces repetition and standardizes quality.</p><h3>Multi-Model Strategies</h3><p>Different tasks suit different models. For example:</p><ul><li>Use GPT-4o for high-level design and structure.</li><li>Use a code-specific model (e.g., GitHub Copilot, Claude Code) for detailed implementation.</li><li>Use a smaller LLM for quick prompts to save API costs.</li></ul><p>Switch models mid-session to play to their strengths.</p><h3>Chain-of-Thought Logging</h3><p>Save your prompt history and AI responses in a living document. This “prompt log” serves as both documentation and a personal learning journal—helpful when revisiting older projects or onboarding teammates.</p><h3>Prompt-Driven Testing</h3><p>Automate not only feature tests but integration and UI tests. Prompt your AI:</p><blockquote>“Write Cypress tests that simulate a user adding, completing, and deleting todos.”</blockquote><p>This approach embeds quality checks deeply into your vibe-coding process.</p><h2>Measuring Your Vibe Coding Success</h2><p>To know if your workflow improvements pay off, track these metrics:</p><ul><li><strong>Time to First Deploy</strong>: From blank prompt to live URL.</li><li><strong>Iterations per Feature</strong>: How many AI-tweak cycles you need for each feature.</li><li><strong>Test Coverage</strong>: Percentage of critical logic covered by unit/integration tests.</li><li><strong>Bundle Size &amp; Load Time</strong>: Post-optimization page weight and CPU startup metrics.</li><li><strong>Community Engagement</strong>: Number of shares, forks, and feedback comments on Ctrl Alt Vibe.</li></ul><p>Regularly benchmarking these KPIs helps you identify bottlenecks and celebrate victories as your velocity climbs.</p><h2>Wrapping Up</h2><p>Vibe coding transforms how we build software—but harnessing its power requires a deliberate, repeatable workflow. By defining clear scopes, engineering precise prompts, embracing rapid iteration, automating testing and deployment, and leaning into community knowledge, you’ll consistently ship high-quality, inclusive, and performant apps in record time.</p><p>Now it’s your turn. Pick a fresh idea, draft your scope prompt, and dive into your AI assistant. Share your results on Ctrl Alt Vibe, crowdsource feedback, and keep iterating. With these strategies in hand, you’re well on your way to mastering the craft of vibe coding.</p><p>Happy creating—and may your prompts always yield perfect code!</p>	\N	8	3	/uploads/1746663501110-489199893.png	2	2025-05-08 00:18:28.709	2025-05-08 00:18:43.555	Master the end-to-end vibe coding process—from crafting rock-solid prompts to deploying live apps—in a guide designed specifically for AI-powered makers. Unlock tips, tools, and best practices that let you ship creative prototypes in minutes.	f	\N	Vibe coding involves using AI to build apps with natural-language prompts, emphasizing the importance of treating it as a craft to optimize workflows. The article provides strategies for creating effective prompts, iterative refinement, testing, deployment shortcuts, and leveraging community resources to consistently produce high-quality apps. It also suggests advanced techniques for seasoned developers and metrics to measure success in vibe coding.
7	Exploring the Top Vibe Coding Platforms: Which One is Right for You?	exploring-the-top-vibe-coding-platforms-which-one-is-right-for-you	<p>If you’re diving into the exciting world of vibe coding—leveraging AI to rapidly prototype and build apps by simply describing your ideas—you're not alone. Vibe coding is revolutionizing software creation, making it more accessible, intuitive, and collaborative than ever before. With multiple platforms now entering the market, the question naturally arises: <strong>Which vibe coding platform fits your style, project goals, and workflow best?</strong></p><p>In this guide, we'll examine four popular and rapidly growing vibe coding platforms—<strong>Replit, Bolt.net, Lovable, and v0</strong>. We’ll dive deep into the strengths, drawbacks, best use cases, and unique benefits of each, so you can confidently choose the platform most aligned with your needs.</p><h2>What Exactly is Vibe Coding?</h2><p>Before jumping into specifics, let's clarify what makes vibe coding unique:</p><ul><li><strong>Conversational Development:</strong> You describe your idea to an AI in natural language.</li><li><strong>Rapid Iteration:</strong> Instant prototypes and quick edits with minimal friction.</li><li><strong>Creative Freedom:</strong> Less boilerplate, more experimentation and creativity.</li></ul><p>Now, let's look at your best vibe coding platform options:</p><h2>Replit: Versatile, Community-Powered Coding Platform</h2><p>Replit has rapidly become a favorite in the vibe coding community due to its accessibility and powerful built-in tools. It combines code editing, AI code generation (through their Ghostwriter feature), and deployment all into one seamless platform.</p><p><a href="https://Replit.com" rel="noopener noreferrer" target="_blank">Replit.com</a></p><h3>Best Use Cases:</h3><ul><li>Quick prototypes and proof-of-concepts</li><li>Educational environments and coding bootcamps</li><li>Small-scale web apps and utilities</li><li>Collaborative team projects</li></ul><h3>Pros:</h3><ul><li><strong>Ease of Use:</strong> Beginner-friendly UI and powerful AI-powered autocomplete.</li><li><strong>Integrated Deployment:</strong> Deploy your apps instantly, no configuration necessary.</li><li><strong>Strong Community:</strong> Active forums, prompt sharing, and built-in feedback tools foster collaboration and community learning.</li></ul><h3>Cons:</h3><ul><li><strong>Limited Scalability:</strong> Not the best choice for complex enterprise-level apps.</li><li><strong>Performance Restrictions:</strong> Free plans can have limited compute resources.</li></ul><h3>Bottom Line:</h3><p>Replit is perfect for rapid, interactive, and collaborative vibe coding. If you're looking for an easy entry point into vibe coding or educational use, Replit shines.</p><h2>Bolt.new: AI-Driven No-Code Powerhouse</h2><p>Bolt.new has been gaining popularity for its focus on no-code and low-code app building powered heavily by AI-driven suggestions. It offers users a highly visual experience, enabling rapid application creation without traditional programming barriers.</p><p><a href="https://Bolt.new" rel="noopener noreferrer" target="_blank">Bolt.new</a></p><h3>Best Use Cases:</h3><ul><li>Interactive websites and landing pages</li><li>Marketing sites and product showcases</li><li>MVPs and prototypes that don’t require extensive coding skills</li></ul><h3>Pros:</h3><ul><li><strong>Powerful Visual Builder:</strong> Drag-and-drop editor augmented by intuitive AI suggestions.</li><li><strong>Zero Configuration Deployment:</strong> Host sites and apps instantly.</li><li><strong>Great for Non-Technical Teams:</strong> Accessible to designers, marketers, or product managers without extensive coding experience.</li></ul><h3>Cons:</h3><ul><li><strong>Less Customization:</strong> Advanced developers may feel constrained.</li><li><strong>Limited Backend Flexibility:</strong> Not suitable for complex backend logic or data-driven apps.</li></ul><h3>Bottom Line:</h3><p>Bolt.new excels for teams that want to quickly build visually appealing, responsive, interactive experiences with minimal coding overhead. It's an excellent gateway into AI-driven app creation for non-technical roles.</p><h2>Lovable.dev: Creative Branding &amp; UI-Focused AI Builder</h2><p>Lovable is uniquely positioned in the vibe coding world with its specialization in generating creative, beautiful, and highly branded user experiences. The AI behind Lovable focuses heavily on visual identity, UI inspiration, and brand consistency.</p><p><a href="https://Lovable.dev" rel="noopener noreferrer" target="_blank">Lovable.dev</a></p><h3>Best Use Cases:</h3><ul><li>Branded marketing websites</li><li>Early-stage startups establishing brand identity</li><li>UI/UX designers seeking rapid prototyping for creative concepts</li></ul><h3>Pros:</h3><ul><li><strong>Superior UX/UI:</strong> Lovable’s AI generates polished, visually compelling interfaces.</li><li><strong>Branding Assistance:</strong> AI explicitly tailors results to align with your brand voice and visuals.</li><li><strong>Ideal for Designers:</strong> Perfect for creative professionals prioritizing aesthetics and user experience.</li></ul><h3>Cons:</h3><ul><li><strong>Limited Code Generation:</strong> Primarily UI-focused, less ideal for complex backend logic.</li><li><strong>Smaller Community:</strong> Fewer community resources compared to Replit or Bolt.net.</li></ul><h3>Bottom Line:</h3><p>Lovable is ideal for creative-focused vibe coding, particularly when aesthetics, branding, and UI/UX quality are paramount. It’s a designer’s dream vibe-coding platform.</p><h2>v0: Developer-Friendly AI-Code Platform</h2><p>v0 aims to blend traditional software development with AI-driven coding assistance. It's positioned as a developer-friendly option that augments rather than replaces traditional development workflows, helping professional coders quickly scaffold, build, and iterate apps.</p><p><a href="https://v0.dev/" rel="noopener noreferrer" target="_blank">v0.dev</a></p><h3>Best Use Cases:</h3><ul><li>Complex, production-ready applications</li><li>Backend-heavy projects requiring robust architecture</li><li>Experienced developers looking to augment traditional workflows</li></ul><h3>Pros:</h3><ul><li><strong>Advanced Code Generation:</strong> Strong AI engine tailored to experienced coders.</li><li><strong>Flexible and Customizable:</strong> Allows deep customization of generated code.</li><li><strong>Strong Backend Support:</strong> Excellent tooling for complex data structures, API integrations, and more.</li></ul><h3>Cons:</h3><ul><li><strong>Steeper Learning Curve:</strong> Requires familiarity with coding principles and architecture.</li><li><strong>Less Intuitive for Beginners:</strong> New developers might find it overwhelming compared to other options like Replit or Bolt.net.</li></ul><h3>Bottom Line:</h3><p>Choose v0 when you're building professional-grade, scalable applications, and you need powerful AI-driven augmentation alongside traditional coding workflows.</p><h2>Platform Comparison Summary:</h2><p>Let's quickly recap the strengths of each platform to help clarify your decision:</p><ul><li><strong>Replit:</strong> Ideal for beginners, rapid prototyping, collaborative and educational environments.</li><li><strong>Bolt.new:</strong> Perfect for non-technical creators, visually driven apps, and quick MVP launches.</li><li><strong>Lovable:</strong> Optimal choice for visually-rich branding, creative UI/UX prototyping, and startup branding.</li><li><strong>v0:</strong> Great for experienced developers seeking AI-assisted complex app development with strong backend support.</li></ul><h2>Choosing the Right Vibe Coding Platform for You:</h2><p>To make an informed choice, consider the following questions:</p><ul><li><strong>What’s your technical skill level?</strong> (Beginner-friendly platforms like Replit and Bolt.net vs. advanced options like v0.)</li><li><strong>How visually focused is your project?</strong> (Lovable and Bolt.net for visual appeal; Replit and v0 for functionality-driven apps.)</li><li><strong>Do you require strong backend flexibility?</strong> (v0 for backend-focused apps, Lovable or Bolt.net for frontend-focused experiences.)</li><li><strong>Do you prefer robust community support?</strong> (Replit is community-rich; Lovable and v0 are smaller but focused.)</li></ul><h2>How Ctrl Alt Vibe Fits into Your Workflow:</h2><p>No matter which platform you choose, Ctrl Alt Vibe can help you showcase your vibe-coded apps. You can share your projects easily, receive constructive feedback, and collaborate on creative concepts—making Ctrl Alt Vibe a valuable companion to any vibe coding platform.</p><h2>Final Thoughts: Embracing Your Creative Potential</h2><p>Vibe coding is transforming the landscape of software development, democratizing creativity, and empowering users from diverse backgrounds. Whether you're a seasoned developer, a designer exploring code, or a curious beginner, there's a platform designed specifically for you. Embrace the power of AI to create, experiment, and bring your ideas to life faster than ever before.</p><p>Now, choose your ideal platform, start experimenting, and share your creative adventures with the vibrant Ctrl Alt Vibe community. Happy vibe coding!</p>	\N	8	2	/uploads/1746462426241-193132030.png	15	2025-05-05 01:35:00.628	2025-05-05 16:27:14.132	ibe coding is revolutionizing software creation, making it more accessible, intuitive, and collaborative than ever before. With multiple platforms now entering the market, the question naturally arises: Which vibe coding platform fits your style, project goals, and workflow best?	f	\N	Vibe coding, which uses AI to create apps by describing ideas, is making software development more accessible and collaborative. The article reviews four vibe coding platforms—Replit, Bolt.net, Lovable, and v0—highlighting their best use cases, strengths, and limitations to help users choose the right one based on their technical skills and project needs. Each platform offers unique benefits, from Replit's community-driven environment to v0's advanced code generation for experienced developers.
\.


--
-- Data for Name: blog_tags; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.blog_tags (id, name, slug, created_at) FROM stdin;
1	beginner guide	beginner-guide	2025-05-03 20:22:56.243
2	Accessibility	accessibility	2025-05-04 18:24:46.862
\.


--
-- Data for Name: bookmarks; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.bookmarks (id, project_id, user_id, created_at) FROM stdin;
1	12	8	2025-05-03 19:41:18.476687
\.


--
-- Data for Name: coding_tools; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.coding_tools (id, name, category, is_popular, created_at) FROM stdin;
4	GitHub Copilot	Code Generation	t	2025-05-02 22:05:41.262945
5	Claude	Large Language Model	t	2025-05-02 22:05:41.262945
7	ChatGPT	Large Language Model	t	2025-05-02 22:05:41.262945
8	Bard	Large Language Model	f	2025-05-02 22:05:41.262945
9	BERT	Natural Language Processing	f	2025-05-02 22:05:41.262945
11	CodeWhisperer	Code Generation	f	2025-05-02 22:05:41.262945
12	Replit AI	Code Generation	t	2025-05-02 22:05:41.262945
13	Tabnine	Code Generation	f	2025-05-02 22:05:41.262945
14	Kite	Code Generation	f	2025-05-02 22:05:41.262945
15	StableLM	Large Language Model	f	2025-05-02 22:05:41.262945
16	OpenAI Codex	Code Generation	f	2025-05-02 22:05:41.262945
17	Magic Patterns	Code Generation	t	2025-05-02 22:11:43.78463
18	Bolt	Code Generation	t	2025-05-02 22:12:28.041118
19	Lovable	Code Generation	f	2025-05-02 22:13:09.018999
20	Cursor	Code Generation	f	2025-05-02 22:13:09.033063
\.


--
-- Data for Name: comment_replies; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.comment_replies (id, comment_id, author_id, content, created_at, updated_at) FROM stdin;
3	8	11	Thanks!  I also work in Jira all day.  I pretty much live there.  I do want to implement more things around user story creation where if it was just a statement that could be formatted into the proper statement.  We use a GPT model that's stored within our network.  Not as a fast as Gemini or Claude, but it works.  This concept can really help and perhaps validate one's story	2025-05-04 01:06:09.766021	2025-05-04 01:06:09.766021
\.


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.comments (id, project_id, author_id, content, created_at, updated_at) FROM stdin;
8	13	8	Pretty cool concept. I work in Jira all day as a PM so getting some quick feedback on user stories is great. I usually have to hit up chatgpt a few times.	2025-05-04 00:32:46.360956	2025-05-04 00:32:46.360956
\.


--
-- Data for Name: likes; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.likes (id, project_id, comment_id, reply_id, user_id, created_at) FROM stdin;
31	\N	8	\N	11	2025-05-04 01:07:06.314249
32	13	\N	\N	8	2025-05-04 01:12:57.758531
33	11	\N	\N	8	2025-05-04 23:53:47.42436
34	\N	\N	3	8	2025-05-07 04:18:48.721002
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.notifications (id, "userId", type, read, "actorId", "projectId", "commentId", "replyId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: project_evaluations; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.project_evaluations (id, project_id, market_fit_analysis, target_audience, fit_score, fit_score_explanation, business_plan, value_proposition, risk_assessment, technical_feasibility, regulatory_considerations, partnership_opportunities, competitive_landscape, created_at, updated_at, implementation_roadmap) FROM stdin;
12	12	{"strengths": ["Automates a tedious aspect of web development", "AI-powered features provide unique value proposition", "Serves both technical and non-technical website owners"], "weaknesses": ["Niche product with limited market size", "Dependency on AI technology quality and reliability", "May face challenges with complex website structures"], "demandPotential": "Moderate demand potential within the web development tools market, particularly attractive to small business owners, SEO professionals, and web developers seeking efficiency gains."}	{"demographic": "Web developers, SEO professionals, small business owners, and content marketers aged 25-45 with varying technical expertise.", "psychographic": "Efficiency-focused professionals who value automation, technical problem-solvers, digital marketers concerned with SEO performance."}	68	The AI Site Map Builder addresses a specific pain point in website management with innovative technology, but has a relatively niche audience and faces potential technical challenges with complex implementations.	{"goToMarket": "Content marketing focusing on SEO benefits; partnerships with web hosting providers; direct outreach to web development agencies; free tool distribution to build audience.", "milestones": ["Launch beta with core sitemap generation features", "Achieve 2,000 free tier users within first 3 months", "Convert 5% of free users to paid plans by month 6", "Develop and release API for third-party integrations by month 9"], "revenueModel": "SaaS subscription model with tiered pricing based on website size/complexity and feature access. Free tier for basic sitemap generation with paid tiers for advanced features."}	An AI-powered tool that automatically generates and optimizes website sitemaps, saving development time while improving SEO performance.	{"risks": [{"type": "Technical Risk", "mitigation": "Implement progressive feature rollout, extensive testing, and manual override options for edge cases.", "description": "AI analysis may struggle with highly customized or complex website structures."}, {"type": "Market Risk", "mitigation": "Expand feature set to include related SEO and website structure tools to increase regular usage.", "description": "Limited market size as sitemap generation is a periodic rather than ongoing need."}, {"type": "Competitive Risk", "mitigation": "Focus on superior AI capabilities, user experience, and integration potential with other platforms.", "description": "Existing SEO platforms may add similar AI sitemap features."}]}	Technically complex but feasible, requiring web crawling capabilities, AI for page relationship analysis, and sitemap generation following protocol standards. Modern NLP models make the AI analysis component achievable.	Minimal regulatory concerns but should address web crawling permissions, data privacy for analyzed websites, and compliance with sitemap protocols and search engine guidelines.	{"partners": ["Website hosting and CMS platforms", "SEO and digital marketing tools", "Web development agencies", "Website builders and website themes marketplaces"]}	{"competitors": [{"name": "XML-Sitemaps.com", "differentiation": "Our AI-powered analysis provides more intelligent page prioritization and relationship mapping rather than basic crawling."}, {"name": "Screaming Frog", "differentiation": "We offer a more accessible, user-friendly solution focused specifically on sitemap optimization rather than comprehensive SEO auditing."}, {"name": "Yoast SEO (WordPress)", "differentiation": "Our solution is platform-agnostic and provides more advanced AI-based structure recommendations beyond basic sitemap generation."}]}	2025-05-07 04:52:19.538674	2025-05-07 04:52:19.538674	\N
21	13	{"strengths": ["Interactive and engaging platform using role-playing simulations", "AI-powered personalized feedback for enhanced learning", "Focus on Agile methodologies, which are in high demand across industries"], "weaknesses": ["Currently in proof of concept stage, limiting immediate scalability", "Dependence on AI tools like OpenRouter API, which may pose integration challenges", "Niche market segment could limit broader appeal"], "demandPotential": "There is a significant demand for Agile training tools as more organizations adopt Agile practices for project management, which enhances the platform's potential reach."}	{"demographic": "Professionals and teams in tech and software development industries, primarily aged 25-45, with a focus on continuing education and professional development.", "psychographic": "Individuals who value continuous learning, innovation, and efficiency in workflows, and are likely to embrace new methodologies and technologies."}	80	Scenario Sprint addresses a growing need for Agile training through an innovative approach, but the niche focus and early stage of development may pose initial challenges in market penetration.	{"goToMarket": "Leverage partnerships with tech companies and Agile consulting firms, utilize content marketing and webinars to demonstrate platform value, and target online communities of Agile practitioners.", "milestones": ["Complete beta testing and gather user feedback", "Develop partnerships with Agile certification bodies", "Launch full version with enhanced features", "Expand user base to include non-traditional Agile industries"], "revenueModel": "Subscription-based model with tiered pricing for individuals and teams, offering premium features and advanced analytics for higher tiers."}	Scenario Sprint offers an innovative, AI-enhanced platform for mastering Agile methodologies through immersive role-playing simulations.	{"risks": [{"type": "Technical", "mitigation": "Implement rigorous testing and develop fallback procedures to minimize disruption.", "description": "Integration issues with AI tools like OpenRouter API could disrupt platform functionality."}, {"type": "Market", "mitigation": "Conduct market research to identify additional industries that could benefit from Agile training.", "description": "Niche focus could limit market penetration beyond tech industries."}, {"type": "Legal", "mitigation": "Ensure compliance with data protection regulations like GDPR and implement robust data security measures.", "description": "Potential data privacy concerns with handling user information."}]}	The platform leverages a modern tech stack with React, Supabase, and AI integration, which are well-suited for scalable web applications, though AI tool integration may present complexity.	The platform must adhere to data privacy laws like GDPR, especially in handling user data and AI-generated feedback.	{"partners": ["Agile Alliance", "Scrum Alliance", "Tech training platforms like Udemy or Coursera", "AI tool providers for enhanced functionality"]}	{"competitors": [{"name": "Scrum.org", "differentiation": "Scenario Sprint offers interactive simulations and AI feedback, which Scrum.org does not provide."}, {"name": "AgileCraft", "differentiation": "Focuses more on enterprise-level Agile management, while Scenario Sprint emphasizes individual and team learning."}, {"name": "Pluralsight", "differentiation": "Pluralsight offers a broad range of tech courses; Scenario Sprint's unique value is in role-playing and AI feedback for Agile."}]}	2025-05-07 16:05:21.726306	2025-05-07 16:05:21.726306	\N
25	10	{"strengths": ["Unique niche in the ice cream industry", "Personalized user experience", "Utilizes AI for flavor recommendations"], "weaknesses": ["Limited to ice cream flavors", "Potentially saturated market", "App dependency on user input"], "demandPotential": "The demand for personalized food recommendations is growing, particularly in the dessert and leisure sectors."}	{"demographic": "Tech-savvy individuals aged 15-35, with disposable income and a love for desserts", "psychographic": "Adventurous eaters who enjoy trying new flavors, tech enthusiasts interested in AI, and individuals seeking novelty experiences"}	70	There is a moderate fit due to the unique niche and growing interest in personalized experiences, but market saturation and niche focus limit broader appeal.	{"goToMarket": "Leverage social media and partnerships with ice cream brands for initial buzz, followed by influencer marketing", "milestones": ["Develop MVP with basic features", "Launch beta version with user testing", "Partnerships with local ice cream shops", "Full launch with premium features"], "revenueModel": "Freemium model with premium features, such as exclusive flavor profiles and ad-free experience"}	Discover the perfect ice cream flavor tailored to your unique taste preferences using AI-driven recommendations.	{"risks": [{"type": "Technical", "mitigation": "Continuous model training with diverse data sets and user feedback", "description": "AI model may not accurately predict user preferences"}, {"type": "Market", "mitigation": "Focus on a unique selling point, such as exclusive partnerships with popular ice cream brands", "description": "High competition from other food recommendation apps"}, {"type": "Legal", "mitigation": "Implement robust data protection measures and comply with GDPR and other relevant regulations", "description": "Data privacy concerns with user preference data"}]}	The app requires a combination of AI-driven recommendation algorithms, a user-friendly interface, and integration with databases for flavor profiles.	Compliance with data privacy laws such as GDPR is essential, particularly regarding user preference data.	{"partners": ["Local ice cream shops", "Ice cream brands", "Food bloggers", "Social media influencers"]}	{"competitors": [{"name": "TasteDive", "differentiation": "Flavor Finder focuses specifically on ice cream flavors, offering a more specialized experience."}, {"name": "Yummly", "differentiation": "Flavor Finder is specifically tailored to ice cream, providing a niche but focused service."}, {"name": "Google Recipes", "differentiation": "Flavor Finder provides personalized recommendations rather than a broad search function."}]}	2025-05-07 17:01:07.109403	2025-05-07 17:01:07.109403	\N
32	11	{"strengths": ["Community-driven platform: Fosters engagement and networking among AI developers, which creates a collaborative environment for learning and sharing.", "Professional portfolio feature: Provides developers with a personalized URL, demonstrating their AI tool proficiency to potential employers, addressing the need for showcasing modern skills.", "Project tagging and categorization: Enhances discoverability and organization of projects, helping users find relevant content and inspiration easily.", "Trending and featured projects: Highlights innovative projects, driving user engagement and increasing visibility for developers, which is key in competitive job markets.", "Community voting and feedback: Allows for peer review and improvement suggestions, which helps developers refine their skills and projects."], "weaknesses": ["Limited initial user base: Could hinder community engagement. To address, implement a targeted marketing campaign focused on AI communities and forums. Timeline: 3 months.", "Niche appeal: May not attract non-AI developers. Broaden appeal by including more general coding projects. Timeline: 6 months.", "Potential for low-quality submissions: Implement a quality control mechanism with a review process before projects go live. Timeline: 2 months.", "Lack of monetization strategy: Develop a premium model offering advanced analytics or additional profile features. Timeline: 4 months.", "Dependence on AI tool users: Diversify platform by adding features for traditional coding projects. Timeline: 5 months."], "demandPotential": "The demand for AI-assisted development skills is growing rapidly, with the global AI market expected to reach $190 billion by 2025. The platform's potential is high among developers and companies in tech hubs such as Silicon Valley, Bangalore, and Berlin. Specific customer segments include junior developers looking to showcase skills, freelancers seeking to attract clients, and tech companies scouting for AI-savvy talent."}	{"demographic": "Primarily male, aged 22-35, with a bachelor's degree or higher in computer science or related fields. Income level ranges from $50,000 to $120,000 annually. Predominantly located in tech hubs like Silicon Valley, Bangalore, and Berlin. Regular users of platforms like GitHub, Stack Overflow, and LinkedIn.", "psychographic": "Values innovation, learning, and community engagement. Interested in AI, software development, and career advancement. Pain points include lack of exposure and difficulty in showcasing AI skills. Buying behavior leans towards tools and platforms that enhance career prospects."}	78	The project scores 78 based on strong community engagement potential, a growing market for AI skills, and clear differentiation from traditional portfolio platforms. However, weaknesses such as niche appeal and monetization challenges slightly reduce the score.	{"goToMarket": "Focus on developer communities and social media platforms like Twitter and Reddit. Utilize influencer partnerships for credibility. KPIs: User sign-ups, project submissions, and engagement rates.", "milestones": ["Launch MVP with core features within 90 days.", "Achieve 1,000 active users in the first 6 months.", "Develop and launch premium features by month 9.", "Establish partnerships with at least 5 coding bootcamps within the first year."], "revenueModel": "Freemium model with premium features like advanced analytics and enhanced profile customization. Pros: Attracts a large user base. Cons: Requires significant user base to be profitable."}	Ctrl Alt Vibe bridges the gap between traditional coding portfolios and AI-driven development, empowering developers to showcase their AI expertise and connect with a community of innovators.	{"risks": [{"type": "Technical", "mitigation": "Implement cloud-based infrastructure with auto-scaling capabilities. Timeline: 6 months.", "description": "Scalability challenges as user base grows."}, {"type": "Market", "mitigation": "Focus on niche by emphasizing AI-assisted projects and community engagement. Timeline: Ongoing.", "description": "Competition from established developer platforms."}, {"type": "Financial", "mitigation": "Seek early-stage funding or partnerships to support initial growth. Timeline: 3 months.", "description": "Revenue model may not cover operational costs initially."}, {"type": "Regulatory", "mitigation": "Implement robust data protection measures and regular audits. Timeline: 4 months.", "description": "Compliance with data privacy regulations (GDPR, CCPA)."}, {"type": "Operational", "mitigation": "Develop fallback options and alternative integrations. Timeline: 5 months.", "description": "Dependence on AI tool APIs for project integration."}]}	Implementing this project with vibe coding is feasible due to the availability of AI tools like Replit AI for rapid development. Critical components include user authentication, project upload systems, and community interaction features. Proper prompts could streamline code generation for these features.	Compliance with GDPR and CCPA is essential, requiring data protection strategies like encryption and user consent management. Implement privacy policies clearly outlining data usage and protection measures. Use tools like OneTrust for compliance management.	{"partners": ["GitHub: Align for project integration and API access.", "Udacity: Collaborate on educational content and student showcases.", "LinkedIn: Explore integration for professional networking.", "Hackathons: Partner for event sponsorships and platform promotion."]}	{"competitors": [{"name": "GitHub", "differentiation": "Focus on AI-assisted project showcases and community feedback."}, {"name": "Devpost", "differentiation": "Niche emphasis on AI projects and professional portfolios."}]}	2025-05-08 01:13:49.744154	2025-05-08 01:13:49.744154	{"phases": [{"tasks": ["Develop MVP with basic project showcase features.", "Implement user authentication system.", "Establish community engagement tools like comments and likes."], "metrics": ["MVP completion", "User registration numbers"], "timeframe": "90-day horizon"}, {"tasks": ["Enhance project categorization and search features.", "Develop personalized profile URLs for users.", "Begin marketing campaign targeting developer communities."], "metrics": ["Active user growth", "Project submission rates"], "timeframe": "6-month horizon"}, {"tasks": ["Introduce premium features for revenue generation.", "Expand partnerships with educational institutions.", "Implement advanced analytics for user engagement tracking."], "metrics": ["Revenue from premium features", "Number of educational partnerships"], "timeframe": "1-year horizon"}]}
\.


--
-- Data for Name: project_gallery; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.project_gallery (id, project_id, image_url, caption, display_order, created_at) FROM stdin;
1	11	/uploads/1746215514746-26865338.png	Test gallery image	0	2025-05-06 19:07:37.091008
2	11	/uploads/1746248023073-733845283.png	Another gallery image	1	2025-05-06 19:10:18.015996
3	11	/uploads/1746282674375-653591747.png	Third gallery image	2	2025-05-06 19:10:18.015996
\.


--
-- Data for Name: project_tags; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.project_tags (id, project_id, tag_id) FROM stdin;
51	10	25
52	12	1
53	12	15
64	13	15
65	13	8
66	13	27
67	13	7
68	13	2
107	11	10
108	11	27
\.


--
-- Data for Name: project_views; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.project_views (id, project_id, views_count, month, year, created_at, updated_at) FROM stdin;
5	11	107	5	2025	2025-05-04 21:18:28.595207	2025-05-04 21:18:28.595207
3	13	60	5	2025	2025-05-04 00:02:49.098147	2025-05-04 00:02:49.098147
2	12	17	5	2025	2025-05-03 20:03:57.514919	2025-05-03 20:03:57.514919
1	10	29	5	2025	2025-05-03 19:59:55.72001	2025-05-03 19:59:55.72001
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.projects (id, title, description, long_description, project_url, image_url, author_id, views_count, featured, created_at, updated_at, vibe_coding_tool, shares_count, is_private) FROM stdin;
10	Flavor Finder	Simple app to find the perfect ice cream flavor based on your preferences.		https://project-ice-cream-flavor-finder-476.magicpatterns.app/	/uploads/1746218819582-568130496.jpg	8	105	f	2025-05-02 20:47:28.703744	2025-05-02 20:47:28.703744	Replit AI	0	f
13	Scenario Sprint: The Unfair Advantage Your Competition Doesn't See Coming	Scenario Sprint is an interactive Agile learning platform that uses role-playing simulations and AI-powered feedback to help individuals and teams master Agile methodologies.	<p>Scenario Sprint focuses on providing hands-on experience and personalized guidance, particularly in user story creation, with features for user management, and admin management.&nbsp;This is still in a proof of concept.</p><p><br></p><p>Built with Bolt.new:</p><ul><li><strong>Frontend</strong>: React with Hooks, React Router, Framer Motion</li><li><strong>Styling</strong>: Tailwind CSS, custom design system</li><li><strong>Backend</strong>: Supabase (Authentication, Database, Edge Functions)</li><li><strong>AI Integration</strong>: OpenRouter API</li><li><strong>Deployment</strong>: Netlify </li><li><strong>Other</strong>: Vite</li></ul><p><br></p>	https://scenariosprint.netlify.app/	/uploads/1746316943218-19767891.png	11	60	f	2025-05-04 00:02:48.419191	2025-05-04 00:02:48.419191	Bolt	0	f
11	Ctrl Alt Vibe	Website to show off Vibe Code Project created by vibe coding!	<p>Ctrl Alt Vibe is a community-driven platform specifically designed for developers to showcase their AI-assisted coding projects. Here's what it offers:</p><p><strong>Key Features:</strong></p><ol><li><p>Project Showcase: Developers can submit and display their projects that utilize AI tools like GitHub Copilot, Replit, Cursor, and other AI coding assistants</p></li><li><p>Community Engagement: Users can like, comment, and share projects, building connections with other AI-focused developers</p></li><li><p>Professional Portfolio: Developers get a personalized profile URL to share with employers, demonstrating their ability to leverage AI tools effectively</p></li></ol><p><strong>Target Audience:</strong></p><ul><li><p>Developers who use AI tools in their coding workflow</p></li><li><p>Companies looking to hire developers with AI expertise</p></li><li><p>Anyone interested in exploring how AI is being used in real coding projects</p></li></ul><p><strong>The platform supports various project types and includes features like:</strong></p><ul><li><p>Project tagging and categorization</p></li><li><p>Image galleries for visual documentation</p></li><li><p>Trending projects section</p></li><li><p>Featured project highlights</p></li><li><p>Community voting and feedback</p></li><li><p>Professional profile pages</p></li></ul><p>The site serves as a bridge between traditional coding portfolios and the emerging world of AI-assisted development, helping developers showcase how they're innovating with AI tools while building their professional presence.</p><p><strong>For developers looking to join, they can:</strong></p><ol><li><p>Browse existing projects for inspiration</p></li><li><p>Submit their own AI-assisted projects</p></li><li><p>Engage with other developers</p></li><li><p>Build a portfolio that highlights their AI development skills</p></li></ol><p>This platform is particularly valuable for developers who want to demonstrate their proficiency with modern AI coding tools to potential employers or clients.</p>	https://ctrlaltvibe.dev	/uploads/1746228576007-546566083.png	8	118	t	2025-05-02 23:29:54.024999	2025-05-02 23:29:54.024999	Replit AI	0	f
12	AI Site Map Builder	AI SiteMapper (Proof-of-Concept) — A vibe-coded demo that turns a plain list of pages into a fleshed-out sitemap: page goals, SEO titles, meta descriptions, section copy, CTAs, and image prompts are all drafted in seconds.	<p>AI SiteMapper shows how far “prompt-over-pixels” can go for web designers. Instead of dragging boxes in a flowchart, you simply tell the tool the vibe of the site (“B2B consultancy that converts leads”) and let the AI auto-populate:</p><ul><li><strong>Page Library</strong> — Add or reorder pages (Home, About, Services, Blog, Contact) with one click.</li><li><strong>Instant Page Goals</strong> — Each page opens with a high-level objective so writers and designers stay aligned.</li><li><strong>Built-in SEO Drafts</strong> — Titles and meta descriptions are generated on the fly, ready for quick edits.</li><li><strong>Section Blocks</strong> — Hero headings, sub-copy, body text, CTAs, and image URLs come prefilled so you can move straight to design.</li><li><strong>Export-Ready</strong> — Save, open, or export the draft sitemap for client reviews or dev hand-off.</li></ul><p>It’s purely an illustrative POC right now—no live publishing or AI re-training hooks—but it hints at a future where designers spend less time structuring pages and more time polishing the experience.</p>	https://project-ai-powered-site-mapping-tool-398.magicpatterns.app/	/uploads/1746300467660-902596664.jpg	8	26	f	2025-05-03 19:28:01.463135	2025-05-03 19:28:01.463135	Magic Patterns	0	f
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.session (sid, sess, expire) FROM stdin;
W2qo4lOU31M_ixBUZ99nsLROEvZLEp4U	{"cookie":{"originalMaxAge":604800000,"expires":"2025-05-10T16:00:55.718Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":8}}	2025-05-15 20:54:02
fKSKb6OJhwNXCN7rfhHYZ0QUZxDOwTjX	{"cookie":{"originalMaxAge":604800000,"expires":"2025-05-10T18:17:09.274Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":9}}	2025-05-10 19:25:20
Jeh4Di0cPCM4pkGR5iT3TsPatV3gjGBz	{"cookie":{"originalMaxAge":604800000,"expires":"2025-05-11T18:46:20.881Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":13}}	2025-05-11 18:56:41
35A2essuZJ8P2LZEAG0UOsF7X3ORcMrW	{"cookie":{"originalMaxAge":604800000,"expires":"2025-05-11T18:56:57.958Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":8}}	2025-05-15 22:17:02
UhSzNMCN7BoSDzmSmFpoeGujmyg0W6f4	{"cookie":{"originalMaxAge":604800000,"expires":"2025-05-15T22:14:32.154Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":8}}	2025-05-15 22:18:15
8WruKQiHIkk5d1MoTAIIEoo2xE8QBdCD	{"cookie":{"originalMaxAge":604800000,"expires":"2025-05-13T00:36:08.343Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":14}}	2025-05-14 21:28:16
as20U-wJK2dl-2WMI_emYQXg0w9WiO2t	{"cookie":{"originalMaxAge":604800000,"expires":"2025-05-11T00:40:35.494Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":12}}	2025-05-11 09:33:58
avxYOZN54A6hnmpZ4mhlCVfQkUtjzLN8	{"cookie":{"originalMaxAge":604800000,"expires":"2025-05-10T22:21:23.101Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":8}}	2025-05-15 21:15:26
stkZ1sujo8nq7cACelvAuHwae2thWxA6	{"cookie":{"originalMaxAge":604800000,"expires":"2025-05-10T23:55:05.491Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":11}}	2025-05-11 01:07:07
jB0ImfH5H8BuY74qD5vHQRIoUsLLmdF2	{"cookie":{"originalMaxAge":604800000,"expires":"2025-05-10T18:20:44.993Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":9}}	2025-05-10 18:30:12
t6mDZ75PbYLzW6EzY7OzY9yaXbFY-ZNd	{"cookie":{"originalMaxAge":604800000,"expires":"2025-05-09T22:56:32.735Z","secure":false,"httpOnly":true,"path":"/"},"passport":{"user":8}}	2025-05-14 13:47:26
elAxEh4QTHudmFOVxlkM0iALg_GdX5Tz	{"cookie":{"originalMaxAge":604800000,"expires":"2025-05-15T03:29:42.465Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":16}}	2025-05-15 03:30:03
cFrNm0nHEMfWJhIDBfXQ_uaGivn9gXq8	{"cookie":{"originalMaxAge":604800000,"expires":"2025-05-15T01:17:37.711Z","secure":true,"httpOnly":true,"path":"/"},"passport":{"user":15}}	2025-05-15 01:17:43
\.


--
-- Data for Name: shares; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.shares (id, project_id, user_id, platform, created_at) FROM stdin;
\.


--
-- Data for Name: tags; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.tags (id, name) FROM stdin;
1	AI Tools
2	Productivity
3	Code
5	Analytics
7	Education
8	Chatbots
10	Creative
12	Art
13	Development
14	Tools
15	Business
4	Data Visualization
9	GPT Models
11	Image Generation
6	Machine Learning
16	Natural Language Processing
25	Entertainment
27	Community
\.


--
-- Data for Name: user_activity; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.user_activity (id, user_id, type, target_id, created_at) FROM stdin;
1	8	project_created	10	2025-05-03 19:14:17.464928
2	8	project_created	11	2025-05-03 19:14:17.464928
3	8	project_liked	10	2025-05-03 19:14:17.464928
4	8	comment_added	7	2025-05-03 19:14:17.464928
5	8	reply_added	2	2025-05-03 19:14:17.464928
\.


--
-- Data for Name: user_skills; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.user_skills (id, user_id, category, skill, created_at) FROM stdin;
1	8	Frontend	React	2025-05-03 19:14:12.821781
2	8	Frontend	TypeScript	2025-05-03 19:14:12.821781
3	8	Frontend	CSS/SCSS	2025-05-03 19:14:12.821781
4	8	Frontend	Tailwind CSS	2025-05-03 19:14:12.821781
5	8	Backend	Node.js	2025-05-03 19:14:12.821781
6	8	Backend	Express	2025-05-03 19:14:12.821781
7	8	Backend	PostgreSQL	2025-05-03 19:14:12.821781
8	8	Backend	REST APIs	2025-05-03 19:14:12.821781
9	8	Design	UI/UX	2025-05-03 19:14:12.821781
10	8	Design	Figma	2025-05-03 19:14:12.821781
11	8	Design	Responsive Design	2025-05-03 19:14:12.821781
12	8	DevOps	Git	2025-05-03 19:14:12.821781
13	8	DevOps	Docker	2025-05-03 19:14:12.821781
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.users (id, username, password, email, bio, avatar_url, created_at, updated_at, role, twitter_url, github_url, linkedin_url, website_url) FROM stdin;
11	spencer_i_am	f22933e25c085fc34724a52dc9dc328be6bda62a4cbd57f8d4d63e397fc1b6d57d81f45ab087a19038768950610378bb8f578734e94a354bece5fa2e9300d116.a5428450012558e7eb999dd60f18f09f	spencerfrancisco@gmail.com	Just navigating these waters of vibe coding, baby.  Surfs up!	https://lh3.googleusercontent.com/a/ACg8ocKDwgSdYVv5hWB-3xd0PSGb0z_UZjaZCw28cC-ir8sMPZZaS2fv=s96-c	2025-05-03 23:54:36.019277	2025-05-03 23:55:05.42	user	\N	\N	\N	\N
12	francesco_stabilito	ea13a30ad321543b2f46cb42dd07e958ea886b491015d951321ba3e44450bec30454243a0d0b321916d72133e58cf34bc32a6dfcb581f5aab0d98ee390fff5c5.910a000442ae2be0d3f80e8aca998a19	fra.stab91@gmail.com		https://lh3.googleusercontent.com/a/ACg8ocIVWGvINGFUlLRqtT5eTjnUHDaCskDn-d-hMVhiOsh-IrvMqQQ0=s96-c	2025-05-04 00:40:35.404436	2025-05-04 00:40:35.404436	user	\N	\N	\N	\N
16	natlem_hps	9b776a9b898043225c008a904b0e8b93df2d73e849dd01aa5cf9cba66c0254c5fa8288a001449218e24c92b5e68e10484b04a99117f669a05c24e60090358032.b878c4d0d859214b68854cea9051c47b	natlemhps@gmail.com		/uploads/1746674982336-579504688.webp	2025-05-08 03:29:17.918422	2025-05-08 03:29:42.387	user	\N	\N	\N	\N
8	nealey	f4f57908a928b5bcd197468ae8d955b8dfa30ce421e7c380d4bf43a7c4328971ad3fe5ab669fc451584a2ede03b22d258bf17d5b73c5b3c6b3eb729f486b9d3c.72720af08364be4cf11e8b283c2ca123	justin@nealey.pro	Founder of Ctrl Alt Vibe	/uploads/1746220815831-76689833.png	2025-05-02 18:57:26.971395	2025-05-08 22:14:32.034	admin			https://linkedin.com/in/nealey/	https://justinnealey.com
\.


--
-- Name: blog_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.blog_categories_id_seq', 4, true);


--
-- Name: blog_post_tags_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.blog_post_tags_id_seq', 1, false);


--
-- Name: blog_posts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.blog_posts_id_seq', 8, true);


--
-- Name: blog_tags_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.blog_tags_id_seq', 2, true);


--
-- Name: bookmarks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.bookmarks_id_seq', 1, true);


--
-- Name: coding_tools_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.coding_tools_id_seq', 20, true);


--
-- Name: comment_replies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.comment_replies_id_seq', 3, true);


--
-- Name: comments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.comments_id_seq', 8, true);


--
-- Name: likes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.likes_id_seq', 34, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, false);


--
-- Name: project_evaluations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.project_evaluations_id_seq', 32, true);


--
-- Name: project_gallery_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.project_gallery_id_seq', 3, true);


--
-- Name: project_tags_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.project_tags_id_seq', 108, true);


--
-- Name: project_views_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.project_views_id_seq', 10, true);


--
-- Name: projects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.projects_id_seq', 19, true);


--
-- Name: shares_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.shares_id_seq', 1, false);


--
-- Name: tags_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.tags_id_seq', 27, true);


--
-- Name: user_activity_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.user_activity_id_seq', 5, true);


--
-- Name: user_skills_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.user_skills_id_seq', 13, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.users_id_seq', 16, true);


--
-- Name: blog_categories blog_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.blog_categories
    ADD CONSTRAINT blog_categories_pkey PRIMARY KEY (id);


--
-- Name: blog_categories blog_categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.blog_categories
    ADD CONSTRAINT blog_categories_slug_key UNIQUE (slug);


--
-- Name: blog_post_tags blog_post_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.blog_post_tags
    ADD CONSTRAINT blog_post_tags_pkey PRIMARY KEY (id);


--
-- Name: blog_post_tags blog_post_tags_post_id_tag_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.blog_post_tags
    ADD CONSTRAINT blog_post_tags_post_id_tag_id_key UNIQUE (post_id, tag_id);


--
-- Name: blog_posts blog_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_pkey PRIMARY KEY (id);


--
-- Name: blog_posts blog_posts_slug_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_slug_key UNIQUE (slug);


--
-- Name: blog_tags blog_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.blog_tags
    ADD CONSTRAINT blog_tags_pkey PRIMARY KEY (id);


--
-- Name: blog_tags blog_tags_slug_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.blog_tags
    ADD CONSTRAINT blog_tags_slug_key UNIQUE (slug);


--
-- Name: bookmarks bookmarks_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.bookmarks
    ADD CONSTRAINT bookmarks_pkey PRIMARY KEY (id);


--
-- Name: coding_tools coding_tools_name_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.coding_tools
    ADD CONSTRAINT coding_tools_name_key UNIQUE (name);


--
-- Name: coding_tools coding_tools_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.coding_tools
    ADD CONSTRAINT coding_tools_pkey PRIMARY KEY (id);


--
-- Name: comment_replies comment_replies_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.comment_replies
    ADD CONSTRAINT comment_replies_pkey PRIMARY KEY (id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: likes likes_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: project_evaluations project_evaluations_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.project_evaluations
    ADD CONSTRAINT project_evaluations_pkey PRIMARY KEY (id);


--
-- Name: project_evaluations project_evaluations_project_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.project_evaluations
    ADD CONSTRAINT project_evaluations_project_id_key UNIQUE (project_id);


--
-- Name: project_gallery project_gallery_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.project_gallery
    ADD CONSTRAINT project_gallery_pkey PRIMARY KEY (id);


--
-- Name: project_tags project_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.project_tags
    ADD CONSTRAINT project_tags_pkey PRIMARY KEY (id);


--
-- Name: project_views project_views_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.project_views
    ADD CONSTRAINT project_views_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: shares shares_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shares
    ADD CONSTRAINT shares_pkey PRIMARY KEY (id);


--
-- Name: tags tags_name_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_name_unique UNIQUE (name);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- Name: user_activity user_activity_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_activity
    ADD CONSTRAINT user_activity_pkey PRIMARY KEY (id);


--
-- Name: user_skills user_skills_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_skills
    ADD CONSTRAINT user_skills_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- Name: author_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX author_idx ON public.projects USING btree (author_id);


--
-- Name: bookmarks_project_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX bookmarks_project_id_idx ON public.bookmarks USING btree (project_id);


--
-- Name: bookmarks_user_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX bookmarks_user_id_idx ON public.bookmarks USING btree (user_id);


--
-- Name: bookmarks_user_project_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX bookmarks_user_project_idx ON public.bookmarks USING btree (user_id, project_id);


--
-- Name: comment_replies_author_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX comment_replies_author_id_idx ON public.comment_replies USING btree (author_id);


--
-- Name: comment_replies_comment_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX comment_replies_comment_id_idx ON public.comment_replies USING btree (comment_id);


--
-- Name: comment_replies_created_at_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX comment_replies_created_at_idx ON public.comment_replies USING btree (created_at);


--
-- Name: comments_author_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX comments_author_id_idx ON public.comments USING btree (author_id);


--
-- Name: comments_created_at_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX comments_created_at_idx ON public.comments USING btree (created_at);


--
-- Name: comments_project_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX comments_project_id_idx ON public.comments USING btree (project_id);


--
-- Name: created_at_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX created_at_idx ON public.projects USING btree (created_at);


--
-- Name: featured_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX featured_idx ON public.projects USING btree (featured);


--
-- Name: likes_comment_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX likes_comment_id_idx ON public.likes USING btree (comment_id);


--
-- Name: likes_project_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX likes_project_id_idx ON public.likes USING btree (project_id);


--
-- Name: likes_reply_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX likes_reply_id_idx ON public.likes USING btree (reply_id);


--
-- Name: likes_user_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX likes_user_id_idx ON public.likes USING btree (user_id);


--
-- Name: likes_user_project_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX likes_user_project_idx ON public.likes USING btree (user_id, project_id);


--
-- Name: project_evaluations_project_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX project_evaluations_project_id_idx ON public.project_evaluations USING btree (project_id);


--
-- Name: project_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX project_id_idx ON public.project_tags USING btree (project_id);


--
-- Name: project_tag_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX project_tag_idx ON public.project_tags USING btree (project_id, tag_id);


--
-- Name: project_views_month_year_project_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX project_views_month_year_project_idx ON public.project_views USING btree (project_id, month, year);


--
-- Name: project_views_project_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX project_views_project_id_idx ON public.project_views USING btree (project_id);


--
-- Name: project_views_year_month_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX project_views_year_month_idx ON public.project_views USING btree (year, month);


--
-- Name: shares_platform_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX shares_platform_idx ON public.shares USING btree (platform);


--
-- Name: shares_project_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX shares_project_id_idx ON public.shares USING btree (project_id);


--
-- Name: shares_user_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX shares_user_id_idx ON public.shares USING btree (user_id);


--
-- Name: tag_id_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX tag_id_idx ON public.project_tags USING btree (tag_id);


--
-- Name: tags_name_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX tags_name_idx ON public.tags USING btree (name);


--
-- Name: title_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX title_idx ON public.projects USING btree (title);


--
-- Name: views_count_idx; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX views_count_idx ON public.projects USING btree (views_count);


--
-- Name: blog_post_tags blog_post_tags_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.blog_post_tags
    ADD CONSTRAINT blog_post_tags_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.blog_posts(id) ON DELETE CASCADE;


--
-- Name: blog_post_tags blog_post_tags_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.blog_post_tags
    ADD CONSTRAINT blog_post_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.blog_tags(id) ON DELETE CASCADE;


--
-- Name: blog_posts blog_posts_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id);


--
-- Name: blog_posts blog_posts_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.blog_categories(id);


--
-- Name: bookmarks bookmarks_project_id_projects_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.bookmarks
    ADD CONSTRAINT bookmarks_project_id_projects_id_fk FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: bookmarks bookmarks_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.bookmarks
    ADD CONSTRAINT bookmarks_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: comment_replies comment_replies_author_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.comment_replies
    ADD CONSTRAINT comment_replies_author_id_users_id_fk FOREIGN KEY (author_id) REFERENCES public.users(id);


--
-- Name: comment_replies comment_replies_comment_id_comments_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.comment_replies
    ADD CONSTRAINT comment_replies_comment_id_comments_id_fk FOREIGN KEY (comment_id) REFERENCES public.comments(id);


--
-- Name: comments comments_author_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_author_id_users_id_fk FOREIGN KEY (author_id) REFERENCES public.users(id);


--
-- Name: comments comments_project_id_projects_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_project_id_projects_id_fk FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: likes likes_comment_id_comments_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_comment_id_comments_id_fk FOREIGN KEY (comment_id) REFERENCES public.comments(id);


--
-- Name: likes likes_project_id_projects_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_project_id_projects_id_fk FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: likes likes_reply_id_comment_replies_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_reply_id_comment_replies_id_fk FOREIGN KEY (reply_id) REFERENCES public.comment_replies(id);


--
-- Name: likes likes_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: notifications notifications_actorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "notifications_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: notifications notifications_commentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "notifications_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES public.comments(id) ON DELETE SET NULL;


--
-- Name: notifications notifications_projectId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "notifications_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES public.projects(id) ON DELETE SET NULL;


--
-- Name: notifications notifications_replyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "notifications_replyId_fkey" FOREIGN KEY ("replyId") REFERENCES public.comment_replies(id) ON DELETE SET NULL;


--
-- Name: notifications notifications_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: project_evaluations project_evaluations_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.project_evaluations
    ADD CONSTRAINT project_evaluations_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: project_gallery project_gallery_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.project_gallery
    ADD CONSTRAINT project_gallery_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: project_tags project_tags_project_id_projects_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.project_tags
    ADD CONSTRAINT project_tags_project_id_projects_id_fk FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: project_tags project_tags_tag_id_tags_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.project_tags
    ADD CONSTRAINT project_tags_tag_id_tags_id_fk FOREIGN KEY (tag_id) REFERENCES public.tags(id);


--
-- Name: project_views project_views_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.project_views
    ADD CONSTRAINT project_views_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: projects projects_author_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_author_id_users_id_fk FOREIGN KEY (author_id) REFERENCES public.users(id);


--
-- Name: shares shares_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shares
    ADD CONSTRAINT shares_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: shares shares_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shares
    ADD CONSTRAINT shares_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_activity user_activity_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_activity
    ADD CONSTRAINT user_activity_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_skills user_skills_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_skills
    ADD CONSTRAINT user_skills_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

