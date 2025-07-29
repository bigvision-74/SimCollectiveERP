import axios from "axios";
import env from "../../env";
import { getFreshIdToken } from "./authAction";
import { addNotificationAction } from "./adminActions";
import { Observation } from "@/types/observation";

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

    // const name = formData.get("name");
    // await addNotificationAction(
    //   `New Patient '${name}' added to the system.`,
    //   "1",
    //   "New Patient Added"
    // );
    return response.data;
  } catch (error) {
    console.error("Error creating patient:", error);
    throw error;
  }
};

export const addInvestigationAction = async (formData: {
  category: string;
  test_name: string;
}): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/addInvestigation`,
      formData,
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

export const getUserReportAction = async (orgId?: string): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getUserReport?orgId=${orgId}`,
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
export const getUserReportsListByIdAction = async (
  id: number
): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/getUserReportsListById/${id}`,
      {},
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

export const getAllRequestInvestigationAction = async (): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getAllRequestInvestigations`,
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

export const getPatientRequestsAction = async (
  userId: number
): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getPatientRequests/${userId}`,
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

export const getInvestigationParamsAction = async (
  id: number
): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getInvestigationParams/${id}`,
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

export const getInvestigationReportsAction = async (
  id: number
): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getInvestigationReports/${id}`,
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

export const getCategoryAction = async (): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getCategory`,
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
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getPatientById/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching patient by ID:", error);
    throw error;
  }
};

export const updatePatientAction = async (
  id: number,
  patientData: any
): Promise<any> => {
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

export const submitInvestigationResultsAction = async (payload: {
  payload: any;
}): Promise<any> => {
  try {
    const token = await getFreshIdToken();

    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/submitInvestigationResults`,
      payload,
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

export const checkEmailExistsAction = async (
  email: string
): Promise<boolean> => {
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

export const addPatientNoteAction = async (noteData: {
  patient_id: number;
  title: string;
  content: string;
  doctor_id: number;
}): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/addNote`,
      noteData,
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

export const getPatientNotesAction = async (
  patientId: number
): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getPatientNotesById/${patientId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching patient by ID:", error);
    throw error;
  }
};

export const updatePatientNoteAction = async (payload: {
  id: number;
  title: string;
  content: string;
}): Promise<any> => {
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

export const addObservationAction = async (
  payload: Observation & { patient_id: number }
): Promise<any> => {
  try {
    const token = await getFreshIdToken();

    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/addObservations`,
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
    console.error("Error adding observation:", error);
    throw error;
  }
};

export const getObservationsByIdAction = async (
  patientId: number
): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getObservationsById/${patientId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching patient by ID:", error);
    throw error;
  }
};

export const assignPatientAction = async (
  userId: number,
  patientIds: number[],
  assignedBy: number
) => {
  try {
    const token = await getFreshIdToken();

    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/assignPatients`,
      { userId, patientIds, assigned_by: assignedBy },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error during patient assignment:", error);
    throw error;
  }
};

export const getAssignedPatientsAction = async (userId: number) => {
  try {
    const token = await getFreshIdToken();

    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getAssignedPatients/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching assigned patients:", error);
    throw error;
  }
};

export const getInvestigationsAction = async () => {
  try {
    const token = await getFreshIdToken();

    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getInvestigations`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching assigned patients:", error);
    throw error;
  }
};

export const saveRequestedInvestigationsAction = async (
  payload: any[],
  faculties: any[],
  superadminIds: any[]
) => {
  try {
    const token = await getFreshIdToken();

    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/saveRequestedInvestigations`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    // ✅ Prepare meaningful notification message
    const testNames = payload.map((p) => p.test_name).join(", ");

    for (const faculty of faculties) {
      await addNotificationAction(
        `New investigation request(s) ${testNames} added to the platform.`,
        faculty.id.toString(),
        "New Investigation Request"
      );
    }

    for (const superadminId of superadminIds) {
      await addNotificationAction(
        `New investigation request(s) ${testNames} added to the platform.`,
        superadminId.toString(),
        "New Investigation Request"
      );
    }

    return response.data;
  } catch (error) {
    console.error("Error saving investigation requests:", error);
    throw error;
  }
};

export const getRequestedInvestigationsByIdAction = async (
  patientId: number
): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getRequestedInvestigationsById/${patientId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching request investigation by ID:", error);
    throw error;
  }
};

export const getPatientsByUserOrgAction = async (userId: number) => {
  try {
    const token = await getFreshIdToken();

    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getPatientsByUserOrg/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching assigned patients:", error);
    throw error;
  }
};

export const generateAIPatientAction = async (formData: {
  gender: string;
  room: string;
  speciality: string;
  condition: string;
  department: string;
  count?: number;
}): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/generateAIPatient`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error generating AI patient:", error);
    throw error;
  }
};

export const saveParamtersAction = async (formData: FormData): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/saveParamters`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error generating AI patient:", error);
    throw error;
  }
};

export const saveGeneratedPatientsAction = async (patients: any[]) => {
  try {
    const token = await getFreshIdToken();

    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/saveGeneratedPatients`,
      patients,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Failed to save AI patients:", error);
    throw error;
  }
};

export const saveFluidBalanceAction = async ({
  patient_id,
  observations_by,
  fluid_intake,
  fluid_output,
}: {
  patient_id: string;
  observations_by: string;
  fluid_intake: string;
  fluid_output: string;
}) => {
  try {
    const token = await getFreshIdToken();

    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/saveFluidBalance`,
      {
        patient_id,
        observations_by,
        fluid_intake,
        fluid_output,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Failed to save fluid balance:", error);
    throw error;
  }
};

export const getFluidBalanceByPatientIdAction = async (patient_id: number) => {
  try {
    const token = await getFreshIdToken();

    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getFluidBalanceByPatientId/${patient_id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Failed to fetch fluid balance data:", error);
    throw error;
  }
};

export const getAllTypeRequestInvestigationAction = async (): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getAllTypeRequestInvestigation`,
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


