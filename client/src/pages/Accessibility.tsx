import { Helmet } from 'react-helmet-async';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AccessibilityPage() {
  return (
    <div className="container py-8 px-4 mx-auto max-w-5xl">
      <Helmet>
        <title>Accessibility Statement | Ctrl Alt Vibe</title>
        <meta name="description" content="Our commitment to accessibility and how we're making our website accessible to all users." />
      </Helmet>

      <h1 className="text-3xl md:text-4xl font-bold mb-6">Accessibility Statement</h1>
      
      <div className="space-y-8">
        <section aria-labelledby="commitment">
          <h2 id="commitment" className="text-2xl font-semibold mb-4">Our Commitment</h2>
          <p className="text-gray-700 mb-4">
            At Ctrl Alt Vibe, we are committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.
          </p>
          <p className="text-gray-700 mb-4">
            We strive to meet WCAG 2.1 Level AA standards, which will help make the web more user-friendly for everyone, including those with disabilities.
          </p>
        </section>

        <section aria-labelledby="measures-taken">
          <h2 id="measures-taken" className="text-2xl font-semibold mb-4">Measures Taken</h2>
          <p className="text-gray-700 mb-4">
            To ensure we meet our accessibility goals, we have taken the following measures:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
            <li>Implemented semantic HTML structure for better screen reader navigation</li>
            <li>Added skip-to-content links for keyboard users</li>
            <li>Ensured all interactive elements are keyboard accessible</li>
            <li>Included proper ARIA attributes and roles throughout the application</li>
            <li>Maintained sufficient color contrast for readability</li>
            <li>Provided visible focus indicators for keyboard navigation</li>
            <li>Ensured form elements have proper labels and error messages</li>
            <li>Added announcements for dynamic content changes</li>
          </ul>
        </section>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle id="using-keyboard">Using the Website with a Keyboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-3">
                Our website can be navigated using just a keyboard. Here's how:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Use <kbd className="px-2 py-1 bg-gray-100 border rounded">Tab</kbd> to move forward through interactive elements</li>
                <li>Use <kbd className="px-2 py-1 bg-gray-100 border rounded">Shift</kbd> + <kbd className="px-2 py-1 bg-gray-100 border rounded">Tab</kbd> to move backward</li>
                <li>Press <kbd className="px-2 py-1 bg-gray-100 border rounded">Enter</kbd> or <kbd className="px-2 py-1 bg-gray-100 border rounded">Space</kbd> to activate buttons and links</li>
                <li>Use <kbd className="px-2 py-1 bg-gray-100 border rounded">Esc</kbd> to close dialogs and menus</li>
                <li>When you first arrive on the page, press <kbd className="px-2 py-1 bg-gray-100 border rounded">Tab</kbd> to reveal the "Skip to main content" link</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle id="screen-readers">Screen Reader Compatibility</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-3">
                Our website is designed to work with screen readers. We use:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Semantic HTML structure with proper headings</li>
                <li>ARIA labels and descriptions for complex elements</li>
                <li>Meaningful link text instead of "click here"</li>
                <li>Alt text for images and visual content</li>
                <li>Live regions to announce dynamic content changes</li>
                <li>Role attributes to clarify element purposes</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <section aria-labelledby="compatibility">
          <h2 id="compatibility" className="text-2xl font-semibold mb-4">Compatibility</h2>
          <p className="text-gray-700 mb-4">
            This website is designed to be compatible with the following screen readers and browsers:
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Screen Readers:</h3>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>NVDA (Windows)</li>
                <li>JAWS (Windows)</li>
                <li>VoiceOver (MacOS and iOS)</li>
                <li>TalkBack (Android)</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Browsers:</h3>
              <ul className="list-disc pl-6 space-y-1 text-gray-700">
                <li>Google Chrome (latest versions)</li>
                <li>Mozilla Firefox (latest versions)</li>
                <li>Apple Safari (latest versions)</li>
                <li>Microsoft Edge (latest versions)</li>
              </ul>
            </div>
          </div>
        </section>

        <section aria-labelledby="feedback">
          <h2 id="feedback" className="text-2xl font-semibold mb-4">Feedback and Contact Information</h2>
          <p className="text-gray-700 mb-4">
            We welcome your feedback on the accessibility of our website. If you encounter any issues or have suggestions for improvement, please contact us through one of the following methods:
          </p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <ul className="space-y-2 text-gray-700">
              <li><strong>Email:</strong> <a href="mailto:accessibility@ctrlaltvibe.com" className="text-primary hover:underline">accessibility@ctrlaltvibe.com</a></li>
              <li><strong>Contact Form:</strong> <Link href="/contact" className="text-primary hover:underline">Our Contact Page</Link></li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
