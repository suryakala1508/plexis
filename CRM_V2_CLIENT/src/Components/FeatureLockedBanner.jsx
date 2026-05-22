import React from 'react';
import { Lock, Zap } from 'lucide-react';

export interface FeatureLockedBannerProps {
  featureName?: string;
  featureDisplayName?: string;
  requiredPlan?: string;
  description?: string;
  onUpgradeClick?: () => void;
  showIcon?: boolean;
  compact?: boolean;
}

/**
 * Component shown when a feature is locked behind a plan upgrade
 * Displays an upgrade prompt with the feature name and required plan
 */
export const FeatureLockedBanner: React.FC<FeatureLockedBannerProps> = ({
  featureName = 'This feature',
  featureDisplayName = featureName,
  requiredPlan = 'Pro',
  description = 'More premium features await!',
  onUpgradeClick,
  showIcon = true,
  compact = false,
}) => {
  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200">
        <Lock size={14} className="text-blue-600" />
        <span className="text-sm font-medium text-blue-700">
          Upgrade to {requiredPlan}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
      <div className="flex items-start gap-4">
        {showIcon && (
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-blue-100">
              <Lock className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        )}
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {featureDisplayName} is a Premium Feature
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Upgrade to <span className="font-semibold text-blue-700">{requiredPlan}</span> plan to access this feature. {description}
          </p>
          
          {onUpgradeClick && (
            <button
              onClick={onUpgradeClick}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <Zap size={16} />
              Upgrade to {requiredPlan}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeatureLockedBanner;
