export function requestNotificationPermission() {
  if ('Notification' in window) {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        console.log('Bildirishnomalar yoqildi');
      }
    });
  }
}

export function scheduleReminder(time: Date, text: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    const delay = time.getTime() - Date.now();
    if (delay > 0) {
      setTimeout(() => {
        new Notification('Dori eslatmasi', { body: text });
      }, delay);
    }
  }
}
