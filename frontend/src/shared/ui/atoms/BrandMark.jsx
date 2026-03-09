export function BrandMark() {
    return (
        <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-[1.25rem] bg-[linear-gradient(135deg,var(--accent-strong),var(--accent-soft))] text-sm font-black uppercase tracking-[0.28em] text-slate-950 shadow-[0_20px_45px_-20px_rgba(13,148,136,0.9)]">
            <span className="relative z-10">CF</span>
            <span className="absolute inset-[2px] rounded-[1.05rem] border border-white/25"/>
        </div>
    );
}
