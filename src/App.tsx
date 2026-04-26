/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import React, { useEffect, useState, lazy, Suspense } from "react";
import { AnimatePresence } from "motion/react";
const SovereignRing = lazy(() => import("./components/SovereignRing"));
const SovereignGrid = lazy(() => import("./components/SovereignGrid"));

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }
} as const;
function TypewriterText() {
  const text1 = "Operating at the intersection of technology and capital";
  const text2 = "Exploring and building across digital systems, infrastructure and emerging technologies.";

  const [displayedText1, setDisplayedText1] = useState('');
  const [displayedText2, setDisplayedText2] = useState('');
  const [isTyping1, setIsTyping1] = useState(true);

  useEffect(() => {
    let i = 0;
    const typing1 = setInterval(() => {
      if (i < text1.length) {
        setDisplayedText1(text1.slice(0, i + 1));
        i++;
      } else {
        clearInterval(typing1);
        setIsTyping1(false);
      }
    }, 50);
    return () => clearInterval(typing1);
  }, []);

  useEffect(() => {
    if (!isTyping1) {
      let i = 0;
      const typing2 = setInterval(() => {
        if (i < text2.length) {
          setDisplayedText2(text2.slice(0, i + 1));
          i++;
        } else {
          clearInterval(typing2);
        }
      }, 40);
      return () => clearInterval(typing2);
    }
  }, [isTyping1]);

  return (
    <div className="flex flex-col items-center justify-center mt-20 px-4 text-center z-10 relative">
      <p className="text-gray-300 font-mono text-sm md:text-base tracking-wide mb-3">
        {displayedText1}
        {isTyping1 && <span className="animate-pulse border-r-2 border-[#edc2dc] ml-1">&nbsp;</span>}
      </p>
      
      {!isTyping1 && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-gray-400 font-mono text-[10px] md:text-sm tracking-wider md:tracking-widest max-w-2xl leading-relaxed"
        >
          {displayedText2}
          <span className="animate-pulse border-r-2 border-[#edc2dc] ml-1">&nbsp;</span>
        </motion.p>
      )}
    </div>
  );
}

