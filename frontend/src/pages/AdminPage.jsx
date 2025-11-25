import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { getAdminUsers, sendAdminNotification, updateUserAccountType } from "../lib/api";
import { useTranslation } from "../languages/useTranslation";
import useAuthUser from "../hooks/useAuthUser";

const ACCOUNT_TYPES = ["standard", "plus", "admin"];
const USERS_PER_PAGE = 10;

const AdminPage = () => {
  const { t } = useTranslation();
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [notificationTarget, setNotificationTarget] = useState("all");
  const [notificationEmail, setNotificationEmail] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const notificationExpireDays = 3;
  const [pendingAccountTypes, setPendingAccountTypes] = useState({});
  const [savingAccounts, setSavingAccounts] = useState(false);

  const {
    data,
    isLoading: loadingUsers,
    isFetching,
  } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: getAdminUsers,
  });

  const { mutateAsync, isPending } = useMutation({
    mutationFn: ({ userId, accountType }) => updateUserAccountType(userId, accountType),
    onSuccess: () => {
      toast.success(t("admin.messages.updated"));
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
    },
    onError: (error) => {
      const message = error?.response?.data?.message || t("admin.messages.updateFailed");
      toast.error(message);
    },
  });

  const handleAccountTypeChange = (userId, accountType) => {
    setPendingAccountTypes((previous) => ({
      ...previous,
      [userId]: accountType,
    }));
  };

  const getSelectedAccountType = (user) => pendingAccountTypes[user._id] ?? user.accountType;

  const clearPendingAccountType = (userId) => {
    setPendingAccountTypes((previous) => {
      const { [userId]: _removed, ...rest } = previous;
      return rest;
    });
  };

  const handleSaveAllAccountChanges = async () => {
    if (!hasPendingAccountChanges) return;
    setSavingAccounts(true);
    try {
      for (const user of users) {
        const nextType = getSelectedAccountType(user);
        if (nextType && nextType !== user.accountType) {
          // eslint-disable-next-line no-await-in-loop
          await mutateAsync({ userId: user._id, accountType: nextType });
        }
      }
      setPendingAccountTypes({});
    } finally {
      setSavingAccounts(false);
    }
  };

  const { mutateAsync: sendNotification, isPending: sendingNotification } = useMutation({
    mutationFn: sendAdminNotification,
    onSuccess: () => {
      toast.success(t("admin.notifications.success"));
      setNotificationMessage("");
      setNotificationEmail("");
      setNotificationTarget("all");
    },
    onError: (error) => {
      const message = error?.response?.data?.message || t("admin.notifications.error");
      toast.error(message);
    },
  });

  const users = data?.users ?? [];

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch = term
        ? user.fullName?.toLowerCase().includes(term)
        : true;
      const matchesType = typeFilter === "all" ? true : user.accountType === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [users, searchTerm, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));

  useEffect(() => {
    setCurrentPage((previous) => Math.min(previous, totalPages));
  }, [totalPages]);

  const visibleUsers = useMemo(() => {
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * USERS_PER_PAGE;
    return filteredUsers.slice(startIndex, startIndex + USERS_PER_PAGE);
  }, [filteredUsers, currentPage, totalPages]);

  const hasPendingAccountChanges = useMemo(
    () =>
      users.some((user) => {
        const selected = getSelectedAccountType(user);
        return selected !== user.accountType;
      }),
    [users, pendingAccountTypes]
  );

  const handleSendNotification = async (event) => {
    event.preventDefault();
    const trimmedMessage = notificationMessage.trim();
    const trimmedEmail = notificationEmail.trim();

    if (!trimmedMessage) {
      toast.error(t("admin.notifications.validation.messageRequired"));
      return;
    }

    if (notificationTarget === "single" && !trimmedEmail) {
      toast.error(t("admin.notifications.validation.emailRequired"));
      return;
    }

    await sendNotification({
      message: trimmedMessage,
      targetType: notificationTarget,
      email: notificationTarget === "single" ? trimmedEmail : undefined,
      expireInDays: notificationExpireDays,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("admin.title")}</h1>
        <p className="text-base-content/70">{t("admin.subtitle")}</p>
      </div>

      <div className="card bg-base-200 shadow-xl">
        <div className="card-body space-y-4">
          <div className="flex w-full justify-between items-center">
            <h2 className="card-title">{t("admin.users.heading")}</h2>
            <div className="flex items-center gap-3">
              {(loadingUsers || isFetching) && <span className="loading loading-spinner loading-sm" />}
              <button
                className="btn btn-sm btn-primary"
                type="button"
                onClick={handleSaveAllAccountChanges}
                disabled={!hasPendingAccountChanges || isPending || savingAccounts}
              >
                {savingAccounts && <span className="loading loading-spinner loading-xs" />}
                {t("admin.users.saveChanges")}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <label className="form-control w-full md:max-w-xs">
              <span className="label-text text-sm font-semibold">
                {t("admin.filters.searchLabel")}
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setCurrentPage(1);
                }}
                className="input input-bordered"
                placeholder={t("admin.filters.searchPlaceholder")}
              />
            </label>

            <label className="form-control w-full md:max-w-xs">
              <span className="label-text text-sm font-semibold">
                {t("admin.filters.typeLabel")}
              </span>
              <select
                className="select select-bordered"
                value={typeFilter}
                onChange={(event) => {
                  setTypeFilter(event.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">{t("admin.filters.allTypes")}</option>
                {ACCOUNT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`admin.accountTypes.${type}`)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className="text-xs text-base-content/70">
            {t("admin.users.visibleCount", {
              visible: visibleUsers.length,
              total: filteredUsers.length,
            })}
          </p>

          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>{t("admin.users.name")}</th>
                  <th className="hidden md:table-cell">{t("admin.users.email")}</th>
                  <th>{t("admin.users.accountType")}</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-6 text-base-content/70">
                      {t("admin.users.empty")}
                    </td>
                  </tr>
                ) : visibleUsers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-6 text-base-content/70">
                      {t("admin.users.noResults")}
                    </td>
                  </tr>
                ) : (
                  visibleUsers.map((user) => (
                    <tr key={user._id}>
                      <td>
                        <div>
                          <p className="font-semibold">{user.fullName}</p>
                          <p className="text-xs text-base-content/60 md:hidden">{user.email}</p>
                        </div>
                      </td>
                      <td className="hidden md:table-cell">{user.email}</td>
                      <td>
                        {(() => {
                          const isSelf = authUser?._id === user._id;
                          const optionsForUser = isSelf
                            ? ACCOUNT_TYPES
                            : [
                                "standard",
                                "plus",
                                ...(user.accountType === "admin" ? ["admin"] : []),
                              ];
                          const lockedAdmin = !isSelf && user.accountType === "admin";

                          const selectedAccountType = getSelectedAccountType(user);

                          return (
                            <select
                              className="select select-sm select-bordered w-full max-w-xs"
                              value={selectedAccountType}
                              onChange={(event) =>
                                handleAccountTypeChange(user._id, event.target.value)
                              }
                              disabled={isPending || lockedAdmin || savingAccounts}
                            >
                              {optionsForUser.map((type) => (
                                <option key={type} value={type}>
                                  {t(`admin.accountTypes.${type}`)}
                                </option>
                              ))}
                            </select>
                          );
                        })()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredUsers.length > USERS_PER_PAGE && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-base-300 pt-4">
              <div className="join">
                <button
                  className="btn btn-sm join-item"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                >
                  {t("common.prev")}
                </button>

                {Array.from({ length: totalPages }, (_, index) => {
                  const pageNumber = index + 1;
                  const isActive = pageNumber === currentPage;

                  return (
                    <button
                      key={pageNumber}
                      className={`btn btn-sm join-item ${isActive ? "btn-primary" : "btn-ghost"}`}
                      onClick={() => setCurrentPage(pageNumber)}
                    >
                      {pageNumber}
                    </button>
                  );
                })}

                <button
                  className="btn btn-sm join-item"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                >
                  {t("common.next")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card bg-base-200 shadow-xl">
        <div className="card-body space-y-4">
          <div className="flex w-full justify-between items-center">
            <h2 className="card-title">{t("admin.notifications.heading")}</h2>
            {sendingNotification && <span className="loading loading-spinner loading-sm" />}
          </div>

          <p className="text-sm text-base-content/70">{t("admin.notifications.description")}</p>

          <form className="space-y-4" onSubmit={handleSendNotification}>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="form-control w-full">
                <span className="label-text text-sm font-semibold">
                  {t("admin.notifications.audienceLabel")}
                </span>
                <select
                  className="select select-bordered"
                  value={notificationTarget}
                  onChange={(event) => setNotificationTarget(event.target.value)}
                >
                  <option value="all">{t("admin.notifications.audienceAll")}</option>
                  <option value="single">{t("admin.notifications.audienceSingle")}</option>
                </select>
              </label>

              {notificationTarget === "single" && (
                <label className="form-control w-full">
                  <span className="label-text text-sm font-semibold">
                    {t("admin.notifications.emailLabel")}
                  </span>
                  <input
                    type="email"
                    className="input input-bordered"
                    placeholder="user@example.com"
                    value={notificationEmail}
                    onChange={(event) => setNotificationEmail(event.target.value)}
                  />
                </label>
              )}
            </div>

            <label className="form-control w-full">
              <span className="label-text text-sm font-semibold">
                {t("admin.notifications.messageLabel")}
              </span>
              <textarea
                className="textarea textarea-bordered h-28"
                placeholder={t("admin.notifications.messagePlaceholder")}
                value={notificationMessage}
                onChange={(event) => setNotificationMessage(event.target.value)}
                maxLength={500}
              />
              <div className="label">
                <span className="label-text-alt text-base-content/70">
                  {t("admin.notifications.counterLabel", {
                    days: notificationExpireDays,
                    count: notificationMessage.length,
                  })}
                </span>
              </div>
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-base-content/70">
                {t("admin.notifications.footerHint", { days: notificationExpireDays })}
              </p>
              <button className="btn btn-primary" type="submit" disabled={sendingNotification}>
                {sendingNotification && <span className="loading loading-spinner loading-sm" />}
                {t("admin.notifications.sendButton")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
