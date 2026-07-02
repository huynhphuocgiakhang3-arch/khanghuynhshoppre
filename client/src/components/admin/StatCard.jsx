export default function StatCard({ icon: Icon, label, value, accent = 'ember', subtext }) {
  const accentMap = {
    ember: 'bg-ember-500/10 text-ember-400',
    gold: 'bg-gold-500/10 text-gold-500',
    green: 'bg-green-500/10 text-green-400',
    blue: 'bg-blue-500/10 text-blue-400',
  };

  return (
    <div className="rounded-2xl border border-ink-700 bg-ink-800/40 p-5">
      <div className="flex items-center justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${accentMap[accent]}`}>
          <Icon size={20} />
        </span>
      </div>
      <p className="mt-4 text-sm text-mist-400">{label}</p>
      <p className="font-display font-bold text-2xl text-mist-100 mt-1">{value}</p>
      {subtext && <p className="text-xs text-mist-500 mt-1">{subtext}</p>}
    </div>
  );
}
