export function PageIntro({ title, lede }: { title: string; lede?: string }) {
  return (
    <div className="bg-ink pb-14 pt-32 text-white md:pb-20 md:pt-40">
      <div className="container-x">
        <h1 className="display text-[clamp(2.4rem,1.6rem+3.6vw,4.8rem)]">{title}</h1>
        {lede ? <p className="lede mt-4 !text-white/60">{lede}</p> : null}
      </div>
    </div>
  );
}
