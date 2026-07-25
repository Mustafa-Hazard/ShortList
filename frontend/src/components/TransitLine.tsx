import { Lock, Check } from 'lucide-react';

export interface TransitStation {
  id: string;
  code: string;
  name: string;
  roleGate: 'recruiter' | 'hiring_manager' | 'all';
  isJunction?: boolean;
  isTerminus?: boolean;
}

export const PIPELINE_STATIONS: TransitStation[] = [
  { id: 'applied', code: 'STN-01', name: 'Applied', roleGate: 'recruiter' },
  { id: 'screened', code: 'STN-02', name: 'Screened', roleGate: 'recruiter' },
  { id: 'shortlisted', code: 'JCT-03', name: 'Shortlisted', roleGate: 'hiring_manager', isJunction: true },
  { id: 'interview_scheduled', code: 'STN-04', name: 'Interview', roleGate: 'recruiter' },
  { id: 'offer', code: 'JCT-05', name: 'Offer', roleGate: 'hiring_manager', isJunction: true },
  { id: 'hired', code: 'TRM-06', name: 'Hired', roleGate: 'all', isTerminus: true },
];

interface TransitLineProps {
  currentStage?: string;
  applications?: any[];
  selectedStage?: string;
  onSelectStage?: (stage: string) => void;
  scale?: 'full' | 'condensed' | 'single';
}

export function TransitLine({
  currentStage = 'applied',
  applications = [],
  selectedStage,
  onSelectStage,
  scale = 'full',
}: TransitLineProps) {
  const currentIdx = PIPELINE_STATIONS.findIndex((s) => s.id === currentStage);

  const getStationCount = (stationId: string) => {
    return applications.filter((a) => a.stage === stationId).length;
  };

  return (
    <div className="transit-line-container">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: scale === 'condensed' ? '0.5rem' : '1rem',
          borderBottom: '1px solid var(--line-grey)',
          paddingBottom: '0.5rem',
        }}
      >
        <span className="mono-tag tag-brass" style={{ fontSize: '0.7rem' }}>
          TALENTBRIDGE LINE 01 // STAGE TRANSIT CONTROL
        </span>
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.7rem', color: 'var(--fg-muted)', fontFamily: 'var(--font-mono)' }}>
          <span>● RECRUITER GATE</span>
          <span style={{ color: 'var(--accent-brass)' }}>◆ HIRING MANAGER JUNCTION</span>
        </div>
      </div>

      <div className="transit-track">
        {PIPELINE_STATIONS.map((stn, idx) => {
          const count = getStationCount(stn.id);
          const isPassed = currentIdx > idx;
          const isActive = currentIdx === idx || selectedStage === stn.id;

          return (
            <div
              key={stn.id}
              className={`transit-station-node ${isActive ? 'active' : ''} ${isPassed ? 'passed' : ''} ${stn.isJunction ? 'junction' : ''}`}
              onClick={() => onSelectStage && onSelectStage(stn.id)}
            >
              {/* Station Marker Indicator */}
              <div className="station-indicator">
                <span>
                  {isPassed ? <Check size={12} /> : stn.isJunction ? '◆' : idx + 1}
                </span>
              </div>

              {/* Station Code & Name */}
              <span className="station-label">{stn.name}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--fg-dim)' }}>
                [{stn.code}]
              </span>

              {/* Candidate Count Node Pill */}
              {scale !== 'single' && (
                <div
                  style={{
                    marginTop: '0.35rem',
                    background: count > 0 ? 'var(--accent-brass)' : 'rgba(0,0,0,0.4)',
                    color: count > 0 ? '#0F1A24' : 'var(--fg-dim)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.68rem',
                    fontWeight: 'bold',
                    padding: '0.1rem 0.45rem',
                    borderRadius: '2px',
                    border: '1px solid ' + (count > 0 ? 'var(--accent-brass)' : 'var(--line-grey)'),
                  }}
                >
                  {count}
                </div>
              )}

              {/* Junction Role Badge */}
              {stn.roleGate === 'hiring_manager' && (
                <span
                  style={{
                    fontSize: '0.58rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--accent-brass)',
                    marginTop: '0.2rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.15rem',
                  }}
                >
                  <Lock size={8} /> HM GATE
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
