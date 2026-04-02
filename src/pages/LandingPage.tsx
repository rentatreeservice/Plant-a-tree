import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  TreePine, 
  Wallet, 
  CheckCircle2, 
  ArrowRight, 
  Star,
  Users,
  Sprout,
  BarChart3,
  Leaf,
  Shield,
  Clock,
  Mail,
  Loader2,
  Package as PackageIcon
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { TREE_IMAGES } from '../assets/treeImages';
import { TreePackage } from '../types';
import { DEFAULT_PACKAGES } from '../constants/treeData';
import logo from '../assets/logo.png';

const LandingPage: React.FC = () => {
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [packages, setPackages] = useState<TreePackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'packages'), orderBy('investmentAmount', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPackages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TreePackage)));
      setLoadingPackages(false);
    });
    return unsubscribe;
  }, []);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'messages'), {
        ...contactForm,
        createdAt: new Date().toISOString()
      });
      alert("Message sent successfully!");
      setContactForm({ name: '', email: '', message: '' });
    } catch (err) {
      console.error(err);
      alert("Failed to send message.");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative bg-green-600 text-white pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Celebration Banner */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 inline-block bg-white border-4 border-red-600 px-8 py-6 rounded-3xl shadow-2xl shadow-red-900/20"
          >
            <h2 className="text-xl md:text-3xl font-black text-red-600 mb-1 tracking-tight">
              We are celebrating two years of success in planting real trees
            </h2>
            <p className="text-red-500 text-lg md:text-xl font-black">
              Giving 250Rs Signup bonus as a free package For new Users
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-center mb-8"
          >
            <img 
              src={logo} 
              alt="Plant a Tree Logo" 
              className="h-32 w-32 md:h-40 md:w-40 object-contain drop-shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-extrabold mb-8 leading-tight"
          >
            Grow Your Wealth While <br /> Planting Trees
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl md:text-2xl text-green-50 max-w-3xl mx-auto mb-12 font-medium"
          >
            Invest in virtual trees, earn returns, and contribute to real tree planting initiatives. 
            Sustainable investing with purpose.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/signup">
              <motion.button 
                className="w-full sm:w-auto px-8 py-4 bg-white text-green-600 font-bold rounded-2xl hover:bg-green-50 transition-all flex items-center justify-center gap-2 shadow-xl"
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)" }}
                whileTap={{ scale: 0.95 }}
              >
                <Users className="h-5 w-5" />
                Sign Up
              </motion.button>
            </Link>
            <Link to="/login">
              <motion.button 
                className="w-full sm:w-auto px-8 py-4 border-2 border-white text-white font-bold rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowRight className="h-5 w-5" />
                Login
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-green-900 mb-4">Why Choose Plant A Tree?</h2>
            <p className="text-gray-500 text-lg">We combine financial growth with environmental responsibility</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <TrendingUp className="h-8 w-8 text-green-600" />,
                title: "Returns",
                desc: "Earn consistent returns on your tree investments with transparent tracking."
              },
              {
                icon: <TreePine className="h-8 w-8 text-green-600" />,
                title: "Real Tree Planting",
                desc: "For every virtual tree rented, we plant a real tree to combat deforestation."
              },
              {
                icon: <Wallet className="h-8 w-8 text-green-600" />,
                title: "Flexible Withdrawals",
                desc: "Withdraw your earnings anytime with low minimum thresholds and fast processing."
              }
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -10 }}
                className="p-8 bg-green-50/30 rounded-3xl border border-green-100 text-center"
              >
                <div className="inline-flex p-4 bg-white rounded-2xl shadow-sm mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-green-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tree Packages Section */}
      <section id="packages" className="py-24 bg-green-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-green-900 mb-4">Our Tree Packages</h2>
            <p className="text-gray-500 text-lg">Choose from our variety of tree packages to grow your wealth sustainably</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loadingPackages ? (
              <div className="col-span-full py-20 flex flex-col items-center justify-center">
                <Loader2 className="h-12 w-12 text-green-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Loading our latest packages...</p>
              </div>
            ) : (
              (packages.length > 0 ? packages : DEFAULT_PACKAGES).map((pkg) => {
                const localImages: Record<string, string> = {
                  'Marigold': TREE_IMAGES.marigold,
                  'Rose': TREE_IMAGES.rose,
                  'Tulsi': TREE_IMAGES.tulsi,
                  'Mango': TREE_IMAGES.mango
                };
                const displayImage = localImages[pkg.name] || pkg.imageUrl;

                return (
                  <motion.div 
                    key={pkg.id}
                    whileHover={{ y: -15, scale: 1.02, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)" }}
                    className="bg-white rounded-[2rem] overflow-hidden border border-green-100 shadow-sm transition-all group"
                  >
                    <div className="relative h-48 overflow-hidden bg-green-50/50">
                      <motion.img 
                        src={displayImage} 
                        alt={pkg.name} 
                        className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110" 
                        referrerPolicy="no-referrer" 
                      />
                      {pkg.badge && (
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-green-700">
                          {pkg.badge}
                        </div>
                      )}
                    </div>
                    <div className="p-8">
                      <h3 className="text-2xl font-bold text-green-900 mb-2">{pkg.name}</h3>
                      <p className="text-gray-500 text-sm mb-6">{pkg.tagline}</p>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-green-50 p-4 rounded-2xl text-center">
                          <div className="text-green-600 font-bold text-lg">₹{pkg.investmentAmount}</div>
                          <div className="text-gray-400 text-xs uppercase tracking-wider">Investment</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-2xl text-center">
                          <div className="text-green-600 font-bold text-lg">{pkg.durationDays}d</div>
                          <div className="text-gray-400 text-xs uppercase tracking-wider">Duration</div>
                        </div>
                      </div>

                      <div className="bg-green-50/50 p-4 rounded-2xl text-center mb-8 border border-green-100">
                        <div className="text-green-700 font-bold">Total Return: ₹{pkg.totalReturn} (Principal inc.)</div>
                      </div>

                      <Link to="/login">
                        <motion.button 
                          className="w-full py-4 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 transition-all text-center"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {pkg.investmentAmount === 0 ? 'Get Free Plant' : `Invest in ${pkg.name}`}
                        </motion.button>
                      </Link>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-green-900 mb-4">How It Works</h2>
            <p className="text-gray-500 text-lg">Start growing your wealth in just a few simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: "1", title: "Create Account", desc: "Sign up for a free account in less than a minute with just your email." },
              { step: "2", title: "Choose Investment", desc: "Select from our variety of tree plans based on your investment goals." },
              { step: "3", title: "Start Earning", desc: "Earn returns that you can withdraw or reinvest for compound growth." },
              { step: "4", title: "Track Growth", desc: "Monitor your investments and environmental impact through your dashboard." }
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-600 text-white font-bold rounded-full mb-6 text-xl shadow-lg shadow-green-200">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-green-900 mb-4">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-24 bg-green-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-[3rem] p-12 shadow-sm border border-green-100">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-green-900 mb-4">Our Environmental Impact</h2>
              <p className="text-gray-500 text-lg">Together, we're making a real difference for our planet</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
              {[
                { label: "Trees Planted", value: "2,847" },
                { label: "Active Investors", value: "1,250" },
                { label: "Total Invested", value: "₹4.2k" },
                { label: "Returns Paid", value: "₹18.7K" }
              ].map((stat, idx) => (
                <div key={idx} className="text-center p-8 bg-green-50/50 rounded-3xl border border-green-100">
                  <div className="text-4xl font-bold text-green-700 mb-2">{stat.value}</div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="rounded-3xl overflow-hidden shadow-xl">
                <img 
                  src="https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&q=80&w=800" 
                  alt="Forest" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="space-y-8">
                <h3 className="text-3xl font-bold text-green-900">Real Trees, Real Impact</h3>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Every completed investment doesn't just grow your wealth—it grows real forests. We partner with verified reforestation organizations to plant native trees in areas that need them most.
                </p>
                <ul className="space-y-4">
                  {[
                    "Verified planting locations with GPS coordinates",
                    "Personalized certificates for every tree planted",
                    "Regular updates with photos and progress reports"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-center space-x-3 text-gray-700 font-medium">
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-green-900 mb-4">What Our Investors Say</h2>
            <p className="text-gray-500 text-lg">Real stories from people who are growing their wealth with us</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Rajesh Kumar",
                role: "Investor since 2024",
                text: "I've been using Plant A Tree for 6 months now and have seen consistent returns. The best part is knowing I'm contributing to reforestation efforts while growing my savings.",
                initial: "R"
              },
              {
                name: "Priya Sharma",
                role: "Investor since 2024",
                text: "As someone who cares about the environment, Plant A Tree is the perfect platform for me. I'm earning returns while supporting a greener planet. The program is so fantastic!",
                initial: "P"
              },
              {
                name: "Amit Patel",
                role: "Investor since 2024",
                text: "The user interface is incredibly intuitive, and the returns are transparently displayed. I've recommended Plant A Tree to all my friends who want to start investing sustainably.",
                initial: "A"
              }
            ].map((t, idx) => (
              <div key={idx} className="p-8 bg-green-50/30 rounded-3xl border border-green-100">
                <div className="flex space-x-1 mb-6">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-gray-600 italic mb-8 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-600 text-white font-bold rounded-full flex items-center justify-center text-xl">
                    {t.initial}
                  </div>
                  <div>
                    <div className="font-bold text-green-900">{t.name}</div>
                    <div className="text-sm text-gray-400">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 bg-green-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-green-900 mb-4">Contact Us</h2>
              <p className="text-gray-500 text-lg">Have questions? We'd love to hear from you.</p>
            </div>

            <form onSubmit={handleContactSubmit} className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-green-100 space-y-6">
              <div>
                <label className="block text-sm font-bold text-green-900 mb-2">Name</label>
                <input 
                  type="text" 
                  required
                  value={contactForm.name}
                  onChange={e => setContactForm({...contactForm, name: e.target.value})}
                  placeholder="Your Name"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-green-900 mb-2">Email</label>
                <input 
                  type="email" 
                  required
                  value={contactForm.email}
                  onChange={e => setContactForm({...contactForm, email: e.target.value})}
                  placeholder="Your Email"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-green-900 mb-2">Message</label>
                <textarea 
                  rows={4}
                  required
                  value={contactForm.message}
                  onChange={e => setContactForm({...contactForm, message: e.target.value})}
                  placeholder="Your Message"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-all resize-none"
                ></textarea>
              </div>
              <motion.button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 transition-all shadow-lg shadow-green-200 flex items-center justify-center gap-2 disabled:opacity-70"
                whileHover={{ scale: 1.02, boxShadow: "0 15px 30px rgba(22, 163, 74, 0.3)" }}
                whileTap={{ scale: 0.98 }}
              >
                {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </motion.button>
            </form>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-green-800 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold mb-8">Ready to Start Your Investment Journey?</h2>
          <p className="text-xl text-green-100 mb-12">
            Join thousands of investors who are growing their wealth while making a positive environmental impact. Start with as little as ₹300.
          </p>
          <Link to="/signup">
            <motion.button 
              className="inline-flex px-10 py-5 bg-white text-green-800 font-bold rounded-2xl hover:bg-green-50 transition-all shadow-2xl"
              whileHover={{ scale: 1.05, boxShadow: "0 25px 50px rgba(0, 0, 0, 0.3)" }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started Today
            </motion.button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
