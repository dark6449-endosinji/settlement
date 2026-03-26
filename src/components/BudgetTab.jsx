import React, { useState, useMemo } from 'react';
import { Wallet, Pencil, Save } from 'lucide-react';

const BudgetTab = ({ budget, setBudget, items, isAdmin, handleSaveBudget }) => {
  const [isEditingBudget, setIsEditingBudget] = useState(false);

  const spent = useMemo(() => {
    const s = { 교사운영비: 0, 학생교육비: 0, 팀운영비: 0, 행사비: 0 };
    items.forEach(item => {
      if (s[item.brief] !== undefined) {
        s[item.brief] += item.amount;
      }
    });
    return s;
  }, [items]);

  const calcTotal = (keys) => keys.reduce((acc, key) => acc + (budget[key] || 0), 0);
  const calcSpent = (keys) => keys.reduce((acc, key) => acc + (spent[key] || 0), 0);

  const renderBudgetRow = (label, keys, isSubItem = false, isHeader = false) => {
    const rowBudget = calcTotal(keys);
    const rowSpent = calcSpent(keys);
    const rowRemain = rowBudget - rowSpent;
    const isBaseItem = keys.length === 1 && isSubItem;
    const baseKey = keys[0];

    return (
      <tr className={`border-b border-gray-200 ${isHeader ? 'bg-yellow-100/60 font-bold' : 'hover:bg-gray-50'} transition-colors`}>
        <td className={`px-4 md:px-6 py-3 md:py-4 border-r border-gray-200 ${isSubItem ? 'pl-8 md:pl-12 text-gray-600 text-left' : 'font-semibold text-gray-800 text-center'}`}>
          {label}
        </td>
        <td className="px-4 md:px-6 py-3 md:py-4 text-right border-r border-gray-200">
          {isEditingBudget && isBaseItem ? (
            <div className="flex justify-end items-center gap-1">
              <span className="text-gray-400">₩</span>
              <input
                type="number"
                value={budget[baseKey] || 0}
                onChange={(e) => setBudget(prev => ({...prev, [baseKey]: Number(e.target.value)}))}
                className="w-24 md:w-32 p-1.5 border border-indigo-300 rounded text-right focus:ring-2 focus:ring-indigo-500 outline-none bg-indigo-50"
              />
            </div>
          ) : (
            <span className="font-medium text-gray-800">₩{rowBudget.toLocaleString()}</span>
          )}
        </td>
        <td className="px-4 md:px-6 py-3 md:py-4 text-right text-rose-600 font-medium border-r border-gray-200">
          {rowSpent > 0 ? `- ₩${rowSpent.toLocaleString()}` : `₩0`}
        </td>
        <td className="px-4 md:px-6 py-3 md:py-4 text-right text-indigo-600 font-bold">
          ₩{rowRemain.toLocaleString()}
        </td>
      </tr>
    );
  };

  const group1Keys = ['교사운영비', '학생교육비', '팀운영비'];
  const group2Keys = ['행사비'];
  const allKeys = [...group1Keys, ...group2Keys];

  return (
    <div className="bg-white rounded-2xl shadow-sm md:shadow-lg border border-gray-100 overflow-hidden animate-in fade-in duration-300">
      <div className="p-4 md:p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
        <h3 className="font-bold text-gray-700 flex items-center gap-2 text-sm md:text-base">
          <Wallet className="w-5 h-5 text-indigo-500" />
          연간 예산 및 지출 현황
        </h3>
        {isAdmin && (
          isEditingBudget ? (
            <button
              onClick={() => {
                handleSaveBudget();
                setIsEditingBudget(false);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Save size={16} /> 변경사항 저장
            </button>
          ) : (
            <button
              onClick={() => setIsEditingBudget(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-gray-600 text-sm font-bold rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Pencil size={16} /> 예산 설정
            </button>
          )
        )}
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-100 text-gray-600 border-b border-gray-200">
            <tr>
              <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-center border-r border-gray-200">활동항목명</th>
              <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-right border-r border-gray-200">예산액</th>
              <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-right border-r border-gray-200">지출액 (차감)</th>
              <th className="px-4 md:px-6 py-3 md:py-4 font-bold text-right">잔여 예산</th>
            </tr>
          </thead>
          <tbody>
            {renderBudgetRow('합 계', allKeys, false, true)}
            {renderBudgetRow('사회봉사비', allKeys)}
            {renderBudgetRow('봉사비', allKeys)}
            {renderBudgetRow('교회학교운영비(장)', group1Keys)}
            {renderBudgetRow('· 교사운영비', ['교사운영비'], true)}
            {renderBudgetRow('· 학생교육비', ['학생교육비'], true)}
            {renderBudgetRow('· 팀운영비', ['팀운영비'], true)}
            {renderBudgetRow('교회학교행사비(장)', group2Keys)}
            {renderBudgetRow('· 행사비', ['행사비'], true)}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BudgetTab;
