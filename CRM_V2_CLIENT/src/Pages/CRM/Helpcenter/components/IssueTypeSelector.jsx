import { motion } from "framer-motion";
import {
  ChevronDown,
  Key,
  Bug,
  CreditCard,
  Lightbulb,
  User,
  HelpCircle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/Components/ui/select";
import { Label } from "@/Components/ui/label";
import { issueTypes } from "../constants/ticketConstants";

const iconMap = {
  key: Key,
  bug: Bug,
  "credit-card": CreditCard,
  lightbulb: Lightbulb,
  user: User,
  "help-circle": HelpCircle,
};

export const IssueTypeSelector = ({ value, onChange }) => {
  const selectedType = issueTypes.find((t) => t.id === value);

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold text-gray-900 flex items-center gap-1">
        Issue Type <span className="text-red-500">*</span>
      </Label>

      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full h-12 bg-white border-slate-200 hover:border-primary/50 focus:border-primary focus:ring-purple-600/20 transition-all">
          <SelectValue placeholder="Select the type of issue">
            {selectedType && (
              <div className="flex items-center gap-3">
                {iconMap[selectedType.icon] && (
                  <span className="flex items-center justify-center w-6 h-6 rounded-md bg-purple-600/10">
                    {(() => {
                      const Icon = iconMap[selectedType.icon];
                      return <Icon className="w-4 h-4 text-primary" />;
                    })()}
                  </span>
                )}
                <span>{selectedType.label}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>

        <SelectContent className="bg-white border-slate-200 shadow-lg z-[100]">
          {issueTypes.map((type) => {
            const Icon = iconMap[type.icon];
            return (
              <SelectItem
                key={type.id}
                value={type.id}
                className="cursor-pointer focus:bg-purple-600/10 focus:text-slate-900"
              >
                <div className="flex items-center gap-3 py-1">
                  {Icon && (
                    <span className="flex items-center justify-center w-6 h-6 rounded-md bg-purple-600/10">
                      <Icon className="w-4 h-4 text-primary" />
                    </span>
                  )}
                  <div>
                    <div className="font-medium">{type.label}</div>
                    <div className="text-xs text-slate-500">
                      {type.description}
                    </div>
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
};
