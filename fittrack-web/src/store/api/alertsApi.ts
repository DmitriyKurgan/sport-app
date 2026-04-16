import { ActOnResult, Alert } from '@/types';
import { baseApi } from './baseApi';

export const alertsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getActiveAlerts: build.query<Alert[], void>({
      query: () => '/alerts',
      providesTags: ['Alerts'],
      keepUnusedDataFor: 60,
    }),
    dismissAlert: build.mutation<Alert, string>({
      query: (id) => ({ url: `/alerts/${id}/dismiss`, method: 'POST' }),
      invalidatesTags: ['Alerts'],
    }),
    actOnAlert: build.mutation<ActOnResult, string>({
      query: (id) => ({ url: `/alerts/${id}/act`, method: 'POST' }),
      invalidatesTags: ['Alerts', 'Program', 'Nutrition', 'Analytics'],
    }),
    runDetectors: build.mutation<{ created: Alert[] }, void>({
      query: () => ({ url: '/alerts/run-detectors', method: 'POST' }),
      invalidatesTags: ['Alerts'],
    }),
  }),
});

export const {
  useGetActiveAlertsQuery,
  useDismissAlertMutation,
  useActOnAlertMutation,
  useRunDetectorsMutation,
} = alertsApi;
