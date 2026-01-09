import React, { useState, useEffect } from "react";
import {
  requestedParametersAction,
  manageRequestAction,
} from "@/actions/patientActions";
import Button from "@/components/Base/Button";
import Lucide from "@/components/Base/Lucide";
import { t } from "i18next";

// --- TypeScript Interfaces ---
interface Parameter {
  id: number;
  name: string;
  // Updated to reflect JSON data where state can be null, 'requested', etc.
  state: "requested" | "approved" | "active" | null | string;
  [key: string]: any;
}

interface Investigation {
  id: number;
  test_name: string;
  state: "requested" | "approved" | "active" | null | string;
  parameters: Parameter[];
  [key: string]: any;
}

interface CategoryData {
  category: string;
  id: string;
  state: "requested" | "approved" | "required" | null | string;
  investigations: Investigation[];
}

interface ComponentProps {
  onShowAlert: (alert: {
    variant: "success" | "danger";
    message: string;
  }) => void;
}

// --- Parameter Item ---
const ParameterItem: React.FC<{
  parameter: Parameter;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
}> = ({ parameter, onApprove, onReject }) => (
  <div className="flex items-center justify-between border-t py-1 px-5">
    <div className="flex flex-col">
      <span className="text-sm font-medium">{parameter.name}</span>
      {/* Optional: Show status badge if not requested, for clarity */}
      {parameter.state !== "requested" && parameter.state && (
        <span className="text-[10px] text-slate-400 capitalize">
          {parameter.state}
        </span>
      )}
    </div>

    {/* --- CHANGE HERE: Only show buttons if state is 'requested' --- */}
    {parameter.state === "requested" && (
      <div className="flex gap-1">
        <button
          onClick={() => onReject(parameter.id)}
          className="p-2 text-red-500 transition-colors hover:bg-red-50 rounded"
          title="Reject parameter"
        >
          <Lucide icon="X" bold className="h-4 w-4" />
        </button>
        <button
          onClick={() => onApprove(parameter.id)}
          className="p-1.5 text-primary transition-colors hover:bg-violet-50 rounded"
          title="Approve parameter"
        >
          <Lucide icon="Check" bold className="h-4 w-4" />
        </button>
      </div>
    )}
  </div>
);

