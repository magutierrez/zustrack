'use client';

import { useTranslations } from 'next-intl';
import { Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useSettings } from '@/hooks/use-settings';

interface SettingsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ isOpen, onOpenChange }: SettingsModalProps) {
  const t = useTranslations('Auth');
  const { unitSystem, windUnit, setUnitSystem, setWindUnit } = useSettings();

  const handleSave = () => {
    onOpenChange(false);
    // Settings are saved automatically via localStorage in the useSettings hook
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" /> {t('settingsTitle')}
          </DialogTitle>
          <DialogDescription>{t('settingsDescription')}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="unitSystem" className="text-right">
              {t('system')}
            </Label>
            <Select value={unitSystem} onValueChange={(value) => setUnitSystem(value as any)}>
              <SelectTrigger id="unitSystem" className="col-span-3">
                <SelectValue placeholder="Select unit system" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="metric">{t('metric')}</SelectItem>
                <SelectItem value="us">{t('us')}</SelectItem>
                <SelectItem value="uk">{t('uk')}</SelectItem>
                <SelectItem value="imperial">{t('imperial')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="windUnit" className="text-right">
              {t('windUnit')}
            </Label>
            <Select value={windUnit} onValueChange={(value) => setWindUnit(value as any)}>
              <SelectTrigger id="windUnit" className="col-span-3">
                <SelectValue placeholder="Select wind speed unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kmh">km/h</SelectItem>
                <SelectItem value="mph">mph</SelectItem>
                <SelectItem value="knots">knots</SelectItem>
                <SelectItem value="ms">m/s</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSave}>
            {t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
