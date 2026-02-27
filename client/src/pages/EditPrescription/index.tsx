import React from "react";
import {
  FormInput,
  FormSelect,
  FormLabel,
  FormCheck,
} from "@/components/Base/Form";
import Lucide from "@/components/Base/Lucide";
import clsx from "clsx";
import { t } from "i18next";
import { Dialog, Menu } from "@/components/Base/Headless";
import Button from "@/components/Base/Button";
import { useState, useRef, useEffect, ChangeEvent } from "react";
import { isValidInput } from "@/helpers/validation";
import { useUploads } from "@/components/UploadContext";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  updateMedicationAction,
  deleteMedicationAction,
  getAllMedicationsAction,
} from "@/actions/patientActions";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { fetchSettings, selectSettings } from "@/stores/settingsSlice";
import Table from "@/components/Base/Table";
import Pagination from "@/components/Base/Pagination";
import { number } from "yup";
import { getUserOrgIdAction } from "@/actions/userActions";

interface Component {
  onShowAlert: (alert: {
    variant: "success" | "danger";
    message: string;
  }) => void;
}

type Medications = {
  id: number;
  medication: string;
  dose: string;
  DrugGroup: string;
  DrugSubGroup: string;
  TypeofDrug: string;
};

const Main: React.FC<Component> = ({ onShowAlert }) => {
  const { addTask, updateTask } = useUploads();

  const [formData, setFormData] = useState<{
    id: string;
    DrugGroup: string;
    DrugSubGroup: string;
    TypeofDrug: string;
    medication: string;
    doses: string;
  }>({
    id: "",
    DrugGroup: "",
    DrugSubGroup: "",
    TypeofDrug: "",
    medication: "",
    doses: "",
  });

  interface FormErrors {
    DrugGroup: string;
    DrugSubGroup: string;
    TypeofDrug: string;
    medication: string;
    doses: string;
  }

  const [formErrors, setFormErrors] = useState<FormErrors>({
    DrugGroup: "",
    DrugSubGroup: "",
    TypeofDrug: "",
    medication: "",
    doses: "",
  });
  const [loading1, setLoading1] = useState(false);
  const [loading, setLoading] = useState(false);
  const [medications, setMedications] = useState<Medications[]>([]);
  const [currentMedications, setCurrentMedications] = useState<Medications[]>(
    []
  );
  const [filteredMedications, setFilteredMedications] = useState<Medications[]>(
    []
  );
  const [superlargeModalSizePreview, setSuperlargeModalSizePreview] =
    useState(false);
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [selectedMedications, setSelectedMedications] = useState<Set<number>>(
    new Set()
  );
  const [medicationFormData, setMedicationFormData] = useState({
    medication: "",
    doses: "",
    DrugGroup: "",
    DrugSubGroup: "",
    TypeofDrug: "",
  });
  const [medicationFormErrors, setMedicationFormErrors] = useState({
    medication: "",
    doses: "",
    DrugGroup: "",
    DrugSubGroup: "",
    TypeofDrug: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirmationModal, setDeleteConfirmationModal] = useState(false);
  const [medId, setMedId] = useState<number | null>(null);
  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const propertiesToSearch = ["name"];

  useEffect(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;

    if (Array.isArray(medications) && medications.length !== 0) {
      const propertiesToSearch = ["medication"]; // nothing else

      const filtered = medications.filter((m) =>
        propertiesToSearch.some((prop) => {
          const val = m[prop as keyof typeof m];
          return (
            typeof val === "string" &&
            val.toLowerCase().includes(searchQuery.toLowerCase())
          );
        })
      );
      console.log(
        "currentMedications",
        filtered,
        Array.isArray(currentMedications)
      );
      setFilteredMedications(filtered);
      setTotalPages(Math.ceil(filtered.length / itemsPerPage));
      setCurrentMedications(filtered.slice(indexOfFirstItem, indexOfLastItem));
    }
  }, [currentPage, itemsPerPage, searchQuery, medications]);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  };

  const handleEdit = (med: Medications) => {
    console.log(med, "medmed");
    setFormData({
      id: String(med.id),
      medication: med.medication,
      doses: med.dose,
      DrugGroup: med.DrugGroup,
      DrugSubGroup: med.DrugSubGroup,
      TypeofDrug: med.TypeofDrug,
    });

    setFormErrors({
      medication: "",
      doses: "",
      DrugGroup: "",
      DrugSubGroup: "",
      TypeofDrug: "",
    }); // clear errors
    setSuperlargeModalSizePreview(true);
  };

  const handleMedicationInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setMedicationFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setMedicationFormErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  useEffect(() => {
    dispatch(fetchSettings());
    fetchMedications();
  }, [dispatch]);

  const { data } = useAppSelector(selectSettings);

  const handleKeyDown = (e: any) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  };

  const fetchMedications = async () => {
    try {
      setLoading(true);
      const allMedications = await getAllMedicationsAction();

      setMedications(allMedications);
      setLoading(false);

      return data;
    } catch (error) {
      setLoading(false);
      setShowAlert({
        variant: "danger",
        message: t("patientFetchError"),
      });
      return [];
    }
  };

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSelected = e.target.checked
      ? new Set<number>(medications.map((p) => p.id))
      : new Set<number>();
    setSelectedMedications(newSelected);
    setSelectAllChecked(e.target.checked);
  };

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
    setTotalPages(Math.ceil(medications.length / newItemsPerPage));
    setCurrentPage(1);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const validateOrgName = (medication: string) => {
    if (!medication) return t("MedicationValidation");
    // if (medication.length < 4) return t("MedicationValidation2");
    if (medication.length > 150) return t("MedicationValidationMaxLength");
    if (!isValidInput(medication)) return t("invalidInput");
    return "";
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: files ? files[0] : value,
    }));

    setFormErrors((prevErrors) => {
      const newErrors = { ...prevErrors };

      if (name === "medication") {
        newErrors.medication = validateOrgName(value);
      }

      return newErrors;
    });
  };

  // const removeDose = (index: number) => {
  //   if (formData.doses.length > 1) {
  //     const newDoses = [...formData.doses];
  //     newDoses.splice(index, 1);
  //     setFormData((prev) => ({ ...prev, doses: newDoses }));
  //   }
  // };

  const validateForm = (): FormErrors => {
    // Validate each dose individually
    // const doseErrors = formData.doses
    //   .map((dose: string) => validateOrgName(dose))
    //   .filter((error: any) => error);

    const errors: FormErrors = {
      medication: validateOrgName(formData.medication.trim()),
      DrugGroup: !isValidInput(formData.DrugGroup.trim())
        ? t("DrugGroupValidation")
        : "",
      DrugSubGroup: "",
      TypeofDrug: !isValidInput(formData.TypeofDrug.trim())
        ? t("TypeofDrugValidation")
        : "",
      doses: !isValidInput(formData.doses.trim()) ? t("DoseValidation") : "",
    };
    return errors;
  };

  const delMedication = async () => {
    if (!medId) return;

    const username = localStorage.getItem("user");
    const data1 = await getUserOrgIdAction(username || "");

    try {
      const res = await deleteMedicationAction(medId.toString(), data1.id);

      setDeleteConfirmationModal(false);
      onShowAlert({
        variant: "success",
        message: "Medications deleted successfully",
      });
      fetchMedications();
    } catch (error) {
      onShowAlert({
        variant: "danger",
        message: "Error in deleting Medications",
      });
    } finally {
      setTimeout(() => setShowAlert(null), 3000);
    }
  };

  const handleSubmit = async (id: number) => {
    setLoading(false);
    setShowAlert(null);

    const errors = validateForm();
    setFormErrors(errors);

    if (Object.values(errors).some((error) => error)) return;

    try {
      setLoading(true);
      const userEmail = localStorage.getItem("email");
      const username = localStorage.getItem("user");
      const data1 = await getUserOrgIdAction(username || "");
      const formDataObj = new FormData();
      formDataObj.append("medication", formData.medication);
      formDataObj.append("dose", formData.doses);
      formDataObj.append("DrugGroup", formData.DrugGroup);
      formDataObj.append("DrugSubGroup", formData.DrugSubGroup);
      formDataObj.append("TypeofDrug", formData.TypeofDrug);
      formDataObj.append("id", formData.id);
      formDataObj.append("performerId", data1.id);

      const createOrg = await updateMedicationAction(formDataObj);

      setFormData({
        id: "",
        medication: "",
        doses: "",
        DrugGroup: "",
        DrugSubGroup: "",
        TypeofDrug: "",
      });
      fetchMedications();
      setSuperlargeModalSizePreview(false);
      onShowAlert({
        variant: "success",
        message: t("UpdateMedicationSuccess"),
      });
    } catch (error: any) {
      onShowAlert({
        variant: "danger",
        message: t("UpdateMedicationfailed"),
      });

      console.error("Error in adding medication:", error);
      setShowAlert({
        variant: "danger",
        message: error.response.data.message,
      });
      setFormData({
        id: "",
        medication: "",
        doses: "",
        DrugGroup: "",
        DrugSubGroup: "",
        TypeofDrug: "",
      });

      setTimeout(() => {
        setShowAlert(null);
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="intro-y">
        {/* Search input aligned to right */}
        <div className="relative w-full sm:w-64 ml-auto">
          <FormInput
            type="text"
            className="w-full pr-10 !box"
            placeholder={t("Search")}
            value={searchQuery}
            onChange={handleSearchChange}
          />
          <Lucide
            icon="Search"
            className="absolute inset-y-0 right-0 w-4 h-4 my-auto mr-3"
          />
        </div>
        <div className="col-span-12 overflow-auto intro-y lg:overflow-auto">
          <Table className="border-spacing-y-[10px] border-separate mt-5">
            <Table.Thead>
              <Table.Tr>
                {/* <Table.Th className="border-b-0 whitespace-nowrap">
                  <FormCheck.Input
                    type="checkbox"
                    className="mr-2 border"
                    checked={selectAllChecked}
                    onChange={handleSelectAll}
                  />
                </Table.Th> */}
                <Table.Th className="text-center border-b-0 whitespace-nowrap">
                  #
                </Table.Th>
                <Table.Th className="text-center border-b-0 whitespace-nowrap">
                  {t("medication")}
                </Table.Th>

                <Table.Th className="text-center border-b-0 whitespace-nowrap">
                  {t("action")}
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {loading ? (
                <Table.Tr>
                  <Table.Td colSpan={9} className="text-center">
                    {t("loading")}...
                  </Table.Td>
                </Table.Tr>
              ) : currentMedications.length == 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={9} className="text-center">
                    {t("no_medications_found")}
                  </Table.Td>
                </Table.Tr>
              ) : (
                currentMedications.map((medication, index) => (
                  <Table.Tr key={medication.id} className="intro-x">
                    {/* <Table.Td className="w-10 box rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                      <FormCheck.Input
                        id="remember-me"
                        type="checkbox"
                        className="mr-2 border"
                        checked={selectAllChecked}
                        onChange={handleSelectAll}
                      />
                    </Table.Td> */}

                    <Table.Td className="text-center box rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                      {indexOfFirstItem + index + 1}
                    </Table.Td>
                    <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                      {medication.medication}
                    </Table.Td>
                    <Table.Td
                      className={clsx([
                        "box w-56 rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600",
                        "before:absolute before:inset-y-0 before:left-0 before:my-auto before:block before:h-8 before:w-px before:bg-slate-200 before:dark:bg-darkmode-400",
                      ])}
                    >
                      <div className="flex items-center justify-center">
                        <div
                          onClick={() => {
                            handleEdit(medication);
                          }}
                          className={`flex items-center mr-3 cursor-pointer`}
                        >
                          <Lucide icon="Pen" className="w-4 h-4 mr-1" />
                          {t("edit")}
                        </div>
                        <div
                          onClick={() => {
                            setMedId(medication.id);
                            setDeleteConfirmationModal(true);
                          }}
                          className={`flex items-center mr-3 cursor-pointer text-danger`}
                        >
                          <Lucide
                            icon="Trash2"
                            className="w-4 h-4 mr-1 text-danger"
                          />
                          {t("delete")}
                        </div>
                      </div>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </div>

        {/* Pagination */}
        {filteredMedications.length > 0 && (
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

                {/* Last Page Button */}
                <Pagination.Link
                  onPageChange={() => handlePageChange(totalPages)}
                >
                  <Lucide icon="ChevronsRight" className="w-4 h-4" />
                </Pagination.Link>
              </Pagination>
            </div>

            <div className="hidden mx-auto md:block text-slate-500">
              {!loading1 ? (
                filteredMedications && filteredMedications.length > 0 ? (
                  <>
                    {t("showing")} {indexOfFirstItem + 1} {t("to")}{" "}
                    {Math.min(indexOfLastItem, filteredMedications.length)}{" "}
                    {t("of")} {filteredMedications.length} {t("entries")}
                  </>
                ) : (
                  t("noMatchingRecords")
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
        )}
      </div>

      <Dialog
        size="xl"
        open={superlargeModalSizePreview}
        onClose={() => {
          setMedicationFormData({
            medication: "",
            doses: "",
            DrugGroup: "",
            DrugSubGroup: "",
            TypeofDrug: "",
          });
          setMedicationFormErrors({
            medication: "",
            doses: "",
            DrugGroup: "",
            DrugSubGroup: "",
            TypeofDrug: "",
          });
          setSuperlargeModalSizePreview(false);
        }}
      >
        <Dialog.Panel className="p-10">
          <>
            <a
              onClick={(event: React.MouseEvent) => {
                event.preventDefault();
                setMedicationFormData({
                  medication: "",
                  doses: "",
                  DrugGroup: "",
                  DrugSubGroup: "",
                  TypeofDrug: "",
                });
                setMedicationFormErrors({
                  medication: "",
                  doses: "",
                  DrugGroup: "",
                  DrugSubGroup: "",
                  TypeofDrug: "",
                });
                setSuperlargeModalSizePreview(false);
              }}
              className="absolute top-0 right-0 mt-3 mr-3"
            >
              <Lucide icon="X" className="w-6 h-6 text-slate-400" />
            </a>
            <div className="col-span-12 intro-y lg:col-span-8 box mt-3">
              <div className="text-left p-2">
                <div className="flex items-center justify-between">
                  <FormLabel htmlFor="org-form-1" className="font-bold">
                    {t("DrugGroup")}
                  </FormLabel>
                  <span className="text-xs text-gray-500 font-bold ml-2">
                    {t("required")}
                  </span>
                </div>

                <FormInput
                  id="org-form-1"
                  type="text"
                  className={`w-full mb-2 ${clsx({
                    "border-danger": formErrors.DrugGroup,
                  })}`}
                  name="DrugGroup"
                  placeholder={t("enterDrugGroup")}
                  value={formData.DrugGroup}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                />
                {formErrors.DrugGroup && (
                  <p className="text-red-500 text-left text-sm">
                    {formErrors.DrugGroup}
                  </p>
                )}

                <div className="flex items-center justify-between mt-3">
                  <FormLabel htmlFor="org-form-1" className="font-bold">
                    {t("DrugSubGroup")}
                  </FormLabel>
                  {/* <span className="text-xs text-gray-500 font-bold ml-2">
                              {t("required")}
                            </span> */}
                </div>

                <FormInput
                  id="org-form-1"
                  type="text"
                  className={`w-full mb-2 ${clsx({
                    // "border-danger": formErrors.DrugSubGroup,
                  })}`}
                  name="DrugSubGroup"
                  placeholder={t("enterDrugSubGroup")}
                  value={formData.DrugSubGroup}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                />
                {/* {formErrors.DrugSubGroup && (
                            <p className="text-red-500 text-left text-sm">
                              {formErrors.DrugSubGroup}
                            </p>
                          )} */}

                <div className="flex items-center justify-between mt-3">
                  <FormLabel htmlFor="org-form-1" className="font-bold">
                    {t("TypeofDrug")}
                  </FormLabel>
                  <span className="text-xs text-gray-500 font-bold ml-2">
                    {t("required")}
                  </span>
                </div>

                <FormInput
                  id="org-form-1"
                  type="text"
                  className={`w-full mb-2 ${clsx({
                    "border-danger": formErrors.TypeofDrug,
                  })}`}
                  name="TypeofDrug"
                  placeholder={t("enterTypeofDrug")}
                  value={formData.TypeofDrug}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                />
                {formErrors.TypeofDrug && (
                  <p className="text-red-500 text-left text-sm">
                    {formErrors.TypeofDrug}
                  </p>
                )}

                <div className="flex items-center justify-between mt-3">
                  <FormLabel htmlFor="org-form-1" className="font-bold">
                    {t("medication")}
                  </FormLabel>
                  <span className="text-xs text-gray-500 font-bold ml-2">
                    {t("required")}
                  </span>
                </div>

                <FormInput
                  id="org-form-1"
                  type="text"
                  className={`w-full mb-2 ${clsx({
                    "border-danger": formErrors.medication,
                  })}`}
                  name="medication"
                  placeholder={t("enterMedication")}
                  value={formData.medication}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                />
                {formErrors.medication && (
                  <p className="text-red-500 text-left text-sm">
                    {formErrors.medication}
                  </p>
                )}

                <div className="flex items-center justify-between mt-3">
                  <FormLabel htmlFor="org-form-1" className="font-bold">
                    {t("dose")}
                  </FormLabel>
                  <span className="text-xs text-gray-500 font-bold ml-2">
                    {t("required")}
                  </span>
                </div>

                <FormInput
                  id="org-form-1"
                  type="text"
                  className={`w-full mb-2 ${clsx({
                    "border-danger": formErrors.doses,
                  })}`}
                  name="doses"
                  placeholder={t("enterDose")}
                  value={formData.doses}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                />
                {/* show error below if any */}
                {formErrors.doses && (
                  <p className="text-red-500 text-left text-sm">
                    {formErrors.doses}
                  </p>
                )}

                <div className="mt-5 text-right">
                  <Button
                    type="button"
                    variant="primary"
                    className="w-24"
                    onClick={() => handleSubmit(Number(formData.id))}
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="loader">
                        <div className="dot"></div>
                        <div className="dot"></div>
                        <div className="dot"></div>
                      </div>
                    ) : (
                      t("update")
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </>
        </Dialog.Panel>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={deleteConfirmationModal}
        onClose={() => {
          setDeleteConfirmationModal(false);
          setMedId(null);
        }}
      >
        <Dialog.Panel>
          <div className="p-5 text-center">
            <Lucide
              icon="Trash2"
              className="w-16 h-16 mx-auto mt-3 text-danger"
            />
            <div className="mt-5 text-3xl">{t("Sure")}</div>
            <div className="mt-2 text-slate-500">{t("ReallyDel")}</div>
          </div>
          <div className="px-5 pb-8 text-center">
            <Button
              variant="outline-secondary"
              type="button"
              className="w-24 mr-4"
              onClick={() => {
                setDeleteConfirmationModal(false);
                setMedId(null);
              }}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="danger"
              type="button"
              className="w-24"
              onClick={() => delMedication()}
            >
              {t("delete")}
            </Button>
          </div>
        </Dialog.Panel>
      </Dialog>
    </>
  );
};

export default Main;
