import { HttpClient, httpResource } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

export const API = 'http://candidate-portal-production-e6ab4750.up.railway.app/api';

export const STATUSES = ['applied', 'interviewing', 'offered', 'hired', 'rejected'] as const;
export type Status = (typeof STATUSES)[number];

export interface Skill {
  id: number;
  name: string;
}
//
export interface Candidate {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: Status;
  experience: number;
  expectedSalary: number | null;
  assignedSalary: number | null;
  skills: Skill[];
  createdAt: string;
  deletedAt?: string;
}

export interface Page {
  data: Candidate[];
  meta: { totalItems: number; totalPages: number; currentPage: number };
}

export interface CandidateInput {
  name: string;
  email: string;
  phone: string;
  status: Status;
  experience: number;
  expectedSalary: number | null;
  assignedSalary: number | null;
  skillIds: number[];
}

@Injectable({ providedIn: 'root' })
export class Api {
  private http = inject(HttpClient);

  // skills hardly ever change, so load them once and let every page share them
  skills = httpResource<Skill[]>(() => `${API}/skills`);

  get(id: number) {
    return this.http.get<Candidate>(`${API}/candidates/${id}`);
  }

  save(body: CandidateInput, id?: number) {
    return id
      ? this.http.put(`${API}/candidates/${id}`, body)
      : this.http.post(`${API}/candidates`, body);
  }

  remove(id: number) {
    return this.http.delete(`${API}/candidates/${id}`);
  }

  restore(id: number) {
    return this.http.post(`${API}/candidates/${id}/restore`, {});
  }
}

export const tones: Record<Status, string> = {
  applied: 'bg-gray-100 text-gray-700',
  interviewing: 'bg-blue-50 text-blue-700',
  offered: 'bg-amber-50 text-amber-800',
  hired: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-700',
};

export const initials = (name: string) =>
  name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export const formatPhone = (phone: string | null) =>
  phone ? phone.replace(/(\d{5})(\d{5})/, '$1 $2') : '—';

export const clean = (params: object) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== '')) as Record<
    string,
    string | number
  >;
