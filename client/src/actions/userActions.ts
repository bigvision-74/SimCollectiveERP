import axios from "axios";
import env from "../../env";
import { getFreshIdToken } from "./authAction";
import { addNotificationAction } from "./adminActions";

interface AgoraTokenResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export const createUserAction = async (formData: FormData): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/createUser`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    const firstName = formData.get("firstName");
    const lastName = formData.get("lastName");
    await addNotificationAction(
      `New User '${firstName + " " + lastName}' added to the platform.`,
      "1",
      "New User Added"
    );
    return response.data;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

export const loginAction = async (credentials: FormData): Promise<any> => {
  try {
    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/loginUser`,
      credentials,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    console.log("Login successful:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
};

export const getAllDetailsCountAction = async (): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getAllDetailsCount`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error while getting counts:", error);
    throw error;
  }
};

export const getAdminAllCountAction = async (
  id: string,
  email: string
): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/getAdminAllCount/${id}`,
      { email },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error while getting counts:", error);
    throw error;
  }
};

export const getAllUsersAction = async (): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getAllUsers`,
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

export const getUserAction = async (id: string): Promise<any> => {
  try {
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getUser/${id}`
    );
    return response.data;
  } catch (error) {
    console.error("Error getting user:", error);
    throw error;
  }
};

export const getUserTotal = async (): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getAllUser`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error Getting total users");
    throw error;
  }
};

export const getCodeAction = async (id: string): Promise<any> => {
  try {
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getCode/${id}`
    );
    return response.data;
  } catch (error) {
    console.error("Error getting code:", error);
    throw error;
  }
};

export const verifyAction = async (code: FormData): Promise<any> => {
  try {
    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/verifyUser`,
      code,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    console.log("verification successful:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error verification:", error);
    throw error;
  }
};

export const deleteUserAction = async (
  ids: number | number[],
  name?: string
): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const idsArray = Array.isArray(ids) ? ids : [ids];

    const response = await axios.delete(
      `${env.REACT_APP_BACKEND_URL}/deleteUser`,
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
        `Users ${name} deleted from the platform.`,
        "1",
        "User Deleted"
      );
    }
    return response.data;
  } catch (error) {
    console.error("Error during deletion:", error);
    throw error;
  }
};

export const updateUserAction = async (credentials: FormData): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.put(
      `${env.REACT_APP_BACKEND_URL}/updateUser`,
      credentials,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    const firstName = credentials.get("firstName");
    const lastName = credentials.get("lastName");
    await addNotificationAction(
      `New User '${firstName + " " + lastName}' updated.`,
      "1",
      "User Updated"
    );
    console.log("Deletion successful:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error during deletion:", error);
    throw error;
  }
};

export const getUsername = async (username: string): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getUsername/${username}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error getting username:", error);
    throw error;
  }
};

export const getEmailAction = async (email: string): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getEmail?email=${email}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error getting email:", error);
    throw error;
  }
};

export const resetLinkAction = async (data: FormData): Promise<any> => {
  try {
    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/passwordLink`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error sending link:", error);
    throw error;
  }
};

export const resetPasswordAction = async (data: FormData): Promise<any> => {
  try {
    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/resetPassword`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error sending link:", error);
    throw error;
  }
};

export const getUserByOrgAction = async (id: String): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getUserByOrg/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error sending link:", error);
    throw error;
  }
};

export const updateSettingsAction = async (
  formdata: FormData
): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/updateSettings`,
      formdata,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error adding settings:", error);
    throw error;
  }
};

export const getSettingsAction = async (): Promise<any> => {
  try {
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getSetting`,

      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error getting settings:", error);
    throw error;
  }
};

export const savePreferenceChanges = async (
  formdata: FormData
): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/savePreferenceChanges`,
      formdata,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error adding settings:", error);
    throw error;
  }
};

export const getPreference = async (): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getPreference`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error adding settings:", error);
    throw error;
  }
};

export const addOnlineUserAction = async (formData: FormData): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/addOnlineUser`,
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
    console.error("Error adding settings:", error);
    throw error;
  }
};

