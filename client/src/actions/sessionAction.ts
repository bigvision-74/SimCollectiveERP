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

export const endSessionAction = async (id: string): Promise<any> => {
  try {
    const token = await getFreshIdToken();

    const response = await axios.put(
      `${env.REACT_APP_BACKEND_URL}/endSession/${id}`,
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
