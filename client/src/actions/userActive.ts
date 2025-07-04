import { logoutUser } from "./authAction";
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export const useInactivityTracker = () => {
    const navigate = useNavigate();
    let inactivityTime = 0; 
    const inactivityLimit = 1800000;

    const resetInactivityTimer = () => {
        inactivityTime = 0; 
    };

    const checkInactivity = () => {
        inactivityTime += 1000; 
        if (inactivityTime >= inactivityLimit) {
            logoutUser(); 
            navigate('/login'); 
        }
    };

    useEffect(() => {
        const intervalId = setInterval(checkInactivity, 1000);

        window.addEventListener('mousemove', resetInactivityTimer);
        window.addEventListener('keypress', resetInactivityTimer);
        window.addEventListener('click', resetInactivityTimer);
        window.addEventListener('scroll', resetInactivityTimer);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener('mousemove', resetInactivityTimer);
            window.removeEventListener('keypress', resetInactivityTimer);
            window.removeEventListener('click', resetInactivityTimer);
            window.removeEventListener('scroll', resetInactivityTimer);
        };
    }, [navigate]);
};
