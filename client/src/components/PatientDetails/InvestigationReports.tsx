import { useEffect, useState } from "react";
import Table from "@/components/Base/Table";
import { getInvestigationReportsAction, getUserReportsListByIdAction } from "@/actions/patientActions";
import Lucide from "@/components/Base/Lucide";
import Button from "@/components/Base/Button";

interface UserTest {
  id: number;
  name: string;
  category: string;
  test_name: string;
  investigation_id: string;
  parameter_id: string;
  patient_id: string;
  value: string;
}

function PatientDetailTable({ patientId }: { patientId: string }) {
  const [userTests, setUserTests] = useState<UserTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTest, setSelectedTest] = useState<UserTest | null>(null);
  const [testDetails, setTestDetails] = useState<any[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  const fetchPatientReports = async (id: string) => {
    try {
      setLoading(true);
      const data = await getUserReportsListByIdAction(Number(id));
      setUserTests(data || []);
    } catch (error) {
      console.error("Failed to fetch patient test reports:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) {
      fetchPatientReports(patientId);
    }
  }, [patientId]);

  const getInvestigationParamsById = async (id: number) => {
    try {
      setLoading(true);
      const data = await getInvestigationReportsAction(id);
      setTestDetails(data);
      setShowDetails(true);
    } catch (error) {
      console.error("Error fetching test details", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5 rounded-md box">
      {!showDetails ? (
        <Table className="border-spacing-y-[10px] border-separate -mt-2">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>#</Table.Th>
              <Table.Th>Patient Name</Table.Th>
              <Table.Th className="text-center">Category</Table.Th>
              <Table.Th className="text-center">Test Name</Table.Th>
              <Table.Th className="text-center">Action</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {userTests.length > 0 ? (
              userTests.map((test, index) => (
                <Table.Tr key={test.id} className="intro-x">
                  <Table.Td>{index + 1}</Table.Td>
                  <Table.Td>{test.name}</Table.Td>
                  <Table.Td className="text-center">{test.category}</Table.Td>
                  <Table.Td className="text-center">{test.test_name}</Table.Td>
                  <Table.Td className="text-center">
                    <Lucide
                      icon="Eye"
                      className="w-4 h-4 cursor-pointer inline-block"
                      onClick={() => {
                        setSelectedTest(test);
                        getInvestigationParamsById(
                          Number(test.investigation_id)
                        );
                      }}
                    />
                  </Table.Td>
                </Table.Tr>
              ))
            ) : (
              <Table.Tr>
                <Table.Td colSpan={5} className="text-center py-4">
                  No test records available.
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      ) : (
        <div>
          <div className="flex justify-between mb-4">
            <h3 className="text-lg font-semibold text-primary">
              {selectedTest?.test_name}
            </h3>
            <Button onClick={() => setShowDetails(false)} variant="primary">
              Back
            </Button>
          </div>
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
              {testDetails.map((param) => (
                <tr key={param.id} className="bg-white hover:bg-slate-50">
                  <td className="px-4 py-2 border">{param.name}</td>
                  <td className="px-4 py-2 border">{param.value}</td>
                  <td className="px-4 py-2 border">{param.normal_range}</td>
                  <td className="px-4 py-2 border">{param.units}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default PatientDetailTable;