// --- Investigation Box ---
const InvestigationBox: React.FC<{
  investigation: Investigation;
  onApproveInvestigation: (id: number) => void;
  onRejectInvestigation: (id: number) => void;
  onApproveParameter: (id: number) => void;
  onRejectParameter: (id: number) => void;
}> = (props) => {
  // Default expanded if the investigation itself is requested
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    investigation,
    onApproveInvestigation,
    onRejectInvestigation,
    onApproveParameter,
    onRejectParameter,
  } = props;

  const hasParameters = investigation.parameters?.length > 0;

  return (
    <div className="box bg-gray-100 border border-gray-200">
      <div className="flex items-center justify-between p-2">
        <div className="flex items-center gap-3">
          <div className={`w-1.5 h-8 rounded-full bg-primary`}></div>
          <div>
            <span className="font-semibold block">
              {investigation.test_name}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {/* Expand/Collapse Button */}
          {hasParameters && (
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Lucide
                icon={isExpanded ? "ChevronUp" : "ChevronDown"}
                className="h-4 w-4"
              />
            </Button>
          )}

          {investigation.state === "requested" && (
            <>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => onRejectInvestigation(investigation.id)}
              >
                {t("Reject")}
              </Button>
              <Button
                variant="soft-primary"
                size="sm"
                onClick={() => onApproveInvestigation(investigation.id)}
              >
                {t("Approve")}
              </Button>
            </>
          )}
        </div>
      </div>

      {isExpanded && hasParameters && (
        <div className="bg-white mx-2 mb-2 rounded border border-gray-100">
          {investigation.parameters.map((parameter) => (
            <ParameterItem
              key={parameter.id}
              parameter={parameter}
              onApprove={onApproveParameter}
              onReject={onRejectParameter}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// --- Category Box ---
const CategoryBox: React.FC<{
  category: CategoryData;
  onCategoryAction: (action: "approve" | "reject", id: string) => void;
  onInvestigationAction: (action: "approve" | "reject", id: number) => void;
  onParameterAction: (action: "approve" | "reject", id: number) => void;
}> = ({
  category,
  onCategoryAction,
  onInvestigationAction,
  onParameterAction,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasInvestigations = category.investigations.length > 0;

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      {/* Category Header */}
      <div
        className={`p-4 ${
          isExpanded && hasInvestigations ? "border-b border-dashed" : ""
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center border border-violet-100">
              <Lucide icon="Folder" className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                {category.category}
              </h3>
              <p className="text-xs text-slate-500">
                {category.investigations.length} items
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {category.state === "requested" && (
              <div className="flex gap-2 mr-2 border-r pr-2">
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => onCategoryAction("reject", category.id)}
                >
                  {t("RejectCategory")}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onCategoryAction("approve", category.id)}
                >
                  {t("ApproveCategory")}
                </Button>
              </div>
            )}

            {hasInvestigations && (
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <Lucide
                  icon={isExpanded ? "ChevronUp" : "ChevronDown"}
                  className="h-4 w-4"
                />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Investigations Grid */}
      {isExpanded && hasInvestigations && (
        <div className="p-4 bg-slate-50/50">
          <div className="grid gap-4">
            {category.investigations.map((investigation) => (
              <InvestigationBox
                key={investigation.id}
                investigation={investigation}
                onApproveInvestigation={(id) =>
                  onInvestigationAction("approve", id)
                }
                onRejectInvestigation={(id) =>
                  onInvestigationAction("reject", id)
                }
                onApproveParameter={(id) => onParameterAction("approve", id)}
                onRejectParameter={(id) => onParameterAction("reject", id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Main: React.FC<ComponentProps> = ({ onShowAlert }) => {
  const [data, setData] = useState<CategoryData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await requestedParametersAction();
        if (result.success) {
          setData(result.data);
        } else {
          onShowAlert({
            variant: "danger",
            message: result.message || t("Failedtofetchdata"),
          });
        }
      } catch (error) {
        onShowAlert({
          variant: "danger",
          message: t("erroroccurredwhile"),
        });
      } finally {
      }
    };
    fetchData();
  }, [onShowAlert]);

  const handleAction = async (
    action: "approve" | "reject",
    type: "category" | "investigation" | "parameter",
    id: number | string
  ) => {
    try {
      const result = await manageRequestAction(type, String(id), action);

      const isSuccess = result?.success || result?.data?.success;
      if (!isSuccess) {
        const errorMsg =
          result?.message ||
          result?.data?.message ||
          "Operation failed unexpectedly.";
        onShowAlert({ variant: "danger", message: errorMsg });
        return;
      }

      const message = result?.message || `${type} ${action}ed successfully`;
      let updatedData = [...data];

      if (type === "category") {
        updatedData = data.filter((cat) => String(cat.id) !== String(id));
      }

      if (type === "investigation") {
        updatedData = data
          .map((cat) => {
            const hasTargetInv = cat.investigations.some(
              (inv) => String(inv.id) === String(id)
            );

            const remainingInvestigations = cat.investigations.filter(
              (inv) => String(inv.id) !== String(id)
            );

            let newCategoryState = cat.state;
            if (hasTargetInv && action === "approve") {
              newCategoryState = "approved";
            }

            return {
              ...cat,
              state: newCategoryState,
              investigations: remainingInvestigations,
            };
          })
          .filter(
            (cat) =>
              cat.investigations.length > 0 ||
              cat.state === "requested"
          );
      }

      if (type === "parameter") {
        updatedData = data
          .map((cat) => ({
            ...cat,
            investigations: cat.investigations
              .map((inv) => ({
                ...inv,
                parameters: inv.parameters.filter(
                  (p) => String(p.id) !== String(id)
                ),
              }))
              .filter(
                (inv) => inv.parameters.length > 0 || inv.state === "requested"
              ),
          }))
          .filter(
            (cat) => cat.investigations.length > 0 || cat.state === "requested"
          );
      }

      setData(updatedData);
      onShowAlert({ variant: "success", message });
    } catch (error) {
      console.error("Handle Action Error:", error);
      onShowAlert({
        variant: "danger",
        message: t("Anunexpected"),
      });
    }
  };

  return (
    <div className="space-y-6">
      {data.length > 0 ? (
        data.map((category, index) => (
          <CategoryBox
            key={`${category.category}-${index}`}
            category={category}
            onCategoryAction={(action, cat) =>
              handleAction(action, "category", cat)
            }
            onInvestigationAction={(action, id) =>
              handleAction(action, "investigation", id)
            }
            onParameterAction={(action, id) =>
              handleAction(action, "parameter", id)
            }
          />
        ))
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border">
          <Lucide
            icon="CheckCircle"
            className="h-12 w-12 text-green-500 mx-auto mb-4"
          />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            {t("AllCaught")}
          </h3>
          <p className="text-slate-600">
            {t("Nopending")}
          </p>
        </div>
      )}
    </div>
  );
};

export default Main;
