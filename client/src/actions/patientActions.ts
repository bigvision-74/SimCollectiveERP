import axios from "axios";
import env from "../env";
import { getFreshIdToken } from "./authAction";
import { addNotificationAction } from "./adminActions";

export const createPatientAction = async (formData: FormData): Promise<any> => {
    try {
        const token = await getFreshIdToken();
        const response = await axios.post(
            `${env.REACT_APP_BACKEND_URL}/createPatient`, // Changed endpoint to /patients
            formData,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data", // Changed to multipart/form-data
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

// export const getPatientAction = async (id: string): Promise<any> => {
//     try {
//         const token = await getFreshIdToken();
//         const response = await axios.get(
//             `${env.REACT_APP_BACKEND_URL}/getPatient/${id}`,
//             {
//                 headers: {
//                     Authorization: `Bearer ${token}`,
//                 },
//             }
//         );
//         return response.data;
//     } catch (error) {
//         console.error("Error getting patient:", error);
//         throw error;
//     }
// };

// export const getPatientTotal = async (): Promise<any> => {
//     try {
//         const token = await getFreshIdToken();
//         const response = await axios.get(
//             `${env.REACT_APP_BACKEND_URL}/getAllPatientsCount`,
//             {
//                 headers: {
//                     Authorization: `Bearer ${token}`,
//                     "Content-Type": "application/json",
//                 },
//             }
//         );
//         return response.data;
//     } catch (error) {
//         console.error("Error Getting total patients");
//         throw error;
//     }
// };

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

// export const updatePatientAction = async (formData: FormData): Promise<any> => {
//     try {
//         const token = await getFreshIdToken();
//         const response = await axios.put(
//             `${env.REACT_APP_BACKEND_URL}/updatePatient`,
//             formData,
//             {
//                 headers: {
//                     Authorization: `Bearer ${token}`,
//                     "Content-Type": "application/json",
//                 },
//             }
//         );
//         const firstName = formData.get("firstName");
//         const lastName = formData.get("lastName");
//         await addNotificationAction(
//             `Patient '${firstName + " " + lastName}' updated.`,
//             "1",
//             "Patient Updated"
//         );
//         return response.data;
//     } catch (error) {
//         console.error("Error during patient update:", error);
//         throw error;
//     }
// };

// export const getPatientByIdentifier = async (identifier: string): Promise<any> => {
//     try {
//         const token = await getFreshIdToken();
//         const response = await axios.get(
//             `${env.REACT_APP_BACKEND_URL}/getPatientByIdentifier/${identifier}`,
//             {
//                 headers: {
//                     Authorization: `Bearer ${token}`,
//                 },
//             }
//         );
//         return response.data;
//     } catch (error) {
//         console.error("Error getting patient by identifier:", error);
//         throw error;
//     }
// };

// export const searchPatientsAction = async (query: string): Promise<any> => {
//     try {
//         const token = await getFreshIdToken();
//         const response = await axios.get(
//             `${env.REACT_APP_BACKEND_URL}/searchPatients`,
//             {
//                 params: { query },
//                 headers: {
//                     Authorization: `Bearer ${token}`,
//                 },
//             }
//         );
//         return response.data;
//     } catch (error) {
//         console.error("Error searching patients:", error);
//         throw error;
//     }
// };

// export const getPatientMedicalHistory = async (patientId: string): Promise<any> => {
//     try {
//         const token = await getFreshIdToken();
//         const response = await axios.get(
//             `${env.REACT_APP_BACKEND_URL}/getPatientMedicalHistory/${patientId}`,
//             {
//                 headers: {
//                     Authorization: `Bearer ${token}`,
//                 },
//             }
//         );
//         return response.data;
//     } catch (error) {
//         console.error("Error getting patient medical history:", error);
//         throw error;
//     }
// };

// export const addPatientMedicalRecord = async (formData: FormData): Promise<any> => {
//     try {
//         const token = await getFreshIdToken();
//         const response = await axios.post(
//             `${env.REACT_APP_BACKEND_URL}/addMedicalRecord`,
//             formData,
//             {
//                 headers: {
//                     Authorization: `Bearer ${token}`,
//                     "Content-Type": "multipart/form-data",
//                 },
//             }
//         );
//         return response.data;
//     } catch (error) {
//         console.error("Error adding medical record:", error);
//         throw error;
//     }
// };

// export const getPatientAppointments = async (patientId: string): Promise<any> => {
//     try {
//         const token = await getFreshIdToken();
//         const response = await axios.get(
//             `${env.REACT_APP_BACKEND_URL}/getPatientAppointments/${patientId}`,
//             {
//                 headers: {
//                     Authorization: `Bearer ${token}`,
//                 },
//             }
//         );
//         return response.data;
//     } catch (error) {
//         console.error("Error getting patient appointments:", error);
//         throw error;
//     }
// };

// export const getPatientsByDoctor = async (doctorId: string): Promise<any> => {
//     try {
//         const token = await getFreshIdToken();
//         const response = await axios.get(
//             `${env.REACT_APP_BACKEND_URL}/getPatientsByDoctor/${doctorId}`,
//             {
//                 headers: {
//                     Authorization: `Bearer ${token}`,
//                 },
//             }
//         );
//         return response.data;
//     } catch (error) {
//         console.error("Error getting patients by doctor:", error);
//         throw error;
//     }
// };


// export const exportPatientsData = async (): Promise<any> => {
//     try {
//         const token = await getFreshIdToken();
//         const response = await axios.get(
//             `${env.REACT_APP_BACKEND_URL}/exportPatients`,
//             {
//                 headers: {
//                     Authorization: `Bearer ${token}`,
//                     responseType: 'blob' // Important for file downloads
//                 },
//             }
//         );
//         return response.data;
//     } catch (error) {
//         console.error("Error exporting patient data:", error);
//         throw error;
//     }
// };

// Additional patient-specific actions can be added here