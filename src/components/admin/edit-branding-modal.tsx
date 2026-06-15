"use client";

import { useState } from "react";
import { X, Loader2, Palette, Upload, Image as ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";

interface EditBrandingModalProps {
  school: {
    id: string;
    name: string;
    code: string;
    logoUrl: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
    accentColor: string | null;
    backgroundColor: string | null;
    textColor: string | null;
  };
}

export default function EditBrandingModal({ school }: EditBrandingModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Theme states
  const [logoBase64, setLogoBase64] = useState<string | null>(school.logoUrl);
  const [primaryColor, setPrimaryColor] = useState(school.primaryColor || "#3b82f6");
  const [secondaryColor, setSecondaryColor] = useState(school.secondaryColor || "#1e293b");
  const [accentColor, setAccentColor] = useState(school.accentColor || "#10b981");
  const [backgroundColor, setBackgroundColor] = useState(school.backgroundColor || "#ffffff");
  const [textColor, setTextColor] = useState(school.textColor || "#0f172a");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 512 * 1024) {
      setErrorMsg("File is too large. Logo must be under 500KB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const response = await fetch(`/api/admin/schools/${school.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logoUrl: logoBase64,
          primaryColor,
          secondaryColor,
          accentColor,
          backgroundColor,
          textColor,
        }),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        setErrorMsg(resData.message || "Failed to update branding settings");
      } else {
        setSuccessMsg("Branding and theme saved successfully!");
        router.refresh();
        setTimeout(() => {
          setIsOpen(false);
          setSuccessMsg(null);
        }, 1500);
      }
    } catch {
      setErrorMsg("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-border bg-card hover:bg-secondary text-[10px] font-semibold transition-all cursor-pointer shadow-sm text-foreground"
      >
        <Palette className="h-3 w-3" />
        <span>Customize Theme</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <Palette className="h-4 w-4 text-violet-500" />
                  <span>White-Label Branding — {school.name}</span>
                </h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Configure organization colors and logo</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveBranding} className="p-6 space-y-5">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold">
                  {errorMsg}
                </div>
              )}
              {successMsg && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-semibold">
                  {successMsg}
                </div>
              )}

              {/* Logo Upload Section */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Institution Logo</label>
                <div className="flex items-center gap-4 p-4 rounded-xl border border-dashed border-border bg-secondary/10">
                  <div className="h-16 w-16 rounded-lg border border-border bg-background flex items-center justify-center overflow-hidden shrink-0">
                    {logoBase64 ? (
                      <img src={logoBase64} alt="Preview" className="h-full w-full object-contain p-1" />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                    )}
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <p className="text-xs font-semibold">Upload custom logo image</p>
                    <p className="text-[9px] text-muted-foreground">Supported format: PNG, JPG (Max 500KB). Fits top-left header.</p>
                    <label className="inline-flex items-center gap-1.5 py-1 px-3 rounded bg-secondary hover:bg-secondary/80 text-[10px] font-semibold text-foreground cursor-pointer border border-border shadow-sm transition">
                      <Upload className="h-3 w-3" />
                      <span>Choose File</span>
                      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </label>
                  </div>
                  {logoBase64 && (
                    <button
                      type="button"
                      onClick={() => setLogoBase64(null)}
                      className="text-[10px] text-red-500 font-semibold hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Color Settings */}
              <div className="space-y-3">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Theme Palette Configurations</label>
                <div className="grid grid-cols-2 gap-4">
                  {/* Primary Color */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-semibold text-foreground">Primary Color</label>
                      <span className="text-[10px] text-muted-foreground font-mono">{primaryColor}</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="h-9 w-9 rounded-lg border border-input cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        placeholder="#3b82f6"
                        maxLength={7}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-input bg-background text-xs font-mono focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Secondary Color */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-semibold text-foreground">Secondary Color</label>
                      <span className="text-[10px] text-muted-foreground font-mono">{secondaryColor}</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="h-9 w-9 rounded-lg border border-input cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        placeholder="#1e293b"
                        maxLength={7}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-input bg-background text-xs font-mono focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Accent Color */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-semibold text-foreground">Accent Color</label>
                      <span className="text-[10px] text-muted-foreground font-mono">{accentColor}</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="h-9 w-9 rounded-lg border border-input cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        placeholder="#10b981"
                        maxLength={7}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-input bg-background text-xs font-mono focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Background Color */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-semibold text-foreground">Background Color</label>
                      <span className="text-[10px] text-muted-foreground font-mono">{backgroundColor}</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="h-9 w-9 rounded-lg border border-input cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        placeholder="#ffffff"
                        maxLength={7}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-input bg-background text-xs font-mono focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Text Color */}
                  <div className="space-y-1 col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-semibold text-foreground">Text Color (Optional)</label>
                      <span className="text-[10px] text-muted-foreground font-mono">{textColor}</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="h-9 w-9 rounded-lg border border-input cursor-pointer bg-transparent"
                      />
                      <input
                        type="text"
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        placeholder="#0f172a"
                        maxLength={7}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-input bg-background text-xs font-mono focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="py-2 px-4 rounded-lg border border-border hover:bg-secondary text-foreground text-xs font-semibold cursor-pointer"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Theme Configuration</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
