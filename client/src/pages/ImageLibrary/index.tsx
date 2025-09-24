import React, { useState, useEffect, ChangeEvent } from "react";
import { t } from "i18next";
import { FormSelect, FormLabel } from "@/components/Base/Form";
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

interface Investigation {
  id: number;
  test_name: string;
  category: string;
  test_parameter_id?: number;
}

interface TestParameter {
  id: number;
  field_type: string;
  investigation_id: number;
}

interface ImageLibraryProps {
  categories: { category: string }[];
  investigations: Investigation[];
  testParameters: TestParameter[];
}

const ImageLibrary: React.FC<ImageLibraryProps> = ({
  categories,
  testParameters,
}) => {
  const [selection, setSelection] = useState<{
    category: string;
    investigation_id: number | null;
    testParameter_id: number | null;
  }>({ category: "", investigation_id: null, testParameter_id: null });

  const { addTask, updateTask } = useUploads();
  const [filteredInvestigations, setFilteredInvestigations] = useState<
    Investigation[]
  >([]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [removedImages, setRemovedImages] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);
  const [userData, setUserData] = useState<{
    uid: number;
    role: string;
  } | null>(null);

  // Fetch existing images
  useEffect(() => {
    const fetchExistingImages = async () => {
      if (!selection.investigation_id) return;

      try {
        const response = await getImagesByInvestigationAction(
          selection.investigation_id
        );
        // map to only URLs
        setExistingImages(response.images.map((img: any) => img.image_url));
        setRemovedImages([]);
      } catch (err) {
        console.error("Error fetching existing images:", err);
      }
    };

    fetchExistingImages();
  }, [selection.investigation_id]);

  // Fetch user once
  useEffect(() => {
    const fetchUser = async () => {
      const userEmail = localStorage.getItem("user");
      if (userEmail) {
        const data = await getAdminOrgAction(userEmail);
        setUserData({ uid: data.uid, role: data.role });
      }
    };
    fetchUser();
  }, []);

  // Fetch tests for selected category
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

  // Handle file selection
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
    const MAX_FILE_SIZE = 5 * 1024 * 1024;

    const newErrors: string[] = [];
    const validFiles: File[] = [];

    files.forEach((file) => {
      if (!allowedTypes.includes(file.type))
        newErrors.push(`${file.name} - ${t("Invalid file type")}`);
      else if (file.size > MAX_FILE_SIZE)
        newErrors.push(`${file.name} - ${t("File size exceeds 5 MB")}`);
      else validFiles.push(file);
    });

    setErrors((prev) => ({ ...prev, files: newErrors.join(", ") }));
    setSelectedImages((prev) => [...prev, ...validFiles]);
    e.target.value = "";
  };

  const removeImage = (index: number) =>
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));

  const removeExistingImage = (index: number) => {
    const removed = existingImages[index];
    setRemovedImages((prev) => [...prev, removed]);
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!selection.category) newErrors.category = t("Please select a category");
    if (!selection.investigation_id)
      newErrors.investigation = t("Please select a test");
    if (!selection.testParameter_id)
      newErrors.testParameter = t("Test parameter missing");
    if (selectedImages.length === 0 && existingImages.length === 0)
      newErrors.files = t("Please select at least one image");

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpload = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const uploadedImageUrls: string[] = [];

      // Upload new images
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

      if (uploadedImageUrls.length === 0 && existingImages.length === 0) {
        setErrors({ files: t("Please select at least one image") });
        setLoading(false);
        return;
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

      // Append new images
      uploadedImageUrls.forEach((url) => formData.append("images[]", url));
      existingImages.forEach((url) =>
        formData.append("existing_images[]", url)
      );
      removedImages.forEach((url) => formData.append("removed_images[]", url));

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
      });
    } catch (err) {
      console.error("Upload failed:", err);
      setErrors({ upload: t("Failed to upload images") });
      setShowAlert({
        variant: "danger",
        message: t("Failed to upload images"),
      });
      setTimeout(() => setShowAlert(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {showAlert && <Alerts data={showAlert} />}
      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="w-full md:w-1/2">
            <FormLabel htmlFor="category">{t("Category")}</FormLabel>
            <FormSelect
              id="category"
              value={selection.category}
              onChange={(e) =>
                setSelection({
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
              <p className="text-red-500 text-sm">{errors.category}</p>
            )}
          </div>

          <div className="w-full md:w-1/2">
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
                  category: selection.category,
                  investigation_id: invId,
                  testParameter_id: selectedTest?.test_parameter_id ?? null,
                });
              }}
              disabled={
                !selection.category || filteredInvestigations.length === 0
              }
            >
              <option value="">{t("select_test")}</option>
              {filteredInvestigations.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.test_name}
                </option>
              ))}
            </FormSelect>
            {errors.investigation && (
              <p className="text-red-500 text-sm">{errors.investigation}</p>
            )}
          </div>
        </div>

        {selection.investigation_id && (
          <div className="w-full mt-4">
            <FormLabel htmlFor="image_upload">{t("Upload Images")}</FormLabel>
            <input
              id="image_upload"
              type="file"
              accept="image/*"
              multiple
              className={clsx("border rounded p-1 w-full", {
                "border-danger": errors.files,
              })}
              onChange={handleFileChange}
            />
            {errors.files && (
              <p className="text-red-500 text-sm mt-1">{errors.files}</p>
            )}
            {errors.upload && (
              <p className="text-red-500 text-sm mt-1">{errors.upload}</p>
            )}

            {(existingImages.length > 0 || selectedImages.length > 0) && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {existingImages.map((url, index) => (
                  <div
                    key={`existing-${index}`}
                    className="relative border rounded-lg overflow-hidden"
                  >
                    <img
                      src={url}
                      alt={`existing-${index}`}
                      className="w-full h-32 object-cover"
                    />
                  </div>
                ))}

                {selectedImages.map((file, index) => (
                  <div
                    key={`new-${index}`}
                    className="relative border rounded-lg overflow-hidden"
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`new-${index}`}
                      className="w-full h-32 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full px-2 py-1 text-xs opacity-80 hover:opacity-100"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 text-right">
              <Button
                type="button"
                variant="primary"
                onClick={handleUpload}
                className="w-24"
                disabled={loading || selectedImages.length === 0}
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
        )}
      </div>
    </>
  );
};

export default ImageLibrary;
