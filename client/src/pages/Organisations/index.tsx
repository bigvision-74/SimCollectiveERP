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
// import "./style.css";
import { t } from "i18next";
import { isValidInput } from "@/helpers/validation";
import clsx from "clsx";
import { useUploads } from "@/components/UploadContext";
import {
    getPresignedApkUrlAction,
    uploadFileAction,
} from "@/actions/s3Actions";

type Org = {
    id: number;
    name: string;
    organisation_id: string;
    org_email: string;
    user_count: string;
    organisation_icon: "";
    updated_at: string;
};

function Main() {
    const { addTask, updateTask } = useUploads();
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
    const [loading1, setLoading1] = useState(false);
    localStorage.removeItem("selectedOption");

    // In your fetchOrgs function, add better error handling
    const fetchOrgs = async () => {
        try {
            setLoading1(true);
            const data = await getAllOrgAction();
            ``
            if (!Array.isArray(data)) {
                throw new Error('Invalid data format received');
            }
            setOrgs(data);
            setTotalPages(Math.ceil(data.length / itemsPerPage));
        } catch (error) {
            console.error("Error fetching organisations:", error);
            setShowAlert({
                variant: "danger",
                message: t("orgFetchError"),
            });
        } finally {
            setLoading1(false);
        }
    };

    useEffect(() => {
        fetchOrgs();
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
        setTotalPages(Math.ceil(orgs.length / newItemsPerPage));
        setCurrentPage(1);
    };

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;

    const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(event.target.value);
        setCurrentPage(1);
    };

    const propertiesToSearch = ["name", "org_email", "organisation_id"];

    useEffect(() => {
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;

        if (Array.isArray(orgs) && orgs.length !== 0) {
            const filtered = orgs.filter((org) => {
                return propertiesToSearch.some((langData) =>
                    propertiesToSearch.some((prop) =>
                        org[prop as keyof Org]
                            ?.toString()
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase())
                    )
                );
            });

            setFilteredOrgs(filtered);
            setTotalPages(Math.ceil(filtered.length / itemsPerPage));
            setCurrentOrgs(filtered.slice(indexOfFirstItem, indexOfLastItem));
        }
    }, [currentPage, itemsPerPage, searchQuery, orgs]);

    const handleDeleteConfirm = async () => {
        setShowAlert(null);
        try {
            const idsToDelete = userIdToDelete
                ? [userIdToDelete]
                : Array.from(selectedOrgs);

            if (idsToDelete.length > 0) {
                await deleteOrgAction(idsToDelete);
            }

            const data = await getAllOrgAction();
            setTotalPages(Math.ceil(data.length / itemsPerPage));
            setOrgs(data);
            setSelectedOrgs(new Set());
            setSelectAllChecked(false);
            window.scrollTo({ top: 0, behavior: "smooth" });

            setShowAlert({
                variant: "success",
                message: t("orgArchiveSuccess"),
            });
        } catch (error) {
            setShowAlert({
                variant: "danger",
                message: t("orgArchiveError"),
            });
            console.error("Error deleting user(s):", error);
        }
        setDeleteConfirmationModal(false);
        setUserIdToDelete(null);
    };

    const [formData, setFormData] = useState<{
        orgName: string;
        email: string;
        icon: File | null;
    }>({
        orgName: "",
        email: "",
        icon: null,
    });

    interface FormErrors {
        orgName: string;
        email: string;
        icon: string;
    }

    const [formErrors, setFormErrors] = useState<FormErrors>({
        orgName: "",
        email: "",
        icon: "",
    });

    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [fileName, setFileName] = useState("");
    const [showAlert, setShowAlert] = useState<{
        variant: "success" | "danger";
        message: string;
    } | null>(null);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value, files } = e.target;

        setFormData((prevData) => ({
            ...prevData,
            [name]: files ? files[0] : value,
        }));

        setFormErrors((prevErrors) => {
            const newErrors = { ...prevErrors };

            if (name === "orgName") {
                newErrors.orgName = validateOrgName(value);
            }
            if (name === "email") {
                newErrors.email = validateEmail(value);
            }
            if (name === "icon") {
                newErrors.icon = validateIcon(files?.[0] ?? "");
            }

            return newErrors;
        });
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file) {
            setFileUrl(URL.createObjectURL(file));
            setFileName(file.name);

            setFormData((prevData) => ({
                ...prevData,
                icon: file,
            }));

            setFormErrors((prevErrors) => ({
                ...prevErrors,
                icon: validateIcon(file),
            }));
        }
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target?.files?.[0];

        if (file) {
            const allowedTypes = [
                "image/png",
                "image/jpeg",
                "image/jpg",
                "image/gif",
                "image/webp",
                "image/bmp",
                "image/svg+xml",
                "image/tiff",
                "image/x-icon",
                "image/heic",
            ];

            if (!allowedTypes.includes(file.type)) {
                setFormErrors((prevErrors) => ({
                    ...prevErrors,
                    icon: "Only PNG, JPG, JPEG, GIF, WEBP, BMP, SVG, TIFF, ICO, and HEIC images are allowed.",
                }));
                e.target.value = "";
                return;
            }

            setFileUrl(URL.createObjectURL(file));
            setFileName(file.name);

            setFormData((prevData) => ({
                ...prevData,
                icon: file,
            }));

            setFormErrors((prevErrors) => ({
                ...prevErrors,
                icon: "",
            }));
        }
    };

    const validateOrgName = (orgName: string) => {
        if (!orgName) return t("OrgNameValidation1");
        if (orgName.length < 4) return t("OrgNameValidation2");
        if (!isValidInput(orgName)) return t("invalidInput");
        return "";
    };

    const validateEmail = (email: string) => {
        if (!email) return t("emailValidation1");
        if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email))
            return t("emailValidation3");
        return "";
    };

    const validateIcon = (icon: any) => {
        return icon ? "" : t("OrgIconValidation");
    };

    const validateForm = (): FormErrors => {
        const errors: FormErrors = {
            orgName: validateOrgName(formData.orgName.trim()),
            email: validateEmail(formData.email.trim()),
            icon: validateIcon(formData.icon),
        };

        return errors;
    };

    const handleSubmit = async () => {
        // setLoading(false);
        setShowAlert(null);

        const errors = validateForm();
        setFormErrors(errors);

        if (Object.values(errors).some((error) => error)) return;

        try {
            // setLoading(true);
            const formDataObj = new FormData();
            formDataObj.append("orgName", formData.orgName);
            formDataObj.append("email", formData.email);
            setSuperlargeModalSizePreview(false);
            let upload;
            if (formData.icon) {
                let data = await getPresignedApkUrlAction(
                    formData.icon.name,
                    formData.icon.type,
                    formData.icon.size
                );
                formDataObj.append("icon", data.url);
                const taskId = addTask(formData.icon, formData.orgName);
                upload = await uploadFileAction(
                    data.presignedUrl,
                    formData.icon,
                    taskId,
                    updateTask
                );
            }

            if (upload) {
                const createOrg = await createOrgAction(formDataObj);
                fetchOrgs();

                setFormData({ orgName: "", email: "", icon: null });
                setFileUrl(null);
                setFileName("");
            }
        } catch (error: any) {
            setShowAlert({
                variant: "danger",
                message: t("errorMsgOrg"),
            });

            console.error("Error creating organisation:", error);
            setSuperlargeModalSizePreview(false);
            setShowAlert({
                variant: "danger",
                message: error.response.data.message,
            });
            setFormData({ orgName: "", email: "", icon: null });
            setFileUrl(null);
            setFileName("");

            setTimeout(() => {
                setShowAlert(null);
            }, 3000);
        }
    };

    const handleKeyDown = (e: any) => {
        if (e.key === "Enter") {
            handleSubmit();
        }
    };
    const handleDeleteSelected = () => {
        setUserIdToDelete(null);
        setDeleteConfirmationModal(true);
    };

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

    const resetForm = () => {
        setFormData({ orgName: "", email: "", icon: null });
        setFileUrl(null);
        setFileName("");
        setFormErrors({ orgName: "", email: "", icon: "" });
    };

    const reload = () => {
        window.location.reload();
    };
    return (
        <>
            {showAlert && <Alerts data={showAlert} />}

            <div className="flex mt-10 items-center h-10 intro-y">
                <h2 className="mr-5 text-lg font-medium truncate">
                    {t("organisations_list")}
                </h2>
                <a
                    className="flex items-center ml-auto text-primary cursor-pointer dark:text-white"
                    onClick={(e) => {
                        e.preventDefault();
                        reload();
                    }}
                >
                    <Lucide icon="RefreshCcw" className="w-5 h-5 mr-3" />
                </a>
            </div>

            <div className="grid grid-cols-12 gap-6 mt-5">
                <div className="flex flex-wrap items-center col-span-12 mt-2 intro-y sm:flex-nowrap gap-2">
                    <Button
                        as="a"
                        variant="primary"
                        onClick={(event: React.MouseEvent) => {
                            event.preventDefault();
                            setSuperlargeModalSizePreview(true);
                        }}
                        className="mr-0 sm:mr-2 shadow-md addOrgButton w-full sm:w-auto"
                    >
                        {t("add_new_organisation")}
                    </Button>

                    {/* <Button
                        variant="primary"
                        className="mr-0 sm:mr-2 shadow-md w-full sm:w-auto"
                        disabled={selectedOrgs.size === 0}
                        onClick={() => {
                            handleDeleteSelected();
                        }}>
                        {t("bulkArchive_delete")}
                    </Button> */}

                    <Dialog
                        size="xl"
                        open={superlargeModalSizePreview}
                        onClose={() => {
                            setSuperlargeModalSizePreview(false);
                            resetForm();
                        }}
                    >
                        <Dialog.Panel className="p-5 text-center">
                            <a
                                onClick={(event: React.MouseEvent) => {
                                    event.preventDefault();
                                    setSuperlargeModalSizePreview(false);
                                    resetForm();
                                }}
                                className="absolute top-0 right-0 mt-3 mr-3"
                            >
                                <Lucide icon="X" className="w-6 h-6 text-slate-400" />
                            </a>
                            <div className="intro-y box mt-8">
                                <div className="flex flex-col items-center border-b border-slate-200/60 p-2 dark:border-darkmode-400 sm:flex-row p-5">
                                    <h2 className="mr-2 text-base font-medium">
                                        {t("add_new_organisation")}
                                    </h2>
                                </div>
                                <div className="p-5 text-left">
                                    <div className="flex items-center justify-between mt-4">
                                        <FormLabel htmlFor="org-form-1" className="font-bold">
                                            {t("organisation_name")}
                                        </FormLabel>
                                        <span className="text-xs text-gray-500 font-bold ml-2">
                                            {t("required")}
                                        </span>
                                    </div>

                                    <FormInput
                                        id="org-form-1"
                                        type="text"
                                        className={`w-full mb-2 ${clsx({
                                            "border-danger": formErrors.orgName,
                                        })}`}
                                        name="orgName"
                                        placeholder={t("OrgNameValidation")}
                                        value={formData.orgName}
                                        onChange={handleInputChange}
                                        onKeyDown={(e) => handleKeyDown(e)}
                                    />
                                    {formErrors.orgName && (
                                        <p className="text-red-500 text-left text-sm">
                                            {formErrors.orgName}
                                        </p>
                                    )}

                                    <div className="flex items-center justify-between mt-5">
                                        <FormLabel htmlFor="org-form-2" className="font-bold">
                                            {t("organisation_email")}
                                        </FormLabel>
                                        <span className="text-xs text-gray-500 font-bold ml-2">
                                            {t("required")}
                                        </span>
                                    </div>
                                    <FormInput
                                        id="org-form-2"
                                        type="email"
                                        className={`w-full mb-2 ${clsx({
                                            "border-danger": formErrors.email,
                                        })}`}
                                        name="email"
                                        placeholder={t("emailValidation2")}
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        onKeyDown={(e) => handleKeyDown(e)}
                                    />
                                    {formErrors.email && (
                                        <p className="text-red-500 text-left text-sm">
                                            {formErrors.email}
                                        </p>
                                    )}

                                    <div className="flex items-center justify-between mt-5">
                                        <FormLabel
                                            htmlFor="org-form-3"
                                            className="font-bold OrgIconLabel"
                                        >
                                            {t("organisation_icon")}
                                        </FormLabel>
                                        <span className="text-xs text-gray-500 font-bold ml-2">
                                            ({t("required")}, jpg, png, etc.)
                                        </span>
                                    </div>
                                    <div
                                        className={`relative w-full mb-2 p-4 border-2 ${formErrors.icon
                                            ? "border-dotted border-danger"
                                            : "border-dotted border-gray-300"
                                            } rounded flex items-center justify-center h-32 overflow-hidden cursor-pointer dropzone dark:bg-[#272a31]`}
                                        onDrop={handleDrop}
                                        onDragOver={(e) => e.preventDefault()}
                                    >
                                        <input
                                            id="org-form-3"
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 w-full mb-2 h-full opacity-0 cursor-pointer"
                                            onChange={handleFileChange}
                                        />
                                        <label
                                            htmlFor="org-form-3"
                                            className={`cursor-pointer text-center w-full mb-2 font-bold text-gray-500 absolute z-10 transition-transform duration-300 ${fileUrl
                                                ? "top-2 mb-1"
                                                : "top-1/2 transform -translate-y-1/2"
                                                }`}
                                        >
                                            {fileName ? `${t("selected")} ${fileName}` : t("drop")}
                                        </label>
                                        {fileUrl && (
                                            <img
                                                src={fileUrl}
                                                alt="Preview"
                                                className="absolute inset-0 w-full mb-2 h-full object-contain preview-image"
                                            />
                                        )}
                                    </div>
                                    {formErrors.icon && (
                                        <p className="text-red-500 text-sm">{formErrors.icon}</p>
                                    )}

                                    <div className="mt-5 text-right">
                                        <Button
                                            type="button"
                                            variant="primary"
                                            className="w-24"
                                            onClick={handleSubmit}
                                            disabled={loading}
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
                            </div>
                        </Dialog.Panel>
                    </Dialog>

                    <div className="hidden mx-auto md:block text-slate-500">
                        {!loading1 ? (
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
                    <div className="w-full mt-3 sm:w-auto sm:mt-0 sm:ml-auto md:ml-0">
                        <div className="relative w-56 text-slate-500">
                            <FormInput
                                type="text"
                                className="w-56 pr-10 !box  "
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
                                    {t("org_users")}
                                </Table.Th>
                                <Table.Th className="text-center border-b-0 whitespace-nowrap">
                                    {t("action")}
                                </Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {currentOrgs.map((org, key) => (
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
                                            <div className="w-24 h-16 image-fit zoom-in">
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
                                            onClick={() => {
                                                localStorage.setItem("CrumbsOrg", String(org.id));
                                            }}
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
                                    <Table.Td className="box rounded-l-none rounded-r-none border-x-0 text-center shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600">
                                        {org.user_count}
                                    </Table.Td>
                                    <Table.Td
                                        className={clsx([
                                            "box w-56 rounded-l-none rounded-r-none border-x-0 shadow-[5px_3px_5px_#00000005] first:rounded-l-[0.6rem] first:border-l last:rounded-r-[0.6rem] last:border-r dark:bg-darkmode-600",
                                            "before:absolute before:inset-y-0 before:left-0 before:my-auto before:block before:h-8 before:w-px before:bg-slate-200 before:dark:bg-darkmode-400",
                                        ])}
                                    >
                                        <div className="flex items-center justify-center">
                                            {/* Edit Link */}
                                            <Link
                                                onClick={() => {
                                                    localStorage.setItem("CrumbsOrg", String(org.id));
                                                }}
                                                to={`/organisations-settings/${org.id}`}
                                                className="flex items-center mr-3"
                                            >
                                                <Lucide icon="Settings" className="w-4 h-4 mr-1" />{" "}
                                                {t("setting")}
                                            </Link>

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
                                                <Lucide icon="Archive" className="w-4 h-4 mr-1" />{" "}
                                                {t("Archive")}
                                            </a>
                                        </div>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </div>
                {/* END: Data List */}
                {/* BEGIN: Pagination */}

                {filteredOrgs.length > 0 && (
                    <div className="flex flex-wrap items-center col-span-12 intro-y sm:flex-row sm:flex-nowrap">
                        <Pagination className="w-full sm:w-auto sm:mr-auto">
                            {/* First Page Button */}
                            <Pagination.Link onChange={() => handlePageChange(1)}>
                                <Lucide icon="ChevronsLeft" className="w-4 h-4" />
                            </Pagination.Link>

                            {/* Previous Page Button */}
                            <Pagination.Link
                                onChange={() => handlePageChange(currentPage - 1)}
                            >
                                <Lucide icon="ChevronLeft" className="w-4 h-4" />
                            </Pagination.Link>

                            {/* Page Numbers with Ellipsis */}
                            {(() => {
                                const pages = [];
                                const maxPagesToShow = 5; // Number of page links to show (excluding ellipsis)
                                const ellipsisThreshold = 2; // Number of pages to show before/after ellipsis

                                // Always show the first page
                                pages.push(
                                    <Pagination.Link
                                        key={1}
                                        active={currentPage === 1}
                                        onChange={() => handlePageChange(1)}
                                    >
                                        1
                                    </Pagination.Link>
                                );

                                // Show ellipsis if current page is far from the start
                                if (currentPage > ellipsisThreshold + 1) {
                                    pages.push(
                                        <span key="ellipsis-start" className="px-3 py-2">
                                            ...
                                        </span>
                                    );
                                }

                                // Show pages around the current page
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
                                            onChange={() => handlePageChange(i)}
                                        >
                                            {i}
                                        </Pagination.Link>
                                    );
                                }

                                // Show ellipsis if current page is far from the end
                                if (currentPage < totalPages - ellipsisThreshold) {
                                    pages.push(
                                        <span key="ellipsis-end" className="px-3 py-2">
                                            ...
                                        </span>
                                    );
                                }

                                // Always show the last page
                                if (totalPages > 1) {
                                    pages.push(
                                        <Pagination.Link
                                            key={totalPages}
                                            active={currentPage === totalPages}
                                            onChange={() => handlePageChange(totalPages)}
                                        >
                                            {totalPages}
                                        </Pagination.Link>
                                    );
                                }

                                return pages;
                            })()}

                            {/* Next Page Button */}
                            <Pagination.Link
                                onChange={() => handlePageChange(currentPage + 1)}
                            >
                                <Lucide icon="ChevronRight" className="w-4 h-4" />
                            </Pagination.Link>

                            {/* Last Page Button */}
                            <Pagination.Link
                                onChange={() => handlePageChange(totalPages)}
                            >
                                <Lucide icon="ChevronsRight" className="w-4 h-4" />
                            </Pagination.Link>
                        </Pagination>

                        {/* Items Per Page Selector */}
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
                )}

                {/* END: Pagination */}
            </div>
            {/* BEGIN: Delete Confirmation Modal */}
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
                            {t("ReallyArch")}
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
                        >
                            {t("Archive")}
                        </Button>
                    </div>
                </Dialog.Panel>
            </Dialog>
            {/* END: Delete Confirmation Modal */}
        </>
    );
}

export default Main;
