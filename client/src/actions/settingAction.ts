import axios from "axios";
import env from "../../env";
import { getFreshIdToken, } from "./authAction";

export const saveSettingsAction = async (formData: FormData): Promise<any> => {
    try {
        const token = await getFreshIdToken();

        const response = await axios.post(
            `${env.REACT_APP_BACKEND_URL}/saveSettings`,
            formData,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error saving settings:", error);
        throw error;
    }
};

export const getSettingsAction = async (): Promise<any> => {
    try {
        const token = await getFreshIdToken();

        const response = await axios.get(
            `${env.REACT_APP_BACKEND_URL}/getSettings`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        return response.data.data;
    } catch (error) {
        console.error("Error saving settings:", error);
        throw error;
    }
};
