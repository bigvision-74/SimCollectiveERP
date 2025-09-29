import _ from "lodash";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useState, ChangeEvent } from "react";
import fakerData from "@/utils/faker";
import Button from "@/components/Base/Button";
import Pagination from "@/components/Base/Pagination";
import { FormInput, FormSelect, FormLabel } from "@/components/Base/Form";
import Lucide from "@/components/Base/Lucide";
import { Menu } from "@/components/Base/Headless";
import { t } from "i18next";
import clsx from "clsx";
import {
  allRequestAction,
  approveRequestAction,
  rejectRequestAction,
} from "@/actions/organisationAction";
import Alerts from "@/components/Alert";
import { Dialog } from "@/components/Base/Headless";
import {
  getPresignedApkUrlAction,
  uploadFileAction,
} from "@/actions/s3Actions";
import { useUploads } from "@/components/UploadContext";

type User = {
  id: number;
  created_at: string;
  thumbnail: string;
  fname: string;
  lname: string;
  username: string;
  email: string;
  institution: string;
  type: string;
};

// Define the structure for form data and errors
type FormData = {
  purchaseOrder: File | null;
};

type FormErrors = {
  purchaseOrder?: string;
};

function Main() {
  const { addTask, updateTask } = useUploads();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [currentUsers, setCurrentUsers] = useState<User[]>([]);
  const [loading1, setLoading1] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);

  // Modal and Form State
  const [showPlanTypeModal, setShowPlanTypeModal] = useState(false);
  const [selectedPlanType, setSelectedPlanType] = useState("");
  const [userIdToApprove, setUserIdToApprove] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({ purchaseOrder: null });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [amount, setAmount] = useState<number>(0);

  // Effect to update amount based on selected plan
  useEffect(() => {
    if (selectedPlanType === "1 Year Licence") {
      setAmount(1000);
    } else if (selectedPlanType === "5 Year Licence") {
      setAmount(3000);
    } else {
      setAmount(0);
    }
  }, [selectedPlanType]);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  };

  const fetchUsers = async () => {
    try {
      setLoading1(true);
      let data = await allRequestAction();
      setUsers(data);
      setTotalPages(Math.ceil(data.length / itemsPerPage));
      setLoading1(false);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const propertiesToSearch = ["fname", "lname", "email", "username"];

  useEffect(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;

    if (Array.isArray(users) && users.length !== 0) {
      const filtered = users.filter((user) => {
        return propertiesToSearch.some((prop) => {
          const fieldValue = user[prop as keyof User];
          if (fieldValue) {
            return fieldValue
              .toString()
              .toLowerCase()
              .includes(searchQuery.toLowerCase());
          }

          return false;
        });
      });

      setFilteredUsers(filtered);
      setTotalPages(Math.ceil(filtered.length / itemsPerPage));
      setCurrentUsers(filtered.slice(indexOfFirstItem, indexOfLastItem));
    } else {
      setFilteredUsers([]);
      setCurrentUsers([]);
      setTotalPages(1);
    }
  }, [currentPage, itemsPerPage, searchQuery, users]);

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
    setTotalPages(Math.ceil(users.length / newItemsPerPage));
    setCurrentPage(1);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  useEffect(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const newCurrentUsers = users.slice(indexOfFirstItem, indexOfLastItem);
  }, [currentPage, itemsPerPage, users]);

  const openPlanTypeModal = async (id: string, plan: string) => {
    if (plan === "trial") {
      setApprovingId(id);
      const res = await approveRequestAction(id, "free", "", "0"); // Pass null/0 for trial
      if (res.success) {
        fetchUsers();
        setShowAlert({
          variant: "success",
          message: t("requestApproved"),
        });
        setTimeout(() => setShowAlert(null), 3000);
      }
      setApprovingId(null);
      closePlanTypeModal();
    } else {
      setUserIdToApprove(id);
      setShowPlanTypeModal(true);
    }
  };

  const closePlanTypeModal = () => {
    setShowPlanTypeModal(false);
    setSelectedPlanType("");
    setUserIdToApprove(null);
    setFormData({ purchaseOrder: null });
    setFormErrors({});
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (name === "purchaseOrder" && files && files.length > 0) {
      setFormData((prev) => ({ ...prev, purchaseOrder: files[0] }));
      setFormErrors((prev) => ({ ...prev, purchaseOrder: undefined }));
    }
  };

  const handleApprove = async () => {
    if (
      (selectedPlanType === "1 Year Licence" ||
        selectedPlanType === "5 Year Licence") &&
      !formData.purchaseOrder
    ) {
      setFormErrors({ purchaseOrder: "Purchase Order is required." });
      return;
    }

    if (!userIdToApprove || !selectedPlanType) return;

    closePlanTypeModal();

    try {
      setApprovingId(userIdToApprove);
      
      // FIX STARTS HERE
      let finalPurchaseOrderUrl: string | null = null;

      if (formData.purchaseOrder) {
        // 1. Get the presigned URL and store it in a new, correctly typed variable
        const presignedData = await getPresignedApkUrlAction(
          formData.purchaseOrder.name,
          formData.purchaseOrder.type,
          formData.purchaseOrder.size
        );
        
        const purchaseOrderTaskId = addTask(
          formData.purchaseOrder,
          selectedPlanType
        );

        // 2. Safely use the `presignedUrl` property from the new variable
        await uploadFileAction(
          presignedData.presignedUrl,
          formData.purchaseOrder,
          purchaseOrderTaskId,
          updateTask
        );
        
        // 3. Store the final public URL for the next action
        finalPurchaseOrderUrl = presignedData.url;
      }
      
      const res = await approveRequestAction(
        userIdToApprove,
        selectedPlanType,
        finalPurchaseOrderUrl || "", // 4. Pass the final URL
        String(amount)
      );
      // FIX ENDS HERE

      if (res.success) {
        fetchUsers();
        setShowAlert({
          variant: "success",
          message: t("requestApproved"),
        });
        setTimeout(() => setShowAlert(null), 3000);
      }
    } catch (error) {
      fetchUsers();
      setShowAlert({
        variant: "danger",
        message: t("requestApprovederror"),
      });
      setTimeout(() => setShowAlert(null), 3000);
    } finally {
      setApprovingId(null);
      closePlanTypeModal();
    }
  };


  const handleReject = async (id: string) => {
    try {
      setRejectingId(id);
      const res = await rejectRequestAction(id);
      if (res.success) {
        fetchUsers();
        setShowAlert({
          variant: "success",
          message: t("requestRejected"),
        });
        setTimeout(() => setShowAlert(null), 3000);
      }
    } catch (error) {
      fetchUsers();
      setShowAlert({
        variant: "danger",
        message: t("requestRejectederror"),
      });
      setTimeout(() => setShowAlert(null), 3000);
    } finally {
      setRejectingId(null);
    }
  };

  const Loader = () => (
    <div className="flex items-center justify-center">
      <div className="loader">
        <div className="dot"></div>
        <div className="dot"></div>
        <div className="dot"></div>
      </div>
    </div>
  );

  return (
    <>
      {showAlert && <Alerts data={showAlert} />}

      {/* Plan Type Selection Modal */}
      <Dialog
        open={showPlanTypeModal}
        onClose={closePlanTypeModal}
        className="w-96"
      >
        <Dialog.Panel>
          <Dialog.Title>
            <h2 className="mr-auto text-base font-medium">
              {t("Select_plan_type")}
            </h2>
          </Dialog.Title>
          <Dialog.Description className="grid grid-cols-12 gap-4 gap-y-3">
            <div className="col-span-12">
              <FormSelect
                value={selectedPlanType}
                onChange={(e) => setSelectedPlanType(e.target.value)}
                className="w-full"
              >
                <option value="">{t("Select_plan_type")}</option>
                <option value="free">{t("Free_trial")}</option>
                <option value="1 Year Licence">{t("1year_licence")}</option>
                <option value="5 Year Licence">{t("5_year_licence")}</option>
              </FormSelect>
            </div>

            {(selectedPlanType === "1 Year Licence" ||
              selectedPlanType === "5 Year Licence") && (
              <>
                <div className="col-span-12">
                  <div className="flex items-center justify-between mt-5">
                    <FormLabel
                      htmlFor="purchase-order-upload"
                      className="font-bold OrgIconLabel"
                    >
                      {t("PurchaseOrder")}
                    </FormLabel>
                    <span className="text-xs text-gray-500 font-bold ml-2">
                      {t("required")}
                    </span>
                  </div>

                  <label className="block cursor-pointer w-full">
                    <FormInput
                      id="purchase-order-upload"
                      type="file"
                      name="purchaseOrder"
                      onChange={handleInputChange}
                      className="hidden"
                    />
                    <div
                      className={clsx(
                        "w-full h-full p-3 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-1 transition-all",
                        {
                          "border-danger": formErrors.purchaseOrder,
                          "border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20":
                            !formErrors.purchaseOrder,
                        }
                      )}
                    >
                      {formData.purchaseOrder ? (
                        <div className="flex items-center">
                          <span className="w-2 h-2 mr-2 bg-primary rounded-full"></span>
                          <span className="text-sm font-medium text-primary">
                            {formData.purchaseOrder.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          {t("uploadpurachaseorder")}
                        </span>
                      )}
                    </div>
                  </label>
                  {formErrors.purchaseOrder && (
                    <p className="text-red-500 text-left text-sm mt-2">
                      {formErrors.purchaseOrder}
                    </p>
                  )}
                </div>

                <div className="col-span-12 mt-3">
                  <FormLabel htmlFor="amount-display" className="font-bold">
                    {t("Amount")}
                  </FormLabel>
                  <FormInput
                    id="amount-display"
                    type="text"
                    value={amount > 0 ? `${amount} $` : ""}
                    disabled
                    className="mt-1 bg-slate-100"
                  />
                </div>
              </>
            )}
          </Dialog.Description>
          <Dialog.Footer>
            <Button
              type="button"
              variant="outline-secondary"
              onClick={closePlanTypeModal}
              className="w-20 mr-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleApprove}
              disabled={
                !selectedPlanType ||
                approvingId === userIdToApprove ||
                ((selectedPlanType === "1 Year Licence" ||
                  selectedPlanType === "5 Year Licence") &&
                  !formData.purchaseOrder)
              }
              className="w-20"
            >
              {approvingId === userIdToApprove ? <Loader /> : "Approve"}
            </Button>
          </Dialog.Footer>
        </Dialog.Panel>
      </Dialog>

      <h2 className="mt-10 text-lg font-medium intro-y">
        {t("registration_request")}
      </h2>
      <div className="grid grid-cols-12 gap-6 mt-5">
        <div className="flex flex-wrap items-center col-span-12 mt-2 intro-y sm:flex-nowrap">
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
        {/* BEGIN: Users Layout */}
        {currentUsers.map((user, Key) => (
          <div
            key={Key}
            className="col-span-12 intro-y md:col-span-6 lg:col-span-4 xl:col-span-3"
          >
            <div className=" box h-full flex flex-col">
              <div className="flex items-start px-5 pt-5">
                <div className="flex flex-col items-center w-full lg:flex-row">
                  <div className="w-16 h-16 image-fit">
                    <img
                      alt="User Thumbnail"
                      className="rounded-full"
                      src={
                        user.thumbnail ||
                        "https://insightxr.s3.eu-west-2.amazonaws.com/image/fDwZ-CO0t-default-avatar.jpg"
                      }
                    />
                  </div>
                  <div className="mt-3 text-center lg:ml-4 lg:text-left lg:mt-0">
                    <a href="#" className="font-medium">
                      {user.fname} {user.lname}
                    </a>
                  </div>
                </div>
              </div>
              <div className="p-5 text-center lg:text-left">
                <div className="flex items-center justify-center mt-5 lg:justify-start text-slate-500">
                  <Lucide
                    icon="School"
                    className="w-5 h-5 mr-3 text-primary shrink-0"
                  />
                  <span className="font-medium mr-2">
                    {t("InstitutionName")}:
                  </span>
                  {user.institution}
                </div>
                <div className="flex items-center justify-center mt-3 lg:justify-start text-slate-500">
                  <Lucide
                    icon="Mail"
                    className="w-5 h-5 mr-3 text-primary shrink-0"
                  />
                  <span className="font-medium mr-1">{t("Email1")}:</span>
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center justify-center mt-3 lg:justify-start text-slate-500">
                  <Lucide
                    icon="User"
                    className="w-5 h-5 mr-3 text-primary shrink-0"
                  />
                  <span className="font-medium mr-1">{t("username")}:</span>
                  <span className="truncate">{user.username}</span>
                </div>
              </div>
              <div className="p-5 text-center border-t lg:text-right border-slate-200/60 dark:border-darkmode-400">
                <Button
                  onClick={() =>
                    openPlanTypeModal(user.id.toString(), user.type)
                  }
                  variant="primary"
                  className="px-2 py-1 mr-2"
                  disabled={
                    approvingId === user.id.toString() ||
                    rejectingId === user.id.toString()
                  }
                >
                  {approvingId === user.id.toString() ? <Loader /> : "Accept"}
                </Button>
                <Button
                  onClick={() => handleReject(user.id.toString())}
                  variant="soft-primary"
                  className="px-2 py-1"
                  disabled={
                    rejectingId === user.id.toString() ||
                    approvingId === user.id.toString()
                  }
                >
                  {rejectingId === user.id.toString() ? <Loader /> : "Reject"}
                </Button>
              </div>
            </div>
          </div>
        ))}
        {/* END: Users Layout */}
        {/* BEGIN: Pagination */}
        {currentUsers.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-4 col-span-12 intro-y sm:flex-row sm:flex-nowrap">
            <div className="flex-1">
              <Pagination className="w-full sm:w-auto sm:mr-auto">
                <Pagination.Link onPageChange={() => handlePageChange(1)}>
                  <Lucide icon="ChevronsLeft" className="w-4 h-4" />
                </Pagination.Link>
                <Pagination.Link onPageChange={() => handlePageChange(currentPage - 1)}>
                  <Lucide icon="ChevronLeft" className="w-4 h-4" />
                </Pagination.Link>
                <Pagination.Link>...</Pagination.Link>
                {Array.from({ length: totalPages }, (_, i) => (
                  <Pagination.Link
                    key={i}
                    active={currentPage === i + 1}
                    onPageChange={() => handlePageChange(i + 1)}
                  >
                    {i + 1}
                  </Pagination.Link>
                )).slice(Math.max(0, currentPage - 3), currentPage + 2)}
                <Pagination.Link>...</Pagination.Link>
                <Pagination.Link onPageChange={() => handlePageChange(currentPage + 1)}>
                  <Lucide icon="ChevronRight" className="w-4 h-4" />
                </Pagination.Link>
                <Pagination.Link onPageChange={() => handlePageChange(totalPages)}>
                  <Lucide icon="ChevronsRight" className="w-4 h-4" />
                </Pagination.Link>
              </Pagination>
            </div>

            <div className="text-center text-slate-500 w-full sm:w-auto md:mx-auto">
              {t("showing")} {indexOfFirstItem + 1} {t("to")}{" "}
              {Math.min(indexOfLastItem, filteredUsers.length)} {t("of")}{" "}
              {filteredUsers.length} {t("entries")}
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
        {/* END: Pagination */}
      </div>
    </>
  );
}

export default Main;