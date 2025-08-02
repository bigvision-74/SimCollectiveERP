import _ from "lodash";
import clsx from "clsx";
import { useState, useRef, useEffect, ChangeEvent, useMemo } from "react";
import Button from "@/components/Base/Button";
import Pagination from "@/components/Base/Pagination";
import { FormInput, FormSelect, FormCheck } from "@/components/Base/Form";
import Lucide from "@/components/Base/Lucide";
import Tippy from "@/components/Base/Tippy";
import { Dialog, Menu } from "@/components/Base/Headless";
import Table from "@/components/Base/Table";
import { useNavigate, Link, useLocation } from "react-router-dom";
import Alert from "@/components/Base/Alert";
import Alerts from "@/components/Alert";
import { t } from "i18next";
import { Preview } from "@/components/Base/PreviewComponent";
import { useTranslation } from "react-i18next";
import { getAllOrgAction } from "@/actions/organisationAction";
import { updateDataOrgAction } from "@/actions/archiveAction";
import { getAdminOrgAction } from "@/actions/adminActions";

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
  org_delete: string;
};
interface Component {
  onAction: (id: string, type: string) => void;
  onRecover: (id: string, type: string) => void;
  data: any[];
}

type Org = {
  name: string;
  org_email: string;
  id: number;
  organisation_icon: "";
};

