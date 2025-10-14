import React, { useState, useEffect, ChangeEvent } from "react";
import { t } from "i18next";
import {
  FormSelect,
  FormLabel,
  FormCheck,
  FormInput,
} from "@/components/Base/Form";
import Button from "@/components/Base/Button";
import {
  getImageTestsByCategoryAction,
  uploadImagesToLibraryAction,
  getImagesByInvestigationAction,
} from "@/actions/patientActions";
import {
  getPresignedApkUrlAction,
  uploadFileAction,
} from "@/actions/s3Actions";
import { useUploads } from "@/components/UploadContext";
import clsx from "clsx";
import Alerts from "@/components/Alert";
import { getAdminOrgAction } from "@/actions/adminActions";
import FileIcon from "@/components/Base/FileIcon";
import { getAllOrgAction } from "@/actions/organisationAction";
import { getUserOrgIdAction } from "@/actions/userActions";

// --- TYPE DEFINITIONS ---

interface Organisation {
  id: string;
  name: string;
}

interface Investigation {
  id: number;
  test_name: string;
  category: string;
  test_parameter_id?: number;
  name: string;
  size: number;
}

// This interface correctly defines the shape of the image objects from your API
interface ExistingImage {
  id: number;
  image_url: string;
  name: string;
  size: number;
}

interface ImageLibraryProps {
  categories: { category: string }[];
}

// --- COMPONENT ---

