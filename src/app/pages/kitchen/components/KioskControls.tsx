import React, { useState } from 'react';
import { Button } from '../../../components/ui/Button';

export const KioskControls: React.FC = () => {
    const [isFullscreen, setFullscreen] = useState(false);

    const toggle = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setFullscreen(true);
        } else {
            document.exitFullscreen?.();
            setFullscreen(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: 10,
            right: 10,
            opacity: 0.5,
            zIndex: 9999
        }}>
            <Button variant="secondary" onClick={toggle} style={{ padding: '6px 12px' }}>
                {isFullscreen ? 'Salir Kiosko' : 'Modo Kiosko ⛶'}
            </Button>
        </div>
    );
};
