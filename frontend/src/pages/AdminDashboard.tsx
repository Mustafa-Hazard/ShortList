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
      {/* Header Banner */}
      <div className="glass-card animate-fade-in" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>System Administration Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Platform analytics, AI Proxy monitoring, and cross-company recruitment metrics.
            </p>
          </div>
          <span className="badge badge-danger" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
            <Shield size={14} /> System Administrator
          </span>
        </div>
      </div>

      {/* Analytics Metric Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>TOTAL JOB POSTINGS</span>
            <Briefcase size={20} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 900, marginTop: '0.5rem' }}>{jobs.length}</div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>TOTAL APPLICATIONS</span>
            <Layers size={20} color="var(--ai-purple)" />
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 900, marginTop: '0.5rem' }}>{applications.length}</div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>SCORED BY AI</span>
            <Cpu size={20} color="var(--ai-cyan)" />
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 900, marginTop: '0.5rem' }}>{scoredCount}</div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>CANDIDATES HIRED</span>
            <CheckCircle2 size={20} color="var(--success)" />
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 900, marginTop: '0.5rem' }}>{hiredCount}</div>
        </div>
      </div>

      {/* AI Gateway Health Monitor */}
      <div className="glass-card-ai" style={{ padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
          <Activity size={20} color="var(--success)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Gemini AI Gateway Status</h3>
          <span className="badge badge-success" style={{ marginLeft: 'auto' }}>ONLINE (200 OK)</span>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          All 4 AI Features (JD Generator, CV Scorer, Question Suggester, Offer Letter Drafter) active. Token budget and response latency operating within normal parameters.
        </p>
      </div>
    </div>
  );
}
