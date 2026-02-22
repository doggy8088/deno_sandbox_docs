const btn = document.getElementById('nav-toggle');
const sidebar = document.getElementById('sidebar');
if (btn && sidebar) {
  btn.addEventListener('click', () => {
    const open = sidebar.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  });
}
