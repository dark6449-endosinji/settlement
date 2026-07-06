import React from 'react';
import { CreditCard, BarChart2, PlusCircle, Wallet, LogIn, LogOut, Banknote, Tent } from 'lucide-react';

const TAB_ITEMS = (isAdmin) => [
  { key: 'view',    icon: <BarChart2 size={15} />,  label: '정산현황',  activeColor: 'bg-indigo-600 text-white shadow-md' },
  { key: 'advance', icon: <Banknote size={15} />,   label: '전도금',    activeColor: 'bg-indigo-600 text-white shadow-md' },
  ...(isAdmin ? [{ key: 'input', icon: <PlusCircle size={15} />, label: '입력', activeColor: 'bg-indigo-600 text-white shadow-md' }] : []),
  { key: 'budget',  icon: <Wallet size={15} />,     label: '예산',      activeColor: 'bg-indigo-600 text-white shadow-md' },
  { key: 'camp',    icon: <Tent size={15} />,       label: '여름캠프',  activeColor: 'bg-emerald-600 text-white shadow-md' },
];

const Header = ({ activeTab, setActiveTab, isAdmin, onLoginClick, onLogoutClick }) => {
  const tabs = TAB_ITEMS(isAdmin);
  return (
    <header className="mb-4 md:mb-8">
      {/* 상단: 타이틀 + 로그인 */}
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-indigo-700 flex items-center gap-2">
            <CreditCard className="w-5 h-5 md:w-8 md:h-8" />
            Smart Settlement
          </h1>
          <p className="text-xs md:text-base text-gray-400 mt-0.5">간편하게 정산 내역을 입력하고 관리하세요.</p>
        </div>

        {/* 로그인/로그아웃 */}
        <button
          onClick={isAdmin ? onLogoutClick : onLoginClick}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all text-xs md:text-sm font-semibold flex-shrink-0 ${
            isAdmin ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {isAdmin ? (
            <>
              <LogOut size={14} />
              <span className="hidden sm:inline">로그아웃</span>
            </>
          ) : (
            <>
              <LogIn size={14} />
              <span className="hidden sm:inline">관리자 로그인</span>
            </>
          )}
        </button>
      </div>

      {/* 탭 네비게이션 — 모바일: 가로 스크롤 */}
      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200 gap-0.5 min-w-max md:min-w-0 md:w-auto">
          {tabs.map(({ key, icon, label, activeColor }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center justify-center gap-1 px-3 md:px-5 py-2 md:py-2.5 rounded-lg transition-all text-xs md:text-sm font-semibold whitespace-nowrap ${
                activeTab === key ? activeColor : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};

export default Header;
