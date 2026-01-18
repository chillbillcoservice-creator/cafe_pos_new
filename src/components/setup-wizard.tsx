"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, CheckCircle2, User, Users, Plus, Trash2, ArrowRight, ArrowLeft, Rocket, ChevronDown, ChevronUp, PlusCircle, Truck } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { SetupData, VenueDetails, OwnerDetails, Employee } from "@/lib/types";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";

interface SetupWizardProps {
  onComplete: (data: SetupData) => void;
  initialData?: Partial<SetupData>;
}

const steps = [
  { id: 1, title: "Venue", icon: Building2 },
  { id: 2, title: "Owner", icon: User },
  { id: 3, title: "Staff", icon: Users },
  { id: 4, title: "Vendors", icon: Truck },
];

function WizardSection({ title, children, defaultOpen = false }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="bg-card/50 backdrop-blur-sm rounded-xl border border-border shadow-sm overflow-hidden transition-all duration-300">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <h3 className="font-bold text-sm text-foreground uppercase tracking-wide">{title}</h3>
        {isOpen ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
      </button>
      <div className={cn("grid transition-all duration-300 ease-in-out", isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
        <div className="overflow-hidden">
          <div className="p-3 pt-0 space-y-3">
            <div className="pt-3">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const COUNTRIES = [
  { name: "Afghanistan", code: "AF", currency: "؋", currencyName: "AFN" },
  { name: "Albania", code: "AL", currency: "L", currencyName: "ALL" },
  { name: "Algeria", code: "DZ", currency: "د.ج", currencyName: "DZD" },
  { name: "Andorra", code: "AD", currency: "€", currencyName: "EUR" },
  { name: "Angola", code: "AO", currency: "Kz", currencyName: "AOA" },
  { name: "Argentina", code: "AR", currency: "$", currencyName: "ARS" },
  { name: "Armenia", code: "AM", currency: "֏", currencyName: "AMD" },
  { name: "Australia", code: "AU", currency: "$", currencyName: "AUD" },
  { name: "Austria", code: "AT", currency: "€", currencyName: "EUR" },
  { name: "Azerbaijan", code: "AZ", currency: "₼", currencyName: "AZN" },
  { name: "Bahrain", code: "BH", currency: ".د.ب", currencyName: "BHD" },
  { name: "Bangladesh", code: "BD", currency: "৳", currencyName: "BDT" },
  { name: "Belarus", code: "BY", currency: "Br", currencyName: "BYN" },
  { name: "Belgium", code: "BE", currency: "€", currencyName: "EUR" },
  { name: "Bhutan", code: "BT", currency: "Nu.", currencyName: "BTN" },
  { name: "Bolivia", code: "BO", currency: "Bs.", currencyName: "BOB" },
  { name: "Bosnia and Herzegovina", code: "BA", currency: "KM", currencyName: "BAM" },
  { name: "Brazil", code: "BR", currency: "R$", currencyName: "BRL" },
  { name: "Bulgaria", code: "BG", currency: "лв", currencyName: "BGN" },
  { name: "Cambodia", code: "KH", currency: "៛", currencyName: "KHR" },
  { name: "Canada", code: "CA", currency: "$", currencyName: "CAD" },
  { name: "Chile", code: "CL", currency: "$", currencyName: "CLP" },
  { name: "China", code: "CN", currency: "¥", currencyName: "CNY" },
  { name: "Colombia", code: "CO", currency: "$", currencyName: "COP" },
  { name: "Costa Rica", code: "CR", currency: "₡", currencyName: "CRC" },
  { name: "Croatia", code: "HR", currency: "€", currencyName: "EUR" },
  { name: "Cuba", code: "CU", currency: "$", currencyName: "CUP" },
  { name: "Cyprus", code: "CY", currency: "€", currencyName: "EUR" },
  { name: "Czech Republic", code: "CZ", currency: "Kč", currencyName: "CZK" },
  { name: "Denmark", code: "DK", currency: "kr", currencyName: "DKK" },
  { name: "Dominican Republic", code: "DO", currency: "RD$", currencyName: "DOP" },
  { name: "Ecuador", code: "EC", currency: "$", currencyName: "USD" },
  { name: "Egypt", code: "EG", currency: "E£", currencyName: "EGP" },
  { name: "Estonia", code: "EE", currency: "€", currencyName: "EUR" },
  { name: "Ethiopia", code: "ET", currency: "Br", currencyName: "ETB" },
  { name: "Finland", code: "FI", currency: "€", currencyName: "EUR" },
  { name: "France", code: "FR", currency: "€", currencyName: "EUR" },
  { name: "Georgia", code: "GE", currency: "₾", currencyName: "GEL" },
  { name: "Germany", code: "DE", currency: "€", currencyName: "EUR" },
  { name: "Ghana", code: "GH", currency: "₵", currencyName: "GHS" },
  { name: "Greece", code: "GR", currency: "€", currencyName: "EUR" },
  { name: "Hong Kong", code: "HK", currency: "$", currencyName: "HKD" },
  { name: "Hungary", code: "HU", currency: "Ft", currencyName: "HUF" },
  { name: "Iceland", code: "IS", currency: "kr", currencyName: "ISK" },
  { name: "India", code: "IN", currency: "Rs.", currencyName: "INR" },
  { name: "Indonesia", code: "ID", currency: "Rp", currencyName: "IDR" },
  { name: "Iran", code: "IR", currency: "﷼", currencyName: "IRR" },
  { name: "Iraq", code: "IQ", currency: "ع.د", currencyName: "IQD" },
  { name: "Ireland", code: "IE", currency: "€", currencyName: "EUR" },
  { name: "Israel", code: "IL", currency: "₪", currencyName: "ILS" },
  { name: "Italy", code: "IT", currency: "€", currencyName: "EUR" },
  { name: "Japan", code: "JP", currency: "¥", currencyName: "JPY" },
  { name: "Jordan", code: "JO", currency: "د.ا", currencyName: "JOD" },
  { name: "Kazakhstan", code: "KZ", currency: "₸", currencyName: "KZT" },
  { name: "Kenya", code: "KE", currency: "KSh", currencyName: "KES" },
  { name: "Kuwait", code: "KW", currency: "د.ك", currencyName: "KWD" },
  { name: "Latvia", code: "LV", currency: "€", currencyName: "EUR" },
  { name: "Lebanon", code: "LB", currency: "ل.ل", currencyName: "LBP" },
  { name: "Lithuania", code: "LT", currency: "€", currencyName: "EUR" },
  { name: "Luxembourg", code: "LU", currency: "€", currencyName: "EUR" },
  { name: "Malaysia", code: "MY", currency: "RM", currencyName: "MYR" },
  { name: "Maldives", code: "MV", currency: "Rf", currencyName: "MVR" },
  { name: "Malta", code: "MT", currency: "€", currencyName: "EUR" },
  { name: "Mexico", code: "MX", currency: "$", currencyName: "MXN" },
  { name: "Monaco", code: "MC", currency: "€", currencyName: "EUR" },
  { name: "Mongolia", code: "MN", currency: "₮", currencyName: "MNT" },
  { name: "Morocco", code: "MA", currency: "د.م.", currencyName: "MAD" },
  { name: "Myanmar", code: "MM", currency: "K", currencyName: "MMK" },
  { name: "Nepal", code: "NP", currency: "₨", currencyName: "NPR" },
  { name: "Netherlands", code: "NL", currency: "€", currencyName: "EUR" },
  { name: "New Zealand", code: "NZ", currency: "$", currencyName: "NZD" },
  { name: "Nigeria", code: "NG", currency: "₦", currencyName: "NGN" },
  { name: "North Korea", code: "KP", currency: "₩", currencyName: "KPW" },
  { name: "Norway", code: "NO", currency: "kr", currencyName: "NOK" },
  { name: "Oman", code: "OM", currency: "ر.ع.", currencyName: "OMR" },
  { name: "Pakistan", code: "PK", currency: "₨", currencyName: "PKR" },
  { name: "Peru", code: "PE", currency: "S/.", currencyName: "PEN" },
  { name: "Philippines", code: "PH", currency: "₱", currencyName: "PHP" },
  { name: "Poland", code: "PL", currency: "zł", currencyName: "PLN" },
  { name: "Portugal", code: "PT", currency: "€", currencyName: "EUR" },
  { name: "Qatar", code: "QA", currency: "ر.ق", currencyName: "QAR" },
  { name: "Romania", code: "RO", currency: "lei", currencyName: "RON" },
  { name: "Russia", code: "RU", currency: "₽", currencyName: "RUB" },
  { name: "Saudi Arabia", code: "SA", currency: "﷼", currencyName: "SAR" },
  { name: "Singapore", code: "SG", currency: "$", currencyName: "SGD" },
  { name: "Slovakia", code: "SK", currency: "€", currencyName: "EUR" },
  { name: "Slovenia", code: "SI", currency: "€", currencyName: "EUR" },
  { name: "South Africa", code: "ZA", currency: "R", currencyName: "ZAR" },
  { name: "South Korea", code: "KR", currency: "₩", currencyName: "KRW" },
  { name: "Spain", code: "ES", currency: "€", currencyName: "EUR" },
  { name: "Sri Lanka", code: "LK", currency: "Rs", currencyName: "LKR" },
  { name: "Sweden", code: "SE", currency: "kr", currencyName: "SEK" },
  { name: "Switzerland", code: "CH", currency: "Fr", currencyName: "CHF" },
  { name: "Taiwan", code: "TW", currency: "NT$", currencyName: "TWD" },
  { name: "Thailand", code: "TH", currency: "฿", currencyName: "THB" },
  { name: "Turkey", code: "TR", currency: "₺", currencyName: "TRY" },
  { name: "Ukraine", code: "UA", currency: "₴", currencyName: "UAH" },
  { name: "United Arab Emirates", code: "AE", currency: "د.إ", currencyName: "AED" },
  { name: "United Kingdom", code: "GB", currency: "£", currencyName: "GBP" },
  { name: "United States", code: "US", currency: "$", currencyName: "USD" },
  { name: "Vatican City", code: "VA", currency: "€", currencyName: "EUR" },
  { name: "Venezuela", code: "VE", currency: "Bs.S", currencyName: "VES" },
  { name: "Vietnam", code: "VN", currency: "₫", currencyName: "VND" },
  { name: "Other", code: "OT", currency: "$", currencyName: "USD" },
];

export default function SetupWizard({ onComplete, initialData }: SetupWizardProps) {
  const [step, setStep] = useState(1);

  // State for all form fields
  const [venue, setVenue] = useState<VenueDetails>({
    name: initialData?.venue?.name || "",
    address: initialData?.venue?.address || "",
    street: initialData?.venue?.street || "",
    city: initialData?.venue?.city || "",
    state: initialData?.venue?.state || "",
    zip: initialData?.venue?.zip || "",
    country: initialData?.venue?.country || "",
    contactNumber: initialData?.venue?.contactNumber || "",
    email: initialData?.venue?.email || "",
    tagline: initialData?.venue?.tagline || "",
  });

  const [currency, setCurrency] = useState(initialData?.currency || "Rs.");
  const [customCurrency, setCustomCurrency] = useState("");
  const [customCountry, setCustomCountry] = useState("");
  const [customCurrencyName, setCustomCurrencyName] = useState("");

  const [owner, setOwner] = useState<OwnerDetails>({
    name: initialData?.owner?.name || "",
    contactNumber: initialData?.owner?.contactNumber || "",
    email: initialData?.owner?.email || "",
  });

  const [additionalOwners, setAdditionalOwners] = useState<OwnerDetails[]>(initialData?.additionalOwners || []);
  const [newOwnerName, setNewOwnerName] = useState("");
  const [newOwnerContact, setNewOwnerContact] = useState("");
  const [newOwnerEmail, setNewOwnerEmail] = useState("");

  // Employee State
  // Employee State
  const [employees, setEmployees] = useState<Partial<Employee>[]>(
    (initialData?.employees && initialData.employees.length > 0)
      ? initialData.employees
      : [{ name: "", role: "Manager", salary: 0, mobile: "", email: "", govtId: "", color: '#f59e0b' }]
  );

  // Vendor State
  const [vendors, setVendors] = useState<any[]>(
    (initialData?.vendors && initialData.vendors.length > 0)
      ? initialData.vendors
      : [{ name: "", phone: "", email: "", category: "General" }]
  );

  const handleNext = () => {
    if (step < 4) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleBasicChange = (setter: any, field: string, value: string) => {
    setter((prev: any) => ({ ...prev, [field]: value }));
  };

  const addEmployeeCard = () => {
    setEmployees([...employees, { name: "", role: "Manager", salary: 0, mobile: "", email: "", govtId: "", color: '#f59e0b' }]);
  };

  const updateEmployee = (index: number, field: keyof Employee, value: any) => {
    const newEmps = [...employees];
    const updatedEmp = { ...newEmps[index], [field]: value };
    // Handle Custom Role logic if needed (store in role field directly or separate?)
    // For simplicity, we'll assume role handles it or we parse it.
    // If field is 'role' and value is 'Other', we might need a separate 'customRole' field in the object temporarily or just use 'Other' string.
    newEmps[index] = updatedEmp;
    setEmployees(newEmps);
  };

  const removeEmployee = (index: number) => {
    const newEmps = [...employees];
    if (newEmps.length === 1) {
      // Don't remove the last card, just reset it
      newEmps[0] = { name: "", role: "Manager", salary: 0, mobile: "", email: "", govtId: "", color: '#f59e0b' };
    } else {
      newEmps.splice(index, 1);
    }
    setEmployees(newEmps);
  };

  const addVendorCard = () => {
    setVendors([...vendors, { name: "", phone: "", email: "", category: "General" }]);
  };

  const updateVendor = (index: number, field: string, value: any) => {
    const newVendors = [...vendors];
    newVendors[index] = { ...newVendors[index], [field]: value };
    setVendors(newVendors);
  };

  const removeVendor = (index: number) => {
    const newVendors = [...vendors];
    if (newVendors.length === 1) {
      // Don't remove the last card, just reset it
      newVendors[0] = { name: "", phone: "", email: "", category: "General" };
    } else {
      newVendors.splice(index, 1);
    }
    setVendors(newVendors);
  };

  const addOwner = () => {
    setAdditionalOwners([...additionalOwners, { name: "", contactNumber: "", email: "" }]);
  };

  const updateAdditionalOwner = (index: number, field: keyof OwnerDetails, value: string) => {
    const newOwners = [...additionalOwners];
    newOwners[index] = { ...newOwners[index], [field]: value };
    setAdditionalOwners(newOwners);
  };

  const removeOwner = (index: number) => {
    const newOwners = [...additionalOwners];
    newOwners.splice(index, 1);
    setAdditionalOwners(newOwners);
  };

  const handleFinish = () => {
    const finalCurrency = currency === "custom" || venue.country === "Other" ? customCurrency : currency;
    const finalCountry = venue.country === "Other" ? customCountry : venue.country;
    const fullAddress = venue.address || [venue.street, venue.city, venue.state, venue.zip, finalCountry].filter(Boolean).join(", ");
    const addressToSave = fullAddress || (finalCountry ? `${finalCountry}` : "");

    // Filter out empty entries before saving? Or keep them?
    // Let's filter out completely empty ones to be clean
    const validEmployees = employees.filter(e => e.name);
    const validVendors = vendors.filter(v => v.name);

    // Check main owner vs additional
    // We pass owner separately, but additionalOwners are passed too.
    const validAdditionalOwners = additionalOwners.filter(o => o.name);

    onComplete({
      venue: { ...venue, country: finalCountry, address: addressToSave },
      owner,
      additionalOwners: validAdditionalOwners,
      employees: validEmployees,
      vendors: validVendors,
      currency: finalCurrency || "$"
    });
  };

  const isStep1Valid = true;
  const isStep2Valid = owner.name && owner.contactNumber;
  const isStep3Valid = true; // Optional to add employees

  return (
    <Dialog open={true} >
      <DialogContent className="sm:max-w-[800px] w-full [&>button]:hidden overflow-hidden max-h-[85vh] flex flex-col p-4 md:p-6">
        <div className="absolute top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        <DialogHeader className="mb-6 relative z-10 shrink-0 space-y-4">
          <div className="text-left space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome! Let's set up your business.</h1>
            <p className="text-sm font-medium text-muted-foreground">
              Step {step} of {steps.length}: { // Updated total steps count
                step === 1 ? "Business Details" :
                  step === 2 ? "Owner Details" :
                    step === 3 ? "Staff Management" :
                      step === 4 ? "Vendors List" : // Updated text for step 4
                        "Review"
              }
            </p>
          </div>

          <div className="grid grid-cols-4 gap-2 w-full">
            {steps.map((s) => (
              <button
                key={s.id}
                onClick={() => setStep(s.id)}
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-1 rounded-lg border transition-all duration-200 group h-14",
                  step === s.id
                    ? "border-orange-500 bg-orange-500/10 text-orange-600 shadow-sm ring-1 ring-orange-500/20"
                    : step > s.id
                      ? "border-orange-500/30 bg-orange-500/5 text-orange-600/70"
                      : "border-zinc-800 bg-zinc-900/50 text-muted-foreground hover:bg-zinc-800 hover:border-zinc-700"
                )}
                type="button"
              >
                <s.icon size={16} className={cn("mb-1 transition-all", step === s.id ? "scale-110" : "opacity-70 group-hover:opacity-100")} />
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-wide truncate max-w-full leading-none",
                  step === s.id ? "" : "opacity-80"
                )}>{s.title}</span>
              </button>
            ))}
          </div>
          <div className="border-b border-zinc-800/80 mt-2" />
        </DialogHeader>

        <div className="py-4 px-2 flex-1 overflow-y-auto custom-scrollbar">
          {step === 1 && (
            <div className="h-full px-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-normal text-muted-foreground">Business Name</Label>
                    <Input
                      value={venue.name}
                      onChange={(e) => handleBasicChange(setVenue, 'name', e.target.value)}
                      placeholder="e.g. The Grand Hotel"
                      className="h-10 bg-zinc-900/50 border-zinc-700 text-sm focus:ring-blue-500/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-normal text-muted-foreground">Tagline (Optional)</Label>
                    <Input
                      value={venue.tagline}
                      onChange={(e) => handleBasicChange(setVenue, 'tagline', e.target.value)}
                      placeholder="e.g. Best Brews in Town"
                      className="h-10 bg-zinc-900/50 border-zinc-700 text-sm"
                    />
                  </div>

                  <div className="border-b border-zinc-800 my-2" />

                  <div className="space-y-2">
                    <Label className="text-xs font-normal text-muted-foreground">Country</Label>
                    <Select
                      value={venue.country}
                      onValueChange={(val) => {
                        handleBasicChange(setVenue, 'country', val);
                        const selectedCountry = COUNTRIES.find(c => c.name === val);
                        if (selectedCountry) {
                          if (val !== 'Other') {
                            setCurrency(selectedCountry.currency);
                          } else {
                            setCurrency('custom');
                          }
                        }
                      }}
                    >
                      <SelectTrigger className="h-10 bg-zinc-900/50 border-zinc-700 text-sm">
                        <SelectValue placeholder="Select Country" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        {COUNTRIES.map((c) => (
                          <SelectItem key={c.code} value={c.name}>
                            <span className="flex items-center gap-2">
                              <span>{c.name}</span>
                              <span className="text-xs text-muted-foreground ml-auto">{c.currency}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {venue.country === 'Other' && (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                      <div className="space-y-2">
                        <Label className="text-xs font-normal text-muted-foreground">Country Name</Label>
                        <Input
                          value={customCountry}
                          onChange={(e) => setCustomCountry(e.target.value)}
                          placeholder="Enter Name"
                          className="h-10 bg-zinc-900/50 border-zinc-700 text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-normal text-muted-foreground">Currency Symbol</Label>
                        <Input
                          value={customCurrency}
                          onChange={(e) => setCustomCurrency(e.target.value)}
                          placeholder="e.g. $"
                          className="h-10 bg-zinc-900/50 border-zinc-700 text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Vertical Divider Removed */}

                {/* Right Column */}
                <div className="space-y-4 md:pl-8">
                  <div className="space-y-2">
                    <Label className="text-xs font-normal text-muted-foreground">Location</Label>
                    <Input
                      value={venue.street}
                      onChange={(e) => handleBasicChange(setVenue, 'street', e.target.value)}
                      placeholder="e.g. Manali, Himachal Pradesh"
                      className="h-10 bg-zinc-900/50 border-zinc-700 text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-normal text-muted-foreground">Zip Code</Label>
                    <Input
                      value={venue.zip}
                      onChange={(e) => handleBasicChange(setVenue, 'zip', e.target.value)}
                      placeholder="e.g. 175131"
                      className="h-10 bg-zinc-900/50 border-zinc-700 text-sm"
                    />
                  </div>

                  <div className="border-b border-zinc-800 my-2" />

                  <div className="space-y-2">
                    <Label className="text-xs font-normal text-muted-foreground">Business Email (Optional)</Label>
                    <Input
                      value={venue.email}
                      onChange={(e) => handleBasicChange(setVenue, 'email', e.target.value)}
                      placeholder="e.g. contact@hotel.com"
                      className="h-10 bg-zinc-900/50 border-zinc-700 text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-normal text-muted-foreground">Mobile (Optional)</Label>
                    <Input
                      value={venue.contactNumber}
                      onChange={(e) => handleBasicChange(setVenue, 'contactNumber', e.target.value)}
                      placeholder="e.g. +91 9876543210"
                      className="h-10 bg-zinc-900/50 border-zinc-700 text-sm"
                    />
                  </div>

                  {/* Hidden fields for compatibility */}
                  <div className="hidden">
                    <Input value={venue.city} onChange={(e) => handleBasicChange(setVenue, 'city', e.target.value)} placeholder="City" />
                    <Input value={venue.state} onChange={(e) => handleBasicChange(setVenue, 'state', e.target.value)} placeholder="State" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Owner 1 Card */}
              <div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border shadow-sm space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-normal text-muted-foreground">Owner 1 Name</Label>
                  <Input
                    value={owner.name}
                    onChange={(e) => handleBasicChange(setOwner, 'name', e.target.value)}
                    placeholder="Full Name"
                    className="h-10 bg-zinc-900/50 border-zinc-700 text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-normal text-muted-foreground">Mobile (Optional)</Label>
                    <Input
                      value={owner.contactNumber}
                      onChange={(e) => handleBasicChange(setOwner, 'contactNumber', e.target.value)}
                      placeholder="e.g., 9876543210"
                      className="h-10 bg-zinc-900/50 border-zinc-700 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-normal text-muted-foreground">Email (Optional)</Label>
                    <Input
                      value={owner.email}
                      onChange={(e) => handleBasicChange(setOwner, 'email', e.target.value)}
                      placeholder="e.g., owner@example.com"
                      className="h-10 bg-zinc-900/50 border-zinc-700 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-normal text-muted-foreground">Address (Optional)</Label>
                  <textarea
                    value={owner.address || ''}
                    onChange={(e) => handleBasicChange(setOwner, 'address', e.target.value)}
                    placeholder="Full Address"
                    className="w-full h-24 bg-zinc-900/50 border rounded-md border-zinc-700 text-sm p-3 focus:outline-none focus:ring-1 focus:ring-zinc-600 resize-none"
                  />
                </div>
              </div>

              {/* Additional Owners Cards */}
              {additionalOwners.map((own, idx) => (
                <div key={idx} className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border shadow-sm space-y-6 relative">
                  <div className="absolute top-4 right-4">
                    <Button variant="ghost" size="icon" onClick={() => removeOwner(idx)} className="h-8 w-8 text-muted-foreground hover:text-red-400">
                      <Trash2 size={16} />
                    </Button>
                  </div>
                  <h4 className="font-bold text-sm text-muted-foreground uppercase">Partner {idx + 1}</h4>

                  <div className="space-y-2">
                    <Label className="text-xs font-normal text-muted-foreground">Partner Name</Label>
                    <Input value={own.name} onChange={(e) => updateAdditionalOwner(idx, 'name', e.target.value)} placeholder="Full Name" className="h-10 bg-zinc-900/50 border-zinc-700 text-sm" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-normal text-muted-foreground">Mobile (Optional)</Label>
                      <Input value={own.contactNumber} onChange={(e) => updateAdditionalOwner(idx, 'contactNumber', e.target.value)} placeholder="e.g., 9876543210" className="h-10 bg-zinc-900/50 border-zinc-700 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-normal text-muted-foreground">Email (Optional)</Label>
                      <Input value={own.email} onChange={(e) => updateAdditionalOwner(idx, 'email', e.target.value)} placeholder="e.g., partner@example.com" className="h-10 bg-zinc-900/50 border-zinc-700 text-sm" />
                    </div>
                  </div>
                </div>
              ))}

              <div>
                <Button variant="outline" onClick={addOwner} className="border-dashed border-zinc-700 text-zinc-400 hover:text-zinc-200">
                  <PlusCircle size={16} className="mr-2" /> Add Another Owner
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              {employees.map((emp, idx) => (
                <div key={idx} className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border shadow-sm space-y-6 relative">
                  <div className="absolute top-4 right-4">
                    <Button variant="ghost" size="icon" onClick={() => removeEmployee(idx)} className="h-8 w-8 text-muted-foreground hover:text-red-400">
                      <Trash2 size={16} />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-normal text-muted-foreground">Employee {idx + 1} Name</Label>
                      <Input value={emp.name} onChange={(e) => updateEmployee(idx, 'name', e.target.value)} placeholder="Full Name" className="h-10 bg-zinc-900/50 border-zinc-700 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-normal text-muted-foreground">Email (Optional)</Label>
                      <Input value={emp.email} onChange={(e) => updateEmployee(idx, 'email', e.target.value)} placeholder="e.g., employee@example.com" className="h-10 bg-zinc-900/50 border-zinc-700 text-sm" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-normal text-muted-foreground">Role</Label>
                      <Select
                        value={(["Manager", "Head Chef", "Chef", "Cashier", "Helper", "Cleaner", "Dishwasher"].includes(emp.role || "") ? emp.role : "Other")}
                        onValueChange={(val) => updateEmployee(idx, 'role', val)}
                      >
                        <SelectTrigger className="h-10 bg-zinc-900/50 border-zinc-700 text-sm">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Manager">Manager</SelectItem>
                          <SelectItem value="Head Chef">Head Chef</SelectItem>
                          <SelectItem value="Chef">Chef</SelectItem>
                          <SelectItem value="Cashier">Cashier</SelectItem>
                          <SelectItem value="Helper">Helper</SelectItem>
                          <SelectItem value="Cleaner">Cleaner</SelectItem>
                          <SelectItem value="Dishwasher">Dishwasher</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-normal text-muted-foreground">Salary</Label>
                      <Input value={emp.salary?.toString()} onChange={(e) => updateEmployee(idx, 'salary', e.target.value)} placeholder="e.g., 25000" className="h-10 bg-zinc-900/50 border-zinc-700 text-sm" />
                    </div>
                  </div>

                  {(!["Manager", "Head Chef", "Chef", "Cashier", "Helper", "Cleaner", "Dishwasher"].includes(emp.role || "") || emp.role === "Other") && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                      <Label className="text-xs font-normal text-muted-foreground">Custom Role</Label>
                      <Input
                        value={emp.role === "Other" ? "" : emp.role}
                        onChange={(e) => updateEmployee(idx, 'role', e.target.value)}
                        placeholder="e.g. Singer"
                        className="h-10 bg-zinc-900/50 border-zinc-700 text-sm"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-normal text-muted-foreground">Mobile No. (Optional)</Label>
                      <Input value={emp.mobile} onChange={(e) => updateEmployee(idx, 'mobile', e.target.value)} placeholder="e.g., 9876543210" className="h-10 bg-zinc-900/50 border-zinc-700 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-normal text-muted-foreground">Govt. ID No. (Optional)</Label>
                      <Input value={emp.govtId} onChange={(e) => updateEmployee(idx, 'govtId', e.target.value)} placeholder="e.g., Aadhar/PAN" className="h-10 bg-zinc-900/50 border-zinc-700 text-sm" />
                    </div>
                  </div>
                </div>
              ))}

              <div>
                <Button variant="outline" onClick={addEmployeeCard} className="border-dashed border-zinc-700 text-zinc-400 hover:text-zinc-200">
                  <PlusCircle size={16} className="mr-2" /> Add Another Employee
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              {vendors.map((v, idx) => (
                <div key={idx} className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border shadow-sm space-y-6 relative">
                  <div className="absolute top-4 right-4">
                    <Button variant="ghost" size="icon" onClick={() => removeVendor(idx)} className="h-8 w-8 text-muted-foreground hover:text-red-400">
                      <Trash2 size={16} />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-normal text-muted-foreground">Vendor {idx + 1} Name</Label>
                      <Input value={v.name} onChange={(e) => updateVendor(idx, 'name', e.target.value)} placeholder="e.g. Local Veggies Co." className="h-10 bg-zinc-900/50 border-zinc-700 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-normal text-muted-foreground">Mobile No.</Label>
                      <Input value={v.phone} onChange={(e) => updateVendor(idx, 'phone', e.target.value)} placeholder="e.g., 9876543210" className="h-10 bg-zinc-900/50 border-zinc-700 text-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-normal text-muted-foreground">Email (Optional)</Label>
                      <Input value={v.email} onChange={(e) => updateVendor(idx, 'email', e.target.value)} placeholder="e.g., vendor@example.com" className="h-10 bg-zinc-900/50 border-zinc-700 text-sm" />
                    </div>
                  </div>
                </div>
              ))}

              <div>
                <Button variant="outline" onClick={addVendorCard} className="border-dashed border-zinc-700 text-zinc-400 hover:text-zinc-200">
                  <PlusCircle size={16} className="mr-2" /> Add Another Vendor
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col gap-4 mt-8 border-t border-border/10 pt-6">
          <div className="flex w-full justify-between items-center">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1}
              className={cn(
                "min-w-[100px] border-zinc-700 bg-transparent hover:bg-zinc-800 text-zinc-300",
                step === 1 && "invisible"
              )}
            >
              <ArrowLeft size={14} className="mr-2" /> Previous
            </Button>

            <button type="button" onClick={handleFinish} className="text-xs text-orange-500 hover:text-orange-400 font-medium opacity-80 hover:opacity-100 transition-opacity">Skip for now</button>
          </div>

          <div className="w-full flex justify-end">
            {step < 4 ? (
              <Button
                onClick={handleNext}
                className="bg-orange-500 hover:bg-orange-600 text-white min-w-[100px]"
              >
                Next <ArrowRight size={14} className="ml-2" />
              </Button>
            ) : (
              <Button onClick={handleFinish} className="bg-orange-500 hover:bg-orange-600 text-white min-w-[100px]">
                Finish Setup
              </Button>
            )}

          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog >
  );
}
