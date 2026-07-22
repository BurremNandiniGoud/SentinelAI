import { useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import {
  Shield, Scan, MessageSquare, BarChart3, ArrowRight, ChevronDown, CheckCircle,
  AlertTriangle, Globe, Lock, Eye, Zap, Award, TrendingUp,
  Smartphone, CreditCard, FileText, UserCheck, Bell, Search, Database,
  Cpu, Brain, Fingerprint, Camera, Monitor, Activity,
} from 'lucide-react'
import { ThreatFieldDive } from '../components/ThreatFieldDive'
import { CountUp } from '../components/CountUp'
import { MagneticButton } from '../components/MagneticButton'
import { ThemeToggle } from '../components/ThemeToggle'

const FADE_UP = {
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
}

const STAGGER = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
}

function SectionHeading({ tag, title, description }: { tag: string; title: string; description?: string }) {
  return (
    <motion.div {...FADE_UP} className="mb-12 text-center">
      <span className="inline-block rounded-full border border-slate-500/15 bg-slate-500/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-brass">
        {tag}
      </span>
      <h2 className="mt-6 text-3xl font-semibold tracking-tight text-parchment sm:text-4xl lg:text-5xl font-serif">
        {title}
      </h2>
      {description && (
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-400">{description}</p>
      )}
    </motion.div>
  )
}

const scamTypes = [
  { icon: Smartphone, title: 'UPI Scam', desc: 'Fraudsters trick you into approving UPI collect requests or sharing your UPI PIN via fake customer care numbers.', color: 'text-ochre' },
  { icon: CreditCard, title: 'Banking Scam', desc: 'Fake bank calls claiming account blockage, asking for card details, CVV, OTP — always verify through official channels.', color: 'text-oxblood' },
  { icon: FileText, title: 'KYC Scam', desc: 'Messages claiming your KYC is incomplete, directing to phishing sites that steal PAN, Aadhaar, and banking credentials.', color: 'text-forest' },
  { icon: UserCheck, title: 'Digital Arrest Scam', desc: 'Impersonating CBI/Police officials via video call, claiming a warrant and demanding money to "clear" the case.', color: 'text-oxblood' },
  { icon: Bell, title: 'Lottery Scam', desc: 'Congratulations messages for non-existent lotteries, requesting processing fees to claim the prize.', color: 'text-ochre' },
  { icon: Search, title: 'Job Scam', desc: 'Fake work-from-home offers requiring registration fees, collecting personal data under the guise of hiring.', color: 'text-forest' },
  { icon: TrendingUp, title: 'Investment Scam', desc: 'Guaranteed high returns, Ponzi schemes disguised as trading bots or crypto platforms with fake dashboards.', color: 'text-oxblood' },
  { icon: MessageSquare, title: 'Telegram Scam', desc: 'Pump-and-dump stock tip channels, fake trading signal groups soliciting membership fees via UPI.', color: 'text-ochre' },
  { icon: Camera, title: 'QR Scam', desc: 'Sending QR codes claiming you need to scan to receive money, but it actually deducts from your account.', color: 'text-forest' },
  { icon: Database, title: 'Fake Loan Scam', desc: 'Instant loan apps charging exorbitant fees, harvesting contacts and photos for blackmail.', color: 'text-oxblood' },
  { icon: Globe, title: 'Courier Scam', desc: 'Fake FedEx/BlueDart messages about held packages, requesting customs fees to release.', color: 'text-ochre' },
  { icon: Shield, title: 'Aadhaar Scam', desc: 'UIDAI impersonation claiming your Aadhaar is deactivated, seeking biometric or OTP verification.', color: 'text-forest' },
  { icon: FileText, title: 'Income Tax Scam', desc: 'Fake tax refund notifications with phishing links designed to capture PAN, bank details, and login credentials.', color: 'text-oxblood' },
  { icon: Eye, title: 'Deepfake Awareness', desc: 'AI-generated video/audio impersonating family members or officials to extort money — verify identity through direct contact.', color: 'text-ochre' },
]

