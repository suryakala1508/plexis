import { Shield, Lock, FileText } from 'lucide-react';

export const TrustFooter = () => {
  const trustItems = [
    { icon: Shield, text: 'Data Privacy Guaranteed' },
    { icon: Lock, text: 'Encrypted & Secure' },
    { icon: FileText, text: 'Track in My Tickets' },
  ];

  return (
    <div className="mt-5 pt-4 border-t border-slate-200">
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {trustItems.map((item) => (
          <div
            key={item.text}
            className="flex items-center gap-2 text-xs text-slate-500"
          >
            <item.icon className="w-3.5 h-3.5 text-primary" />
            <span>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
