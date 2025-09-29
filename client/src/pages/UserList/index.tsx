import _ from "lodash";
import clsx from "clsx";
import { useState, useRef, useEffect, ChangeEvent } from "react";
import Button from "@/components/Base/Button";
import Pagination from "@/components/Base/Pagination";
import { FormInput, FormSelect, FormCheck } from "@/components/Base/Form";
import Lucide from "@/components/Base/Lucide";
import Tippy from "@/components/Base/Tippy";
import { Dialog, Menu } from "@/components/Base/Headless";
import Table from "@/components/Base/Table";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { getAllUsersAction } from "@/actions/userActions";
import profile from "@/assets/images/fakers/profile.webp";
import { deleteUserAction } from "@/actions/userActions";
import Alert from "@/components/Base/Alert";
import Alerts from "@/components/Alert";
import "./style.css";
import { t } from "i18next";
import { getAdminOrgAction } from "@/actions/adminActions";
import SubscriptionModal from "@/components/SubscriptionModal.tsx";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { fetchSettings, selectSettings } from "@/stores/settingsSlice";

type User = {
  id: number;
  name: string;
  email: string;
  user_thumbnail: string;
  updated_at: string;
  fname: string;
  lname: string;
  username: string;
  uemail: string;
  role: string;
  lastLoginTime: string;
};

