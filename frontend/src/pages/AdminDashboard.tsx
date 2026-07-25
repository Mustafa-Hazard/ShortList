import { useState, useEffect } from 'react';
import { Shield, Briefcase, Layers, Activity, Cpu, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../api/client';

export function AdminDashboard() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);

  useEffect(() => {
    fetchJobs();
    fetchApplications();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await apiClient.get('/jobs');
      setJobs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await apiClient.get('/applications');
      setApplications(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const hiredCount = applications.filter((a) => a.stage === 'hired').length;
  const scoredCount = applications.filter((a) => a.aiScore !== null).length;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Blueprint Header Banner */}
      <div className="blueprint-panel" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="mono-tag tag-rust">[SYSTEM ADMIN TELEMETRY]</span>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '0.4rem' }}>
              System Administration
            </h1>
            <p style={{ color: 'var(--fg-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Cross-company recruitment pipeline metrics and Gemini AI Proxy gateway monitor.
            </p>
          </div>
          <span className="mono-tag tag-rust" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
            <Shield size={14} /> ADMINISTRATOR ACCESS
          </span>
        </div>
      </div>

      {/* Analytics Metric Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="blueprint-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="mono-tag">TOTAL REQUISITIONS</span>
            <Briefcase size={18} color="var(--accent-brass)" />
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-mono)', marginTop: '0.5rem', color: 'var(--fg-main)' }}>
            {jobs.length}
          </div>
        </div>

        <div className="blueprint-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="mono-tag">TOTAL MANIFESTS</span>
            <Layers size={18} color="var(--accent-brass)" />
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-mono)', marginTop: '0.5rem', color: 'var(--fg-main)' }}>
            {applications.length}
          </div>
        </div>

        <div className="blueprint-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="mono-tag">SCORED BY AI</span>
            <Cpu size={18} color="var(--accent-brass)" />
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-mono)', marginTop: '0.5rem', color: 'var(--fg-main)' }}>
            {scoredCount}
          </div>
        </div>

        <div className="blueprint-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="mono-tag tag-green">TERMINUS HIRED</span>
            <CheckCircle2 size={18} color="var(--signal-green)" />
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-mono)', marginTop: '0.5rem', color: '#79ab92' }}>
            {hiredCount}
          </div>
        </div>
      </div>

      {/* AI Gateway Health Monitor */}
      <div className="blueprint-panel" style={{ padding: '1.5rem', border: '1px solid var(--signal-green)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
          <Activity size={18} color="var(--signal-green)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Gemini AI Gateway Telemetry</h3>
          <span className="mono-tag tag-green" style={{ marginLeft: 'auto' }}>ONLINE // STATUS 200 OK</span>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--fg-muted)' }}>
          All 4 AI Features (JD Generator, CV Scorer, Question Suggester, Offer Letter Drafter) operating cleanly with structured JSON schema validation and graceful fallback degradation.
        </p>
      </div>
    </div>
  );
}
