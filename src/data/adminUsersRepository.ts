import { supabase } from '../lib/supabase';
import type { AssignableRole } from './adminRepository';

export type ManagedUser = {
  id: string;
  email: string;
  displayName: string;
  role: AssignableRole | 'super_admin';
  createdAt: string;
};
type UserInput = { displayName: string; email: string; password?: string; role: AssignableRole };

async function invoke<T>(body: Record<string, unknown>): Promise<T> {
  if (!supabase) throw new Error('Supabase no está configurado.');
  const { data, error } = await supabase.functions.invoke('admin-users', { body });
  if (error) throw error;
  if (data?.error) throw new Error(String(data.error));
  return data as T;
}

export async function listManagedUsers() {
  return (await invoke<{ users: ManagedUser[] }>({ action: 'list' })).users;
}
export async function createManagedUser(input: Required<UserInput>) {
  await invoke({ action: 'create', ...input });
}
export async function updateManagedUser(id: string, input: UserInput) {
  await invoke({ action: 'update', id, ...input });
}
export async function deleteManagedUser(id: string) {
  await invoke({ action: 'delete', id });
}