const arusers: React.FC<Component> = ({ data = [], onAction, onRecover }) => {
  const { t } = useTranslation();
  const deleteButtonRef = useRef(null);
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
  const [name, setName] = useState("");

  const [recoveryConfirmationModal, setRecoveryConfirmationModal] =
    useState(false);
  const [userIdToRecover, setUserIdToRecover] = useState<number | null>(null);
  const [noteModal, setNoteModal] = useState(false);
  const [changeOrgModal, setChangeOrgModal] = useState(false);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);

  useEffect(() => {
    setTotalPages(Math.ceil(data.length / itemsPerPage));
  }, [data, itemsPerPage]);

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
    setTotalPages(Math.ceil(data.length / newItemsPerPage));
    setCurrentPage(1);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  useEffect(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const newCurrentUsers = data.slice(indexOfFirstItem, indexOfLastItem);
  }, [currentPage, itemsPerPage, data]);

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  };

  const propertiesToSearch = useMemo(
    () => ["name", "email", "username", "uemail", "fname", "lname", "role"],
    []
  );

  useEffect(() => {
    const filterUsers = async () => {
      if (!Array.isArray(data) || data.length === 0) return;

      const useremail = localStorage.getItem("user");
      const userRole = localStorage.getItem("role");
      const org = await getAdminOrgAction(String(useremail));

      let filteredData = data;

      if (userRole === "Admin" && org?.id) {
        filteredData = data.filter(
          (user: any) => Number(user.organisation_id) === org.orgid
        );
      }

      const filtered = filteredData.filter((user) => {
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

      const indexOfLastItem = currentPage * itemsPerPage;
      const indexOfFirstItem = indexOfLastItem - itemsPerPage;

      setFilteredUsers(filtered);
      setTotalPages(Math.ceil(filtered.length / itemsPerPage));
      setCurrentUsers(filtered.slice(indexOfFirstItem, indexOfLastItem));

      console.log("filtered", filtered);
    };

    filterUsers();
  }, [currentPage, itemsPerPage, searchQuery, data, propertiesToSearch]);

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
    if (userIdToDelete) {
      onAction(String(userIdToDelete), "user");
    } else {
      const deletePromises = Array.from(selectedUsers).map((userId) =>
        onAction(String(userId), "user")
      );
      await Promise.all(deletePromises);
      setSelectedUsers(new Set());
    }

    setDeleteConfirmationModal(false);
  };

  const handleDeleteSelected = () => {
    setUserIdToDelete(null);
    setDeleteConfirmationModal(true);
  };

  const handleRecoveryClick = (userId: number, org_delete: string) => {
    setUserIdToRecover(userId);
    if (org_delete == "1") {
      setNoteModal(true);
    } else {
      setRecoveryConfirmationModal(true);
    }
  };

  const fetchOrgs = async () => {
    try {
      const data = await getAllOrgAction();
      setOrgs(data);
      if (data.length > 0) {
        setSelectedOrgId(data[0].id);
      }
      setNoteModal(false);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleChangeOrg = () => {
    fetchOrgs();
    setChangeOrgModal(true);
  };

  const handleChangeOrg1 = async () => {
    const formDataObj = new FormData();

    formDataObj.append("id", String(userIdToRecover));
    formDataObj.append("org", String(selectedOrgId));
    formDataObj.append("type", "user");

    const createOrg = await updateDataOrgAction(formDataObj);

    if (createOrg) {
      onRecover(String(userIdToRecover), "user");
      setChangeOrgModal(false);
    }
  };

  const handleRecoveryConfirm = async () => {
    if (userIdToRecover) {
      onRecover(String(userIdToRecover), "user");
    }
    setRecoveryConfirmationModal(false);
  };

  return (
    <>
      <div className="grid grid-cols-12 gap-6">
        <div className="flex flex-wrap items-center justify-between col-span-12 mt-2 intro-y sm:flex-nowrap">
          <Button
            variant="primary"
            className="mr-2 shadow-md"
            disabled={selectedUsers.size === 0}
            onClick={handleDeleteSelected}
          >
            {t("DeleteUsers")}
          </Button>

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

        <div className="col-span-12 overflow-auto intro-y lg:overflow-auto">
          <Table className="border-spacing-y-[10px] border-separate -mt-2">
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
                <Table.Th className="text-center border-b-0 whitespace-nowrap">
                  {t("action")}
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {currentUsers
                .filter(
                  (user) =>
                    user.role !== "superadmin" && user.role !== "student"
                )
                .map((user, key) => (
                  <Table.Tr key={user.id} className="intro-x">
                    <Table.Td className="w-10 box rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                      <FormCheck.Input
                        id="remember-me"
                        type="checkbox"
                        className="mr-2 border"
                        checked={selectedUsers.has(user.id)}
                        onChange={() => handleRowCheckboxChange(user.id)}
                      />
                    </Table.Td>
                    <Table.Td className="box rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                      <a className="font-medium whitespace-nowrap">
                        {indexOfFirstItem + key + 1}
                      </a>
                    </Table.Td>
                    <Table.Td className="box w-40 rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                      <div className="flex">
                        <div className="w-12 h-12 image-fit zoom-in">
                          <Tippy
                            as="img"
                            alt="Midone Tailwind HTML Admin Template"
                            className="rounded-lg shadow-[0px_0px_0px_2px_#fff,_1px_1px_5px_rgba(0,0,0,0.32)] dark:shadow-[0px_0px_0px_2px_#3f4865,_1px_1px_5px_rgba(0,0,0,0.32)]"
                            src={
                              user.user_thumbnail?.startsWith("http")
                                ? user.user_thumbnail
                                : `https://insightxr.s3.eu-west-2.amazonaws.com/images/${user.user_thumbnail}`
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
                    <Table.Td
                      className={clsx([
                        "box w-56 rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600",
                        "before:absolute before:inset-y-0 before:left-0 before:my-auto before:block before:h-8 before:w-px before:bg-slate-200 before:dark:bg-darkmode-400",
                      ])}
                    >
                      <div className="flex items-center justify-center">
                        <a
                          className="flex items-center text-success cursor-pointer mr-3"
                          onClick={(event) => {
                            event.preventDefault();
                            handleRecoveryClick(user.id, user.org_delete);
                          }}
                        >
                          <Lucide icon="RotateCw" className="w-4 h-4 mr-1" />
                          {t("Recover")}
                        </a>

                        {/* Delete Link */}
                        <a
                          className="flex items-center text-danger cursor-pointer"
                          onClick={(event) => {
                            event.preventDefault();
                            const name = user.fname + " " + user.lname;
                            setName(name);
                            handleDeleteClick(user.id);
                            // setDeleteConfirmationModal(true); // Open the confirmation modal
                          }}
                        >
                          <Lucide icon="Trash2" className="w-4 h-4 mr-1" />{" "}
                          {t("delete")}
                        </a>
                      </div>
                    </Table.Td>
                  </Table.Tr>
                ))}
            </Table.Tbody>
          </Table>
        </div>

        {filteredUsers.length > 0 ? (
          <div className="flex flex-wrap items-center col-span-12 intro-y sm:flex-row sm:flex-nowrap">
            {/* Pagination Left */}
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

            {/* Record Info */}
            <div className="hidden mx-auto md:block text-slate-500">
              {t("showing")} {indexOfFirstItem + 1} {t("to")}{" "}
              {Math.min(indexOfLastItem, filteredUsers.length)} {t("of")}{" "}
              {filteredUsers.length} {t("entries")}
            </div>

            {/* Items Per Page Dropdown */}
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
        ) : (
          <div className="col-span-12 text-center text-slate-500 py-10">
            {t("noMatchingRecords")}
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
              icon="XCircle"
              className="w-16 h-16 mx-auto mt-3 text-danger"
            />
            <div className="mt-5 text-3xl">{t("Sure")}</div>
            <div className="mt-2 text-slate-500">
              {userIdToDelete ? `${t("ReallyDel")}` : `${t("ReallyDel")} `}
              <br />
              {t("undone")}
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
            >
              {t("delete")}
            </Button>
          </div>
        </Dialog.Panel>
      </Dialog>
      {/* END: Delete Confirmation Modal */}

      <Dialog
        open={recoveryConfirmationModal}
        onClose={() => {
          setRecoveryConfirmationModal(false);
        }}
        initialFocus={deleteButtonRef}
      >
        <Dialog.Panel>
          <div className="p-5 text-center">
            <Lucide
              icon="RotateCw"
              className="w-16 h-16 mx-auto mt-3 text-success"
            />
            <div className="mt-5 text-3xl">{t("SureRecover")}</div>
            <div className="mt-2 text-slate-500">
              {t("ReallyRecover")}
              <br />
            </div>
          </div>
          <div className="px-5 pb-8 text-center">
            <Button
              variant="outline-secondary"
              type="button"
              className="w-24 mr-4"
              onClick={() => {
                setRecoveryConfirmationModal(false);
                setUserIdToRecover(null);
              }}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="success"
              type="button"
              className="w-24 text-white"
              ref={deleteButtonRef}
              onClick={handleRecoveryConfirm}
            >
              {t("Recover")}
            </Button>
          </div>
        </Dialog.Panel>
      </Dialog>

      <Dialog
        open={noteModal}
        onClose={() => {
          setNoteModal(false);
        }}
        initialFocus={deleteButtonRef}
      >
        <Dialog.Panel>
          <div className="p-5 text-center">
            <Lucide
              icon="AlertCircle"
              className="w-16 h-16 mx-auto mt-3 text-warning"
            />
            <div className="mt-5 text-3xl">{t("deleted")}</div>
            <div className="mt-2 text-slate-500">
              {t("needChange")}
              <br />
            </div>
          </div>
          <div className="px-5 pb-8 text-center">
            <Button
              variant="outline-secondary"
              type="button"
              className="w-24 mr-4"
              onClick={() => {
                setNoteModal(false);
                setUserIdToRecover(null);
              }}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="success"
              type="button"
              className="w-34 text-white"
              ref={deleteButtonRef}
              onClick={handleChangeOrg}
            >
              {t("change")}
            </Button>
          </div>
        </Dialog.Panel>
      </Dialog>

      <Dialog
        size="xl"
        open={changeOrgModal}
        onClose={() => {
          setChangeOrgModal(false);
        }}
      >
        <Dialog.Panel className="p-10 modelContentLibrary">
          <a
            onClick={(event: React.MouseEvent) => {
              event.preventDefault();
              setChangeOrgModal(false);
            }}
            className="absolute top-0 right-0 mt-3 mr-3"
          >
            <Lucide icon="X" className="w-6 h-6 text-slate-400" />
          </a>
          <div className="intro-y box mt-3">
            <div className="flex flex-col items-center p-5 border-b sm:flex-row border-slate-200/60 dark:border-darkmode-400 ">
              <h2 className="mr-auto text-base font-medium">{t("head1")}</h2>
            </div>
            <div className="p-5 overflow-auto">
              <Preview>
                <Table className="mt-5">
                  <Table.Thead variant="light">
                    <Table.Tr>
                      <Table.Th className="whitespace-nowrap"></Table.Th>
                      <Table.Th className="whitespace-nowrap">
                        {t("user_thumbnail")}
                      </Table.Th>
                      <Table.Th className="whitespace-nowrap">
                        {t("organisation")}
                      </Table.Th>
                      <Table.Th className="whitespace-nowrap">
                        {t("org_email")}
                      </Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {/* {console.log(vrContent,"vrContentvrContentvrContent")} */}
                    {orgs.map((org, index) => (
                      <Table.Tr key={org.id}>
                        <Table.Td>
                          <FormCheck.Input
                            id={`radio-${org.id}`}
                            type="radio"
                            name="vr_content_radio"
                            value={org.id}
                            checked={selectedOrgId === org.id}
                            onChange={() => setSelectedOrgId(org.id)}
                          />
                        </Table.Td>
                        <Table.Td>
                          <div className="w-10 h-10 image-fit zoom-in">
                            <Tippy
                              as="img"
                              alt="Midone - HTML Admin Template"
                              className="border-2 border-white rounded-lg shadow-md"
                              src={
                                org.organisation_icon?.startsWith("http")
                                  ? org.organisation_icon
                                  : `https://insightxr.s3.eu-west-2.amazonaws.com/images/${org.organisation_icon}`
                              }
                              content={org.name}
                            />
                          </div>
                        </Table.Td>
                        <Table.Td>{org.name}</Table.Td>
                        <Table.Td>{org.org_email}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Preview>
              <div className="mt-5 text-right">
                <Button
                  type="button"
                  variant="primary"
                  className="w-24"
                  onClick={() => {
                    handleChangeOrg1();
                  }}
                >
                  {t("save")}
                </Button>
              </div>
            </div>
          </div>
        </Dialog.Panel>
      </Dialog>
    </>
  );
};

export default arusers;
