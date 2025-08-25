import React, { useState, useEffect, useRef, ChangeEvent } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import Button from "@/components/Base/Button";
import { FormInput, FormCheck, FormSelect } from "@/components/Base/Form";
import Lucide from "@/components/Base/Lucide";
import { Dialog } from "@/components/Base/Headless";
import Table from "@/components/Base/Table";
import Pagination from "@/components/Base/Pagination";
import {
  deletePatientAction,
  getAllPatientsAction,
} from "@/actions/patientActions";
import Alerts from "@/components/Alert";
import { t } from "i18next";
import Alert from "@/components/Base/Alert";
import { clsx } from "clsx";
import {
  getAdminOrgAction,
  getAllOrganisationsAction,
  addSharedOrgAction,
} from "@/actions/adminActions";
import { Preview } from "@/components/Base/PreviewComponent";
import TomSelect from "@/components/Base/TomSelect";
import AIGenerateModal from "@/components/AiPatientGenrate/AIGenerateModal";
import SubscriptionModal from "@/components/SubscriptionModal.tsx";

interface Patient {
  id: number;
  name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  address: string;
  category: string;
  organisation_id: string;
  created_at: string;
  updated_at: string;
  status: string;
}

type organisation = {
  id: number;
  name: string;
};

type SelectedMultipleValues = string[];
interface Component {
  onShowAlert: (message: string, variant: "success" | "danger") => void;
  onPatientCountChange?: (count: number) => void;
}

