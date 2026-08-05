const fs = require('fs');
let content = fs.readFileSync('src/components/CentroAnalisesView.tsx', 'utf8');

const replacements = [
  // 1. Make the component accept the theme prop
  { 
    regex: /export const CentroAnalisesView: React\.FC = \(\) => {/g, 
    replacement: "export const CentroAnalisesView: React.FC<{ theme?: 'light' | 'dark' }> = ({ theme = 'dark' }) => {" 
  },
  
  // 2. Backgrounds
  { regex: /bg-\[#070D19\]/g, replacement: 'bg-slate-50 dark:bg-[#070D19]' },
  { regex: /bg-\[#0B132B\]/g, replacement: 'bg-white dark:bg-[#0B132B]' },
  { regex: /bg-\[#050A18\]/g, replacement: 'bg-slate-50 dark:bg-[#050A18]' },
  { regex: /bg-\[#081023\]/g, replacement: 'bg-slate-100 dark:bg-[#081023]' },
  { regex: /bg-\[#0E1B36\]/g, replacement: 'bg-slate-200 dark:bg-[#0E1B36]' },
  { regex: /bg-\[#16223B\]/g, replacement: 'bg-cyan-600 dark:bg-[#16223B]' }, 
  { regex: /bg-\[#0F1B35\]/g, replacement: 'bg-slate-100 dark:bg-[#0F1B35]' },
  { regex: /bg-\[#091122\]/g, replacement: 'bg-white dark:bg-[#091122]' },
  { regex: /bg-\[#081020\]/g, replacement: 'bg-slate-50 dark:bg-[#081020]' },
  { regex: /bg-\[#101b2d\]/g, replacement: 'bg-slate-100 dark:bg-[#101b2d]' },
  { regex: /bg-\[#080d1a\]/g, replacement: 'bg-white dark:bg-[#080d1a]' },
  { regex: /bg-\[#09221B\]/g, replacement: 'bg-emerald-50 dark:bg-[#09221B]' },
  { regex: /bg-\[#121d2d\]/g, replacement: 'bg-slate-100 dark:bg-[#121d2d]' },
  { regex: /bg-\[#0d1624\]/g, replacement: 'bg-white dark:bg-[#0d1624]' },
  { regex: /bg-\[#16253c\]/g, replacement: 'bg-slate-100 dark:bg-[#16253c]' },
  { regex: /bg-\[#090d16\]/g, replacement: 'bg-slate-200 dark:bg-[#090d16]' },
  { regex: /bg-\[#050a18\]/g, replacement: 'bg-slate-50 dark:bg-[#050A18]' },
  { regex: /bg-\[#0f2847\]/g, replacement: 'bg-cyan-50 dark:bg-[#0f2847]' },
  { regex: /bg-\[#0a271d\]/g, replacement: 'bg-emerald-50 dark:bg-[#0a271d]' },
  { regex: /bg-\[#22103a\]/g, replacement: 'bg-purple-50 dark:bg-[#22103a]' },
  { regex: /bg-\[#381e09\]/g, replacement: 'bg-amber-50 dark:bg-[#381e09]' },
  { regex: /bg-[#0B132B]/g, replacement: 'bg-white dark:bg-[#0B132B]' }, // just in case case differs
  
  // 3. Borders
  { regex: /border-slate-800\/80/g, replacement: 'border-slate-300 dark:border-slate-800/80' },
  { regex: /border-slate-800\/40/g, replacement: 'border-slate-300 dark:border-slate-800/40' },
  { regex: /border-slate-800/g, replacement: 'border-slate-300 dark:border-slate-800' },
  { regex: /border-\[#162342\]/g, replacement: 'border-slate-300 dark:border-[#162342]' },
  { regex: /border-\[#152342\]/g, replacement: 'border-slate-300 dark:border-[#152342]' },
  { regex: /border-\[#1a2846\]/g, replacement: 'border-slate-300 dark:border-[#1a2846]' },
  { regex: /border-\[#1e2d4d\]/g, replacement: 'border-slate-300 dark:border-[#1e2d4d]' },
  { regex: /border-\[#121d36\]/g, replacement: 'border-slate-300 dark:border-[#121d36]' },
  { regex: /border-cyan-500\/60/g, replacement: 'border-cyan-600 dark:border-cyan-500/60' },
  
  // 4. Texts
  { regex: /text-slate-100/g, replacement: 'text-slate-800 dark:text-slate-100' },
  { regex: /text-slate-200/g, replacement: 'text-slate-700 dark:text-slate-200' },
  { regex: /text-slate-300/g, replacement: 'text-slate-600 dark:text-slate-300' },
  { regex: /text-slate-400/g, replacement: 'text-slate-500 dark:text-slate-400' },
  { regex: /text-slate-500/g, replacement: 'text-slate-400 dark:text-slate-500' },
  { regex: /text-white/g, replacement: 'text-white' },
];

replacements.forEach(r => {
  content = content.replace(r.regex, r.replacement);
});

// For Recharts strokes and fills, we can use the `theme` variable
// CartesianGrid stroke
content = content.replace(/stroke="#1E293B"/g, 'stroke={theme === "light" ? "#CBD5E1" : "#1E293B"}');
// Axis stroke
content = content.replace(/stroke="#94A3B8"/g, 'stroke={theme === "light" ? "#64748B" : "#94A3B8"}');
// Axis tick fill
content = content.replace(/fill: '#94A3B8'/g, 'fill: theme === "light" ? "#64748B" : "#94A3B8"');

fs.writeFileSync('src/components/CentroAnalisesView.tsx', content);
console.log('Replacements complete');
