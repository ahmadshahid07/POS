import React, { useState } from 'react';
import { useCorbelStore, KanbanCard } from '../../store/useCorbelStore';
import {
  Calendar,
  CheckSquare,
  MessageSquare,
  Clock,
  Plus,
  MoreHorizontal,
  ChevronDown,
  Check,
  Filter,
} from 'lucide-react';

export const CorbelWorkspaceView: React.FC = () => {
  const {
    theme,
    activeProject,
    setActiveProject,
    assigneeFilter,
    setAssigneeFilter,
    kanbanCards,
    moveKanbanCard,
    setAddCardOpen,
  } = useCorbelStore();

  const isDark = theme === 'dark';

  // Filter cards by assignee if filter selected
  const filteredCards = assigneeFilter
    ? kanbanCards.filter((c) => c.assignee.initials === assigneeFilter)
    : kanbanCards;

  const todoCards = filteredCards.filter((c) => c.columnId === 'todo');
  const inProgressCards = filteredCards.filter((c) => c.columnId === 'inprogress');
  const reviewCards = filteredCards.filter((c) => c.columnId === 'review');
  const doneCards = filteredCards.filter((c) => c.columnId === 'done');

  const totalDone = kanbanCards.filter((c) => c.columnId === 'done').length;
  const totalCards = kanbanCards.length;
  const donePercent = totalCards > 0 ? Math.round((totalDone / totalCards) * 100) : 0;

  const assignees = [
    { initials: 'MR', name: 'Marcus Rivera' },
    { initials: 'JD', name: 'Jordan Doe' },
    { initials: 'AP', name: 'Alex Patel' },
    { initials: 'LT', name: 'Lucas Taylor' },
    { initials: 'PS', name: 'Priya Sharma' },
  ];

  const renderCard = (card: KanbanCard) => {
    const isCompleted = card.checklistTotal > 0 && card.checklistDone === card.checklistTotal;
    const progressPercent = card.checklistTotal > 0 ? (card.checklistDone / card.checklistTotal) * 100 : 0;

    return (
      <div
        key={card.id}
        className={`p-3.5 rounded-2xl border transition-all duration-200 group relative flex flex-col justify-between select-none ${isDark
          ? 'bg-[#181C23] border-white/5 hover:border-white/20 shadow-md text-white'
          : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-sm text-slate-900'
          }`}
      >
        {/* Card Header: Tag & Menu */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 ${isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-700'
                }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              {card.tag}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Quick Move column dropdown on hover */}
            <select
              value={card.columnId}
              onChange={(e) => moveKanbanCard(card.id, e.target.value as any)}
              className={`text-[10px] rounded px-1 py-0.5 border opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${isDark ? 'bg-slate-800 border-white/10 text-white' : 'bg-slate-100 border-slate-200 text-black'
                }`}
            >
              <option value="todo">To do</option>
              <option value="inprogress">In progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </select>

            <button
              className={`p-1 rounded-md transition-colors ${isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
                }`}
            >
              <MoreHorizontal size={13} />
            </button>
          </div>
        </div>

        {/* Card Title */}
        <h4 className={`text-xs font-semibold leading-snug mt-2 line-clamp-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {card.title}
        </h4>

        {/* Checklist Progress Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium mb-1">
            <span className="flex items-center gap-1">
              <Check size={11} className={progressPercent > 0 ? 'text-emerald-500' : ''} />
              {card.checklistDone}/{card.checklistTotal}
            </span>
          </div>
          <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <div
              className={`h-full rounded-full transition-all duration-300 ${progressPercent === 100
                ? 'bg-emerald-500'
                : progressPercent > 0
                  ? isDark ? 'bg-emerald-400' : 'bg-slate-700'
                  : 'bg-transparent'
                }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Card Footer: Assignee, Due Date, Comments */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2">
            {/* Assignee Avatar */}
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${isDark ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-800'
                }`}
              title={card.assignee.name}
            >
              {card.assignee.initials}
            </div>

            {/* Due Date Badge */}
            {card.dueUrgent ? (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/20 flex items-center gap-1">
                <Clock size={10} />
                {card.dueDate}
              </span>
            ) : (
              <span className="text-slate-400 text-[10px] flex items-center gap-1">
                <Clock size={10} />
                {card.dueDate}
              </span>
            )}
          </div>

          {/* Comments count */}
          {card.commentsCount !== undefined && (
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <MessageSquare size={11} />
              <span>{card.commentsCount}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-300">
      {/* 1. Header with Project Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className={`text-3xl font-extrabold tracking-tight font-sans ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Spring Launch
          </h1>

          {/* Project Switcher Pills */}
          <div
            className={`flex items-center p-1 rounded-full border transition-all ${isDark ? 'bg-[#15181D] border-white/10' : 'bg-slate-200/70 border-slate-300/40'
              }`}
          >
            <button
              onClick={() => setActiveProject('spring-launch')}
              className={`px-3.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${activeProject === 'spring-launch'
                ? isDark
                  ? 'bg-white text-black shadow-sm font-bold'
                  : 'bg-white text-slate-900 shadow-sm font-bold'
                : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <span>Spring Launch</span>
              <span className="text-[10px] opacity-75">6</span>
              <ChevronDown size={12} className="opacity-70" />
            </button>

            <button
              onClick={() => setActiveProject('retail-plan')}
              className={`px-3.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${activeProject === 'retail-plan'
                ? isDark
                  ? 'bg-white text-black shadow-sm font-bold'
                  : 'bg-white text-slate-900 shadow-sm font-bold'
                : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <span>Retail Plan</span>
              <span className="text-[10px] opacity-75">8</span>
            </button>
          </div>
        </div>

        {/* Live Now indicator */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${isDark
            ? 'bg-[#15181D] border-white/10 text-slate-300'
            : 'bg-white border-slate-200 text-slate-700 shadow-sm'
            }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono font-bold tracking-tight text-[11px]">1,290</span>
          <span className="text-slate-400 text-[11px]">live now</span>
        </div>
      </div>

      {/* 2. Project Overview Hero Card */}
      <div
        className={`p-5 rounded-3xl border transition-all duration-200 ${isDark
          ? 'bg-[#15181D] border-white/10 shadow-lg text-white'
          : 'bg-white border-slate-200/80 shadow-sm text-slate-900'
          }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-sm ${isDark ? 'bg-white' : 'bg-black'}`} />
              <h3 className={`text-sm font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Bath & garden collection — online and both shops
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
              <Calendar size={12} />
              <span>Due Nov 26, 2026, in 34 days</span>
              <span>•</span>
              <span>{kanbanCards.length} cards</span>
            </div>
          </div>

          {/* Center: Circular Progress Ring 25% 2 of 8 cards done */}
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90">
                <circle cx="16" cy="16" r="12" fill="none" stroke={isDark ? '#262D38' : '#E2E8F0'} strokeWidth="3" />
                <circle
                  cx="16"
                  cy="16"
                  r="12"
                  fill="none"
                  stroke={isDark ? '#FFFFFF' : '#0F172A'}
                  strokeWidth="3"
                  strokeDasharray="75"
                  strokeDashoffset={75 - (75 * donePercent) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-[8px] font-bold font-mono">{donePercent}%</span>
            </div>
            <div className="text-xs">
              <div className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {totalDone} of {totalCards}
              </div>
              <div className="text-[11px] text-slate-400">cards done</div>
            </div>
          </div>

          {/* Right: + Add card action */}
          <button
            onClick={() => setAddCardOpen(true, 'todo')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold shadow-md transition-all ${isDark
              ? 'bg-white text-black hover:bg-slate-100 font-bold'
              : 'bg-[#121316] text-white hover:bg-black font-bold'
              }`}
          >
            <Plus size={14} />
            <span>Add card</span>
          </button>
        </div>

        {/* Member Avatar Filter Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center gap-3">
          <span className="text-xs text-slate-400 font-medium">Show cards for:</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setAssigneeFilter(null)}
              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${assigneeFilter === null
                ? isDark ? 'bg-white text-black' : 'bg-slate-900 text-white'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
                }`}
            >
              All
            </button>
            {assignees.map((a) => {
              const selected = assigneeFilter === a.initials;
              return (
                <button
                  key={a.initials}
                  onClick={() => setAssigneeFilter(selected ? null : a.initials)}
                  className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center transition-all ${selected
                    ? isDark
                      ? 'bg-white text-black ring-2 ring-white/50 scale-105'
                      : 'bg-black text-white ring-2 ring-black/20 scale-105'
                    : isDark
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  title={a.name}
                >
                  {a.initials}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. 4-Column Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {/* Column 1: To do */}
        <div
          className={`p-3.5 rounded-3xl border flex flex-col gap-3 min-h-[480px] transition-colors ${isDark ? 'bg-[#12151A]/80 border-white/5' : 'bg-slate-100/60 border-slate-200/60'
            }`}
        >
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                To do
              </span>
              <span className="text-xs text-slate-400 font-mono">{todoCards.length}</span>
            </div>
            <button
              onClick={() => setAddCardOpen(true, 'todo')}
              className={`p-1 rounded-md text-slate-400 transition-colors ${isDark ? 'hover:text-white hover:bg-white/10' : 'hover:text-slate-900 hover:bg-slate-200'
                }`}
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Cards List */}
          <div className="flex flex-col gap-2.5">
            {todoCards.map(renderCard)}
          </div>

          <button
            onClick={() => setAddCardOpen(true, 'todo')}
            className={`w-full py-2 rounded-xl border border-dashed text-xs text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center gap-1.5 mt-auto ${isDark ? 'border-white/10 hover:border-white/20 hover:bg-white/5' : 'border-slate-300 hover:border-slate-400 hover:bg-white'
              }`}
          >
            <Plus size={12} />
            <span>Add card</span>
          </button>
        </div>

        {/* Column 2: In progress */}
        <div
          className={`p-3.5 rounded-3xl border flex flex-col gap-3 min-h-[480px] transition-colors ${isDark ? 'bg-[#12151A]/80 border-white/5' : 'bg-slate-100/60 border-slate-200/60'
            }`}
        >
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                In progress
              </span>
              <span className="text-xs text-slate-400 font-mono">{inProgressCards.length}</span>
            </div>
            <button
              onClick={() => setAddCardOpen(true, 'inprogress')}
              className={`p-1 rounded-md text-slate-400 transition-colors ${isDark ? 'hover:text-white hover:bg-white/10' : 'hover:text-slate-900 hover:bg-slate-200'
                }`}
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            {inProgressCards.map(renderCard)}
          </div>

          <button
            onClick={() => setAddCardOpen(true, 'inprogress')}
            className={`w-full py-2 rounded-xl border border-dashed text-xs text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center gap-1.5 mt-auto ${isDark ? 'border-white/10 hover:border-white/20 hover:bg-white/5' : 'border-slate-300 hover:border-slate-400 hover:bg-white'
              }`}
          >
            <Plus size={12} />
            <span>Add card</span>
          </button>
        </div>

        {/* Column 3: Review */}
        <div
          className={`p-3.5 rounded-3xl border flex flex-col gap-3 min-h-[480px] transition-colors ${isDark ? 'bg-[#12151A]/80 border-white/5' : 'bg-slate-100/60 border-slate-200/60'
            }`}
        >
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Review
              </span>
              <span className="text-xs text-slate-400 font-mono">{reviewCards.length}</span>
            </div>
            <button
              onClick={() => setAddCardOpen(true, 'review')}
              className={`p-1 rounded-md text-slate-400 transition-colors ${isDark ? 'hover:text-white hover:bg-white/10' : 'hover:text-slate-900 hover:bg-slate-200'
                }`}
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            {reviewCards.map(renderCard)}
          </div>

          <button
            onClick={() => setAddCardOpen(true, 'review')}
            className={`w-full py-2 rounded-xl border border-dashed text-xs text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center gap-1.5 mt-auto ${isDark ? 'border-white/10 hover:border-white/20 hover:bg-white/5' : 'border-slate-300 hover:border-slate-400 hover:bg-white'
              }`}
          >
            <Plus size={12} />
            <span>Add card</span>
          </button>
        </div>

        {/* Column 4: Done */}
        <div
          className={`p-3.5 rounded-3xl border flex flex-col gap-3 min-h-[480px] transition-colors ${isDark ? 'bg-[#12151A]/80 border-white/5' : 'bg-slate-100/60 border-slate-200/60'
            }`}
        >
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Done
              </span>
              <span className="text-xs text-slate-400 font-mono">{doneCards.length}</span>
            </div>
            <button
              onClick={() => setAddCardOpen(true, 'done')}
              className={`p-1 rounded-md text-slate-400 transition-colors ${isDark ? 'hover:text-white hover:bg-white/10' : 'hover:text-slate-900 hover:bg-slate-200'
                }`}
            >
              <Plus size={14} />
            </button>
          </div>

          <div className="flex flex-col gap-2.5">
            {doneCards.map(renderCard)}
          </div>

          <button
            onClick={() => setAddCardOpen(true, 'done')}
            className={`w-full py-2 rounded-xl border border-dashed text-xs text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all flex items-center justify-center gap-1.5 mt-auto ${isDark ? 'border-white/10 hover:border-white/20 hover:bg-white/5' : 'border-slate-300 hover:border-slate-400 hover:bg-white'
              }`}
          >
            <Plus size={12} />
            <span>Add card</span>
          </button>
        </div>
      </div>
    </div>
  );
};

