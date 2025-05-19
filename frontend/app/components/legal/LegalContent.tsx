// File: frontend/app/components/legal/LegalContent.tsx

'use client';

import React from 'react';
import Link from 'next/link';
import Navigation from '../navigation/Navigation';

// Update the interface to exclude the pricing page type
interface LegalContentProps {
  pageType: 'privacy' | 'terms' | 'refund' | 'about' | 'contact';
}

const LegalContent: React.FC<LegalContentProps> = ({ pageType }) => {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container-fluid px-8 py-6">
        <div className="max-w-[1600px] mx-auto w-full">
          <div className="flex justify-between mb-8">
            <h1 className="text-2xl font-medium">
              {pageType === 'privacy' && 'Privacy Policy'}
              {pageType === 'terms' && 'Terms & Conditions'}
              {pageType === 'refund' && 'Cancellation & Refund Policy'}
              {pageType === 'about' && 'About Us'}
              {pageType === 'contact' && 'Contact Us'}
            </h1>
            <Navigation />
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="max-w-3xl mx-auto prose prose-headings:font-medium prose-headings:text-neutral-900 prose-p:text-neutral-700 prose-li:text-neutral-700 prose-ul:my-4 prose-ul:list-disc prose-ol:list-decimal">
              {pageType === 'privacy' && <PrivacyPolicy />}
              {pageType === 'terms' && <TermsConditions />}
              {pageType === 'refund' && <RefundPolicy />}
              {pageType === 'about' && <AboutUs />}
              {pageType === 'contact' && <ContactUs />}
            </div>
          </div>
          
          <div className="flex justify-center gap-6 text-sm text-gray-600">
            <Link href="/about" className="hover:text-blue-600">About Us</Link>
            <Link href="/contact" className="hover:text-blue-600">Contact Us</Link>
            <Link href="/privacy" className="hover:text-blue-600">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-blue-600">Terms & Conditions</Link>
            <Link href="/refund" className="hover:text-blue-600">Refund Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const PrivacyPolicy = () => (
  <>
    <h2>Privacy Policy</h2>
    <p><em>Last Updated: February 27, 2025</em></p>
    <p>KRIONX LABS LLP ("we," "our," or "us") operates Paaṭha AI. This Privacy Policy explains how we collect, use, and share your information when you use our services.</p>
    
    <h3>1. Information We Collect</h3>
    <p>
      <strong>Information You Provide</strong> – When you register, we collect your name, email, password, and optional profile details (educational level, subjects, etc.). If you make payments, our payment processor collects billing details.
      <br/>
      <strong>Usage & Device Data</strong> – We collect data on how you interact with our services, device type, browser, and IP address.
      <br/>
      <strong>Cookies & Tracking</strong> – We use cookies and tracking technologies to improve your experience.
    </p>
    
    <h3>2. How We Use Your Information</h3>
    <ul>
      <li>To provide and improve our services</li>
      <li>To process transactions and manage accounts</li>
      <li>To personalize learning experiences</li>
      <li>To analyze usage and enhance our offerings</li>
      <li>To ensure security and prevent fraud</li>
    </ul>
    
    <h3>3. How We Share Your Information</h3>
    <p><strong>With Third-Party Service Providers</strong> – We use third-party services for:</p>
    <ul>
      <li><strong>Payment Processing:</strong> Razorpay handles transactions securely.</li>
      <li><strong>AI Processing:</strong> OpenAI and other APIs assist in grading and AI interactions.</li>
      <li><strong>Hosting:</strong> Our services are hosted on cloud infrastructure.</li>
    </ul>
    <p><strong>For Legal Reasons</strong> – We may share data if required by law.</p>
    <p><strong>Business Transfers</strong> – If our company undergoes a merger or acquisition, data may be transferred.</p>
    
    <h3>4. Your Rights & Choices</h3>
    <p>
      You can update or delete your account at any time.<br/>
      You can opt out of marketing emails.<br/>
      Some features may require certain data to function.
    </p>
    
    <h3>5. Data Security</h3>
    <p>We use security measures to protect your information but cannot guarantee complete security.</p>
    
    <h3>6. Changes & Contact</h3>
    <p>We may update this policy. For questions, contact us at <a href="mailto:support@paatha.ai">support@paatha.ai</a>.</p>
  </>
);

const TermsConditions = () => (
  <>
    <h2>Terms & Conditions</h2>
    <p><em>Last Updated: February 27, 2025</em></p>
    <p>By using Paaṭha AI, you agree to these terms.</p>
    
    <h3>1. Account Registration</h3>
    <p>
      You must provide accurate information and keep your credentials secure.<br/>
      You are responsible for all activity under your account.
    </p>
    
    <h3>2. User Content</h3>
    <p>You retain ownership of the content you submit but allow us to use it to improve and provide our services.</p>
    
    <h3>3. Payments & Subscriptions</h3>
    <p>Premium plans require payment; fees are non-refundable except as per our <Link href="/refund">Refund Policy</Link>.</p>
    
    <h3>4. Prohibited Activities</h3>
    <p>Do not use Paaṭha AI for illegal activities, fraud, impersonation, hacking, or distributing harmful content.</p>
    
    <h3>5. Termination</h3>
    <p>We may suspend or terminate accounts that violate these terms.</p>
    
    <h3>6. Intellectual Property</h3>
    <p>Our platform and content are owned by KRIONX LABS LLP and protected under copyright and trademark laws.</p>
    
    <h3>7. Disclaimer & Liability</h3>
    <p>
      Paaṭha AI is provided "as is" without guarantees.<br/>
      We are not responsible for indirect or incidental damages.
    </p>
    
    <h3>8. Changes & Governing Law</h3>
    <p>These terms may change, and Indian law governs this agreement.</p>
    
    <h3>9. Contact</h3>
    <p>For questions, contact us at <a href="mailto:support@paatha.ai">support@paatha.ai</a>.</p>
  </>
);

const RefundPolicy = () => (
  <>
    <h2>Cancellation & Refund Policy</h2>
    <p><em>Last Updated: February 27, 2025</em></p>
    
    <h3>1. Subscription Cancellation</h3>
    <p>
      Cancel anytime via Account Settings.<br/>
      Access continues until the current billing cycle ends.
    </p>
    
    <h3>2. Refund Policy</h3>
    <p>No refunds for partial use of a subscription.</p>
    <p>Refunds may be considered for:</p>
    <ul>
      <li>Persistent technical issues unresolved within 14 days.</li>
      <li>Unauthorized charges.</li>
      <li>Other exceptional cases (at our discretion).</li>
    </ul>
    
    <h3>3. Refund Request Process</h3>
    <p>
      Contact us within 7 days of purchase with order details.<br/>
      Approved refunds will be processed within 14 business days.
    </p>
    
    <h3>4. Changes & Contact</h3>
    <p>We may update this policy. For refund requests, email us at <a href="mailto:support@paatha.ai">support@paatha.ai</a>.</p>
  </>
);

const AboutUs = () => (
  <>
    <h2>About Paaṭha AI</h2>
    
    <h3>Our Mission</h3>
    <p>
      At Paaṭha AI, we're dedicated to transforming education through innovative AI technology. 
      Our mission is to make quality education accessible to students across India by providing 
      personalized learning experiences that adapt to individual needs.
    </p>
    
    <h3>What We Do</h3>
    <p>
      Paaṭha AI is an intelligent learning platform that helps students practice and master 
      subjects through AI-powered question answering and personalized feedback. Our system:
    </p>
    <ul>
      <li>Provides targeted practice questions aligned with your curriculum</li>
      <li>Offers detailed, personalized feedback on your answers</li>
      <li>Tracks your progress and identifies areas for improvement</li>
      <li>Adapts to your learning style and pace</li>
    </ul>
    
    <h3>About KRIONX LABS LLP</h3>
    <p>
      Paaṭha AI is developed by KRIONX LABS LLP, a technology company focused on 
      building innovative solutions in education and AI. Founded by a team of 
      educators, technologists, and AI specialists, we combine expertise in 
      machine learning, educational theory, and product design to create tools 
      that truly enhance the learning experience.
    </p>
    
    <h3>Contact Us</h3>
    <p>
      Have questions or feedback? We'd love to hear from you!<br/>
      Email: <a href="mailto:support@paatha.ai">support@paatha.ai</a>
    </p>
  </>
);

const ContactUs = () => (
  <>
    <h2>Contact Us</h2>
    
    <h3>Get in Touch</h3>
    <p>
      We're here to help! If you have questions, feedback, or need assistance with Paaṭha AI,
      please reach out using any of the methods below.
    </p>
    
    <h3>Contact Information</h3>
    <p>
      <strong>Email:</strong> <a href="mailto:support@paatha.ai">support@paatha.ai</a> (Preferred method for fastest response)<br/>
      <strong>Support Hours:</strong> Monday to Friday, 9:00 AM to 6:00 PM IST
    </p>
    
    <h3>Business Address</h3>
    <p>
      KRIONX LABS LLP<br />
      #2-001, dhaRti Foundation<br />
      IIT Dharwad, Chikkamalligawad Village<br />
      Near Mummigatti Industrial Area<br />
      Dharwad - 580001
    </p>
    
    <h3>Technical Support</h3>
    <p>
      For technical issues or account-related queries, please include the following details in your email:
    </p>
    <ul>
      <li>Your registered email address</li>
      <li>Device and browser information</li>
      <li>A detailed description of the issue</li>
      <li>Screenshots (if applicable)</li>
    </ul>
    
    <h3>Business Inquiries</h3>
    <p>
      For partnerships, collaborations, or business-related inquiries, please contact:<br/>
      <a href="mailto:support@paatha.ai">support@paatha.ai</a>
    </p>
    
    <h3>Response Time</h3>
    <p>
      We strive to respond to all inquiries within 24-48 hours during business days.
      Your feedback is valuable to us and helps improve our service for all users.
    </p>
  </>
);

export default LegalContent;