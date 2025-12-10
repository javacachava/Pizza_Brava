import React from 'react';

interface Props {
  title: string;
  value: string | number;
  hint?: string;
  color?: string;
}

export const StatCard: React.FC<Props> = ({ title, value, hint, color = '#3182ce' }) => {
  return (
    <div style={{ backgroundColor: 'white', padding: 16, borderRadius: 8, borderLeft: `4px solid ${color}` }}>
      <div style={{ color: '#718096', fontSize: 12 }}>{title}</div>
      <div style={{ fontSize: 20, fontWeight: 'bold' }}>{value}</div>
      {hint && <div style={{ color: '#a0aec0', fontSize: 12, marginTop: 8 }}>{hint}</div>}
    </div>
  );
};
