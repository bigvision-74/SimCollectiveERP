import _ from "lodash";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useState, ChangeEvent } from "react";
import fakerData from "@/utils/faker";
import Button from "@/components/Base/Button";
import Pagination from "@/components/Base/Pagination";
import { FormInput, FormSelect } from "@/components/Base/Form";
import Lucide from "@/components/Base/Lucide";
import { Menu } from "@/components/Base/Headless";
import { t } from "i18next";
import {
  allRequestAction,
  approveRequestAction,
  rejectRequestAction,
} from "@/actions/organisationAction";
import Alerts from "@/components/Alert";
import { Dialog } from "@/components/Base/Headless";

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

function Main() {
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
  const [showPlanTypeModal, setShowPlanTypeModal] = useState(false);
  const [selectedPlanType, setSelectedPlanType] = useState("");
  const [userIdToApprove, setUserIdToApprove] = useState<string | null>(null);

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
    if (plan == "trial") {
      setApprovingId(id);
      const res = await approveRequestAction(id, "free");
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
      setUserIdToApprove(id); // ← Add this line
      setShowPlanTypeModal(true);
    }
  };

  const closePlanTypeModal = () => {
    setShowPlanTypeModal(false);
    setSelectedPlanType("");
    setUserIdToApprove(null);
  };

  const handleApprove = async () => {
    if (!userIdToApprove || !selectedPlanType) return;
    closePlanTypeModal();
    try {
      setApprovingId(userIdToApprove);
      const res = await approveRequestAction(userIdToApprove, selectedPlanType);
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
            <h2 className="mr-auto text-base font-medium">Select Plan Type</h2>
          </Dialog.Title>
          <Dialog.Description className="grid grid-cols-12 gap-4 gap-y-3">
            <div className="col-span-12">
              <FormSelect
                value={selectedPlanType}
                onChange={(e) => setSelectedPlanType(e.target.value)}
                className="w-full"
              >
                <option value="">Select Plan Type</option>
                <option value="Subscription">Subscription</option>
                <option value="5 Year Licence">5 Year Licence</option>
              </FormSelect>
            </div>
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
              disabled={!selectedPlanType || approvingId === userIdToApprove}
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
                      alt="Midone Tailwind HTML Admin Template"
                      className="rounded-full"
                      src={
                        user.thumbnail ||
                        "https://insightxr.s3.eu-west-2.amazonaws.com/image/fDwZ-CO0t-default-avatar.jpg"
                      }
                    />
                  </div>
                  <div className="mt-3 text-center lg:ml-4 lg:text-left lg:mt-0">
                    <a href="" className="font-medium">
                      {user.fname} {user.lname}
                    </a>
                  </div>
                </div>
              </div>
              <div className="p-5 text-center lg:text-left">
                <div className="flex items-center justify-center mt-5 lg:justify-start text-slate-500">
                  <Lucide icon="School" className="w-5 h-5 mr-3 text-primary shrink-0" />
                  <span className="font-medium mr-2">
                    {t("InstitutionName")}:
                  </span>
                  {user.institution}
                </div>
                <div className="flex items-center justify-center mt-3 lg:justify-start text-slate-500">
                  <Lucide icon="Mail" className="w-5 h-5 mr-3 text-primary shrink-0" />
               <span className="font-medium mr-1">{t("Email1")}:</span>
                   <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center justify-center mt-3 lg:justify-start text-slate-500">
                  <Lucide icon="User" className="w-5 h-5 mr-3 text-primary shrink-0" />
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
                {/* First Page Button */}
                <Pagination.Link onPageChange={() => handlePageChange(1)}>
                  <Lucide icon="ChevronsLeft" className="w-4 h-4" />
                </Pagination.Link>

                {/* Previous Page Button */}
                <Pagination.Link
                  onPageChange={() => handlePageChange(currentPage - 1)}
                >
                  <Lucide icon="ChevronLeft" className="w-4 h-4" />
                </Pagination.Link>

                {/* Page Numbers with Ellipsis */}
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

                {/* Next Page Button */}
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
