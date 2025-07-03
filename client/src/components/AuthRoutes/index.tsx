import { useState, useEffect } from 'react';
import { auth } from "@firebaseConfig";

export const useAuth = () => {
    const [authenticated, setAuthenticated] = useState<boolean | null>(null);
    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                setAuthenticated(true);
                const userRole = localStorage.getItem('role'); 
                setRole(userRole);
            } else {
                setAuthenticated(false);
                setRole(null);
            }
        });

        return () => unsubscribe();
    }, []);

    return { authenticated, role };
};



