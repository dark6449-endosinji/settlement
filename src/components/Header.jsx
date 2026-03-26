import React from 'react';
import { CreditCard, Search, PlusCircle, Wallet, LogIn, LogOut } from 'lucide-react';

const Header = ({ activeTab, setActiveTab, isAdmin, onLoginClick, onLogoutClick }) => {
  return (
    <header className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-indigo-700 flex items-center gap-2">
          <CreditCard className="w-6 h-6 md:w-8 md:h-8" />
          Smart Settlement
        </h1>
        <p className="text-sm md:text-base text-gray-500 mt-1">간편하게 정산 내역을 입력하고 관리하세요.</p>
      </div>
      
      <div className="flex items-center gap-4 self-start md:self-auto">
        {/* Tabs Navigation */}
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('view')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 md:px-5 py-2 md:py-2.5 rounded-lg transition-all text-sm md:text-base ${
              activeTab === 'view' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <Search size={16} />
            <span className="font-medium">조회</span>
          </button>
          
          {isAdmin && (
            <button
              onClick={() => setActiveTab('input')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 md:px-5 py-2 md:py-2.5 rounded-lg transition-all text-sm md:text-base ${
                activeTab === 'input' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <PlusCircle size={16} />
              <span className="font-medium">입력</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('budget')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 md:px-5 py-2 md:py-2.5 rounded-lg transition-all text-sm md:text-base ${
              activeTab === 'budget' ? 'bg-indigo-600 text-white shadow-md' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            <Wallet size={16} />
            <span className="font-medium">예산</span>
          </button>
        </div>

        {/* Admin Login/Logout Button */}
        <button
          onClick={isAdmin ? onLogoutClick : onLoginClick}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all text-sm font-medium ${
            isAdmin ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {isAdmin ? (
            <>
              <LogOut size={16} />
              <span className="hidden md:inline">로그아웃</span>
            </>
          ) : (
            <>
              <LogIn size={16} />
              <span className="hidden md:inline">관리자 로그인</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
