const svgIcon = (paths) => {
    return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
};

export const icons = {
    welcome: svgIcon('<path d="M3 10.75 12 3l9 7.75"/><path d="M5.5 10.5V21h13V10.5"/><path d="M9.5 21v-6h5v6"/>'),
    vote: svgIcon('<path d="M9 11.5 11.4 14 16 8.5"/><path d="M4 5h16v14H4z"/><path d="M8 5V3h8v2"/>'),
    eligibility: svgIcon('<path d="M12 3 5 6v5c0 4.55 2.91 8.42 7 9.8 4.09-1.38 7-5.25 7-9.8V6z"/><path d="m9 12 2 2 4-5"/>'),
    timeline: svgIcon('<path d="M7 3v4"/><path d="M17 3v4"/><path d="M4.5 8h15"/><path d="M5 5h14v16H5z"/><path d="M8 12h3"/><path d="M13 12h3"/><path d="M8 16h3"/>'),
    knowledge: svgIcon('<path d="M5 4.5h10.5A3.5 3.5 0 0 1 19 8v12.5H8.5A3.5 3.5 0 0 0 5 17z"/><path d="M5 4.5V17"/><path d="M9 8h6"/><path d="M9 12h6"/>'),
    ai: svgIcon('<path d="M8 9h8"/><path d="M9 14h.01"/><path d="M15 14h.01"/><path d="M12 4v2"/><path d="M7 6h10a3 3 0 0 1 3 3v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V9a3 3 0 0 1 3-3z"/>'),
    send: svgIcon('<path d="m4 12 16-8-5 16-3-7z"/><path d="m12 13-3 4"/>'),
    arrow: svgIcon('<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>'),
    shield: svgIcon('<path d="M12 3 5 6v5c0 4.55 2.91 8.42 7 9.8 4.09-1.38 7-5.25 7-9.8V6z"/>'),
    spark: svgIcon('<path d="M12 3v4"/><path d="M12 17v4"/><path d="M3 12h4"/><path d="M17 12h4"/><path d="m5.6 5.6 2.8 2.8"/><path d="m15.6 15.6 2.8 2.8"/><path d="m18.4 5.6-2.8 2.8"/><path d="m8.4 15.6-2.8 2.8"/>'),
    check: svgIcon('<path d="m5 13 4 4L19 7"/>'),
    speaker: svgIcon('<path d="M5 10v4"/><path d="M8 9v6"/><path d="M12 5 9 8H6v8h3l3 3z"/><path d="M16 9.5a4 4 0 0 1 0 5"/><path d="M18.5 7a7.5 7.5 0 0 1 0 10"/>')
};
