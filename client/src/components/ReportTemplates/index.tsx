import React, { useState, useEffect } from "react";
import Lucide from "../Base/Lucide";
import Button from "../Base/Button";
import { FormInput, FormLabel, FormSelect } from "../Base/Form";
import { Dialog } from "../Base/Headless"; // Assuming standard path
import { useTranslation } from "react-i18next";
import {
  getCategoryAction,
  getInvestigationsByCategoryAction,
  saveTemplateAction,
  getTemplatesAction,
  deleteTemplateAction,
} from "@/actions/patientActions";
import { getUserOrgIdAction } from "@/actions/userActions";
import {
  getPresignedApkUrlAction,
  uploadFileAction,
} from "@/actions/s3Actions";
import {
  getOrgAction,
  uploadOrgUsedStorageAction,
} from "@/actions/organisationAction";
import { getSettingsAction } from "@/actions/settingAction";

interface MainProps {
  onShowAlert: (alert: {
    variant: "success" | "danger";
    message: string;
  }) => void;
  addTask?: any;
  updateTask?: any;
}

const Main: React.FC<MainProps> = ({ onShowAlert, addTask, updateTask }) => {
  const { t } = useTranslation();

  // --- Data States ---
  const [categories, setCategories] = useState<any[]>([]);
  const [investigations, setInvestigations] = useState<any[]>([]);
  const [parameters, setParameters] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // --- Organisation storage ---
  const [orgId, setOrgId] = useState<number | null>(null);
  const [orgStorage, setOrgStorage] = useState<{
    base: number;
    used: number;
  } | null>(null);

  // --- Form & UI States ---
  const [selectedCatId, setSelectedCatId] = useState<string>("");
  const [selectedInvestId, setSelectedInvestId] = useState<string>("");
  const [templateName, setTemplateName] = useState<string>("");
  const [paramValues, setParamValues] = useState<Record<number, string>>({});
  const [pendingFiles, setPendingFiles] = useState<Record<number, File>>({});
  const [localPreviews, setLocalPreviews] = useState<Record<number, string>>(
    {},
  );
  const [errors, setErrors] = useState<Record<string | number, string>>({});

  // --- Modal States ---
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmationModal, setDeleteConfirmationModal] = useState(false);
  const [templateIdToDelete, setTemplateIdToDelete] = useState<number | null>(
    null,
  );

  const [imageModal, setImageModal] = useState<{ open: boolean; url: string }>({
    open: false,
    url: "",
  });

  // 1. Initial Load: Categories and User ID
  useEffect(() => {
    const fetchInitialData = async () => {
      const res = await getCategoryAction();
      if (res) {
        const approvedCategories = res.filter(
          (category: any) => category.status !== "requested",
        );
        setCategories(approvedCategories);
      }

      const username = localStorage.getItem("user");
      if (username) {
        const userData = await getUserOrgIdAction(username);
        if (userData) setCurrentUserId(userData.id);
        setOrgId(userData.organisation_id);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchOrgStorage = async () => {
      if (!orgId) return;

      try {
        const org = await getOrgAction(orgId);

        let baseStorage = Number(org.baseStorage) || 0;
        const usedStorage = Number(org.used_storage) || 0;

        // 🔁 FALLBACK TO SETTINGS TABLE
        if (baseStorage <= 0) {
          const settings = await getSettingsAction();
          baseStorage = Number(settings?.storage) || 0;
        }

        setOrgStorage({
          base: baseStorage,
          used: usedStorage,
        });
      } catch (error) {
        console.error("Failed to fetch org storage", error);
      }
    };

    fetchOrgStorage();
  }, [orgId]);

  // 2. Load Investigations
  useEffect(() => {
    const fetchInvs = async () => {
      if (!selectedCatId) {
        setInvestigations([]);
        return;
      }
      const res = await getInvestigationsByCategoryAction(selectedCatId);
      if (res) {
        const invest = res.filter(
          (investigation: any) => investigation.status !== "requested",
        );
        setInvestigations(invest);
      }
    };
    fetchInvs();
    setSelectedInvestId("");
    setParameters([]);
    setTemplates([]);
  }, [selectedCatId]);

  // 3. Load Matrix Data & Auto-name
  const loadMatrixData = async (invId: string) => {
    const res = await getTemplatesAction(invId);
    if (res && res.status === "success") {
      const approvedparams = res.parameters.filter(
        (params: any) => params.status !== "requested",
      );
      setParameters(approvedparams || []);
      setTemplates(res.templates || []);
    }
  };

  useEffect(() => {
    if (selectedInvestId) {
      loadMatrixData(selectedInvestId);
    }
  }, [selectedInvestId]);

  useEffect(() => {
    if (selectedInvestId && templates) {
      const templateNumbers = templates
        .map((t) => {
          const match = t.template_name.match(/(\d+)$/);
          return match ? parseInt(match[0], 10) : 0;
        })
        .filter((num) => !isNaN(num));

      const maxNumber =
        templateNumbers.length > 0 ? Math.max(...templateNumbers) : 0;
      setTemplateName(`${t("Template")} ${maxNumber + 1}`);
    }
  }, [templates, selectedInvestId, t]);

  const handleFileChange = (
    paramId: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFiles((prev) => ({ ...prev, [paramId]: file }));
    const previewUrl = URL.createObjectURL(file);
    setLocalPreviews((prev) => ({ ...prev, [paramId]: previewUrl }));
  };

  const removePendingFile = (paramId: number) => {
    setPendingFiles((prev) => {
      const updated = { ...prev };
      delete updated[paramId];
      return updated;
    });
    setLocalPreviews((prev) => {
      const updated = { ...prev };
      delete updated[paramId];
      return updated;
    });
  };

  const handleSaveTemplate = async () => {
    const newErrors: Record<string | number, string> = {};

    // Validate Template Name
    if (!templateName.trim()) {
      newErrors["templateName"] = t("Templatename");
    }

    // Validate Parameters
    parameters.forEach((p) => {
      if (p.field_type === "image") {
        if (!pendingFiles[p.id]) {
          newErrors[p.id] = t("Pleaseupload");
        }
      } else {
        if (!paramValues[p.id] || !paramValues[p.id].trim()) {
          newErrors[p.id] = t("Thisfieldrequired");
        }
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    const totalUploadMB = Object.values(pendingFiles).reduce(
      (sum, file) => sum + file.size / (1024 * 1024),
      0,
    );

    if (orgStorage) {
      const remainingMB = orgStorage.base - orgStorage.used;

      if (totalUploadMB > remainingMB) {
        onShowAlert({
          variant: "danger",
          message: `${t("Insufficientstoragespace")} (${remainingMB.toFixed(2)} MB remaining)`,
        });
        return;
      }
    }

    setIsSaving(true);
    try {
      const finalParameterValues = [];
      for (const p of parameters) {
        let valueToSave = paramValues[p.id] || "—";

        if (p.field_type === "image" && pendingFiles[p.id]) {
          const file = pendingFiles[p.id];

          const uploadData = await getPresignedApkUrlAction(
            file.name,
            file.type,
            file.size,
          );

          if (addTask && updateTask) {
            const taskId = addTask(file, `param_${p.id}_${Date.now()}`);
            await uploadFileAction(
              uploadData.presignedUrl,
              file,
              taskId,
              updateTask,
            );
          } else {
            await fetch(uploadData.presignedUrl, {
              method: "PUT",
              body: file,
              headers: { "Content-Type": file.type },
            });
          }
          valueToSave = uploadData.url;
        }
        finalParameterValues.push({ parameter_id: p.id, value: valueToSave });
      }

      if (totalUploadMB > 0 && orgId) {
        await uploadOrgUsedStorageAction(totalUploadMB, orgId);
      }

      const res = await saveTemplateAction({
        investigation_id: selectedInvestId,
        template_name: templateName,
        parameter_values: finalParameterValues,
        addedBy: currentUserId,
      });

      if (res) {
        onShowAlert({ variant: "success", message: t("Templatesaved") });
        setParamValues({});
        setPendingFiles({});
        setLocalPreviews({});
        await loadMatrixData(selectedInvestId);
      }
    } catch (error: any) {
      const backendMessage =
        error?.response?.data?.message || t("Errorsavingtemplate");

      const remainingStorage = error?.response?.data?.remainingStorageMB;

      onShowAlert({
        variant: "danger",
        message: remainingStorage
          ? `${backendMessage} (${remainingStorage.toFixed(2)} MB remaining)`
          : backendMessage,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!templateIdToDelete || !currentUserId) return;
    setIsDeleting(true);
    try {
      const res = await deleteTemplateAction(templateIdToDelete, currentUserId);
      if (res) {
        onShowAlert({
          variant: "success",
          message: t("Templatedeletedsuccessfully"),
        });
        await loadMatrixData(selectedInvestId);
      }
    } catch (error) {
      onShowAlert({ variant: "danger", message: t("Deletefailed") });
    } finally {
      setIsDeleting(false);
      setDeleteConfirmationModal(false);
      setTemplateIdToDelete(null);
    }
  };

  const currentInvestName = investigations.find(
    (i) => i.id.toString() === selectedInvestId,
  )?.name;

  return (
    <div className="">
      <h2 className="text-lg font-medium intro-y">
        {t("CreateInvestigationTemplate")}
      </h2>

      <div className="grid grid-cols-12 gap-6 mt-5">
        <div className="col-span-12 box p-5 bg-slate-50 border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <FormLabel className="text-[10px] font-bold text-slate-500 uppercase">
                1. {t("Category")}
              </FormLabel>
              <FormSelect
                value={selectedCatId}
                onChange={(e) => setSelectedCatId(e.target.value)}
              >
                <option value="">{t("SelectCategory")}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </FormSelect>
            </div>
            <div>
              <FormLabel className="text-[10px] font-bold text-slate-500 uppercase">
                2. {t("Investigation")}
              </FormLabel>
              <FormSelect
                disabled={!selectedCatId}
                value={selectedInvestId}
                onChange={(e) => setSelectedInvestId(e.target.value)}
              >
                <option value="">{t("ChooseInvestigation")}</option>
                {investigations.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.name}
                  </option>
                ))}
              </FormSelect>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        {/* Sidebar */}
        {selectedInvestId && parameters.length > 0 && (
          <div className="col-span-12 lg:col-span-4 intro-y">
            <div className="box p-5 sticky top-5">
              {/* Template Name Field */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-1">
                  <FormLabel className="text-xs font-semibold mb-0">
                    {t("TemplateName")}
                  </FormLabel>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">
                    {t("required")}
                  </span>
                </div>
                <FormInput
                  className={`${errors["templateName"] ? "border-danger" : ""}`}
                  value={templateName}
                  onChange={(e) => {
                    setTemplateName(e.target.value);
                    if (errors["templateName"])
                      setErrors((prev) => ({ ...prev, templateName: "" }));
                  }}
                />
                {errors["templateName"] && (
                  <p className="text-danger text-[10px] mt-1 font-medium">
                    {errors["templateName"]}
                  </p>
                )}
              </div>

              <div className="space-y-4 max-h-[450px] overflow-y-auto px-1 pr-2 custom-scrollbar">
                {parameters.map((p) => (
                  <div key={p.id}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold">{p.name}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">
                        {t("required")}
                      </span>
                    </div>

                    {p.field_type === "image" ? (
                      <div>
                        {localPreviews[p.id] ? (
                          <div
                            className={`relative w-full h-24 border rounded overflow-hidden ${
                              errors[p.id] ? "border-danger" : ""
                            }`}
                          >
                            <img
                              src={localPreviews[p.id]}
                              className="w-full h-full object-cover"
                              alt="local"
                            />
                            <button
                              onClick={() => removePendingFile(p.id)}
                              className="absolute top-1 right-1 bg-danger text-white p-1 rounded-full"
                            >
                              <Lucide icon="X" className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div
                            className={`relative border-2 border-dashed rounded-lg p-4 text-center bg-white cursor-pointer hover:bg-slate-50 ${
                              errors[p.id] ? "border-danger" : ""
                            }`}
                          >
                            <input
                              type="file"
                              accept="image/*"
                              className="absolute inset-0 opacity-0 cursor-pointer"
                              onChange={(e) => {
                                handleFileChange(p.id, e);
                                if (errors[p.id])
                                  setErrors((prev) => ({
                                    ...prev,
                                    [p.id]: "",
                                  }));
                              }}
                            />
                            <Lucide
                              icon="Image"
                              className={`w-6 h-6 mx-auto ${
                                errors[p.id] ? "text-danger" : "text-slate-300"
                              }`}
                            />
                            <span
                              className={`text-[10px] block mt-1 ${
                                errors[p.id] ? "text-danger" : "text-slate-400"
                              }`}
                            >
                              {t("SelectImage")}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <FormInput
                        className={`${errors[p.id] ? "border-danger" : ""}`}
                        value={paramValues[p.id] || ""}
                        onChange={(e) => {
                          setParamValues({
                            ...paramValues,
                            [p.id]: e.target.value,
                          });
                          if (errors[p.id])
                            setErrors((prev) => ({ ...prev, [p.id]: "" }));
                        }}
                      />
                    )}

                    {/* Field Level Error Message */}
                    {errors[p.id] && (
                      <p className="text-danger text-[10px] mt-1 font-medium">
                        {errors[p.id]}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <Button
                variant="primary"
                className="w-full mt-6"
                onClick={handleSaveTemplate}
                disabled={isSaving}
              >
                {isSaving ? (
                  <div className="loader">
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                  </div>
                ) : (
                  <div className="flex items-center">{t("save")}</div>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Matrix Table */}
        <div
          className={`col-span-12 ${
            selectedInvestId && parameters.length > 0 ? "lg:col-span-8" : ""
          } intro-y`}
        >
          {selectedInvestId ? (
            parameters.length > 0 ? (
              <div className="box overflow-hidden border rounded-lg">
                <div className="p-6 bg-white border-b flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-800">
                    {currentInvestName}
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse table-auto">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="p-3 text-[11px] font-bold border-b border-r w-[200px]">
                          {t("param")}
                        </th>
                        <th className="p-3 text-[11px] font-bold border-b border-r w-[150px]">
                          {t("range")}
                        </th>
                        {templates.map((temp) => (
                          <th
                            key={temp.id}
                            className="p-4 border-b border-r text-center bg-white"
                          >
                            <div className="flex flex-col items-center">
                              <span className="text-primary font-bold text-xs mb-2">
                                {temp.template_name}
                              </span>
                              <button
                                className="text-danger hover:bg-danger/10 p-1 rounded transition-colors"
                                onClick={() => {
                                  setTemplateIdToDelete(temp.id);
                                  setDeleteConfirmationModal(true);
                                }}
                              >
                                <Lucide icon="Trash2" className="w-4 h-4" />
                              </button>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {parameters.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="p-3 text-sm font-bold border-r border-b">
                            {p.name}
                          </td>
                          <td className="p-3 border-r border-b text-[11px] text-slate-400">
                            {p.normal_range} {p.units}
                          </td>
                          {templates.map((temp) => (
                            <td
                              key={temp.id}
                              className="p-4 border-r border-b text-center bg-white"
                            >
                              {p.field_type === "image" ? (
                                temp.values[p.id] &&
                                temp.values[p.id] !== "—" ? (
                                  <img
                                    src={temp.values[p.id]}
                                    className="w-8 h-8 mx-auto object-cover rounded cursor-pointer"
                                    onClick={() =>
                                      setImageModal({
                                        open: true,
                                        url: temp.values[p.id],
                                      })
                                    }
                                  />
                                ) : (
                                  "—"
                                )
                              ) : (
                                <span className="text-sm">
                                  {temp.values[p.id] || "—"}
                                </span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="box p-10 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200">
                <Lucide icon="FileSearch" className="w-12 h-12 mb-4" />
                <div className="text-sm font-medium">
                  {t("Thisinvestigation")}
                </div>
              </div>
            )
          ) : (
            <div className="box p-10 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200">
              <Lucide icon="ArrowUpCircle" className="w-10 h-10 mb-3" />
              <div className="text-sm font-medium">{t("Pleaseselect")}</div>
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={deleteConfirmationModal}
        onClose={() => {
          setDeleteConfirmationModal(false);
          setTemplateIdToDelete(null);
        }}
      >
        <Dialog.Panel>
          <div className="p-5 text-center">
            <Lucide
              icon="Trash2"
              className="w-16 h-16 mx-auto mt-3 text-danger"
            />
            <div className="mt-5 text-3xl">{t("Sure")}</div>
            <div className="mt-2 text-slate-500">{t("ReallyDelete")}</div>
          </div>
          <div className="px-5 pb-8 text-center">
            <Button
              variant="outline-secondary"
              type="button"
              className="w-24 mr-4"
              onClick={() => {
                setDeleteConfirmationModal(false);
                setTemplateIdToDelete(null);
              }}
              disabled={isDeleting}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="danger"
              type="button"
              className="w-24"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <div className="loader">
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                </div>
              ) : (
                t("delete")
              )}
            </Button>
          </div>
        </Dialog.Panel>
      </Dialog>

      {/* Image View Modal */}
      <Dialog
        open={imageModal.open}
        onClose={() => setImageModal({ open: false, url: "" })}
        size="sm"
      >
        <Dialog.Panel className="p-2">
          <div className="relative">
            {/* Close Button */}
            <button
              onClick={() => setImageModal({ open: false, url: "" })}
              className="absolute top-2 right-2 z-50 bg-white/80 hover:bg-white p-2 rounded-full shadow-md text-slate-600"
            >
              <Lucide icon="X" className="w-4 h-4" />
            </button>

            {/* Image Display */}
            <div className="flex items-center justify-center bg-slate-100 rounded overflow-hidden">
              <img
                src={imageModal.url}
                alt="Preview"
                className="max-w-full max-h-[80vh] object-contain"
              />
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>
    </div>
  );
};

export default Main;
