import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SEO from "@/components/SEO";

export default function TermsOfService() {
  return (
    <div className="container mx-auto py-8">
      <SEO 
        title="Terms of Service | Ctrl Alt Vibe"
        description="Terms of Service for Ctrl Alt Vibe - Learn about the rules and guidelines for using our platform."
        keywords={['terms of service', 'terms and conditions', 'user agreement', 'legal', 'Ctrl Alt Vibe']}
      />
      
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl text-center">Terms of Service</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p className="text-sm text-muted-foreground text-center mb-8">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <section className="mb-6">
            <h2>Introduction</h2>
            <p>
              Welcome to Ctrl Alt Vibe. These Terms of Service ("Terms") govern your access to and use of the Ctrl Alt Vibe website and services ("Services"). Please read these Terms carefully before using our Services.
            </p>
            <p>
              By accessing or using our Services, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use our Services.
            </p>
          </section>

          <section className="mb-6">
            <h2>User Accounts</h2>
            <p>
              To use certain features of our Services, you may need to create an account. You are responsible for maintaining the confidentiality of your account information, including your password. You agree to:
            </p>
            <ul>
              <li>Provide accurate and complete information when creating your account</li>
              <li>Keep your account information current and up-to-date</li>
              <li>Be responsible for all activities that occur under your account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
            </ul>
            <p>
              We reserve the right to terminate accounts, remove or edit content, or cancel orders at our sole discretion.
            </p>
          </section>

          <section className="mb-6">
            <h2>User Content</h2>
            <p>
              Our Services allow you to submit, post, and share content, including projects, comments, and other materials ("User Content"). You retain ownership of your User Content, but you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, translate, distribute, and display such User Content in connection with our Services.
            </p>
            <p>
              You represent and warrant that:
            </p>
            <ul>
              <li>You own or have the necessary rights to your User Content</li>
              <li>Your User Content does not violate the rights of any third party, including intellectual property rights and privacy rights</li>
              <li>Your User Content does not violate any applicable laws or regulations</li>
            </ul>
            <p>
              We may, but have no obligation to, monitor, edit, or remove User Content that we determine, in our sole discretion, violates these Terms or is otherwise objectionable.
            </p>
          </section>

          <section className="mb-6">
            <h2>Prohibited Conduct</h2>
            <p>
              You agree not to use our Services to:
            </p>
            <ul>
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe the intellectual property rights or other rights of others</li>
              <li>Engage in any unauthorized advertising or marketing</li>
              <li>Transmit any viruses, malware, or other harmful code</li>
              <li>Interfere with or disrupt the Services or servers or networks connected to the Services</li>
              <li>Collect or store personal data about other users without their consent</li>
              <li>Impersonate any person or entity or falsely state or otherwise misrepresent your affiliation with a person or entity</li>
              <li>Post or transmit content that is unlawful, harmful, threatening, abusive, harassing, defamatory, vulgar, obscene, or invasive of another's privacy</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2>Intellectual Property</h2>
            <p>
              Our Services and their content, features, and functionality are owned by Ctrl Alt Vibe and are protected by copyright, trademark, and other intellectual property laws. These Terms do not grant you any rights to use our logos, brand names, or trademarks.
            </p>
          </section>

          <section className="mb-6">
            <h2>Third-Party Links and Services</h2>
            <p>
              Our Services may contain links to third-party websites or services. We are not responsible for the content or practices of any third-party websites or services. Your use of such websites or services is at your own risk and subject to their terms of service and privacy policies.
            </p>
          </section>

          <section className="mb-6">
            <h2>Termination</h2>
            <p>
              We may terminate or suspend your access to our Services immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach these Terms.
            </p>
            <p>
              All provisions of the Terms which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity, and limitations of liability.
            </p>
          </section>

          <section className="mb-6">
            <h2>Disclaimer of Warranties</h2>
            <p>
              Our Services are provided "as is" and "as available" without any warranties of any kind, either express or implied. We do not warrant that the Services will be uninterrupted or error-free, or that defects will be corrected.
            </p>
          </section>

          <section className="mb-6">
            <h2>Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by applicable law, in no event shall Ctrl Alt Vibe be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Services.
            </p>
          </section>

          <section className="mb-6">
            <h2>Changes to Terms</h2>
            <p>
              We may modify these Terms at any time by posting the revised Terms on our website. Your continued use of our Services after any such changes constitutes your acceptance of the new Terms.
            </p>
          </section>

          <section className="mb-6">
            <h2>Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Ctrl Alt Vibe operates, without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="mb-6">
            <h2>Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at:
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
