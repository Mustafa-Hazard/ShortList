import { useState, useEffect } from 'react';
import { Layers, Sparkles, Plus, Calendar, FileText, ArrowRight, Brain, Filter } from 'lucide-react';
import { apiClient } from '../api/client';
import { TransitLine } from '../components/TransitLine';

export function RecruiterDashboard() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'jobs'>('pipeline');
  const [selectedJobFilter, setSelectedJobFilter] = useState<string>('ALL');
  const [selectedStageFilter, setSelectedStageFilter] = useState<string | undefined>(undefined);

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
        responsibilities: jobDescription ? jobDescription.substring(0, 120) : 'Core engineering responsibilities',
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
      alert(err.response?.data?.message || 'Stage transition denied: Gate role restriction or invalid sequence.');
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
      alert('Interview proposed successfully!');
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

  const filteredApplications = applications.filter((app) => {
    const jobMatch = selectedJobFilter === 'ALL' ? true : app.jobPostingId === selectedJobFilter;
    const stageMatch = selectedStageFilter ? app.stage === selectedStageFilter : true;
    return jobMatch && stageMatch;
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Blueprint Control Banner */}
      <div className="blueprint-panel" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="mono-tag tag-brass">[RECRUITER DISPATCH CONTROL]</span>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '0.4rem' }}>
              Candidate Transit Lines
            </h1>
            <p style={{ color: 'var(--fg-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Dispatch candidate manifests through ordered stage gates with AI CV Scorer ranking.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              className={`btn ${activeTab === 'pipeline' ? 'btn-brass' : 'btn-secondary'}`}
              onClick={() => setActiveTab('pipeline')}
            >
              <Layers size={15} /> MANIFEST PIPELINE ({applications.length})
            </button>
            <button
              type="button"
              className={`btn ${activeTab === 'jobs' ? 'btn-brass' : 'btn-secondary'}`}
              onClick={() => setActiveTab('jobs')}
            >
              <FileText size={15} /> REQUISITIONS ({jobs.length})
            </button>
            <button
              type="button"
              className="btn btn-brass"
              onClick={() => setShowJobModal(true)}
            >
              <Plus size={15} /> POST JOB (AI GENERATOR)
            </button>
          </div>
        </div>
      </div>

      {/* Signature Element: Full-Width Persistent Transit Line */}
      {activeTab === 'pipeline' && (
        <div style={{ marginBottom: '2rem' }}>
          <TransitLine
            applications={applications}
            selectedStage={selectedStageFilter}
            onSelectStage={(stage) =>
              setSelectedStageFilter(selectedStageFilter === stage ? undefined : stage)
            }
            scale="full"
          />
        </div>
      )}

      {/* Tab 1: Candidate Pipeline */}
      {activeTab === 'pipeline' && (
        <div>
          {/* Job Filter Header */}
          <div className="blueprint-panel" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={15} color="var(--accent-brass)" />
              <span className="mono-tag">FILTER BY REQUISITION:</span>
            </div>
            <select
              className="form-select"
              style={{ width: '280px' }}
              value={selectedJobFilter}
              onChange={(e) => setSelectedJobFilter(e.target.value)}
            >
              <option value="ALL">ALL REQUISITIONS ({applications.length})</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>
          </div>

          {/* Applications Table / Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filteredApplications.length === 0 ? (
              <div className="blueprint-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--fg-muted)' }}>
                No candidate manifests found at this transit station line.
              </div>
            ) : (
              filteredApplications.map((app) => (
                <div key={app.id} className="blueprint-panel" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span className="mono-tag tag-brass">ID: [APP-{app.id.substring(0, 8).toUpperCase()}]</span>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                          {app.candidate?.firstName} {app.candidate?.lastName}
                        </h3>
                        {app.aiScore !== null && (
                          <span className="mono-tag tag-brass" style={{ fontWeight: 'bold' }}>
                            <Brain size={12} /> AI SCORE: {app.aiScore}/100
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--fg-muted)', marginTop: '0.3rem', fontFamily: 'var(--font-mono)' }}>
                        REQUISITION: <strong>{app.jobPosting?.title}</strong> | EXP: {app.yearsOfExperience} YRS | SALARY EXPECTATION: ${app.salaryExpectation?.toLocaleString()}
                      </p>
                    </div>

                    {/* Actions & Stage Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span className="mono-tag tag-brass">STATION: {app.stage.toUpperCase()}</span>

                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleTriggerCvScorer(app.id)}
                        disabled={scoring}
                      >
                        <Sparkles size={13} /> {app.aiScore !== null ? 'RE-SCORE CV' : 'SCORE CV WITH AI'}
                      </button>

                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedApp(app)}
                      >
                        MANIFEST PROFILE
                      </button>

                      {app.stage === 'applied' && (
                        <button
                          type="button"
                          className="btn btn-brass btn-sm"
                          onClick={() => handleTransitionStage(app.id, 'screened')}
                        >
                          ADVANCE TO SCREENED <ArrowRight size={12} />
                        </button>
                      )}

                      {app.stage === 'shortlisted' && (
                        <button
                          type="button"
                          className="btn btn-brass btn-sm"
                          onClick={() => {
                            setInterviewAppId(app.id);
                            setShowInterviewModal(true);
                          }}
                        >
                          <Calendar size={13} /> SCHEDULE INTERVIEW
                        </button>
                      )}

                      {app.stage === 'interview_scheduled' && (
                        <button
                          type="button"
                          className="btn btn-signal-green btn-sm"
                          onClick={() => {
                            setOfferAppId(app.id);
                            setOfferRoleTitle(app.jobPosting?.title || 'Engineer');
                            setShowOfferModal(true);
                          }}
                        >
                          <FileText size={13} /> ISSUE OFFER
                        </button>
                      )}
                    </div>
                  </div>

                  {/* AI Screening Summary Preview */}
                  {app.aiStrengths && app.aiStrengths.length > 0 && (
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--line-grey)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <span className="mono-tag tag-green" style={{ display: 'inline-block', marginBottom: '0.4rem' }}>
                          AI EXTRACTION STRENGTHS:
                        </span>
                        <ul style={{ paddingLeft: '1.2rem', fontSize: '0.78rem', color: 'var(--fg-muted)' }}>
                          {app.aiStrengths.map((s: string, i: number) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="mono-tag tag-rust" style={{ display: 'inline-block', marginBottom: '0.4rem' }}>
                          AI IDENTIFIED PROBE GAPS:
                        </span>
                        <ul style={{ paddingLeft: '1.2rem', fontSize: '0.78rem', color: 'var(--fg-muted)' }}>
                          {app.aiGaps?.map((g: string, i: number) => (
                            <li key={i}>{g}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Job Postings */}
      {activeTab === 'jobs' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {jobs.map((job) => (
            <div key={job.id} className="blueprint-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{job.title}</h3>
                <span className="mono-tag tag-brass">{job.status.toUpperCase()}</span>
              </div>
              <div style={{ marginTop: '0.75rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '0.3rem' }}>
                  REQUIRED SKILLS:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {(Array.isArray(job.requiredSkills)
                    ? job.requiredSkills.flatMap((s: string) => (typeof s === 'string' ? s.split(/[,;]+/) : s))
                    : typeof job.requiredSkills === 'string'
                    ? job.requiredSkills.split(/[,;]+/)
                    : []
                  )
                    .map((s: string) => String(s).trim())
                    .filter(Boolean)
                    .map((skill: string, idx: number) => (
                      <span key={idx} className="mono-tag" style={{ fontSize: '0.68rem' }}>
                        {skill}
                      </span>
                    ))}
                </div>
              </div>

              <div style={{ marginTop: '0.75rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '0.3rem' }}>
                  RESPONSIBILITIES & DESCRIPTION:
                </span>
                <p style={{ fontSize: '0.85rem', color: 'var(--fg-muted)', lineClamp: 4, WebkitLineClamp: 4, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {job.responsibilities ? `${job.responsibilities} — ` : ''}{job.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create Job + AI JD Generator */}
      {showJobModal && (
        <div className="modal-overlay">
          <div className="blueprint-panel modal-content" style={{ padding: '2rem', maxWidth: '650px' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <span className="mono-tag tag-brass">[REQUISITION CREATION]</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.3rem' }}>
                Publish New Requisition
              </h2>
            </div>

            <form onSubmit={handleCreateJobSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">REQUISITION TITLE</label>
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
                  <label className="form-label">DEPARTMENT</label>
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
                  <label className="form-label">JOB TYPE</label>
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
                  <label className="form-label">MIN SALARY ($)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={salaryMin}
                    onChange={(e) => setSalaryMin(Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">MAX SALARY ($)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={salaryMax}
                    onChange={(e) => setSalaryMax(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">REQUIRED SKILLS (COMMA SEPARATED)</label>
                <input
                  type="text"
                  className="form-input"
                  value={skillsText}
                  onChange={(e) => setSkillsText(e.target.value)}
                  placeholder="TypeScript, Node.js, NestJS, PostgreSQL"
                />
              </div>

              <div
                style={{
                  background: '#111C27',
                  border: '1px solid var(--accent-brass)',
                  padding: '1rem',
                  borderRadius: '2px',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <span className="mono-tag tag-brass">AI FEATURE 1: JD GENERATOR</span>
                  <p style={{ fontSize: '0.75rem', color: 'var(--fg-muted)', marginTop: '0.2rem' }}>
                    Auto-fill structured engineering description via Gemini AI.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-brass btn-sm"
                  onClick={handleGenerateJd}
                  disabled={jdGenerating}
                >
                  <Sparkles size={13} /> {jdGenerating ? 'DRAFTING...' : 'GENERATE WITH AI'}
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">JOB DESCRIPTION</label>
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
                  CANCEL
                </button>
                <button type="submit" className="btn btn-brass">
                  PUBLISH REQUISITION
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Schedule Interview */}
      {showInterviewModal && (
        <div className="modal-overlay">
          <div className="blueprint-panel modal-content" style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <span className="mono-tag tag-brass">[INTERVIEW SCHEDULING]</span>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '0.3rem' }}>
                Propose Interview Time Slots
              </h2>
            </div>

            <form onSubmit={handleScheduleInterviewSubmit}>
              <div className="form-group">
                <label className="form-label">INTERVIEW TYPE</label>
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
                <label className="form-label">PROPOSED SLOT 1</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={slot1}
                  onChange={(e) => setSlot1(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">PROPOSED SLOT 2</label>
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
                  CANCEL
                </button>
                <button type="submit" className="btn btn-brass">
                  SEND PROPOSAL TO CANDIDATE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Issue Offer */}
      {showOfferModal && (
        <div className="modal-overlay">
          <div className="blueprint-panel modal-content" style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <span className="mono-tag tag-brass">[AI FEATURE 4: OFFER LETTER DRAFTER]</span>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '0.3rem' }}>
                Issue Offer & AI Draft Letter
              </h2>
            </div>

            <form onSubmit={handleIssueOfferSubmit}>
              <div className="form-group">
                <label className="form-label">ROLE TITLE</label>
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
                  <label className="form-label">ANNUAL SALARY ($)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={offerSalary}
                    onChange={(e) => setOfferSalary(Number(e.target.value))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">START DATE</label>
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
                <label className="form-label">BENEFITS SUMMARY</label>
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
                  CANCEL
                </button>
                <button type="submit" className="btn btn-brass" disabled={offerCreating}>
                  <Sparkles size={15} /> {offerCreating ? 'DRAFTING LETTER...' : 'CREATE & DRAFT LETTER'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Application AI Extraction Profile */}
      {selectedApp && (
        <div className="modal-overlay">
          <div className="blueprint-panel modal-content" style={{ padding: '2rem', maxWidth: '650px' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <span className="mono-tag tag-brass">[MANIFEST ANALYSIS PROFILE]</span>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '0.3rem' }}>
                {selectedApp.candidate?.firstName} {selectedApp.candidate?.lastName}
              </h2>
            </div>

            {selectedApp.aiScore !== null ? (
              <div>
                <div style={{ background: '#111C27', padding: '1.25rem', border: '1px solid var(--accent-brass)', textAlign: 'center', marginBottom: '1.5rem' }}>
                  <span className="mono-tag tag-brass">AI MATCH SCORE</span>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--fg-main)', margin: '0.2rem 0' }}>
                    {selectedApp.aiScore}<span style={{ fontSize: '1.2rem', color: 'var(--fg-dim)' }}>/100</span>
                  </div>
                </div>

                {selectedApp.aiExtraction && (
                  <div>
                    <span className="mono-tag" style={{ display: 'inline-block', marginBottom: '0.4rem' }}>
                      PARSED CV STRUCTURED JSON:
                    </span>
                    <pre style={{ background: '#0B131C', padding: '0.85rem', border: '1px solid var(--line-grey)', fontSize: '0.75rem', color: '#e2e8f0', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-mono)' }}>
                      {JSON.stringify(selectedApp.aiExtraction, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--fg-muted)', padding: '2rem 0', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                CV has not been scored yet. Trigger "SCORE CV WITH AI" on the pipeline table.
              </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedApp(null)}
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
