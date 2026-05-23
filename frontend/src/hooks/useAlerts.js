import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAlerts, acknowledgeAlert, resolveAlert } from '../api/alert.api';

export default function useAlerts(params) {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: ['alerts', params], queryFn: () => getAlerts(params).then(r => r.data) });
  const acknowledge = useMutation({ mutationFn: acknowledgeAlert, onSuccess: () => qc.invalidateQueries(['alerts']) });
  const resolve = useMutation({ mutationFn: resolveAlert, onSuccess: () => qc.invalidateQueries(['alerts']) });
  return { ...query, acknowledge, resolve };
}
