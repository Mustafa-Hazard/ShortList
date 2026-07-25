import { useState, useEffect } from 'react';
import { Layers, Sparkles, Plus, Calendar, FileText, ArrowRight, Brain, Filter } from 'lucide-react';
import { apiClient } from '../api/client';

export function RecruiterDashboard() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'jobs'>('pipeline');
  const [selectedJobFilter, setSelectedJobFilter] = useState<string>('ALL');

  // Create Job Modal State
  const [showJobModal, setShowJobModal] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [department, setDepartment] = useState('Engineering');
  const [jobType, setJobType] = useState('full-time');
  const [skillsText, setSkillsText] = useState('TypeScript, Node.js, React, PostgreSQL');
  const [jobDescription, setJobDescription] = useState('');
  const [salaryMin, setSalaryMin] = useState(100000);
  const [salaryMax, setSalaryMax] = useState(150000);
  const [jdGenerating, setJdGenerating] = useState(false);

  // Score CV Modal / Drawer State
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [scoring, setScoring] = useState(false);

  // Schedule Interview Modal State
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewAppId, setInterviewAppId] = useState('');
  const [interviewType, setInterviewType] = useState('technical');
  const [slot1, setSlot1] = useState('2026-09-01T10:00');
  const [slot2, setSlot2] = useState('2026-09-01T14:00');

  // Issue Offer Modal State
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerAppId, setOfferAppId] = useState('');
  const [offerRoleTitle, setOfferRoleTitle] = useState('');
  const [offerSalary, setOfferSalary] = useState(130000);
  const [offerStartDate, setOfferStartDate] = useState('2026-09-15');
  const [offerBenefits, setOfferBenefits] = useState('Health, Dental, 401(k) matching, Unlimited PTO');
  const [offerCreating, setOfferCreating] = useState(false);

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

  const handleGenerateJd = async () => {
    if (!jobTitle) {
      alert('Please enter a job title first!');
      return;
    }
    setJdGenerating(true);
    try {
      const skillsArray = skillsText.split(',').map((s) => s.trim()).filter(Boolean);
      const res = await apiClient.post('/jobs/generate-description', {
        title: jobTitle,
        department,
        requiredSkills: skillsArray,
      });
      setJobDescription(res.data.description);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to generate Job Description');
    } finally {
      setJdGenerating(false);
    }
  };

  const handleCreateJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const skillsArray = skillsText.split(',').map((s) => s.trim()).filter(Boolean);
      await apiClient.post('/jobs', {
        title: jobTitle,
        department,
        type: jobType,
        requiredSkills: skillsArray,
        description: jobDescription,
        salaryMin: Number(salaryMin),
        salaryMax: Number(salaryMax),
      });
      setShowJobModal(false);
      fetchJobs();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create job posting');
    }
  };

  const handleTriggerCvScorer = async (appId: string) => {
    setScoring(true);
    try {
      const res = await apiClient.post(`/applications/${appId}/score`);
      setSelectedApp(res.data);
      fetchApplications();
    } catch (err: any) {
      alert(err.response?.data?.message || 'CV Scoring failed. Make sure candidate has uploaded a CV.');
    } finally {
      setScoring(false);
    }
  };

  const handleTransitionStage = async (appId: string, targetStage: string) => {
    try {
      await apiClient.patch(`/applications/${appId}/stage`, { targetStage });
      fetchApplications();
      if (selectedApp?.id === appId) {
        setSelectedApp(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Stage transition failed');
    }
  };

  const handleScheduleInterviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/interviews', {
        applicationId: interviewAppId,
        type: interviewType,
        proposedSlots: [new Date(slot1).toISOString(), new Date(slot2).toISOString()],
      });
      setShowInterviewModal(false);
      alert('Interview proposed successfully! Candidate notified via WebSocket.');
      fetchApplications();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to schedule interview');
    }
  };

  const handleIssueOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOfferCreating(true);
    try {
      await apiClient.post('/offers', {
        applicationId: offerAppId,
        roleTitle: offerRoleTitle,
        salary: Number(offerSalary),
        startDate: offerStartDate,
        benefitsSummary: offerBenefits,
      });
      setShowOfferModal(false);
      alert('Offer created & AI letter drafted successfully!');
      fetchApplications();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to issue offer');
    } finally {
      setOfferCreating(false);
    }
  };

  const filteredApplications = applications.filter((app) =>
    selectedJobFilter === 'ALL' ? true : app.jobPostingId === selectedJobFilter,
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header Banner */}
      <div className="glass-card animate-fade-in" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Recruiter Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Manage job requisitions, rank candidates with AI CV Scorer, and drive stage transitions.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              className={`btn ${activeTab === 'pipeline' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('pipeline')}
            >
              <Layers size={16} /> Candidate Pipeline ({applications.length})
            </button>
            <button
              type="button"
              className={`btn ${activeTab === 'jobs' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('jobs')}
            >
              <FileText size={16} /> Job Postings ({jobs.length})
            </button>
            <button
              type="button"
              className="btn btn-ai"
              onClick={() => setShowJobModal(true)}
            >
              <Plus size={16} /> Post Job (AI JD Generator)
            </button>
          </div>
        </div>
      </div>

      {/* Tab 1: Candidate Pipeline */}
      {activeTab === 'pipeline' && (
        <div>
          {/* Job Filter Header */}
          <div className="glass-card" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={16} color="var(--primary)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Filter by Job Posting:</span>
            </div>
            <select
              className="form-select"
              style={{ width: '250px' }}
              value={selectedJobFilter}
              onChange={(e) => setSelectedJobFilter(e.target.value)}
            >
              <option value="ALL">All Postings ({applications.length})</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>
          </div>

          {/* Applications Table / Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredApplications.map((app) => (
              <div key={app.id} className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                        {app.candidate?.firstName} {app.candidate?.lastName}
                      </h3>
                      {app.aiScore !== null && (
                        <span className="badge badge-ai" style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem' }}>
                          <Brain size={12} /> AI Score: {app.aiScore}/100
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      Applied for: <strong>{app.jobPosting?.title}</strong> | Experience: {app.yearsOfExperience} yrs | Expected: ${app.salaryExpectation?.toLocaleString()}
                    </p>
                  </div>

                  {/* Actions & Stage Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className="badge badge-primary" style={{ textTransform: 'uppercase', padding: '0.3rem 0.6rem' }}>
                      {app.stage}
                    </span>

                    <button
                      type="button"
                      className="btn btn-ai btn-sm"
                      onClick={() => handleTriggerCvScorer(app.id)}
                      disabled={scoring}
                    >
                      <Sparkles size={14} /> {app.aiScore !== null ? 'Re-Score CV' : 'Score CV with AI'}
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSelectedApp(app)}
                    >
                      Details & AI Output
                    </button>

                    {/* Quick Stage Transitions */}
                    {app.stage === 'applied' && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => handleTransitionStage(app.id, 'screened')}
                      >
                        Screen <ArrowRight size={12} />
                      </button>
                    )}

                    {app.stage === 'shortlisted' && (
                      <button
                        type="button"
                        className="btn btn-warning btn-sm"
                        onClick={() => {
                          setInterviewAppId(app.id);
                          setShowInterviewModal(true);
                        }}
                      >
                        <Calendar size={14} /> Schedule Interview
                      </button>
                    )}

                    {app.stage === 'interview_scheduled' && (
                      <button
                        type="button"
                        className="btn btn-success btn-sm"
                        onClick={() => {
                          setOfferAppId(app.id);
                          setOfferRoleTitle(app.jobPosting?.title || 'Engineer');
                          setShowOfferModal(true);
                        }}
                        style={{ background: 'var(--success)', color: 'white' }}
                      >
                        <FileText size={14} /> Issue Offer
                      </button>
                    )}
                  </div>
                </div>

                {/* AI Screening Summary Preview */}
                {app.aiStrengths && app.aiStrengths.length > 0 && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--success)', display: 'block', marginBottom: '0.3rem' }}>
                        STRENGTHS IDENTIFIED BY AI:
                      </span>
                      <ul style={{ paddingLeft: '1.2rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {app.aiStrengths.map((s: string, i: number) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--warning)', display: 'block', marginBottom: '0.3rem' }}>
                        POTENTIAL GAPS TO PROBE:
                      </span>
                      <ul style={{ paddingLeft: '1.2rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {app.aiGaps?.map((g: string, i: number) => (
                          <li key={i}>{g}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Job Postings */}
      {activeTab === 'jobs' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {jobs.map((job) => (
            <div key={job.id} className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{job.title}</h3>
                <span className="badge badge-primary">{job.status.toUpperCase()}</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                {job.department} | ${job.salaryMin?.toLocaleString()} - ${job.salaryMax?.toLocaleString()}
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '1rem', lineClamp: 4, WebkitLineClamp: 4, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {job.description}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create Job + AI JD Generator */}
      {showJobModal && (
        <div className="modal-overlay">
          <div className="glass-card modal-content animate-fade-in" style={{ padding: '2rem', maxWidth: '650px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Post New Job Requisition
            </h2>

            <form onSubmit={handleCreateJobSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Job Title</label>
                  <input
                    type="text"
                    className="form-input"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="Senior Backend Engineer"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input
                    type="text"
                    className="form-input"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Job Type</label>
                  <select
                    className="form-select"
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value)}
                  >
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Min Salary ($)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={salaryMin}
                    onChange={(e) => setSalaryMin(Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Salary ($)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={salaryMax}
                    onChange={(e) => setSalaryMax(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Required Skills (Comma separated)</label>
                <input
                  type="text"
                  className="form-input"
                  value={skillsText}
                  onChange={(e) => setSkillsText(e.target.value)}
                  placeholder="TypeScript, Node.js, NestJS, PostgreSQL"
                />
              </div>

              {/* AI JD Generator Action Bar */}
              <div
                className="glass-card-ai"
                style={{
                  padding: '1rem',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--ai-purple)' }}>
                    AI Feature 1: Job Description Generator
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Auto-generate a complete, tailored Job Description using Gemini AI.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-ai btn-sm"
                  onClick={handleGenerateJd}
                  disabled={jdGenerating}
                >
                  <Sparkles size={14} /> {jdGenerating ? 'Drafting...' : 'Generate with AI'}
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">Job Description</label>
                <textarea
                  className="form-textarea"
                  rows={6}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Enter or AI-generate job description..."
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowJobModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Publish Job Posting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Schedule Interview */}
      {showInterviewModal && (
        <div className="modal-overlay">
          <div className="glass-card modal-content animate-fade-in" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '1.5rem' }}>
              Schedule Interview & Propose Slots
            </h2>

            <form onSubmit={handleScheduleInterviewSubmit}>
              <div className="form-group">
                <label className="form-label">Interview Type</label>
                <select
                  className="form-select"
                  value={interviewType}
                  onChange={(e) => setInterviewType(e.target.value)}
                >
                  <option value="screening">Screening</option>
                  <option value="technical">Technical</option>
                  <option value="behavioral">Behavioral</option>
                  <option value="executive">Executive</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Proposed Slot 1</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={slot1}
                  onChange={(e) => setSlot1(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Proposed Slot 2</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={slot2}
                  onChange={(e) => setSlot2(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowInterviewModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Send Proposal to Candidate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Issue Offer */}
      {showOfferModal && (
        <div className="modal-overlay">
          <div className="glass-card modal-content animate-fade-in" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Issue Job Offer (AI Offer Letter Drafter)
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Creating an offer automatically invokes AI Feature 4 to draft the letter body for recruiter review.
            </p>

            <form onSubmit={handleIssueOfferSubmit}>
              <div className="form-group">
                <label className="form-label">Role Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={offerRoleTitle}
                  onChange={(e) => setOfferRoleTitle(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Annual Salary ($)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={offerSalary}
                    onChange={(e) => setOfferSalary(Number(e.target.value))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={offerStartDate}
                    onChange={(e) => setOfferStartDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Benefits Summary</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={offerBenefits}
                  onChange={(e) => setOfferBenefits(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowOfferModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-ai" disabled={offerCreating}>
                  <Sparkles size={16} /> {offerCreating ? 'Drafting & Issuing...' : 'Create & Draft Letter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Application AI Extraction Details */}
      {selectedApp && (
        <div className="modal-overlay">
          <div className="glass-card modal-content animate-fade-in" style={{ padding: '2rem', maxWidth: '650px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Candidate AI Analysis Profile
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Candidate: {selectedApp.candidate?.firstName} {selectedApp.candidate?.lastName}
            </p>

            {selectedApp.aiScore !== null ? (
              <div>
                <div className="glass-card-ai" style={{ padding: '1.25rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--ai-purple)', fontWeight: 700 }}>AI MATCH SCORE</span>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', margin: '0.2rem 0' }}>
                    {selectedApp.aiScore}<span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>/100</span>
                  </div>
                </div>

                {selectedApp.aiExtraction && (
                  <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                      PARSED CV EXTRACTION:
                    </h4>
                    <pre style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '0.75rem', borderRadius: '8px', fontSize: '0.75rem', color: '#e2e8f0', whiteSpace: 'pre-wrap' }}>
                      {JSON.stringify(selectedApp.aiExtraction, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>
                CV has not been scored yet. Click "Score CV with AI" on the pipeline table.
              </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedApp(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
