import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { getAdminUsers, updateUserAccountType } from "../lib/api";
import { useTranslation } from "../languages/useTranslation";

const ACCOUNT_TYPES = ["standard", "plus", "admin"];

const AdminPage = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

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

  const handleAccountTypeChange = async (userId, accountType) => {
    await mutateAsync({ userId, accountType });
  };

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

  const visibleUsers = filteredUsers.slice(0, 10);

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
            {(loadingUsers || isFetching) && <span className="loading loading-spinner loading-sm" />}
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <label className="form-control w-full md:max-w-xs">
              <span className="label-text text-sm font-semibold">
                {t("admin.filters.searchLabel")}
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
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
                onChange={(event) => setTypeFilter(event.target.value)}
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
                        <select
                          className="select select-sm select-bordered w-full max-w-xs"
                          value={user.accountType}
                          onChange={(event) => handleAccountTypeChange(user._id, event.target.value)}
                          disabled={isPending}
                        >
                          {ACCOUNT_TYPES.map((type) => (
                            <option key={type} value={type}>
                              {t(`admin.accountTypes.${type}`)}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
