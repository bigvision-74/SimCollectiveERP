import React, { useState, useEffect } from "react";
import Button from "@/components/Base/Button";
import { FormInput, FormLabel, FormSelect } from "@/components/Base/Form";
import clsx from "clsx";
import { t } from "i18next";
import {
  getCategoryAction,
  getInvestigationsAction,
  getInvestigationParamsAction,
  updateInvestigationAction,
  addInvestigationAction,
  deleteInvestigationAction,
} from "@/actions/patientActions";
import { Dialog } from "@/components/Base/Headless";
import { getAdminOrgAction } from "@/actions/adminActions";
import Lucide from "@/components/Base/Lucide";
import { getUserOrgIdAction } from "@/actions/userActions";

// --- INTERFACES ---
interface Category {
  id: number;
  name: string;
  addedBy?: string | number | null;
  status?: string;
}

interface Investigation {
  id: number;
  category: number;
  name: string;
  addedBy?: string | number | null;
  status?: string;
}

interface TestParameter {
  id: number;
  investigation_id: number;
  name: string;
  normal_range: string;
  units: string;
  field_type?: string;
  addedBy?: string | number | null;
  status?: string;
}

interface Selection {
  categoryId: string;
  categoryName: string;
  investigationId: string;
  investigationName: string;
}

interface UserData {
  uid: number;
  role: string;
  org_id: number;
}

