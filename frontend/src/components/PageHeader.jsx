const PageHeader = ({
  eyebrow,
  title,
  description,
  rightContent = null,
  className = 'mb-8',
  layoutClassName = 'flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between',
}) => {
  return (
    <header className={className}>
      <div className={layoutClassName}>
        <div>
          {eyebrow && <p className="mb-2 text-xs font-black uppercase tracking-[0.3em] text-slate-500">{eyebrow}</p>}
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-10 bg-blue-600 rounded-full" />
            <h1 className="text-4xl font-black tracking-tight text-slate-950">{title}</h1>
          </div>
          {description && <p className="mt-3 max-w-2xl text-slate-600">{description}</p>}
        </div>
        {rightContent}
      </div>
    </header>
  );
};

export default PageHeader;
