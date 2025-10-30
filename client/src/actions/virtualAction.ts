import axios from "axios";
import env from "../../env";
import { getFreshIdToken } from "./authAction";

// save virtual section funciton
export const addVirtualSessionAction = async (data: {
  session_name: string;
  patient_type: string;
  room_type: string;
  selected_patient: string;
}) => {
  try {
    const token = await getFreshIdToken();

    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/addVirtualSection`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error saving virtual session:", error);
    throw error;
  }
};

export const saveVirtualSessionDataAction = async (data: {
  sessionID: string;
  userId: string;
}) => {
  try {
    const token = await getFreshIdToken();

    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/saveVirtualSessionData`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error saving virtual session data:", error);
    throw error;
  }
};

export const scheduleSocketSessionAction = async (data: {
  sessionId: string;
  patientId: string;
  title: any;
  src: any;
  scheduleTime: string;
}) => {
  try {
    const token = await getFreshIdToken();

    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/scheduleSocketSession`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error saving schedule sockets:", error);
    throw error;
  }
};

// fetch virtual function
export const getAllVirtualSessionsAction = async () => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getAllVirtualSections`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching virtual sessions:", error);
    throw error;
  }
};

export const getVrSessionByIdAction = async (sessionId: any) => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getVrSessionById/${sessionId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching virtual sessions:", error);
    throw error;
  }
};

export const getScheduledSocketsAction = async (sessionId: any) => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getScheduledSockets/${sessionId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching virtual sessions:", error);
    throw error;
  }
};

// delete virtual section function
export const deleteVirtualSessionAction = async (id: number) => {
  try {
    const token = await getFreshIdToken();

    const response = await axios.delete(
      `${env.REACT_APP_BACKEND_URL}/deleteVirtualSession/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error deleting virtual session:", error);
    throw error;
  }
};
