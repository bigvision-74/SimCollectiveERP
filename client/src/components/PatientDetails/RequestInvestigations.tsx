import React, { useEffect, useState } from "react";
import {
  getInvestigationsAction,
  saveRequestedInvestigationsAction,
  getRequestedInvestigationsByIdAction,
} from "@/actions/patientActions";
import { getAdminOrgAction } from "@/actions/adminActions";
import { FormLabel, FormCheck } from "@/components/Base/Form";
import Button from "@/components/Base/Button";
import Alerts from "@/components/Alert";
import { t } from "i18next";

interface Investigation {
  id: number;
  category: string;
  test_name: string;
  status: string;
}

interface SavedInvestigation {
  category: string;
  testName: string;
  status: string;
}

interface Props {
  data: { id: number };
}

const RequestInvestigations: React.FC<Props> = ({ data }) => {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [groupedTests, setGroupedTests] = useState<
    Record<string, Investigation[]>
  >({});
  const [selectedTests, setSelectedTests] = useState<Investigation[]>([]);
  const [savedInvestigations, setSavedInvestigations] = useState<
    SavedInvestigation[]
  >([]);
  const [userId, setUserId] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userEmail = localStorage.getItem("user");
        const userData = await getAdminOrgAction(String(userEmail));
        setUserId(userData.uid);
        setUserRole(userData.role);

        const [allTests, savedResponse] = await Promise.all([
          getInvestigationsAction(),
          getRequestedInvestigationsByIdAction(data.id),
        ]);

        const savedData = savedResponse.data || [];
        // setSavedInvestigations(savedData);

        setInvestigations(allTests);
        setSavedInvestigations(savedData || []);

        const preSelected = allTests.filter(
          (test: { category: any; test_name: any }) =>
            savedData.some(
              (saved: { category: any; testName: any }) =>
                saved.category === test.category &&
                saved.testName === test.test_name
            )
        );
        setSelectedTests(preSelected);

        const grouped: Record<string, Investigation[]> = {};
        allTests.forEach((item: Investigation) => {
          if (!grouped[item.category]) grouped[item.category] = [];
          grouped[item.category].push(item);
        });
        setGroupedTests(grouped);
      } catch (err) {
        console.error("Fetch failed", err);
      }
    };
    fetchData();
  }, [data.id]);

  const toggleSelection = (test: Investigation) => {
    setSelectedTests((prev) =>
      prev.find((t) => t.id === test.id)
        ? prev.filter((t) => t.id !== test.id)
        : [...prev, test]
    );
  };

  const handleSave = async () => {
    if (!userId || selectedTests.length === 0) return;

    try {
      const payload = selectedTests.map((test) => ({
        patient_id: data.id,
        request_by: userId,
        category: test.category,
        test_name: test.test_name,
        status: "pending",
      }));

      await saveRequestedInvestigationsAction(payload);
      setShowAlert({
        variant: "success",
        message: "Request sent successfully",
      });
      setTimeout(() => setShowAlert(null), 3000);
    } catch (err) {
      console.error("Save failed", err);
      setShowAlert({
        variant: "danger",
        message: "Failed to send request. Try again.",
      });
      setTimeout(() => setShowAlert(null), 3000);
    }
  };

  const renderCheckboxGroup = (category: string, tests: Investigation[]) => (
    <div key={category} className="mb-6">
      <h3 className="font-semibold border-b pb-1 mb-3 text-gray-700">
        {category}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {tests.map((test) => {
          const isChecked = selectedTests.some((t) => t.id === test.id);
          const isDisabled = userRole === "User";

          return (
            <FormLabel
              key={test.id}
              className={`flex items-center space-x-2 text-sm ${
                isDisabled ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              <FormCheck.Input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleSelection(test)}
                disabled={isDisabled}
                className="text-primary-600 form-checkbox rounded border-gray-300"
              />
              <span>{test.test_name}</span>
            </FormLabel>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-4 bg-white rounded shadow">
      {showAlert && <Alerts data={showAlert} />}
      <h2 className="text-lg font-semibold mb-4 text-gray-800">
        {t("request_investigations")}
      </h2>

      {Object.entries(groupedTests).map(([category, tests]) =>
        renderCheckboxGroup(category, tests)
      )}

      {userRole !== "User" && (
        <div className="mt-6">
          <Button
            className="bg-primary text-white"
            onClick={handleSave}
            disabled={selectedTests.length === 0}
          >
            {t("save_selected")}
          </Button>
        </div>
      )}
    </div>
  );
};

export default RequestInvestigations;
