// Service worker disabled for development — always fetch fresh content
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    regs.forEach(reg => reg.unregister());
    console.log('SW unregistered — using fresh content');
  });
}
