import { ref, computed } from "vue";

// Color-blind friendly palette
// Using blue/purple instead of red, and orange/amber instead of green
const colorBlindPalette = {
  red: "#5a67d8", // Blue-purple (replaces red)
  green: "#d69e2e", // Orange-amber (replaces green)
};

// Default palette - matches style.css
const defaultPalette = {
  red: "#D47B7B",
  green: "#8BA888",
};

// Load from localStorage or default to false
const colorBlindMode = ref(localStorage.getItem("colorBlindMode") === "true");

// Computed palette based on mode
const palette = computed(() => {
  return colorBlindMode.value ? colorBlindPalette : defaultPalette;
});

const toggleColorBlindMode = () => {
  colorBlindMode.value = !colorBlindMode.value;
  localStorage.setItem("colorBlindMode", colorBlindMode.value.toString());
};

export function useColors() {
  return {
    colorBlindMode,
    palette,
    toggleColorBlindMode,
  };
}
