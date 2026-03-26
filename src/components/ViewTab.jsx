import React, { useState, useMemo, useEffect } from 'react';
import { List, User, RefreshCw, Trash2, Pencil, Calendar, ChevronLeft, ChevronRight, ArrowUpDown, TrendingUp, PieChart } from 'lucide-react';

const ViewTab = ({ items, isAdmin, onEditClick, onDelete, onToggleStatus }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const ITEMS_PER_PAGE = 10;

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [items]);

  const totalPages = Math.ceil(sortedItems.length / ITEMS_PER_PAGE) || 1;
  const currentItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedItems.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedItems, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages));
    }
  }, [totalPages, currentPage]);

  const monthlyTotals = useMemo(() => {
    const groups = {};
    items.forEach(item => {
      const month = item.date.substring(0, 7);
      groups[month] = (groups[month] || 0) + item.amount;
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [items]);

  const recipientTotals = useMemo(() => {
    const groups = {};
    items.forEach(item => {
      groups[item.recipient] = (groups[item.recipient] || 0) + item.amount;
    });
    return Object.entries(groups).sort((a, b) => b[1] - a[1]);
  }, [items]);

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center gap-3 md:gap-4 col-span-2 md:col-span-1">
          <div className="p-2 md:p-3 bg-indigo-100 text-indigo-600 rounded-xl w-fit">
            <ArrowUpDown size={20} className="md:w-6 md:h-6" />
          </div>
          <div>
            <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">총 정산 건수</p>
            <p className="text-xl md:text-2xl font-bold text-gray-800">{items.length} 건</p>
          </div>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 md:p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <TrendingUp size={16} className="md:w-5 md:h-5" />
            </div>
            <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">총 정산 금액</p>
          </div>
          <p className="text-lg md:text-2xl font-bold text-gray-800 break-all leading-tight">₩{items.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 md:p-2 bg-amber-100 text-amber-600 rounded-lg">
              <PieChart size={16} className="md:w-5 md:h-5" />
            </div>
            <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">미정산 금액</p>
          </div>
          <p className="text-lg md:text-2xl font-bold text-gray-800 break-all leading-tight">₩{items.filter(i => i.status !== '완료').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Detail List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 md:p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
          <h3 className="font-bold text-gray-700 flex items-center gap-2 text-sm md:text-base">
            <List className="w-4 h-4 md:w-5 md:h-5 text-indigo-500" />
            상세 내역 목록
          </h3>
        </div>
        
        {/* Mobile View */}
        <div className="block md:hidden divide-y divide-gray-100">
          {currentItems.map((item) => (
            <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="pr-2">
                  <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{item.date}</span>
                  <h4 className="font-bold text-gray-800 text-sm mt-1.5 leading-tight">{item.content}</h4>
                  {item.details && <p className="text-xs text-gray-500 mt-1 line-clamp-1">{item.details}</p>}
                </div>
                <div className="text-right whitespace-nowrap">
                  <div className="font-bold text-indigo-600 text-sm">₩{item.amount.toLocaleString()}</div>
                  <div className="mt-1.5 flex justify-end">
                    <button
                      onClick={() => isAdmin && onToggleStatus(item)}
                      disabled={!isAdmin}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition-all shadow-sm ${
                        item.status === '완료' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      } ${!isAdmin && 'opacity-70 cursor-not-allowed'}`}
                    >
                      <RefreshCw size={10} className={item.status === '완료' ? 'text-emerald-500' : 'text-amber-600'} />
                      {item.status}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-50">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 rounded text-indigo-700 text-[11px] font-medium">
                    <User size={10} /> {item.recipient}
                  </span>
                  {item.brief && <span className="text-[11px] font-semibold text-rose-500 bg-rose-50 px-1 rounded">{item.brief}</span>}
                </div>
                {isAdmin && (
                  <div className="flex gap-1.5">
                    {deleteConfirmId === item.id ? (
                      <div className="flex items-center gap-1 text-[10px]">
                        <span className="text-red-500 font-bold mr-1">삭제?</span>
                        <button onClick={() => {onDelete(item.id); setDeleteConfirmId(null);}} className="px-2 py-1 bg-red-100 text-red-600 rounded">예</button>
                        <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-1 bg-gray-100 text-gray-600 rounded">아니오</button>
                      </div>
                    ) : (
                      <>
                        <button onClick={() => onEditClick(item)} className="p-1.5 text-gray-400 hover:text-indigo-600 bg-gray-50 rounded"><Pencil size={14} /></button>
                        <button onClick={() => setDeleteConfirmId(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 bg-gray-50 rounded"><Trash2 size={14} /></button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {currentItems.length === 0 && <div className="p-8 text-center text-gray-400 text-sm">데이터가 없습니다.</div>}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-500 border-b">
              <tr>
                <th className="px-6 py-4 font-semibold">일자</th>
                <th className="px-6 py-4 font-semibold">내용</th>
                <th className="px-6 py-4 font-semibold">적요</th>
                <th className="px-6 py-4 font-semibold text-right">금액</th>
                <th className="px-6 py-4 font-semibold text-center">수령인</th>
                <th className="px-6 py-4 font-semibold text-center">현황</th>
                <th className="px-6 py-4 font-semibold">정산일자</th>
                {isAdmin && <th className="px-6 py-4 font-semibold text-center">관리</th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {currentItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{item.date}</td>
                  <td className="px-6 py-4 whitespace-normal min-w-[150px]">
                    <div className="font-medium text-gray-800">{item.content}</div>
                    {item.details && <div className="text-xs text-gray-400 mt-0.5">{item.details}</div>}
                  </td>
                  <td className="px-6 py-4 text-rose-500 font-medium">{item.brief}</td>
                  <td className="px-6 py-4 text-right font-bold text-indigo-600">₩{item.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-gray-600 text-xs font-medium"><User size={12} /> {item.recipient}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => isAdmin && onToggleStatus(item)}
                      disabled={!isAdmin}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
                        item.status === '완료' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                      } ${!isAdmin && 'opacity-70 cursor-not-allowed hover:bg-opacity-100'}`}
                    >
                      <RefreshCw size={12} className={item.status === '완료' ? 'text-emerald-500' : 'text-amber-600'} /> {item.status}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{item.settlementDate || '-'}</td>
                  {isAdmin && (
                    <td className="px-6 py-4 text-center">
                      {deleteConfirmId === item.id ? (
                        <div className="flex items-center justify-center gap-1 text-xs">
                          <span className="text-red-500 font-bold mr-1">삭제?</span>
                          <button onClick={() => {onDelete(item.id); setDeleteConfirmId(null);}} className="px-2 py-1 bg-red-100 text-red-600 rounded">예</button>
                          <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-1 bg-gray-100 text-gray-600 rounded">아니오</button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => onEditClick(item)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"><Pencil size={16} /></button>
                          <button onClick={() => setDeleteConfirmId(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {currentItems.length === 0 && <tr><td colSpan={isAdmin ? 8 : 7} className="px-6 py-12 text-center text-gray-400">데이터가 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {sortedItems.length > 0 && (
          <div className="px-4 md:px-6 py-3 md:py-4 border-t border-gray-50 flex flex-col md:flex-row items-center justify-between gap-3 bg-gray-50/50">
            <span className="text-xs md:text-sm text-gray-500">
              총 <span className="font-bold text-gray-900">{sortedItems.length}</span>건 
              <span className="hidden md:inline"> 중 <span className="font-bold text-gray-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> - <span className="font-bold text-gray-900">{Math.min(currentPage * ITEMS_PER_PAGE, sortedItems.length)}</span>건</span>
            </span>
            <div className="flex items-center gap-1 md:gap-2">
              <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-1.5 rounded border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed bg-white md:bg-transparent"><ChevronLeft size={16} /></button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                    return <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`w-7 h-7 md:w-8 md:h-8 rounded text-xs md:text-sm font-medium ${currentPage === pageNum ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100 bg-white md:bg-transparent'}`}>{pageNum}</button>;
                  } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                    return <span key={pageNum} className="text-gray-400 px-0.5 md:px-1 text-xs md:text-sm">...</span>;
                  } return null;
                })}
              </div>
              <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-1.5 rounded border border-gray-200 text-gray-500 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed bg-white md:bg-transparent"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Statistics Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-4">
        {/* Monthly Total */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-3 md:p-4 border-b bg-gray-50/80 font-bold flex items-center gap-2 text-sm md:text-base text-gray-700">
            <Calendar size={18} className="text-indigo-500" /> 월별 합계
          </div>
          <div className="p-0 md:p-2">
            <table className="w-full text-sm md:text-base">
              <thead>
                <tr className="text-[11px] md:text-xs text-gray-400 border-b bg-white">
                  <th className="px-4 py-2 text-left font-medium">월 (Year-Month)</th>
                  <th className="px-4 py-2 text-right font-medium">합계 금액</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {monthlyTotals.map(([month, total]) => (
                  <tr key={month} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 md:py-3 font-medium text-gray-700">{month}</td>
                    <td className="px-4 py-2.5 md:py-3 text-right font-bold text-emerald-600">₩{total.toLocaleString()}</td>
                  </tr>
                ))}
                {monthlyTotals.length === 0 && (
                  <tr><td colSpan="2" className="text-center py-4 text-xs text-gray-400">데이터가 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recipient Total */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-3 md:p-4 border-b bg-gray-50/80 font-bold flex items-center gap-2 text-sm md:text-base text-gray-700">
            <User size={18} className="text-indigo-500" /> 수령인별 합계
          </div>
          <div className="p-0 md:p-2">
            <table className="w-full text-sm md:text-base">
              <thead>
                <tr className="text-[11px] md:text-xs text-gray-400 border-b bg-white">
                  <th className="px-4 py-2 text-left font-medium">수령인</th>
                  <th className="px-4 py-2 text-right font-medium">합계 금액</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recipientTotals.map(([name, total]) => (
                  <tr key={name} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 md:py-3 font-medium flex items-center gap-2 text-gray-700">
                       <div className="w-5 h-5 md:w-6 md:h-6 bg-indigo-100 rounded-full flex items-center justify-center text-[9px] md:text-[10px] text-indigo-600 font-bold flex-shrink-0">
                        {name.substring(0,1)}
                       </div>
                       <span className="truncate max-w-[100px] md:max-w-none">{name}</span>
                    </td>
                    <td className="px-4 py-2.5 md:py-3 text-right font-bold text-indigo-600">₩{total.toLocaleString()}</td>
                  </tr>
                ))}
                {recipientTotals.length === 0 && (
                  <tr><td colSpan="2" className="text-center py-4 text-xs text-gray-400">데이터가 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewTab;
