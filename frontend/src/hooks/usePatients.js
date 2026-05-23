import { useQuery } from '@tanstack/react-query';
import { getPatients, getPatient } from '../api/patient.api';

export function usePatients() {
  return useQuery({ queryKey: ['patients'], queryFn: () => getPatients().then(r => r.data) });
}

export function usePatient(id) {
  return useQuery({ queryKey: ['patient', id], queryFn: () => getPatient(id).then(r => r.data), enabled: !!id });
}
