import React, { useState, useMemo } from 'react';
import { Wallet, Trash2, Calendar, Tag, Pencil, Save, LayoutGrid, TrendingDown, TrendingUp, Link, AlertTriangle, PlusCircle, User } from 'lucide-react';

const fmt = (n) => (isNaN(Number(n)) ? '0' : Number(n).toLocaleString());

const CampTab = ({
  campBudget, setCampBudget,
  campCosts, campDonations,
  settlementItems,
  isAdmin,
  onSaveCampBudget, onAddCampCost, onDeleteCampCost,
  onAddCampDonation, onDeleteCampDonation,
}) => {
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [donationForm, setDonationForm] = useState({ date: '', donor: '', amount: '', note: '' });

  // 정산현황 행사비 항목
  const settlementEventCosts = useMemo(
    () => (settlementItems || []).filter((i) => i.brief === '행사비'),
    [settlementItems]
  );

  // 잘못 입력된 기부금 campCost 항목
  const wrongCampCosts = useMemo(() => campCosts.filter((c) => c.category === '기부금'), [campCosts]);

  // 기부금 총액 = campDonations 합산
  const totalDonation = useMemo(() => (campDonations || []).reduce((a, d) => a + d.amount, 0), [campDonations]);

  // 행사비 사용액
  const eventSpent = useMemo(() =>
    settlementEventCosts.reduce((a, i) => a + i.amount, 0)
    + campCosts.filter((c) => c.category === '행사비').reduce((a, c) => a + c.amount, 0),
    [settlementEventCosts, campCosts]
  );

  const eventBudget = campBudget['행사비'] || 0;
  const membership = campBudget['회비'] || 0;
  const totalBudget = eventBudget + membership + totalDonation;
  const totalRemain = totalBudget - eventSpent;

  // 비용 현황 목록 (행사비만)
  const mergedList = useMemo(() => {
    const fromSettlement = settlementEventCosts.map((i) => ({
      id: i.id, date: i.date, description: i.content || i.description || '',
      amount: i.amount, _source: 'settlement',
    }));
    const fromCamp = campCosts
      .filter((c) => c.category === '행사비')
      .map((c) => ({ ...c, _source: 'camp' }));
    return [...fromSettlement, ...fromCamp].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [settlementEventCosts, campCosts]);

  const sortedDonations = useMemo(
    () => [...(campDonations || [])].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [campDonations]
  );

  const handleDonationChange = (e) => setDonationForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const handleAddDonation = (e) => {
    e.preventDefault();
    if (!donationForm.date || !donationForm.amount) return;
    onAddCampDonation({ ...donationForm, amount: Number(donationForm.amount) });
    setDonationForm({ date: '', donor: '', amount: '', note: '' });
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-300">

      {/* ══ BLOCK 1: 예산 현황 ══ */}
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
                <Pencil size={16} /> 행사비 예산 설정
              </button>
            )
          )}
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
          {[
            { label: '총 예산', value: totalBudget, color: 'text-gray-800', iconBg: 'bg-emerald-100 text-emerald-600', icon: <Wallet size={16} /> },
            { label: '행사비 사용액', value: eventSpent, color: 'text-rose-600', iconBg: 'bg-rose-100 text-rose-500', icon: <TrendingUp size={16} />, prefix: '- ' },
            { label: '잔여', value: Math.abs(totalRemain), color: totalRemain >= 0 ? 'text-emerald-700' : 'text-red-600', iconBg: totalRemain >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500', icon: <TrendingDown size={16} />, suffix: totalRemain < 0 ? ' (초과)' : '' },
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

        {/* 행사비 예산 행 */}
        <div className="px-4 md:px-6 py-4 border-b border-gray-100 bg-gray-50/40">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-700">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />행사비
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-indigo-500 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded-full">
              <Link size={9} />정산현황 연동
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="bg-white rounded-xl p-3 border border-gray-100">
              <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">예산액</p>
              {isEditingBudget && isAdmin ? (
                <div className="flex items-center gap-0.5">
                  <span className="text-gray-400 text-xs">₩</span>
                  <input type="number" value={campBudget['행사비'] || 0}
                    onChange={(e) => setCampBudget((prev) => ({ ...prev, 행사비: Number(e.target.value) }))}
                    className="w-full p-1 border border-emerald-300 rounded text-right text-xs focus:ring-2 focus:ring-emerald-400 outline-none bg-emerald-50" />
                </div>
              ) : (
                <p className="font-bold text-gray-800 text-sm break-all">₩{fmt(eventBudget)}</p>
              )}
            </div>
            <div className="bg-white rounded-xl p-3 border border-gray-100">
              <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">사용액</p>
              <p className="font-bold text-rose-600 text-sm break-all">- ₩{fmt(eventSpent)}</p>
            </div>
            <div className={`rounded-xl p-3 border ${eventBudget - eventSpent >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
              <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">잔여</p>
              <p className={`font-bold text-sm break-all ${eventBudget - eventSpent >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                ₩{fmt(Math.abs(eventBudget - eventSpent))}
                {eventBudget - eventSpent < 0 && <span className="text-[10px] ml-0.5">(초과)</span>}
              </p>
            </div>
          </div>
        </div>

        {/* 회비 행 */}
        <div className="px-4 md:px-6 py-4 border-b border-gray-100 bg-gray-50/20">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />회비
            </span>
            <span className="text-[10px] text-gray-400">※ 수입 항목</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="bg-white rounded-xl p-3 border border-gray-100">
              <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">예산액</p>
              {isEditingBudget && isAdmin ? (
                <div className="flex items-center gap-0.5">
                  <span className="text-gray-400 text-xs">₩</span>
                  <input type="number" value={campBudget['회비'] || 0}
                    onChange={(e) => setCampBudget((prev) => ({ ...prev, 회비: Number(e.target.value) }))}
                    className="w-full p-1 border border-emerald-300 rounded text-right text-xs focus:ring-2 focus:ring-emerald-400 outline-none bg-emerald-50" />
                </div>
              ) : (
                <p className="font-bold text-gray-800 text-sm break-all">₩{fmt(membership)}</p>
              )}
            </div>
            <div className="bg-white rounded-xl p-3 border border-gray-100">
              <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">사용액</p>
              <p className="text-gray-400 text-xs pt-1">해당없음</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-gray-100">
              <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">잔여</p>
              <p className="text-gray-400 text-sm">-</p>
            </div>
          </div>
        </div>

        {/* 기부금 섹션 */}
        <div className="border-b border-gray-100">
          <div className="px-4 md:px-6 py-3 flex items-center justify-between bg-emerald-50/30">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />기부금
              </span>
              <span className="text-xs text-gray-400">총 ₩{fmt(totalDonation)} / {sortedDonations.length}건</span>
            </div>
          </div>

          {/* 기부금 입력 폼 (관리자) */}
          {isAdmin && (
            <form onSubmit={handleAddDonation} className="px-4 md:px-6 py-4 grid grid-cols-2 md:grid-cols-5 gap-3 border-t border-emerald-100 bg-emerald-50/20">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500">날짜</label>
                <input type="date" name="date" value={donationForm.date} onChange={handleDonationChange} required
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500">기부자</label>
                <input type="text" name="donor" value={donationForm.donor} onChange={handleDonationChange} placeholder="이름"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500">금액 (원)</label>
                <input type="number" name="amount" value={donationForm.amount} onChange={handleDonationChange} placeholder="예: 100000" min="1" required
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-500">메모</label>
                <input type="text" name="note" value={donationForm.note} onChange={handleDonationChange} placeholder="비고"
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition" />
              </div>
              <div className="flex items-end">
                <button type="submit"
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-all shadow-sm text-sm">
                  <PlusCircle size={15} />추가
                </button>
              </div>
            </form>
          )}

          {/* 기부금 목록 */}
          <div className="divide-y divide-gray-100">
            {sortedDonations.map((d) => (
              <div key={d.id} className="px-4 md:px-6 py-3 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 min-w-0 text-sm">
                  <div className="p-1.5 bg-emerald-50 rounded-lg flex-shrink-0">
                    <User size={13} className="text-emerald-500" />
                  </div>
                  <div className="flex items-center gap-3 flex-wrap min-w-0">
                    <span className="text-gray-400 text-xs font-medium flex-shrink-0">{d.date}</span>
                    <span className="font-bold text-emerald-700">₩{fmt(d.amount)}</span>
                    {d.donor && <span className="font-semibold text-gray-700">{d.donor}</span>}
                    {d.note && <span className="text-gray-400 text-xs truncate">{d.note}</span>}
                  </div>
                </div>
                {isAdmin && (
                  deleteConfirmId === d.id ? (
                    <div className="flex items-center gap-1 text-xs flex-shrink-0">
                      <span className="text-red-500 font-bold">삭제?</span>
                      <button onClick={() => { onDeleteCampDonation(d.id); setDeleteConfirmId(null); }} className="px-2 py-1 bg-red-100 text-red-600 rounded ml-1">예</button>
                      <button onClick={() => setDeleteConfirmId(null)} className="px-2 py-1 bg-gray-100 text-gray-600 rounded">아니오</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirmId(d.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded flex-shrink-0">
                      <Trash2 size={14} />
                    </button>
                  )
                )}
              </div>
            ))}
            {sortedDonations.length === 0 && (
              <div className="px-6 py-5 text-center text-gray-400 text-sm">기부금 내역이 없습니다.</div>
            )}
          </div>
        </div>
      </div>

      {/* 잘못 입력된 기부금 cost 경고 */}
      {isAdmin && wrongCampCosts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
          <div className="p-4 flex items-center gap-2 border-b border-amber-200">
            <AlertTriangle size={16} className="text-amber-500" />
            <p className="text-sm font-bold text-amber-700">잘못 입력된 기부금 항목 — 삭제해 주세요</p>
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

      {/* ══ BLOCK 2: 비용 현황 (행사비만) ══ */}
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
          {mergedList.length === 0 && <div className="p-8 text-center text-gray-400 text-sm">행사비 내역이 없습니다.</div>}
        </div>

        {/* Desktop */}
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
                  <td className="px-6 py-3 text-right font-bold text-indigo-700">₩{fmt(eventSpent)}</td>
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
