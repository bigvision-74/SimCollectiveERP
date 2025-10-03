import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '@/actions/authAction';
import { useAuth } from '@/components/AuthRoutes'; 

const SIX_HOURS_IN_MS = 6 * 60 * 60 * 1000;
// const SIX_HOURS_IN_MS = 30 * 1000; 

export const useSessionTimeout = () => {
    const navigate = useNavigate();
    const { authenticated } = useAuth();
    const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (authenticated === true) {
            console.log("User is authenticated. Starting session timer.");
            timeoutIdRef.current = setTimeout(() => {
                console.log("Session timeout: Time elapsed. Logging out.");
                logoutUser();
                navigate('/login');
            }, SIX_HOURS_IN_MS);
        }
        return () => {
            if (timeoutIdRef.current) {
                console.log("Clearing session timer.");
                clearTimeout(timeoutIdRef.current);
            }
        };

    }, [authenticated, navigate]);
};