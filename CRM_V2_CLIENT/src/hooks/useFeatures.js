import { useSubscription } from '../contexts/SubscriptionContext';

/**
 * Hook to check feature availability
 * Usage: const { isFeatureAvailable } = useFeatures();
 *        if (!isFeatureAvailable('dashboard_access')) { ... }
 */
export const useFeatures = () => {
  const { subscription, canAccess } = useSubscription();

  return {
    planType: subscription?.planType || 'basic',
    planName: subscription?.planName || 'Basic',
    features: subscription?.features || {},
    isFeatureAvailable: (featureName) => canAccess(featureName),
  };
};
