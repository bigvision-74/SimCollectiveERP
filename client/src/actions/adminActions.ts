import axios from 'axios';
import env from '../../env';
import { getFreshIdToken } from './authAction';

export const getStatsAndCountAction = async (
  username: string
): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getStatsAndCount/${username}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting stats:', error);
    throw error;
  }
};

export const getFacultiesByIdAction = async (
  orgId: number
): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getFacultiesById/${orgId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting stats:', error);
    throw error;
  }
};

export const getAdminsByIdAction = async (
  orgId: number
): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getAdminsById/${orgId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting stats:', error);
    throw error;
  }
};

export const addSharedOrgAction = async (
  formData: FormData
): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/addSharedOrg`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          // "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error during updating the installation", error);
    throw error;
  }
};

export const getAdminOrgAction = async (username: string): Promise<any> => {
  try {
    // const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getorganisation/${username}`,
      {
        headers: {
          // Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting admin organisations:', error);
    throw error;
  }
};

export const getOrganisationByIdAction = async (orgId: string): Promise<any> => {
  try {
    // const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getOrganisationById/${orgId}`,
      {
        headers: {
          // Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting admin organisations:', error);
    throw error;
  }
};

export const getUserActivityAction = async (username: string): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getUserActivity/${username}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting activity:', error);
    throw error;
  }
};

export const getUserCourseAction = async (username: string): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getUserCourse/${username}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting user course:', error);
    throw error;
  }
};

export const getAllOrganisationsAction = async (): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getAllOrganisations`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting user course:', error);
    throw error;
  }
};

export const resetProfilePasswordAction = async (
  formData: FormData
): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/resetProfilePassword`,
      Object.fromEntries(formData),
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.status !== 200) {
      throw new Error(response.data.message || 'Password change failed');
    }

    return response.data;
  } catch (error: any) {
    console.error('Password reset error:', error);
    throw error;
  }
};

export const addNotificationAction = async (message: string,notify_to: string,title: string): Promise<any> => {
  try {
    const username = localStorage.getItem('user');
    const token = await getFreshIdToken();
    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/addNotifications`,
      {
        notify_by: username,
        message: message,
        notify_to: notify_to,
        title: title,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting serach element:', error);
    throw error;
  }
};

export const getSearchElementAction = async (
  query: string,
  username: string,
  role: string
): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getSearchData/`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          query: query,
          role: role,
          username: username,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error adding notifications:', error);
    throw error;
  }
};

export const allNotificationAction = async (username: string): Promise<any> => {
  try {
    // const token = await getFreshIdToken();

    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/allNotifications/${username}`,
      {
        headers: {
          // Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting notifications:', error);
    throw error;
  }
};


export const deleteNotificationsAction = async (
  ids?: number | number[]
): Promise<{ success: boolean; message: string; count: number }> => {
  try {
    const token = await getFreshIdToken();
    const params = {} as any;

    const response = await axios.delete(
      `${env.REACT_APP_BACKEND_URL}/notifications/${ids}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error deleting notifications:', error);
    throw error;
  }
};

export const updateNotificationAction = async (ids: number[]): Promise<any> => {
  try {
    const idsString = ids.join(',');
    const response = await axios.put(
      `${env.REACT_APP_BACKEND_URL
      }/updateNotifications?ids=${encodeURIComponent(idsString)}`,

      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error adding notifications:', error);
    throw error;
  }
};

export const demoEmailAction = async (formData: FormData): Promise<any> => {
  try {
    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/demoEmail`,
      formData,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error sending mail:', error);
    throw error;
  }
};

export const getLanguageAction = async (): Promise<any> => {
  try {
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getAllLanguage`
    );
    return response.data;
  } catch (error) {
    console.error('Error getting languages:', error);
    throw error;
  }
};

export const updateLanguageAction = async (
  formData: FormData
): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.put(
      `${env.REACT_APP_BACKEND_URL}/updateLanguageStatus`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting languages:', error);
    throw error;
  }
};

export const getPermissionAction = async (id: number): Promise<any> => {
  try {
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getPermissions/${id}`,
      {
        headers: {
          // Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting permission:', error);
    throw error;
  }
};

export const contactMailAction = async (formData: FormData): Promise<any> => {
  try {
    // const token = await getFreshIdToken();
    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/contact`,
      formData,
      {
        headers: {
          // Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error sending contact Mail:', error);
    throw error;
  }
};

export const addLanguageAction = async (formData: FormData): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/addLanguage`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error sending contact Mail:', error);
    throw error;
  }
};

export const getActivityLogsAction = async (params: any = {}): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getActivityLogs`,
      {
        params: params, 
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting activity logs:', error);
    throw error;
  }
};
