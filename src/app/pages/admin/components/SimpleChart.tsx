import React from 'react';

interface Props {
    data: { label: string; value: number }[];
    title: string;
    color: string;
}

export const SimpleChart: React.FC<Props> = ({ data, title, color }) => {
    const maxVal = Math.max(...data.map(d => d.value));

    return (
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '1rem', color: '#4a5568' }}>{title}</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', height: '150px', gap: '10px' }}>
                {data.map((d, i) => (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ 
                            width: '100%', 
                            height: `${(d.value / maxVal) * 100}%`, 
                            backgroundColor: color, 
                            borderRadius: '4px 4px 0 0',
                            transition: 'height 0.3s ease',
                            minHeight: '4px'
                        }} title={`${d.value}`} />
                        <span style={{ fontSize: '0.7rem', marginTop: '5px', color: '#718096' }}>{d.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};