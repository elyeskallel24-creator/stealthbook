import React from 'react';
import { motion } from 'framer-motion';

export default function HeatMap({ completedDates }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const currentSunday = new Date(today);
  currentSunday.setDate(today.getDate() - today.getDay());
  
  const startDate = new Date(currentSunday);
  startDate.setDate(currentSunday.getDate() - (51 * 7));

  const weeks = [];
  const monthLabels = [];
  let lastMonth = -1;

  for (let w = 0; w < 52; w++) {
    const weekStart = new Date(startDate);
    weekStart.setDate(startDate.getDate() + (w * 7));
    
    const month = weekStart.getMonth();
    if (month !== lastMonth) {
      monthLabels.push({ 
        index: w, 
        name: weekStart.toLocaleString('default', { month: 'short' }) 
      });
      lastMonth = month;
    }

    const weekDays = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + d);
      weekDays.push(date);
    }
    weeks.push(weekDays);
  }

  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%', minWidth: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(52, 1fr)', gap: 4, paddingLeft: 24 }}>
        {monthLabels.map((m, i) => {
          const nextIdx = monthLabels[i + 1]?.index || 52;
          const span = nextIdx - m.index;
          return (
            <div key={i} style={{ gridColumn: `${m.index + 1} / span ${span}`, fontSize: 10, color: 'var(--text-2)' }}>
              {m.name}
            </div>
          );
        })}
      </div>
      
      <div style={{ display: 'flex', gap: 8, minWidth: 0 }}>
        <div style={{ display: 'grid', gridTemplateRows: 'repeat(7, 1fr)', gap: 4, fontSize: 10, color: 'var(--text-2)', width: 16, alignItems: 'center' }}>
          <div style={{ gridRow: 2 }}>Mon</div>
          <div style={{ gridRow: 4 }}>Wed</div>
          <div style={{ gridRow: 6 }}>Fri</div>
        </div>

        <div style={{ 
          flex: 1, 
          minWidth: 0,
          display: 'grid', 
          gridTemplateColumns: 'repeat(52, 1fr)', 
          gridTemplateRows: 'repeat(7, 1fr)',
          gridAutoFlow: 'column',
          gap: 4 
        }}>
          {weeks.flatMap(week => week.map(date => {
            const dateStr = formatDate(date);
            const isDone = completedDates.includes(dateStr);
            const isFuture = date > today;
            const isToday = dateStr === formatDate(today);

            return (
              <motion.div
                key={dateStr}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                title={`${dateStr}: ${isDone ? 'Done' : 'Missed'}`}
                style={{
                  aspectRatio: '1',
                  borderRadius: 3,
                  background: isFuture ? 'transparent' : (isDone ? 'var(--text-1)' : 'var(--glass)'),
                  border: isFuture ? 'none' : '1px solid var(--border)',
                  outline: isToday ? '1px solid var(--text-0)' : 'none',
                  opacity: isFuture ? 0 : 1
                }}
              />
            );
          }))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-2)', marginTop: 4 }}>
        <span>Less</span>
        <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--glass)', border: '1px solid var(--border)' }} />
        <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--glass-strong)', border: '1px solid var(--border)' }} />
        <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--text-2)', border: '1px solid var(--border)' }} />
        <div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--text-1)', border: '1px solid var(--border)' }} />
        <span>More</span>
      </div>
    </div>
  );
}
