import _ from "lodash";
import { useEffect, useState, ChangeEvent, useRef, useCallback } from "react";
import Tippy from "@/components/Base/Tippy";
import Table from "@/components/Base/Table";
import { Link, useParams, useNavigate } from "react-router-dom";
import clsx from "clsx";
import {
  FormInput,
  FormSelect,
  FormCheck,
  FormLabel,
} from "@/components/Base/Form";
import { getUsersByOrganisation } from "@/actions/organisationAction";
import profile from "@/assets/images/fakers/profile.webp";
import Button from "@/components/Base/Button";
import {
  deleteUserAction,
  getUsername,
  updateUserAction,
  getUserAction,
  getUserOrgIdAction,
} from "@/actions/userActions";
import { Dialog, Menu } from "@/components/Base/Headless";
import Pagination from "@/components/Base/Pagination";
import debounce from "lodash/debounce";
import Alerts from "../Alert";
import Lucide from "@/components/Base/Lucide";
import { t, use } from "i18next";
import { Tab } from "@/components/Base/Headless";
import { resetProfilePasswordAction } from "@/actions/adminActions";
import { isValidInput } from "@/helpers/validation";
import { useUploads } from "@/components/UploadContext";
import {
  getPresignedApkUrlAction,
  uploadFileAction,
} from "@/actions/s3Actions";
import { getAdminsByIdAction } from "@/actions/adminActions";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { fetchSettings, selectSettings } from "@/stores/settingsSlice";
import { resendActivationMailAction } from "@/actions/userActions";