interface Component {
  onUserCountChange?: (count: number) => void;
  onShowAlert: (alert: {
    variant: "success" | "danger";
    message: string;
  }) => void;
}
const Userlist: React.FC<Component> = ({ onUserCountChange, onShowAlert }) => {
  const navigate = useNavigate();
  const userrole = localStorage.getItem("role");
  const [subscriptionPlan, setSubscriptionPlan] = useState("free");
  const [planDate, setPlanDate] = useState("");
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const deleteButtonRef = useRef(null);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUsers, setCurrentUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [deleteConfirmationModal, setDeleteConfirmationModal] = useState(false);
  const [userIdToDelete, setUserIdToDelete] = useState<number | null>(null);
  const [deleteUser, setDeleteUser] = useState(false);
  const [deleteError, setDeleteError] = useState(false);
  const [editedsuccess, setEditedsuccess] = useState(false);
  const [name, setName] = useState("");
  const [loading1, setLoading1] = useState(false);
  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);
  const location = useLocation();
  const alertMessage = location.state?.alertMessage || "";
  const [userRole, setUserRole] = useState("");
  const [archiveLoading, setArchiveLoading] = useState(false);

  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchSettings());
  }, [dispatch]);

  const { data } = useAppSelector(selectSettings);

  function isPlanExpired(dateString: string): boolean {
    const planStartDate = new Date(dateString);

    const expirationDate = new Date(planStartDate);
    expirationDate.setFullYear(planStartDate.getFullYear() + 5);

    const currentDate = new Date();

    return currentDate > expirationDate;
  }

  const fetchUsers = async () => {
    try {
      const useremail = localStorage.getItem("user");
      const userData = await getAdminOrgAction(String(useremail));
      setUserRole(userData.role);
      setSubscriptionPlan(userData.planType);
      setPlanDate(userData.planDate);

      setLoading1(true);
      let data = await getAllUsersAction();

      const isFreePlan = userData.planType === "free";
      const isExpiredPerpetual =
        userData.planType === "5 Year Licence" &&
        isPlanExpired(userData.planDate);

      if (
        (data.length > 10 && userrole === "Admin" && isFreePlan) ||
        (isExpiredPerpetual && userrole === "Admin")
      ) {
        data = data.slice(0, 10);
      }

      let filteredUsers: any[] = [];

      if (userData.role === "Superadmin" || userData.role === "Administrator") {
        filteredUsers = data.filter(
          (user: any) => user.username !== userData.username
        );
      } else {
        filteredUsers = data.filter(
          (user: any) =>
            Number(user.organisation_id) === Number(userData.orgid) &&
            user.username !== userData.username
        );
      }

      if (onUserCountChange) {
        onUserCountChange(filteredUsers.length);
      }
      setUsers(filteredUsers);
      setTotalPages(Math.ceil(data.length / itemsPerPage));
      setLoading1(false);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
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
  ];

  useEffect(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;

    if (Array.isArray(users) && users.length !== 0) {
      let filtered = users;

      if (userrole === "Faculty") {
        filtered = filtered.filter((user) => user.role === "User");
      }

      filtered = filtered.filter((user) => {
        return propertiesToSearch.some((prop) => {
          if (prop === "role") {
            const displayRole = user.role ? user.role : "Unknown Role";
            return displayRole
              .toLowerCase()
              .includes(searchQuery.toLowerCase());
          }

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

      if (onUserCountChange) {
        onUserCountChange(filtered.length);
      }

      setFilteredUsers(filtered);
      setTotalPages(Math.ceil(filtered.length / itemsPerPage));
      setCurrentUsers(filtered.slice(indexOfFirstItem, indexOfLastItem));
    } else {
      setFilteredUsers([]);
      setCurrentUsers([]);
      setTotalPages(1);
    }
  }, [currentPage, itemsPerPage, searchQuery, users, userrole]);

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
    setDeleteUser(false);
    setDeleteError(false);
    window.scrollTo({ top: 0, behavior: "smooth" });

    try {
      if (userIdToDelete) {
        await deleteUserAction(userIdToDelete, name);
        setDeleteUser(true);
        onShowAlert({
          variant: "success",
          message: t("userArchiveSuccess"),
        });
      } else if (selectedUsers.size > 0) {
        const deletePromises = Array.from(selectedUsers).map((userId) =>
          deleteUserAction(userId)
        );
        await Promise.all(deletePromises);
        setDeleteUser(true);
      }
      // const data = await getAllUsersAction();
      // setUsers(data);
      await fetchUsers();
      setTotalPages(Math.ceil(users.length / itemsPerPage));
      setSelectedUsers(new Set());
      setSelectAllChecked(false);
      if (currentPage > Math.ceil(users.length / itemsPerPage)) {
        setCurrentPage(Math.max(1, Math.ceil(users.length / itemsPerPage)));
      }
    } catch (error) {
      onShowAlert({
        variant: "danger",
        message: t("userArchiveError"),
      });
      console.error("Error deleting user(s):", error);
      setDeleteError(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setArchiveLoading(false);
    }

    setDeleteConfirmationModal(false);
    setUserIdToDelete(null);
    setName("");
  };

  const handleDeleteSelected = () => {
    setUserIdToDelete(null);
    setDeleteConfirmationModal(true);
  };

  useEffect(() => {
    const alert = localStorage.getItem("UserAddedSuccessfully");
    if (alert) {
      setShowAlert({
        variant: "success",
        message: alert,
      });
      localStorage.removeItem("UserAddedSuccessfully");
      setTimeout(() => {
        setShowAlert(null);
      }, 3000);
    }
  }, []);

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

  const isFreePlanLimitReached =
    subscriptionPlan === "free" &&
    filteredUsers.length >= (data?.trialRecords || 10) &&
    userrole === "Admin";

  const isPerpetualLicenseExpired =
    subscriptionPlan === "5 Year Licence" &&
    isPlanExpired(planDate) &&
    userrole === "Admin";

  return (
    <>
      {showAlert && <Alerts data={showAlert} />}
      <SubscriptionModal
        isOpen={showUpsellModal}
        onClose={closeUpsellModal}
        currentPlan={subscriptionPlan}
      />
      {(isFreePlanLimitReached || isPerpetualLicenseExpired) && upgradePrompt}
      {editedsuccess && (
        <Alert variant="soft-success" className="flex items-center mb-2">
          <Lucide icon="CheckSquare" className="w-6 h-6 mr-2" />
          {t("userUpdateSuccess")}
        </Alert>
      )}
      <div className="grid grid-cols-12 gap-6 ">
        <div className="flex flex-wrap items-center justify-between col-span-12 mt-2 intro-y">
          {userRole !== "Observer" && (
            <>
              <div className="flex items-center space-x-2">
                <Button
                  variant="primary"
                  className="mr-2 shadow-md"
                  disabled={selectedUsers.size === 0}
                  onClick={handleDeleteSelected}
                >
                  {t("archiveUsers")}
                </Button>
              </div>
            </>
          )}
          <div className="w-full mt-3 sm:w-auto sm:mt-0 sm:ml-auto ">
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

        <div className="col-span-12 overflow-auto intro-y lg:overflow-auto">
          <Table className="border-spacing-y-[10px] border-separate -mt-2">
            <Table.Thead>
              <Table.Tr>
                {/* condition for hide Action button Observer role  */}
                {userRole !== "Observer" && (
                  <Table.Th className="border-b-0 whitespace-nowrap">
                    <FormCheck.Input
                      id="remember-me"
                      type="checkbox"
                      className="mr-2 border"
                      checked={selectAllChecked}
                      onChange={handleSelectAll}
                    />
                  </Table.Th>
                )}

                <Table.Th className="border-b-0 whitespace-nowrap">#</Table.Th>
                <Table.Th className="border-b-0 whitespace-nowrap">
                  {t("user_thumbnail")}
                </Table.Th>
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
                {userRole !== "Observer" && (
                  <Table.Th className="text-center border-b-0 whitespace-nowrap">
                    {t("action")}
                  </Table.Th>
                )}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {/* {currentUsers
                .filter((user) => user.role !== "Superadmin")
                .map((user, key) => ( */}

              {currentUsers
                .filter(
                  (user) =>
                    user.role !== "Superadmin" &&
                    !(
                      userRole === "Administrator" &&
                      user.role === "Administrator"
                    )
                )
                .map((user, key) => (
                  <Table.Tr key={user.id} className="intro-x">
                    {/* condition for hide Action button Observer role  */}
                    {userRole !== "Observer" && (
                      <Table.Td className="w-10 box rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                        <FormCheck.Input
                          id="remember-me"
                          type="checkbox"
                          className="mr-2 border"
                          checked={selectedUsers.has(user.id)}
                          onChange={() => handleRowCheckboxChange(user.id)}
                        />
                      </Table.Td>
                    )}

                    <Table.Td className="box rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                      <a className="font-medium whitespace-nowrap">
                        {indexOfFirstItem + key + 1}
                      </a>
                    </Table.Td>
                    <Table.Td className="box w-40 rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                      <div className="flex">
                        <div className="w-16 h-16 image-fit zoom-in">
                          <Tippy
                            as="img"
                            alt="Midone Tailwind HTML Admin Template"
                            className="rounded-lg shadow-[0px_0px_0px_2px_#fff,_1px_1px_5px_rgba(0,0,0,0.32)] dark:shadow-[0px_0px_0px_2px_#3f4865,_1px_1px_5px_rgba(0,0,0,0.32)]"
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
                      </div>
                    </Table.Td>
                    <Table.Td className="box rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                      <a className="font-medium whitespace-nowrap">
                        {user.fname + "  " + user.lname}
                      </a>
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
                    {userRole !== "Observer" && (
                      <Table.Td
                        className={clsx([
                          "box w-56 rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600",
                          "before:absolute before:inset-y-0 before:left-0 before:my-auto before:block before:h-8 before:w-px before:bg-slate-200 before:dark:bg-darkmode-400",
                        ])}
                      >
                        <div className="flex items-center justify-center">
                          {userRole !== "Superadmin" &&
                            userRole !== "Administrator" && (
                              <>
                                <Link
                                  to={
                                    user.role === "User"
                                      ? `/user-assign-patient/${user.id}`
                                      : "#"
                                  }
                                  className={clsx(
                                    "flex items-center mr-3",
                                    user.role !== "User" &&
                                      "pointer-events-none opacity-50 cursor-not-allowed"
                                  )}
                                  title="Only user enable this button"
                                >
                                  <Lucide
                                    icon="UserCheck"
                                    className="w-4 h-4 mr-1"
                                  />
                                  {t("assign")}
                                </Link>
                              </>
                            )}
                          <Link
                            to={`/user-edit/${user.id}`}
                            className="flex items-center mr-3"
                          >
                            <Lucide
                              icon="CheckSquare"
                              className="w-4 h-4 mr-1"
                            />{" "}
                            {t("edit")}
                          </Link>
                          {userRole != "Faculty" && (
                            <a
                              className="flex items-center text-danger cursor-pointer"
                              onClick={(event) => {
                                event.preventDefault();
                                const name = user.fname + " " + user.lname;
                                setName(name);
                                handleDeleteClick(user.id);
                              }}
                            >
                              <Lucide icon="Archive" className="w-4 h-4 mr-1" />{" "}
                              {t("Archive")}
                            </a>
                          )}
                        </div>
                      </Table.Td>
                    )}
                  </Table.Tr>
                ))}
            </Table.Tbody>
          </Table>
        </div>

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
              {userIdToDelete ? `${t("ReallyArch")}` : `${t("ReallyArch")} `}
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
      {/* END: Delete Confirmation Modal */}
    </>
  );
};

export default Userlist;
