//apps/web/src/components/SiteCombobox.tsx
"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type SiteOption = {
  id: string;
  name: string;
};

type Props = {
  sites: SiteOption[];
  value: string | null;
  onChange: (nextSiteId: string | null) => void;
  disabled?: boolean; // 将来「閲覧専用」に備える
};

export function SiteCombobox({ sites, value, onChange, disabled }: Props) {
  const [open, setOpen] = React.useState(false);

  const selectedSite = sites.find((s) => s.id === value);
  const label =
    value === null
      ? "全ての現場"
      : selectedSite
        ? selectedSite.name
        : "現場を選択";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-[220px] justify-between"
        >
          {label}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[220px] p-0">
        <Command>
          <CommandInput placeholder="現場名で検索…" disabled={disabled} />
          <CommandEmpty>該当する現場がありません。</CommandEmpty>

          <CommandGroup>
            <CommandItem
              value="全て"
              onSelect={() => {
                onChange(null);
                setOpen(false);
              }}
            >
              <Check
                className={`mr-2 h-4 w-4 ${value === null ? "opacity-100" : "opacity-0"
                  }`}
              />
              全ての現場
            </CommandItem>

            {sites.map((site) => (
              <CommandItem
                key={site.id}
                value={site.name}
                onSelect={() => {
                  onChange(site.id);
                  setOpen(false);
                }}
              >
                <Check
                  className={`mr-2 h-4 w-4 ${value === site.id ? "opacity-100" : "opacity-0"
                    }`}
                />
                {site.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}