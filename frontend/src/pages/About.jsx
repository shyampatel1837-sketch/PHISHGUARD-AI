import React from 'react'
import { motion } from 'framer-motion'
import { Shield, Cpu, Search, Code2, BookOpen, ArrowRight, Database, Layers, GitBranch, Zap, CheckCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const TECH_STACK = [
  { icon: Code2, name: 'React + Vite', role: 'Frontend interface', color: 'var(--accent)' },
  { icon: Layers, name: 'FastAPI', role: 'Backend API layer', color: 'var(--emerald)' },
  { icon: Shield, name: 'Pydantic', role: 'Request validation', color: 'var(--violet)' },
  { icon: GitBranch, name: 'Random Forest', role: 'Model classifier', color: 'var(--amber)' },
  { icon: BookOpen, name: 'SHAP', role: 'Explainability-ready', color: 'var(--rose)' },
  { icon: Database, name: 'joblib', role: 'Model serialization', color: 'var(--text-secondary)' },
]

const PIPELINE_STEPS = [
  { label: 'Dataset preparation', done: true },
  { label: 'Data cleaning', done: true },
  { label: 'Feature engineering', done: true },
  { label: 'Model training', done: true },
  { label: 'Evaluation', done: true },
  { label: 'Model serialization', done: true },
  { label: 'FastAPI integration', done: true },
  { label: 'Realtime URL analysis', done: true },
  { label: 'Explainable insights', done: false },
]

export default function About() {
  const navigate = useNavigate()

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay },
  })

  return (
    <div className="about-page">
      <motion.div {...fadeUp(0)} className="glass about-hero">
        <div className="about-hero-icon">
          <Shield size={34} />
        </div>
        <div>
          <h1 className="about-hero-title">PhishGuard AI</h1>
          <p className="about-hero-tagline">Detect. Analyze. Protect.</p>
          <p className="about-hero-desc">
            PhishGuard AI is a cybersecurity research project that analyzes URL strings for phishing patterns using feature extraction and machine learning. It combines a polished frontend experience with a real backend API and model inference pipeline.
          </p>
        </div>
      </motion.div>

      <motion.div {...fadeUp(0.05)} className="glass about-section">
        <h2 className="about-section-title">Project Overview</h2>
        <div className="about-text-block">
          <p>
            The platform is designed to help users assess suspicious URLs before interacting with them. It avoids direct browsing to the target site and instead evaluates the URL itself using lexical and structural indicators such as length, domain patterns, suspicious keywords, and host metadata.
          </p>
          <p>
            This application uses a frontend dashboard, a backend analysis service, and a model-backed risk classification flow. The product is optimized for clear presentation and evaluation, while keeping the actual detection logic grounded in the existing API and model behavior rather than hardcoded exceptions.
          </p>
        </div>
      </motion.div>

      <motion.div {...fadeUp(0.08)} className="glass about-section">
        <h2 className="about-section-title">Technology Stack</h2>
        <div className="about-tech-grid">
          {TECH_STACK.map((tech) => (
            <div key={tech.name} className="about-tech-item">
              <div className="about-tech-icon" style={{ color: tech.color, background: `${tech.color}18` }}>
                <tech.icon size={16} />
              </div>
              <div>
                <div className="about-tech-name">{tech.name}</div>
                <div className="about-tech-role">{tech.role}</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div {...fadeUp(0.1)} className="glass about-section">
        <h2 className="about-section-title">Product Pipeline</h2>
        <div className="about-pipeline">
          {PIPELINE_STEPS.map((step, index) => (
            <div key={step.label} className={`about-pipeline-step ${step.done ? 'about-pipeline-step--done' : ''}`}>
              <div className="about-pipeline-num">{index + 1}</div>
              <div className="about-pipeline-label">{step.label}</div>
              {step.done && (
                <span className="badge badge-emerald">
                  <CheckCircle2 size={12} /> Complete
                </span>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div {...fadeUp(0.12)} className="glass about-section">
        <h2 className="about-section-title">How Analysis Works</h2>
        <div className="about-steps">
          <div className="about-step">
            <div className="about-step-num"><Search size={14} /></div>
            <div>
              <div className="about-step-title">URL submission</div>
              <div className="about-step-desc">The user submits a URL through the scanner. No browsing or automated navigation is performed.</div>
            </div>
          </div>
          <div className="about-step-arrow"><ArrowRight size={14} /></div>
          <div className="about-step">
            <div className="about-step-num"><Zap size={14} /></div>
            <div>
              <div className="about-step-title">Feature extraction</div>
              <div className="about-step-desc">Structural and lexical features are derived from the URL itself.</div>
            </div>
          </div>
          <div className="about-step-arrow"><ArrowRight size={14} /></div>
          <div className="about-step">
            <div className="about-step-num"><Cpu size={14} /></div>
            <div>
              <div className="about-step-title">Model inference</div>
              <div className="about-step-desc">The current backend model classifies the request using the saved artifact and the configured threshold.</div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div {...fadeUp(0.14)} className="about-cta">
        <button className="btn btn-primary" onClick={() => navigate('/scanner')}>
          <Search size={15} />
          Try the Scanner
        </button>
        <button className="btn btn-ghost" onClick={() => navigate('/model')}>
          <Cpu size={15} />
          View Model Status
        </button>
      </motion.div>
    </div>
  )
}
