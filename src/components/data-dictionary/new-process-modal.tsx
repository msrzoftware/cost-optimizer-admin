"use client";

import { useEffect, type FormEvent, type ReactNode } from "react";
import { ChevronDown, Plus, Repeat2, X } from "lucide-react";

import {
  type DictionaryDomain,
  type DictionaryIndustry,
  type ProcessOption,
  type ProcessTier,
} from "./data-dictionary-data";

export type ProcessFormState = {
  category: string;
  cost: string;
  costCurrency: "AED" | "USD";
  description: string;
  domainId: string;
  hours: string;
  industryId: string;
  name: string;
  tier: ProcessTier | "";
};

export type NewProcessModalProps = {
  categoryOptions: readonly ProcessOption[];
  currencyRateInput: string;
  domains: DictionaryDomain[];
  industries: DictionaryIndustry[];
  isCurrencyRateSaving: boolean;
  isEditing?: boolean;
  isProcessSaving: boolean;
  processForm: ProcessFormState;
  savedUsdToAedRate: number;
  submitLabel?: string;
  tierOptions: readonly ProcessOption[];
  setCurrencyRateInput: (value: string) => void;
  setIsProcessFormOpen: (value: boolean) => void;
  setProcessForm: (
    value: ProcessFormState | ((current: ProcessFormState) => ProcessFormState),
  ) => void;
  onAddProcess: (event: FormEvent<HTMLFormElement>) => void;
  onSaveCurrencyRate: () => void;
};

const fieldInputClass =
  "h-10 w-full rounded-lg border border-[#D9E3F0] bg-white px-3 text-sm font-semibold text-[#333333] shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition placeholder:text-[#A1A1AA] focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10 disabled:cursor-not-allowed disabled:bg-[#F5F5F7] disabled:text-[#A1A1AA]";
const usdToAedRate = 3.6725;

