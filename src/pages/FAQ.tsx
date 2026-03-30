import React from 'react';
import { motion } from 'motion/react';
import { HelpCircle, ChevronDown } from 'lucide-react';

const FAQ: React.FC = () => {
  const faqs = [
    {
      q: "What is Plant a Tree?",
      a: "Plant a Tree is a digital platform where users can participate in environmentally themed programs and engage in activities that may offer rewards or returns linked to virtual tree-based initiatives."
    },
    {
      q: "Is Plant a Tree a financial or investment platform?",
      a: "No, Plant a Tree is not a bank, financial institution, or licensed investment advisory service. It provides participation-based opportunities and reward models, not guaranteed financial products."
    },
    {
      q: "How do I create an account?",
      a: "You can sign up using your email, phone number, and password on the registration page. Ensure all details are accurate to avoid issues later."
    },
    {
      q: "Are the returns fixed or guaranteed?",
      a: "No, any returns or earnings shown are indicative and may vary. They are not fixed or guaranteed under any circumstances."
    },
    {
      q: "How does the referral system work?",
      a: "You can invite others using your referral code. If they join and participate, you may receive rewards as per the platform’s referral policy."
    },
    {
      q: "Can I withdraw my earnings anytime?",
      a: "Withdrawals are subject to platform rules, verification processes, and minimum limits. Processing times may vary."
    },
    {
      q: "How long do withdrawals take?",
      a: "Withdrawal processing time depends on verification and payment provider timelines. Delays may occur in certain situations."
    },
    {
      q: "What payment methods are supported?",
      a: "Payments are processed through authorized third-party providers. Available methods may vary depending on your region."
    },
    {
      q: "What happens if I enter a wrong referral code?",
      a: "If an invalid referral code is entered, it may not be applied. The platform may not be able to modify referral details after signup."
    },
    {
      q: "Is my data secure?",
      a: "We take reasonable measures to protect your data. However, users are also responsible for keeping their account credentials secure."
    },
    {
      q: "Can my account be suspended?",
      a: "Yes, accounts may be suspended or terminated if there is any violation of terms, suspicious activity, or misuse of the platform."
    },
    {
      q: "Do I need to verify my account?",
      a: "Yes, verification may be required for withdrawals or certain features to ensure security and compliance."
    },
    {
      q: "Is there any risk involved?",
      a: "Yes, participation involves risk. Returns or rewards are not guaranteed, and there is a possibility of partial or complete loss depending on various factors."
    },
    {
      q: "What should I do if I forget my password?",
      a: "Use the “Forgot Password” option on the login page to reset your password securely."
    },
    {
      q: "Can the platform change its policies or rewards?",
      a: "Yes, the platform reserves the right to modify features, rewards, and policies at any time without prior notice."
    },
    {
      q: "Who should I contact for support?",
      a: "For any queries or issues, you can contact us via email or through the support section on the platform."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center p-3 bg-green-100 rounded-2xl text-green-600 mb-4">
            <HelpCircle className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h1>
          <p className="text-slate-500 text-lg">Everything you need to know about Plant a Tree.</p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-50 rounded-full flex items-center justify-center text-sm font-bold text-green-600">
                    {index + 1}
                  </div>
                  <div className="flex-grow">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{faq.q}</h3>
                    <p className="text-slate-600 leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQ;
