import { motion } from "framer-motion"
import { Input } from "@/Components/ui/input"
import { Textarea } from "@/Components/ui/textarea"
import { Label } from "@/Components/ui/label"

export const DynamicFormField = ({ field, value, onChange, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className="space-y-2"
    >
      <Label
        htmlFor={field.name}
        className="text-sm font-medium text-slate-900"
      >
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      {field.type === "textarea" ? (
        <Textarea
          id={field.name}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          required={field.required}
          className="min-h-[100px] resize-none bg-white border-slate-200 focus:border-primary focus:ring-purple-600/20 transition-all"
        />
      ) : (
        <Input
          id={field.name}
          type={field.type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder}
          required={field.required}
          className="bg-white border-slate-200 focus:border-primary focus:ring-purple-600/20 transition-all"
        />
      )}
    </motion.div>
  )
}
