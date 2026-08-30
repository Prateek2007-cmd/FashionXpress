import React, { useState } from 'react';
import { MapPin, ChevronDown, X, Check, Search } from 'lucide-react';
import { usePincode } from '@/context/PincodeContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function PincodePicker() {
  const { selectedPincode, selectedPincodeInfo, availablePincodes, loadingPincodes, setPincode } = usePincode();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [manualInput, setManualInput] = useState('');

  const filtered = availablePincodes.filter((p) =>
    p.pincode.includes(search) ||
    p.area.toLowerCase().includes(search.toLowerCase()) ||
    p.city.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (pincode: string) => {
    setPincode(pincode);
    setOpen(false);
    setSearch('');
    setManualInput('');
  };

  const handleManualSubmit = () => {
    const code = manualInput.trim();
    if (code.length === 6 && /^\d+$/.test(code)) {
      setPincode(code);
      setOpen(false);
      setManualInput('');
      setSearch('');
    }
  };

  return (
    <>
      {/* Trigger bar */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Change delivery pincode"
        className="flex items-center gap-1.5 text-xs sm:text-sm font-medium px-2.5 py-1.5 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors group min-h-[36px]"
      >
        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
        <span className="max-w-[90px] sm:max-w-[130px] truncate">
          {selectedPincodeInfo
            ? <><span className="text-primary font-bold">{selectedPincodeInfo.pincode}</span> <span className="text-muted-foreground hidden sm:inline">· {selectedPincodeInfo.area}</span></>
            : selectedPincode
              ? <span className="text-primary font-bold">{selectedPincode}</span>
              : <span className="text-muted-foreground">Select location</span>
          }
        </span>
        <ChevronDown className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
      </button>

      {/* Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border bg-card">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <MapPin className="w-5 h-5 text-primary" />
              Choose your delivery location
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Only products available in your area will be shown
            </p>
          </DialogHeader>

          <div className="px-6 py-4 space-y-4">
            {/* Manual pincode input */}
            <div className="flex gap-2">
              <Input
                placeholder="Enter 6-digit pincode"
                value={manualInput}
                maxLength={6}
                inputMode="numeric"
                onChange={(e) => setManualInput(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                className="flex-1 font-mono tracking-widest"
              />
              <Button
                onClick={handleManualSubmit}
                disabled={manualInput.length !== 6}
                size="sm"
                className="shrink-0"
              >
                Apply
              </Button>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">or choose from available areas</span>
              </div>
            </div>

            {/* Search serviceable pincodes */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search area or city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* List */}
            <div className="max-h-64 overflow-y-auto space-y-1 -mx-1 px-1">
              {loadingPincodes ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {availablePincodes.length === 0
                    ? 'No service areas available yet'
                    : 'No areas match your search'}
                </div>
              ) : (
                filtered.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelect(p.pincode)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors hover:bg-muted group ${selectedPincode === p.pincode ? 'bg-primary/10 border border-primary/30' : ''}`}
                  >
                    <MapPin className={`w-4 h-4 shrink-0 ${selectedPincode === p.pincode ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="font-mono font-bold text-sm">{p.pincode}</div>
                      <div className="text-xs text-muted-foreground truncate">{p.area}, {p.city}, {p.state}</div>
                    </div>
                    {selectedPincode === p.pincode && (
                      <Check className="w-4 h-4 text-primary shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Clear button */}
            {selectedPincode && (
              <button
                onClick={() => { setPincode(null); setOpen(false); }}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm text-destructive hover:text-destructive/80 transition-colors"
              >
                <X className="w-4 h-4" />
                Clear location filter (show all products)
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
