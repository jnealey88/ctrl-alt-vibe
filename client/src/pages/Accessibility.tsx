import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function Accessibility() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <Helmet>
        <title>Accessibility Statement | Ctrl Alt Vibe</title>
        <meta name="description" content="Our commitment to digital accessibility and inclusion for all users." />
      </Helmet>

      <div className="space-y-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-4">Accessibility Statement</h1>
          <p className="text-lg text-gray-600">Our commitment to an inclusive experience for all users</p>
        </div>

        <section className="prose prose-blue max-w-none">
          <h2 id="our-commitment">Our Commitment</h2>
          <p>
            Ctrl Alt Vibe is committed to ensuring digital accessibility for people with disabilities. We continually improve the user experience for everyone
            and apply the relevant accessibility standards to ensure we meet or exceed the requirements of the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA.
          </p>

          <h2 id="measures-taken">Measures Taken</h2>
          <p>We've taken the following measures to ensure accessibility:</p>
          <ul>
            <li>Include accessibility throughout our internal policies</li>
            <li>Provide continual accessibility training for our staff</li>
            <li>Assign clear accessibility goals and responsibilities</li>
            <li>Employ formal accessibility quality assurance methods</li>
          </ul>

          <h2 id="conformance-status">Conformance Status</h2>
          <p>
            The Web Content Accessibility Guidelines (WCAG) define requirements for designers and developers to improve 
            accessibility for people with disabilities. It defines three levels of conformance: Level A, Level AA, and Level AAA.
          </p>
          <p>
            Ctrl Alt Vibe is partially conformant with WCAG 2.1 level AA. 
            Partially conformant means that some parts of the content do not fully conform to the accessibility standard.
          </p>

          <h2 id="feedback">Feedback</h2>
          <p>
            We welcome your feedback on the accessibility of Ctrl Alt Vibe. Please let us know if you encounter accessibility 
            barriers on our platform:
          </p>
          <ul>
            <li>Email: <a href="mailto:accessibility@ctrlaltvibe.com">accessibility@ctrlaltvibe.com</a></li>
            <li>Contact form: <a href="/contact">Contact Us</a></li>
          </ul>
          <p>
            We try to respond to feedback within 2 business days and aim to fix reported issues in a timely manner based on their impact and complexity.
          </p>

          <h2 id="accessibility-features">Accessibility Features</h2>
          <p>Ctrl Alt Vibe includes the following accessibility features:</p>
          <ul>
            <li>Skip to main content link</li>
            <li>Keyboard navigation support</li>
            <li>ARIA landmarks and roles</li>
            <li>Alt text for images</li>
            <li>Sufficient color contrast</li>
            <li>Text resizing without loss of functionality</li>
            <li>Clear focus indicators</li>
            <li>Screen reader announcements for dynamic content</li>
          </ul>

          <h2 id="assistive-technology">Using Ctrl Alt Vibe with Assistive Technology</h2>
          <p>Ctrl Alt Vibe is designed to be compatible with the following assistive technologies:</p>
          <ul>
            <li>Screen readers such as NVDA, JAWS, VoiceOver, and TalkBack</li>
            <li>Screen magnifiers</li>
            <li>Voice recognition software</li>
            <li>Alternative keyboard devices</li>
          </ul>

          <h2 id="keyboard-navigation">Keyboard Navigation Tips</h2>
          <p>Ctrl Alt Vibe is fully navigable with a keyboard:</p>
          <ul>
            <li>Use <kbd>Tab</kbd> to navigate forward through interactive elements</li>
            <li>Use <kbd>Shift</kbd> + <kbd>Tab</kbd> to navigate backward</li>
            <li>Use <kbd>Enter</kbd> or <kbd>Space</kbd> to activate buttons and links</li>
            <li>Press <kbd>Tab</kbd> at the start of the page to reveal the skip to content link</li>
          </ul>
        </section>

        <section className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-gray-500 text-sm">
            This statement was last updated on May 4, 2025.
          </p>
        </section>
      </div>
    </div>
  );
}
