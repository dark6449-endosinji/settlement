import React, { useState, useMemo } from 'react';
import { Banknote, PlusCircle, Trash2, Calendar, TrendingDown, TrendingUp, Wallet, Tag, LayoutGrid, Download } from 'lucide-react';
import { downloadCSV } from '../utils/csv';

const BRIEF_CATEGORIES = ['학생교육비', '교사운영비', '팀운영비', '행사비'];

const BRIEF_COLORS = {
  학생교육비: { bg: 'bg-sky-100', text: 'text-sky-700', border: 'border-sky-200', accent: 'bg-sky-500' },
  교사운영비:  { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-200', accent: 'bg-violet-500' },
  팀운영비:   { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', accent: 'bg-amber-500' },
  행사비:     { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200', accent: 'bg-rose-500' },
};

const fmt = (n) => (isNaN(Number(n)) ? '0' : Number(n).toLocaleString());

const AdvanceTab = ({ advances, settlementItems, isAdmin, onAddAdvance, onDeleteAdvance }) => {
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [brief, setBrief] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  /* ── 합계 계산 ── */
  const totalAdvance = useMemo(() => advances.reduce((a, c) => a + c.amount, 0), [advances]);
  const totalSettlement = useMemo(() => settlementItems.reduce((a, c) => a + c.amount, 0), [settlementItems]);
  const remaining = totalAdvance - totalSettlement;

  /* ── 적요별 집계 ── */
  const categoryStats = useMemo(() => {
    return BRIEF_CATEGORIES.map((cat) => {
      const advAmt = advances.filter((a) => a.brief === cat).reduce((s, a) => s + a.amount, 0);
      const settleAmt = settlementItems.filter((i) => i.brief === cat).reduce((s, i) => s + i.amount, 0);
      return { cat, advAmt, settleAmt, remaining: advAmt - settleAmt };
    });
  }, [advances, settlementItems]);

  const sortedAdvances = useMemo(
    () => [...advances].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [advances]
  );

  const handleAdd = (e) => {
    e.preventDefault();
    if (!date || !amount || !brief) return;
    onAddAdvance({ date, amount: Number(amount), brief });
    setDate('');
    setAmount('');
    setBrief('');
  };

  const handleExportCSV = () => {
    const rows = sortedAdvances.map((adv) => ({
      날짜: adv.date,
      적요: adv.brief || '',
      금액: adv.amount,
    }));
    downloadCSV(`전도금내역_${new Date().toISOString().slice(0, 10)}.csv`, rows);
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300">

      {/* ── 상단 요약 카드 3개 ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 md:p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <Wallet size={18} />
            </div>
            <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">전도금 총액</p>
          </div>
          <p className="text-xl md:text-2xl font-bold text-gray-800 break-all leading-tight">₩{fmt(totalAdvance)}</p>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 md:p-2 bg-rose-100 text-rose-600 rounded-lg">
              <TrendingUp size={18} />
            </div>
            <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">총 정산 금액</p>
          </div>
          <p className="text-xl md:text-2xl font-bold text-rose-600 break-all leading-tight">- ₩{fmt(totalSettlement)}</p>
        </div>

        <div className={`p-4 md:p-6 rounded-2xl shadow-sm border flex flex-col gap-2 ${remaining >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-2">
            <div className={`p-1.5 md:p-2 rounded-lg ${remaining >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
              <TrendingDown size={18} />
            </div>
            <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">전도금 잔여</p>
          </div>
          <p className={`text-xl md:text-2xl font-bold break-all leading-tight ${remaining >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
            ₩{Math.abs(remaining).toLocaleString()}
            {remaining < 0 && <span className="text-sm font-medium ml-1">(초과)</span>}
          </p>
        </div>
      </div>

      {/* ── 적요별 비교 카드 ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 md:p-5 border-b border-gray-50 bg-gray-50/30 flex items-center gap-2">
          <LayoutGrid size={18} className="text-indigo-500" />
          <h3 className="font-bold text-gray-700 text-sm md:text-base">적요별 현황</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-y md:divide-y-0 divide-gray-100">
          {categoryStats.map(({ cat, advAmt, settleAmt, remaining: rem }) => {
            const c = BRIEF_COLORS[cat];
            return (
              <div key={cat} className="p-4 md:p-5 flex flex-col gap-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-2 h-2 rounded-full ${c.accent}`} />
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>{cat}</span>
                </div>
                <div className="space-y-1 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>전도금</span>
                    <span className="font-semibold text-gray-700">₩{fmt(advAmt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>정산액</span>
                    <span className="font-semibold text-rose-600">- ₩{fmt(settleAmt)}</span>
                  </div>
                  <div className={`flex justify-between border-t pt-1 ${c.border}`}>
                    <span className="font-bold">잔여</span>
                    <span className={`font-bold ${rem >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      ₩{Math.abs(rem).toLocaleString()}
                      {rem < 0 && <span className="text-[10px] ml-0.5">(초과)</span>}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 전도금 신청 입력 폼 (관리자 전용) ── */}
      {isAdmin && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 md:p-5 border-b border-gray-50 bg-gray-50/30 flex items-center gap-2">
            <PlusCircle size={18} className="text-indigo-500" />
            <h3 className="font-bold text-gray-700 text-sm md:text-base">전도금 내역 추가</h3>
          </div>
          <form onSubmit={handleAdd} className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500">날짜</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500">적요</label>
              <select
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                required
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition bg-white"
              >
                <option value="">항목 선택</option>
                {BRIEF_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500">금액 (원)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="예: 500000"
                min="1"
                required
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 px-5 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-all shadow-sm text-sm"
              >
                <PlusCircle size={16} />
                추가
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── 전도금 신청 이력 목록 ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 md:p-5 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Banknote size={18} className="text-indigo-500" />
            <h3 className="font-bold text-gray-700 text-sm md:text-base">전도금 신청 내역</h3>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={sortedAdvances.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs md:text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={14} /> CSV 다운로드
          </button>
        </div>

        {/* Mobile View */}
        <div className="block md:hidden divide-y divide-gray-100">
          {sortedAdvances.map((adv) => {
            const c = BRIEF_COLORS[adv.brief] || { bg: 'bg-gray-100', text: 'text-gray-600' };
            return (
              <div key={adv.id} className="p-4 hover:bg-gray-50 transition-colors flex justify-between items-center gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 bg-indigo-50 rounded-lg flex-shrink-0">
                    <Calendar size={14} className="text-indigo-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400 font-medium">{adv.date}</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-bold text-indigo-700">₩{adv.amount.toLocaleString()}</p>
                      {adv.brief && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${c.bg} ${c.text}`}>
                          {adv.brief}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {isAdmin && (
                  deleteConfirmId === adv.id ? (
                    <div className="flex items-center gap-1 text-[10px] flex-shrink-0">
                      <span className="text-red-500 font-bold mr-1">삭제?</span>
                      <button onClick={() => { onDeleteAdvance(adv.id); setDeleteConfirmId(null); }} className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs">예</button>
                      <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">아니오</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirmId(adv.id)} className="p-1.5 text-gray-400 hover:text-red-600 bg-gray-50 rounded flex-shrink-0">
                      <Trash2 size={14} />
                    </button>
                  )
                )}
              </div>
            );
          })}
          {sortedAdvances.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">전도금 신청 이력이 없습니다.</div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 border-b">
              <tr>
                <th className="px-6 py-4 font-semibold">날짜</th>
                <th className="px-6 py-4 font-semibold">적요</th>
                <th className="px-6 py-4 font-semibold text-right">금액</th>
                {isAdmin && <th className="px-6 py-4 font-semibold text-center">관리</th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {sortedAdvances.map((adv) => {
                const c = BRIEF_COLORS[adv.brief] || { bg: 'bg-gray-100', text: 'text-gray-600' };
                return (
                  <tr key={adv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-700">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-indigo-400" />
                        {adv.date}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {adv.brief ? (
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${c.bg} ${c.text}`}>
                          <Tag size={10} />
                          {adv.brief}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-indigo-600">
                      ₩{adv.amount.toLocaleString()}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-center">
                        {deleteConfirmId === adv.id ? (
                          <div className="flex items-center justify-center gap-1 text-xs">
                            <span className="text-red-500 font-bold mr-1">삭제?</span>
                            <button onClick={() => { onDeleteAdvance(adv.id); setDeleteConfirmId(null); }} className="px-2 py-1 bg-red-100 text-red-600 rounded">예</button>
                            <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-1 bg-gray-100 text-gray-600 rounded">아니오</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteConfirmId(adv.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
              {sortedAdvances.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 4 : 3} className="px-6 py-12 text-center text-gray-400">
                    전도금 신청 이력이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
            {sortedAdvances.length > 0 && (
              <tfoot className="border-t border-gray-100 bg-gray-50/50">
                <tr>
                  <td className="px-6 py-3 font-bold text-gray-600">합계</td>
                  <td />
                  <td className="px-6 py-3 text-right font-bold text-indigo-700">₩{totalAdvance.toLocaleString()}</td>
                  {isAdmin && <td />}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdvanceTab;
