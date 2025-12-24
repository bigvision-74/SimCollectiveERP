import {
  selectTheme,
  getTheme,
  setTheme,
  themes,
  Themes,
} from "@/stores/themeSlice";
import React, { useState, useEffect } from "react"; 
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { useLocation, Navigate } from "react-router-dom";
import { useAppContext } from "@/contexts/sessionContext";
import LoadingDots from "@/components/LoadingDots/LoadingDots";
import SubscriptionModal from "@/components/SubscriptionModal.tsx";
import { getAdminOrgAction } from "@/actions/adminActions";

interface User {
  planType: string;
  PlanEnd: string;
  planDate: string;
}

function Main() {

  const username = localStorage.getItem("user");
  const userRole = localStorage.getItem("role");
  const dispatch = useAppDispatch();
  const theme = useAppSelector(selectTheme);
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [user1, setUser] = useState<User>({
    planType: "",
    PlanEnd: "",
    planDate: "",
  });
  const { user, sessionInfo, isLoading } = useAppContext();
  const { search, pathname } = useLocation();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        if (username) {
          const org = await getAdminOrgAction(username);
          setUser(org);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, [username]);

  useEffect(() => {
    if (queryParams.get("theme")) {
      const selectedTheme = themes.find(
        (theme) => theme.name === queryParams.get("theme")
      );
      if (selectedTheme) {
        switchTheme(selectedTheme.name);
      }
    }
  }, [search]);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let expiryDate = null;

    if (userRole !== "Superadmin" && userRole !== "Administrator") {
      if (user1.PlanEnd) {
        expiryDate = new Date(user1.PlanEnd);
      } else if (user1.planDate) {
        expiryDate = new Date(user1.planDate);

        if (user1.planType === "free") {
          expiryDate.setMonth(expiryDate.getMonth() + 1);
        } else if (user1.planType === "1 Year Licence") {
          expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        } else if (user1.planType === "5 Year Licence") {
          expiryDate.setFullYear(expiryDate.getFullYear() + 5);
        } else {
          expiryDate.setDate(expiryDate.getDate() + 30);
        }
      }

      if (expiryDate) {
        expiryDate.setHours(0, 0, 0, 0);
        if (expiryDate < today) {
          setShowUpsellModal(true);
        }
      }
    }
  }, [user1.PlanEnd, user1.planDate, user1.planType, userRole]);

  const queryParams = new URLSearchParams(search);
  const close = "False";
  const logout = "True";

  const switchTheme = (theme: Themes["name"]) => {
    dispatch(setTheme(theme));
  };

  if (isLoading) {
    return <LoadingDots />;
  }

  // if (
  //   sessionInfo.isActive &&
  //   sessionInfo.patientId &&
  //   user &&
  //   (user.role === "User" || user.role === "Observer") &&
  //   !pathname.startsWith(`/patients-view/${sessionInfo.patientId}`)
  // ) {
  //   return <Navigate to={`/patients-view/${sessionInfo.patientId}`} replace />;
  // }

  const Component = getTheme(theme).component;

  const closeUpsellModal = () => {
    setShowUpsellModal(false);
  };

  return (
    <div>
      <SubscriptionModal
        isOpen={showUpsellModal}
        onClose={closeUpsellModal}
        currentPlan={user1.planType}
        close={close}
        logout={logout}
      />
      <ThemeSwitcher />
      <Component />
    </div>
  );
}

export default Main;