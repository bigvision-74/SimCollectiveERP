import axios from 'axios';
import env from '../env';
import { getFreshIdToken } from './authAction';

export const createArchiveAction = async (): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/allArchiveData`,

      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error fetching archives:', error);
    throw error;
  }
};

export const recoverDataAction = async (id: string, type: string) => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.put(
      `${env.REACT_APP_BACKEND_URL}/recoverData?id=${id}&type=${type}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Error recovering data:', error);
    throw error;
  }
};

export const updateDataOrgAction = async (formdata: FormData) => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.put(
      `${env.REACT_APP_BACKEND_URL}/updateDataOrg`,
      formdata,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Error updating data:', error);
    throw error;
  }
};


export const updateModuleCourseAction = async (formdata: FormData) => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.put(
      `${env.REACT_APP_BACKEND_URL}/updateModuleCourse`,
      formdata,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Error updating data:', error);
    throw error;
  }
};


export const updateLessonModuleAction = async (formdata: FormData) => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.put(
      `${env.REACT_APP_BACKEND_URL}/updateLessonModule`,
      formdata,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Error updating data:', error);
    throw error;
  }
};

export const getAllVideoModulesAction = async () => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getAllVideoModules`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Error updating data:', error);
    throw error;
  }
};

export const permanentDeleteAction = async (
  id: string | string[],
  type: string
): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.delete(
      `${env.REACT_APP_BACKEND_URL}/permanentDelete?id=${id}&type=${type}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error deleting archives:', error);
    throw error;
  }
};
