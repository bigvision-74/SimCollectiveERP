import axios from "axios";
import env from "../../env";
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

export const deletePatientAction = async (
    ids: number | number[],
    name?: string
): Promise<any> => {
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

