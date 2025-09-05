import React, { useEffect, useState } from "react";
import {
  getTranslationsAction,
  updateTranslationAction,
} from "@/actions/userActions";
import { FormInput, FormSelect } from "@/components/Base/Form";
import Alerts from "@/components/Alert";
import { t } from "i18next";

interface TranslationMap {
  [key: string]: string;
}

const ITEMS_PER_PAGE = 50; // show 50 at a time

function LanguageUpdate() {
  const [translations, setTranslations] = useState<TranslationMap>({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAlert, setShowAlert] = useState<{
    variant: "success" | "danger";
    message: string;
  } | null>(null);
  const [page, setPage] = useState(1);
  const [lang, setLang] = useState("en");

  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        setLoading(true);
        const res = await getTranslationsAction(lang);
        setTranslations(res || {});
      } catch (err) {
        console.error("Failed to fetch translations:", err);
        setShowAlert({
          variant: "danger",
          message: t("Failed to fetch translations"),
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTranslations();
  }, [lang]);

  const handleUpdate = async (key: string, value: string) => {
    try {
      await updateTranslationAction(key, value, lang);
      setTranslations((prev) => ({ ...prev, [key]: value }));
      setShowAlert({
        variant: "success",
        message: `${t("Updated")} ${key} ${t("successfully")}`,
      });
    } catch (error) {
      console.error("Error updating translation:", error);
      setShowAlert({
        variant: "danger",
        message: t("Failed to update translation"),
      });
    } finally {
      setTimeout(() => setShowAlert(null), 2000);
    }
  };

  const filteredTranslations = Object.entries(translations).filter(
    ([key, val]) => {
      const keyStr = String(key).toLowerCase();
      const valStr = String(val ?? "").toLowerCase();
      return (
        keyStr.includes(search.toLowerCase()) ||
        valStr.includes(search.toLowerCase())
      );
    }
  );

  // Pagination slice
  const startIdx = (page - 1) * ITEMS_PER_PAGE;
  const paginatedTranslations = filteredTranslations.slice(
    startIdx,
    startIdx + ITEMS_PER_PAGE
  );
  const totalPages = Math.ceil(filteredTranslations.length / ITEMS_PER_PAGE);

  return (
    <>
      {showAlert && <Alerts data={showAlert} />}
      <div className="flex items-center justify-between mt-8 intro-y">
        <h2 className="mr-auto text-lg font-medium">{t("Language Editor")}</h2>
        <FormSelect
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className="border p-2 rounded w-32"
        >
          <option value="en">English (US)</option>
          <option value="en_uk">English (UK)</option>
          <option value="fr">French</option>
          <option value="es">Spanish</option>
          <option value="de">German</option>
          <option value="it">Italian</option>
          <option value="pt">Português</option>
        </FormSelect>
      </div>

      <div className="intro-y box mt-5">
        <div className="p-5">
          {/* Search Bar */}
          <FormInput
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1); // reset to first page when searching
            }}
            className="w-full mb-5"
            placeholder={t("Search translations")}
          />

          {/* Translations List */}
          <div className="space-y-3 max-h-[65vh] overflow-y-auto">
            {loading ? (
              <p className="text-gray-500">{t("Loading translations...")}</p>
            ) : paginatedTranslations.length > 0 ? (
              paginatedTranslations.map(([key, val]) => (
                <div
                  key={key}
                  className="flex items-center gap-4 border-b pb-2 last:border-none"
                >
                  <div className="w-1/3 text-sm font-medium text-gray-700 truncate">
                    {key}
                  </div>
                  <FormInput
                    type="text"
                    defaultValue={String(val ?? "")}
                    className="flex-1"
                    onBlur={(e) => handleUpdate(key, e.target.value)}
                  />
                </div>
              ))
            ) : (
              <p className="text-gray-500">{t("No translations found")}</p>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-4">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                {t("Prev")}
              </button>
              <span className="text-sm">
                {t("Page")} {page} {t("of")} {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                {t("Next")}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default LanguageUpdate;
