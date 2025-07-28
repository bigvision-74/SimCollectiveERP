import _ from "lodash";
import { useState, useRef, useEffect, ChangeEvent } from "react";
import Button from "@/components/Base/Button";
import Pagination from "@/components/Base/Pagination";
import {
  FormInput,
  FormSelect,
  FormLabel,
  FormCheck,
} from "@/components/Base/Form";
import Lucide from "@/components/Base/Lucide";
import Tippy from "@/components/Base/Tippy";
import { Dialog, Menu } from "@/components/Base/Headless";
import Table from "@/components/Base/Table";
import { Link } from "react-router-dom";
import {
  getAllOrgAction,
  createOrgAction,
  deleteOrgAction,
} from "@/actions/organisationAction";
import Alerts from "@/components/Alert";
// import './style.css';
import { t } from "i18next";
import { isValidInput } from "@/helpers/validation";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
type Org = {
  name: string;
  organisation_id: string;
  org_email: string;
  updated_at: string;
  id: number;
  device_count: number;
  course_count: number;
  user_count: number;
  organisation_icon: "";
};
interface Component {
  onAction: (id: string, type: string) => void;
  data: any[];
  onRecover: (id: string, type: string) => void;
}

const Arorganisation: React.FC<Component> = ({
  data = [],
  onAction,
  onRecover,
}) => {
  const deleteButtonRef = useRef(null);
  const [superlargeModalSizePreview, setSuperlargeModalSizePreview] =
    useState(false);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteConfirmationModal, setDeleteConfirmationModal] = useState(false);
  const [userIdToDelete, setUserIdToDelete] = useState<number | null>(null);
  const [selectedOrgs, setSelectedOrgs] = useState<Set<number>>(new Set());
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentOrgs, setCurrentOrgs] = useState<Org[]>([]);
  const [filteredOrgs, setFilteredOrgs] = useState<Org[]>([]);
  const [organizationIcon, setOrganizationIcon] = useState<string | undefined>(
    undefined
  );
  const [recoveryConfirmationModal, setRecoveryConfirmationModal] =
    useState(false);
  const [userIdToRecover, setUserIdToRecover] = useState<number | null>(null);

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
    setTotalPages(Math.ceil(filteredOrgs.length / newItemsPerPage));
    setCurrentPage(1);
  };

  const handleDeleteSelected = () => {
    setUserIdToDelete(null);
    setDeleteConfirmationModal(true);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setCurrentPage(1);
  };

  const propertiesToSearch = ["name", "org_email", "organisation_id"];

  useEffect(() => {
    if (Array.isArray(data)) {
      const filtered = data.filter((org) => {
        return propertiesToSearch.some((prop) =>
          org[prop as keyof Org]
            ?.toString()
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        );
      });

      setFilteredOrgs(filtered);

      const newTotalPages = Math.ceil(filtered.length / itemsPerPage);
      setTotalPages(newTotalPages);

      const validatedCurrentPage = Math.min(currentPage, newTotalPages || 1);
      if (currentPage !== validatedCurrentPage) {
        setCurrentPage(validatedCurrentPage);
        return;
      }

      const indexOfLastItem = validatedCurrentPage * itemsPerPage;
      const indexOfFirstItem = indexOfLastItem - itemsPerPage;
      setCurrentOrgs(filtered.slice(indexOfFirstItem, indexOfLastItem));
    }
  }, [currentPage, itemsPerPage, searchQuery, data]);

  const handleDeleteConfirm = async () => {
    if (userIdToDelete) {
      onAction(String(userIdToDelete), "org");
    } else {
      const deletePromises = Array.from(selectedOrgs).map((userId) =>
        onAction(String(userId), "org")
      );
      await Promise.all(deletePromises);
      setSelectedOrgs(new Set());
    }

    setDeleteConfirmationModal(false);
  };

  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);

  const validateIcon = (icon: any) => {
    return icon ? "" : t("OrgIconValidation");
  };
  const { t } = useTranslation();
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedOrgs(new Set(filteredOrgs.map((user) => user.id)));
    } else {
      setSelectedOrgs(new Set());
    }
    setSelectAllChecked(event.target.checked);
  };

  const handleRowCheckboxChange = (userId: number) => {
    const newSelectedUsers = new Set(selectedOrgs);
    if (newSelectedUsers.has(userId)) {
      newSelectedUsers.delete(userId);
    } else {
      newSelectedUsers.add(userId);
    }
    setSelectedOrgs(newSelectedUsers);
    setSelectAllChecked(newSelectedUsers.size === filteredOrgs.length);
  };

  const handleDeleteClick = (userId: number) => {
    setUserIdToDelete(userId);
    setDeleteConfirmationModal(true);
  };

  const handleRecoveryClick = (orgId: number) => {
    setUserIdToRecover(orgId);
    setRecoveryConfirmationModal(true);
  };

  const handleRecoveryConfirm = async () => {
    if (userIdToRecover) {
      try {
        onRecover(String(userIdToRecover), "org");
        setRecoveryConfirmationModal(false);
      } catch (error) {
        console.error("Recovery failed:", error);
      }
    }
  };

  return (
    <>
      {/* {showAlert && <Alerts data={showAlert} />} */}

      <div className="grid grid-cols-12 gap-6 ">
        <div className="flex flex-wrap items-center justify-between col-span-12 mt-2 intro-y sm:flex-nowrap">
          <Button
            variant="primary"
            className="mr-2 shadow-md"
            disabled={selectedOrgs.size === 0}
            onClick={() => {
              handleDeleteSelected();
            }}
          >
            {t("bulk_delete")}
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
        {/* BEGIN: Data List */}
        <div className="col-span-12 overflow-auto intro-y lg:overflow-auto organisationTable">
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
                <Table.Th className="text-center border-b-0 whitespace-nowrap">
                  {t("organisation")}
                </Table.Th>
                <Table.Th className="text-center border-b-0 whitespace-nowrap">
                  {t("org_email")}
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
              ) : currentOrgs.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={9} className="text-center">
                    {t("noMatchingRecords")}
                  </Table.Td>
                </Table.Tr>
              ) : (
                currentOrgs.map((org, key) => (
                  <Table.Tr key={org.id} className="intro-x">
                    <Table.Td className="w-10 box rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                      <FormCheck.Input
                        id="remember-me"
                        type="checkbox"
                        className="mr-2 border"
                        checked={selectedOrgs.has(org.id)}
                        onChange={() => handleRowCheckboxChange(org.id)}
                      />
                    </Table.Td>
                    <Table.Td className="box rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                      <a href="" className="font-medium whitespace-nowrap">
                        {indexOfFirstItem + key + 1}
                      </a>
                    </Table.Td>
                    <Table.Td className="box whitespace-nowrap rounded-l-none rounded-r-none border-x-0 !py-3.5 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                      <div className="flex items-center">
                        <div className="w-12 h-12 image-fit zoom-in">
                          <Tippy
                            as="img"
                            alt="Midone - HTML Admin Template"
                            className="rounded-lg shadow-[0px_0px_0px_2px_#fff,_1px_1px_5px_rgba(0,0,0,0.32)] dark:shadow-[0px_0px_0px_2px_#3f4865,_1px_1px_5px_rgba(0,0,0,0.32)]"
                            src={
                              org.organisation_icon?.startsWith("http")
                                ? org.organisation_icon
                                : `https://insightxr.s3.eu-west-2.amazonaws.com/images/${org.organisation_icon}`
                            }
                            content={org.name}
                          />
                        </div>
                      </div>
                    </Table.Td>
                    <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                      <Link
                        to={`/organisations-settings/${org.id}`}
                        className="font-medium whitespace-nowrap"
                      >
                        {org.name}
                      </Link>
                      <div className="text-slate-500 text-xs whitespace-nowrap mt-0.5">
                        {org.organisation_id}
                      </div>
                    </Table.Td>
                    <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                      {org.org_email}
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
                            handleRecoveryClick(org.id);
                          }}
                        >
                          <Lucide icon="RotateCw" className="w-4 h-4 mr-1" />
                          {t("Recover")}
                        </a>
                        {/* Delete Link */}
                        <a
                          href="#"
                          className="flex items-center text-danger"
                          onClick={(e) => {
                            e.preventDefault();
                            handleDeleteClick(org.id);
                            setDeleteConfirmationModal(true);
                          }}
                        >
                          <Lucide icon="Trash2" className="w-4 h-4 mr-1" />{" "}
                          {t("delete")}
                        </a>
                      </div>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </div>
        {/* END: Data List */}
        {/* BEGIN: Pagination */}

        {filteredOrgs.length > 0 && (
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
              {!loading ? (
                filteredOrgs && filteredOrgs.length > 0 ? (
                  <>
                    {t("showing")} {indexOfFirstItem + 1} {t("to")}{" "}
                    {Math.min(indexOfLastItem, filteredOrgs.length)} {t("of")}{" "}
                    {filteredOrgs.length} {t("entries")}
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
              {t("ReallyDel")}
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
    </>
  );
};

export default Arorganisation;
