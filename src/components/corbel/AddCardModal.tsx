import React, { useState } from 'react';
import { useCorbelStore } from '../../store/useCorbelStore';
import { X, Plus } from 'lucide-react';

export const AddCardModal: React.FC = () => {
  const {
    theme,
    isAddCardOpen,
    setAddCardOpen,
    targetColumnForNewCard,
    addKanbanCard,
  } = useCorbelStore();

  const [title, setTitle] = useState('');
  const [tag, setTag] = useState<'copy' | 'buying' | 'store' | 'photo' | 'design' | 'ops'>('design');
  const [assigneeInitials, setAssigneeInitials] = useState('MR');
  const [dueDate, setDueDate] = useState('Due in 5 days');
  const [checklistTotal, setChecklistTotal] = useState(3);

  if (!isAddCardOpen) return null;

  const isDark = theme === 'dark';

  const assigneesMap: Record<string, string> = {
    MR: 'Marcus Rivera',
    JD: 'Jordan Doe',
    AP: 'Alex Patel',
    LT: 'Lucas Taylor',
    PS: 'Priya Sharma',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tagCapitalized = tag.charAt(0).toUpperCase() + tag.slice(1);

    addKanbanCard({
      title: title.trim(),
      tag: tagCapitalized,
      tagType: tag,
      checklistDone: 0,
      checklistTotal: Number(checklistTotal) || 1,
      assignee: {
        initials: assigneeInitials,
        name: assigneesMap[assigneeInitials] || 'User',
      },
      dueDate,
      columnId: targetColumnForNewCard,
      commentsCount: 0,
    });

    setTitle('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl transition-all duration-200 select-none ${
          isDark
            ? 'bg-[#15181D] border-white/10 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
          <h3 className="text-base font-bold tracking-tight">
            Add New Card to {targetColumnForNewCard.toUpperCase()}
          </h3>
          <button
            onClick={() => setAddCardOpen(false)}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
          <div>
            <label className="block text-xs font-semibold mb-1 text-slate-400">Card Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Hero banner photo shoot..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-3.5 py-2 rounded-xl text-xs border outline-none transition-all ${
                isDark
                  ? 'bg-slate-900 border-white/10 text-white focus:border-white/30'
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-slate-400'
              }`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-400">Department Tag</label>
              <select
                value={tag}
                onChange={(e) => setTag(e.target.value as any)}
                className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                  isDark
                    ? 'bg-slate-900 border-white/10 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              >
                <option value="design">Design</option>
                <option value="photo">Photo</option>
                <option value="copy">Copy</option>
                <option value="buying">Buying</option>
                <option value="store">Store</option>
                <option value="ops">Ops</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-400">Assignee</label>
              <select
                value={assigneeInitials}
                onChange={(e) => setAssigneeInitials(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                  isDark
                    ? 'bg-slate-900 border-white/10 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              >
                <option value="MR">MR - Marcus Rivera</option>
                <option value="JD">JD - Jordan Doe</option>
                <option value="AP">AP - Alex Patel</option>
                <option value="LT">LT - Lucas Taylor</option>
                <option value="PS">PS - Priya Sharma</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-400">Due Date</label>
              <input
                type="text"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                placeholder="Due in 5 days"
                className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                  isDark
                    ? 'bg-slate-900 border-white/10 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-400">Checklist Items</label>
              <input
                type="number"
                min="1"
                max="20"
                value={checklistTotal}
                onChange={(e) => setChecklistTotal(Number(e.target.value))}
                className={`w-full px-3 py-2 rounded-xl text-xs border outline-none ${
                  isDark
                    ? 'bg-slate-900 border-white/10 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mt-2 pt-3 border-t border-slate-100 dark:border-white/10">
            <button
              type="button"
              onClick={() => setAddCardOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-800 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                isDark ? 'bg-white text-black hover:bg-slate-200' : 'bg-slate-900 text-white hover:bg-black'
              }`}
            >
              Create Card
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

