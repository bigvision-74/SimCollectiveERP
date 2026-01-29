import axios from "axios";
import env from "../../env";
import { getFreshIdToken } from "./authAction";

export const createSessionAction = async (formData: FormData): Promise<any> => {
  try {
    const token = await getFreshIdToken();

    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/createSession`,
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
    console.error("Error saving settings:", error);
    throw error;
  }
};

export const addParticipantAction = async (formData: FormData): Promise<any> => {
  try {
    const token = await getFreshIdToken();

    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/addParticipant`,
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
    console.error("Error saving settings:", error);
    throw error;
  }
};

export const deletePatienSessionDataAction = async (
  id: number
): Promise<any> => {
  try {
    const token = await getFreshIdToken();

    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/deletePatienSessionData/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting patient session:", error);
    throw error;
  }
};

export const endUserSessionAction = async (
  sessionId: string,
  userid: string,
  participants: any
): Promise<any> => {
  try {
    const token = await getFreshIdToken();

    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/endUserSession/${sessionId}/${userid}`,
      {participants},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error saving settings:", error);
    throw error;
  }
};

export const endSessionAction = async (id: string, endedBy: string): Promise<any> => {
  try {
    const token = await getFreshIdToken();

    const response = await axios.put(
      `${env.REACT_APP_BACKEND_URL}/endSession/${id}/${endedBy}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error saving settings:", error);
    throw error;
  }
};

export const getAllActiveSessionsAction = async (orgId: number): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const role = localStorage.getItem("role");

    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getAllActiveSessions/${orgId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

    return response.data;
  } catch (error) {
    console.error("Error fetching Sessions by orgID:", error);
    throw error;
  }
};


export const getAllWardSessionAction = async (): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const role = localStorage.getItem("role");

    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getAllWardSession`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

    return response.data;
  } catch (error) {
    console.error("Error fetching Sessions:", error);
    throw error;
  }
};


export const getAllSessionAction = async (): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const role = localStorage.getItem("role");

    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getAllSession`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

    return response.data;
  } catch (error) {
    console.error("Error fetching Sessions:", error);
    throw error;
  }
};

export const deleteSessionsAction = async (sessionIds: number[], adminName: string): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/deleteSessions`, 
      { sessionIds, adminName },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting sessions:", error);
    throw error;
  }
};



export const deleteIndividualSessionsAction = async (sessionIds: number[], adminName: string): Promise<any> => {
  try {
    const token = localStorage.getItem("token"); 

    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/deleteIndividualSessions`,
      { sessionIds, adminName },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting sessions:", error);
    throw error;
  }
};