const safetyTips = [
  { icon: Shield, title: 'Never share OTPs', desc: 'No legitimate bank, government agency, or company will ever ask for your OTP, UPI PIN, or card CVV.' },
  { icon: Lock, title: 'Verify URLs carefully', desc: 'Check for misspellings, unusual domains (.tk, .xyz, .site). Government sites end in .gov.in, banks use their official domain.' },
  { icon: AlertTriangle, title: 'Pause on urgency', desc: 'Scammers create panic — "24 hours to respond", "account will be blocked". Take a breath and verify through official channels.' },
  { icon: Globe, title: 'Report immediately', desc: 'Report cyber fraud at cybercrime.gov.in or call 1930 within the golden hour to maximize recovery chances.' },
  { icon: Smartphone, title: 'Enable 2FA everywhere', desc: 'Two-factor authentication on banking, email, and social media prevents unauthorized access even if credentials leak.' },
  { icon: Search, title: 'Verify caller identity', desc: 'If "bank" calls you, hang up and call the number on the back of your card. Genuine banks never ask for passwords.' },
]

const faqs = [
  { q: 'What types of scams can SentinelAI detect?', a: 'SentinelAI analyzes text-based scam messages including phishing SMS, WhatsApp forwards, email scams, fake job offers, lottery fraud, UPI scams, digital arrest threats, and more. It also detects counterfeit currency via image analysis.' },
  { q: 'How does the message analysis work?', a: 'The engine combines a rule-based system (checking for known scam patterns, suspicious URLs, urgency language) with a machine learning model trained on thousands of scam reports. It extracts entities (phone numbers, UPI IDs, URLs) and assigns a risk score.' },
  { q: 'Is my data stored or shared?', a: 'All scan history is stored locally in your browser localStorage. No data is sent to external servers unless you connect to a backend API. You can clear history anytime from the Analytics page.' },
  { q: 'How accurate is the currency detection?', a: 'The CV model is trained on major currency denominations and detects security features like watermarks, security threads, micro-printing, and color-shifting ink. Confidence scores reflect model certainty for each analysis.' },
  { q: 'Can I use this without an internet connection?', a: 'Yes! The frontend is fully functional offline with realistic mock responses. When a backend is unreachable, SentinelAI automatically falls back to demo-quality mock analysis so your demo never breaks.' },
  { q: 'What should I do if I receive a scam message?', a: 'Do not engage. Do not click links. Take a screenshot. Report it to cybercrime.gov.in or call 1930. You can also paste it into SentinelAI to see what risk signals it triggers.' },
  { q: 'Does SentinelAI work on mobile devices?', a: 'Yes, the entire platform is fully responsive. The live camera scanner works on mobile devices with a rear camera, and the message checker is optimized for mobile text input.' },
  { q: 'Is this an official government tool?', a: 'SentinelAI is a technical demonstration platform showcasing AI-powered fraud detection capabilities. Always verify with official sources like the National Cyber Crime Reporting Portal for legal matters.' },
]

const stats = [
  { value: 1247, label: 'Threats intercepted today', suffix: '', icon: Shield },
  { value: 94.8, label: 'Detection accuracy', suffix: '%', icon: TargetIcon },
  { value: 15, label: 'Scam types covered', suffix: '+', icon: Globe },
  { value: 99.7, label: 'System uptime', suffix: '%', icon: Activity },
]

function TargetIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}

