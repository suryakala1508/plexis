import { get } from './api'

export const getCurrentSubscription = async () => {
  const response = await get('/subscription/current')
  return response.data || null
}

export const getSubscriptionPlans = async () => {
  const response = await get('/subscription/plans')
  return response.data || []
}