export const upddateOnlineUseridDelete = async (
  userName: string
): Promise<any> => {
  try {
    const response = await axios.delete(
      `${env.REACT_APP_BACKEND_URL}/updateUserIdDelete`,
      {
        params: { username: userName },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating user ID:", error);
    throw error;
  }
};

export const getOnlineUsers = async (): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getOnlineUsers`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error getting online user:", error);
    throw error;
  }
};

export const orgOnlineUsers = async (orgId: string): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/orgOnlineUsers/${orgId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error getting online user:", error);
    throw error;
  }
};

//instructor
export const getUserOrgIdAction = async (userName: string): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getUserOrgId`,
      {
        params: { username: userName },
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error getting organisation ID:", error);
    throw error;
  }
};

export const getVideoRecordingsAction = async (
  inst_id: string
): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/user/getVideoRecordings`,
      {
        params: { inst_id: inst_id },
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error getting organisation ID:", error);
    throw error;
  }
};

export const getAllRecordingsAction = async (): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getAllRecordings`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching all recordings:", error);
    throw error;
  }
};

export const getInstScenarioProgressAction = async (
  userId?: string,
  course?: string,
  module?: string
): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const queryParams = new URLSearchParams();

    if (userId) queryParams.append("user", userId);
    if (course) queryParams.append("course", course);
    if (module) queryParams.append("module", module);
    const response = await axios.get(
      `${
        env.REACT_APP_BACKEND_URL
      }/getInstScenarioProgress?${queryParams.toString()}`,

      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error getting settings:", error);
    throw error;
  }
};

export const getVrSessionsAction = async (org?: string): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const userName = localStorage.getItem("user");
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/vr_session?org=${org}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "x-user-name": userName || "",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error getting VR Session data:", error);
    throw error;
  }
};

export const getUserBySessionIdAction = async (id: string): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/multi_session/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          // "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error getting modules:", error);
    throw error;
  }
};

export const getVrSessionDetailSuperAdminAction = async (
  id: string
): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/VrSessionDetailsSuperAdmin/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          // "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error getting VrSession Details :", error);
    throw error;
  }
};

export const getleaderboardData = async (id: number): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/leaderboard?organisation_id=${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          // "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error getting leaderboard data :", error);
    throw error;
  }
};

export const getAgoraToken = async (
  user_id: string
): Promise<AgoraTokenResponse> => {
  try {
    const response = await axios.get(
      `${env.REACT_APP_BACKEND_URL}/getUserAgoraData`,
      {
        params: { user_id },
        timeout: 10000,
      }
    );

    if (response.data?.status?.error || response.data?.error) {
      const errorMessage =
        response.data?.status?.message ||
        response.data?.message ||
        "Failed to generate token";
      console.error("Backend error:", errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }

    if (!response.data?.agoraData) {
      return {
        success: false,
        error: "Invalid response format from server",
      };
    }

    return {
      success: true,
      data: response.data.agoraData,
    };
  } catch (error) {
    let errorMessage = "Unknown error occurred";

    if (axios.isAxiosError(error)) {
      errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Network error occurred";
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    console.error("Error getting Agora token:", errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
};

export const deleteVrSessionByIdAction = async (id: number): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const response = await axios.delete(
      `${env.REACT_APP_BACKEND_URL}/deleteVrSessionById/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error deleting session:", error);
    throw error;
  }
};

export const notifyStudentAtRiskAction = async (
  formData: FormData
): Promise<any> => {
  try {
    const token = await getFreshIdToken();
    const users = formData.get("users");
    const userArray = users ? JSON.parse(users as string) : [];
    const userIds = userArray.map((user: any) => user.id);

    const response = await axios.post(
      `${env.REACT_APP_BACKEND_URL}/notifyStudentAtRisk`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    await addNotificationAction(
      `Some of your courses are overdue or nearing their due date. Please complete them as soon as possible.`,
      userIds,
      "Course Reminder"
    );

    return response.data;
  } catch (error) {
    console.error("Error deleting session:", error);
    throw error;
  }
};

