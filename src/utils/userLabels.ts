import { UserRole } from '../types.ts';

export const DEVELOPER_EMAIL = 'rllautomations@gmail.com';

export const isDeveloperAccount = (email?: string) =>
  email?.trim().toLowerCase() === DEVELOPER_EMAIL;

export const getRoleLabel = (email: string | undefined, role: UserRole, long = false) => {
  if (isDeveloperAccount(email)) return long ? 'Developer · RLL Solutions' : 'DEVELOPER';
  if (role === 'admin') return long ? 'Administrador' : 'ADMIN';
  return long ? 'Leitor' : 'LEITOR';
};
