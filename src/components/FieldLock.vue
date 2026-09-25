<script setup>
defineProps({
  id: { type: String, required: true },
  modelValue: { type: Boolean, default: false },
});

defineEmits(["update:modelValue"]);
</script>

<template>
  <div class="form-check mt-1">
    <input
      :id="id"
      class="form-check-input"
      type="checkbox"
      :checked="modelValue"
      @change="$emit('update:modelValue', $event.target.checked)"
    />
    <label class="form-check-label small text-secondary" :for="id">
      鎖定，不讓爬蟲覆蓋
    </label>
  </div>
</template>
