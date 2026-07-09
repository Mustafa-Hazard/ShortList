/**
 * The candidate pipeline state machine.
 *
 * Applied -> Screened -> Shortlisted -> InterviewScheduled -> Offer -> Hired
 *                                                                   \-> Rejected
 *
 * Rejected can be reached from any stage except Hired.
 * Valid transitions + the roles allowed to trigger them are enforced in
 * ApplicationsService.transitionStage() (see applications/applications.service.ts),
 * not just in the enum — the enum only defines the vocabulary.
 */
export enum ApplicationStage {
  APPLIED = 'applied',
  SCREENED = 'screened',
  SHORTLISTED = 'shortlisted',
  INTERVIEW_SCHEDULED = 'interview_scheduled',
  OFFER = 'offer',
  HIRED = 'hired',
  REJECTED = 'rejected',
}