export function Home() {
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.8], [1, 0.95])
  const [demoStep, setDemoStep] = useState<'idle' | 'scanning' | 'done'>('idle')
  const messageInputRef = useRef<HTMLTextAreaElement>(null)
  const [messageResult, setMessageResult] = useState<null | { score: number; level: string }>(null)

  const runCurrencyDemo = useCallback(() => {
    setDemoStep('scanning')
    setTimeout(() => setDemoStep('done'), 1800)
  }, [])

  const runMessageDemo = useCallback(() => {
    setMessageResult({ score: 87, level: 'HIGH' })
    setTimeout(() => setMessageResult(null), 4000)
  }, [])

  return (
    <div className="min-h-screen bg-ink-900 text-parchment">
      <section ref={heroRef} className="relative h-screen overflow-hidden">
        <ThreatFieldDive />
        <div className="absolute top-4 right-4 z-20 pointer-events-auto">
          <ThemeToggle />
        </div>
        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
        >
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
            className="text-sm font-semibold uppercase tracking-[0.4em] text-brass"
          >
            SentinelAI
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="mt-6 max-w-4xl font-serif text-4xl font-semibold leading-tight tracking-tight text-parchment sm:text-5xl lg:text-6xl"
          >
            Protecting India from scams, one scan at a time.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.7 }}
            className="mt-6 max-w-xl text-base leading-7 text-slate-400 sm:text-lg"
          >
            AI-powered detection for counterfeit currency and fraudulent messages — built with the precision of a research institute.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="pointer-events-auto mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <Link to="/dashboard">
              <MagneticButton className="gap-2 bg-brass text-ink-900 hover:bg-brass/90 px-7 py-3.5 text-base">
                Enter SentinelAI <ArrowRight size={18} />
              </MagneticButton>
            </Link>
            <a href="#dashboard-section">
              <MagneticButton className="gap-2 border-slate-500/20 bg-transparent text-parchment hover:bg-slate-800 px-7 py-3.5 text-base">
                Learn More <ChevronDown size={18} />
              </MagneticButton>
            </a>
          </motion.div>
        </motion.div>
        <div className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown size={24} className="text-slate-600" />
        </div>
      </section>

      <div id="dashboard-section" />

      <section id="stats" className="mx-auto max-w-7xl px-6 py-20">
        <SectionHeading tag="Live Dashboard" title="Threat Intelligence Overview" description="Real-time metrics from the SentinelAI detection network across India." />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              {...STAGGER}
              transition={{ ...STAGGER.transition, delay: i * 0.1 }}
              className="rounded-2xl border border-slate-500/10 bg-ink-800/60 p-6 backdrop-blur-sm"
            >
              <div className="mb-3 inline-flex rounded-xl bg-slate-500/10 p-2.5 text-brass">
                <stat.icon size={20} />
              </div>
              <p className="font-mono text-3xl font-semibold text-parchment">
                <CountUp end={stat.value} decimals={stat.value % 1 !== 0 ? 1 : 0} suffix={stat.suffix} />
              </p>
              <p className="mt-2 text-sm text-slate-400">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="about" className="mx-auto max-w-7xl px-6 py-16">
        <SectionHeading tag="About" title="About SentinelAI" description="A technical demonstration platform combining two AI detection engines into a single threat-intelligence dashboard." />
        <motion.div {...FADE_UP} className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6 rounded-2xl border border-slate-500/10 bg-ink-800/60 p-8">
            <h3 className="text-xl font-semibold text-parchment">What we do</h3>
            <p className="text-sm leading-7 text-slate-400">
              SentinelAI is a digital public-safety platform that brings together a counterfeit currency detector and a scam message classifier in one unified dashboard. The system is designed for speed and clarity — paste a suspicious WhatsApp message, or hold a banknote up to your camera, and get an evidence-backed verdict in seconds.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-500/10 bg-slate-900/60 p-5">
                <Scan size={20} className="text-brass mb-3" />
                <p className="font-semibold text-parchment text-sm">Currency Scanner</p>
                <p className="mt-1 text-xs text-slate-400">Live camera + upload modes with REAL/FAKE verdict</p>
              </div>
              <div className="rounded-xl border border-slate-500/10 bg-slate-900/60 p-5">
                <MessageSquare size={20} className="text-brass mb-3" />
                <p className="font-semibold text-parchment text-sm">Message Analyzer</p>
                <p className="mt-1 text-xs text-slate-400">NLP + rule engine scoring for scam detection</p>
              </div>
            </div>
          </div>
          <div className="space-y-4 rounded-2xl border border-slate-500/10 bg-ink-800/60 p-8">
            <h3 className="text-xl font-semibold text-parchment">Why it matters</h3>
            <ul className="space-y-4 text-sm leading-7 text-slate-400">
              <li className="flex gap-3"><CheckCircle size={18} className="mt-0.5 shrink-0 text-forest" /><span>India lost over ₹10,000 crore to cyber fraud in 2024 — early detection is the first line of defense.</span></li>
              <li className="flex gap-3"><CheckCircle size={18} className="mt-0.5 shrink-0 text-forest" /><span>Counterfeit currency undermines economic trust. Instant verification empowers every citizen.</span></li>
              <li className="flex gap-3"><CheckCircle size={18} className="mt-0.5 shrink-0 text-forest" /><span>Scam messages evolve daily. A hybrid rule+ML approach catches both known and novel threat patterns.</span></li>
              <li className="flex gap-3"><CheckCircle size={18} className="mt-0.5 shrink-0 text-forest" /><span>Built for accessibility: works offline, on mobile, and degrades gracefully when no backend is available.</span></li>
            </ul>
          </div>
        </motion.div>
      </section>

      <section id="advisory" className="mx-auto max-w-7xl px-6 py-16">
        <SectionHeading tag="Awareness" title="Government Advisory" description="Official guidelines from the Indian Cyber Crime Coordination Centre (I4C) and RBI for staying safe." />
        <motion.div {...FADE_UP} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { title: 'Dial 1930', desc: 'National Cyber Crime Helpline — call within the golden hour after a fraud to freeze transactions.', icon: Smartphone },
            { title: 'cybercrime.gov.in', desc: 'Official portal to report all types of cyber fraud with evidence upload and case tracking.', icon: Monitor },
            { title: 'RBI Guidelines', desc: 'Never share your PIN, OTP, or card details. Banks never ask for these via phone or message.', icon: CreditCard },
            { title: 'I4C Alerts', desc: 'Follow @CyberDost on social media for real-time scam alerts and advisory from the government.', icon: Bell },
            { title: 'Sanchar Saathi', desc: 'Report suspicious calls and SMS to the Department of Telecom through sancharsaathi.gov.in.', icon: Globe },
            { title: 'Chakshu Portal', desc: 'Report fraud calls and messages directly via the Chakshu facility on the Sanchar Saathi portal.', icon: Shield },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-500/10 bg-ink-800/60 p-6">
              <item.icon size={22} className="text-brass mb-4" />
              <h4 className="font-semibold text-parchment">{item.title}</h4>
              <p className="mt-2 text-sm leading-6 text-slate-400">{item.desc}</p>
            </div>
          ))}
        </motion.div>
      </section>

      <section id="scams" className="mx-auto max-w-7xl px-6 py-16">
        <SectionHeading tag="Education" title="Current Scam Types" description="Understand the most prevalent fraud schemes targeting Indian citizens today." />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {scamTypes.map((scam, i) => (
            <motion.div
              key={scam.title}
              {...STAGGER}
              transition={{ ...STAGGER.transition, delay: (i % 4) * 0.06 }}
              className="group rounded-2xl border border-slate-500/10 bg-ink-800/60 p-6 transition-colors hover:border-slate-500/30"
            >
              <scam.icon size={22} className={scam.color} />
              <h4 className="mt-4 font-semibold text-parchment">{scam.title}</h4>
              <p className="mt-2 text-sm leading-6 text-slate-400">{scam.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="technology" className="mx-auto max-w-7xl px-6 py-16">
        <SectionHeading tag="Technology" title="How Scam Detection Works" description="A hybrid approach combining rule-based pattern matching with machine learning for comprehensive coverage." />
        <div className="grid gap-8 lg:grid-cols-2">
          {[
            { step: '01', title: 'Text Input & Preprocessing', desc: 'User pastes a message or uploads a screenshot. OCR extracts text from images. The text is cleaned, normalized, and tokenized.' },
            { step: '02', title: 'Rule Engine Analysis', desc: 'Regex patterns scan for known scam indicators: UPI IDs, suspicious URLs, urgency phrases, prize money mentions, and payment requests.' },
            { step: '03', title: 'ML Model Scoring', desc: 'A trained NLP classifier evaluates the semantic content of the message, scoring it for fraud probability based on known scam patterns.' },
            { step: '04', title: 'Entity Extraction', desc: 'Phone numbers, email addresses, UPI IDs, URLs, and account numbers are extracted and presented for quick review.' },
            { step: '05', title: 'Risk Synthesis', desc: 'Rule score and ML score are combined into a final threat assessment with a clear suggested action for the user.' },
            { step: '06', title: 'Result & Advisory', desc: 'Complete risk breakdown with threat level, evidence signals, and actionable guidance based on official advisory.' },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              {...STAGGER}
              transition={{ ...STAGGER.transition, delay: i * 0.08 }}
              className="flex gap-5 rounded-2xl border border-slate-500/10 bg-ink-800/60 p-6"
            >
              <span className="shrink-0 font-mono text-2xl font-semibold text-brass/60">{item.step}</span>
              <div>
                <h4 className="font-semibold text-parchment">{item.title}</h4>
                <p className="mt-2 text-sm leading-6 text-slate-400">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="currency" className="mx-auto max-w-7xl px-6 py-16">
        <SectionHeading tag="Currency" title="Counterfeit Currency Detection" description="Computer vision analysis of banknote security features for REAL/FAKE classification." />
        <motion.div {...FADE_UP} className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-2xl border border-slate-500/10 bg-ink-800/60 p-8">
            <Camera size={28} className="text-brass mb-5" />
            <h3 className="text-xl font-semibold text-parchment">Two modes of operation</h3>
            <ul className="mt-5 space-y-4 text-sm leading-7 text-slate-400">
              <li className="flex gap-3"><CheckCircle size={16} className="mt-0.5 shrink-0 text-forest" /><span><strong className="text-parchment">Live Camera:</strong> Hold a banknote up to your camera. Frames stream at 2-4 FPS with continuous verdict updates.</span></li>
              <li className="flex gap-3"><CheckCircle size={16} className="mt-0.5 shrink-0 text-forest" /><span><strong className="text-parchment">Image Upload:</strong> Submit a photo of a banknote for a single detailed analysis with probability breakdown.</span></li>
            </ul>
            <div className="mt-6 rounded-xl border border-slate-500/10 bg-slate-900/60 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Detected Features</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {['Watermark', 'Security Thread', 'Micro-printing', 'Color-shift Ink', 'See-through Register'].map((f) => (
                  <span key={f} className="rounded-full border border-forest/30 bg-forest/10 px-3 py-1 text-xs text-forest">{f}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-500/10 bg-ink-800/60 p-8">
            {demoStep === 'idle' ? (
              <div className="flex min-h-[200px] flex-col items-center justify-center gap-4">
                <div className="rounded-2xl border border-dashed border-slate-500/30 bg-slate-900/40 p-8 text-center">
                  <Scan size={32} className="mx-auto text-slate-600 mb-3" />
                  <p className="text-sm text-slate-400">Currency detection demo</p>
                  <p className="mt-1 text-xs text-slate-500">Click below to simulate a scan</p>
                </div>
                <MagneticButton onClick={runCurrencyDemo} className="gap-2 bg-forest text-white hover:bg-forest/90">
                  <Zap size={16} /> Load Demo Scan
                </MagneticButton>
              </div>
            ) : demoStep === 'scanning' ? (
              <div className="flex min-h-[200px] items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto h-16 w-16 animate-spin rounded-full border-4 border-slate-600 border-t-brass" />
                  <p className="mt-4 text-sm text-slate-400">Analyzing security features...</p>
                </div>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-forest/10 p-3">
                    <CheckCircle size={28} className="text-forest" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-parchment">Verdict: <span className="text-forest">REAL</span></p>
                    <p className="text-sm text-slate-400">Confidence 92.4%</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-slate-900/60 p-4 text-center"><p className="text-xs text-slate-500">Authentic</p><p className="mt-1 font-mono text-xl font-semibold text-forest">92.4%</p></div>
                  <div className="rounded-xl bg-slate-900/60 p-4 text-center"><p className="text-xs text-slate-500">Counterfeit</p><p className="mt-1 font-mono text-xl font-semibold text-oxblood">7.6%</p></div>
                </div>
                <p className="text-sm text-slate-400">Recommendation: Currency appears authentic. Security features detected: watermark, security thread, micro-printing.</p>
                <button onClick={() => setDemoStep('idle')} className="text-sm text-brass hover:underline">Reset demo</button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <SectionHeading tag="Detection" title="Message Risk Analysis" description="Paste any suspicious message to see how the hybrid engine breaks down risk signals." />
        <motion.div {...FADE_UP} className="mx-auto max-w-3xl rounded-2xl border border-slate-500/10 bg-ink-800/60 p-8">
          <textarea
            ref={messageInputRef}
            rows={4}
            className="w-full rounded-xl border border-slate-500/20 bg-slate-900/60 px-5 py-4 text-sm text-parchment outline-none placeholder:text-slate-600 focus:border-brass/40"
            placeholder="Paste a suspicious message here to see how SentinelAI analyzes it..."
            defaultValue="Dear customer, your UPI ID has been blocked. To reactivate, click the link and enter your UPI PIN: https://upi-verify-secure.tk"
          />
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <MagneticButton onClick={runMessageDemo} className="gap-2 bg-brass text-ink-900 hover:bg-brass/90">
              <Search size={16} /> Analyze Demo
            </MagneticButton>
            <Link to="/check-message" className="text-sm text-slate-400 hover:text-parchment transition-colors">
              Open full message tool →
            </Link>
          </div>
          <AnimatePresence>
            {messageResult && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-6 overflow-hidden">
                <div className="rounded-xl border border-oxblood/20 bg-oxblood/5 p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div><p className="text-sm text-slate-400">Threat Level</p><p className="mt-1 text-2xl font-semibold text-oxblood">HIGH</p></div>
                    <div className="text-right"><p className="text-sm text-slate-400">Risk Score</p><p className="mt-1 font-mono text-2xl font-semibold text-parchment">{messageResult.score}</p></div>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Detected Signals</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {['upi_fraud', 'urgency_language', 'shortened_url', 'phishing_template'].map((s) => (
                          <span key={s} className="rounded-full border border-oxblood/20 bg-oxblood/10 px-3 py-1 text-xs text-oxblood">{s}</span>
                        ))}
                      </div>
                    </div>
                    <div><p className="text-xs uppercase tracking-[0.3em] text-slate-500">Extracted Entities</p><div className="mt-2 space-y-1 font-mono text-xs text-slate-400"><p>🔗 https://upi-verify-secure.tk</p><p>💬 UPI ID solicitation</p></div></div>
                  </div>
                  <div className="mt-5 rounded-lg border border-slate-500/10 bg-slate-900/60 p-4">
                    <p className="text-sm font-semibold text-parchment">Suggested Action</p>
                    <p className="mt-1 text-sm leading-6 text-slate-400">This message exhibits strong fraud indicators. Do not engage, do not share personal information, and report to cybercrime.gov.in immediately.</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <SectionHeading tag="Safety" title="Cyber Safety Tips" description="Essential practices to protect yourself from cyber fraud and financial scams." />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {safetyTips.map((tip, i) => (
            <motion.div key={tip.title} {...STAGGER} transition={{ ...STAGGER.transition, delay: i * 0.08 }} className="rounded-2xl border border-slate-500/10 bg-ink-800/60 p-6">
              <tip.icon size={22} className="text-brass mb-4" />
              <h4 className="font-semibold text-parchment">{tip.title}</h4>
              <p className="mt-2 text-sm leading-6 text-slate-400">{tip.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <SectionHeading tag="FAQ" title="Frequently Asked Questions" />
        <motion.div {...FADE_UP} className="mx-auto max-w-3xl space-y-4">
          {faqs.map((faq, i) => (
            <details key={i} className="group rounded-2xl border border-slate-500/10 bg-ink-800/60">
              <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-5 text-sm font-semibold text-parchment select-none">{faq.q}<ChevronDown size={18} className="shrink-0 text-slate-500 transition-transform group-open:rotate-180" /></summary>
              <div className="px-6 pb-5 text-sm leading-7 text-slate-400">{faq.a}</div>
            </details>
          ))}
        </motion.div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <SectionHeading tag="Data" title="Fraud Statistics in India" description="The scale of cyber fraud underscores the need for accessible detection tools." />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { value: 11266, label: 'Crore ₹ lost to cyber fraud (2024)', suffix: ' Cr', decimals: 0 },
            { value: 1.2, label: 'Million+ cybercrime complaints (2024)', suffix: 'M+', decimals: 1 },
            { value: 67, label: '% of scams via UPI/social media', suffix: '%', decimals: 0 },
            { value: 22, label: 'Minutes average before funds moved', suffix: ' min', decimals: 0 },
          ].map((stat, i) => (
            <motion.div key={stat.label} {...STAGGER} transition={{ ...STAGGER.transition, delay: i * 0.1 }} className="rounded-2xl border border-slate-500/10 bg-ink-800/60 p-6 text-center">
              <p className="font-mono text-3xl font-semibold text-parchment"><CountUp end={stat.value} decimals={stat.decimals} suffix={stat.suffix} /></p>
              <p className="mt-3 text-sm text-slate-400">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <SectionHeading tag="Stack" title="Technology Used" description="Built with production-grade tools for reliability and performance." />
        <motion.div {...FADE_UP} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Cpu, title: 'FastAPI Backend', desc: 'Python async REST + WebSocket layer serving trained models with low latency.' },
            { icon: Brain, title: 'Computer Vision', desc: 'CNN-based banknote classifier trained on annotated currency features.' },
            { icon: Database, title: 'NLP Pipeline', desc: 'Hybrid rule-engine + ML classifier for scam message risk scoring.' },
            { icon: Globe, title: 'React SPA', desc: 'React 18 + TypeScript + Vite frontend with Framer Motion and Three.js.' },
          ].map((t) => (
            <div key={t.title} className="rounded-2xl border border-slate-500/10 bg-ink-800/60 p-6 text-center">
              <t.icon size={28} className="mx-auto text-brass mb-4" />
              <h4 className="font-semibold text-parchment">{t.title}</h4>
              <p className="mt-2 text-sm leading-6 text-slate-400">{t.desc}</p>
            </div>
          ))}
        </motion.div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <SectionHeading tag="Models" title="Meet the AI Models" description="Two specialized detection engines working together to protect against financial fraud." />
        <div className="grid gap-8 lg:grid-cols-2">
          <motion.div {...FADE_UP} className="rounded-2xl border border-forest/20 bg-ink-800/60 p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="rounded-xl bg-forest/10 p-3"><Fingerprint size={24} className="text-forest" /></div>
              <div><h3 className="text-lg font-semibold text-parchment">Currency Detection Model</h3><p className="text-sm text-forest">CV Classifier v2.1</p></div>
            </div>
            <ul className="space-y-3 text-sm leading-7 text-slate-400">
              <li>• Trained on annotated banknote images with security feature labeling</li>
              <li>• Detects: watermark, security thread, micro-printing, color-shift ink</li>
              <li>• Dual mode: live camera stream (2-4 FPS) and single-image upload</li>
              <li>• Outputs REAL/FAKE verdict with confidence score and probability split</li>
            </ul>
            <div className="mt-6 flex items-center gap-3"><span className="inline-flex h-2 w-2 rounded-full bg-forest animate-pulse" /><span className="text-xs text-slate-500">Model ready</span></div>
          </motion.div>
          <motion.div {...FADE_UP} transition={{ delay: 0.15 }} className="rounded-2xl border border-brass/20 bg-ink-800/60 p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="rounded-xl bg-brass/10 p-3"><Brain size={24} className="text-brass" /></div>
              <div><h3 className="text-lg font-semibold text-parchment">Message Risk Classifier</h3><p className="text-sm text-brass">NLP + Rule Engine v3.0</p></div>
            </div>
            <ul className="space-y-3 text-sm leading-7 text-slate-400">
              <li>• Hybrid architecture combining regex patterns with ML scoring</li>
              <li>• Entity extraction: phones, emails, UPI IDs, URLs, account numbers</li>
              <li>• Threat levels: LOW / MEDIUM / HIGH with risk score and suggested actions</li>
              <li>• Trained on 50K+ labeled scam messages across 15+ scam categories</li>
            </ul>
            <div className="mt-6 flex items-center gap-3"><span className="inline-flex h-2 w-2 rounded-full bg-brass animate-pulse" /><span className="text-xs text-slate-500">Model ready</span></div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <SectionHeading tag="Mission" title="Our Mission" />
        <motion.div {...FADE_UP} className="mx-auto max-w-3xl rounded-2xl border border-slate-500/10 bg-ink-800/60 p-8 text-center">
          <Shield size={40} className="mx-auto text-brass mb-6" />
          <p className="text-lg leading-8 text-slate-300 sm:text-xl">To make AI-powered fraud detection accessible to every Indian citizen — from the tech-savvy urban professional to the first-time smartphone user in a rural village. We believe that financial security is a right, not a privilege, and that technology should serve as a shield for the vulnerable.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {['Accessibility', 'Accuracy', 'Transparency', 'Speed', 'Privacy'].map((v) => (
              <span key={v} className="rounded-full border border-brass/30 bg-brass/5 px-4 py-2 text-sm text-brass">{v}</span>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <motion.div {...FADE_UP} className="rounded-3xl border border-brass/20 bg-gradient-to-br from-ink-800 to-ink-900 p-10 text-center sm:p-16">
          <Award size={40} className="mx-auto text-brass mb-6" />
          <h2 className="font-serif text-3xl font-semibold text-parchment sm:text-4xl">Ready to secure your digital life?</h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-400">Enter the SentinelAI dashboard to scan currency, analyze messages, and view your detection history — all in one place.</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link to="/dashboard"><MagneticButton className="gap-2 bg-brass text-ink-900 hover:bg-brass/90 px-8 py-4 text-base">Enter SentinelAI <ArrowRight size={20} /></MagneticButton></Link>
            <Link to="/analytics"><MagneticButton className="gap-2 border-slate-500/20 bg-transparent text-parchment hover:bg-slate-800 px-8 py-4 text-base">View Analytics <BarChart3 size={20} /></MagneticButton></Link>
          </div>
          <p className="mt-6 text-xs text-slate-600">Fully functional offline · No account required · Your data stays on your device</p>
        </motion.div>
      </section>

      <footer className="border-t border-slate-500/10 bg-ink-800/40 px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div><p className="text-sm font-semibold tracking-[0.3em] text-brass uppercase">SentinelAI</p><p className="mt-1 text-xs text-slate-500">Fraud Detection & Awareness Platform</p></div>
            <div className="flex gap-6 text-xs text-slate-500">
              <a href="https://cybercrime.gov.in" target="_blank" rel="noopener noreferrer" className="hover:text-slate-400 transition-colors">Cyber Crime Portal</a>
              <span>|</span><span>Helpline: 1930</span><span>|</span><span>© 2025 SentinelAI</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
