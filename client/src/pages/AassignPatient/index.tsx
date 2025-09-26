import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getAllPatientsAction,
  getAssignedPatientsAction,
  assignPatientAction,
  getPatientsByUserOrgAction,
} from "@/actions/patientActions";
import { getAdminOrgAction } from "@/actions/adminActions";
import Button from "@/components/Base/Button";
import Alerts from "@/components/Alert";
import { t } from "i18next";
import { motion, AnimatePresence } from "framer-motion";
import { FormInput } from "@/components/Base/Form";

interface Patient {
  id: number;
  name: string;
  email: string;
  phone: string;
  gender: string;
  category: string;
}

function AssignPatient() {
  const { id: userId } = useParams();
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [selectedPatients, setSelectedPatients] = useState<Patient[]>([]);
  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [all, assigned] = await Promise.all([
          getPatientsByUserOrgAction(parseInt(userId || "0")),
          getAssignedPatientsAction(parseInt(userId || "0")),
        ]);

        setAllPatients(all);
        setSelectedPatients(assigned);
      } catch (error) {
        console.error("Error loading patients:", error);
        setShowAlert({
          variant: "danger",
          message: t("Failedloadpatientdata"),
        });
        setTimeout(() => setShowAlert(null), 3000);
      }
    };

    fetchData();
  }, [userId]);

  const handleSelect = (p: Patient) => {
    if (selectedPatients.some((ap) => ap.id === p.id)) return;
    setSelectedPatients((prev) => [...prev, p]);
  };

  const handleRemove = (id: number) => {
    setSelectedPatients((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAssign = async () => {
    setLoading(false);
    const ids = selectedPatients.map((p) => p.id);
    const userEmail = localStorage.getItem("user");

    // if (Object.values(errors).some((error) => error)) return;
    //
    try {
      setLoading(true);
      const userData = await getAdminOrgAction(String(userEmail));
      await assignPatientAction(parseInt(userId || "0"), ids, userData.uid);
      setShowAlert({
        variant: "success",
        message: t("Patientsassignedsuccessfully"),
      });
      setTimeout(() => setShowAlert(null), 3000);
    } catch (error) {
      console.error("Error assigning patients:", error);
      setShowAlert({
        variant: "danger",
        message: t("FailedassignPleaseagain"),
      });
      setTimeout(() => setShowAlert(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const availablePatients = allPatients
    .filter((p) => !selectedPatients.some((sel) => sel.id === p.id))
    .filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.phone.includes(search) ||
        p.category.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <>
      <div className="p-6">
        {showAlert && <Alerts data={showAlert} />}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Available Patients */}
          <div className="bg-white dark:bg-darkmode-600 shadow rounded-xl p-5">
            <h2 className="text-xl font-bold mb-4">
              {t("available_patients")}
            </h2>
            <FormInput
              type="text"
              placeholder={t("search_patients")}
              className="mb-4 p-2 border w-full rounded-md"
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto">
              <AnimatePresence>
                {availablePatients.length > 0 ? (
                  availablePatients.map((p) => (
                    <motion.div
                      key={p.id}
                      className="border p-3 rounded-lg shadow-sm hover:shadow-md flex justify-between items-center"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <div>
                        <h4 className="font-semibold">{p.name}</h4>
                        <p className="text-xs text-gray-600">
                          {t("Gender")}:- {p.gender}
                        </p>
                        <p className="text-xs text-gray-600">
                          {t("PhoneNo")}:- {p.phone}
                        </p>
                        <p className="text-xs text-gray-600">
                          {t("Category")}:- {p.category}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleSelect(p)}
                        disabled={selectedPatients.some((ap) => ap.id === p.id)}
                      >
                        {t("add")}
                      </Button>
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    className="text-center text-gray-500 py-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {t("no_patients_found_for_this_organization")}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Selected Patients */}
          <div className="bg-white dark:bg-darkmode-600 shadow rounded-xl p-5">
            <h2 className="text-xl font-bold mb-4">
              {t("selected_patients")}{" "}
              <span className="text-sm text-gray-400">
                ({selectedPatients.length})
              </span>
            </h2>
            <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto">
              <AnimatePresence>
                {selectedPatients.map((p) => (
                  <motion.div
                    key={p.id}
                    className="border p-3 rounded-lg shadow-sm flex justify-between items-center"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                  >
                    <div>
                      <h4 className="font-semibold">{p.name}</h4>
                      <p className="text-sm text-gray-600">
                        {p.gender} • {p.phone}
                      </p>
                      <p className="text-xs text-gray-400">{p.category}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleRemove(p.id)}
                    >
                      {t("Remove")}
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            {/* {selectedPatients.length > 0 && (
              <Button
                className=" text-white bg-primary mt-5 w-full"
                onClick={handleAssign}
              >
                {t("assign_patients")}
              </Button>
            )} */}

            {selectedPatients.length > 0 && (
              <Button
                type="button"
                variant="primary"
                className="w-full mt-5 text-white bg-primary"
                onClick={handleAssign}
                disabled={loading}
              >
                {loading ? (
                  <div className="loader">
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                  </div>
                ) : (
                  t("assign_patients")
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default AssignPatient;
