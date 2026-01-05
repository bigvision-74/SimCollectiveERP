import axios from "axios";
import env from "../../env";
import { getFreshIdToken } from "./authAction";
import { addNotificationAction } from "./adminActions";
import { Observation } from "@/types/observation";
import Prescriptions from "@/components/PatientDetails/Prescriptions";

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

export const addNewMedicationAction = async (
  formData: FormData
): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/addNewMedication`,
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

export const updateMedicationAction = async (
  formData: FormData
): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/updateMedication`,
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

export const deleteMedicationAction = async (
  id: string,
  performerId: string
): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.delete(
      `${env.REACT_APP_BACKEND_URL}/deleteMedication/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        data: { performerId },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating category:", error);
    throw error;
  }
};

// fecth medican drop down funciton
export const getAllMedicationsAction = async () => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getAllMedications`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (err) {
    console.error("Failed to fetch medications:", err);
    throw err;
  }
};

export const getActivePatientsAction = async () => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getActivePatients`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (err) {
    console.error("Failed to fetch active patients:", err);
    throw err;
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
  patientId: number,
  orgId: number
): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const role = localStorage.getItem("role");

    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/getUserReportsListById/${patientId}/${orgId}?role=${role}`,
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
    const user = localStorage.getItem("user");
    const role = localStorage.getItem("role");

    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getAllRequestInvestigations`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          user,
          role,
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
  userId: number,
  orgId: number
): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getPatientRequests/${userId}?orgId=${orgId}`,
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

export const getInvestigationReportsAction_old = async (
  patientId: number,
  investigationId: number,
  orgId: number
): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const role = localStorage.getItem("role");

    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/getInvestigationReports/${patientId}/${investigationId}/${orgId}?role=${role}`,
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
  patientId: number,
  investigationId: number,
  orgId: number
): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const role = localStorage.getItem("role");

    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/getInvestigationReports/${patientId}/${investigationId}/${orgId}?role=${role}`,
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

export const getInvestigationsByCategoryAction = async (
  category_id: string
): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getInvestigationsByCategory/${category_id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error getting investigations:", error);
    throw error;
  }
};

