import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { t } from "i18next";
import Lucide from "@/components/Base/Lucide";
import Alerts from "@/components/Alert";
import { Disclosure } from "@/components/Base/Headless";
import {
  getPatientRequestsAction,
  getCategoryAction,
  getInvestigationParamsAction,
  submitInvestigationResultsAction,
} from "@/actions/patientActions";
import {
  FormInput,
  FormCheck,
  FormLabel,
  FormTextarea,
  FormSelect,
} from "@/components/Base/Form";
import Button from "@/components/Base/Button";

type InvestigationItem = {
  id: number;
  patient_id: string;
  request_by: string;
  test_name: string;
  category: string;
  investCategory: string;
  status: string;
  created_at: string;
  updated_at: string;
  investId: number;
  // from joined patient_records
  name: string;
  email: string;
  phone: string;
  gender: string;
  date_of_birth: string;
  organisation_id: string;
};

interface TestParameter {
  id: number;
  name: string;
  normal_range: string;
  units: string;
  test_name: string;
  value: string;
  category: string;
  created_at: string;
  updated_at: string;
  investId: number;
  investigation_id: string;
}

function ViewPatientDetails() {
  const { id } = useParams();
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [testDetails, setTestDetails] = useState<TestParameter[]>([]);
  const [categories, setCatories] = useState<InvestigationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);
  const [openIndex, setOpenIndex] = useState(0);
  const [hasInitialized, setHasInitialized] = useState(false);
  const fetchPatient = async () => {
    try {
      const PatientRequest = await getPatientRequestsAction(Number(id));
      console.log(PatientRequest, "PatientRequestPatientRequest");

      setCatories(PatientRequest);
    } catch (error) {
      console.error("Error fetching patient", error);
    }
  };

  const getInvestigationParamsById = async (id: number) => {
    try {
      const data = await getInvestigationParamsAction(id);
      console.log(id, "idididid");
      console.log(data, "Fetched Test Details");
      setTestDetails(data);
    } catch (error) {
      console.error("Error fetching investigation params", error);
    }
  };

  const handleSubmit = async () => {
    setLoading(false);
    setShowAlert(null);
    setLoading(true);
    try {
      const payload = testDetails.map((param) => ({
        investigation_id: param.investigation_id,
        patient_id: id,
        parameter_id: param.id,
        value: param.value || "",
      }));
      const createCourse = await submitInvestigationResultsAction({ payload });

      if (createCourse) {
        //   setFormData({
        //     category: "",
        //     test_name: "",
        //   });
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (error) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
    // }
  };
  const uniqueCategories = Array.from(
    new Set(categories.map((cat) => cat.investCategory))
  ).sort();

  useEffect(() => {
    if (
      !hasInitialized &&
      categories.length > 0 &&
      uniqueCategories.length > 0
    ) {
      const firstCategory = uniqueCategories[0];
      const firstTest = categories.find(
        (cat) => cat.investCategory === firstCategory
      );

      if (firstTest) {
        setSelectedTest(firstTest);
        getInvestigationParamsById(firstTest.investId);
        setHasInitialized(true);
      }
    }
  }, [categories, uniqueCategories, hasInitialized]);

  useEffect(() => {
    fetchPatient();

    // restore selected tab from localStorage
    const savedTab = localStorage.getItem("selectedPick");
    if (savedTab) {
    }
  }, []);

  return (
    <>
      <div className="mt-2">{showAlert && <Alerts data={showAlert} />}</div>

      <div className="flex flex-col items-center mt-8 intro-y sm:flex-row">
        <h2 className="mr-auto text-lg font-medium">{t("patient_report")}</h2>
      </div>

      <div className="grid grid-cols-11 gap-5 mt-5 intro-y">
        {/* Sidebar */}
        <div className="col-span-12 lg:col-span-4 2xl:col-span-3">
          <div className="rounded-md box">
            <div className="p-5 space-y-2">
              {uniqueCategories.map((investCategory, index) => {
                const key = investCategory.replace(/\s+/g, "");
                const itemsInCategory = categories.filter(
                  (cat) => cat.investCategory === investCategory
                );

                const isOpen = openIndex === index;

                return (
                  <Disclosure.Group variant="boxed" key={key}>
                    <Disclosure defaultOpen={isOpen}>
                      {({ open }) => (
                        <>
                          <Disclosure.Button
                            onClick={() => setOpenIndex(open ? -1 : index)}
                            className="w-full text-left"
                          >
                            {investCategory}
                          </Disclosure.Button>
                          {open && (
                            <Disclosure.Panel className="leading-relaxed text-slate-600 dark:text-slate-500">
                              <ul className="list-disc ml-6">
                                {itemsInCategory.map((item) => (
                                  <li
                                    key={item.id}
                                    className="cursor-pointer hover:text-primary"
                                    onClick={() => {
                                      setSelectedTest(item);
                                      getInvestigationParamsById(item.investId);
                                    }}
                                  >
                                    {item.test_name}
                                  </li>
                                ))}
                              </ul>
                            </Disclosure.Panel>
                          )}
                        </>
                      )}
                    </Disclosure>
                  </Disclosure.Group>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="col-span-12 lg:col-span-7 2xl:col-span-8">
          <div className="p-5 rounded-md box">
            {selectedTest && testDetails?.length > 0 && (
              <div className="p-4 rounded-lg bg-white">
                <h3 className="mb-4 text-lg font-semibold text-primary">
                  {selectedTest.test_name}
                </h3>

                <div className="space-y-4">
                  <table className="min-w-full border text-sm text-left">
                    <thead className="bg-slate-100 text-slate-700 font-semibold">
                      <tr>
                        <th className="px-4 py-2 border">Parameter Name</th>
                        <th className="px-4 py-2 border">Value</th>
                        <th className="px-4 py-2 border">Normal Range</th>
                        <th className="px-4 py-2 border">Units</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testDetails?.map((param, index) => (
                        <tr
                          key={param.id}
                          className="bg-white hover:bg-slate-50"
                        >
                          <td className="px-4 py-2 border">{param.name}</td>
                          <td className="px-4 py-2 border">
                            <FormInput
                              type="text"
                              value={param.value || ""}
                              onChange={(e) => {
                                const updated = [...testDetails];
                                updated[index] = {
                                  ...updated[index],
                                  value: e.target.value,
                                };
                                setTestDetails(updated);
                              }}
                              className="w-full p-1 border rounded"
                            />
                          </td>
                          <td className="px-4 py-2 border">
                            {param.normal_range}
                          </td>
                          <td className="px-4 py-2 border">{param.units}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="mt-5 text-right">
                    <Button
                      type="button"
                      variant="primary"
                      className="w-42"
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
                        t("push_result")
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default ViewPatientDetails;
