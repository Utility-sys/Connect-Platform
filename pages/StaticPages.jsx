import React from 'react';

export const HelpCenter = () => (
  <div className="bg-gray-50 min-h-screen py-16 px-8 dark:bg-slate-900 transition-colors duration-300">
    <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 p-10 rounded-2xl shadow-sm border border-border dark:border-slate-700">
      <h1 className="text-4xl font-bold text-textPrimary dark:text-white mb-6">Connect Help Center</h1>
      <div className="space-y-6 text-textSecondary dark:text-slate-300 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-textPrimary dark:text-white mb-3">How do I book a venue?</h2>
          <p>Search for your desired venue, select a date and time slot, and click "Proceed to Pay". Follow the secure payment steps including OTP verification to confirm your booking instantly.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-textPrimary dark:text-white mb-3">How do I cancel my booking?</h2>
          <p>Go to your Customer Dashboard, find the active booking, and click "Cancel". Note that cancellations must be made at least 24 hours in advance to be eligible for a refund.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-textPrimary dark:text-white mb-3">How can I list my venue?</h2>
          <p>Sign up as a Venue Owner and access your Owner Dashboard. Click "Add New Venue", fill in the details, and submit for admin approval.</p>
        </section>
      </div>
    </div>
  </div>
);

export const PrivacyPolicy = () => (
  <div className="bg-gray-50 min-h-screen py-16 px-8 dark:bg-slate-900 transition-colors duration-300">
    <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 p-10 rounded-2xl shadow-sm border border-border dark:border-slate-700">
      <h1 className="text-4xl font-bold text-textPrimary dark:text-white mb-6">Privacy Policy</h1>
      <p className="text-textSecondary dark:text-slate-300 mb-4">Last Updated: April 2026</p>
      <div className="space-y-4 text-textSecondary dark:text-slate-300 leading-relaxed">
        <p>At Connect, we take your privacy seriously. We collect personal information (name, email, phone) to provide our booking services. Payment information is securely processed by PayHere and is never stored on our servers.</p>
        <p>We do not sell your personal data to third parties. We may use your usage data to train our AI recommendations anonymously.</p>
      </div>
    </div>
  </div>
);

export const TermsOfService = () => (
  <div className="bg-gray-50 min-h-screen py-16 px-8 dark:bg-slate-900 transition-colors duration-300">
    <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 p-10 rounded-2xl shadow-sm border border-border dark:border-slate-700">
      <h1 className="text-4xl font-bold text-textPrimary dark:text-white mb-6">Terms of Service</h1>
      <p className="text-textSecondary dark:text-slate-300 mb-4">Last Updated: April 2026</p>
      <div className="space-y-4 text-textSecondary dark:text-slate-300 leading-relaxed">
        <p>By using Connect, you agree to abide by our policies. Venue Owners are responsible for maintaining accurate listings and honoring confirmed bookings. Searchers are responsible for timely payments and adhering to venue rules.</p>
        <p>Connect reserves the right to suspend accounts that violate these terms or engage in fraudulent activities.</p>
      </div>
    </div>
  </div>
);
