import React, { useState, useMemo, useEffect } from 'react';
import { Pencil, PlusCircle } from 'lucide-react';

const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const InputTab = ({ editingItem, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    date: getTodayDateString(),
    content: '',
    brief: '',
    details: '',
    amount: '',
    recipient: '',
    status: '대기',
    settlementDate: '',
    paymentStatus: '대기',
    paymentDate: ''
  });

  useEffect(() => {
    if (editingItem) {
      setFormData({
        date: editingItem.date,
        content: editingItem.content,
        brief: editingItem.brief || '',
        details: editingItem.details || '',
        amount: editingItem.amount.toString(),
        recipient: editingItem.recipient,
        status: editingItem.status,
        settlementDate: editingItem.settlementDate || '',
        paymentStatus: editingItem.paymentStatus || '대기',
        paymentDate: editingItem.paymentDate || ''
      });
    } else {
      setFormData({
        date: getTodayDateString(),
        content: '',
        brief: '',
        details: '',
        amount: '',
        recipient: '',
        status: '대기',
        settlementDate: '',
        paymentStatus: '대기',
        paymentDate: ''
      });
    }
  }, [editingItem]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.content || !formData.amount || !formData.recipient || !formData.brief) {
      return;
    }
    onSave({
      ...formData,
      amount: Number(formData.amount)
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm md:shadow-lg p-5 md:p-8 border border-gray-100 animate-in fade-in duration-300">
      <h2 className="text-lg md:text-xl font-semibold mb-6 flex items-center gap-2 border-b pb-4 text-gray-700">
        {editingItem ? <Pencil className="text-indigo-500 w-5 h-5" /> : <PlusCircle className="text-indigo-500 w-5 h-5" />}
        {editingItem ? '정산 내역 수정' : '정산 내역 입력'}
      </h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-600">일자 *</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full p-3 md:p-3.5 border rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none border-gray-200 bg-gray-50 focus:bg-white transition-colors"
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-600">내용 *</label>
          <input
            type="text"
            name="content"
            value={formData.content}
            onChange={handleChange}
            placeholder="예: 사무용품 구매"
            className="w-full p-3 md:p-3.5 border rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none border-gray-200 bg-gray-50 focus:bg-white transition-colors"
            required
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-600">적요 (예산 항목) *</label>
          <select
            name="brief"
            value={formData.brief}
            onChange={handleChange}
            className="w-full p-3 md:p-3.5 border rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none border-gray-200 bg-gray-50 focus:bg-white transition-colors font-medium text-gray-800"
            required
          >
            <option value="">항목을 선택하세요 (필수)</option>
            <option value="교사운영비">교사운영비</option>
            <option value="학생교육비">학생교육비</option>
            <option value="팀운영비">팀운영비</option>
            <option value="행사비">행사비</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-600">금액 *</label>
          <div className="relative">
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0"
              className="w-full p-3 md:p-3.5 pl-9 md:pl-10 border rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none border-gray-200 bg-gray-50 focus:bg-white transition-colors"
              required
            />
            <span className="absolute left-3.5 top-3.5 text-gray-400 font-medium">₩</span>
          </div>
        </div>
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-sm font-semibold text-gray-600">상세</label>
          <input
            type="text"
            name="details"
            value={formData.details}
            onChange={handleChange}
            placeholder="상세 내용을 입력하세요."
            lang="ko"
            spellCheck="false"
            className="w-full p-3 md:p-3.5 border rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none border-gray-200 bg-gray-50 focus:bg-white transition-colors"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-600">수령인 *</label>
          <input
            type="text"
            name="recipient"
            value={formData.recipient}
            onChange={handleChange}
            placeholder="이름"
            className="w-full p-3 md:p-3.5 border rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none border-gray-200 bg-gray-50 focus:bg-white transition-colors"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-600">정산현황</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full p-3 md:p-3.5 border rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none border-gray-200 bg-gray-50 focus:bg-white transition-colors"
            >
              <option value="대기">대기</option>
              <option value="진행중">진행중</option>
              <option value="완료">완료</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-600">정산일자</label>
            <input
              type="date"
              name="settlementDate"
              value={formData.settlementDate}
              onChange={handleChange}
              className="w-full p-3 md:p-3.5 border rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none border-gray-200 bg-gray-50 focus:bg-white transition-colors text-sm md:text-base"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-600">지급</label>
            <select
              name="paymentStatus"
              value={formData.paymentStatus}
              onChange={handleChange}
              className="w-full p-3 md:p-3.5 border rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none border-gray-200 bg-gray-50 focus:bg-white transition-colors"
            >
              <option value="대기">대기</option>
              <option value="지급">지급</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-600">지급일자</label>
            <input
              type="date"
              name="paymentDate"
              value={formData.paymentDate}
              onChange={handleChange}
              className="w-full p-3 md:p-3.5 border rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none border-gray-200 bg-gray-50 focus:bg-white transition-colors text-sm md:text-base"
            />
          </div>
        </div>
        <div className="md:col-span-2 pt-4 flex flex-col md:flex-row gap-3 md:gap-4">
          <button
            type="submit"
            className="flex-1 py-3.5 md:py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-md hover:shadow-indigo-200 flex items-center justify-center gap-2"
          >
            {editingItem ? '데이터 수정하기' : '데이터 저장하기'}
          </button>
          {editingItem && (
            <button
              type="button"
              onClick={onCancel}
              className="py-3.5 md:py-4 px-8 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl transition-colors"
            >
              취소
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default InputTab;
