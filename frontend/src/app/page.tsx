"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Shield, Award, Zap, Code, Sparkles, Star, ChevronDown } from "lucide-react";

const personalities = [
  {
    name: "Albert Einstein",
    title: "The Visionary",
    quote: "Imagination is more important than knowledge.",
    image: "/images/personalities/einstein.png",
    color: "from-purple-500/20 to-transparent"
  },
  {
    name: "Marie Curie",
    title: "The Pioneer",
    quote: "Nothing in life is to be feared, it is only to be understood.",
    image: "/images/personalities/curie.png",
    color: "from-blue-500/20 to-transparent"
  },
  {
    name: "APJ Abdul Kalam",
    title: "The Dreamer",
    quote: "Dream, dream, dream. Dreams transform into thoughts.",
    image: "/images/personalities/kalam.png",
    color: "from-emerald-500/20 to-transparent"
  },
  {
    name: "Elon Musk",
    title: "The Futurist",
    quote: "When something is important enough, you do it.",
    image: "/images/personalities/musk.png",
    color: "from-amber-500/20 to-transparent"
  }
];

export default function Home() {
  const { scrollYProgress } = useScroll();
  const yRange = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <main className="flex min-h-screen flex-col items-center bg-[#050505] overflow-x-hidden">
      {/* Decorative Lights */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#8b5cf6]/20 blur-[120px] rounded-full -z-10" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#0ea5e9]/20 blur-[120px] rounded-full -z-10" />

      {/* Hero Section */}
      <section className="relative min-h-screen w-full flex flex-col items-center justify-center text-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 space-y-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border-indigo-500/20 animate-pulse">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">Next-Gen Assessment Suite</span>
          </div>

          <h1 className="text-5xl md:text-8xl font-black tracking-tight leading-none">
            Unleash Your <br />
            <span className="gradient-text">Greatness</span>
          </h1>

          <p className="text-gray-400 text-lg md:text-2xl max-w-3xl mx-auto leading-relaxed font-medium">
            Join the world's most advanced examination platform. 
            Secure, intelligent, and designed to push the boundaries of potential.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 mt-12 justify-center">
            <Link href="/auth/login" className="btn-primary flex items-center gap-3 text-lg px-10 group">
              Start Your Journey <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/auth/login" className="btn-neon text-lg px-10">
              Live Features
            </Link>
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30"
        >
          <span className="text-[10px] uppercase font-black tracking-[0.3em] text-gray-500">Inspire</span>
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </section>

      {/* Inspired by Excellence Section */}
      <section className="max-w-7xl w-full py-32 px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-black mb-6">Inspired by <span className="text-indigo-500">Excellence</span></h2>
          <p className="text-gray-500 max-w-xl mx-auto">Learn from the minds that redefined the impossible. Our platform is built on the pursuit of greatness.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {personalities.map((p, i) => (
            <motion.div 
              key={p.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className={`glass-panel p-6 group hover:border-white/20 transition-all flex flex-col bg-gradient-to-b ${p.color}`}
            >
              <div className="relative w-full aspect-square mb-6 overflow-hidden rounded-2xl">
                 <img 
                    src={p.image} 
                    alt={p.name} 
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 transform group-hover:scale-110"
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
              </div>
              <h3 className="text-xl font-black mb-1 group-hover:text-indigo-400 transition-colors">{p.name}</h3>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">{p.title}</p>
              <p className="text-sm text-gray-400 italic leading-relaxed">"{p.quote}"</p>
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-tighter">Icon of Innovation</span>
                <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Modern Features Grid */}
      <section className="max-w-7xl w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-32 px-6">
        {[
          { icon: <Shield className="w-8 h-8 text-emerald-400"/>, title: "Fortress Security", desc: "Anti-cheat tab monitoring and AI-powered proctoring." },
          { icon: <Zap className="w-8 h-8 text-amber-400"/>, title: "Nano-Sync", desc: "Server-side timers and 3-second recovery logic." },
          { icon: <Code className="w-8 h-8 text-indigo-400"/>, title: "Coding IDE", desc: "Vibrant VS Code style editor with multi-language support." },
          { icon: <Award className="w-8 h-8 text-purple-400"/>, title: "Premium Result", desc: "Stunning PDF certificates and depth-score analytics." }
        ].map((f, i) => (
          <motion.div 
            key={i}
            className="glass-card p-8 group relative overflow-hidden"
            whileHover={{ y: -10 }}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-bl-full -mr-10 -mt-10 group-hover:bg-white/10 transition-colors" />
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-8 border border-white/5 group-hover:border-indigo-500/30 transition-all">
              {f.icon}
            </div>
            <h3 className="text-xl font-bold mb-4">{f.title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </section>

      {/* CTA Section */}
      <section className="max-w-5xl w-full py-32 px-6 text-center">
        <div className="glass-panel p-16 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-indigo-500/5 blur-[100px] pointer-events-none" />
          <h2 className="text-4xl font-black mb-8 leading-tight">Prepare Your Students for <br />the <span className="gradient-text">Modern Era</span></h2>
          <Link href="/auth/login" className="btn-primary inline-flex items-center gap-3">
            Get Infinite Access <Sparkles className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-10 border-t border-white/5 text-center text-gray-600 text-[10px] font-bold uppercase tracking-[0.4em]">
        &copy; 2026 ExamPro Assessment Suite • Powered by Innovation
      </footer>
    </main>
  );
}
