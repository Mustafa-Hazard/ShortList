import { useState, useEffect } from 'react';
import { Briefcase, Send, Clock, Calendar, FileCheck } from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/useAuthStore';
import { TransitLine } from '../components/TransitLine';

export function CandidateDashboard() {
  const { user } = useAuthStore();
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'browse' | 'applications'>('browse');

  // Apply Modal State
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(3);
  const [salaryExpectation, setSalaryExpectation] = useState<number>(100000);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [applyLoading, setApplyLoading] = useState(false);

  // Interview Slot Modal State
  const [selectedInterview, setSelectedInterview] = useState<any | null>(null);

  // Offer Modal State
  const [selectedOffer, setSelectedOffer] = useState<any | null>(null);
  const [candidateResponse, setCandidateResponse] = useState('');

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
      const res = await apiClient.get('/applications/me');
      setApplications(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;
    setApplyLoading(true);
    try {
      const appRes = await apiClient.post('/applications', {
        jobPostingId: selectedJob.id,
        coverLetter,
        yearsOfExperience: Number(yearsOfExperience),
        salaryExpectation: Number(salaryExpectation),
      });

      const application = appRes.data;

      if (cvFile && application?.id) {
        const formData = new FormData();
        formData.append('file', cvFile);
        formData.append('applicationId', application.id);
        await apiClient.post(`/cv/${application.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setSelectedJob(null);
      fetchApplications();
      setActiveTab('applications');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Application submission failed');
    } finally {
      setApplyLoading(false);
    }
  };

  const handleConfirmSlot = async (interviewId: string, slotDate: string) => {
    try {
      await apiClient.post(`/interviews/${interviewId}/confirm`, {
        confirmedSlot: slotDate,
      });
      setSelectedInterview(null);
      fetchApplications();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Slot confirmation failed');
    }
  };

  const handleOfferResponse = async (offerId: string, status: 'accepted' | 'rejected' | 'negotiating') => {
    try {
      await apiClient.post(`/offers/${offerId}/respond`, {
        status,
        candidateResponse: candidateResponse || undefined,
      });
      setSelectedOffer(null);
      fetchApplications();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Offer response failed');
    }
  };

  const openInterviewModal = async (appId: string) => {
    try {
      const res = await apiClient.get(`/interviews/application/${appId}`);
      if (res.data && res.data.length > 0) {
        setSelectedInterview(res.data[0]);
      } else {
        alert('No proposed interview slots found yet.');
      }
    } catch (err) {
      alert('Could not fetch interview details');
    }
  };

  const openOfferModal = async (appId: string) => {
    try {
      const res = await apiClient.get(`/offers/application/${appId}`);
      setSelectedOffer(res.data);
    } catch (err) {
      alert('Offer letter has not been approved or issued yet.');
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Blueprint Control Banner */}
      <div className="blueprint-panel" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span className="mono-tag tag-brass">[CANDIDATE TRANSIT TERMINAL]</span>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '0.4rem' }}>
              Welcome, {user?.firstName} {user?.lastName}
            </h1>
            <p style={{ color: 'var(--fg-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Track your individual station position on the CogniHire transit line.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              className={`btn ${activeTab === 'browse' ? 'btn-brass' : 'btn-secondary'}`}
              onClick={() => setActiveTab('browse')}
            >
              <Briefcase size={15} /> OPEN REQUISITIONS ({jobs.length})
            </button>
            <button
              type="button"
              className={`btn ${activeTab === 'applications' ? 'btn-brass' : 'btn-secondary'}`}
              onClick={() => setActiveTab('applications')}
            >
              <Clock size={15} /> MY MANIFESTS ({applications.length})
            </button>
          </div>
        </div>
      </div>

      {/* Tab 1: Browse Jobs */}
      {activeTab === 'browse' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
          {jobs.length === 0 ? (
            <div className="blueprint-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--fg-muted)', gridColumn: '1 / -1' }}>
              No open job requisitions published on the transit line yet.
            </div>
          ) : (
            jobs.map((job) => (
              <div key={job.id} className="blueprint-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{job.title}</h3>
                    <span className="mono-tag tag-brass">{job.type}</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--fg-muted)', marginTop: '0.3rem', fontFamily: 'var(--font-mono)' }}>
                    DEPT: {job.department.toUpperCase()}
                  </p>

                  {job.salaryMin && job.salaryMax && (
                    <p style={{ fontSize: '0.85rem', color: 'var(--signal-green)', fontWeight: 600, marginTop: '0.5rem', fontFamily: 'var(--font-mono)' }}>
                      ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()} / YEAR
                    </p>
                  )}

                  <div style={{ marginTop: '1rem' }}>
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

                  <div style={{ marginTop: '1rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--fg-dim)', fontFamily: 'var(--font-mono)', display: 'block', marginBottom: '0.3rem' }}>
                      RESPONSIBILITIES & DESCRIPTION:
                    </span>
                    <p style={{ fontSize: '0.85rem', color: 'var(--fg-muted)', lineClamp: 3, WebkitLineClamp: 3, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {job.responsibilities ? `${job.responsibilities} — ` : ''}{job.description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-brass"
                  onClick={() => setSelectedJob(job)}
                  style={{ marginTop: '1.5rem', width: '100%' }}
                >
                  <Send size={15} /> Submit Candidate Manifest
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: My Applications (Single-Candidate Transit Line per Application) */}
      {activeTab === 'applications' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {applications.length === 0 ? (
            <div className="blueprint-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--fg-muted)' }}>
              No active candidate manifests on the transit line yet. Browse open requisitions to apply!
            </div>
          ) : (
            applications.map((app) => (
              <div key={app.id} className="blueprint-panel" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <span className="mono-tag tag-brass">MANIFEST ID: [APP-{app.id.substring(0, 8).toUpperCase()}]</span>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: '0.3rem' }}>
                      {app.jobPosting?.title || 'Engineer Requisition'}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {app.stage === 'interview_scheduled' && (
                      <button
                        type="button"
                        className="btn btn-brass btn-sm"
                        onClick={() => openInterviewModal(app.id)}
                      >
                        <Calendar size={14} /> Confirm Interview Slot
                      </button>
                    )}

                    {(app.stage === 'offer' || app.stage === 'hired') && (
                      <button
                        type="button"
                        className="btn btn-signal-green btn-sm"
                        onClick={() => openOfferModal(app.id)}
                      >
                        <FileCheck size={14} /> Review Official Offer Letter
                      </button>
                    )}
                  </div>
                </div>

                {/* Signature Element: Personal Transit Line */}
                <TransitLine currentStage={app.stage} scale="single" />
              </div>
            ))
          )}
        </div>
      )}

      {/* Apply Modal */}
      {selectedJob && (
        <div className="modal-overlay">
          <div className="blueprint-panel modal-content" style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <span className="mono-tag tag-brass">[MANIFEST ENTRY]</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.3rem' }}>
                Apply for {selectedJob.title}
              </h2>
            </div>

            <form onSubmit={handleApplySubmit}>
              <div className="form-group">
                <label className="form-label">YEARS OF EXPERIENCE</label>
                <input
                  type="number"
                  className="form-input"
                  value={yearsOfExperience}
                  onChange={(e) => setYearsOfExperience(Number(e.target.value))}
                  min={0}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">ANNUAL SALARY EXPECTATION ($)</label>
                <input
                  type="number"
                  className="form-input"
                  value={salaryExpectation}
                  onChange={(e) => setSalaryExpectation(Number(e.target.value))}
                  step={1000}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">UPLOAD CV DOCUMENT (PDF FILE)</label>
                <input
                  type="file"
                  className="form-input"
                  accept="application/pdf"
                  onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">COVER NOTE / STATEMENT</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Summarize relevant engineering experience..."
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedJob(null)}
                >
                  CANCEL
                </button>
                <button type="submit" className="btn btn-brass" disabled={applyLoading}>
                  {applyLoading ? 'SUBMITTING...' : 'SUBMIT MANIFEST'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interview Slot Confirm Modal */}
      {selectedInterview && (
        <div className="modal-overlay">
          <div className="blueprint-panel modal-content" style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <span className="mono-tag tag-brass">[INTERVIEW JUNCTION]</span>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginTop: '0.3rem' }}>
                Confirm Proposed Time Slot
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {selectedInterview.proposedSlots?.map((slotStr: string, idx: number) => {
                const dateObj = new Date(slotStr);
                const isConfirmed = selectedInterview.confirmedSlot && new Date(selectedInterview.confirmedSlot).getTime() === dateObj.getTime();

                return (
                  <div
                    key={idx}
                    style={{
                      padding: '0.85rem 1rem',
                      background: isConfirmed ? 'var(--signal-green-bg)' : 'rgba(0,0,0,0.3)',
                      border: '1px solid ' + (isConfirmed ? 'var(--signal-green)' : 'var(--line-grey)'),
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                      {dateObj.toLocaleString()}
                    </span>
                    {isConfirmed ? (
                      <span className="mono-tag tag-green">CONFIRMED</span>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-brass btn-sm"
                        onClick={() => handleConfirmSlot(selectedInterview.id, slotStr)}
                      >
                        CONFIRM SLOT
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedInterview(null)}
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offer Modal */}
      {selectedOffer && (
        <div className="modal-overlay">
          <div className="blueprint-panel modal-content" style={{ padding: '2rem', maxWidth: '650px' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <span className="mono-tag tag-green">[OFFER TERMINUS CLEARED]</span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--signal-green)', marginTop: '0.3rem' }}>
                Official Offer — {selectedOffer.roleTitle}
              </h2>
            </div>

            <div style={{ background: '#0B131C', padding: '1rem', border: '1px solid var(--line-grey)', marginBottom: '1rem', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
              <div>COMPENSATION: <strong>${selectedOffer.salary?.toLocaleString()} / YEAR</strong></div>
              <div>START DATE: <strong>{selectedOffer.startDate}</strong></div>
              <div style={{ marginTop: '0.5rem', color: 'var(--fg-muted)' }}>BENEFITS: {selectedOffer.benefitsSummary}</div>
            </div>

            {selectedOffer.draftedLetter && (
              <div style={{ background: '#111C27', padding: '1.25rem', border: '1px solid var(--accent-brass)', borderRadius: '2px', marginBottom: '1.5rem' }}>
                <span className="mono-tag tag-brass" style={{ display: 'inline-block', marginBottom: '0.5rem' }}>
                  OFFICIAL LETTER BODY:
                </span>
                <div style={{ fontSize: '0.85rem', color: 'var(--fg-main)', whiteSpace: 'pre-line', lineHeight: '1.6' }}>
                  {selectedOffer.draftedLetter}
                </div>
              </div>
            )}

            {selectedOffer.status === 'issued' ? (
              <div>
                <div className="form-group">
                  <label className="form-label">RESPONSE / COUNTER NOTE (OPTIONAL)</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    value={candidateResponse}
                    onChange={(e) => setCandidateResponse(e.target.value)}
                    placeholder="Enter negotiation details or acceptance note..."
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button
                    type="button"
                    className="btn btn-signal-rust"
                    onClick={() => handleOfferResponse(selectedOffer.id, 'rejected')}
                  >
                    DECLINE OFFER
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => handleOfferResponse(selectedOffer.id, 'negotiating')}
                  >
                    NEGOTIATE
                  </button>
                  <button
                    type="button"
                    className="btn btn-signal-green"
                    onClick={() => handleOfferResponse(selectedOffer.id, 'accepted')}
                  >
                    ACCEPT OFFER
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="mono-tag tag-green">
                  STATUS: {selectedOffer.status.toUpperCase()}
                </span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedOffer(null)}
                >
                  CLOSE
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
