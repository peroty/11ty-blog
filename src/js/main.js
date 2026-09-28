// Theme Switcher
document.addEventListener('DOMContentLoaded', () => {
  const themeBtns = document.querySelectorAll('.theme-btn');
  const currentTheme = localStorage.getItem('theme') || 'grasslands';
  
  // Set initial active state
  themeBtns.forEach(btn => {
    if (btn.dataset.theme === currentTheme) {
      btn.classList.add('active');
    }
    
    btn.addEventListener('click', () => {
      const theme = btn.dataset.theme;
      
      // Update DOM
      document.documentElement.setAttribute('data-theme', theme);
      
      // Save preference
      localStorage.setItem('theme', theme);
      
      // Update button states
      themeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
});
