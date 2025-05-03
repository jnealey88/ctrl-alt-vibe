import { Helmet } from 'react-helmet-async';
import { useLocation } from 'wouter';

export interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  article?: boolean;
  canonicalUrl?: string;
  keywords?: string[];
}

const defaultDescription = 'Ctrl Alt Vibe is a community platform for developers to showcase AI-assisted coding projects. Discover, share, and engage with innovative projects from the developer community.';
const defaultTitle = 'Ctrl Alt Vibe | AI-Assisted Coding Projects Community';
const defaultImage = '/ctrlaltvibelogo.png'; // Make sure this path is correct
const defaultKeywords = ['coding', 'AI-assisted', 'developer', 'projects', 'community', 'programming'];
const siteUrl = typeof window !== 'undefined' ? window.location.origin : '';

export default function SEO({
  title = defaultTitle,
  description = defaultDescription,
  image = defaultImage,
  article = false,
  canonicalUrl,
  keywords = defaultKeywords,
}: SEOProps) {
  const [location] = useLocation();
  const currentUrl = `${siteUrl}${location}`;
  const pageTitle = title !== defaultTitle ? `${title} | Ctrl Alt Vibe` : title;
  const url = canonicalUrl || currentUrl;
  const imageUrl = image.startsWith('http') ? image : `${siteUrl}${image}`;

  return (
    <Helmet>
      {/* Basic metadata */}
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <meta name="image" content={imageUrl} />
      {keywords?.length > 0 && (
        <meta name="keywords" content={keywords.join(', ')} />
      )}
      <link rel="canonical" href={url} />

      {/* OpenGraph tags */}
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="Ctrl Alt Vibe" />
      <meta property="og:type" content={article ? 'article' : 'website'} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      
      {/* Twitter Card tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
    </Helmet>
  );
}
