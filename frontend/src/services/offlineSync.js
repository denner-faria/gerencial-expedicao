import api from './api';

const QUEUE_KEY = '@Expedicao:offlineQueue';

export const getOfflineQueue = () => {
  const queue = localStorage.getItem(QUEUE_KEY);
  return queue ? JSON.parse(queue) : [];
};

export const addToOfflineQueue = (requestConfig) => {
  const queue = getOfflineQueue();
  queue.push({
    id: Date.now().toString(),
    ...requestConfig
  });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  
  // Dispara evento para atualizar UI
  window.dispatchEvent(new Event('offlineQueueUpdated'));
};

export const clearOfflineQueue = () => {
  localStorage.setItem(QUEUE_KEY, JSON.stringify([]));
  window.dispatchEvent(new Event('offlineQueueUpdated'));
};

export const syncOfflineQueue = async () => {
  const queue = getOfflineQueue();
  if (queue.length === 0) return;

  let hasErrors = false;
  const remainingQueue = [];

  for (const item of queue) {
    try {
      // Re-executa a requisição
      await api({
        url: item.url,
        method: item.method,
        data: item.data,
      });
    } catch (error) {
      console.error('Erro ao sincronizar item:', item, error);
      hasErrors = true;
      remainingQueue.push(item);
    }
  }

  localStorage.setItem(QUEUE_KEY, JSON.stringify(remainingQueue));
  window.dispatchEvent(new Event('offlineQueueUpdated'));
  return !hasErrors;
};
