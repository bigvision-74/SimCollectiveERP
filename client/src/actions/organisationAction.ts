import axios from "axios";
import env from "../../env";
import { getFreshIdToken } from "./authAction";
import { addNotificationAction } from "./adminActions";

export const getAllOrgAction = async (): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getAllOrganisation`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error getting user:", error);
    throw error;
  }
};

export const createOrgAction = async (formData: FormData): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/createOrg`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const orgName = formData.get("orgName");

    await addNotificationAction(
      `New Organisation '${orgName}' added to the platform.`,
      "ankit",
      "Organisation Added"
    );
    return response.data;
  } catch (error) {
    console.error("Error creating organisation:", error);
    throw error;
  }
};

export const deleteOrgAction = async (ids: number[]): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const idsString = ids.join(",");
    const response = await axios.delete(
      `${env.REACT_APP_BACKEND_URL}/deleteOrg?ids=${encodeURIComponent(
        idsString
      )}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error during deletion:", error);
    throw error;
  }
};

export const getOrgAction = async (id: number): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getOrg/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error getting code:", error);
    throw error;
  }
};

export const editOrgAction = async (
  formData: FormData,
  name: string
): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/editOrganisation`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    await addNotificationAction(
      `Organisation '${name}' has been updated.`,
      "1",
      "Organisation Updated"
    );
    return response.data;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

export const getUsersByOrganisation = async (id: string): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getUsersByOrganisation/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error getting code:", error);
    throw error;
  }
};

export const getInstNameAction = async (name: string): Promise<any> => {
  try {
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/checkInstitutionName/${name}`
    );
    return response.data;
  } catch (error) {
    console.error("Error getting institution name:", error);
    throw error;
  }
};

export const getEmailAction = async (email: string): Promise<any> => {
  try {
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/checkEmail/${email}`
    );
    return response.data;
  } catch (error) {
    console.error("Error getting email:", error);
    throw error;
  }
};

export const getUsernameAction = async (username: string): Promise<any> => {
  try {
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/checkUsername/${username}`
    );
    return response.data;
  } catch (error) {
    console.error("Error getting username:", error);
    throw error;
  }
};

export const addRequestAction = async (formData: FormData): Promise<any> => {
  try {
    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/addRequest`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error adding request :", error);
    throw error;
  }
};

export const allRequestAction = async (): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getAllRequests`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error getting request:", error);
    throw error;
  }
};

export const requestByIdAction = async (id: string): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/requestById/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error getting request:", error);
    throw error;
  }
};

export const approveRequestAction = async (
  id: string,
  planType: string,
  purchaseOrder: string,
  amount: string
): Promise<any> => {
  try {
    const token = await getFreshIdToken();

    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/approveRequest/${id}`,
      {
        planType,
        purchaseOrder,
        amount
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error approving request:", error);
    throw error;
  }
};


export const rejectRequestAction = async (
  id: string,
  data?: any
): Promise<any> => {
  try {
    const token = await getFreshIdToken();

    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/rejectRequest/${id}`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error rejecting request:", error);
    throw error;
  }
};

export const addMailAction = async (formData: FormData): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/addMail`,
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
    console.error("Error rejecting request:", error);
    throw error;
  }
};

export const getAllMailAction = async (): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getAllMail`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error rejecting request:", error);
    throw error;
  }
};

export const updateMailStatusAction = async (
  formData: FormData
): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.put(
      `${env.REACT_APP_BACKEND_URL}/updateMailStatus`,
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
    console.error("Error rejecting request:", error);
    throw error;
  }
};

export const getLibraryAction = async (
  username: string,
  investId: string
): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/library/${username}/${investId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error getting library:", error);
    throw error;
  }
};
