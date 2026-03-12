import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, Outlet, useParams } from "react-router-dom";
import { isNetworkEnabled } from "../../config/networks";
import { useNotifications } from "../../context/NotificationContext";

export default function ValidateNetwork() {
  const { networkId } = useParams<{ networkId: string }>();
  const { addNotification } = useNotifications();
  const { t } = useTranslation();
  const isValid = !!networkId && isNetworkEnabled(networkId);

  useEffect(() => {
    if (!isValid) {
      addNotification(
        t("errors.networkNotFoundMessage", { network: networkId || "" }),
        "warning",
        8000,
      );
    }
  }, [isValid, networkId, addNotification, t]);

  if (!isValid) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
