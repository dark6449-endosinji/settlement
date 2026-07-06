import React, { useState, useMemo } from 'react';
import { Wallet, Trash2, Calendar, Tag, Pencil, Save, LayoutGrid, TrendingDown, TrendingUp, Link, AlertTriangle } from 'lucide-react';

const CAT_COLORS = {
  행사비: { bg: 'bg-rose-100',    text: 'text-rose-700',    accent: 'bg-rose-500'    },
  기부금: { bg: 'bg-emerald-100', text: 'text-emerald-700', accent: 'bg-emerald-500' },
};

const fmt = (n) => (isNaN(Number(n)) ? '0' : Number(n).toLocaleString());

const CampTab = ({
  campBudget, setCampBudget,
  campCosts, settlementItems,
  isAdmin,
  onSaveCampBudget, onAddCampCost, onDeleteCampCost,
}) => {
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // 정산현황에서 행사비만 필터
  const settlementEventCosts = useMemo(
    () => (settlementItems || []).filter((i) => i.brief === '행사비'),
    [settlementItems]
  );

  // 기부금 campCost 잘못 입력된 항목 (경고용)
  const wrongCampCosts = useMemo(
    () => campCosts.filter((c) => c.category === '기부금'),
    [campCosts]
  );

  // 행사비 사용액 = 정산현황 행사비 + campCosts 행사비 합산
  // 기부금은 예산(수입)이므로 사용액 없음
  const spent = useMemo(() => ({
    행사비: settlementEventCosts.reduce((a, i) => a + i.amount, 0)
           + campCosts.filter((c) => c.category === '행사비').reduce((a, c) => a + c.amount, 0),
    기부금: 0,
  }), [settlementEventCosts, campCosts]);

  const totalBudget = useMemo(() => ['행사비', '기부금'].reduce((a, k) => a + (campBudget[k] || 0), 0), [campBudget]);
  const totalSpent  = spent.행사비;
  const totalRemain = totalBudget - totalSpent;

  // 비용 현황 목록: 행사비만 (정산현황 + campCosts 행사비), 날짜 내림차순
  const mergedList = useMemo(() => {
    const fromSettlement = settlementEventCosts.map((i) => ({
      id: i.id, date: i.date, category: '행사비',
      description: i.content || i.description || '',
      amount: i.amount, _source: 'settlement',
    }));
    const fromCamp = campCosts
      .filter((c) => c.category === '행사비')
      .map((c) => ({ ...c, _source: 'camp' }));
    return [...fromSettlement, ...fromCamp].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [settlementEventCosts, campCosts]);

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300">

      {/* ── BLOCK 1: 예산 현황 ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 md:p-5 border-b border-gray-100 bg-emerald-50/40 flex justify-between items-center">
          <h2 className="font-bold text-gray-700 flex items-center gap-2 text-sm md:text-base">
            <Wallet className="w-5 h-5 text-emerald-500" />
            예산 현황
          </h2>
          {isAdmin && (
            isEditingBudget ? (
              <button onClick={() => { onSaveCampBudget(); setIsEditingBudget(false); }}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm">
                <Save size={16} /> 저장
              </button>
            ) : (
              <button onClick={() => setIsEditingBudget(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 text-gray-600 text-sm font-bold rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
                <Pencil size={16} /> 예산 설정
              </button>
            )
          )}
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
          {[
            { label: '총 예산', value: totalBudget, color: 'text-gray-800', iconBg: 'bg-emerald-100 text-emerald-600', icon: <Wallet size={16} />, prefix: '' },
            { label: '총 사용액', value: totalSpent,  color: 'text-rose-600',  iconBg: 'bg-rose-100 text-rose-500',    icon: <TrendingUp size={16} />,  prefix: '- ' },
            { label: '잔여 예산', value: Math.abs(totalRemain), color: totalRemain >= 0 ? 'text-emerald-700' : 'text-red-600', iconBg: totalRemain >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500', icon: <TrendingDown size={16} />, suffix: totalRemain < 0 ? ' (초과)' : '' },
          ].map(({ label, value, color, iconBg, icon, prefix = '', suffix = '' }) => (
            <div key={label} className="p-4 md:p-5 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <div className={`p-1 rounded-md ${iconBg}`}>{icon}</div>
                <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wide">{label}</p>
              </div>
              <p className={`text-base md:text-xl font-bold break-all ${color}`}>{prefix}₩{fmt(value)}{suffix}</p>
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
              {['행사비', '기부금'].map((cat) => {
                const bud = campBudget[cat] || 0;
                const use = spent[cat] || 0;
                const rem = bud - use;
                const c = CAT_COLORS[cat];
                return (
                  <tr key={cat} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 md:px-6 py-3 border-r border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${c.bg} ${c.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${c.accent}`} />{cat}
                        </span>
                        {cat === '행사비' && (
                          <span className="hidden md:inline-flex items-center gap-1 text-[10px] text-indigo-500 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded-full">
                            <Link size={9} />정산현황 연동
                          </span>
                        )}
                        {cat === '기부금' && (
                          <span className="hidden md:inline text-[10px] text-gray-400">※ 수입 항목 (예산 설정으로 입력)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-3 text-right border-r border-gray-100">
                      {isEditingBudget && isAdmin ? (
                        <div className="flex justify-end items-center gap-1">
                          <span className="text-gray-400 text-xs">₩</span>
                          <input type="number" value={campBudget[cat] || 0}
                            onChange={(e) => setCampBudget((prev) => ({ ...prev, [cat]: Number(e.target.value) }))}
                            className="w-28 p-1.5 border border-emerald-300 rounded text-right text-sm focus:ring-2 focus:ring-emerald-400 outline-none bg-emerald-50" />
                        </div>
                      ) : (
                        <span className="font-medium text-gray-800">₩{fmt(bud)}</span>
                      )}
                    </td>
                    <td className="px-4 md:px-6 py-3 text-right font-medium border-r border-gray-100">
                      {cat === '기부금'
                        ? <span className="text-gray-400 text-xs">해당없음</span>
                        : <span className="text-rose-600">{use > 0 ? `- ₩${fmt(use)}` : '₩0'}</span>
                      }
                    </td>
                    <td className={`px-4 md:px-6 py-3 text-right font-bold ${cat === '기부금' ? 'text-gray-400' : rem >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                      {cat === '기부금' ? '-' : <>₩{fmt(Math.abs(rem))}{rem < 0 && <span className="text-xs font-medium ml-1">(초과)</span>}</>}
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

      {/* ── 잘못 입력된 기부금 cost 항목 경고 (관리자만) ── */}
      {isAdmin && wrongCampCosts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
          <div className="p-4 flex items-center gap-2 border-b border-amber-200">
            <AlertTriangle size={16} className="text-amber-500" />
            <p className="text-sm font-bold text-amber-700">잘못 입력된 기부금 항목 — 삭제해 주세요</p>
            <span className="text-xs text-amber-500">(기부금은 예산 설정에서 입력합니다)</span>
          </div>
          <div className="divide-y divide-amber-100">
            {wrongCampCosts.map((row) => (
              <div key={row.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar size={13} className="text-amber-400" />
                  <span className="text-gray-600 font-medium">{row.date}</span>
                  <span className="text-gray-500">{row.description || '-'}</span>
                  <span className="font-bold text-amber-700">₩{fmt(row.amount)}</span>
                </div>
                {deleteConfirmId === row.id ? (
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-red-500 font-bold">삭제?</span>
                    <button onClick={() => { onDeleteCampCost(row.id); setDeleteConfirmId(null); }} className="px-2 py-1 bg-red-100 text-red-600 rounded ml-1">예</button>
                    <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-1 bg-gray-100 text-gray-600 rounded">아니오</button>
                  </div>
                ) : (
                  <button onClick={() => setDeleteConfirmId(row.id)} className="p-1.5 text-amber-400 hover:text-red-600 hover:bg-red-50 rounded">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── BLOCK 2: 비용 현황 (행사비만) ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 md:p-5 border-b border-gray-100 bg-gray-50/30 flex items-center gap-2">
          <LayoutGrid size={18} className="text-indigo-500" />
          <h2 className="font-bold text-gray-700 text-sm md:text-base">비용 현황</h2>
          <span className="text-xs text-gray-400 ml-1">※ 정산현황의 행사비 항목이 자동 반영됩니다</span>
        </div>

        {/* Mobile */}
        <div className="block md:hidden divide-y divide-gray-100">
          {mergedList.map((row) => {
            const isSettlement = row._source === 'settlement';
            return (
              <div key={`${row._source}-${row.id}`} className={`p-4 flex justify-between items-center gap-3 ${isSettlement ? 'bg-indigo-50/20' : 'hover:bg-gray-50'} transition-colors`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-lg flex-shrink-0 ${isSettlement ? 'bg-indigo-100' : 'bg-rose-50'}`}>
                    <Calendar size={14} className={isSettlement ? 'text-indigo-500' : 'text-rose-400'} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400 font-medium">{row.date}</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-bold text-indigo-700">₩{fmt(row.amount)}</p>
                      {isSettlement && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-600">정산현황</span>}
                    </div>
                    {row.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{row.description}</p>}
                  </div>
                </div>
                {isAdmin && !isSettlement && (
                  deleteConfirmId === row.id ? (
                    <div className="flex items-center gap-1 text-[10px] flex-shrink-0">
                      <span className="text-red-500 font-bold">삭제?</span>
                      <button onClick={() => { onDeleteCampCost(row.id); setDeleteConfirmId(null); }} className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs ml-1">예</button>
                      <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">아니오</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirmId(row.id)} className="p-1.5 text-gray-400 hover:text-red-600 bg-gray-50 rounded flex-shrink-0">
                      <Trash2 size={14} />
                    </button>
                  )
                )}
              </div>
            );
          })}
          {mergedList.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">행사비 내역이 없습니다.</div>
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
                <th className="px-6 py-4 font-semibold">출처</th>
                <th className="px-6 py-4 font-semibold text-right">금액</th>
                {isAdmin && <th className="px-6 py-4 font-semibold text-center">관리</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mergedList.map((row) => {
                const isSettlement = row._source === 'settlement';
                return (
                  <tr key={`${row._source}-${row.id}`} className={`${isSettlement ? 'bg-indigo-50/20' : 'hover:bg-gray-50'} transition-colors`}>
                    <td className="px-6 py-4 font-medium text-gray-700">
                      <div className="flex items-center gap-2"><Calendar size={14} className="text-indigo-400" />{row.date}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-700">
                        <Tag size={10} />행사비
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{row.description || '-'}</td>
                    <td className="px-6 py-4">
                      {isSettlement
                        ? <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600"><Link size={10} />정산현황</span>
                        : <span className="text-xs text-gray-400">직접입력</span>
                      }
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-indigo-600">₩{fmt(row.amount)}</td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-center">
                        {isSettlement ? <span className="text-xs text-gray-300">-</span>
                          : deleteConfirmId === row.id ? (
                            <div className="flex items-center justify-center gap-1 text-xs">
                              <span className="text-red-500 font-bold mr-1">삭제?</span>
                              <button onClick={() => { onDeleteCampCost(row.id); setDeleteConfirmId(null); }} className="px-2 py-1 bg-red-100 text-red-600 rounded">예</button>
                              <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-1 bg-gray-100 text-gray-600 rounded">아니오</button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteConfirmId(row.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                              <Trash2 size={16} />
                            </button>
                          )
                        }
                      </td>
                    )}
                  </tr>
                );
              })}
              {mergedList.length === 0 && (
                <tr><td colSpan={isAdmin ? 6 : 5} className="px-6 py-12 text-center text-gray-400">행사비 내역이 없습니다.</td></tr>
              )}
            </tbody>
            {mergedList.length > 0 && (
              <tfoot className="border-t-2 border-gray-200 bg-gray-50/50">
                <tr>
                  <td className="px-6 py-3 font-bold text-gray-600">합계</td>
                  <td /><td /><td />
                  <td className="px-6 py-3 text-right font-bold text-indigo-700">₩{fmt(totalSpent)}</td>
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

export default CampTab;
