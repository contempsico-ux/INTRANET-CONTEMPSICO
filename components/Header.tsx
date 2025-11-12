import React, { useState } from 'react';
import { useAuth } from '../App';
import { Profile } from '../types';
import {
  MegaphoneIcon,
  CalendarDaysIcon,
  ClipboardDocumentCheckIcon,
  FolderIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
} from './Icons';

interface HeaderProps {
  activePage: string;
  setActivePage: (page: string) => void;
}

const navItems = [
  { name: 'Mural', icon: MegaphoneIcon, profiles: [Profile.Gestao, Profile.Colaborador, Profile.Psicologo] },
  { name: 'Calendário', icon: CalendarDaysIcon, profiles: [Profile.Gestao, Profile.Colaborador, Profile.Psicologo] },
  { name: 'Tarefas', icon: ClipboardDocumentCheckIcon, profiles: [Profile.Gestao, Profile.Colaborador, Profile.Psicologo] },
  { name: 'Recursos', icon: FolderIcon, profiles: [Profile.Gestao, Profile.Colaborador, Profile.Psicologo] },
];

const Header: React.FC<HeaderProps> = ({ activePage, setActivePage }) => {
  const { currentUser, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!currentUser) return null;

  const filteredNavItems = navItems.filter(item => item.profiles.includes(currentUser.profile));

  const handleNavClick = (page: string) => {
    setActivePage(page);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-primary sticky top-0 z-30">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl md:text-2xl font-bold text-white">
                CONTEMPSICO
              </h1>
            </div>
            <nav className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                {filteredNavItems.map(item => {
                  const isActive = activePage === item.name;
                  return (
                    <button
                      key={item.name}
                      onClick={() => handleNavClick(item.name)}
                      className={`px-3 py-2 rounded-md text-base font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-primary-dark text-white'
                          : 'text-white opacity-80 hover:bg-primary-dark hover:opacity-100'
                      }`}
                    >
                      {item.name}
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>
          <div className="flex items-center">
             <div className="flex items-center space-x-4">
                <div className="text-right text-white">
                  <p className="font-semibold text-sm">{currentUser.name}</p>
                  <p className="text-xs opacity-80">{currentUser.profile}</p>
                </div>
                <button 
                  onClick={logout} 
                  title="Sair"
                  className="p-2 rounded-full text-white hover:bg-primary-dark transition-colors duration-200"
                >
                  <ArrowRightOnRectangleIcon className="h-6 w-6" />
                </button>
             </div>
            <div className="ml-2 md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-200 hover:text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <nav className="md:hidden bg-primary border-t border-primary-dark">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {filteredNavItems.map(item => {
              const Icon = item.icon;
              const isActive = activePage === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item.name)}
                  className={`w-full flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                    isActive
                      ? 'bg-primary-dark text-white'
                      : 'text-white opacity-80 hover:bg-primary-dark hover:opacity-100'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.name}
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
};

export default Header;