export const deletePatientAction = async (
  ids: number | number[],
  name?: string,
  performerId?: string
): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const idsArray = Array.isArray(ids) ? ids : [ids];

    const response = await axios.delete(
      `${env.REACT_APP_BACKEND_URL}/deletePatient`,
      {
        data: { ids: idsArray, performerId: performerId },
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (name && name != undefined) {
      await addNotificationAction(
        `Patient deleted from the system.`,
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

export const submitInvestigationResultsAction = async (data: {
  payload: any;
  note: string;
}): Promise<any> => {
  try {
    const token = await getFreshIdToken();

    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/submitInvestigationResults`,
      data,
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

export const addPatientNoteAction = async (formData: any): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/addNote`,
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

// export const getPatientNotesAction = async (
//   patientId: number,
//   orgId: number
// ): Promise<any> => {
//   try {
//     const token = await getFreshIdToken();
//     const role = localStorage.getItem("role");

//     const response = await axios.get(
//       `${env.REACT_APP_BACKEND_URL}/getPatientNotesById/${patientId}/${orgId}?role=${role}`,
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       }
//     );

//     return response.data;
//   } catch (error) {
//     console.error("Error fetching patient by ID:", error);
//     throw error;
//   }
// };

export const getPatientNotesAction = async (
  patientId: number,
  orgId: number,
  reportId?: number
): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const role = localStorage.getItem("role");

    let url = `${env.REACT_APP_BACKEND_URL}/getPatientNotesById/${patientId}/${orgId}?role=${role}`;
    if (reportId) {
      url += `&reportId=${reportId}`;
    }

    const response = await axios.get(url, {
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

export const updatePatientNoteAction = async (
  id: string,
  formData: FormData
): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.put(
      `${env.REACT_APP_BACKEND_URL}/updatePatientNote/${id}`,
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
  patientId: number,
  orgId: number
): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const role = localStorage.getItem("role");

    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getObservationsById/${patientId}/${orgId}?role=${role}`,
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

export const updateObservationsAction = async (obsData: any): Promise<any> => {
  try {
    const token = await getFreshIdToken();

    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/updateObservations`,
      obsData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error adding observation:", error);
    throw error;
  }
};

export const updateFluidBalanceAction = async (
  FluidData: any
): Promise<any> => {
  try {
    const token = await getFreshIdToken();

    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/updateFluidBalance`,
      FluidData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error adding observation:", error);
    throw error;
  }
};

export const getObservationsByTableIdAction = async (
  obsId: number
): Promise<any> => {
  try {
    const token = await getFreshIdToken();

    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getObservationsByTableId/${obsId}`,
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

export const getFluidByTableIdAction = async (
  FluidId: number
): Promise<any> => {
  try {
    const token = await getFreshIdToken();

    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getFluidByTableId/${FluidId}`,
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

export const getFluidBalanceByIdAction = async (
  patientId: number,
  orgId: number
): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const role = localStorage.getItem("role");

    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getFluidBalanceById/${patientId}/${orgId}?role=${role}`,
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
export const getFluidBalanceByIdAction1 = async (
  patientId: number,
  orgId: number
): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const role = localStorage.getItem("role");

    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getFluidBalanceById1/${patientId}/${orgId}?role=${role}`,
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

export const getInvestigationsAction = async (id?: string) => {
  try {
    const token = await getFreshIdToken();

    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getInvestigations/${id}`,
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

export const getAllInvestigationsAction = async () => {
  try {
    const token = await getFreshIdToken();

    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getAllInvestigations`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error getting all investigations:", error);
    throw error;
  }
};

export const saveRequestedInvestigationsAction = async (
  payload: any[],
  faculties: any[],
  superadminIds: any[],
  administratorIds: any[],
  sessionId: number
) => {
  try {
    const token = await getFreshIdToken();
    const role = localStorage.getItem("role");

    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/saveRequestedInvestigations/${sessionId}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    //  Prepare meaningful notification message
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

    for (const adminId of administratorIds) {
      await addNotificationAction(
        `New investigation request(s) ${testNames} added to the platform.`,
        adminId.toString(),
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
  patientId: number,
  orgId: number
): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const role = localStorage.getItem("role");

    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getRequestedInvestigationsById/${patientId}/${orgId}?role=${role}`,
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

export const getPatientsByOrgIdAction = async (orgId: number) => {
  try {
    const token = await getFreshIdToken();

    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getPatientsByOrgId/${orgId}`,
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
  organisation_id,
  fluid_intake,
  type,
  units,
  duration,
  route,
  timestamp,
  notes,
  sessionId,
}: {
  patient_id: string;
  observations_by: string;
  organisation_id: string;
  fluid_intake: string;
  type: string;
  units: string;
  duration: string;
  route: string;
  timestamp: string;
  notes: string;
  sessionId: number;
}) => {
  try {
    const token = await getFreshIdToken();

    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/saveFluidBalance`,
      {
        patient_id,
        observations_by,
        organisation_id,
        fluid_intake,
        type,
        units,
        duration,
        route,
        timestamp,
        notes,
        sessionId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Failed to save fluid balance:", error);
    throw error;
  }
};

export const getFluidBalanceByPatientIdAction = async (
  patient_id: number,
  orgId: number
) => {
  try {
    const token = await getFreshIdToken();
    const role = localStorage.getItem("role");

    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getFluidBalanceByPatientId/${patient_id}/${orgId}?role=${role}`,
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

// patient note delete
export const deletePatientNoteAction = async (
  noteId: number,
  sessionId: number,
  addedBy: number
): Promise<any> => {
  try {
    const token = await getFreshIdToken();

    const response = await axios.delete(
      `${env.REACT_APP_BACKEND_URL}/deletePatientNote/${noteId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: { sessionId, addedBy },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error deleting patient note:", error);
    throw error;
  }
};

export const deletePrescriptionAction = async (
  prescriptionId: number,
  sessionId: number,
  performerId: number
): Promise<any> => {
  try {
    const token = await getFreshIdToken();

    const response = await axios.delete(
      `${env.REACT_APP_BACKEND_URL}/deletePrescription/${prescriptionId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: { sessionId, performerId },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error deleting patient note:", error);
    throw error;
  }
};

// observation delete
export const deleteObservationAction = async (
  obsId: number,
  sessionId: number,
  performerId: number
): Promise<any> => {
  try {
    const token = await getFreshIdToken();

    const response = await axios.delete(
      `${env.REACT_APP_BACKEND_URL}/deleteObservation/${obsId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: { sessionId, performerId },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error deleting patient observation:", error);
    throw error;
  }
};

export const deleteFluidBalanceAction = async (
  FluidId: number,
  sessionId: number,
  performerId: number
): Promise<any> => {
  try {
    const token = await getFreshIdToken();

    const response = await axios.delete(
      `${env.REACT_APP_BACKEND_URL}/deleteFluidBalance/${FluidId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data: { sessionId, performerId },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error deleting patient observation:", error);
    throw error;
  }
};

export const updateCategoryAction = async (
  oldCategory: string,
  newCategory: string,
  performerId: string
): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/updateCategory`,
      { oldCategory, newCategory, performerId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating category:", error);
    throw error;
  }
};

export const updateInvestigationAction = async (
  formData: FormData
): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/updateParams`,
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
    console.error("Error updating category:", error);
    throw error;
  }
};

export const addPrescriptionAction = async (prescriptionData: {
  patient_id: number;
  sessionId: number;
  doctor_id: number;
  organisation_id: number;
  description: string;
  medication_name: string;
  indication: string;
  dose: string;
  TypeofDrug: string;
  DrugSubGroup: string;
  DrugGroup: string;
  Duration: string;
  Instructions: string;
  Frequency: string;
  Way: string;
  Unit: string;
  route: string;
  start_date: string;
  days_given: any;
  administration_time: string;
}): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/addPrescription`,
      prescriptionData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error adding prescription:", error);
    throw error;
  }
};

export const deleteParamsAction = async (
  id: string,
  performerId: string
): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.delete(
      `${env.REACT_APP_BACKEND_URL}/deletetestparams/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        data: { performerId },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating category:", error);
    throw error;
  }
};

// update Prescriptions function
export const updatePrescriptionAction = async (payload: {
  id: number;
  patient_id: number;
  doctor_id: number;
  sessionId: number;
  organisation_id: number;
  description: string;
  medication_name: string;
  indication: string;
  dose: string;
  TypeofDrug: string;
  DrugSubGroup: string;
  DrugGroup: string;
  Duration: string;
  Instructions: string;
  Frequency: string;
  Way: string;
  Unit: string;
  route: string;
  start_date: string;
  days_given: number;
  administration_time: string;
  performerId: string;
}): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.put(
      `${env.REACT_APP_BACKEND_URL}/updatePrescription/${payload.id}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating prescription:", error);
    throw error;
  }
};

export const getPrescriptionsAction = async (
  patientId: number,
  orgId: number
): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const role = localStorage.getItem("role");

    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getPrescriptionsByPatientId/${patientId}/${orgId}?role=${role}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data; // should ideally be typed
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    throw error;
  }
};

export const getPrescriptionsByIdAction = async (
  prescriptionId: number
): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getPrescriptionsById/${prescriptionId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data; // should ideally be typed
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    throw error;
  }
};

// getall  public patient list
export const getPublicPatientsAction = async (): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getAllPublicPatients`,
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

// GET TEST VALUE TEMPLATE
export const getReportTemplatesAction = async (
  investigationId: number,
  patientId: number
): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getReportTemplates`,
      {
        params: { investigationId, patientId },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error getting report templates:", error);
    throw error;
  }
};

// GET IMAGE TESTS FOR CATEGORY name whic test have image field
export const getImageTestsByCategoryAction = async (
  category: string
): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getImageTestsByCategory`,
      {
        params: { category },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching image tests by category:", error);
    throw error;
  }
};

export const uploadImagesToLibraryAction = async (
  formData: FormData
): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/uploadImagesToLibrary`,
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
    console.error("Error uploading images:", error);
    throw error;
  }
};

export const requestedParametersAction = async (): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/requestedParameters`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error getting parameters:", error);
    throw error;
  }
};

export const getImagesByInvestigationAction = async (
  investigationId: number
): Promise<{ images: string[] }> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getImagesByInvestigation/${investigationId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (err) {
    console.error("Error fetching existing images:", err);
    return { images: [] };
  }
};

export const getExportDataAction = async (id: number) => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getExportData/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "text/csv",
        },
        responseType: "blob",
      }
    );
    return response.data;
  } catch (err) {
    console.error("Failed to download CSV:", err);
    throw err;
  }
};

export const manageRequestAction = async (
  type: string,
  id: string,
  action: string
) => {
  try {
    const token = await getFreshIdToken();

    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/manageRequest`,
      {
        type,
        id,
        action,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (err) {
    console.error("Failed to manage request:", err);
    throw err;
  }
};

export const deleteInvestigationAction = async (data: {
  type: string;
  id: string | number;
  performerId: string;
}) => {
  try {
    const token = await getFreshIdToken();

    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/deleteInvestigation`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (err) {
    console.error("Failed to delete entity:", err);
    throw err;
  }
};

interface UpdatePayload {
  report_id: number;
  submitted_by: number;
  updates: {
    parameter_id: number;
    value: string;
  }[];
}

export const updateInvestigationResultAction = async (data: UpdatePayload) => {
  try {
    const token = await getFreshIdToken();

    const response = await axios.put(
      `${env.REACT_APP_BACKEND_URL}/updateInvestigationResult`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (err) {
    console.error("Failed to update data:", err);
    throw err;
  }
};

export const deleteInvestigationReportAction = async (
  reportId: number,
  informerId: string
) => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/deleteInvestigationReport`,
      { report_id: reportId, informerId: informerId },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (err) {
    console.error("Failed to delete report:", err);
    throw err;
  }
};

export const addCommentsAction = async (payload: any) => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/addComments`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (err) {
    console.error("Failed to delete report:", err);
    throw err;
  }
};

export const updateCommentsAction = async (payload: any) => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.put(
      `${env.REACT_APP_BACKEND_URL}/updateComments`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (err) {
    console.error("Failed to update comments:", err);
    throw err;
  }
};

export const deleteCommentsAction = async (id: number) => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.delete(
      `${env.REACT_APP_BACKEND_URL}/deleteComments/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (err) {
    console.error("Failed to delete comment:", err);
    throw err;
  }
};

export const generateObservationsAction = async (payload: any) => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/generateObservations`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (err) {
    console.error("Failed to generate observations:", err);
    throw err;
  }
};

export const allOrgPatientsAction = async (orgId: string) => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/allOrgPatients/${orgId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (err) {
    console.error("Failed to get patients:", err);
    throw err;
  }
};

export const saveWardAction = async (payload: any) => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/saveWard`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (err) {
    console.error("Failed to save ward:", err);
    throw err;
  }
};

export const getAllWardsAction = async (orgId: string) => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getAllWards/${orgId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (err) {
    console.error("Failed to get wards:", err);
    throw err;
  }
};

export const deleteWardsAction = async (id: string, performerId: string) => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.delete(
      `${env.REACT_APP_BACKEND_URL}/deleteWards/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        data: { performerId },
      }
    );
    return response.data;
  } catch (err) {
    console.error("Failed to delete wards:", err);
    throw err;
  }
};

export const getWardByIdAction = async (id: string) => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getWard/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (err) {
    console.error("Error fetching ward details:", err);
    throw err;
  }
};

export const updateWardAction = async (id: string, payload: string) => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.put(
      `${env.REACT_APP_BACKEND_URL}/updateWards/${id}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (err) {
    console.error("Error fetching ward details:", err);
    throw err;
  }
};

export const startWardSessionAction = async (payload: any) => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/startWardSession`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (err) {
    console.error("Error starting ward session:", err);
    throw err;
  }
};

export const getWardSesionAction = async (sessionId: string) => {
  try {
    // const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getWardSession/${sessionId}`,
      {
        headers: {
          // Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (err) {
    console.error("Error starting ward session:", err);
    throw err;
  }
};

export const getAvailableUsersAction = async (orgId: string) => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getAvailableUsers/${orgId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (err) {
    console.error("Error getting available users:", err);
    throw err;
  }
};

export const getActiveWardSessionAction = async (orgId: string) => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getActiveWardSession/${orgId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (err) {
    console.error("Error getting active ward session:", err);
    throw err;
  }
};

export const saveTemplateAction = async (payload: any) => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/saveTemplate`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (err) {
    console.error("Error saving template:", err);
    throw err;
  }
};

export const getTemplatesAction = async (investigation_id: string) => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getTemplates/${investigation_id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (err) {
    console.error("Error getting template:", err);
    throw err;
  }
};

export const deleteTemplateAction = async (
  id: number,
  currentUserId: number
) => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.delete(
      `${env.REACT_APP_BACKEND_URL}/deleteTemplate/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        data: { deletedBy: currentUserId },
      }
    );
    return response.data;
  } catch (err) {
    console.error("Error deleting template:", err);
    throw err;
  }
};