export function NewProcessModal({
  categoryOptions,
  currencyRateInput,
  domains,
  industries,
  isCurrencyRateSaving,
  isEditing = false,
  isProcessSaving,
  processForm,
  savedUsdToAedRate,
  submitLabel = "Add Process",
  tierOptions,
  setCurrencyRateInput,
  setIsProcessFormOpen,
  setProcessForm,
  onAddProcess,
  onSaveCurrencyRate,
}: NewProcessModalProps) {
  const selectedIndustryId = processForm.industryId || industries[0]?.id || "";
  const availableDomains = domains.filter((domain) =>
    selectedIndustryId ? domain.industryIds.includes(selectedIndustryId) : true,
  );
  const canAddProcess = Boolean(
    processForm.name.trim() &&
      selectedIndustryId &&
      processForm.category.trim() &&
      processForm.tier.trim(),
  );
  const currencyRateValue = parseAmount(currencyRateInput);
  const canSaveCurrencyRate =
    currencyRateValue > 0 &&
    !isCurrencyRateSaving &&
    Math.abs(currencyRateValue - savedUsdToAedRate) > 0.0001;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function closeProcessForm() {
    if (!isProcessSaving) {
      setIsProcessFormOpen(false);
    }
  }

  function updateCostCurrency(currency: ProcessFormState["costCurrency"]) {
    setProcessForm((current) => {
      if (current.costCurrency === currency) {
        return current;
      }

      return {
        ...current,
        cost: convertProcessCost(
          current.cost,
          current.costCurrency,
          currency,
          savedUsdToAedRate,
        ),
        costCurrency: currency,
      };
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-6 backdrop-blur-[1px]"
      role="presentation"
    >
      <form
        onSubmit={onAddProcess}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-process-title"
        className="max-h-[calc(100vh-48px)] w-full max-w-[900px] overflow-auto rounded-md border border-[#B3D7FF] bg-[#F0F9FF] px-4 py-4 shadow-[0_24px_70px_rgba(15,23,42,0.22)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4">
          <p id="new-process-title" className="text-sm font-bold text-[#171717]">
            {isEditing ? "Edit Process" : "New Process"}
          </p>
          <button
            type="button"
            onClick={closeProcessForm}
            className="text-[#A1A1AA] transition hover:text-[#555555]"
            aria-label="Close new process form"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <div className="mt-4 grid gap-[10px]">
          <Field label="Process Name" required>
            <input
              value={processForm.name}
              onChange={(event) =>
                setProcessForm((current) => ({ ...current, name: event.target.value }))
              }
              className={fieldInputClass}
              placeholder="e.g. Chargeback Dispute Handling"
            />
          </Field>
          <Field label="Description">
            <textarea
              value={processForm.description}
              onChange={(event) =>
                setProcessForm((current) => ({ ...current, description: event.target.value }))
              }
              className={`${fieldInputClass} h-[76px] resize-none py-2 leading-5`}
              placeholder="What does this process involve?"
            />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Industry" required>
              <select
                value={selectedIndustryId}
                onChange={(event) => {
                  const industryId = event.target.value;
                  setProcessForm((current) => {
                    const hasSelectedDomain = domains.some(
                      (domain) =>
                        domain.id === current.domainId && domain.industryIds.includes(industryId),
                    );

                    return {
                      ...current,
                      domainId: hasSelectedDomain ? current.domainId : "",
                      industryId,
                    };
                  });
                }}
                className={fieldInputClass}
                disabled={isEditing}
              >
                <option value="">Select industry</option>
                {industries.map((industry) => (
                  <option key={industry.id} value={industry.id}>
                    {industry.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Domain (optional)">
              <select
                value={processForm.domainId}
                onChange={(event) =>
                  setProcessForm((current) => ({ ...current, domainId: event.target.value }))
                }
                className={fieldInputClass}
                disabled={isEditing}
              >
                <option value="">Industry default process</option>
                {availableDomains.map((domain) => (
                  <option key={domain.id} value={domain.id}>
                    {domain.name}
                  </option>
                ))}
              </select>
            </Field>
            <SearchCreateField
              listId="new-process-category-options"
              label="Category"
              options={categoryOptions}
              placeholder="Search or create category"
              required
              value={getOptionInputValue(categoryOptions, processForm.category)}
              onChange={(value) =>
                setProcessForm((current) => ({ ...current, category: value }))
              }
            />
            <SearchCreateField
              listId="new-process-tier-options"
              label="Tier"
              options={tierOptions}
              placeholder="Search or create tier"
              required
              value={getOptionInputValue(tierOptions, processForm.tier)}
              onChange={(value) =>
                setProcessForm((current) => ({
                  ...current,
                  tier: value as ProcessTier,
                }))
              }
            />
            <div className="grid gap-4 md:col-span-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] xl:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)_minmax(0,1fr)]">
              <Field label={`Default Cost / Yr (${processForm.costCurrency})`}>
                <div className="flex h-10 items-center rounded-lg border border-[#D9E3F0] bg-white p-1 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition focus-within:border-[#007AFF] focus-within:ring-2 focus-within:ring-[#007AFF]/10">
                  <input
                    value={processForm.cost}
                    onChange={(event) =>
                      setProcessForm((current) => ({ ...current, cost: event.target.value }))
                    }
                    className="min-w-0 flex-1 bg-transparent px-2 text-sm font-semibold text-[#333333] outline-none placeholder:text-[#A1A1AA]"
                    inputMode="decimal"
                    placeholder="18000"
                  />
                  <div className="grid h-8 w-[124px] shrink-0 grid-cols-2 rounded-md bg-[#F5F5F7] p-0.5">
                    {(["AED", "USD"] as const).map((currency) => (
                      <button
                        key={currency}
                        type="button"
                        onClick={() => updateCostCurrency(currency)}
                        className={`rounded-[4px] text-[11px] font-bold transition ${
                          processForm.costCurrency === currency
                            ? "bg-white text-[#007AFF] shadow-[0_1px_2px_rgba(15,23,42,0.08)]"
                            : "text-[#86868B] hover:text-[#171717]"
                        }`}
                        aria-pressed={processForm.costCurrency === currency}
                      >
                        {currency}
                      </button>
                    ))}
                  </div>
                </div>
              </Field>
              <Field label="Conversion Rate">
                <div className="flex min-h-10 min-w-0 items-center gap-2 overflow-hidden rounded-lg border border-[#CFE5FF] bg-white px-2.5 py-1 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition focus-within:border-[#007AFF] focus-within:ring-2 focus-within:ring-[#007AFF]/10">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#007AFF] text-white shadow-[0_4px_10px_rgba(0,122,255,0.22)]">
                      <Repeat2 size={14} aria-hidden="true" />
                    </span>
                    <span className="truncate text-[10px] font-semibold text-[#86868B]">
                      Saved: 1 USD = {formatConversionRateInput(savedUsdToAedRate)} AED
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-[#86868B]">1 USD =</span>
                    <input
                      value={currencyRateInput}
                      onChange={(event) => setCurrencyRateInput(event.target.value)}
                      className="h-7 w-[86px] shrink-0 rounded-md border border-[#D9E3F0] bg-white px-2 text-right text-xs font-bold text-[#333333] outline-none transition focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10"
                      inputMode="decimal"
                      aria-label="USD to AED conversion rate"
                    />
                    <span className="text-[10px] font-semibold text-[#86868B]">AED</span>
                    <button
                      type="button"
                      onClick={onSaveCurrencyRate}
                      disabled={!canSaveCurrencyRate}
                      className="h-6 shrink-0 rounded-md bg-[#007AFF] px-3 text-[11px] font-bold text-white transition hover:bg-[#0063CC] disabled:cursor-not-allowed disabled:bg-[#F5F5F7] disabled:text-[#A1A1AA]"
                    >
                      {isCurrencyRateSaving ? "Saving" : "Save"}
                    </button>
                  </div>
                </div>
              </Field>
              <div className="lg:col-span-2 xl:col-span-1">
                <Field label="Default Hours / Yr">
                  <input
                    value={processForm.hours}
                    onChange={(event) =>
                      setProcessForm((current) => ({ ...current, hours: event.target.value }))
                    }
                    className={fieldInputClass}
                    inputMode="numeric"
                    placeholder="1200"
                  />
                </Field>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={closeProcessForm}
            disabled={isProcessSaving}
            className="h-8 rounded-md border border-black/[0.08] bg-white px-4 text-xs font-semibold text-[#86868B] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canAddProcess || isProcessSaving}
            className={`inline-flex h-8 items-center gap-2 rounded-md px-4 text-xs font-bold transition ${
              canAddProcess && !isProcessSaving
                ? "bg-[#007AFF] text-white hover:bg-[#0063CC]"
                : "cursor-not-allowed bg-[#E5E5E7] text-[#86868B]"
            }`}
          >
            <Plus size={13} aria-hidden="true" />
            {isProcessSaving ? "Saving..." : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

function SearchCreateField({
  label,
  listId,
  onChange,
  options,
  placeholder,
  required = false,
  value,
}: {
  label: string;
  listId: string;
  onChange: (value: string) => void;
  options: readonly ProcessOption[];
  placeholder: string;
  required?: boolean;
  value: string;
}) {
  const isExistingOption = hasMatchingOption(options, value);

  return (
    <Field label={label} required={required}>
      <div className="relative">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${fieldInputClass} process-option-combobox appearance-none pr-20`}
          list={listId}
          placeholder={placeholder}
          title={placeholder}
        />
        <ChevronDown
          size={16}
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[#333333]"
          aria-hidden="true"
        />
        {value.trim() && !isExistingOption ? (
          <span className="pointer-events-none absolute top-1/2 right-8 -translate-y-1/2 rounded-md bg-[#EAF3FF] px-2 py-0.5 text-[10px] font-bold text-[#007AFF]">
            New
          </span>
        ) : null}
      </div>
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option.value} value={option.label} />
        ))}
      </datalist>
    </Field>
  );
}

function Field({
  children,
  label,
  required = false,
}: {
  children: ReactNode;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold tracking-[0.08em] text-[#86868B] uppercase">
        {label}
        {required ? <span className="ml-1 text-[#EF4444]">*</span> : null}
      </span>
      {children}
    </label>
  );
}

function getOptionInputValue(options: readonly ProcessOption[], value: string) {
  const normalizedValue = toSlug(value);

  if (!normalizedValue) {
    return "";
  }

  return (
    options.find((option) => option.value === normalizedValue)?.label ||
    value
  );
}

function hasMatchingOption(options: readonly ProcessOption[], value: string) {
  const normalizedValue = toSlug(value);

  return options.some(
    (option) =>
      option.value === normalizedValue ||
      toSlug(option.label) === normalizedValue,
  );
}

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseAmount(value: string) {
  const numericValue = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(numericValue) ? Math.max(0, numericValue) : 0;
}

function formatProcessCostInput(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "0";
  }

  const roundedValue = Math.round(value * 100) / 100;
  return Number.isInteger(roundedValue)
    ? String(roundedValue)
    : roundedValue.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function formatConversionRateInput(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return String(usdToAedRate);
  }

  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
}

function convertProcessCost(
  cost: string,
  currentCurrency: ProcessFormState["costCurrency"],
  nextCurrency: ProcessFormState["costCurrency"],
  rate: number,
) {
  const amount = parseAmount(cost);

  if (!amount || currentCurrency === nextCurrency) {
    return cost;
  }

  const convertedAmount =
    currentCurrency === "USD" && nextCurrency === "AED"
      ? amount * rate
      : amount / rate;

  return formatProcessCostInput(convertedAmount);
}
