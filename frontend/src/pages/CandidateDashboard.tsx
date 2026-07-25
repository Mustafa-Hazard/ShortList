import { useState, useEffect } from 'react';
import { Briefcase, Send, Clock, Calendar, Sparkles, FileCheck } from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/useAuthStore';

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

      // Upload CV if selected
      if (cvFile && application?.id) {
        const formData = new FormData();
        formData.append('file', cvFile);
        formData.append('applicationId', application.id);
        await apiClient.post('/cv/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setSelectedJob(null);
      fetchApplications();
      setActiveTab('applications');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit application');
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

  const getStageBadgeClass = (stage: string) => {
    switch (stage) {
      case 'applied':
        return 'badge-primary';
      case 'screened':
        return 'badge-warning';
      case 'shortlisted':
        return 'badge-ai';
      case 'interview_scheduled':
        return 'badge-warning';
      case 'offer':
        return 'badge-success';
      case 'hired':
        return 'badge-success';
      case 'rejected':
        return 'badge-danger';
      default:
        return 'badge-primary';
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header Banner */}
      <div className="glass-card animate-fade-in" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Welcome, {user?.firstName}!</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Explore top tech roles and track your AI-assisted application status.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              className={`btn ${activeTab === 'browse' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('browse')}
            >
              <Briefcase size={16} /> Browse Job Openings ({jobs.length})
            </button>
            <button
              type="button"
              className={`btn ${activeTab === 'applications' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('applications')}
            >
              <Clock size={16} /> My Applications ({applications.length})
            </button>
          </div>
        </div>
      </div>

      {/* Tab 1: Browse Jobs */}
      {activeTab === 'browse' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {jobs.map((job) => (
            <div key={job.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>{job.title}</h3>
                  <span className="badge badge-primary">{job.type}</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                  {job.department}
                </p>

                {job.salaryMin && job.salaryMax && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600, marginTop: '0.5rem' }}>
                    ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()} / year
                  </p>
                )}

                <div style={{ marginTop: '1rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                    REQUIRED SKILLS:
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {job.requiredSkills?.map((skill: string, idx: number) => (
                      <span key={idx} className="badge badge-ai" style={{ fontSize: '0.7rem' }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '1rem', lineClamp: 3, WebkitLineClamp: 3, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {job.description || job.responsibilities}
                </p>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setSelectedJob(job)}
                style={{ marginTop: '1.5rem', width: '100%' }}
              >
                <Send size={16} /> Apply Now
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: My Applications */}
      {activeTab === 'applications' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {applications.length === 0 ? (
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              You haven't submitted any job applications yet. Browse the job board above to get started!
            </div>
          ) : (
            applications.map((app) => (
              <div key={app.id} className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                      Application #{app.id.substring(0, 8)}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      Applied on {new Date(app.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className={`badge ${getStageBadgeClass(app.stage)}`} style={{ fontSize: '0.85rem', padding: '0.3rem 0.8rem' }}>
                      Stage: {app.stage.toUpperCase()}
                    </span>

                    {app.stage === 'interview_scheduled' && (
                      <button
                        type="button"
                        className="btn btn-ai btn-sm"
                        onClick={() => openInterviewModal(app.id)}
                      >
                        <Calendar size={14} /> View Interview Slots
                      </button>
                    )}

                    {(app.stage === 'offer' || app.stage === 'hired') && (
                      <button
                        type="button"
                        className="btn btn-success btn-sm"
                        onClick={() => openOfferModal(app.id)}
                        style={{ background: 'var(--success)', color: 'white' }}
                      >
                        <FileCheck size={14} /> View Offer Letter
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Apply Modal */}
      {selectedJob && (
        <div className="modal-overlay">
          <div className="glass-card modal-content animate-fade-in" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Apply for {selectedJob.title}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Department: {selectedJob.department} | Type: {selectedJob.type}
            </p>

            <form onSubmit={handleApplySubmit}>
              <div className="form-group">
                <label className="form-label">Years of Experience</label>
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
                <label className="form-label">Salary Expectation ($/year)</label>
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
                <label className="form-label">Upload CV (PDF file)</label>
                <input
                  type="file"
                  className="form-input"
                  accept="application/pdf"
                  onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Cover Letter / Note</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Share why you are a great fit for this role..."
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedJob(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={applyLoading}>
                  {applyLoading ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interview Slot Confirm Modal */}
      {selectedInterview && (
        <div className="modal-overlay">
          <div className="glass-card modal-content animate-fade-in" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Confirm Interview Slot
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Interview Type: <strong style={{ color: 'var(--primary)' }}>{selectedInterview.type.toUpperCase()}</strong>
            </p>

            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem' }}>
              Recruiter Proposed Slots:
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {selectedInterview.proposedSlots?.map((slotStr: string, idx: number) => {
                const dateObj = new Date(slotStr);
                const isConfirmed = selectedInterview.confirmedSlot && new Date(selectedInterview.confirmedSlot).getTime() === dateObj.getTime();

                return (
                  <div
                    key={idx}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: '8px',
                      background: isConfirmed ? 'var(--success-bg)' : 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid ' + (isConfirmed ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-color)'),
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>{dateObj.toLocaleString()}</span>
                    {isConfirmed ? (
                      <span className="badge badge-success">Confirmed</span>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => handleConfirmSlot(selectedInterview.id, slotStr)}
                      >
                        Confirm Slot
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
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offer Modal */}
      {selectedOffer && (
        <div className="modal-overlay">
          <div className="glass-card modal-content animate-fade-in" style={{ padding: '2rem', maxWidth: '650px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--success)', marginBottom: '0.5rem' }}>
              Job Offer — {selectedOffer.roleTitle}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Annual Compensation: <strong style={{ color: '#f9fafb' }}>${selectedOffer.salary?.toLocaleString()}</strong> | Start Date: <strong style={{ color: '#f9fafb' }}>{selectedOffer.startDate}</strong>
            </p>

            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                BENEFITS SUMMARY:
              </h4>
              <p style={{ fontSize: '0.85rem' }}>{selectedOffer.benefitsSummary}</p>
            </div>

            {selectedOffer.draftedLetter && (
              <div className="glass-card-ai" style={{ padding: '1.25rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--ai-purple)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sparkles size={16} /> Official Offer Letter Body:
                </h4>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'pre-line', lineHeight: '1.6' }}>
                  {selectedOffer.draftedLetter}
                </div>
              </div>
            )}

            {selectedOffer.status === 'issued' ? (
              <div>
                <div className="form-group">
                  <label className="form-label">Negotiation / Response Message (Optional)</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    value={candidateResponse}
                    onChange={(e) => setCandidateResponse(e.target.value)}
                    placeholder="Enter any notes or counter-offer details..."
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => handleOfferResponse(selectedOffer.id, 'rejected')}
                  >
                    Decline Offer
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => handleOfferResponse(selectedOffer.id, 'negotiating')}
                  >
                    Negotiate
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleOfferResponse(selectedOffer.id, 'accepted')}
                    style={{ background: 'var(--success)' }}
                  >
                    Accept Offer
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge badge-success" style={{ fontSize: '0.9rem' }}>
                  Status: {selectedOffer.status.toUpperCase()}
                </span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedOffer(null)}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
