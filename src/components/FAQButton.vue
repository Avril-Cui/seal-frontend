<template>
  <div class="faq-container">
    <button class="faq-button" @click="toggleFAQ" aria-label="Frequently Asked Questions">
      ?
    </button>

    <Transition name="fade">
      <div v-if="isOpen" class="faq-overlay" @click="toggleFAQ">
        <div class="faq-modal" @click.stop>
          <div class="faq-header">
            <h2>Frequently Asked Questions</h2>
            <button class="faq-close" @click="toggleFAQ" aria-label="Close FAQ">×</button>
          </div>
          <div class="faq-content">
            <div v-for="(faq, index) in faqs" :key="index" class="faq-item">
              <h3 class="faq-question">{{ faq.question }}</h3>
              <p class="faq-answer">{{ faq.answer }}</p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  faqs: {
    type: Array,
    required: true,
  },
});

const isOpen = ref(false);

const toggleFAQ = () => {
  isOpen.value = !isOpen.value;
};
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap");

.faq-container {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 1000;
}

.faq-button {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: var(--color-text-primary, #1a1a1a);
  color: var(--color-bg, #fefefe);
  border: none;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(26, 26, 26, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
}

.faq-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(26, 26, 26, 0.2);
}

.faq-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(26, 26, 26, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.faq-modal {
  background-color: var(--color-bg, #fefefe);
  border: 1px solid var(--color-border, #e0e0de);
  border-radius: 12px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(26, 26, 26, 0.15);
}

.faq-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border, #e0e0de);
}

.faq-header h2 {
  font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary, #1a1a1a);
  margin: 0;
}

.faq-close {
  background: none;
  border: none;
  font-size: 2rem;
  font-weight: 300;
  color: var(--color-text-secondary, #666666);
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.faq-close:hover {
  background-color: var(--color-bg-secondary, #f5f5f3);
  color: var(--color-text-primary, #1a1a1a);
}

.faq-content {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.faq-item {
  margin-bottom: 1.5rem;
}

.faq-item:last-child {
  margin-bottom: 0;
}

.faq-question {
  font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary, #1a1a1a);
  margin: 0 0 0.5rem 0;
}

.faq-answer {
  font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.6;
  color: var(--color-text-secondary, #666666);
  margin: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .faq-container {
    bottom: 1.5rem;
    right: 1.5rem;
  }

  .faq-button {
    width: 44px;
    height: 44px;
    font-size: 1.25rem;
  }

  .faq-modal {
    width: 95%;
    max-height: 85vh;
  }

  .faq-header {
    padding: 1.25rem;
  }

  .faq-header h2 {
    font-size: 1.125rem;
  }

  .faq-content {
    padding: 1.25rem;
  }
}
</style>
