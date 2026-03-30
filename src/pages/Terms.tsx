import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, FileText } from 'lucide-react';

const Terms: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-slate-200/50 border border-slate-100"
        >
          <div className="flex items-center space-x-4 mb-8">
            <div className="p-3 bg-green-100 rounded-2xl text-green-600">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Terms and Conditions</h1>
          </div>

          <div className="prose prose-slate max-w-none">
            <p className="text-lg font-semibold text-slate-800 mb-6">
              Terms and Conditions – Plant a Tree
            </p>
            
            <div className="space-y-6 text-slate-600 leading-relaxed">
              <p>
                By accessing and using the Plant a Tree platform (“Platform”), you agree to the following terms:
              </p>

              <div className="grid gap-6">
                {[
                  "(1) The Platform provides digital participation in environmentally themed contribution and reward-based programs and is not a bank, financial institution, or regulated investment advisory unless explicitly stated;",
                  "(2) You must be at least 18 years old, legally capable of entering agreements, and compliant with applicable laws;",
                  "(3) You are responsible for maintaining accurate account information and safeguarding login credentials, and all activities under your account are your responsibility;",
                  "(4) Participation in platform activities may provide indicative rewards or returns, which are variable, subject to change, and not guaranteed;",
                  "(5) You acknowledge that participation involves inherent financial risk, including potential partial or complete loss of contributed amounts, and you agree to participate at your own discretion after evaluating your financial condition;",
                  "(6) The Platform does not provide financial, legal, or investment advice, and users should consult qualified professionals before making decisions;",
                  "(7) Referral programs may offer incentives subject to change, and misuse or manipulation may lead to suspension or termination of your account;",
                  "(8) All payments are processed via authorized third-party providers, and the Platform is not responsible for delays, failures, or errors caused by such providers;",
                  "(9) Withdrawals are subject to verification, platform policies, minimum thresholds, and may be delayed in cases of suspicious activity;",
                  "(10) Users must not engage in fraudulent, unlawful, or manipulative activities, including the use of bots, scripts, or unauthorized methods, and violations may result in immediate account termination;",
                  "(11) To the maximum extent permitted by law, the Platform is not liable for any direct, indirect, incidental, or consequential losses arising from use of the Platform, including financial losses;",
                  "(12) The Platform reserves the right to modify, suspend, or discontinue services, features, rewards, or these Terms at any time without prior notice, and continued use constitutes acceptance of updated terms;",
                  "(13) Accounts may be suspended or terminated for violations or legal requirements;",
                  "(14) These Terms are governed by the laws of India, and disputes shall fall under the jurisdiction of courts in [Your City];",
                  "(15) By using the Platform, you confirm that you have read, understood, and agreed to these Terms and Conditions, including all risk disclosures, and that your participation is voluntary and at your own risk;",
                  "(16) For support or inquiries, contact plantatreeservice@gmail.com or City: Kansi Simri Darbhanga County: Darbhanga Chennai, India."
                ].map((term, index) => (
                  <div key={index} className="flex space-x-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex-shrink-0 w-8 h-8 bg-white rounded-full flex items-center justify-center text-sm font-bold text-green-600 shadow-sm border border-slate-100">
                      {index + 1}
                    </div>
                    <p className="text-slate-600">{term.substring(term.indexOf(')') + 2)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Terms;
