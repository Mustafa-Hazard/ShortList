import { useState, useEffect } from 'react';
import { UserCheck, Sparkles, HelpCircle, CheckCheck, Brain, ArrowRight, FileCheck } from 'lucide-react';
import { apiClient } from '../api/client';

export function HiringManagerDashboard() {
  const [applications, setApplications] = useState<any[]>([]);

  // Question Suggester Modal / Drawer State
  const [selectedInterviewModal, setSelectedInterviewModal] = useState<any | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);

  // Offer Letter Approval Drawer State
  const [selectedOfferModal, setSelectedOfferModal] = useState<any | null>(null);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await apiClient.get('/applications');
      setApplications(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateQuestions = async (interviewId: string) => {
    setQuestionsLoading(true);
    try {
      const res = await apiClient.post(`/interviews/${interviewId}/generate-questions`);
      setQuestions(res.data.questions || []);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to generate interview questions');
    } finally {
      setQuestionsLoading(false);
    }
  };

  const openInterviewQuestionDrawer = async (appId: string) => {
    try {
      const res = await apiClient.get(`/interviews/application/${appId}`);
      if (res.data && res.data.length > 0) {
        const interview = res.data[0];
        setSelectedInterviewModal(interview);
        setQuestions(interview.questions || []);
      } else {
        alert('No interview scheduled for this candidate yet.');
      }
    } catch (err) {
      alert('Could not fetch interview details');
    }
  };

  const openOfferApprovalDrawer = async (appId: string) => {
    try {
      const res = await apiClient.get(`/offers/application/${appId}`);
      setSelectedOfferModal(res.data);
    } catch (err) {
      alert('No offer issued for this application yet.');
    }
  };

  const handleApproveOffer = async (offerId: string) => {
    setApproving(true);
    try {
      await apiClient.post(`/offers/${offerId}/approve`);
      alert('Offer letter approved! Candidate can now view and accept the offer.');
      setSelectedOfferModal(null);
      fetchApplications();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Approval failed');
    } finally {
      setApproving(false);
    }
  };

  const handleTransitionStage = async (appId: string, targetStage: string) => {
    try {
      await apiClient.patch(`/applications/${appId}/stage`, { targetStage });
      fetchApplications();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Stage transition failed');
    }
  };

  const shortlistedApps = applications.filter(
    (a) => a.stage === 'shortlisted' || a.stage === 'interview_scheduled' || a.stage === 'offer',
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Header Banner */}
      <div className="glass-card animate-fade-in" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Hiring Manager Workspace</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Evaluate shortlisted candidates, generate AI interview questions, and approve offer letters.
            </p>
          </div>
          <span className="badge badge-warning" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
            <UserCheck size={14} /> Shortlist Review ({shortlistedApps.length})
          </span>
        </div>
      </div>

      {/* Applications List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {shortlistedApps.length === 0 ? (
          <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No shortlisted candidates pending your review right now.
          </div>
        ) : (
          shortlistedApps.map((app) => (
            <div key={app.id} className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                      {app.candidate?.firstName} {app.candidate?.lastName}
                    </h3>
                    {app.aiScore !== null && (
                      <span className="badge badge-ai" style={{ fontSize: '0.8rem' }}>
                        <Brain size={12} /> AI Match: {app.aiScore}/100
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    Role: <strong>{app.jobPosting?.title}</strong> | Stage: <strong style={{ color: 'var(--primary)' }}>{app.stage.toUpperCase()}</strong>
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-ai btn-sm"
                    onClick={() => openInterviewQuestionDrawer(app.id)}
                  >
                    <HelpCircle size={14} /> AI Interview Questions
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => openOfferApprovalDrawer(app.id)}
                  >
                    <FileCheck size={14} /> Review & Approve Offer
                  </button>

                  {app.stage === 'shortlisted' && (
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => handleTransitionStage(app.id, 'interview_scheduled')}
                    >
                      Schedule Interview <ArrowRight size={12} />
                    </button>
                  )}

                  {app.stage === 'interview_scheduled' && (
                    <button
                      type="button"
                      className="btn btn-warning btn-sm"
                      onClick={() => handleTransitionStage(app.id, 'offer')}
                    >
                      Move to Offer <ArrowRight size={12} />
                    </button>
                  )}

                  {app.stage === 'offer' && (
                    <button
                      type="button"
                      className="btn btn-success btn-sm"
                      onClick={() => handleTransitionStage(app.id, 'hired')}
                      style={{ background: 'var(--success)', color: 'white' }}
                    >
                      Hire Candidate <CheckCheck size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: AI Question Suggester Drawer */}
      {selectedInterviewModal && (
        <div className="modal-overlay">
          <div className="glass-card modal-content animate-fade-in" style={{ padding: '2rem', maxWidth: '700px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--ai-purple)' }}>
                  AI Feature 3: Tailored Interview Questions
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Generated based on job requirements and candidate profile gaps.
                </p>
              </div>
              <button
                type="button"
                className="btn btn-ai btn-sm"
                onClick={() => handleGenerateQuestions(selectedInterviewModal.id)}
                disabled={questionsLoading}
              >
                <Sparkles size={14} /> {questionsLoading ? 'Generating...' : 'Regenerate Questions'}
              </button>
            </div>

            {questions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
                No AI questions generated yet. Click "Regenerate Questions" above to invoke Gemini AI.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '450px', overflowY: 'auto' }}>
                {questions.map((q: any, idx: number) => (
                  <div key={idx} style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f9fafb', marginBottom: '0.3rem' }}>
                      Q{idx + 1}: {q.question}
                    </p>

                    {q.category && (
                      <span className="badge badge-primary" style={{ fontSize: '0.68rem', marginBottom: '0.5rem' }}>
                        Category: {q.category}
                      </span>
                    )}

                    {q.listenFor && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--success)', marginTop: '0.4rem' }}>
                        <strong>What to listen for:</strong> {q.listenFor}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedInterviewModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Offer Letter Approval */}
      {selectedOfferModal && (
        <div className="modal-overlay">
          <div className="glass-card modal-content animate-fade-in" style={{ padding: '2rem', maxWidth: '650px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Review & Approve Offer Letter
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Role: <strong>{selectedOfferModal.roleTitle}</strong> | Salary: <strong>${selectedOfferModal.salary?.toLocaleString()}</strong>
            </p>

            <div className="glass-card-ai" style={{ padding: '1.25rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--ai-purple)', marginBottom: '0.5rem' }}>
                AI-DRAFTED LETTER BODY:
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'pre-line', lineHeight: '1.6' }}>
                {selectedOfferModal.draftedLetter || 'No draft body generated.'}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className={`badge ${selectedOfferModal.letterApproved ? 'badge-success' : 'badge-warning'}`}>
                Approval Status: {selectedOfferModal.letterApproved ? 'APPROVED' : 'PENDING APPROVAL'}
              </span>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedOfferModal(null)}
                >
                  Close
                </button>
                {!selectedOfferModal.letterApproved && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleApproveOffer(selectedOfferModal.id)}
                    disabled={approving}
                    style={{ background: 'var(--success)' }}
                  >
                    <CheckCheck size={16} /> {approving ? 'Approving...' : 'Approve Offer Letter'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
