'use client';

import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';

export default function ExperimentPage() {
  return (
    <div>
      <Header
        title="Laboratory: Experiment"
        subtitle="Personal recommendation engine"
        module="lab"
      />
      <Card padding="lg" variant="lab">
        <div style={{ textAlign: 'center', padding: '48px 20px' }}>
          <div style={{ fontSize: '44px', marginBottom: '16px' }}>🧪</div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px' }}>
            Recommendation experiments are temporarily unavailable
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6, maxWidth: '560px', margin: '0 auto' }}>
            Spotify Recommendations is not available for this Development Mode app. This screen will return with a quota-safe personal recommendation engine built from your saved listening snapshots.
          </p>
        </div>
      </Card>
    </div>
  );
}
