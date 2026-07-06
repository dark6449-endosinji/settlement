import React, { useState, useMemo } from 'react';
import { Tent, Wallet, PlusCircle, Trash2, Calendar, Tag, Pencil, Save, LayoutGrid, TrendingDown, TrendingUp } from 'lucide-react';

const CATEGORIES = ['행사비', '기부금'];

const CAT_COLORS = {
  행사비: { bg: 'bg-rose-100',    text: 'text-rose-700',    border: 'border-rose-200',    accent: 'bg-rose-500'    },
  기부금: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', accent: 'bg-emerald-500' },
};

const fmt = (n) => (isNaN(Number(n)) ? '0' : Number(n).toLocaleString());

const CampTab = ({
  campBudget,
  setCampBudget,
  campCosts,
  isAdmin,
  onSaveCampBudget,
  onAddCampCost,
  onDeleteCampCost,
}) => {
  // ── 예산 편집 상태 ──
  const [isEditingBudget, setIsEditingBudget] = useState(false);

  // ── 비용 입력 폼 상태 ──
  const [form, setForm] = useState({ date: '', category: '', description: '', amount: '' });
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // ── 계산 ──
  const spent = useMemo(() => {
    const s = { 행사비: 0, 기부금: 0 };
    campCosts.forEach((c) => { if (s[c.category] !== undefined) s[c.category] += c.amount; });
    return s;
  }, [campCosts]);

  const totalBudget = useMemo(() => CATEGORIES.reduce((a, k) => a + (campBudget[k] || 0), 0), [campBudget]);
  const totalSpent  = useMemo(() => campCosts.reduce((a, c) => a + c.amount, 0), [campCosts]);
  const totalRemain = totalBudget - totalSpent;

  const sortedCosts = useMemo(
    () => [...campCosts].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [campCosts]
  );

  // ── 핸들러 ──
  const handleFormChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleAddCost = (e) => {
    e.preventDefault();
    if (!form.date || !form.category || !form.amount) return;
    onAddCampCost({ ...form, amount: Number(form.amount) });
    setForm({ date: '', category: '', description: '', amount: '' });
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300">

      {/* ══════════════════════════════════
           BLOCK 1 — 예산 현황
         ══════════════════════════════════ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* 헤더 */}
        <div className="p-4 md:p-5 border-b border-gray-100 bg-emerald-50/40 flex justify-between items-center">
          <h2 className="font-bold text-gray-700 flex items-center gap-2 text-sm md:text-base">
            <Wallet className="w-5 h-5 text-emerald-500" />
            예산 현황
          </h2>
          {isAdmin && (
            isEditingBudget ? (
              <button
                onClick={() => { onSaveCampBudget(); setIsEditingBudget(false); }}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
              >
                <Save size={16} /> 저장
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

        {/* 요약 카드 3개 */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
          {[
            { label: '총 예산', value: totalBudget, color: 'text-gray-800', icon: <Wallet size={16} />, iconBg: 'bg-emerald-100 text-emerald-600' },
            { label: '총 사용액', value: totalSpent, color: 'text-rose-600', icon: <TrendingUp size={16} />, iconBg: 'bg-rose-100 text-rose-500', prefix: '- ' },
            { label: '잔여 예산', value: Math.abs(totalRemain), color: totalRemain >= 0 ? 'text-emerald-700' : 'text-red-600', icon: <TrendingDown size={16} />, iconBg: totalRemain >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500', suffix: totalRemain < 0 ? ' (초과)' : '' },
          ].map(({ label, value, color, icon, iconBg, prefix = '', suffix = '' }) => (
            <div key={label} className="p-4 md:p-5 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <div className={`p-1 rounded-md ${iconBg}`}>{icon}</div>
                <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wide">{label}</p>
              </div>
              <p className={`text-base md:text-xl font-bold break-all ${color}`}>
                {prefix}₩{fmt(value)}{suffix}
              </p>
            </div>
          ))}
        </div>

        {/* 항목별 테이블 */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
              <tr>
                <th className="px-4 md:px-6 py-3 font-bold text-left border-r border-gray-200">항목</th>
                <th className="px-4 md:px-6 py-3 font-bold text-right border-r border-gray-200">예산액</th>
                <th className="px-4 md:px-6 py-3 font-bold text-right border-r border-gray-200">사용액</th>
                <th className="px-4 md:px-6 py-3 font-bold text-right">잔여</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {CATEGORIES.map((cat) => {
                const bud = campBudget[cat] || 0;
                const use = spent[cat] || 0;
                const rem = bud - use;
                const c = CAT_COLORS[cat];
                return (
                  <tr key={cat} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 md:px-6 py-3 border-r border-gray-100">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${c.bg} ${c.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${c.accent}`} />
                        {cat}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-3 text-right border-r border-gray-100">
                      {isEditingBudget && isAdmin ? (
                        <div className="flex justify-end items-center gap-1">
                          <span className="text-gray-400 text-xs">₩</span>
                          <input
                            type="number"
                            value={campBudget[cat] || 0}
                            onChange={(e) => setCampBudget((prev) => ({ ...prev, [cat]: Number(e.target.value) }))}
                            className="w-28 p-1.5 border border-emerald-300 rounded text-right text-sm focus:ring-2 focus:ring-emerald-400 outline-none bg-emerald-50"
                          />
                        </div>
                      ) : (
                        <span className="font-medium text-gray-800">₩{fmt(bud)}</span>
                      )}
                    </td>
                    <td className="px-4 md:px-6 py-3 text-right font-medium text-rose-600 border-r border-gray-100">
                      {use > 0 ? `- ₩${fmt(use)}` : '₩0'}
                    </td>
                    <td className={`px-4 md:px-6 py-3 text-right font-bold ${rem >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                      ₩{fmt(Math.abs(rem))}{rem < 0 && <span className="text-xs font-medium ml-1">(초과)</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-yellow-50/60 border-t-2 border-gray-200">
              <tr>
                <td className="px-4 md:px-6 py-3 font-bold text-gray-700 border-r border-gray-200">합 계</td>
                <td className="px-4 md:px-6 py-3 text-right font-bold text-gray-800 border-r border-gray-200">₩{fmt(totalBudget)}</td>
                <td className="px-4 md:px-6 py-3 text-right font-bold text-rose-600 border-r border-gray-200">- ₩{fmt(totalSpent)}</td>
                <td className={`px-4 md:px-6 py-3 text-right font-bold ${totalRemain >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  ₩{fmt(Math.abs(totalRemain))}{totalRemain < 0 && <span className="text-xs ml-1">(초과)</span>}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ══════════════════════════════════
           BLOCK 2 — 비용 현황
         ══════════════════════════════════ */}
      <div className="space-y-4">

        {/* 입력 폼 (관리자 전용) */}
        {isAdmin && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 md:p-5 border-b border-gray-100 bg-indigo-50/40 flex items-center gap-2">
              <PlusCircle size={18} className="text-indigo-500" />
              <h2 className="font-bold text-gray-700 text-sm md:text-base">비용 입력</h2>
            </div>
            <form onSubmit={handleAddCost} className="p-4 md:p-6 grid grid-cols-2 md:grid-cols-5 gap-3">
              {/* 날짜 */}
              <div className="flex flex-col gap-1 col-span-1">
                <label className="text-xs font-semibold text-gray-500">날짜</label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleFormChange}
                  required
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                />
              </div>
              {/* 항목 */}
              <div className="flex flex-col gap-1 col-span-1">
                <label className="text-xs font-semibold text-gray-500">항목</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleFormChange}
                  required
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition bg-white"
                >
                  <option value="">선택</option>
                  {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              {/* 내용 */}
              <div className="flex flex-col gap-1 col-span-2 md:col-span-1">
                <label className="text-xs font-semibold text-gray-500">내용</label>
                <input
                  type="text"
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  placeholder="내용 입력"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                />
              </div>
              {/* 금액 */}
              <div className="flex flex-col gap-1 col-span-1">
                <label className="text-xs font-semibold text-gray-500">금액 (원)</label>
                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleFormChange}
                  placeholder="예: 50000"
                  min="1"
                  required
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
                />
              </div>
              {/* 추가 버튼 */}
              <div className="flex items-end col-span-1">
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

        {/* 비용 목록 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 md:p-5 border-b border-gray-100 bg-gray-50/30 flex items-center gap-2">
            <LayoutGrid size={18} className="text-indigo-500" />
            <h2 className="font-bold text-gray-700 text-sm md:text-base">비용 현황</h2>
          </div>

          {/* Mobile */}
          <div className="block md:hidden divide-y divide-gray-100">
            {sortedCosts.map((cost) => {
              const c = CAT_COLORS[cost.category] || { bg: 'bg-gray-100', text: 'text-gray-600' };
              return (
                <div key={cost.id} className="p-4 hover:bg-gray-50 transition-colors flex justify-between items-center gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-indigo-50 rounded-lg flex-shrink-0">
                      <Calendar size={14} className="text-indigo-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 font-medium">{cost.date}</p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-bold text-indigo-700">₩{fmt(cost.amount)}</p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${c.bg} ${c.text}`}>{cost.category}</span>
                      </div>
                      {cost.description && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{cost.description}</p>
                      )}
                    </div>
                  </div>
                  {isAdmin && (
                    deleteConfirmId === cost.id ? (
                      <div className="flex items-center gap-1 text-[10px] flex-shrink-0">
                        <span className="text-red-500 font-bold mr-1">삭제?</span>
                        <button onClick={() => { onDeleteCampCost(cost.id); setDeleteConfirmId(null); }} className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs">예</button>
                        <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">아니오</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirmId(cost.id)} className="p-1.5 text-gray-400 hover:text-red-600 bg-gray-50 rounded flex-shrink-0">
                        <Trash2 size={14} />
                      </button>
                    )
                  )}
                </div>
              );
            })}
            {sortedCosts.length === 0 && (
              <div className="p-8 text-center text-gray-400 text-sm">비용 내역이 없습니다.</div>
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">날짜</th>
                  <th className="px-6 py-4 font-semibold">항목</th>
                  <th className="px-6 py-4 font-semibold">내용</th>
                  <th className="px-6 py-4 font-semibold text-right">금액</th>
                  {isAdmin && <th className="px-6 py-4 font-semibold text-center">관리</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedCosts.map((cost) => {
                  const c = CAT_COLORS[cost.category] || { bg: 'bg-gray-100', text: 'text-gray-600' };
                  return (
                    <tr key={cost.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-700">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-indigo-400" />
                          {cost.date}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${c.bg} ${c.text}`}>
                          <Tag size={10} />
                          {cost.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{cost.description || '-'}</td>
                      <td className="px-6 py-4 text-right font-bold text-indigo-600">₩{fmt(cost.amount)}</td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-center">
                          {deleteConfirmId === cost.id ? (
                            <div className="flex items-center justify-center gap-1 text-xs">
                              <span className="text-red-500 font-bold mr-1">삭제?</span>
                              <button onClick={() => { onDeleteCampCost(cost.id); setDeleteConfirmId(null); }} className="px-2 py-1 bg-red-100 text-red-600 rounded">예</button>
                              <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-1 bg-gray-100 text-gray-600 rounded">아니오</button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteConfirmId(cost.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
                {sortedCosts.length === 0 && (
                  <tr>
                    <td colSpan={isAdmin ? 5 : 4} className="px-6 py-12 text-center text-gray-400">
                      비용 내역이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
              {sortedCosts.length > 0 && (
                <tfoot className="border-t-2 border-gray-200 bg-gray-50/50">
                  <tr>
                    <td className="px-6 py-3 font-bold text-gray-600">합계</td>
                    <td /><td />
                    <td className="px-6 py-3 text-right font-bold text-indigo-700">₩{fmt(totalSpent)}</td>
                    {isAdmin && <td />}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampTab;
