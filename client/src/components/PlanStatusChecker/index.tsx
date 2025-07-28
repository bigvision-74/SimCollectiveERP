// components/PlanStatusChecker.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SubscriptionModal from "../SubscriptionModal.tsx";
import { getAdminOrgAction } from "@/actions/adminActions.js";

const PlanStatusChecker = ({ children }: { children: React.ReactNode }) => {
  const [subscriptionPlan, setSubscriptionPlan] = useState("Free");
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [planStatus, setPlanStatus] = useState<"active" | "expired" | "trial">(
    "active"
  );
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const user = localStorage.getItem("role");
  const useremail = localStorage.getItem("user");
  const close = "False";

  const fetchOrganizationData = async () => {
    try {
      const org = await getAdminOrgAction(String(useremail));
      setSubscriptionPlan(org.planType || "Free");
      setCreatedAt(org.created_at);

      if (
        (org.planType == "Free" || org.planType != "Stopped") &&
        org.created_at
      ) {
        const creationDate = new Date(org.created_at);

        const currentDate = new Date();
        const daysDifference = Math.floor(
          (currentDate.getTime() - creationDate.getTime()) /
            (1000 * 60 * 60 * 24)
        );

        if (daysDifference > 30) {
          setPlanStatus("expired");
          setShowUpsellModal(true);
        } else {
          setPlanStatus("trial");
        }
      } else if (org.planType != "Free" || org.planType != "Stopped") {
        setPlanStatus("active");
      }
    } catch (error) {
      console.error("Error fetching organization data:", error);
      setPlanStatus("active");
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrganizationData();
    }
  }, [user, useremail]);

  const closeUpsellModal = () => {
    setShowUpsellModal(false);
  };

  if (user && planStatus === "expired") {
    return (
      <div className="relative">
        <div className="blur-sm pointer-events-none">{children}</div>
        <SubscriptionModal
          isOpen={showUpsellModal}
          onClose={closeUpsellModal}
          currentPlan={subscriptionPlan}
          close={close}
        />
      </div>
    );
  }

  return <>{children}</>;
};

export default PlanStatusChecker;