const PatientList: React.FC<Component> = ({
  onShowAlert,
  onPatientCountChange,
}) => {
  localStorage.removeItem("selectedPick");
  const useremail = localStorage.getItem("user");
  const userrole = localStorage.getItem("role");
  const navigate = useNavigate();
  const deleteButtonRef = useRef(null);
  const location = useLocation();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [currentPatients, setCurrentPatients] = useState<Patient[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [orgID, setorgId] = useState("");
  const [selectedPatients, setSelectedPatients] = useState<Set<number>>(
    new Set()
  );
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [deleteConfirmationModal, setDeleteConfirmationModal] = useState(false);
  const [changeOrganisationModal, setChangeOrganisationModal] = useState(false);
  const [patientIdToDelete, setPatientIdToDelete] = useState<number | null>(
    null
  );
  const [selectMultipleDevice, setSelectMultipleDevice] =
    useState<SelectedMultipleValues>([]);
  const [loading, setLoading] = useState(true);
  const [loading1, setLoading1] = useState(false);
  const [loading3, setLoading3] = useState(false);
  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const [Organisations, setAllOrganisation] = useState<organisation[]>([]);
  const [showAIGenerateModal, setShowAIGenerateModal] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState("Free");
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const canModifyPatient = (patient: any, orgObj: any) => {
    const orgIdStr = String(orgObj.orgid);
    const mainOrgMatch = Number(patient) === Number(orgIdStr);
    return mainOrgMatch;
  };
  const [userRole, setUserRole] = useState("");

  const handleActionAdd = (
    newMessage: string,
    variant: "success" | "danger" = "success"
  ) => {
    fetchPatients();
    onShowAlert(newMessage, variant);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const fetchPatients = async () => {
    try {
      setLoading(true);

      const org = await getAdminOrgAction(String(useremail));
      setUserRole(org.role);
      setorgId(org);
      setSubscriptionPlan(org.planType || "Free");
      const allPatients = await getAllPatientsAction();
      let data: any[] = [];

      const orgId = String(org.orgid);

      if (userrole === "Superadmin") {
        data = allPatients;
      } else {
        data = allPatients.filter((patient: any) => {
          const mainOrgMatch = String(patient.organisation_id) === orgId;
          let additionalOrgsMatch = false;

          if (onPatientCountChange) {
            onPatientCountChange(data.length);
          }

          try {
            const additionalOrgs = Array.isArray(patient.additional_orgs)
              ? patient.additional_orgs
              : JSON.parse(patient.additional_orgs || "[]");

            additionalOrgsMatch = additionalOrgs.includes(orgId);
          } catch (e) {}

          return mainOrgMatch || additionalOrgsMatch;
        });
      }
      if (data.length > 10 && userrole === "Admin") {
        data = data.slice(0, 10);
      }
      setPatients(data);
      setFilteredPatients(data);
      setTotalPages(Math.ceil(data.length / itemsPerPage));
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

  useEffect(() => {
    fetchPatients();

    const alertMessage = location.state?.alertMessage || "";
    if (alertMessage) {
      setShowAlert({
        variant: "success",
        message: alertMessage,
      });
      window.history.replaceState(
        { ...location.state, alertMessage: null },
        document.title
      );
      setTimeout(() => setShowAlert(null), 3000);
    }
  }, [location.state]);

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
    setTotalPages(Math.ceil(patients.length / newItemsPerPage));
    setCurrentPage(1);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  };

  const propertiesToSearch = [
    "name",
    "email",
    "phone",
    "gender",
    "date_of_birth",
    "category",
  ];

  useEffect(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;

    if (Array.isArray(patients) && patients.length !== 0) {
      const filtered = patients.filter((patient) => {
        return propertiesToSearch.some((langData) =>
          propertiesToSearch.some((prop) =>
            patient[prop as keyof Patient]
              ?.toString()
              .toLowerCase()
              .includes(searchQuery.toLowerCase())
          )
        );
      });

      setFilteredPatients(filtered);
      setTotalPages(Math.ceil(filtered.length / itemsPerPage));
      setCurrentPatients(filtered.slice(indexOfFirstItem, indexOfLastItem));
    }
  }, [currentPage, itemsPerPage, searchQuery, patients]);

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSelected = e.target.checked
      ? new Set<number>(patients.map((p) => p.id))
      : new Set<number>();
    setSelectedPatients(newSelected);
    setSelectAllChecked(e.target.checked);
  };

  const handleRowSelect = (id: number) => {
    const newSelected = new Set(selectedPatients);
    newSelected.has(id) ? newSelected.delete(id) : newSelected.add(id);
    setSelectedPatients(newSelected);
    setSelectAllChecked(newSelected.size === currentPatients.length);
  };

  // Delete handlers
  const handleDeleteClick = (id: number) => {
    setPatientIdToDelete(id);
    setDeleteConfirmationModal(true);
  };

  const handleDeleteSelected = () => {
    if (selectedPatients.size > 0) {
      setDeleteConfirmationModal(true);
    }
  };

  const handleChangeOrganisation = (selectedIds: number[]) => {
    if (selectedPatients.size > 0) {
      setChangeOrganisationModal(true);
    }
  };

  const handleDeleteConfirm = async () => {
    setArchiveLoading(true);
    try {
      if (patientIdToDelete) {
        await deletePatientAction(patientIdToDelete);
      } else if (selectedPatients.size > 0) {
        await Promise.all(
          [...selectedPatients].map((id) => deletePatientAction(id))
        );
      }

      const data = await fetchPatients();
      setSelectedPatients(new Set());
      setTotalPages(Math.ceil(data.length / itemsPerPage));
      window.scrollTo({ top: 0, behavior: "smooth" });
      onShowAlert(t("archivepatientsuccess"), "success");
    } catch (error) {
      onShowAlert(t("archivepatientfailed"), "danger");
      console.error("Delete error:", error);
    } finally {
      setArchiveLoading(false);
    }
    setDeleteConfirmationModal(false);
    setPatientIdToDelete(null);
  };

  const formatDate = (dateString: string) => {
    return dateString ? new Date(dateString).toLocaleDateString() : "N/A";
  };

  const handleAddOrganisations = async () => {
    setLoading3(false);

    const patientIds = Array.from(selectedPatients);
    const orgIds = Array.from(selectMultipleDevice);

    if (orgIds.length > 0 && patientIds.length > 0) {
      try {
        setLoading3(true);
        const formDataToSend = new FormData();
        formDataToSend.append("organisation_ids", JSON.stringify(orgIds));
        formDataToSend.append("patient_ids", JSON.stringify(patientIds));

        const result = await addSharedOrgAction(formDataToSend);

        if (result) {
          await fetchOrganisations();
          setChangeOrganisationModal(false);
          // setShowAlert({
          //   variant: "success",
          //   message: t("content_compatible"),
          // });
          onShowAlert(t("successpatientshared"), "success");

          setTimeout(() => {
            setShowAlert(null);
          }, 3000);

          setSelectMultipleDevice([]);
          setSelectedPatients(new Set());
        }
      } catch (error) {
        setLoading3(false);
        setChangeOrganisationModal(false);

        console.error("Error adding compatible devices:", error);

        onShowAlert(t("failedTosharepatient"), "danger");

        setTimeout(() => {
          setShowAlert(null);
        }, 3000);
      } finally {
        setLoading3(false);
      }
    } else {
      setShowAlert({
        variant: "danger",
        message: t("pleaseSelectPatientsAndOrganisations"),
      });
      onShowAlert(t("pleaseSelectPatientsAndOrganisations"), "danger");

      setTimeout(() => {
        setShowAlert(null);
      }, 3000);
    }
  };

  const fetchOrganisations = async () => {
    try {
      const data = await getAllOrganisationsAction();
      console.log(data, "datadatadata");
      setAllOrganisation(data);
    } catch (error) {
      console.error("Error fetching devices:", error);
      setShowAlert({
        variant: "danger",
        message: t("failedToFetchDevices"),
      });
      setTimeout(() => setShowAlert(null), 3000);
    }
  };

  const closeUpsellModal = () => {
    setShowUpsellModal(false);
  };

  const upgradePrompt = (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 text-center border border-blue-100 my-6">
      <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
        <Lucide icon="Lock" className="w-8 h-8 text-blue-600" />
      </div>
      <h3 className="text-xl font-bold text-blue-900 mb-3">
        {t("PatientRecordsLimited")}
      </h3>
      <p className="text-blue-700 mb-6">{t("Yourfreeplan")}</p>
      <div className="flex justify-center gap-4">
        <Button
          onClick={() => setShowUpsellModal(true)}
          variant="primary"
          className="px-6"
        >
          {t("ViewPlans")}
        </Button>
        <Button
          onClick={() => (window.location.href = "/pricing")}
          variant="outline-primary"
          className="px-6 border-blue-200 text-blue-700"
        >
          {t("CompareFeatures")}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Alert messages */}
      <SubscriptionModal
        isOpen={showUpsellModal}
        onClose={closeUpsellModal}
        currentPlan={subscriptionPlan}
      />

      {/* Add the upgrade prompt for free users */}
      {subscriptionPlan === "Free" &&
        patients.length >= 10 &&
        userrole == "Admin" &&
        upgradePrompt}

      {deleteSuccess && (
        <Alert variant="soft-success" className="flex items-center mb-2">
          <Lucide icon="CheckSquare" className="w-6 h-6 mr-2" />
          {t("patientArchiveSuccess")}
        </Alert>
      )}
      {deleteError && (
        <Alert variant="soft-danger" className="flex items-center mb-2">
          <Lucide icon="AlertTriangle" className="w-6 h-6 mr-2" />
          {t("patientArchiveError")}
        </Alert>
      )}

      {/* <div className="flex  items-center h-10 intro-y">
        <h2 className="mr-5 text-lg font-medium truncate">
          {t("patient_list")}
        </h2>
        <a
          className="flex items-center ml-auto text-primary cursor-pointer dark:text-white"
          onClick={(e) => {
            window.location.reload();
          }}
        >
          <Lucide icon="RefreshCcw" className="w-5 h-5 mr-3" />
        </a>
      </div> */}

      <div className="grid grid-cols-12 gap-6 mt-5">
        <div className="flex flex-wrap items-center col-span-12 mt-2 intro-y sm:flex-nowrap">
          {userRole !== "Observer" && (
            <>
              <Button
                variant="primary"
                disabled={selectedPatients.size === 0}
                onClick={(e) => {
                  e.preventDefault();
                  const selectedIds = Array.from(selectedPatients);

                  if (selectedIds.length === 0) {
                    alert(t("Pleaseselectleastpatient"));
                    return;
                  }

                  fetchOrganisations();
                  handleChangeOrganisation(selectedIds);
                }}
                className="shadow-md mr-2 mb-2"
              >
                <Lucide icon="Share2" className="w-4 h-4 mr-2" />
                {t("SharePatients")}
              </Button>

              <Button
                variant="primary"
                disabled={selectedPatients.size === 0}
                onClick={handleDeleteSelected}
                className="shadow-md mr-2 mb-2"
              >
                <Lucide icon="Trash2" className="w-4 h-4 mr-2" />
                {t("archivePatients")}
              </Button>

              {/*Start: Patient genrate with Ai */}
              <Button
                variant="primary"
                onClick={() => {
                  if (patients.length >= 10 && userrole == "Admin") {
                    setShowUpsellModal(true);
                  } else {
                    setShowAIGenerateModal(true);
                  }
                }}
                className="shadow-md mr-2 mb-2 "
              >
                <Lucide
                  icon="Sparkles"
                  className="w-4 h-4 mr-2 text-yellow-400 "
                />
                {t("ai_with_patient")}
              </Button>

              <AIGenerateModal
                onShowAlert={handleActionAdd}
                open={showAIGenerateModal}
                onClose={() => setShowAIGenerateModal(false)}
              />

              {/*End: Patient genrate with Ai */}
            </>
          )}
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
        </div>
      </div>

      {/* Patient table */}
      <div className="col-span-12 overflow-auto intro-y lg:overflow-auto">
        <Table className="border-spacing-y-[10px] border-separate mt-5">
          <Table.Thead>
            <Table.Tr>
              {/* condition for hide Action button Observer role  */}
              {userRole !== "Observer" && (
                <Table.Th className="border-b-0 whitespace-nowrap">
                  <FormCheck.Input
                    type="checkbox"
                    className="mr-2 border"
                    checked={selectAllChecked}
                    onChange={handleSelectAll}
                  />
                </Table.Th>
              )}

              <Table.Th className="border-b-0 whitespace-nowrap">#</Table.Th>
              <Table.Th className="text-center border-b-0 whitespace-nowrap">
                {t("vr_name")}
              </Table.Th>
              <Table.Th className="text-center border-b-0 whitespace-nowrap">
                {t("user_email")}
              </Table.Th>
              <Table.Th className="text-center border-b-0 whitespace-nowrap">
                {t("phone1")}
              </Table.Th>
              <Table.Th className="text-center border-b-0 whitespace-nowrap">
                {t("gender1")}
              </Table.Th>
              <Table.Th className="text-center border-b-0 whitespace-nowrap">
                {t("dob1")}
              </Table.Th>
              <Table.Th className="text-center border-b-0 whitespace-nowrap">
                {t("category1")}
              </Table.Th>
              <Table.Th className="text-center border-b-0 whitespace-nowrap">
                {t("status")}
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
            ) : currentPatients.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={9} className="text-center">
                  {t("no_patient_found")}
                </Table.Td>
              </Table.Tr>
            ) : (
              currentPatients.map((patient, index) => (
                <Table.Tr key={patient.id} className="intro-x">
                  {/* condition for hide Action button Observer role  */}
                  {userRole !== "Observer" && (
                    <Table.Td className="w-10 box rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                      <FormCheck.Input
                        type="checkbox"
                        className="mr-2 border"
                        checked={selectedPatients.has(patient.id)}
                        onChange={() => {
                          setSelectedPatients((prev) => {
                            const newSet = new Set(prev);
                            if (newSet.has(patient.id)) {
                              newSet.delete(patient.id);
                            } else {
                              newSet.add(patient.id);
                            }
                            return newSet;
                          });
                        }}
                      />
                    </Table.Td>
                  )}

                  <Table.Td className="box rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    {indexOfFirstItem + index + 1}
                  </Table.Td>
                  <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    {patient.name}
                  </Table.Td>
                  <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    {patient.email}
                  </Table.Td>
                  <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    {patient.phone}
                  </Table.Td>
                  <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    {patient.gender}
                  </Table.Td>
                  <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    {formatDate(patient.date_of_birth)}
                  </Table.Td>
                  <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    {patient.category}
                  </Table.Td>
                  <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                    {patient.status == "draft" ? t("draft") : t("complete")}
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
                          if (patient.status !== "draft") {
                            navigate(`/patients-view/${patient.id}`);
                            localStorage.setItem("from", "patients");
                          }
                        }}
                        className={`flex items-center mr-3 ${
                          patient.status === "draft"
                            ? "opacity-50 cursor-not-allowed"
                            : "cursor-pointer"
                        }`}
                      >
                        <Lucide icon="Eye" className="w-4 h-4 mr-1" />
                        {t("view")}
                      </div>

                      {/* condition for hide Action button Observer role  */}
                      {userRole !== "Observer" && (
                        <>
                          {userRole === "Superadmin" ||
                          canModifyPatient(patient.organisation_id, orgID) ? (
                            <>
                              <div
                                onClick={() => {
                                  navigate(`/patient-edit/${patient.id}`),
                                    localStorage.setItem("from", "patients");
                                }}
                                className="flex items-center mr-3 cursor-pointer"
                              >
                                <Lucide
                                  icon="CheckSquare"
                                  className="w-4 h-4 mr-1"
                                />
                                {t("edit")}
                              </div>

                              <a
                                className="flex items-center text-danger cursor-pointer"
                                onClick={(event) => {
                                  event.preventDefault();
                                  handleDeleteClick(patient.id);
                                  setDeleteConfirmationModal(true);
                                }}
                              >
                                <Lucide
                                  icon="Archive"
                                  className="w-4 h-4 mr-1"
                                />
                                {t("Archive")}
                              </a>
                            </>
                          ) : (
                            <>
                              <span className="flex items-center mr-3 text-gray-400 cursor-not-allowed">
                                <Lucide
                                  icon="CheckSquare"
                                  className="w-4 h-4 mr-1"
                                />
                                {t("edit")}
                              </span>

                              <span className="flex items-center mr-3 text-gray-400 cursor-not-allowed">
                                <Lucide
                                  icon="Archive"
                                  className="w-4 h-4 mr-1"
                                />
                                {t("Archive")}
                              </span>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </div>

      {/* Pagination */}
      {filteredPatients.length > 0 && (
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
              filteredPatients && filteredPatients.length > 0 ? (
                <>
                  {t("showing")} {indexOfFirstItem + 1} {t("to")}{" "}
                  {Math.min(indexOfLastItem, filteredPatients.length)} {t("of")}{" "}
                  {filteredPatients.length} {t("entries")}
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

      {/* Delete confirmation dialog */}
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
              {patientIdToDelete ? t("ReallyArch") : t("ReallyArch")}
            </div>
          </div>
          <div className="px-5 pb-8 text-center">
            <Button
              variant="outline-secondary"
              type="button"
              onClick={() => {
                setDeleteConfirmationModal(false);
                setPatientIdToDelete(null);
              }}
              className="w-24 mr-4"
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
        open={changeOrganisationModal}
        onClose={() => {
          setChangeOrganisationModal(false);
        }}
      >
        <Dialog.Panel className="p-10">
          <a
            href="#"
            onClick={(event: React.MouseEvent) => {
              event.preventDefault();
              setChangeOrganisationModal(false);
            }}
            className="absolute top-0 right-0 mt-3 mr-3"
          >
            <Lucide icon="X" className="w-6 h-6 text-slate-400" />
          </a>
          <div className="intro-y box mt-3">
            <div className="flex flex-col items-center p-5 border-b sm:flex-row border-slate-200/60 dark:border-darkmode-400 ">
              <h2 className="mr-auto text-base font-medium">
                {t("select_organisation")}
              </h2>
            </div>
            <div className="p-5">
              <Preview>
                <TomSelect
                  value={selectMultipleDevice}
                  onChange={(e: {
                    target: { value: SelectedMultipleValues };
                  }) => {
                    setSelectMultipleDevice(e.target.value);
                  }}
                  options={{
                    placeholder: `${t("select_organisation")}`,
                  }}
                  className="w-full"
                  multiple
                >
                  {Organisations.map((Organisation) => (
                    <option key={Organisation.id} value={Organisation.id}>
                      {Organisation.name}
                    </option>
                  ))}
                </TomSelect>
              </Preview>
              <div className="mt-5 text-right">
                <Button
                  type="button"
                  variant="primary"
                  className="w-24"
                  onClick={() => {
                    handleAddOrganisations();
                  }}
                  disabled={loading3}
                >
                  {loading3 ? (
                    <div className="loader">
                      <div className="dot"></div>
                      <div className="dot"></div>
                      <div className="dot"></div>
                    </div>
                  ) : (
                    `${t("save")}`
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>

      {/* Start: Patient data genrate open model  */}

      {/* End: Patient data genrate open model  */}
    </>
  );
};

export default PatientList;
