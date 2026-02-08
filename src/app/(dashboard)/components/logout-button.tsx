'use client';

import { LogOut } from 'lucide-react';

import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { logout } from '@/features/auth/actions';

export function LogoutButton() {
  const handleLogout = async () => {
    await logout();
  };

  return (
    <DropdownMenuItem
      onClick={handleLogout}
      className="cursor-pointer text-red-600 focus:text-red-600"
    >
      <LogOut className="mr-2 h-4 w-4" />
      <span>Выйти</span>
    </DropdownMenuItem>
  );
}
