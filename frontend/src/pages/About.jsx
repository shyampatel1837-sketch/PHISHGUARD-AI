import React from 'react'
import { motion } from 'framer-motion'
import {
  Shield, Cpu, Search, Code2, BookOpen,
  ArrowRight, Database, Layers, GitBranch, Zap,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const TECH_STACK = [
  { icon: Code2,   name: 'React + Vite',      role: 'Frontend UI',             color: 'var(--accent)' },
  { icon: Layers,  name: 'FastAPI',            role: 'Backend REST API',        color: 'var(--emerald)' },
  { icon: Shield,  name: 'Pydantic',           role: 'Data validation',         color: 'var(--violet)' },
  { icon: GitBranch, name: 'Random Forest',    role: 'ML classifier (pending)', color: 'var(--amber)' },
  { icon: BookOpen,  name: 'SHAP',             role: 'Explainable AI (pending)',color: 'var(--rose)' },
  { icon: Database,  name: 'joblib',           role: 'Model serialisation',     color: 'var(--text-secondary)' },
]

const PIPELINE_STEPS = [
  { label: 'Dataset',              done: false },
  { label: 'Data Cleaning',        done: false },
  { label: 'Feature Engineering',  done: false },
  { label: 'Random Forest Training', done: false },
  { label: 'Model Evaluation',     done: false },
  { label: 'Model Serialisation',  done: false },
  { label: 'FastAPI Integration',  done: true  },
  { label: 'Real Prediction',      done: false },
  { label: 'XAI / SHAP',          done: false },
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
      {/* Hero */}
      <motion.div {...fadeUp(0)} className="glass about-hero">
        <div className="about-hero-icon">
          <Shield size={34} />
        </div>
        <div>
          <h1 className="about-hero-title">PhishGuard AI</h1>
          <p className="about-hero-tagline">Detect. Analyze. Protect.</p>
          <p className="about-hero-desc">
            PhishGuard AI is an AI-based phishing detection research project
            designed to analyse suspicious website URLs and classify potential
            phishing threats using machine learning. The system extracts
            structural and lexical features from URL strings and, once the
            Random Forest model is integrated, will classify each URL as
            phishing or legitimate with an explainable confidence score.
          </p>
        </div>
      </motion.div>

      {/* Research context */}
      <motion.div {...fadeUp(0.05)} className="glass about-section">
        <h2 className="about-section-title">Project Overview</h2>
        <div className="about-text-block">
          <p>
            This project is developed as a computer science research application
            demonstrating how machine learning can be applied to cybersecurity
            threat detection. Phishing attacks are one of the most common vectors
            for credential theft and malware distribution — automated detection
            using ML can provide a scalable layer of protection.
          </p>
          <p>
            The system uses a <strong>URL-string-only analysis approach</strong> —
            no network requests are made to the target website. This ensures safe
            analysis of potentially malicious URLs without any risk of executing
            malicious content or initiating network-level attacks.
          </p>
          <p>
            The machine learning classifier has not been integrated yet.
            The current application provides the complete frontend and backend
            foundation. The ML integration phase will follow once the Random
            Forest model is trained on real phishing data.
          </p>
        </div>
      </motion.div>

      {/* Tech stack */}
      <motion.div {...fadeUp(0.08)} className="glass about-section">
        <h2 className="about-section-title">Technology Stack</h2>
        <div className="about-tech-grid">
          {TECH_STACK.map(tech => (
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

      {/* ML pipeline */}
      <motion.div {...fadeUp(0.1)} className="glass about-section">
        <h2 className="about-section-title">ML Integration Pipeline</h2>
        <p className="about-section-desc">
          The following phases will connect the trained Random Forest model to
          this application. Steps marked as complete are already implemented.
        </p>
        <div className="about-pipeline">
          {PIPELINE_STEPS.map((step, i) => (
            <div key={step.label} className={`about-pipeline-step ${step.done ? 'about-pipeline-step--done' : ''}`}>
              <div className="about-pipeline-num">{i + 1}</div>
              <div className="about-pipeline-label">{step.label}</div>
              {step.done && <span className="badge badge-emerald">Complete</span>}
            </div>
          ))}
        </div>
      </motion.div>

      {/* How analysis works */}
      <motion.div {...fadeUp(0.12)} className="glass about-section">
        <h2 className="about-section-title">How Analysis Works</h2>
        <div className="about-steps">
          <div className="about-step">
            <div className="about-step-num"><Search size={14} /></div>
            <div>
              <div className="about-step-title">URL Submission</div>
              <div className="about-step-desc">A URL string is submitted via the scanner. No visit to the website occurs.</div>
            </div>
          </div>
          <div className="about-step-arrow"><ArrowRight size={14} /></div>
          <div className="about-step">
            <div className="about-step-num"><Zap size={14} /></div>
            <div>
              <div className="about-step-title">Feature Extraction</div>
              <div className="about-step-desc">Lexical and structural features are extracted from the URL string (HTTPS, length, domain, subdomains, keywords…).</div>
            </div>
          </div>
          <div className="about-step-arrow"><ArrowRight size={14} /></div>
          <div className="about-step">
            <div className="about-step-num"><Cpu size={14} /></div>
            <div>
              <div className="about-step-title">ML Classification</div>
              <div className="about-step-desc">The Random Forest model (once connected) classifies the URL and returns a risk probability score.</div>
            </div>
          </div>
          <div className="about-step-arrow"><ArrowRight size={14} /></div>
          <div className="about-step">
            <div className="about-step-num"><BookOpen size={14} /></div>
            <div>
              <div className="about-step-title">XAI Explanation</div>
              <div className="about-step-desc">SHAP values will explain which features influenced the classification and by how much.</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* CTA */}
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

      <style>{`
        .about-page { display: flex; flex-direction: column; gap: 20px; max-width: 900px; }

        .about-hero {
          display: flex; align-items: flex-start; gap: 20px; padding: 28px;
        }
        .about-hero-icon {
          width: 64px; height: 64px;
          background: linear-gradient(135deg, #0ea5e9, #38bdf8);
          border-radius: var(--radius-lg);
          display: flex; align-items: center; justify-content: center;
          color: #0c1929; flex-shrink: 0;
          box-shadow: 0 0 28px rgba(56,189,248,.3);
        }
        .about-hero-title  { font-size: 28px; font-weight: 800; color: var(--text-primary); letter-spacing: -0.02em; }
        .about-hero-tagline {
          font-size: 12px; color: var(--accent); font-weight: 700;
          letter-spacing: 0.14em; text-transform: uppercase;
          margin: 4px 0 12px;
        }
        .about-hero-desc { font-size: 14px; color: var(--text-secondary); line-height: 1.7; }

        .about-section { padding: 24px; }
        .about-section-title {
          font-size: 16px; font-weight: 700;
          color: var(--text-primary); margin-bottom: 14px;
        }
        .about-section-desc { font-size: 13px; color: var(--text-muted); margin-bottom: 14px; }

        .about-text-block { display: flex; flex-direction: column; gap: 12px; }
        .about-text-block p { font-size: 13.5px; color: var(--text-secondary); line-height: 1.7; }
        .about-text-block strong { color: var(--text-primary); }

        .about-tech-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;
        }
        .about-tech-item {
          display: flex; align-items: center; gap: 12px;
          background: var(--bg-elevated); border: 1px solid var(--border);
          border-radius: var(--radius-md); padding: 12px;
        }
        .about-tech-icon {
          width: 34px; height: 34px; border-radius: var(--radius-sm);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .about-tech-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
        .about-tech-role { font-size: 11px; color: var(--text-muted); }

        .about-pipeline { display: flex; flex-direction: column; gap: 8px; }
        .about-pipeline-step {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 14px;
          background: var(--bg-elevated); border: 1px solid var(--border);
          border-radius: var(--radius-md);
        }
        .about-pipeline-step--done {
          border-color: rgba(52,211,153,.2);
          background: var(--emerald-dim);
        }
        .about-pipeline-num {
          width: 22px; height: 22px;
          background: var(--border); border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; color: var(--text-muted);
          flex-shrink: 0;
        }
        .about-pipeline-step--done .about-pipeline-num {
          background: var(--emerald); color: #0c1929;
        }
        .about-pipeline-label { flex: 1; font-size: 13px; color: var(--text-secondary); }

        .about-steps { display: flex; align-items: flex-start; gap: 8px; flex-wrap: wrap; }
        .about-step {
          flex: 1; min-width: 150px;
          background: var(--bg-elevated); border: 1px solid var(--border);
          border-radius: var(--radius-md); padding: 14px;
          display: flex; flex-direction: column; gap: 8px;
        }
        .about-step-num {
          width: 28px; height: 28px;
          background: var(--accent-dim); color: var(--accent);
          border-radius: var(--radius-sm);
          display: flex; align-items: center; justify-content: center;
        }
        .about-step-title { font-size: 13px; font-weight: 600; color: var(--text-primary); }
        .about-step-desc  { font-size: 12px; color: var(--text-muted); line-height: 1.5; }
        .about-step-arrow { color: var(--text-muted); align-self: center; flex-shrink: 0; }

        .about-cta { display: flex; gap: 12px; flex-wrap: wrap; }
      `}</style>
    </div>
  )
}
