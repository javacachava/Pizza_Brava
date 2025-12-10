import { usePOSContext } from '../contexts/POSContext';

// Hook puente simple para mantener arquitectura limpia
export const usePOS = () => {
    return usePOSContext();
};