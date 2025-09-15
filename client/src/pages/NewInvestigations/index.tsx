import React, { useEffect } from "react";
import { t } from "i18next";
import Lucide from "@/components/Base/Lucide";
import { useState } from "react";
import Alerts from "@/components/Alert";
import Button from "@/components/Base/Button";
import {
  createArchiveAction,
  permanentDeleteAction,
  recoverDataAction,
} from "@/actions/archiveAction";
import { Dialog } from "@/components/Base/Headless";
import AddParameters from "@/pages/AddParameters/index";
import EditParameters from "@/pages/EditParameters/index";
import AddPrescription from "@/pages/AddPrescription/index";
import { isValidInput } from "@/helpers/validation";
import clsx from "clsx";
import {
  FormInput,
  FormLabel,
  FormSelect,
  FormCheck,
} from "@/components/Base/Form";
import {
  getInvestigationsAction,
  addInvestigationAction,
} from "@/actions/patientActions";

interface ArchiveData {
  userData: any[];
  patientData: any[];
  orgData: any[];
}

interface Investigation {
  id: number;
  test_name: string;
  category: string;
  status?: string;
  added_by?: number | null;
  organisation_id?: number | null;
  role?: string | null;
}

function Organisationspage() {
  const [selectedPick, setSelectedPick] = useState("AddParameter");

  const userRole = localStorage.getItem("role");
  const [archiveData, setArchiveData] = useState<ArchiveData>({
    userData: [],
    patientData: [],
    orgData: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [superlargeModalSizePreview, setSuperlargeModalSizePreview] =
    useState(false);
  const [investigationLoading, setInvestigationLoading] = useState(false);
  const [investigationFormData, setInvestigationFormData] = useState({
    category: "",
    test_name: "",
  });
  const [investigationFormErrors, setInvestigationFormErrors] = useState({
    category: "",
    test_name: "",
  });
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [categories, setCategories] = useState<{ category: string }[]>([]);
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);
  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);

  const handleActionAdd = (alertData: {
    variant: "success" | "danger";
    message: string;
  }) => {
    setShowAlert(alertData);
    window.scrollTo({ top: 0, behavior: "smooth" });

    setTimeout(() => {
      setShowAlert(null);
    }, 3000);
  };

  // Add this function to validate investigation form
  const validateInvestigationForm = (): boolean => {
    const errors: { category: string; test_name: string } = {
      category: "",
      test_name: "",
    };

    if (
      !investigationFormData.category ||
      investigationFormData.category === ""
    ) {
      errors.category = t("SelectOneCategory");
    }

    if (!investigationFormData.test_name) {
      errors.test_name = t("InvestigationTitle");
    } else if (!isValidInput(investigationFormData.test_name)) {
      errors.test_name = t("invalidInput");
    }

    setInvestigationFormErrors(errors);
    return !errors.category && !errors.test_name;
  };

  const handleAction = async (id: string, type: string) => {
    await permanent(id, type);
    fetcharchive();
  };
  const handleInvestigationSubmit = async () => {
    setInvestigationLoading(false);
    const isValid = validateInvestigationForm();

    if (!isValid) return;

    setInvestigationLoading(true);
    try {
      const result = await addInvestigationAction({
        category: investigationFormData.category,
        test_name: investigationFormData.test_name,
      });

      if (result) {
        // Refresh the investigations list
        const investigationData = await getInvestigationsAction();
        setInvestigations(investigationData);

        // Reset form and close modal
        setInvestigationFormData({
          category: "",
          test_name: "",
        });
        setShowCustomCategoryInput(false);
        setSuperlargeModalSizePreview(false);

        setShowAlert({
          variant: "success",
          message: t("investicationsuccess"),
        });
      }
    } catch (error) {
      setShowAlert({
        variant: "danger",
        message: t("investicationfailed"),
      });
      console.error("Error:", error);
    } finally {
      setInvestigationLoading(false);
      setTimeout(() => setShowAlert(null), 3000);
    }
  };

  const handleClick = (option: string) => {
    setSelectedPick(option);
  };

  const handleInvestigationInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setInvestigationFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setInvestigationFormErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const fetcharchive = async () => {
    try {
      const data = await createArchiveAction();
      console.log(data, "data");
      setArchiveData(data);
    } catch (error) {
      console.log("Error in fetching archive", error);
    }
  };

  useEffect(() => {
    if (
      selectedPick === "organisationslist" ||
      selectedPick === "AddOrganisations" ||
      selectedPick === "ArOrganisations"
    ) {
      fetcharchive();
    }
  }, [selectedPick]);
  console.log("archivedata", archiveData);

  // Peramanenrt delete
  const permanent = async (id: string, type: string) => {
    try {
      const dataDelete = await permanentDeleteAction(id, type);
      if (dataDelete) {
        window.scrollTo({ top: 0, behavior: "smooth" });

        setShowAlert({
          variant: "success",
          message: t("recorddeletesuccess"),
        });

        setTimeout(() => {
          setShowAlert(null);
        }, 3000);
      }
    } catch (error) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setShowAlert({
        variant: "danger",
        message: t("recorddeletefailed"),
      });

      setTimeout(() => {
        setShowAlert(null);
      }, 3000);
      console.log("error in deleting", error);
    }
  };

  const handleRecovery = async (id: string, type: string) => {
    try {
      await recoverDataAction(id, type);

      window.scrollTo({ top: 0, behavior: "smooth" });
      setShowAlert({
        variant: "success",
        message: t("recoverySuccessful"),
      });

      setTimeout(() => {
        setShowAlert(null);
      }, 3000);

      await fetcharchive();
    } catch (error) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setShowAlert({
        variant: "danger",
        message: t("recoveryFailed"),
      });

      setTimeout(() => {
        setShowAlert(null);
      }, 3000);

      console.error("Error in recovering:", error);
    }
  };

  return (
    <>
      <div className="mt-2">{showAlert && <Alerts data={showAlert} />}</div>

      <div className="flex flex-col items-center mt-8 intro-y sm:flex-row">
        <h2 className="mr-auto text-lg font-medium">{t("New Additions")}</h2>
        <Button
          className="bg-primary text-white"
          onClick={() => {
            setSuperlargeModalSizePreview(true);
          }}
        >
          {t("add_Investigation")}
        </Button>
      </div>

      <div className="grid grid-cols-11 gap-5 mt-5 intro-y">
        <div className="col-span-12 lg:col-span-4 2xl:col-span-3">
          <div className="rounded-md box">
            <div className="p-5">
              <div
                className={`flex items-center px-4 py-2 mt-1 cursor-pointer ${
                  selectedPick === "AddParameter"
                    ? "text-white rounded-lg bg-primary"
                    : ""
                }`}
                onClick={() => handleClick("AddParameter")}
              >
                <Lucide icon="PanelLeft" className="w-4 h-4 mr-2" />
                <div className="flex-1 truncate">{t("AddParameter")}</div>
              </div>

              <div
                className={`flex px-4 py-2 items-center cursor-pointer ${
                  selectedPick === "EditParameter"
                    ? "text-white rounded-lg bg-primary"
                    : ""
                }`}
                onClick={() => handleClick("EditParameter")}
              >
                <Lucide icon="Users" className="w-4 h-4 mr-2" />
                <div className="flex-1 truncate">{t("EditParameter")}</div>
              </div>

              <div
                className={`flex items-center px-4 py-2 mt-1 cursor-pointer ${
                  selectedPick === "AddPrescription"
                    ? "text-white rounded-lg bg-primary"
                    : ""
                }`}
                onClick={() => handleClick("AddPrescription")}
              >
                <Lucide icon="PanelLeft" className="w-4 h-4 mr-2" />
                <div className="flex-1 truncate">{t("AddPrescription")}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-span-12 lg:col-span-7 2xl:col-span-8">
          <div className="p-5 rounded-md box">
            <div>
              {selectedPick === "AddParameter" ? (
                <AddParameters onShowAlert={handleActionAdd} />
              ) : selectedPick === "EditParameter" ? (
                <EditParameters onShowAlert={handleActionAdd} />
              ) : selectedPick === "AddPrescription" ? (
                <AddPrescription onShowAlert={handleActionAdd} />
              ) : (
                <></>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Investigation Modal */}
      <Dialog
        size="xl"
        open={superlargeModalSizePreview}
        onClose={() => {
          setInvestigationFormData({
            category: "",
            test_name: "",
          });
          setInvestigationFormErrors({
            category: "",
            test_name: "",
          });
          setShowCustomCategoryInput(false);
          setSuperlargeModalSizePreview(false);
        }}
      >
        <Dialog.Panel className="p-10">
          <>
            <a
              onClick={(event: React.MouseEvent) => {
                event.preventDefault();
                setInvestigationFormData({
                  category: "",
                  test_name: "",
                });
                setInvestigationFormErrors({
                  category: "",
                  test_name: "",
                });
                setShowCustomCategoryInput(false);
                setSuperlargeModalSizePreview(false);
              }}
              className="absolute top-0 right-0 mt-3 mr-3"
            >
              <Lucide icon="X" className="w-6 h-6 text-slate-400" />
            </a>
            <div className="col-span-12 intro-y lg:col-span-8 box mt-3">
              <div className="flex flex-col items-center p-5 border-b sm:flex-row border-slate-200/60 dark:border-darkmode-400">
                <h2 className="mr-auto text-base font-medium">
                  {t("add_Investigation")}
                </h2>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <FormLabel
                    htmlFor="category"
                    className="font-bold videoModuleName"
                  >
                    {t("Category")}
                  </FormLabel>
                </div>

                <FormSelect
                  id="category"
                  name="category"
                  className={`w-full mb-2 form-select ${clsx({
                    "border-danger": investigationFormErrors.category,
                  })}`}
                  value={
                    showCustomCategoryInput
                      ? "other"
                      : investigationFormData.category
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "other") {
                      setShowCustomCategoryInput(true);
                      setInvestigationFormData({
                        ...investigationFormData,
                        category: "",
                      });
                    } else {
                      setShowCustomCategoryInput(false);
                      setInvestigationFormData({
                        ...investigationFormData,
                        category: value,
                      });
                    }
                    setInvestigationFormErrors((prev) => ({
                      ...prev,
                      category: "",
                    }));
                  }}
                >
                  <option value="">{t("SelectCategory")}</option>
                  {categories.map((item, index) => (
                    <option key={index} value={item.category}>
                      {item.category}
                    </option>
                  ))}
                  <option value="other">{t("Other")}</option>
                </FormSelect>
                {/* Show this input only when "Other" is selected */}
                {showCustomCategoryInput && (
                  <FormInput
                    type="text"
                    name="category"
                    placeholder={t("EnterCategory")}
                    className={`w-full mb-2 ${clsx({
                      "border-danger": investigationFormErrors.category,
                    })}`}
                    value={investigationFormData.category}
                    onChange={handleInvestigationInputChange}
                  />
                )}

                {investigationFormErrors.category && (
                  <p className="text-red-500 text-sm">
                    {investigationFormErrors.category}
                  </p>
                )}

                <div className="flex items-center justify-between mt-5">
                  <FormLabel
                    htmlFor="crud-form-2"
                    className="font-bold videoModuleName"
                  >
                    {t("Investigation_title")}
                  </FormLabel>
                </div>
                <FormInput
                  id="crud-form-2"
                  className={`w-full mb-2 ${clsx({
                    "border-danger": investigationFormErrors.test_name,
                  })}`}
                  name="test_name"
                  placeholder={t("Entertitle")}
                  value={investigationFormData.test_name}
                  onChange={handleInvestigationInputChange}
                />
                {investigationFormErrors.test_name && (
                  <p className="text-red-500 text-sm">
                    {investigationFormErrors.test_name}
                  </p>
                )}

                <div className="mt-5 text-right">
                  <Button
                    type="button"
                    variant="primary"
                    className="w-24"
                    onClick={handleInvestigationSubmit}
                    disabled={investigationLoading}
                  >
                    {investigationLoading ? (
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
          </>
        </Dialog.Panel>
      </Dialog>
    </>
  );
}
export default Organisationspage;