interface Component {
  onAction: (message: string, variant: "success" | "danger") => void;
}
const Main: React.FC<Component> = ({ onAction }) => {
  type User = {
    id: number;
    fname: string;
    lname: string;
    organisation_id: string;
    org_email: string;
    updated_at: string;
    username: string;
    role: string;
    uemail: string;
    password: any;
    user_thumbnail: string;
    lastLoginTime: string;
    user_deleted: number;
    org_delete: number;
  };

  interface FormErrors {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    thumbnail?: string;
  }

  interface UserformData {
    id: string;
    uid: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password?: string;
    role: string;
    thumbnail?: File;
  }

  const navigate = useNavigate();
  const { addTask, updateTask } = useUploads();
  const deleteButtonRef = useRef(null);
  const [users, setUsers] = useState<User[]>([]);
  const [user, setUser] = useState<Users>();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteConfirmationModal, setDeleteConfirmationModal] = useState(false);
  const [userIdToDelete, setUserIdToDelete] = useState<number | null>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [deleteUser, setDeleteUser] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const [editedsuccess, setEditedsuccess] = useState(false);
  const [isUserExists, setIsUserExists] = useState<boolean | null>(null);
  const [userprofile, setUserProfile] = useState<File | undefined>(undefined);

  const [superlargeModalSizePreview, setSuperlargeModalSizePreview] =
    useState(false);
  const [fileName, setFileName] = useState<string>("");
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isAdminExists, setIsAdminExists] = useState(false);
  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);
  const [showAlert1, setShowAlert1] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [initialUserData, setInitialUserData] = useState<User | null>(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadImgStatus, setUploadImgStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [formData, setformData] = useState<UserformData>({
    id: "",
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    role: "",
    uid: "",
    thumbnail: undefined,
    password: "",
  });

  const [formErrors, setformErrors] = useState<Partial<FormErrors>>({
    id: "",
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    thumbnail: "",
  });
  const [loading1, setLoading1] = useState(false);
  const { id } = useParams();
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchSettings());
  }, [dispatch]);

  const { data } = useAppSelector(selectSettings);

  const fetchOrgs = async () => {
    try {
      if (id) {
        setLoading1(true);
        const data = await getUsersByOrganisation(id);
        if (data) {
          setUsers(data);
          setLoading1(false);
        }
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  const handlePageChange = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setCurrentPage(pageNumber);
    }
  };

  const handleItemsPerPageChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newItemsPerPage = Number(event.target.value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  };

  const propertiesToSearch = [
    "name",
    "email",
    "username",
    "uemail",
    "fname",
    "lname",
    "role",
    "password",
  ];

  const filteredUsers = users.filter((user) =>
    propertiesToSearch.some((prop) => {
      if (prop === "role") {
        const displayRole = user.role ? user.role : "Unknown Role";
        return displayRole.toLowerCase().includes(searchQuery.toLowerCase());
      }

      if (prop === "password") {
        const displayStatus =
          user.password === "0" || user.password === 0
            ? "Pending"
            : "Activated";
        return displayStatus.toLowerCase().includes(searchQuery.toLowerCase());
      }
      const fieldValue = user[prop as keyof User];
      return fieldValue
        ? fieldValue
            .toString()
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        : false;
    })
  );

  useEffect(() => {
    const newTotalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
    setTotalPages(newTotalPages);

    if (currentPage > newTotalPages) {
      setCurrentPage(newTotalPages);
    }
  }, [filteredUsers, itemsPerPage, currentPage]);

  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const indexOfLastItem = Math.min(
    indexOfFirstItem + itemsPerPage,
    filteredUsers.length
  );
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedUsers(new Set(filteredUsers.map((user) => user.id)));
    } else {
      setSelectedUsers(new Set());
    }
    setSelectAllChecked(event.target.checked);
  };

  const handleRowCheckboxChange = (userId: number) => {
    const newSelectedUsers = new Set(selectedUsers);
    if (newSelectedUsers.has(userId)) {
      newSelectedUsers.delete(userId);
    } else {
      newSelectedUsers.add(userId);
    }
    setSelectedUsers(newSelectedUsers);
    setSelectAllChecked(newSelectedUsers.size === filteredUsers.length);
  };

  const handleDeleteClick = (userId: number) => {
    setUserIdToDelete(userId);
    setDeleteConfirmationModal(true);
  };

  const handleDeleteConfirm = async () => {
    setArchiveLoading(true);
    setDeleteError(false);
    setDeleteUser(false);

    try {
      if (userIdToDelete) {
        await deleteUserAction(userIdToDelete, name);

        setDeleteUser(true);
      } else {
        const deletePromises = Array.from(selectedUsers).map((userId) =>
          deleteUserAction(userId)
        );
        await Promise.all(deletePromises);
        setDeleteUser(true);
      }
      onAction(t("userArchiveSuccess"), "success");
      let data;
      if (id) {
        data = await getUsersByOrganisation(id);
      }
      setTotalPages(Math.ceil(data.length / itemsPerPage));
      setUsers(data);
      setSelectedUsers(new Set());
      setSelectAllChecked(false);
    } catch (error) {
      onAction(t("userArchiveError"), "danger");
      console.error("Error deleting user(s):", error);
      setDeleteError(true);
    } finally {
      setArchiveLoading(false);
    }
    setDeleteConfirmationModal(false);
    setUserIdToDelete(null);
  };

  useEffect(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const newCurrentUsers = users.slice(indexOfFirstItem, indexOfLastItem);
  }, [currentPage, itemsPerPage, users]);

  const handleDeleteSelected = () => {
    setUserIdToDelete(null);
    setDeleteConfirmationModal(true);
  };

  useEffect(() => {
    const successAlert = localStorage.getItem("successAlert");
    if (successAlert) {
      setShowSuccessAlert(true);
      localStorage.removeItem("successAlert");
    }
  }, []);

  useEffect(() => {
    const edited = localStorage.getItem("edited");
    if (edited) {
      setEditedsuccess(true);
      localStorage.removeItem("edited");
    }
  }, []);

  const validateTextInput = (
    value: string,
    minLength: number,
    errorMessage: string
  ) => {
    if (!isValidInput(value)) {
      return t("invalidInput");
    }
    return value && value.length >= minLength ? "" : errorMessage;
  };

  const validateThumbnail = (fileName: string | null) => {
    return fileName ? "" : t("thumbnailValidation");
  };

  const validateEmail = (email: string) => {
    if (!email) return t("emailValidation1");
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "" : t("emailValidation");
  };

  const validateTextInputMaxLength = (
    value: string,
    minLength: number,
    maxLength: number,
    errorMessage: string,
    maxLengthErrorMessage: string
  ) => {
    if (!isValidInput(value)) {
      return t("invalidInput");
    }
    if (value && value.length > maxLength) {
      return maxLengthErrorMessage;
    }
    return value && value.length >= minLength ? "" : errorMessage;
  };

  const validateUsernameMaxLength = (
    value: string,
    minLength: number,
    maxLength: number,
    errorMessage: string,
    maxLengthErrorMessage: string
  ) => {
    if (!isValidInput(value)) {
      return t("invalidInput");
    }
    if (value && value.length > maxLength) {
      return maxLengthErrorMessage;
    }
    return value && value.length >= minLength ? "" : errorMessage;
  };

  const validateForm = (): FormErrors => {
    const errors: FormErrors = {
      firstName: validateTextInputMaxLength(
        formData.firstName,
        2,
        50,
        t("firstNameValidation"),
        t("firstNameMaxLength")
      ),
      lastName: validateTextInputMaxLength(
        formData.lastName,
        2,
        50,
        t("lastNameValidation"),
        t("lastNameMaxLength")
      ),
      username: validateUsernameMaxLength(
        formData.username,
        2,
        30,
        t("userNameValidation"),
        t("userNameMaxLength")
      ),
      email: validateEmail(formData.email),
      // thumbnail: fileName ? "" : t("thumbnailValidation"),
      id: "",
    };

    // Add username exists error if needed
    if (isUserExists && formData.username !== user?.username) {
      errors.username = t("usernameExist");
    }

    return errors;
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const target = e.target;
    const { name, value, type } = target;

    // Special handling for username
    if (name === "username") {
      handleUsernameChange(e as React.ChangeEvent<HTMLInputElement>);
      return;
    }

    // Normal handling for other fields
    setformData((prev) => ({ ...prev, [name]: value }));

    if (type === "checkbox" || type === "radio") {
      setformData((prev) => ({
        ...prev,
        [name]: (target as HTMLInputElement).checked ? value : "",
      }));
    }

    let updatedErrors: Partial<FormErrors> = {};

    if (name === "firstName") {
      updatedErrors.firstName = validateTextInputMaxLength(
        value,
        2,
        50,
        t("firstNameValidation"),
        t("firstNameMaxLength")
      );
    } else if (name === "lastName") {
      updatedErrors.lastName = validateTextInputMaxLength(
        value,
        2,
        50,
        t("lastNameValidation"),
        t("lastNameMaxLength")
      );
    } else if (name === "email") {
      updatedErrors.email = validateEmail(value);
    }

    setformErrors((prev) => ({ ...prev, ...updatedErrors }));
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const file = event.dataTransfer.files[0];
    if (file) {
      setFileName(file.name);
      setUploadImgStatus(t("Imageuploadedsuccessfully"));

      const url = URL.createObjectURL(file);
      setFileUrl(url);

      return () => URL.revokeObjectURL(url);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const MAX_FILE_SIZE = data.fileSize * 1024 * 1024;

    if (file) {
      const allowedImageTypes = [
        "image/png",
        "image/jpeg",
        "image/jpg",
        // "image/gif",
        // "image/webp",
        // "image/bmp",
        // "image/svg+xml",
        // "image/tiff",
        // "image/x-icon",
        // "image/heic",
      ];

      if (!allowedImageTypes.includes(file.type)) {
        setformErrors((prev) => ({
          ...prev,
          thumbnail: t("OnlyimagesPNGallowed"),
        }));
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setformErrors((prev) => ({
          ...prev,
          thumbnail: `${t("exceed")} ${MAX_FILE_SIZE / (1024 * 1024)} MB.`,
        }));
        event.target.value = "";
        return;
      }

      setFileName(file.name);
      // setUploadStatus(t('uploadedImg'));
      setUserProfile(file);
      const url = URL.createObjectURL(file);
      setFileUrl(url);

      setformErrors((prev) => ({ ...prev, thumbnail: "" }));

      return () => URL.revokeObjectURL(url);
    }
  };

  const handleSubmit = async () => {
    const username = localStorage.getItem("user");
    const data1 = await getUserOrgIdAction(username || "");
    setLoading(true);
    setShowAlert(null);

    const errors = validateForm();
    setformErrors(errors);

    if (
      Object.values(errors).some((error) => error) ||
      (isUserExists && formData.username !== user?.username)
    ) {
      setLoading(false);
      return;
    }
    try {
      const formDataToSend = new FormData();

      formDataToSend.append("id", formData.id);
      formDataToSend.append("firstName", formData.firstName);
      formDataToSend.append("lastName", formData.lastName);
      formDataToSend.append("username", formData.username);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("role", formData.role);
      formDataToSend.append("uid", formData.uid);
      formDataToSend.append("addedBy", data1.id);

      let upload;
      if (userprofile) {
        let data = await getPresignedApkUrlAction(
          userprofile.name,
          userprofile.type,
          userprofile.size
        );
        formDataToSend.append("thumbnail", data.url);
        const taskId = addTask(userprofile, formData.username);
        upload = await uploadFileAction(
          data.presignedUrl,
          userprofile,
          taskId,
          updateTask
        );
      }

      const updateUser = await updateUserAction(formDataToSend);
      if (updateUser) {
        window.scrollTo({ top: 0, behavior: "smooth" });

        fetchOrgs();
        setSuperlargeModalSizePreview(false);
        onAction(t("user_updated_message"), "success");
      }
    } catch (error: any) {
      setShowAlert({
        variant: "danger",
        message:
          error.response.data.message === "Username Exists"
            ? t("usernameExist")
            : error.response.data.message === "Email Exists"
            ? t("Emailexist")
            : t("ErrorInUpdatingUser"),
      });
      console.error("Error:", error);
      setUploadStatus("Failed to submit data.");
    } finally {
      setLoading(false);
    }
  };
  const handleKeyDown = (e: any) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const checkUsernameExists = async (username: string) => {
    if (username.trim().length < 2) {
      setIsUserExists(null);
      setformErrors((prev) => ({
        ...prev,
        username: t("userNameValidation"),
      }));
      return;
    }

    try {
      const data = await getUsername(username);
      if (data) {
        setUser(data.user);
        setIsUserExists(data.exists);
      } else {
        setIsUserExists(null);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      setIsUserExists(null);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setformData((prev) => ({ ...prev, username: value }));

    // Basic validation first
    const error = validateUsernameMaxLength(
      value,
      2,
      30,
      t("userNameValidation"),
      t("userNameMaxLength")
    );
    setformErrors((prev) => ({ ...prev, username: error }));

    // Only check if basic validation passes
    if (!error) {
      checkUsernameExists(value);
    } else {
      setIsUserExists(null);
    }
  };

  const fetchUser = async (userId: string) => {
    try {
      if (id) {
        const data = await getUserAction(userId);
        setInitialUserData(data);
        if (data) {
          setformData({
            id: data.id.toString() || "",
            uid: data.uid || "",
            firstName: data.fname || "",
            lastName: data.lname || "",
            username: data.username || "",
            email: data.uemail || "",
            role: data.role || "User",
            password: data.password || "",
          });
        }
        setFileUrl(data.user_thumbnail);
        if (data && data.user_thumbnail) {
          const parts = data.user_thumbnail.split("-");
          const lastPart = parts.pop() || "";
          const fileName = lastPart.replace(/^\d+-/, "");
          setFileName(fileName || "");
        }
        setUser(data);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  type Users = {
    fname: string;
    lname: string;
    organisation_id: string;
    org_email: string;
    updated_at: string;
    id: number;
    username: string;
    role: string;
    uemail: string;
    uid: string;
    name: string;
    user_deleted: number;
    org_delete: number;
  };

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const validatePassword = (password: string) => {
    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;

    if (!password) return t("Passwordrequired");
    if (!passwordRegex.test(password)) {
      return t("Passwordmust8characterslong");
    }
    return "";
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewPassword(value);
    setPasswordError(validatePassword(value));
  };

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setConfirmPassword(value);
    setConfirmPasswordError(
      value !== newPassword ? t("Passwordsdonotmatch") : ""
    );
  };

  const handleSubmit1 = async () => {
    setLoading(true);
    setShowAlert(null);

    // Form validation
    const passwordValidationError = validatePassword(newPassword);
    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      setLoading(false);
      return;
    }

    if (!confirmPassword) {
      setConfirmPasswordError(t("Confirmpasswordrequired"));
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setConfirmPasswordError(t("Passwordsdonotmatch"));
      setLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("newPassword", newPassword);

      if (user?.username) {
        formDataToSend.append("username", user.username);
      } else {
        throw new Error("usernamerequired");
      }

      const response = await resetProfilePasswordAction(formDataToSend);

      // Clear form and show success message
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError("");
      setConfirmPasswordError("");

      onAction(t("passwordChangeSuccess"), "success");
      setSuperlargeModalSizePreview(false);
    } catch (error: any) {
      console.error("Password change error:", error);
      setShowAlert1({
        variant: "danger",
        message: t("ErrorinPasswordChange"),
      });
    } finally {
      setLoading(false);
    }
  };

  const checkAdminExists = async () => {
    try {
      setIsAdminExists(false);
      const admins = await getAdminsByIdAction(Number(id));

      if (initialUserData && initialUserData.role === "Admin") {
        setIsAdminExists(false);
      } else {
        const hasAdmin = admins && admins.length > 0;
        setIsAdminExists(hasAdmin);

        if (hasAdmin && formData.role === "Admin") {
          setformData((prev) => ({ ...prev, role: "Faculty" }));
        }
      }
    } catch (err) {
      console.error("Error checking admin:", err);
      setIsAdminExists(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchUser(id);
      checkAdminExists();
    }
  }, [id]);

  if (!id) {
    return <div>No user ID found in URL.</div>;
  }

  //  Handle Resend Mail
  const handleResendMail = async () => {
    if (!formData.email) {
      setShowAlert({
        variant: "danger",
        message: t("emailRequiredForResend"),
      });
      return;
    }

    try {
      setResendLoading(true);
      const payload = {
        userId: Number(formData.id),
        email: formData.email,
      };

      await resendActivationMailAction(payload);

      window.scrollTo({ top: 0, behavior: "smooth" });
      setShowAlert({
        variant: "success",
        message: t("mailResentSuccessfully"),
      });
      setTimeout(() => setShowAlert(null), 3000);
    } catch (error: any) {
      console.error("Error resending mail:", error);
      window.scrollTo({ top: 0, behavior: "smooth" });
      setShowAlert({
        variant: "danger",
        message: t("mailResendFailed"),
      });
      setTimeout(() => setShowAlert(null), 3000);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <>
      <div className="-mt-3 overflow-auto lg:overflow-visible">
        <div className="flex flex-wrap items-center justify-between col-span-12 mt-2 intro-y">
          <div className="flex items-center space-x-2">
            <Button
              variant="primary"
              className="mr-2 shadow-md"
              disabled={selectedUsers.size === 0}
              onClick={handleDeleteSelected}
            >
              {t("DeleteUsers")}
            </Button>
          </div>
          <div className="w-full mt-3 sm:w-auto sm:mt-0 sm:ml-auto md:ml-0">
            <div className="relative w-56 text-slate-500">
              <FormInput
                type="text"
                className="w-56 pr-10 !box"
                placeholder={t("Search")}
                value={searchQuery}
                onChange={handleSearchChange}
              />
              <Lucide
                icon="Search"
                className="absolute inset-y-0 right-0 w-4 h-4 my-auto mr-3"
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto rounded-lg ">
          <Table
            striped
            className=" w-full table-auto border-spacing-y-[10px] border-separate -mt-2 "
          >
            <Table.Thead>
              <Table.Tr>
                <Table.Th className="border-b-0 whitespace-nowrap">
                  <FormCheck.Input
                    id="remember-me"
                    type="checkbox"
                    className="mr-2 border"
                    checked={selectAllChecked}
                    onChange={handleSelectAll}
                  />
                </Table.Th>
                <Table.Th className="border-b-0 whitespace-nowrap">#</Table.Th>
                <Table.Th className="border-b-0 whitespace-nowrap">
                  {t("user_name")}
                </Table.Th>
                <Table.Th className="text-center border-b-0 whitespace-nowrap">
                  {t("user_username")}
                </Table.Th>
                <Table.Th className="text-center border-b-0 whitespace-nowrap">
                  {t("user_email")}
                </Table.Th>
                <Table.Th className="text-center border-b-0 whitespace-nowrap">
                  {t("user_role")}
                </Table.Th>
                <Table.Th className="text-center border-b-0 whitespace-nowrap">
                  {t("status1")}
                </Table.Th>
                <Table.Th className="text-center border-b-0 whitespace-nowrap">
                  {t("action")}
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {currentUsers
                .filter((user) => user.role !== "superadmin")
                .map((user, key) => (
                  <Table.Tr key={user.id} className="intro-x">
                    <Table.Td className="box rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                      <FormCheck.Input
                        id="remember-me"
                        type="checkbox"
                        className="mr-2 border"
                        checked={selectedUsers.has(user.id)}
                        onChange={() => handleRowCheckboxChange(user.id)}
                      />
                    </Table.Td>
                    <Table.Td className="box rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                      <a href="" className="font-medium whitespace-nowrap">
                        {indexOfFirstItem + key + 1}
                      </a>
                    </Table.Td>
                    <Table.Td className="box w-40 rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                      <div className="flex items-center">
                        <div className="w-10 h-10 image-fit zoom-in">
                          <Tippy
                            as="img"
                            alt="Midone - HTML Admin Template"
                            className="border-2 border-white rounded-lg shadow-md"
                            src={
                              user.user_thumbnail
                                ? user.user_thumbnail?.startsWith("http")
                                  ? user.user_thumbnail
                                  : `https://insightxr.s3.eu-west-2.amazonaws.com/images/${user.user_thumbnail}`
                                : "https://insightxr.s3.eu-west-2.amazonaws.com/image/fDwZ-CO0t-default-avatar.jpg"
                            }
                            content={user.username}
                          />
                        </div>
                        <div className="ml-4 font-medium whitespace-nowrap">
                          {user.fname + " " + user.lname}
                          <div className="text-slate-500 text-xs whitespace-nowrap mt-0.5">
                            {user.lastLoginTime
                              ? new Date(user.lastLoginTime).toLocaleString(
                                  undefined,
                                  {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "numeric",
                                    minute: "2-digit",
                                    hour12: true,
                                  }
                                )
                              : ""}
                          </div>
                        </div>
                      </div>
                    </Table.Td>
                    <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                      {user.username}
                    </Table.Td>
                    <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                      {user.uemail}
                    </Table.Td>
                    <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                      {user.role ? user.role : "Unknown Role"}
                    </Table.Td>
                    <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                      {user.password === "0" || user.password === 0
                        ? "Pending"
                        : "Activated"}
                    </Table.Td>
                    <Table.Td
                      className={clsx([
                        "box w-56 rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600",
                        "before:absolute before:inset-y-0 before:left-0 before:my-auto before:block before:h-8 before:w-px before:bg-slate-200 before:dark:bg-darkmode-400",
                      ])}
                    >
                      <div className="flex items-center justify-center">
                        {/* Edit Link */}
                        <a
                          className="flex items-center mr-3 cursor-pointer"
                          onClick={(event: React.MouseEvent) => {
                            event.preventDefault();
                            fetchUser(String(user.id));
                            setSuperlargeModalSizePreview(true);
                          }}
                        >
                          <Lucide icon="CheckSquare" className="w-4 h-4 mr-1" />{" "}
                          {t("edit_button")}
                        </a>

                        {/* Delete Link */}
                        <a
                          className="flex items-center text-danger cursor-pointer"
                          onClick={(event) => {
                            event.preventDefault();
                            handleDeleteClick(user.id);
                            const name = user.fname + " " + user.lname;
                            setName(name);
                            setDeleteConfirmationModal(true);
                          }}
                        >
                          <Lucide icon="Archive" className="w-4 h-4 mr-1" />{" "}
                          {t("Archive")}
                        </a>
                      </div>
                    </Table.Td>
                  </Table.Tr>
                ))}
            </Table.Tbody>
          </Table>
        </div>

        {filteredUsers.length > 0 ? (
          <div className="flex flex-wrap items-center col-span-12 intro-y sm:flex-nowrap gap-4">
            <div className="flex-1">
              <Pagination className="w-full sm:w-auto sm:mr-auto">
                <Pagination.Link onPageChange={() => handlePageChange(1)}>
                  <Lucide icon="ChevronsLeft" className="w-4 h-4" />
                </Pagination.Link>
                <Pagination.Link
                  onPageChange={() => handlePageChange(currentPage - 1)}
                >
                  <Lucide icon="ChevronLeft" className="w-4 h-4" />
                </Pagination.Link>

                {(() => {
                  const pages = [];
                  const maxPagesToShow = 5;
                  const ellipsisThreshold = 2;

                  pages.push(
                    <Pagination.Link
                      key={1}
                      active={currentPage === 1}
                      onPageChange={() => handlePageChange(1)}
                    >
                      1
                    </Pagination.Link>
                  );

                  if (currentPage > ellipsisThreshold + 1) {
                    pages.push(
                      <span key="ellipsis-start" className="px-3 py-2">
                        ...
                      </span>
                    );
                  }

                  for (
                    let i = Math.max(2, currentPage - ellipsisThreshold);
                    i <=
                    Math.min(totalPages - 1, currentPage + ellipsisThreshold);
                    i++
                  ) {
                    pages.push(
                      <Pagination.Link
                        key={i}
                        active={currentPage === i}
                        onPageChange={() => handlePageChange(i)}
                      >
                        {i}
                      </Pagination.Link>
                    );
                  }

                  if (currentPage < totalPages - ellipsisThreshold) {
                    pages.push(
                      <span key="ellipsis-end" className="px-3 py-2">
                        ...
                      </span>
                    );
                  }

                  if (totalPages > 1) {
                    pages.push(
                      <Pagination.Link
                        key={totalPages}
                        active={currentPage === totalPages}
                        onPageChange={() => handlePageChange(totalPages)}
                      >
                        {totalPages}
                      </Pagination.Link>
                    );
                  }

                  return pages;
                })()}

                <Pagination.Link
                  onPageChange={() => handlePageChange(currentPage + 1)}
                >
                  <Lucide icon="ChevronRight" className="w-4 h-4" />
                </Pagination.Link>
                <Pagination.Link
                  onPageChange={() => handlePageChange(totalPages)}
                >
                  <Lucide icon="ChevronsRight" className="w-4 h-4" />
                </Pagination.Link>
              </Pagination>
            </div>

            <div className="hidden mx-auto md:block text-slate-500">
              {!loading1 ? (
                filteredUsers && filteredUsers.length > 0 ? (
                  <>
                    {t("showing")} {indexOfFirstItem + 1} {t("to")}{" "}
                    {indexOfLastItem} {t("of")} {filteredUsers.length}{" "}
                    {t("entries")}
                  </>
                ) : searchQuery ? (
                  ""
                ) : (
                  t("noUser")
                )
              ) : (
                <div>{t("loading")}</div>
              )}
            </div>

            <div className="flex-1 flex justify-end">
              <FormSelect
                className="w-20 mt-3 !box sm:mt-0"
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={35}>35</option>
                <option value={50}>50</option>
              </FormSelect>
            </div>
          </div>
        ) : !loading1 ? (
          <div className="col-span-12 text-center text-slate-500">
            {t("noMatchingRecords")}
          </div>
        ) : (
          <div className="col-span-12 text-center text-slate-500">
            {t("loading")}
          </div>
        )}
      </div>

      <Dialog
        open={deleteConfirmationModal}
        onClose={() => {
          setDeleteConfirmationModal(false);
        }}
        initialFocus={deleteButtonRef}
      >
        <Dialog.Panel>
          <div className="p-5 text-center">
            <Lucide
              icon="Archive"
              className="w-16 h-16 mx-auto mt-3 text-danger"
            />
            <div className="mt-5 text-3xl">{t("Sure")}</div>
            <div className="mt-2 text-slate-500">
              {userIdToDelete
                ? t("ReallyArch")
                : `${t("ReallyArch")} ${
                    selectedUsers.size
                  } selected record(s)?`}
              <br />
              {/* {t("undone")} */}
            </div>
          </div>
          <div className="px-5 pb-8  text-center">
            <Button
              variant="outline-secondary"
              type="button"
              className="w-24 mr-4"
              onClick={() => {
                setDeleteConfirmationModal(false);
                setUserIdToDelete(null);
              }}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="danger"
              type="button"
              className="w-24"
              ref={deleteButtonRef}
              onClick={handleDeleteConfirm}
              disabled={archiveLoading}
            >
              {archiveLoading ? (
                <div className="loader">
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                </div>
              ) : (
                t("Archive")
              )}
            </Button>
          </div>
        </Dialog.Panel>
      </Dialog>

      <Dialog
        size="xl"
        open={superlargeModalSizePreview}
        onClose={() => {
          setSuperlargeModalSizePreview(false);
          setFileUrl("");
          setFileName("");
          setUserProfile(undefined);
          setShowAlert(null);
          setformErrors({
            id: "",
            firstName: "",
            lastName: "",
            username: "",
            email: "",
            // thumbnail: "",
          });
        }}
      >
        <Dialog.Panel className="p-10">
          <>
            {showAlert && <Alerts data={showAlert} />}
            <a
              onClick={(event: React.MouseEvent) => {
                event.preventDefault();
                setSuperlargeModalSizePreview(false);
                setShowAlert(null);
                setSuperlargeModalSizePreview(false);
                setFileUrl("");
                setFileName("");
                setUserProfile(undefined);
                setShowAlert(null);
                setformErrors({
                  id: "",
                  firstName: "",
                  lastName: "",
                  username: "",
                  email: "",
                  // thumbnail: "",
                });
              }}
              className="absolute top-0 right-0 mt-3 mr-3"
            >
              <Lucide icon="X" className="w-6 h-6 text-slate-400" />
            </a>
            <Tab.Group className="mt-3">
              <Tab.List variant="boxed-tabs">
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                  <Tab className="flex-1">
                    <Tab.Button
                      className="w-full py-2 px-3 sm:px-4 text-sm sm:text-base text-center rounded transition-colors"
                      as="button"
                    >
                      {t("edit_user")}
                    </Tab.Button>
                  </Tab>
                  <Tab className="flex-1">
                    <Tab.Button
                      className="w-full py-2 px-3 sm:px-4 text-sm sm:text-base text-center rounded transition-colors"
                      as="button"
                    >
                      {t("Change_password")}
                    </Tab.Button>
                  </Tab>
                </div>
              </Tab.List>

              <Tab.Panels className="mt-5">
                <Tab.Panel className="leading-relaxed">
                  <div className="col-span-12 intro-y lg:col-span-8">
                    <div className="p-5 intro-y box">
                      <div className="flex items-center justify-between">
                        <FormLabel htmlFor="crud-form-1" className="font-bold">
                          {t("first_name")}
                        </FormLabel>
                      </div>
                      <FormInput
                        id="crud-form-1"
                        type="text"
                        className={`w-full mb-2 ${clsx({
                          "border-danger": formErrors.firstName,
                        })}`}
                        name="firstName"
                        placeholder={t("enter_first_name")}
                        value={formData.firstName}
                        onChange={handleInputChange}
                        onKeyDown={(e) => handleKeyDown(e)}
                      />
                      {formErrors.firstName && (
                        <p className="text-red-500 text-sm">
                          {formErrors.firstName}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-5">
                        <FormLabel htmlFor="crud-form-2" className="font-bold">
                          {t("last_name")}
                        </FormLabel>
                      </div>
                      <FormInput
                        id="crud-form-2"
                        type="text"
                        className={`w-full mb-2 ${clsx({
                          "border-danger": formErrors.lastName,
                        })}`}
                        name="lastName"
                        placeholder={t("enter_last_name")}
                        value={formData.lastName}
                        onChange={handleInputChange}
                        onKeyDown={(e) => handleKeyDown(e)}
                      />
                      {formErrors.lastName && (
                        <p className="text-red-500 text-sm">
                          {formErrors.lastName}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-5">
                        <FormLabel htmlFor="crud-form-2" className="font-bold">
                          {t("username")}
                        </FormLabel>
                      </div>
                      <FormInput
                        id="crud-form-3"
                        type="text"
                        className={`w-full mb-2 ${clsx({
                          "border-danger":
                            formErrors.username ||
                            (isUserExists &&
                              formData.username !== user?.username),
                        })}`}
                        name="username"
                        placeholder={t("enter_user_name")}
                        value={formData.username}
                        onChange={handleInputChange}
                        onKeyDown={(e) => {
                          handleKeyDown(e);
                          if (e.key === " ") {
                            e.preventDefault();
                          }
                        }}
                      />

                      {/* Error messages */}
                      {isUserExists && formData.username !== user?.username && (
                        <p className="text-red-500 text-sm">
                          {t("usernameExist")}
                        </p>
                      )}
                      {formErrors.username && !isUserExists && (
                        <p className="text-red-500 text-sm">
                          {formErrors.username}
                        </p>
                      )}
                      {isUserExists === false && (
                        <p className="text-green-500 text-sm">
                          {t("available")}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-5">
                        <FormLabel htmlFor="crud-form-4" className="font-bold">
                          {t("email")}
                        </FormLabel>
                      </div>
                      <FormInput
                        id="crud-form-4"
                        type="text"
                        className={`w-full mb-2 ${clsx({
                          "border-danger": formErrors.email,
                        })}`}
                        name="email"
                        placeholder="Enter Email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled
                      />
                      {formErrors.email && (
                        <p className="text-red-500 text-sm">
                          {formErrors.email}
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-5">
                        <FormLabel htmlFor="crud-form-6" className="font-bold">
                          {t("thumbnail")}
                        </FormLabel>
                      </div>
                      <div
                        className={`relative w-full mb-2 p-4 border-2 ${
                          formErrors.thumbnail
                            ? "border-dotted border-danger"
                            : "border-dotted border-gray-300"
                        } rounded flex items-center justify-center h-32 overflow-hidden cursor-pointer dropzone dark:bg-[#272a31]`}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                      >
                        <input
                          id="crud-form-6"
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={handleFileChange}
                        />
                        <label
                          htmlFor="crud-form-6"
                          className={`cursor-pointer text-center w-full font-bold text-gray-500 absolute z-10 transition-transform duration-300 ${
                            fileUrl
                              ? "top-2 mb-1"
                              : "top-1/2 transform -translate-y-1/2"
                          }`}
                        >
                          {fileName
                            ? `${t("selected")} ${fileName}`
                            : t("drop")}
                        </label>
                        {fileUrl && (
                          <img
                            src={
                              fileUrl?.startsWith("http") ||
                              fileUrl?.startsWith("blob")
                                ? fileUrl
                                : `https://insightxr.s3.eu-west-2.amazonaws.com/images/${fileUrl}`
                            }
                            alt="Preview"
                            className="absolute inset-0 w-full h-full object-contain preview-image"
                          />
                        )}
                      </div>

                      {formErrors.thumbnail && (
                        <p className="text-red-500 text-sm">
                          {formErrors.thumbnail}
                        </p>
                      )}

                      <div className="mt-5">
                        <label className="font-bold">{t("role")}</label>
                        <div className="flex flex-col space-y-2">
                          {(localStorage.getItem("role") === "Superadmin" ||
                            localStorage.getItem("role") === "Administrator") &&
                            (!isAdminExists ||
                              (initialUserData &&
                                initialUserData.role === "Admin") ||
                              formData.role === "Admin") && (
                              <FormCheck className="mr-2" key="Admin">
                                <FormCheck.Input
                                  id="Admin"
                                  type="radio"
                                  name="role"
                                  value="Admin"
                                  checked={formData.role === "Admin"}
                                  onChange={handleInputChange}
                                  className="form-radio"
                                  onKeyDown={handleKeyDown}
                                />
                                <FormCheck.Label
                                  htmlFor="Admin"
                                  className="font-normal"
                                >
                                  {t("admin")}
                                </FormCheck.Label>
                              </FormCheck>
                            )}

                          <FormCheck className="mr-2">
                            <FormCheck.Input
                              id="Faculty"
                              type="radio"
                              name="role"
                              value="Faculty" // If this is a valid role in your API
                              checked={formData.role === "Faculty"}
                              onChange={handleInputChange}
                              className="form-radio"
                              onKeyDown={(e) => handleKeyDown(e)}
                            />
                            <FormCheck.Label
                              htmlFor="Faculty"
                              className="font-normal"
                            >
                              {t("faculty")}
                            </FormCheck.Label>
                          </FormCheck>

                          <FormCheck className="mr-2">
                            <FormCheck.Input
                              id="Observer"
                              type="radio"
                              name="role"
                              value="Observer" // Matches API value
                              checked={formData.role === "Observer"}
                              onChange={handleInputChange}
                              className="form-radio"
                              onKeyDown={(e) => handleKeyDown(e)}
                            />
                            <FormCheck.Label
                              htmlFor="Observer"
                              className="font-normal"
                            >
                              {t("Observer")}
                            </FormCheck.Label>
                          </FormCheck>

                          <FormCheck className="mr-2">
                            <FormCheck.Input
                              id="User"
                              type="radio"
                              name="role"
                              value="User" // Matches API value
                              checked={formData.role === "User"}
                              onChange={handleInputChange}
                              className="form-radio"
                              onKeyDown={(e) => handleKeyDown(e)}
                            />
                            <FormCheck.Label
                              htmlFor="User"
                              className="font-normal"
                            >
                              {t("user")}
                            </FormCheck.Label>
                          </FormCheck>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-col sm:flex-row items-center sm:justify-between gap-2">
                        {formData.password === "0" &&
                        (localStorage.getItem("role") === "Superadmin" ||
                          localStorage.getItem("role") === "Administrator") ? (
                          <Button
                            type="button"
                            variant="primary"
                            className="w-full sm:w-32"
                            onClick={handleResendMail}
                            title={t("already_set_password")}
                          >
                            {resendLoading ? (
                              <div className="loader">
                                <div className="dot"></div>
                                <div className="dot"></div>
                                <div className="dot"></div>
                              </div>
                            ) : (
                              t("resend_mail")
                            )}
                          </Button>
                        ) : (
                          <div className="w-full sm:w-32" />
                        )}

                        <Button
                          type="button"
                          variant="primary"
                          className="w-24"
                          onClick={handleSubmit}
                          disabled={loading}
                        >
                          {loading ? (
                            <div className="loader">
                              <div className="dot"></div>
                              <div className="dot"></div>
                              <div className="dot"></div>
                            </div>
                          ) : (
                            t("save")
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Tab.Panel>

                <Tab.Panel>
                  <div className="col-span-12 intro-y lg:col-span-8">
                    <div className="p-5 intro-y box">
                      {showAlert1 && <Alerts data={showAlert1} />}
                      <div className="flex items-center justify-between mt-5">
                        <FormLabel htmlFor="new-password">
                          {t("New_password")}
                        </FormLabel>
                      </div>
                      <FormInput
                        id="new-password"
                        type="password"
                        placeholder={t("Enter_New_Password")}
                        className="w-full"
                        value={newPassword.trim()}
                        onChange={handlePasswordChange}
                      />
                      {passwordError && (
                        <span className="text-red-500 text-sm">
                          {passwordError}
                        </span>
                      )}

                      <div className="flex items-center justify-between mt-5">
                        <FormLabel htmlFor="confirm-password">
                          {t("Confirm_new_password")}
                        </FormLabel>
                      </div>
                      <FormInput
                        id="confirm-password"
                        type="password"
                        placeholder={t("Enter_Confirm_Password")}
                        className="w-full"
                        value={confirmPassword.trim()}
                        onChange={handleConfirmPasswordChange}
                      />
                      {confirmPasswordError && (
                        <span className="text-red-500 text-sm">
                          {confirmPasswordError}
                        </span>
                      )}

                      <div className="mt-5 text-right">
                        <Button
                          type="button"
                          variant="primary"
                          className="w-24"
                          onClick={handleSubmit1}
                          disabled={loading}
                        >
                          {loading ? (
                            <div className="loader">
                              <div className="dot"></div>
                              <div className="dot"></div>
                              <div className="dot"></div>
                            </div>
                          ) : (
                            t("save")
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
          </>
        </Dialog.Panel>
      </Dialog>
    </>
  );
};

export default Main;
