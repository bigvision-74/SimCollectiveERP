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

    const orgName = formData.get('orgName');
                                     
    await addNotificationAction(`New Organization '${orgName}' added to the platform.`, 'ankit', "Organisation Added");
    return response.data;
  } catch (error) {
    console.error("Error creating organization:", error);
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
    console.log("Deletion successful:", response.data);
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

export const editOrgAction = async (formData: FormData, name: string): Promise<any> => {
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
    await addNotificationAction(`Organization '${name}' has been updated.`, '1', "Organisation Updated");
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


