import _ from "lodash";
import React, { useState, useCallback, useEffect } from "react";
import Button from "@/components/Base/Button";
import { useParams } from "react-router-dom";
import {
  FormInput,
  FormLabel,
  FormCheck,
  FormSelect,
} from "@/components/Base/Form";
import { t } from "i18next";
import {
  getOrgAction,
  saveBaseStorageAction,
} from "@/actions/organisationAction";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import Alerts from "@/components/Alert";
import { fetchSettings, selectSettings } from "@/stores/settingsSlice";
import {
  extendDaysAction,
  savePatientCountAction,
  saveAICreditsAction,
  getAiCreditsAction,
  getUserOrgIdAction,
} from "@/actions/userActions";

interface ComponentProps {
  onAction: (message: string, variant: "success" | "danger") => void;
}

interface User {
  name: string;
  user_deleted: number;
  org_delete: number;
}

const Main: React.FC<ComponentProps> = ({ onAction }) => {
  const { id } = useParams();
  const [orgPlanType, setOrgPlanType] = useState("");
  const [extendDays, setExtendDays] = useState<string>("");
  const [patientsCount, setPatientsCount] = useState("");
  const [aiCredits, setAICredits] = useState("");
  // const [baseStorage, setBaseStorage] = useState("");
  const [isPatients, setIsPatients] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingCredits, setLoadingCredits] = useState<boolean>(false);
  const [storageValue, setStorageValue] = useState("");
  const [storageUnit, setStorageUnit] = useState<"MB" | "GB">("MB");

  const [orgStorage, setOrgStorage] = useState<{
    baseStorage: number;
    used_storage?: number;
  } | null>(null);

  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);

  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchSettings());
  }, [dispatch]);

  const { data } = useAppSelector(selectSettings);

  const fetchOrgs = async () => {
    try {
      if (!id) {
        console.error("ID is undefined");
        return;
      }

      const numericId = Number(id);
      const data = await getOrgAction(numericId);

      if (data) {
        setOrgPlanType(data.planType);

        setOrgStorage({
          baseStorage: Number(data.baseStorage || 0),
          used_storage: Number(data.used_storage || 0),
        });
      }
    } catch (error) {
      console.error("Error fetching organisations:", error);
    }
  };

  const fetchCredits = async () => {
    try {
      if (!id) {
        console.error("ID is undefined");
        return;
      }
      const credits = await getAiCreditsAction(Number(id));
      setAICredits(credits.credits);
    } catch (error) {
      console.error("Error fetching AI credits:", error);
    }
  };

  useEffect(() => {
    fetchOrgs();
    fetchCredits();
  }, []);

  const handlePatientCount = async (patientsCount: Number) => {
    try {
      const username = localStorage.getItem("user");
      const data1 = await getUserOrgIdAction(username || "");
      await savePatientCountAction(patientsCount, Number(id), data1.id);
      setPatientsCount("");
      fetchOrgs();
      onAction(t("updatedSuccessfully"), "success");
      setTimeout(() => setShowAlert(null), 3000);
    } catch (error) {
      console.error("Error extending days:", error);
      onAction(t("updateFailed"), "danger");
      setTimeout(() => setShowAlert(null), 3000);
    }
  };

  const handleAICredits = async (credits: Number) => {
    try {
      setLoadingCredits(true);
      const username = localStorage.getItem("user");
      const userData = await getUserOrgIdAction(username || "");
      await saveAICreditsAction(credits, Number(id), userData.id);
      setAICredits("");
      fetchOrgs();
      fetchCredits();
      onAction(t("creditsUpdatedSuccessfully"), "success");
      setLoadingCredits(false);
      setTimeout(() => setShowAlert(null), 3000);
    } catch (error) {
      console.error("Error saving AI credits:", error);
      onAction(t("creditsUpdateFailed"), "danger");
      setLoadingCredits(false);
      setTimeout(() => setShowAlert(null), 3000);
    }
  };

  const formatStorage = (mb: number) => {
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb} MB`;
  };

  const handleBaseStorage = async (
    storageValue: number,
    storageUnit: "MB" | "GB",
  ) => {
    try {
      if (!orgStorage) return;

      // Convert new storage to MB
      const newStorageInMB =
        storageUnit === "GB" ? storageValue * 1024 : storageValue;

      const existingStorageInMB = orgStorage.baseStorage;

      if (newStorageInMB <= existingStorageInMB) {
        onAction(
          `Your current storage is ${formatStorage(existingStorageInMB)}. 
           You can only increase storage, not reduce it.`,
          "danger",
        );
        return;
      }

      setLoadingCredits(true);

      const username = localStorage.getItem("user");
      const userData = await getUserOrgIdAction(username || "");

      const baseStorageInMB =
        storageUnit === "GB" ? storageValue * 1024 : storageValue;

      await saveBaseStorageAction(baseStorageInMB, Number(id), userData.id);

      setStorageValue("");
      setStorageUnit("MB");

      fetchOrgs();
      fetchCredits();
      onAction(t("baseStorageUpdatedSuccessfully"), "success");
    } catch (error) {
      console.error("Error saving base storage:", error);
      onAction(t("baseStorageUpdateFailed"), "danger");
    } finally {
      setLoadingCredits(false);
      setTimeout(() => setShowAlert(null), 3000);
    }
  };

  const handleExtendDays = async () => {
    try {
      const username = localStorage.getItem("user");
      const data1 = await getUserOrgIdAction(username || "");
      setLoading(true);
      const formDataToSend = new FormData();
      formDataToSend.append("days", extendDays);
      formDataToSend.append("orgId", String(id));
      formDataToSend.append("performerId", data.id);
      await extendDaysAction(formDataToSend);
      setExtendDays("");
      fetchOrgs();
      onAction(t("planSuccess"), "success");
      setLoading(false);
      setTimeout(() => setShowAlert(null), 3000);
    } catch (error) {
      console.error("Error extending days:", error);
      onAction(t("planFail"), "danger");
      setLoading(false);
      setTimeout(() => setShowAlert(null), 3000);
    }
  };

  return (
    <>
      <div className="mt-2">{showAlert && <Alerts data={showAlert} />}</div>
      <div className="overflow-auto lg:overflow-visible">
        {orgPlanType === "free" && (
          <div className="intro-y box">
            <div className="flex items-center p-5 border-b border-slate-200/60 dark:border-darkmode-400">
              <h2 className="mr-auto text-base font-medium">{t("extend")}</h2>
            </div>
            <div className="p-5">
              <div className="relative mt-4 w-full">
                <FormLabel htmlFor="crud-form-org" className="font-bold">
                  {t("days")}
                </FormLabel>
                <FormSelect
                  id="crud-form-org"
                  name="daysSelect"
                  value={extendDays}
                  onChange={(e) => {
                    setExtendDays(e.target.value);
                  }}
                  className={`w-full mb-2`}
                >
                  <option value="" disabled>
                    {t("selectDays")}
                  </option>
                  <option value="15">15 Days</option>
                  <option value="30">30 Days</option>
                  <option value="45">45 Days</option>
                </FormSelect>
              </div>
              <div className="mt-5 text-right">
                <Button
                  type="button"
                  variant="primary"
                  className="w-24"
                  onClick={handleExtendDays}
                  disabled={
                    extendDays === "" || Number(extendDays) < 0 || loading
                  }
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
        )}

        <div className="intro-y box mt-5">
          <div className="flex items-center p-5 border-b border-slate-200/60 dark:border-darkmode-400">
            <h2 className="mr-auto text-base font-medium">
              {t("PatientsCount")}
            </h2>
          </div>
          <div className="p-5">
            <div className="relative mt-4 w-full">
              <FormLabel htmlFor="crud-form-1" className="font-bold">
                {t("noofpatients")}
              </FormLabel>
              <FormInput
                id="crud-form-1"
                type="number"
                name="patientsCount"
                placeholder={t("enternumber")}
                value={patientsCount}
                onChange={(e) => {
                  setPatientsCount(e.target.value);
                  setIsPatients(true);
                }}
              />
            </div>
            <div className="mt-5 text-right">
              <Button
                type="button"
                variant="primary"
                className="w-24"
                disabled={
                  !isPatients ||
                  patientsCount === "" ||
                  Number(patientsCount) < 0
                }
                onClick={() => {
                  handlePatientCount(Number(patientsCount));
                  setIsPatients(false);
                }}
              >
                {t("save")}
              </Button>
            </div>
          </div>
        </div>

        <div className="intro-y box mt-5">
          <div className="flex items-center p-5 border-b border-slate-200/60 dark:border-darkmode-400">
            <h2 className="mr-auto text-base font-medium">{t("aiTokens")}</h2>
          </div>
          <div className="p-5">
            <div className="relative mt-4 w-full">
              <FormLabel htmlFor="crud-form-2" className="font-bold">
                {t("noofcredits")}
              </FormLabel>
              <FormInput
                id="crud-form-2"
                type="number"
                name="aiCredits"
                placeholder={t("enternumber")}
                value={aiCredits}
                onChange={(e) => {
                  setAICredits(e.target.value);
                }}
                min="0"
              />
            </div>
            <div className="mt-5 text-right">
              <Button
                type="button"
                variant="primary"
                className="w-24"
                disabled={
                  !aiCredits ||
                  aiCredits === "" ||
                  Number(aiCredits) < 0 ||
                  loadingCredits
                }
                onClick={() => {
                  handleAICredits(Number(aiCredits));
                }}
              >
                {loadingCredits ? (
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

        {/* <!-- organisation base storage --> */}
        <div className="intro-y box mt-5">
          <div className="flex items-center p-5 border-b border-slate-200/60 dark:border-darkmode-400">
            <h2 className="mr-auto text-base font-medium">
              {t("baseStorage")}
            </h2>
          </div>

          <div className="p-5">
            <FormLabel className="font-bold">{t("addstorage")}</FormLabel>

            <div className="flex gap-3 mt-2">
              <FormInput
                type="number"
                placeholder={t("enterstorage")}
                value={storageValue}
                onChange={(e) => setStorageValue(e.target.value)}
                min="0"
                className="flex-1"
              />

              {/* Unit dropdown */}
              <FormSelect
                value={storageUnit}
                onChange={(e) => setStorageUnit(e.target.value as "MB" | "GB")}
                className="w-28"
              >
                <option value="MB">MB</option>
                <option value="GB">GB</option>
              </FormSelect>
            </div>

            <div className="mt-5 text-right">
              <Button
                type="button"
                variant="primary"
                className="w-24"
                disabled={
                  !storageValue || Number(storageValue) <= 0 || loadingCredits
                }
                onClick={() => {
                  handleBaseStorage(Number(storageValue), storageUnit);
                }}
              >
                {loadingCredits ? (
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
      </div>
    </>
  );
};
export default Main;