function ZeroShiftPathfinder({ text, onComplete }: { text: string; onComplete: () => void }) {
  const [shadowCount, setShadowCount] = useState(0);
  const [mainCount, setMainCount] = useState(0);
  const fullLength = text.length;
  
  // Timing Config
  const shadowSpeed = 40; // ms
  const mainSpeed = 60;   // ms
  
  // Pass 1: Shadow Mapping
  useEffect(() => {
    const timer = setInterval(() => {
      setShadowCount(prev => {
        if (prev >= fullLength) {
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, shadowSpeed);
    return () => clearInterval(timer);
  }, [fullLength]);

  // Pass 2: Main Solidification (Starts after Shadow is 100%)
  useEffect(() => {
    if (shadowCount < fullLength) return;
    
    const timer = setInterval(() => {
      setMainCount(prev => {
        if (prev >= fullLength) {
          clearInterval(timer);
          onComplete();
          return prev;
        }
        return prev + 1;
      });
    }, mainSpeed);
    return () => clearInterval(timer);
  }, [shadowCount, fullLength, onComplete]);

  return (
    <div className="relative inline-flex items-center justify-center min-h-[1.3em]">
      {/* Space Reservation Layer (Invisible but occupies space to prevent shifting) */}
      <span className="invisible select-none pointer-events-none">
        {text}
        <span className="inline-block w-[2px] h-[0.72em] ml-2 bg-[#F5F1EB] translate-y-[-0.01em]" />
      </span>

      {/* Actual Animation Container */}
      <div className="absolute inset-0 flex items-center justify-start whitespace-nowrap overflow-visible">
        <div className="relative">
          {/* Shadow Pass Layer */}
          <span className="absolute left-0 top-0 text-[#4A3F4A] opacity-40 blur-[1px]">
            {text.slice(0, shadowCount)}
          </span>

          {/* Main Pass Layer */}
          <span className="relative text-[#F5F1EB]">
            {text.slice(0, mainCount)}
            {/* Persistent Blinking Caret */}
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="inline-block w-[2px] h-[0.72em] ml-2 bg-[#F5F1EB] translate-y-[-0.01em]"
            />
          </span>
        </div>
      </div>
    </div>
  );
}

const AntigravitKineticPoints = lazy(() => import("./components/AntigravitKineticPoints"));

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | null>(null);
  const [isHeadingComplete, setIsHeadingComplete] = useState(false);

  const [formState, setFormState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [formValues, setFormValues] = useState({ name: '', email: '', company: '', reason: '' });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (activeModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [activeModal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    

    const errors: { [key: string]: string } = {};
    if (!formValues.name) errors.name = "INPUT REQUIRED";
    if (!formValues.email) {
      errors.email = "INPUT REQUIRED";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email)) {
      errors.email = "INVALID PARAMETER";
    }
    if (!formValues.company) errors.company = "INPUT REQUIRED";
    if (!formValues.reason) errors.reason = "INPUT REQUIRED";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormState('submitting');

    try {
      const response = await fetch('/api/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formValues.name,
          email: formValues.email,
          company: formValues.company,
          reason: formValues.reason
        }),
      });

      if (!response.ok) {
        throw new Error('NETWORK RESPONSE NOT OK');
      }

      setFormState('success');
      // Auto-close after 2 seconds as requested
      setTimeout(() => {
        setIsModalOpen(false);
        setFormState('idle');
        setFormValues({ name: '', email: '', company: '', reason: '' });
      }, 2000);
    } catch (error) {
      console.error('Submission Error:', error);
      setFormState('error');
    }
  };

  const governanceContent = {
    privacy: {
      title: "Privacy Policy",
      content: "Hanlan Group Data Sovereignty Protocol: We enforce a zero-trust architecture. Personal data is never monetized. All information is processed within an encrypted sovereign infrastructure, ensuring technical proof of privacy and data integrity."
    },
    terms: {
      title: "Terms of Service",
      content: "Hanlan Group Institutional Standard: Unauthorized use, reproduction, or reverse engineering of this architecture or its insights is strictly prohibited. Use of this system constitutes acceptance of Hanlan Group governance standards. All IP belongs to Hanlan Group ltd."
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden w-full max-w-[100vw] bg-[#F5F1EB]" style={{ willChange: "scroll-position" }}>
       <header className="absolute top-0 left-0 w-full p-8 z-50 pointer-events-none">
        <div className="max-w-[1400px] mx-auto flex flex-wrap justify-center md:justify-between items-center h-full gap-4">
            <span className="font-serif text-[#F5F1EB] text-xl sm:text-2xl md:text-3xl tracking-[0.2em] md:tracking-[0.4em] pointer-events-auto whitespace-nowrap">
             H A N L A N &nbsp; G R O U P
            </span>
           
           <nav className="hidden md:flex items-center gap-10 pointer-events-auto">
             {[
               { name: "Ethos", id: "doctrine" },
               { name: "Capabilities", id: "capabilities" },
               { name: "Proof", id: "proof" },
               { name: "Contact", id: "contact" }
             ].map((link) => (
               <button
                 key={link.id}
                 aria-label={`Scroll to ${link.name}`}
                 onClick={() => document.getElementById(link.id)?.scrollIntoView({ behavior: 'smooth' })}
                  className="text-sm font-medium text-[#F5F1EB] transition-all duration-300 min-h-[44px] flex items-center active:opacity-70"
               >
                 {link.name}
               </button>
             ))}
           </nav>
        </div>
      </header>
       <section className="relative z-0 min-h-screen flex flex-col items-center justify-start px-6 text-center overflow-hidden bg-black pt-32 pb-20">
         <Suspense fallback={null}>
           <SovereignGrid />
         </Suspense>
         
         <div className="max-w-4xl w-full flex flex-col items-center relative z-10">
          <div className="heading-serif text-4xl md:text-6xl lg:text-7xl mb-0 uppercase tracking-tight min-h-[1.3em] flex items-center justify-center text-[#F5F1EB] text-balance">
            <ZeroShiftPathfinder 
              text="Systemic Precision." 
              onComplete={() => setIsHeadingComplete(true)} 
            />
          </div>

          <div className="w-[700px] max-w-[85%] h-[400px] md:h-[500px] mx-auto mt-6 mb-2 block">
            <AnimatePresence>
              {isHeadingComplete && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1.0, ease: "easeOut" }}
                  className="w-full h-full"
                >
                  <Suspense fallback={null}>
                    <SovereignRing />
                  </Suspense>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="text-[#E5E5E5] text-base md:text-xl lg:text-2xl max-w-3xl mx-auto leading-relaxed md:leading-relaxed font-light mb-8">
            Hanlan Group architects high-performance systems where data-driven clarity meets human intent. 
            We translate complex behavioural patterns into meaningful, actionable insights, building the 
            next generation of consumer infrastructure for <span className="font-medium text-white">global users.</span>
          </p>
          <motion.button 
            aria-label="Start Project with Hanlan Group"
            className="px-12 h-12 flex items-center justify-center border border-white/40 hover:border-white text-white/60 hover:text-white transition-all duration-500 uppercase tracking-[0.3em] text-[10px] font-semibold mx-auto active:opacity-70 bg-transparent"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Send enquiry
          </motion.button>
        </div>
        
        <motion.div 
          className="absolute bottom-10"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="text-brand-label w-5 h-5" />
        </motion.div>
      </section>
      <section id="doctrine" className="pt-20 pb-32 md:pt-24 md:pb-48 px-6 bg-[#F5F1EB]">
        <div className="max-w-6xl mx-auto text-center">
          <motion.span className="label-caps mb-12 block" {...fadeIn}>
            The Ethos
          </motion.span>
          <motion.h2 
            className="heading-serif text-4xl md:text-6xl lg:text-7xl mb-12 max-w-5xl mx-auto"
            {...fadeIn}
            transition={{ ...fadeIn.transition, delay: 0.2 }}
          >
            Precision through alignment. Clarity through subtraction.
          </motion.h2>
          <motion.p 
            className="text-brand-muted text-lg md:text-xl max-w-3xl mx-auto leading-relaxed"
            {...fadeIn}
            transition={{ ...fadeIn.transition, delay: 0.4 }}
          >
            In an era of hyper-complexity, the ultimate authority is the refined intent. 
            We build for those who prioritise impact over noise, architecture over assembly, 
            and leadership over dependency.
          </motion.p>
        </div>
      </section>
      <section id="capabilities" className="pt-12 pb-32 md:pt-20 md:pb-48 px-6 bg-[#F5F1EB]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-12 mb-12">
            <motion.span className="label-caps whitespace-nowrap text-[#1A1A1A]" {...fadeIn}>
              Core Capabilities
            </motion.span>
            <div className="h-px w-full bg-black/10" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 lg:gap-24">
            {[
              {
                title: "Neural Strategy",
                desc: "Developing intuitive tools that empower individuals to navigate complex choices with ease and precision."
              },
              {
                title: "Symbiotic Design",
                desc: "Mining clarity from complexity. We build analytical engines that transform raw information into actionable insight."
              },
              {
                title: "Infrastructural Intelligence",
                desc: "Architecting the next generation of consumer infrastructure. Scalable, high-impact solutions for modern growth."
              }
            ].map((item, idx) => (
              <motion.div 
                key={item.title} 
                className="space-y-8"
                {...fadeIn}
                transition={{ ...fadeIn.transition, delay: idx * 0.2 }}
              >
                <h3 className="heading-serif text-3xl md:text-4xl text-[#1A1A1A]">{item.title}</h3>
                <p className="text-[#4A4A4A] leading-relaxed font-light text-lg">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <section id="proof" className="py-20 md:py-32 px-6 bg-[#050505] overflow-hidden relative">
        <div className="absolute inset-0 z-0">
          <Suspense fallback={null}>
            <AntigravitKineticPoints />
          </Suspense>
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 md:gap-24 items-center">
            <div className="lg:col-span-12 space-y-12">
              <div className="space-y-8">
                <motion.span className="label-caps text-white/40" {...fadeIn}>
                  Technical Proof
                </motion.span>
                <motion.h2 
                  className="heading-serif text-5xl md:text-6xl lg:text-7xl leading-[1.1] tracking-tight text-white"
                  {...fadeIn}
                >
                  Engineering the <br className="hidden md:block" />
                  Future of Human <br className="hidden md:block" />
                  <span className="text-white/30 italic font-light italic-serif-font">Satisfaction.</span>
                </motion.h2>
              </div>
              <div className="space-y-12 max-w-2xl">
                <motion.p 
                  className="text-white/60 text-lg md:text-xl leading-relaxed font-light"
                  {...fadeIn}
                >
                  Hanlan Group is dedicated to redefining the human-tech interface. We prioritise 
                  systemic precision—ensuring every neural node serves a primary human benefit. 
                  This is the sovereign standard for the next generation of technological integration.
                </motion.p>
                <motion.div 
                  className="pt-12 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6"
                  {...fadeIn}
                >
                  <span className="label-caps text-[11px] italic !tracking-[0.4em] text-white/30">Sovereign Data Infrastructure // Hanlan Group</span>
                  <div className="flex gap-3">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-white"
                        animate={{ opacity: [0.2, 1, 0.2] }}
                        transition={{
                          duration: 1.2,
                          repeat: Infinity,
                          delay: i * 0.2,
                          ease: "easeInOut"
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
          <div className="mt-20">
            <TypewriterText />
          </div>
        </div>
      </section>
      <main className="flex-grow">
      <section id="contact" className="pt-48 pb-20 px-6 bg-[#F5F1EB] border-t border-black/5 flex flex-col items-center">
        <div className="max-w-7xl mx-auto space-y-16 w-full flex-grow flex flex-col justify-center">
          <div className="flex flex-col items-center justify-center text-center max-w-4xl mx-auto">
            <motion.div className="space-y-4" {...fadeIn}>
              <div className="space-y-2">
                <h2 className="label-caps text-lg md:text-xl tracking-[0.4em] text-black italic">Hanlan Group</h2>
                <h1 className="heading-serif text-3xl md:text-5xl lg:text-[90px] tracking-tighter leading-tight text-balance">
                  Connect with <span className="text-black/80">us</span>
                </h1>
              </div>
              <hr className="w-12 border-t-[0.5px] border-black/20 mx-auto my-8" />
              <div className="max-w-2xl mx-auto">
                <p className="text-brand-muted text-base md:text-lg font-light leading-relaxed tracking-wide mb-10">
                  For partnerships, global institutional enquiries, or technical proof audits. 
                  Our team responds to qualified queries within 24 hours.
                </p>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="px-12 py-5 bg-black text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-none hover:bg-zinc-800 transition-all duration-500 ease-in-out active:opacity-70 shadow-2xl"
                >
                  Send enquiry
                </button>
              </div>
            </motion.div>
          </div>

          <AnimatePresence>
            {isModalOpen && (
              <div 
                className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-transparent"
                onClick={() => setIsModalOpen(false)}
              >
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="bg-[#F5F1EB] max-w-[460px] w-full p-8 md:p-12 rounded-2xl shadow-2xl relative border border-black/5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    aria-label="Close contact modal"
                    className="absolute top-6 right-6 text-black/20 hover:text-black transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>

                  <div className="mb-6 text-center md:text-left">
                    <h2 className="heading-serif text-2xl text-black mt-1">Business Enquiries</h2>
                  </div>

                  {formState === 'success' ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-8 py-12 text-center"
                    >
                      <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-8">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      <p className="heading-serif text-xl text-black leading-relaxed italic">
                        "Thank you for your enquiry. We will get back to you shortly."
                      </p>
                    </motion.div>
                  ) : formState === 'error' ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-8 py-12 text-center"
                    >
                      <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-8">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </div>
                      <p className="heading-serif text-xl text-red-600 leading-relaxed italic">
                        "Something went wrong. Please try again."
                      </p>
                      <button 
                        onClick={() => setFormState('idle')}
                        className="text-[10px] font-black uppercase tracking-widest text-black/40 hover:text-black transition-colors"
                      >
                        RETRY MISSION
                      </button>
                    </motion.div>
                  ) : (
                    <form className="space-y-3" onSubmit={handleSubmit}>
                      <div className="space-y-1">
                        <label className="block text-[8px] font-black uppercase tracking-widest text-black/30 pl-1">Name</label>
                        <input 
                          type="text" 
                          value={formValues.name}
                          onChange={(e) => setFormValues({...formValues, name: e.target.value})}
                          placeholder="Your name"
                          className={`w-full h-10 px-4 py-2 rounded-xl border ${formErrors.name ? 'border-red-500' : 'border-black/10'} bg-white/50 text-black text-xs focus:outline-none focus:border-black/20 transition-all placeholder:text-black/20`}
                        />
                        {formErrors.name && <span className="text-[8px] text-red-500 font-bold tracking-tighter pl-1">{formErrors.name}</span>}
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[8px] font-black uppercase tracking-widest text-black/30 pl-1">Email</label>
                        <input 
                          type="email" 
                          value={formValues.email}
                          onChange={(e) => setFormValues({...formValues, email: e.target.value})}
                          placeholder="your@domain.com"
                          className={`w-full h-10 px-4 py-2 rounded-xl border ${formErrors.email ? 'border-red-500' : 'border-black/10'} bg-white/50 text-black text-xs focus:outline-none focus:border-black/20 transition-all placeholder:text-black/20`}
                        />
                        {formErrors.email && <span className="text-[8px] text-red-500 font-bold tracking-tighter pl-1">{formErrors.email}</span>}
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[8px] font-black uppercase tracking-widest text-black/30 pl-1">Company</label>
                        <input 
                          type="text" 
                          value={formValues.company}
                          onChange={(e) => setFormValues({...formValues, company: e.target.value})}
                          placeholder="Company (optional)"
                          className="w-full h-10 px-4 py-2 rounded-xl border border-black/10 bg-white/50 text-black text-xs focus:outline-none focus:border-black/20 transition-all placeholder:text-black/20"
                        />
                      </div>

                      <div className="space-y-1 relative">
                        <label className="block text-[8px] font-black uppercase tracking-widest text-black/30 pl-1">Reason</label>
                        <div className="relative">
                          <select 
                            value={formValues.reason}
                            onChange={(e) => setFormValues({...formValues, reason: e.target.value})}
                            className={`w-full h-10 px-4 py-2 rounded-xl border ${formErrors.reason ? 'border-red-500' : 'border-black/10'} bg-white/50 text-black/60 text-xs focus:outline-none focus:border-black/20 transition-all appearance-none cursor-pointer`}
                          >
                            <option value="" disabled hidden>Select Reason</option>
                            <option value="institutions">Global Access</option>
                            <option value="partnership">Technical Partnership</option>
                            <option value="investment">Strategic Investment</option>
                            <option value="other">Other Enquiries</option>
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/30 pointer-events-none" />
                        </div>
                        {formErrors.reason && <span className="text-[8px] text-red-500 font-bold tracking-tighter pl-1">{formErrors.reason}</span>}
                      </div>

                      <button 
                        type="submit"
                        disabled={formState === 'submitting'}
                        className="w-full h-12 mt-2 rounded-xl bg-black text-white font-serif italic text-xs tracking-widest hover:bg-zinc-900 active:opacity-70 transition-all duration-300 disabled:opacity-50 shadow-xl shadow-black/10"
                      >
                        {formState === 'submitting' ? 'SENDING...' : 'SEND ENQUIRY'}
                      </button>
                    </form>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <footer className="py-20 px-6 bg-[#050505] border-t border-white/5 flex flex-col items-center">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 items-start w-full">
            <div className="space-y-4">
              <span className="label-caps !text-[12px] font-semibold tracking-[0.4em] opacity-40 uppercase text-[#F5F1EB]">ADDRESS</span>
              <div className="space-y-1 font-serif text-xs sm:text-sm text-[#F5F1EB]/70 italic leading-tight break-words">
                <p>HANLAN GROUP Ltd</p>
                <p>3RD FLOOR</p>
                <p>45 ALBEMARLE STREET, MAYFAIR</p>
                <p>LONDON</p>
                <p>W1S 4JL GB</p>
              </div>
            </div>

            <div className="space-y-4">
              <span className="label-caps !text-[12px] font-semibold tracking-[0.4em] opacity-40 uppercase text-[#F5F1EB]">Governance</span>
              <div className="flex flex-col font-serif text-sm italic text-[#F5F1EB]/80">
                <button 
                  onClick={() => setActiveModal('privacy')}
                  aria-label="View Privacy Policy"
                  className="text-left underline decoration-white/10 hover:decoration-white transition-all active:opacity-70 py-2"
                >
                  Privacy Policy
                </button>
                <button 
                  onClick={() => setActiveModal('terms')}
                  aria-label="View Terms of Service"
                  className="text-left underline decoration-white/10 hover:decoration-white transition-all active:opacity-70 py-2"
                >
                  Terms of Service
                </button>
              </div>
            </div>

            <div className="space-y-2 flex flex-col items-start md:items-end">
              <span className="label-caps !text-[12px] font-semibold tracking-[0.4em] opacity-40 uppercase text-[#F5F1EB]">Leadership</span>
              <div className="space-y-0.5 flex flex-col items-start md:items-end font-serif text-xs sm:text-sm text-[#F5F1EB]/70 italic">
                <span className="uppercase">CEO TESS HAN</span>
                <span className="uppercase">CTO DONGGYUN HAN</span>
                <span className="font-sans text-[12px] uppercase tracking-[0.4em] mt-2 opacity-50 not-italic">© 2026 HANLAN GROUP</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
      </main>


      {activeModal && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
          onClick={() => setActiveModal(null)}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white max-w-2xl w-full p-10 md:p-16 rounded-[40px] shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setActiveModal(null)}
              aria-label="Close governance modal"
              className="absolute top-8 right-8 text-black/40 hover:text-black transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center active:opacity-70"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <div className="space-y-10">
              <div className="space-y-4">
                <span className="label-caps text-brand-label">Governance Protocol</span>
                <h2 className="heading-serif text-4xl md:text-5xl">{governanceContent[activeModal].title}</h2>
              </div>
              <div className="h-px w-full bg-black/5" />
              <p className="text-brand-muted text-lg md:text-xl leading-relaxed font-light italic-serif-font italic">
                {governanceContent[activeModal].content}
              </p>
              <div className="pt-6">
                <button 
                  onClick={() => setActiveModal(null)}
                  aria-label="Acknowledge governance protocol"
                  className="px-10 py-4 bg-black text-white rounded-2xl text-xs font-semibold uppercase tracking-[0.2em] hover:bg-zinc-900 active:opacity-70 transition-all min-h-[44px]"
                >
                  Acknowledged
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      
    </div>
  );
}