const ImageLibrary: React.FC<ImageLibraryProps> = ({ categories }) => {
  // --- STATE MANAGEMENT ---

  const [selection, setSelection] = useState<{
    category: string;
    investigation_id: number | null;
    testParameter_id: number | null;
    visibility: "public" | "private";
    organization_id: number | null;
  }>({
    category: "",
    investigation_id: null,
    testParameter_id: null,
    visibility: "public",
    organization_id: null,
  });
  const userRole = localStorage.getItem("role");
  const { addTask, updateTask } = useUploads();
  const [filteredInvestigations, setFilteredInvestigations] = useState<
    Investigation[]
  >([]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  // State is correctly typed to hold an array of ExistingImage objects
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [removedImages, setRemovedImages] = useState<ExistingImage[]>([]);
  // const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganisations] = useState<Organisation[]>([]);
  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);
  const [userData, setUserData] = useState<{
    uid: number;
    role: string;
  } | null>(null);
  const [orgId, setOrgId] = useState();

  useEffect(() => {
    const fetchUser = async () => {
      const userEmail = localStorage.getItem("user");
      if (userEmail) {
        try {
          const data = await getAdminOrgAction(userEmail);
          setUserData({ uid: data.uid, role: data.role });
        } catch (err) {
          console.error("Error fetching user data:", err);
        }
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!selection.category) {
      setFilteredInvestigations([]);
      setSelection((prev) => ({
        ...prev,
        investigation_id: null,
        testParameter_id: null,
      }));
      return;
    }
    const fetchTests = async () => {
      try {
        const filtered = await getImageTestsByCategoryAction(
          selection.category
        );
        setFilteredInvestigations(filtered);
        setSelection((prev) => ({
          ...prev,
          investigation_id: null,
          testParameter_id: null,
        }));
      } catch (err) {
        console.error("Error fetching image tests:", err);
        setFilteredInvestigations([]);
      }
    };
    fetchTests();
  }, [selection.category]);

  // Fetch existing images when an investigation is selected
  useEffect(() => {
    const investigationId = selection.investigation_id;
    if (investigationId) {
      const fetchExistingImages = async () => {
        try {
          const response = await getImagesByInvestigationAction(
            investigationId
          );
          // THE FIX: We use a type assertion here because the action's return type
          // is incorrect. This tells TypeScript to treat `response.images`
          // as an array of ExistingImage objects, which resolves the error.
          setExistingImages(response.images as unknown as ExistingImage[]);
          setRemovedImages([]);
        } catch (err) {
          console.error("Error fetching existing images:", err);
        }
      };
      fetchExistingImages();
    } else {
      setExistingImages([]);
      setRemovedImages([]);
    }
  }, [selection.investigation_id]);

  useEffect(() => {
    const fetchOrganisations = async () => {
      try {
        const data = await getAllOrgAction();
        setOrganisations(data);
      } catch (error) {
        console.error("Failed to fetch organisations:", error);
      }
    };

    fetchOrganisations();
  }, []);

  const fetchOrganisationId = async () => {
    const username = localStorage.getItem("user");
    if (username && userRole === "Admin") {
      try {
        const data = await getUserOrgIdAction(username);
        if (data && data.organisation_id) {
          setOrgId(data.organisation_id);
        } else {
          console.error("No organisation_id found for user");
        }
      } catch (error) {
        console.error("Error fetching organisation_id:", error);
      }
    }
  };

  useEffect(() => {
    fetchOrganisationId();
  }, []);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "image/gif",
    ];
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    const newErrors: string[] = [];
    const validFiles: File[] = [];
    files.forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        newErrors.push(`${file.name} - ${t("Invalid file type")}`);
      } else if (file.size > MAX_FILE_SIZE) {
        newErrors.push(`${file.name} - ${t("File size exceeds 5 MB")}`);
      } else {
        validFiles.push(file);
      }
    });
    setErrors((prev) => ({
      ...prev,
      files: newErrors.length > 0 ? newErrors.join(", ") : "",
    }));
    setSelectedImages((prev) => [...prev, ...validFiles]);
    e.target.value = "";
  };

  const removeNewImage = (index: number) =>
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));

  const removeExistingImage = (index: number) => {
    const removedImage = existingImages[index];
    setRemovedImages((prev) => [...prev, removedImage]);
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setSelection((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!selection.category) newErrors.category = t("Please select a category");
    if (!selection.investigation_id)
      newErrors.investigation = t("Please select a test");
    if (selection.visibility === "private" && !selection.organization_id) {
      newErrors.organization = t("Please select an organization");
    }
    if (selectedImages.length === 0 && existingImages.length === 0) {
      newErrors.files = t("Please select or keep at least one image");
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpload = async () => {
    if (!validateForm() || !selection.investigation_id) return;

    setLoading(true);
    setShowAlert(null);

    try {
      const uploadedImageUrls: string[] = [];
      for (const file of selectedImages) {
        try {
          const { presignedUrl, url: s3Url } = await getPresignedApkUrlAction(
            file.name,
            file.type,
            file.size
          );
          const taskId = addTask(file, file.name);
          await uploadFileAction(presignedUrl, file, taskId, updateTask);
          uploadedImageUrls.push(s3Url);
        } catch (fileErr) {
          console.error("Upload failed for file:", file.name, fileErr);
        }
      }

      if (uploadedImageUrls.length !== selectedImages.length) {
        throw new Error("Some files failed to upload. Please try again.");
      }

      const formData = new FormData();
      formData.append("category", selection.category);
      formData.append("added_by", String(userData?.uid || ""));
      formData.append(
        "test_name",
        filteredInvestigations.find((t) => t.id === selection.investigation_id)
          ?.test_name ?? ""
      );
      formData.append("investigation_id", String(selection.investigation_id));

      if (selection.visibility === "private" && selection.organization_id) {
        formData.append("organization_id", String(selection.organization_id));
      }

      if ((userRole === "Admin" || userRole === "Faculty") && orgId) {
        formData.append("organization_id", String(orgId));
        formData.append("visibility", 'private');
      } else {
        formData.append("visibility", selection.visibility);
      }

      uploadedImageUrls.forEach((url) => formData.append("images[]", url));
      existingImages.forEach((image) =>
        formData.append("existing_images[]", image.image_url)
      );

      removedImages.forEach((image) =>
        formData.append("removed_images[]", image.image_url)
      );

      await uploadImagesToLibraryAction(formData);

      setShowAlert({
        variant: "success",
        message: t("Images uploaded successfully"),
      });
      setSelectedImages([]);
      setExistingImages([]);
      setRemovedImages([]);
      setErrors({});
      setSelection({
        category: "",
        investigation_id: null,
        testParameter_id: null,
        visibility: "public",
        organization_id: null,
      });
    } catch (err: any) {
      console.error("Upload process failed:", err);
      setErrors({ upload: err.message || t("Failed to upload images") });
      setShowAlert({
        variant: "danger",
        message:
          err.response.data.error == "Insufficient storage space"
            ? t("Insufficientstoragespace")
            : t("Failed to upload images"),
      });
      setTimeout(() => setShowAlert(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const getFullImageUrl = (value: string) => {
    return value.startsWith("http")
      ? value
      : `https://insightxr.s3.eu-west-2.amazonaws.com/images/${value}`;
  };

  return (
    <>
      {showAlert && <Alerts data={showAlert} />}
      <div className="flex flex-col gap-5 p-4 rounded-lg">
        {/* Form sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FormLabel htmlFor="category">{t("Category")}</FormLabel>
            <FormSelect
              id="category"
              value={selection.category}
              onChange={(e) =>
                setSelection({
                  ...selection,
                  category: e.target.value,
                  investigation_id: null,
                  testParameter_id: null,
                })
              }
              className={clsx({ "border-danger": errors.category })}
            >
              <option value="">{t("select_category")}</option>
              {categories.map((cat) => (
                <option key={cat.category} value={cat.category}>
                  {cat.category}
                </option>
              ))}
            </FormSelect>
            {errors.category && (
              <p className="text-red-500 text-sm mt-1">{errors.category}</p>
            )}
          </div>

          <div>
            <FormLabel htmlFor="test_name">{t("Test")}</FormLabel>
            <FormSelect
              id="test_name"
              value={selection.investigation_id ?? ""}
              onChange={(e) => {
                const invId = Number(e.target.value);
                const selectedTest = filteredInvestigations.find(
                  (t) => t.id === invId
                );
                setSelection({
                  ...selection,
                  investigation_id: invId,
                  testParameter_id: selectedTest?.test_parameter_id ?? null,
                });
              }}
              disabled={
                !selection.category || filteredInvestigations.length === 0
              }
              className={clsx({ "border-danger": errors.investigation })}
            >
              <option value="">{t("select_test")}</option>
              {filteredInvestigations.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.test_name}
                </option>
              ))}
            </FormSelect>
            {errors.investigation && (
              <p className="text-red-500 text-sm mt-1">
                {errors.investigation}
              </p>
            )}
          </div>
        </div>

        {userRole != "Faculty" && userRole != "Admin" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <div>
              <FormLabel className="font-bold block mb-3">
                {t("Visibility")}
              </FormLabel>
              <div className="flex space-x-3">
                <FormCheck>
                  <FormCheck.Input
                    id="public"
                    type="radio"
                    name="visibility"
                    value="public"
                    checked={selection.visibility === "public"}
                    onChange={handleInputChange}
                  />
                  <FormCheck.Label
                    htmlFor="public"
                    className="font-normal ml-2"
                  >
                    {t("public")}
                  </FormCheck.Label>
                </FormCheck>
                <FormCheck>
                  <FormCheck.Input
                    id="private"
                    type="radio"
                    name="visibility"
                    value="private"
                    checked={selection.visibility === "private"}
                    onChange={handleInputChange}
                  />
                  <FormCheck.Label
                    htmlFor="private"
                    className="font-normal ml-2"
                  >
                    {t("private")}
                  </FormCheck.Label>
                </FormCheck>
              </div>
            </div>

            {/* --- MODIFIED SECTION --- */}
            <div
              className={clsx("transition-opacity duration-300", {
                "opacity-100": selection.visibility === "private",
                "opacity-0 invisible": selection.visibility !== "private",
              })}
            >
              <FormLabel htmlFor="organization">{t("Organisation")}</FormLabel>
              <FormSelect
                id="organization"
                name="organization_id"
                value={selection.organization_id ?? ""}
                onChange={(e) =>
                  setSelection({
                    ...selection,
                    organization_id: Number(e.target.value) || null,
                  })
                }
                className={clsx({ "border-danger": errors.organization })}
                // Disable the dropdown when not visible to prevent interaction
                disabled={selection.visibility !== "private"}
              >
                <option value="">{t("select_organization")}</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </FormSelect>
              {errors.organization && (
                <p className="text-red-500 text-sm">{errors.organization}</p>
              )}
            </div>
          </div>
        )}

        {/* Image Upload and Display */}
        {selection.investigation_id && (
          <>
            <label className="cursor-pointer mt-2">
              <FormInput
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                multiple
              />
              <div className="w-full h-full p-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center gap-1 transition-all hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {t("Upload Images")}
                </span>
              </div>
            </label>
            <div className="w-full mt-4">
              {(existingImages.length > 0 || selectedImages.length > 0) && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {existingImages.map((image, index) => (
                    <div
                      key={image.id}
                      className="intro-y cursor-pointer p-2 rounded-md transition-all relative group"
                    >
                      <div className="pt-5 pb-3 rounded-md file box sm:px-2 zoom-in">
                        <FileIcon
                          className="w-3/4 mx-auto"
                          variant="image"
                          src={getFullImageUrl(image.image_url)}
                        />
                        <a
                          href="#"
                          onClick={(e) => e.preventDefault()}
                          className="block mt-3 font-medium text-center truncate"
                        >
                          {image.name}
                        </a>
                        <div className="text-slate-500 text-xs text-center mt-0.5">
                          {image.size == 0 ? "0 KB" : formatBytes(image.size)}
                        </div>
                      </div>
                      {userRole != "Faculty" && (
                        <button
                          type="button"
                          onClick={() => removeExistingImage(index)}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center text-xs opacity-100 transition-opacity"
                          aria-label="Remove existing image"
                        >
                          &#x2715;
                        </button>
                      )}
                    </div>
                  ))}
                  {selectedImages.map((file, index) => (
                    <div
                      key={`new-${index}`}
                      className="intro-y cursor-pointer p-2 rounded-md transition-all relative group"
                    >
                      <div className="pt-5 pb-3 rounded-md file box sm:px-2 zoom-in">
                        <FileIcon
                          className="w-3/4 mx-auto"
                          variant="image"
                          src={URL.createObjectURL(file)}
                        />
                        <a
                          href="#"
                          onClick={(e) => e.preventDefault()}
                          className="block mt-4 font-medium text-center truncate"
                        >
                          {file.name}
                        </a>
                        <div className="text-slate-500 text-xs text-center mt-0.5">
                          {formatBytes(file.size)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center text-xs opacity-100 transition-opacity"
                        aria-label="Remove new image"
                      >
                        &#x2715;
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-6 text-right">
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleUpload}
                  className="w-28"
                  disabled={
                    loading ||
                    (selectedImages.length == 0 && removedImages.length == 0)
                  }
                >
                  {loading ? "Saving..." : t("save")}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default ImageLibrary;
