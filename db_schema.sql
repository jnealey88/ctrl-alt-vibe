-- Database Schema Export
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
    role text DEFAULT 'user'::text NOT NULL
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

