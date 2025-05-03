import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SEO from "@/components/SEO";

export default function PrivacyPolicy() {
  return (
    <div className="container mx-auto py-8">
      <SEO 
        title="Privacy Policy | Ctrl Alt Vibe"
        description="Privacy Policy for Ctrl Alt Vibe - Learn how we collect, use, and protect your personal information."
        keywords={['privacy policy', 'data protection', 'user privacy', 'personal information', 'Ctrl Alt Vibe']}
      />
      
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl text-center">Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p className="text-sm text-muted-foreground text-center mb-8">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <section className="mb-6">
            <h2>Introduction</h2>
            <p>
              Ctrl Alt Vibe ("we," "our," or "us") respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
            </p>
            <p>
              Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.
            </p>
          </section>

          <section className="mb-6">
            <h2>Information We Collect</h2>
            <h3>Personal Information</h3>
            <p>We may collect personal information that you voluntarily provide to us when you:</p>
            <ul>
              <li>Register for an account</li>
              <li>Sign in with a third-party service (such as Google)</li>
              <li>Submit a project</li>
              <li>Post comments</li>
              <li>Contact us</li>
            </ul>
            <p>The personal information we may collect includes:</p>
            <ul>
              <li>Name</li>
              <li>Email address</li>
              <li>Profile picture</li>
              <li>Username</li>
              <li>Any other information you choose to provide</li>
            </ul>

            <h3>Information Collected Through Third-Party Authentication</h3>
            <p>
              When you sign in using a third-party service like Google, we may collect information that the third-party service provides to us, such as your:
            </p>
            <ul>
              <li>Name</li>
              <li>Email address</li>
              <li>Profile picture</li>
              <li>Unique identifier provided by the service</li>
            </ul>
            <p>
              We only collect the information that is necessary to authenticate you and create your account on our platform.
            </p>

            <h3>Automatically Collected Information</h3>
            <p>
              When you use our website, we may automatically collect certain information, including:
            </p>
            <ul>
              <li>IP address</li>
              <li>Browser type</li>
              <li>Device information</li>
              <li>Operating system</li>
              <li>Pages visited and actions taken on our site</li>
              <li>Time and date of your visit</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2>How We Use Your Information</h2>
            <p>We may use the information we collect for various purposes, including to:</p>
            <ul>
              <li>Create and manage your account</li>
              <li>Provide, maintain, and improve our services</li>
              <li>Process and display user-submitted content</li>
              <li>Communicate with you about updates, security alerts, and support</li>
              <li>Respond to your inquiries and provide customer service</li>
              <li>Monitor and analyze usage patterns and trends</li>
              <li>Protect against unauthorized access and abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2>How We Share Your Information</h2>
            <p>We may share your information in the following situations:</p>
            <ul>
              <li><strong>Public Content:</strong> Information you voluntarily make public, such as projects, comments, and profile information, will be available to other users of our platform.</li>
              <li><strong>Service Providers:</strong> We may share your information with third-party vendors, service providers, and contractors who perform services for us.</li>
              <li><strong>Legal Requirements:</strong> We may disclose your information if required to do so by law or in response to valid legal requests.</li>
              <li><strong>Protection of Rights:</strong> We may disclose your information to protect the rights, property, or safety of Ctrl Alt Vibe, our users, or others.</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2>Data Security</h2>
            <p>
              We implement reasonable security measures to protect your personal information from unauthorized access, use, or disclosure. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-6">
            <h2>Your Choices</h2>
            <p>You have certain choices regarding your personal information:</p>
            <ul>
              <li><strong>Account Information:</strong> You can review and update your account information through your profile settings.</li>
              <li><strong>Cookies:</strong> Most web browsers allow you to control cookies through their settings preferences.</li>
              <li><strong>Communications:</strong> You can opt out of receiving promotional emails by following the unsubscribe instructions in the emails.</li>
              <li><strong>Delete Account:</strong> You may request to delete your account by contacting us.</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2>Third-Party Links</h2>
            <p>
              Our website may contain links to third-party websites. We are not responsible for the privacy practices or content of these third-party sites. We encourage you to read the privacy policies of every website you visit.
            </p>
          </section>

          <section className="mb-6">
            <h2>Children's Privacy</h2>
            <p>
              Our services are not directed to individuals under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that a child under 13 has provided us with personal information, we will take steps to delete such information.
            </p>
          </section>

          <section className="mb-6">
            <h2>Changes to This Privacy Policy</h2>
            <p>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section className="mb-6">
            <h2>Contact Us</h2>
            <p>
              If you have any questions or concerns about this Privacy Policy, please contact us at:
            </p>
            <p className="not-prose">
              <a href="mailto:support@ctrlaltvibe.com" className="text-primary hover:underline">support@ctrlaltvibe.com</a>
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