const Main = ({ onShowAlert }: { onShowAlert: any }) => {
  // --- STATE ---
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredInvestigations, setFilteredInvestigations] = useState<
    Investigation[]
  >([]);
  const [testParameters, setTestParameters] = useState<TestParameter[]>([]);

  const [selection, setSelection] = useState<Selection>({
    categoryId: "",
    categoryName: "",
    investigationId: "",
    investigationName: "",
  });

  const [editSelection, setEditSelection] = useState({
    categoryName: "",
    investigationName: "",
  });

  const [currentInvestigation, setCurrentInvestigation] =
    useState<Investigation | null>(null);

  // Modal States
  const [deleteType, setDeleteType] = useState<
    "category" | "investigation" | "parameter" | null
  >(null);
  const [deleteId, setDeleteId] = useState<number | string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);
  const [investigationLoading, setInvestigationLoading] = useState(false);

  const [addFormData, setAddFormData] = useState({
    categoryId: "",
    categoryName: "",
    test_name: "",
  });
  const [addFormErrors, setAddFormErrors] = useState({
    category: "",
    test_name: "",
  });

  // --- PERMISSIONS LOGIC ---
  const canEdit = (
    itemAddedBy: string | number | null | undefined
  ): boolean => {
    if (!userData) return false;
    if (userData.role === "Superadmin") return true;
    if (itemAddedBy === null || itemAddedBy === undefined) return false;
    return String(itemAddedBy) === String(userData.uid);
  };

  // --- FETCH DATA ---
  const fetchData = async () => {
    try {
      const userEmail = localStorage.getItem("user");
      if (userEmail) {
        const uData = await getAdminOrgAction(userEmail);
        setUserData({
          uid: uData.uid,
          role: uData.role,
          org_id: uData.organisation_id,
        });
      }
      const categoryData = await getCategoryAction();
      setCategories(Array.isArray(categoryData) ? categoryData : []);
    } catch (error) {
      onShowAlert({ variant: "danger", message: "Failed to load data." });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- HANDLERS ---
  const handleCategoryChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const catId = e.target.value;
    const catObj = categories.find((c) => String(c.id) === catId);

    setSelection({
      categoryId: catId,
      categoryName: catObj ? catObj.name : "",
      investigationId: "",
      investigationName: "",
    });

    // Also update editSelection when category changes
    setEditSelection((prev) => ({
      ...prev,
      categoryName: catObj ? catObj.name : "",
    }));

    setFilteredInvestigations([]);
    setTestParameters([]);
    setCurrentInvestigation(null);

    if (catId) {
      setLoading(true);
      try {
        const data = await getInvestigationsAction(catId);
        setFilteredInvestigations(Array.isArray(data) ? data : []);
      } catch (error) {
        setFilteredInvestigations([]);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleTestChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const testId = e.target.value;
    const invObj = filteredInvestigations.find((i) => String(i.id) === testId);

    if (invObj) {
      setSelection((prev) => ({
        ...prev,
        investigationId: testId,
        investigationName: invObj.name,
      }));
      setEditSelection({
        categoryName: selection.categoryName,
        investigationName: invObj.name,
      });
      setCurrentInvestigation(invObj);

      try {
        setLoading(true);
        const response: any = await getInvestigationParamsAction(invObj.id);
        if (response && Array.isArray(response.data))
          setTestParameters(response.data);
        else if (Array.isArray(response)) setTestParameters(response);
        else setTestParameters([]);
      } catch (error) {
        setTestParameters([]);
      } finally {
        setLoading(false);
      }
    } else {
      setSelection((prev) => ({
        ...prev,
        investigationId: "",
        investigationName: "",
      }));
      setTestParameters([]);
      setCurrentInvestigation(null);
    }
  };

  const saveParameters = async () => {
    if (!selection.investigationId) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("investigation_id", selection.investigationId);
      formData.append("test_name", editSelection.investigationName);
      formData.append("category_name", editSelection.categoryName); 
      formData.append("category_id", selection.categoryId);
      formData.append("parameters", JSON.stringify(testParameters));

      await updateInvestigationAction(formData);

      if (selection.investigationName !== editSelection.investigationName) {
        const updatedList = filteredInvestigations.map((i) =>
          String(i.id) === selection.investigationId
            ? { ...i, name: editSelection.investigationName }
            : i
        );
        setFilteredInvestigations(updatedList);
        setSelection((prev) => ({
          ...prev,
          investigationName: editSelection.investigationName,
        }));
      }

      if (selection.categoryName !== editSelection.categoryName) {
        const updatedCats = categories.map((c) =>
          String(c.id) === selection.categoryId
            ? { ...c, name: editSelection.categoryName }
            : c
        );
        setCategories(updatedCats);
        setSelection((prev) => ({
          ...prev,
          categoryName: editSelection.categoryName,
        }));
      }

      onShowAlert({ variant: "success", message: "Saved successfully!" });
    } catch (error) {
      onShowAlert({ variant: "danger", message: "Failed to save." });
    } finally {
      setLoading(false);
    }
  };

  const submitAddInvestigation = async () => {
    setInvestigationLoading(true);
    const errs = { category: "", test_name: "" };
    if (!addFormData.categoryId && !addFormData.categoryName)
      errs.category = t("SelectOneCategory");
    if (!addFormData.test_name) errs.test_name = t("InvestigationTitle");

    if (errs.category || errs.test_name) {
      setAddFormErrors(errs);
      setInvestigationLoading(false);
      return;
    }

    try {
      const payload = {
        category: showCustomCategoryInput
          ? addFormData.categoryName
          : addFormData.categoryId,
        test_name: addFormData.test_name,
      };
      const result = await addInvestigationAction(payload);
      if (result) {
        if (showCustomCategoryInput) {
          const cats = await getCategoryAction();
          setCategories(Array.isArray(cats) ? cats : []);
        } else if (addFormData.categoryId === selection.categoryId) {
          const data = await getInvestigationsAction(selection.categoryId);
          setFilteredInvestigations(Array.isArray(data) ? data : []);
        }
        setAddModalOpen(false);
        setAddFormData({ categoryId: "", categoryName: "", test_name: "" });
        onShowAlert({ variant: "success", message: "Added successfully" });
      }
    } catch (error) {
      onShowAlert({ variant: "danger", message: "Failed to add" });
    } finally {
      setInvestigationLoading(false);
    }
  };

  const openDeleteModal = (
    type: "category" | "investigation" | "parameter",
    id: string | number
  ) => {
    setDeleteType(type);
    setDeleteId(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId || !deleteType) return;

    const username = localStorage.getItem("user");
    const data1 = await getUserOrgIdAction(username || "");

    try {
      await deleteInvestigationAction({
        type: deleteType,
        id: deleteId,
        performerId: data1.id,
      });

      if (deleteType === "parameter") {
        const response: any = await getInvestigationParamsAction(
          Number(selection.investigationId)
        );
        setTestParameters(
          Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response)
            ? response
            : []
        );
      } else if (deleteType === "investigation") {
        setFilteredInvestigations((prev) =>
          prev.filter((i) => i.id != deleteId)
        );
        setSelection((prev) => ({
          ...prev,
          investigationId: "",
          investigationName: "",
        }));
        setTestParameters([]);
        setCurrentInvestigation(null);
      } else if (deleteType === "category") {
        setCategories((prev) => prev.filter((c) => c.id != deleteId));
        setSelection({
          categoryId: "",
          categoryName: "",
          investigationId: "",
          investigationName: "",
        });
        setFilteredInvestigations([]);
        setTestParameters([]);
        setCurrentInvestigation(null);
      }

      setDeleteModalOpen(false);
      onShowAlert({
        variant: "success",
        message: `${deleteType} deleted successfully`,
      });
    } catch (error) {
      console.error(error);
      onShowAlert({ variant: "danger", message: "Delete failed" });
    }
  };

  const getSelectedCategoryObject = () =>
    categories.find((c) => String(c.id) === selection.categoryId);

  return (
    <>
      <div className="flex flex-col md:flex-row gap-6 p-4">
        <div className="w-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              {t("SelectInvestigations")}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <FormLabel className="font-bold">{t("Category")}</FormLabel>
              <FormSelect
                value={selection.categoryId}
                onChange={handleCategoryChange}
                className="w-full"
              >
                <option value="">{t("select_category")}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </FormSelect>
            </div>
            <div>
              <FormLabel className="font-bold">{t("Test")}</FormLabel>
              <FormSelect
                value={selection.investigationId}
                onChange={handleTestChange}
                disabled={!selection.categoryId}
              >
                <option value="">{t("select_test")}</option>
                {filteredInvestigations.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.name}
                  </option>
                ))}
              </FormSelect>
            </div>
          </div>

          {selection.investigationId && (
            <div className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold whitespace-nowrap">
                    {t("category")}:
                  </span>
                  <div className="flex w-full gap-2">
                    <FormInput
                      type="text"
                      value={editSelection.categoryName}
                      onChange={(e) =>
                        setEditSelection((prev) => ({
                          ...prev,
                          categoryName: e.target.value,
                        }))
                      }
                      disabled={!canEdit(getSelectedCategoryObject()?.addedBy)}
                      className={clsx("w-full", {
                        "bg-gray-100": !canEdit(
                          getSelectedCategoryObject()?.addedBy
                        ),
                      })}
                    />
                    {canEdit(getSelectedCategoryObject()?.addedBy) && (
                      <Button
                        variant="outline-danger"
                        className="px-3"
                        onClick={() =>
                          openDeleteModal("category", selection.categoryId)
                        }
                      >
                        <Lucide icon="Trash2" className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-semibold whitespace-nowrap">
                    {t("TestName")}:
                  </span>
                  <div className="flex w-full gap-2">
                    <FormInput
                      type="text"
                      value={editSelection.investigationName}
                      onChange={(e) =>
                        setEditSelection((p) => ({
                          ...p,
                          investigationName: e.target.value,
                        }))
                      }
                      disabled={!canEdit(currentInvestigation?.addedBy)}
                      className={clsx("w-full", {
                        "bg-gray-100": !canEdit(currentInvestigation?.addedBy),
                      })}
                    />
                    {canEdit(currentInvestigation?.addedBy) && (
                      <Button
                        variant="outline-danger"
                        className="px-3"
                        onClick={() =>
                          openDeleteModal(
                            "investigation",
                            selection.investigationId
                          )
                        }
                      >
                        <Lucide icon="Trash2" className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 border">{t("Namee")}</th>
                      <th className="px-4 py-2 border">{t("normal_range")}</th>
                      <th className="px-4 py-2 border">{t("units")}</th>
                      <th className="px-4 py-2 border">
                        {t("field_type")}
                      </th>{" "}
                      <th className="px-4 py-2 border">{t("actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!Array.isArray(testParameters) ||
                    testParameters.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-2 text-center">
                          {t("No_parameters_found")}
                        </td>
                      </tr>
                    ) : (
                      testParameters.map((param) => {
                        const isEditable = canEdit(param.addedBy);
                        return (
                          <tr key={param.id} className="border-b">
                            <td className="px-4 py-2 border">
                              <FormInput
                                value={param.name}
                                onChange={(e) =>
                                  setTestParameters((prev) =>
                                    prev.map((p) =>
                                      p.id === param.id
                                        ? { ...p, name: e.target.value }
                                        : p
                                    )
                                  )
                                }
                                disabled={!isEditable}
                                className="w-full"
                              />
                            </td>
                            <td className="px-4 py-2 border">
                              <FormInput
                                value={param.normal_range}
                                onChange={(e) =>
                                  setTestParameters((prev) =>
                                    prev.map((p) =>
                                      p.id === param.id
                                        ? { ...p, normal_range: e.target.value }
                                        : p
                                    )
                                  )
                                }
                                disabled={!isEditable}
                                className="w-full"
                              />
                            </td>
                            <td className="px-4 py-2 border">
                              <FormInput
                                value={param.units}
                                onChange={(e) =>
                                  setTestParameters((prev) =>
                                    prev.map((p) =>
                                      p.id === param.id
                                        ? { ...p, units: e.target.value }
                                        : p
                                    )
                                  )
                                }
                                disabled={!isEditable}
                                className="w-full"
                              />
                            </td>

                            <td className="px-4 py-2 border">
                              <FormSelect
                                value={param.field_type || "text"} 
                                onChange={(e) =>
                                  setTestParameters((prev) =>
                                    prev.map((p) =>
                                      p.id === param.id
                                        ? { ...p, field_type: e.target.value }
                                        : p
                                    )
                                  )
                                }
                                disabled={!isEditable}
                                className="w-full"
                              >
                                <option value="text">{t("Text")}</option>
                                <option value="number">{t("Number")}</option>
                                <option value="image">{t("Image")}</option>
                                <option value="dropdown">{t("Dropdown")}</option>
                              </FormSelect>
                            </td>

                            <td className="px-4 py-2 border text-center">
                              <Button
                                variant="outline-danger"
                                size="sm"
                                disabled={!isEditable}
                                onClick={() =>
                                  openDeleteModal("parameter", param.id)
                                }
                                className={clsx(
                                  !isEditable &&
                                    "text-slate-500 border-slate-300 cursor-not-allowed"
                                )}
                              >
                                <Lucide icon="Trash2" className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex justify-end">
                {(canEdit(getSelectedCategoryObject()?.addedBy) ||
                  canEdit(currentInvestigation?.addedBy) ||
                  testParameters.some((p) => canEdit(p.addedBy))) && (
                  <Button
                    variant="primary"
                    onClick={saveParameters}
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
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        size="lg"
      >
        <Dialog.Panel className="p-6">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h3 className="text-lg font-medium">{t("add_Investigation")}</h3>
            <Lucide
              icon="X"
              className="cursor-pointer"
              onClick={() => setAddModalOpen(false)}
            />
          </div>
          <div className="mb-4">
            <FormLabel>{t("Category")}</FormLabel>
            <FormSelect
              name="categoryId"
              value={showCustomCategoryInput ? "other" : addFormData.categoryId}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "other") {
                  setShowCustomCategoryInput(true);
                  setAddFormData((p) => ({ ...p, categoryId: "" }));
                } else {
                  setShowCustomCategoryInput(false);
                  setAddFormData((p) => ({ ...p, categoryId: val }));
                }
              }}
              className="w-full"
            >
              <option value="">{t("SelectCategory")}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              <option value="other">{t("Other")}</option>
            </FormSelect>
            {showCustomCategoryInput && (
              <FormInput
                name="categoryName"
                placeholder={t("EnterCategory")}
                value={addFormData.categoryName}
                onChange={(e) =>
                  setAddFormData((p) => ({
                    ...p,
                    categoryName: e.target.value,
                  }))
                }
                className="mt-2"
              />
            )}
          </div>
          <div className="mb-4">
            <FormLabel>{t("Investigation_title")}</FormLabel>
            <FormInput
              name="test_name"
              value={addFormData.test_name}
              onChange={(e) =>
                setAddFormData((p) => ({ ...p, test_name: e.target.value }))
              }
            />
          </div>
          <div className="flex justify-end">
            <Button
              variant="primary"
              onClick={submitAddInvestigation}
              disabled={investigationLoading}
            >
              {investigationLoading ? "Saving..." : t("save")}
            </Button>
          </div>
        </Dialog.Panel>
      </Dialog>

      <Dialog open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <Dialog.Panel>
          <div className="p-5 text-center">
            <Lucide
              icon="AlertTriangle"
              className="w-16 h-16 mx-auto mt-3 text-danger"
            />
            <div className="mt-5 text-3xl">
              {deleteType === "category"
                ? t("DeleteCategory")
                : deleteType === "investigation"
                ? t("DeleteInvestigation")
                : t("DeleteParameter")}
            </div>
            <div className="mt-2 text-slate-500">
              {deleteType === "category"
                ? t("Thiswilldeletethe")
                : deleteType === "investigation"
                ? t("Thiswilldelete")
                : t("Areyousureyou")}
            </div>
          </div>
          <div className="px-5 pb-8 text-center">
            <Button
              variant="outline-secondary"
              onClick={() => setDeleteModalOpen(false)}
              className="mr-2"
            >
              {t("cancel")}
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              {t("delete")}
            </Button>
          </div>
        </Dialog.Panel>
      </Dialog>
    </>
  );
};

export default Main;
