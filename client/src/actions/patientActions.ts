import axios from "axios";
import env from "../env";
import { getFreshIdToken } from "./authAction";
import { addNotificationAction } from "./adminActions";


export const createPatientAction = async (formData: FormData): Promise<any> => {
    try {
        const token = await getFreshIdToken();
        const response = await axios.post(
            `${env.REACT_APP_BACKEND_URL}/createPatient`,
            formData,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            }
        );

        const name = formData.get("name");
        await addNotificationAction(
            `New Patient '${name}' added to the system.`,
            "1",
            "New Patient Added"
        );
        return response.data;
    } catch (error) {
        console.error("Error creating patient:", error);
        throw error;
    }
};

export const getAllPatientsAction = async (): Promise<any> => {
    try {
        const token = await getFreshIdToken();
        const response = await axios.get(
            `${env.REACT_APP_BACKEND_URL}/getAllPatients`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error getting patients:", error);
        throw error;
    }
};

export const deletePatientAction = async (ids: number | number[], name?: string): Promise<any> => {
    try {
        const token = await getFreshIdToken();
        const idsArray = Array.isArray(ids) ? ids : [ids];

        const response = await axios.delete(
            `${env.REACT_APP_BACKEND_URL}/deletePatient`,
            {
                data: { ids: idsArray },
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            }
        );

        if (name && name != undefined) {
            await addNotificationAction(
                `Patient ${name} deleted from the system.`,
                "1",
                "Patient Deleted"
            );
        }
        return response.data;
    } catch (error) {
        console.error("Error during patient deletion:", error);
        throw error;
    }
};

export const getPatientByIdAction = async (id: number): Promise<any> => {
    try {
        const token = await getFreshIdToken();
        const response = await axios.get(`${env.REACT_APP_BACKEND_URL}/getPatientById/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        return response.data;
    } catch (error) {
        console.error("Error fetching patient by ID:", error);
        throw error;
    }
};

export const updatePatientAction = async (id: number, patientData: any): Promise<any> => {
    try {
        const token = await getFreshIdToken();
        const response = await axios.put(
            `${env.REACT_APP_BACKEND_URL}/updatePatient/${id}`,
            patientData,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        return response.data;
    } catch (error) {
        console.error("Error updating patient:", error);
        throw error;
    }
};

export const checkEmailExistsAction = async (email: string): Promise<boolean> => {
    try {
        const token = await getFreshIdToken();
        const response = await axios.get(
            `${env.REACT_APP_BACKEND_URL}/check-email-exists`,
            {
                params: { email },
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        return response.data.exists;
    } catch (error) {
        console.error("Error checking email existence:", error);
        throw error;
    }
};

export const addPatientNoteAction = async (noteData: { patient_id: number; title: string; content: string; doctor_id: number }): Promise<any> => {
    try {
        const token = await getFreshIdToken();
        const response = await axios.post(
            `${env.REACT_APP_BACKEND_URL}/addNote`, noteData,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            }
        );

        return response.data;
    } catch (error) {
        console.error("Error adding patient note:", error);
        throw error;
    }
};

export const getPatientNotesAction = async (patientId: number): Promise<any> => {
    try {
        const token = await getFreshIdToken();
        const response = await axios.get(`${env.REACT_APP_BACKEND_URL}/getPatientNotesById/${patientId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        return response.data;
    } catch (error) {
        console.error("Error fetching patient by ID:", error);
        throw error;
    }
};

export const updatePatientNoteAction = async (payload: { id: number; title: string; content: string; }): Promise<any> => {
    try {
        const token = await getFreshIdToken();
        const response = await axios.put(
            `${env.REACT_APP_BACKEND_URL}/updatePatientNote/${payload.id}`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error updating patient note:", error);
        throw error;
    }
};



