(() => {
  let theme = 'light';
  try {
    theme = localStorage.getItem('vr-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  } catch (_) {}
  document.documentElement.dataset.theme = theme === 'dark' ? 'dark' : 'light';

  document.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('#theme-toggle');
    const update = () => {
      const dark = document.documentElement.dataset.theme === 'dark';
      button.setAttribute('aria-label', dark ? 'Byt till ljust tema' : 'Byt till mörkt tema');
      button.setAttribute('aria-pressed', String(dark));
      button.textContent = dark ? '☀' : '☾';
    };
    button.addEventListener('click', () => {
      const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = theme;
      try { localStorage.setItem('vr-theme', theme); } catch (_) {}
      update();
    });
    update();
  });
})();
