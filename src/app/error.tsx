"use client";
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="section-page"><p className="eyebrow">Something interrupted the record</p><h1>Trajectory could not load this page.</h1><p>Nothing you entered has been intentionally discarded. Try again, or return to Today.</p><button className="quick" onClick={reset}>Try again</button></main>}
