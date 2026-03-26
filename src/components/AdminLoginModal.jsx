import React, { useState } from 'react';
import { LogIn, X } from 'lucide-react';
import { auth } from '../firebase/config';
import { signInWithEmailAndPassword } from 'firebase/auth';

const AdminLoginModal = ({ isOpen, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (auth) {
        await signInWithEmailAndPassword(auth, email, password);
        onSuccess();
      } else {
        setError('Firebase 초기화 오류');
      }
    } catch (err) {
      console.error(err);
      setError('로그인 실패: 이메일이나 비밀번호를 확인해주세요. (Firebase Console에서 Auth 세팅 필요)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-indigo-600 p-4 flex items-center justify-between text-white">
          <h3 className="font-bold flex items-center gap-2">
            <LogIn size={18} />
            관리자 로그인
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}
          <div className="space-y-1.5">
             <label className="text-sm font-semibold text-gray-600">이메일</label>
             <input
               type="email"
               value={email}
               onChange={(e) => setEmail(e.target.value)}
               placeholder="admin@example.com"
               className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none border-gray-200 bg-gray-50 focus:bg-white transition-colors"
               required
             />
          </div>
          <div className="space-y-1.5">
             <label className="text-sm font-semibold text-gray-600">비밀번호</label>
             <input
               type="password"
               value={password}
               onChange={(e) => setPassword(e.target.value)}
               placeholder="••••••••"
               className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-200 outline-none border-gray-200 bg-gray-50 focus:bg-white transition-colors"
               required
             />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-md disabled:opacity-70 disabled:cursor-not-allowed mt-2 flex justify-center items-center"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginModal;
