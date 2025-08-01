import { useState, useEffect } from 'react';
import { auth } from "@firebaseConfig";

export const useAuth = () => {
    const [authenticated, setAuthenticated] = useState<boolean | null>(null);
    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                const userRole = localStorage.getItem('role');
                if (authenticated !== true) {
                    setAuthenticated(true);
                }
                if (role !== userRole) {
                    setRole(userRole);
                }
            } else {
                if (authenticated !== false) {
                    setAuthenticated(false);
                }
                if (role !== null) {
                    setRole(null);
                }
            }
        });

        return () => {
            unsubscribe();
        };
    }, [authenticated, role]);

    return { authenticated, role };
};